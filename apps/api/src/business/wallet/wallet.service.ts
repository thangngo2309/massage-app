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
    let wallet = await this.walletRepository.findOne({
      where: {
        userId,
        type,
      },
    });

    if (wallet) {
      return wallet;
    }

    wallet = this.walletRepository.create({
      userId,
      type,
      balance: 0,
    });

    try {
      return await this.walletRepository.save(wallet);
    } catch (error) {
      const existingWallet = await this.walletRepository.findOne({
        where: {
          userId,
          type,
        },
      });

      if (existingWallet) {
        return existingWallet;
      }

      throw error;
    }
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
    const wallets = await this.walletRepository.find({
      where: {
        userId,
      },
    });

    if (!wallets.length) {
      await this.getOrCreateMainWallet(userId);
      await this.getOrCreatePromotionWallet(userId);
    }

    const currentWallets = wallets.length
      ? wallets
      : await this.walletRepository.find({
          where: {
            userId,
          },
        });

    const walletIds = currentWallets.map((wallet) => wallet.id);

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
   * Cộng tiền thưởng vào PROMOTION wallet.
   *
   * Hàm này phải được gọi trong transaction của nghiệp vụ bên ngoài.
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

    const walletRepository = manager.getRepository(Wallet);

    const transactionRepository = manager.getRepository(WalletTransaction);

    /**
     * Idempotency transaction.
     */
    const existingTransaction = await transactionRepository.findOne({
      where: {
        type: WalletTransactionType.PROMOTION_REWARD,
        referenceId: params.referenceId,
      },
    });

    if (existingTransaction) {
      const existingWallet = await walletRepository.findOne({
        where: {
          id: existingTransaction.walletId,
        },
      });

      return {
        credited: false,
        alreadyCredited: true,
        amount: Number(existingTransaction.amount),
        balance: existingWallet ? Number(existingWallet.balance) : null,
      };
    }

    /**
     * Tìm wallet trước.
     */
    let wallet = await walletRepository.findOne({
      where: {
        userId: params.userId,
        type: WalletType.PROMOTION,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    /**
     * Chưa có thì tạo.
     */
    if (!wallet) {
      try {
        wallet = await walletRepository.save(
          walletRepository.create({
            userId: params.userId,
            type: WalletType.PROMOTION,
            balance: 0,
          }),
        );
      } catch (error) {
        wallet = await walletRepository.findOne({
          where: {
            userId: params.userId,
            type: WalletType.PROMOTION,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!wallet) {
          throw error;
        }
      }
    }

    const balanceBefore = Number(wallet.balance);

    wallet.balance = balanceBefore + amount;

    wallet = await walletRepository.save(wallet);

    await transactionRepository.save(
      transactionRepository.create({
        walletId: wallet.id,
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
      balance: Number(wallet.balance),
    };
  }

  /**
   * ================================================================
   * CHARGE THERAPIST BOOKING ACCEPT FEE
   * ================================================================
   *
   * Thứ tự trừ:
   *
   * 1. PROMOTION
   * 2. MAIN
   *
   * Tổng tiền:
   *
   * THERAPIST_BOOKING_ACCEPT_FEE
   * +
   * booking.platformFee
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

    const walletRepository = manager.getRepository(Wallet);

    const transactionRepository = manager.getRepository(WalletTransaction);

    const referenceId = `booking:${bookingId}`;

    /**
     * ==============================================================
     * IDEMPOTENCY
     * ==============================================================
     *
     * Có thể có:
     *
     * booking:123
     *   PROMOTION -30.000
     *   MAIN      -80.000
     *
     * Chỉ cần đã tồn tại PAYMENT với reference này
     * thì booking đã được charge.
     */

    const existingTransactions = await transactionRepository.find({
      where: {
        type: WalletTransactionType.PAYMENT,
        referenceId,
      },
    });

    if (existingTransactions.length) {
      return {
        charged: false,
        alreadyCharged: true,

        amount: existingTransactions.reduce(
          (sum, item) => sum + Math.abs(Number(item.amount)),
          0,
        ),

        bookingAcceptFee,
        platformFee: bookingPlatformFee,
      };
    }

    /**
     * Lock theo thứ tự cố định:
     *
     * PROMOTION -> MAIN
     *
     * để giảm nguy cơ deadlock.
     */

    let promotionWallet = await walletRepository.findOne({
      where: {
        userId,
        type: WalletType.PROMOTION,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    let mainWallet = await walletRepository.findOne({
      where: {
        userId,
        type: WalletType.MAIN,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    /**
     * MAIN wallet bình thường đã được tạo khi nạp tiền.
     *
     * Nếu chưa có thì balance = 0.
     */
    if (!mainWallet) {
      mainWallet = await walletRepository.save(
        walletRepository.create({
          userId,
          type: WalletType.MAIN,
          balance: 0,
        }),
      );
    }

    /**
     * PROMOTION wallet chưa có cũng xem như 0.
     */
    if (!promotionWallet) {
      promotionWallet = await walletRepository.save(
        walletRepository.create({
          userId,
          type: WalletType.PROMOTION,
          balance: 0,
        }),
      );
    }

    const promotionBalance = Number(promotionWallet.balance);

    const mainBalance = Number(mainWallet.balance);

    const totalBalance = promotionBalance + mainBalance;

    /**
     * Phải kiểm tra tổng trước khi trừ.
     *
     * Không được trừ promotion trước rồi mới phát hiện MAIN thiếu.
     */
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

    /**
     * ==============================================================
     * PROMOTION FIRST
     * ==============================================================
     */

    const promotionCharge = Math.min(promotionBalance, requiredAmount);

    const remainingAfterPromotion = requiredAmount - promotionCharge;

    const mainCharge = remainingAfterPromotion;

    /**
     * ==============================================================
     * PROMOTION WALLET
     * ==============================================================
     */

    if (promotionCharge > 0) {
      promotionWallet.balance = promotionBalance - promotionCharge;

      promotionWallet = await walletRepository.save(promotionWallet);

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

    /**
     * ==============================================================
     * MAIN WALLET
     * ==============================================================
     */

    if (mainCharge > 0) {
      mainWallet.balance = mainBalance - mainCharge;

      mainWallet = await walletRepository.save(mainWallet);

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
