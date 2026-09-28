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

  async createTopupPayment(userId: number, amount: number, ipAddress: string) {
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

    const txnRef = this.generateTxnRef(userId);

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

  verifyReturn(params: Record<string, string>): boolean {
    return this.verifySignature(params);
  }

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

      const expectedAmountRaw = Math.round(Number(transaction.amount) * 100);

      if (expectedAmountRaw !== vnpAmountRaw) {
        return {
          RspCode: '04',
          Message: 'Invalid amount',
        };
      }

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

      if (!success) {
        transaction.status = VnpayTransactionStatus.FAIL;

        await transactionRepository.save(transaction);

        return {
          RspCode: '00',
          Message: 'Confirm Success',
        };
      }

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

      if (!wallet) {
        wallet = walletRepository.create({
          userId: transaction.userId,
          type: WalletType.MAIN,
          balance: 0,
        });

        wallet = await walletRepository.save(wallet);

        // Wallet vừa tạo thuộc transaction hiện tại,
        // nên không cần lock lại.
      }

      const existingWalletTransaction =
        await walletTransactionRepository.findOne({
          where: {
            walletId: wallet.id,
            type: WalletTransactionType.TOPUP,
            referenceId: String(transaction.id),
          },
        });

      if (!existingWalletTransaction) {
        const walletTransaction = walletTransactionRepository.create({
          walletId: wallet.id,
          amount: Number(transaction.amount),
          type: WalletTransactionType.TOPUP,
          referenceId: String(transaction.id),
          description: 'Nạp tiền qua VNPAY',
        });

        await walletTransactionRepository.save(walletTransaction);

        wallet.balance = Number(wallet.balance) + Number(transaction.amount);

        await walletRepository.save(wallet);
      }

      transaction.status = VnpayTransactionStatus.SUCCESS;

      transaction.processedToWallet = true;

      await transactionRepository.save(transaction);

      return {
        RspCode: '00',
        Message: 'Confirm Success',
      };
    });
  }

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

    const createDate = this.formatVnpDate(now);

    const expireDate = this.formatVnpDate(
      new Date(now.getTime() + 5 * 60 * 1000),
    );

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
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    const sortedParams = this.sortParams(params);

    const signData = this.stringifyParams(sortedParams);

    const secureHash = crypto
      .createHmac('sha512', hashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    return `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
  }

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
        return `${encodeURIComponent(key)}=${encodeURIComponent(value).replace(
          /%20/g,
          '+',
        )}`;
      })
      .join('&');
  }

  private generateTxnRef(userId: number): string {
    const timestamp = Date.now();

    const random = crypto.randomBytes(4).toString('hex').toUpperCase();

    return `TOPUP_${userId}_${timestamp}_${random}`;
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
