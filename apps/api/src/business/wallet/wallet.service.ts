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

  async getOrCreateMainWallet(userId: number): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({
      where: {
        userId,
        type: WalletType.MAIN,
      },
    });

    if (wallet) {
      return wallet;
    }

    wallet = this.walletRepository.create({
      userId,
      type: WalletType.MAIN,
      balance: 0,
    });

    try {
      return await this.walletRepository.save(wallet);
    } catch (error) {
      /**
       * Trường hợp 2 request đồng thời
       * cùng tạo wallet.
       */
      const existingWallet = await this.walletRepository.findOne({
        where: {
          userId,
          type: WalletType.MAIN,
        },
      });

      if (existingWallet) {
        return existingWallet;
      }

      throw error;
    }
  }

  async getMyWallet(userId: number) {
    const wallet = await this.getOrCreateMainWallet(userId);

    return {
      id: wallet.id,
      type: wallet.type,
      balance: Number(wallet.balance),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  async getMyTransactions(userId: number) {
    const wallet = await this.getOrCreateMainWallet(userId);

    const items = await this.walletTransactionRepository.find({
      where: {
        walletId: wallet.id,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 100,
    });

    return items.map((item) => ({
      id: item.id,
      amount: Number(item.amount),
      type: item.type,
      referenceId: item.referenceId,
      description: item.description,
      createdAt: item.createdAt,
    }));
  }

  /**
   * ================================================================
   * CHARGE THERAPIST BOOKING ACCEPT FEE
   * ================================================================
   *
   * Phải được gọi bên trong transaction
   * xử lý therapist accept booking.
   *
   * Không mở transaction mới tại đây.
   */
  async chargeTherapistBookingAcceptFee(
    manager: EntityManager,
    userId: number,
    bookingId: number,
  ) {
    /**
     * ==============================================================
     * GET CURRENT SYSTEM FEE
     * ==============================================================
     */

    const requiredAmount = await this.systemSettingService.getNumber(
      SystemSettingKey.THERAPIST_BOOKING_ACCEPT_FEE,
      manager,
    );

    if (!Number.isFinite(requiredAmount) || requiredAmount < 0) {
      throw new BadRequestException(
        'Invalid therapist booking accept fee configuration',
      );
    }

    const walletRepository = manager.getRepository(Wallet);

    const transactionRepository = manager.getRepository(WalletTransaction);

    /**
     * ==============================================================
     * LOCK WALLET
     * ==============================================================
     */

    let wallet = await walletRepository.findOne({
      where: {
        userId,
        type: WalletType.MAIN,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    /**
     * Wallet chưa tồn tại đồng nghĩa
     * balance hiện tại = 0.
     */
    if (!wallet) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_WALLET_BALANCE',

        message:
          'Số dư ví không đủ để chấp nhận booking. Vui lòng nạp thêm tiền.',

        requiredAmount,

        currentBalance: 0,
      });
    }

    /**
     * ==============================================================
     * IDEMPOTENCY CHECK
     * ==============================================================
     */

    const referenceId = `booking:${bookingId}`;

    const existingTransaction = await transactionRepository.findOne({
      where: {
        walletId: wallet.id,
        type: WalletTransactionType.PAYMENT,
        referenceId,
      },
    });

    /**
     * Booking đã bị charge trước đó.
     *
     * Không trừ lại.
     */
    if (existingTransaction) {
      return {
        charged: false,
        alreadyCharged: true,
        amount: Math.abs(Number(existingTransaction.amount)),
        balance: Number(wallet.balance),
      };
    }

    /**
     * ==============================================================
     * CHECK BALANCE
     * ==============================================================
     */

    const currentBalance = Number(wallet.balance);

    if (currentBalance < requiredAmount) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_WALLET_BALANCE',

        message:
          'Số dư ví không đủ để chấp nhận booking. Vui lòng nạp thêm tiền.',

        requiredAmount,

        currentBalance,
      });
    }

    /**
     * ==============================================================
     * DEBIT WALLET
     * ==============================================================
     */

    const balanceAfter = currentBalance - requiredAmount;

    wallet.balance = balanceAfter;

    wallet = await walletRepository.save(wallet);

    /**
     * ==============================================================
     * WALLET TRANSACTION
     * ==============================================================
     *
     * amount âm = tiền đi ra khỏi ví.
     */

    await transactionRepository.save(
      transactionRepository.create({
        walletId: wallet.id,

        amount: -requiredAmount,

        type: WalletTransactionType.PAYMENT,

        referenceId,

        description: `Phí nền tảng booking #${bookingId}`,
      }),
    );

    return {
      charged: true,
      alreadyCharged: false,
      amount: requiredAmount,
      balance: Number(wallet.balance),
    };
  }
}
