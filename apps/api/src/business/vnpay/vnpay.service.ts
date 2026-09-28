import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import * as crypto from 'node:crypto';

import { DataSource, Repository } from 'typeorm';

import {
  VnpayTransaction,
  VnpayTransactionStatus,
} from '../entities/vnpay-transaction.entity.js';

import { Wallet, WalletType } from '../entities/wallet.entity.js';

import {
  WalletTransaction,
  WalletTransactionType,
} from '../entities/wallet-transaction.entity.js';

import { User } from '../entities/user.entity.js';

import { PaymentClient } from '../wallet/dto/create-wallet-topup.dto.js';

type VnpIpnResponse = {
  RspCode: '00' | '01' | '02' | '04' | '97';
  Message: string;
};

@Injectable()
export class VnpayService {
  constructor(
    @InjectRepository(VnpayTransaction)
    private readonly vnpayTransactionRepository: Repository<VnpayTransaction>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly configService: ConfigService,
  ) {}

  // =========================================================
  // CREATE TOPUP
  // =========================================================

  async createTopupPayment(
    userId: number,
    amount: number,
    client: PaymentClient,
    ipAddress: string,
  ) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (!Number.isInteger(amount) || amount < 10_000) {
      throw new BadRequestException('Số tiền nạp tối thiểu là 10.000đ');
    }

    if (amount > 100_000_000) {
      throw new BadRequestException('Số tiền nạp tối đa là 100.000.000đ');
    }

    const txnRef = this.generateTxnRef(userId, client);

    const transaction = this.vnpayTransactionRepository.create({
      userId,
      txnRef,
      amount,
      status: VnpayTransactionStatus.PENDING,
      processedToWallet: false,
    });

    const savedTransaction =
      await this.vnpayTransactionRepository.save(transaction);

    const paymentUrl = this.buildPaymentUrl({
      txnRef,
      amount,
      ipAddress,
    });

