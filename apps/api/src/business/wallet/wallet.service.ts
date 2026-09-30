import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { Wallet, WalletType } from '../entities/wallet.entity.js';
import {
  WalletTransaction,
  WalletTransactionType,
} from '../entities/wallet-transaction.entity.js';
import { SystemSettingService } from '../system-setting/system-setting.service.js';
import { SystemSettingKey } from '../system-setting/system-setting.constants.js';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,

    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepository: Repository<WalletTransaction>,

    private readonly systemSettingService: SystemSettingService,
  ) {}

  /**
   * ================================================================
   * GET OR CREATE WALLET
   * ================================================================
   */
  async getOrCreateMainWallet(userId: number): Promise<Wallet> {
    return this.getOrCreateWallet(userId, WalletType.MAIN);
  }

  async getOrCreatePromotionWallet(userId: number): Promise<Wallet> {
    return this.getOrCreateWallet(userId, WalletType.PROMOTION);
  }

  private async getOrCreateWallet(
    userId: number,
    type: WalletType,
  ): Promise<Wallet> {
    await this.walletRepository
      .createQueryBuilder()
      .insert()
      .into(Wallet)
      .values({
        userId,
        type,
        balance: 0,
      })
      .orIgnore()
      .execute();

    const wallet = await this.walletRepository.findOne({
      where: {
        userId,
        type,
      },
    });

    if (!wallet) {
      throw new BadRequestException('Unable to initialize wallet');
    }

    return wallet;
  }

  /**
   * Tạo wallet theo cách an toàn trong transaction rồi lock row.
   *
   * Không dùng save() -> catch unique violation vì PostgreSQL sẽ đánh dấu
   * transaction hiện tại là aborted sau unique violation.
   */
  private async getOrCreateWalletForUpdate(
    manager: EntityManager,
    userId: number,
    type: WalletType,
  ): Promise<Wallet> {
    const repository = manager.getRepository(Wallet);

    await repository
      .createQueryBuilder()
      .insert()
      .into(Wallet)
      .values({
        userId,
        type,
        balance: 0,
      })
      .orIgnore()
      .execute();

    const wallet = await repository.findOne({
      where: {
        userId,
        type,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    if (!wallet) {
      throw new BadRequestException('Unable to initialize wallet');
    }

    return wallet;
  }

  /**
   * ================================================================
   * MY WALLET
   * ================================================================
   */
  async getMyWallet(userId: number) {
    const [mainWallet, promotionWallet] = await Promise.all([
      this.getOrCreateMainWallet(userId),
      this.getOrCreatePromotionWallet(userId),
    ]);

    const mainBalance = Number(mainWallet.balance);
    const promotionBalance = Number(promotionWallet.balance);

    return {
      main: {
        id: mainWallet.id,
        type: mainWallet.type,
        balance: mainBalance,
      },
      promotion: {
        id: promotionWallet.id,
        type: promotionWallet.type,
        balance: promotionBalance,
      },
      totalAvailableBalance: mainBalance + promotionBalance,
      createdAt: mainWallet.createdAt,
      updatedAt: mainWallet.updatedAt,
    };
  }

  async getMyTransactions(userId: number) {
    let wallets = await this.walletRepository.find({
      where: {
        userId,
      },
    });

    if (!wallets.length) {
      await this.getOrCreateMainWallet(userId);
      await this.getOrCreatePromotionWallet(userId);

      wallets = await this.walletRepository.find({
        where: {
          userId,
        },
      });
    }

    const walletIds = wallets.map((wallet) => wallet.id);

    if (!walletIds.length) {
      return [];
    }

    const items = await this.walletTransactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.wallet', 'wallet')
      .where('transaction.walletId IN (:...walletIds)', {
        walletIds,
      })
      .orderBy('transaction.createdAt', 'DESC')
      .take(100)
      .getMany();

    return items.map((item) => ({
      id: item.id,
      walletId: item.walletId,
      walletType: item.wallet?.type ?? null,
      amount: Number(item.amount),
      type: item.type,
      referenceId: item.referenceId,
      description: item.description,
      createdAt: item.createdAt,
    }));
  }

  /**
   * ================================================================
   * PROMOTION CREDIT
   * ================================================================
   *
   * Tiền thưởng Promotion Engine luôn vào PROMOTION wallet.
   */
  async creditPromotionWallet(
    manager: EntityManager,
    params: {
      userId: number;
      amount: number;
      referenceId: string;
      description?: string | null;
    },
  ) {
    const amount = Number(params.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid promotion reward amount');
    }

    const transactionRepository = manager.getRepository(WalletTransaction);
    const wallet = await this.getOrCreateWalletForUpdate(
      manager,
      params.userId,
      WalletType.PROMOTION,
    );

    const existingTransaction = await transactionRepository.findOne({
      where: {
        walletId: wallet.id,
        type: WalletTransactionType.PROMOTION_REWARD,
        referenceId: params.referenceId,
      },
    });

    if (existingTransaction) {
      return {
        credited: false,
        alreadyCredited: true,
        amount: Number(existingTransaction.amount),
        balance: Number(wallet.balance),
      };
    }

    wallet.balance = Number(wallet.balance) + amount;
    const savedWallet = await manager.getRepository(Wallet).save(wallet);

    await transactionRepository.save(
      transactionRepository.create({
        walletId: savedWallet.id,
        amount,
        type: WalletTransactionType.PROMOTION_REWARD,
        referenceId: params.referenceId,
        description:
          params.description?.trim() || 'Thưởng từ chương trình khuyến mãi',
      }),
    );

    return {
      credited: true,
      alreadyCredited: false,
      amount,
      balance: Number(savedWallet.balance),
    };
  }

  /**
   * ================================================================
   * BOOKING DISCOUNT COMPENSATION
   * ================================================================
   *
   * Khi booking COMPLETED, phần discount mà Client đã được hưởng
   * được nền tảng bù vào MAIN wallet của kỹ thuật viên.
   *
   * Đây không phải Promotion Reward của KTV nên không cộng vào
   * PROMOTION wallet.
   */
  async creditBookingDiscountCompensation(
    manager: EntityManager,
    params: {
      userId: number;
      bookingId: number;
      amount: number;
    },
  ) {
    const amount = Number(params.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException('Invalid booking discount compensation');
    }

    if (amount === 0) {
      return {
        credited: false,
        alreadyCredited: false,
        amount: 0,
        balance: null,
      };
    }

    const wallet = await this.getOrCreateWalletForUpdate(
      manager,
      params.userId,
      WalletType.MAIN,
    );

    const transactionRepository = manager.getRepository(WalletTransaction);
    const referenceId = `booking:${params.bookingId}`;

    const existingTransaction = await transactionRepository.findOne({
      where: {
        walletId: wallet.id,
        type: WalletTransactionType.BOOKING_DISCOUNT_COMPENSATION,
        referenceId,
      },
    });

    if (existingTransaction) {
      return {
        credited: false,
        alreadyCredited: true,
        amount: Number(existingTransaction.amount),
        balance: Number(wallet.balance),
      };
    }

    wallet.balance = Number(wallet.balance) + amount;
    const savedWallet = await manager.getRepository(Wallet).save(wallet);

    await transactionRepository.save(
      transactionRepository.create({
        walletId: savedWallet.id,
        amount,
        type: WalletTransactionType.BOOKING_DISCOUNT_COMPENSATION,
        referenceId,
        description: `Bù khuyến mãi cho booking #${params.bookingId}`,
      }),
    );

    return {
      credited: true,
      alreadyCredited: false,
      amount,
      balance: Number(savedWallet.balance),
    };
  }

  /**
   * ================================================================
   * CHARGE THERAPIST BOOKING ACCEPT FEE
   * ================================================================
   *
   * Thứ tự trừ:
   * 1. PROMOTION
   * 2. MAIN
   *
   * Tổng tiền = THERAPIST_BOOKING_ACCEPT_FEE + booking.platformFee.
   */
  async chargeTherapistBookingAcceptFee(
    manager: EntityManager,
    userId: number,
    bookingId: number,
    platformFee: number,
  ) {
    const bookingAcceptFee = await this.systemSettingService.getNumber(
      SystemSettingKey.THERAPIST_BOOKING_ACCEPT_FEE,
      manager,
    );

    if (!Number.isFinite(bookingAcceptFee) || bookingAcceptFee < 0) {
      throw new BadRequestException(
        'Invalid therapist booking accept fee configuration',
      );
    }

    const bookingPlatformFee = Number(platformFee);

    if (!Number.isFinite(bookingPlatformFee) || bookingPlatformFee < 0) {
      throw new BadRequestException('Invalid booking platform fee');
    }

    const requiredAmount = bookingAcceptFee + bookingPlatformFee;
    const transactionRepository = manager.getRepository(WalletTransaction);
    const referenceId = `booking:${bookingId}`;

    const existingTransactions = await transactionRepository.find({
      where: {
        type: WalletTransactionType.PAYMENT,
        referenceId,
      },
      relations: {
        wallet: true,
      },
    });

    const userExistingTransactions = existingTransactions.filter(
      (item) => item.wallet?.userId === userId,
    );

    if (userExistingTransactions.length) {
      return {
        charged: false,
        alreadyCharged: true,
        amount: userExistingTransactions.reduce(
          (sum, item) => sum + Math.abs(Number(item.amount)),
          0,
        ),
        bookingAcceptFee,
        platformFee: bookingPlatformFee,
      };
    }

    /**
     * Luôn lock theo PROMOTION -> MAIN để giữ thứ tự cố định.
     */
    let promotionWallet = await this.getOrCreateWalletForUpdate(
      manager,
      userId,
      WalletType.PROMOTION,
    );

    let mainWallet = await this.getOrCreateWalletForUpdate(
      manager,
      userId,
      WalletType.MAIN,
    );

    const promotionBalance = Number(promotionWallet.balance);
    const mainBalance = Number(mainWallet.balance);
    const totalBalance = promotionBalance + mainBalance;

    if (totalBalance < requiredAmount) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_WALLET_BALANCE',
        message:
          'Số dư ví không đủ để chấp nhận booking. Vui lòng nạp thêm tiền.',
        requiredAmount,
        currentBalance: totalBalance,
        mainBalance,
        promotionBalance,
        bookingAcceptFee,
        platformFee: bookingPlatformFee,
      });
    }

    const promotionCharge = Math.min(promotionBalance, requiredAmount);
    const mainCharge = requiredAmount - promotionCharge;

    if (promotionCharge > 0) {
      promotionWallet.balance = promotionBalance - promotionCharge;
      promotionWallet = await manager
        .getRepository(Wallet)
        .save(promotionWallet);

      await transactionRepository.save(
        transactionRepository.create({
          walletId: promotionWallet.id,
          amount: -promotionCharge,
          type: WalletTransactionType.PAYMENT,
          referenceId,
          description: `Thanh toán phí booking #${bookingId} từ ví khuyến mãi`,
        }),
      );
    }

    if (mainCharge > 0) {
      mainWallet.balance = mainBalance - mainCharge;
      mainWallet = await manager.getRepository(Wallet).save(mainWallet);

      await transactionRepository.save(
        transactionRepository.create({
          walletId: mainWallet.id,
          amount: -mainCharge,
          type: WalletTransactionType.PAYMENT,
          referenceId,
          description: `Thanh toán phí booking #${bookingId} từ ví chính`,
        }),
      );
    }

    return {
      charged: true,
      alreadyCharged: false,
      amount: requiredAmount,
      promotionCharged: promotionCharge,
      mainCharged: mainCharge,
      mainBalance: Number(mainWallet.balance),
      promotionBalance: Number(promotionWallet.balance),
      totalBalance:
        Number(mainWallet.balance) + Number(promotionWallet.balance),
      bookingAcceptFee,
      platformFee: bookingPlatformFee,
    };
  }
}