    return {
      transactionId: savedTransaction.id,

      txnRef,

      amount,

      paymentUrl,
    };
  }

  // =========================================================
  // RETURN
  // =========================================================

  verifyReturn(params: Record<string, string>): boolean {
    return this.verifySignature(params);
  }

  buildReturnRedirectUrl(query: Record<string, string>): string {
    const valid = this.verifyReturn(query);

    const responseCode = query['vnp_ResponseCode'];

    const transactionStatus = query['vnp_TransactionStatus'];

    const txnRef = query['vnp_TxnRef'] ?? '';

    const returnSuccess =
      valid && responseCode === '00' && transactionStatus === '00';

    const client = this.extractPaymentClient(txnRef);

    /*
     * Đây chỉ là kết quả RETURN từ VNPAY.
     *
     * Frontend KHÔNG được dùng status này
     * để tự cộng tiền hoặc coi đây là trạng
     * thái cuối cùng.
     *
     * Frontend sẽ gọi payment-status để
     * lấy trạng thái thật từ DB.
     */
    const returnStatus = returnSuccess ? 'success' : 'failed';

    if (client === PaymentClient.MOBILE) {
      const mobileDeepLink =
        this.configService.get<string>('MOBILE_DEEP_LINK') ??
        'inhome-massage://';

      const base = mobileDeepLink.endsWith('/')
        ? mobileDeepLink
        : `${mobileDeepLink}/`;

      return (
        `${base}payment-result` +
        `?txnRef=${encodeURIComponent(txnRef)}` +
        `&returnStatus=${returnStatus}`
      );
    }

    const webUrl = this.configService.get<string>('WEB_URL');

    if (!webUrl) {
      throw new Error('WEB_URL chưa được cấu hình');
    }

    const baseWebUrl = webUrl.endsWith('/') ? webUrl.slice(0, -1) : webUrl;

    return (
      `${baseWebUrl}` +
      `/therapist/wallet/payment-result` +
      `?txnRef=${encodeURIComponent(txnRef)}` +
      `&returnStatus=${returnStatus}`
    );
  }

  // =========================================================
  // PAYMENT STATUS
  // =========================================================

  async getPaymentStatus(userId: number, txnRef: string) {
    const transaction = await this.vnpayTransactionRepository.findOne({
      where: {
        txnRef,
        userId,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }

    return {
      transactionId: transaction.id,

      txnRef: transaction.txnRef,

      amount: Number(transaction.amount),

      status: transaction.status,

      processedToWallet: transaction.processedToWallet,

      bankCode: transaction.bankCode,

      vnpTransactionNo: transaction.vnpTransactionNo,

      createdAt: transaction.createdAt,
    };
  }

  // =========================================================
  // IPN
  // =========================================================

  async handleIpn(params: Record<string, string>): Promise<VnpIpnResponse> {
    if (!this.verifySignature(params)) {
      return {
        RspCode: '97',
        Message: 'Invalid Checksum',
      };
    }

    const txnRef = params['vnp_TxnRef'];

    if (!txnRef) {
      return {
        RspCode: '01',
        Message: 'Order Not Found',
      };
    }

    const vnpAmountRaw = Number(params['vnp_Amount'] ?? 0);

    if (!Number.isFinite(vnpAmountRaw)) {
      return {
        RspCode: '04',
        Message: 'Invalid amount',
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const transactionRepository = manager.getRepository(VnpayTransaction);

      const walletRepository = manager.getRepository(Wallet);

      const walletTransactionRepository =
        manager.getRepository(WalletTransaction);

      // -----------------------------------------
      // LOCK VNPAY TRANSACTION
      // -----------------------------------------

      const transaction = await transactionRepository
        .createQueryBuilder('transaction')
        .setLock('pessimistic_write')
        .where('transaction.txn_ref = :txnRef', {
          txnRef,
        })
        .getOne();

      if (!transaction) {
        return {
          RspCode: '01',
          Message: 'Order Not Found',
        };
      }

      // -----------------------------------------
      // VERIFY AMOUNT
      // -----------------------------------------

      const expectedAmountRaw = Math.round(Number(transaction.amount) * 100);

      if (expectedAmountRaw !== vnpAmountRaw) {
        return {
          RspCode: '04',
          Message: 'Invalid amount',
        };
      }

      // -----------------------------------------
      // IDEMPOTENCY
      // -----------------------------------------

      if (transaction.status !== VnpayTransactionStatus.PENDING) {
        return {
          RspCode: '02',
          Message: 'Order already confirmed',
        };
      }

      const responseCode = params['vnp_ResponseCode'];

      const transactionStatus = params['vnp_TransactionStatus'];

      const success = responseCode === '00' && transactionStatus === '00';

      transaction.bankCode = params['vnp_BankCode'] ?? null;

      transaction.vnpTransactionNo = params['vnp_TransactionNo'] ?? null;

      transaction.vnpResponseCode = responseCode ?? null;

      // -----------------------------------------
      // FAILED PAYMENT
      // -----------------------------------------

      if (!success) {
        transaction.status = VnpayTransactionStatus.FAIL;

        await transactionRepository.save(transaction);

        return {
          RspCode: '00',
          Message: 'Confirm Success',
        };
      }

      // -----------------------------------------
      // FIND + LOCK WALLET
      // -----------------------------------------

      let wallet = await walletRepository
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .where('wallet.user_id = :userId', {
          userId: transaction.userId,
        })
        .andWhere('wallet.type = :type', {
          type: WalletType.MAIN,
        })
        .getOne();

      // -----------------------------------------
      // CREATE WALLET IF NOT EXISTS
      // -----------------------------------------

      if (!wallet) {
        wallet = walletRepository.create({
          userId: transaction.userId,

          type: WalletType.MAIN,

          balance: 0,
        });

        wallet = await walletRepository.save(wallet);
      }

      // -----------------------------------------
      // CHECK WALLET TRANSACTION
      // -----------------------------------------

      const existingWalletTransaction =
        await walletTransactionRepository.findOne({
          where: {
            walletId: wallet.id,

            type: WalletTransactionType.TOPUP,

            referenceId: String(transaction.id),
          },
        });

      // -----------------------------------------
      // CREDIT WALLET
      // -----------------------------------------

      if (!existingWalletTransaction) {
        const amount = Number(transaction.amount);

        const walletTransaction = walletTransactionRepository.create({
          walletId: wallet.id,

          amount,

          type: WalletTransactionType.TOPUP,

          referenceId: String(transaction.id),

          description: 'Nạp tiền qua VNPAY',
        });

        await walletTransactionRepository.save(walletTransaction);

        wallet.balance = Number(wallet.balance) + amount;

        await walletRepository.save(wallet);
      }

      // -----------------------------------------
      // MARK VNPAY TRANSACTION SUCCESS
      // -----------------------------------------

      transaction.status = VnpayTransactionStatus.SUCCESS;

      transaction.processedToWallet = true;

      await transactionRepository.save(transaction);

      return {
        RspCode: '00',
        Message: 'Confirm Success',
      };
    });
  }

  // =========================================================
  // PAYMENT URL
  // =========================================================

  private buildPaymentUrl(input: {
    txnRef: string;
    amount: number;
    ipAddress: string;
  }): string {
    const tmnCode = this.configService.get<string>('VNP_TMNCODE') ?? '';

    const hashSecret = this.configService.get<string>('VNP_HASHSECRET') ?? '';

    const vnpUrl = this.configService.get<string>('VNP_URL') ?? '';

    const returnUrl = this.configService.get<string>('VNP_RETURNURL') ?? '';

    if (!tmnCode || !hashSecret || !vnpUrl || !returnUrl) {
      throw new BadRequestException('VNPAY chưa được cấu hình đầy đủ');
    }

    const now = new Date();

    const expireDate = new Date(now.getTime() + 5 * 60 * 1000);

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',

      vnp_Command: 'pay',

      vnp_TmnCode: tmnCode,

      vnp_Locale: 'vn',

      vnp_CurrCode: 'VND',

      vnp_TxnRef: input.txnRef,

      vnp_OrderInfo: `Nap tien vi ${input.txnRef}`,

      vnp_OrderType: 'other',

      vnp_Amount: String(Math.round(input.amount * 100)),

      vnp_ReturnUrl: returnUrl,

      vnp_IpAddr: this.normalizeIp(input.ipAddress),

      vnp_CreateDate: this.formatVnpDate(now),

      vnp_ExpireDate: this.formatVnpDate(expireDate),
    };

    const sortedParams = this.sortParams(params);

    const signData = this.stringifyParams(sortedParams);

    const secureHash = crypto
      .createHmac('sha512', hashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    return `${vnpUrl}?` + `${signData}` + `&vnp_SecureHash=${secureHash}`;
  }

  // =========================================================
  // VERIFY SIGNATURE
  // =========================================================

  private verifySignature(params: Record<string, string>): boolean {
    const secureHash = params['vnp_SecureHash'];

    if (!secureHash) {
      return false;
    }

    const hashSecret = this.configService.get<string>('VNP_HASHSECRET') ?? '';

    if (!hashSecret) {
      return false;
    }

    const cloned: Record<string, string> = {
      ...params,
    };

    delete cloned['vnp_SecureHash'];

    delete cloned['vnp_SecureHashType'];

    const sorted = this.sortParams(cloned);

    const signData = this.stringifyParams(sorted);

    const calculatedHash = crypto
      .createHmac('sha512', hashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    return calculatedHash.toLowerCase() === secureHash.toLowerCase();
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private generateTxnRef(userId: number, client: PaymentClient): string {
    const timestamp = Date.now();

    const random = crypto.randomBytes(4).toString('hex').toUpperCase();

    const clientCode = client === PaymentClient.MOBILE ? 'MOBILE' : 'WEB';

    return (
      `TOPUP_` + `${clientCode}_` + `${userId}_` + `${timestamp}_` + `${random}`
    );
  }

  private extractPaymentClient(txnRef: string): PaymentClient {
    const parts = txnRef.split('_');

    if (parts[1] === 'MOBILE') {
      return PaymentClient.MOBILE;
    }

    return PaymentClient.WEB;
  }

  private sortParams(params: Record<string, string>): Record<string, string> {
    return Object.keys(params)
      .sort()
      .reduce<Record<string, string>>((result, key) => {
        result[key] = params[key] ?? '';

        return result;
      }, {});
  }

  private stringifyParams(params: Record<string, string>): string {
    return Object.entries(params)
      .map(([key, value]) => {
        return (
          `${encodeURIComponent(key)}=` +
          `${encodeURIComponent(value).replace(/%20/g, '+')}`
        );
      })
      .join('&');
  }

  private normalizeIp(ip: string): string {
    if (!ip) {
      return '127.0.0.1';
    }

    const firstIp = ip.split(',')[0]?.trim() ?? ip;

    if (firstIp.startsWith('::ffff:')) {
      return firstIp.substring(7);
    }

    if (firstIp === '::1') {
      return '127.0.0.1';
    }

    return firstIp;
  }

  private formatVnpDate(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',

      year: 'numeric',
      month: '2-digit',
      day: '2-digit',

      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',

      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);

    const get = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '';

    return [
      get('year'),
      get('month'),
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    ].join('');
  }
}
