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
   * Thu phí khi therapist chấp nhận booking.
   *
   * Tổng tiền trừ:
   *
   * booking.platformFee
   * +
   * THERAPIST_BOOKING_ACCEPT_FEE
   *
   * Phải được gọi trong transaction của BookingService.
   */
  async chargeTherapistBookingAcceptFee(
    manager: EntityManager,
    userId: number,
    bookingId: number,
    platformFee: number,
  ) {
    /**
     * Phí cố định của hệ thống.
     */
    const bookingAcceptFee = await this.systemSettingService.getNumber(
      SystemSettingKey.THERAPIST_BOOKING_ACCEPT_FEE,
      manager,
    );

    if (!Number.isFinite(bookingAcceptFee) || bookingAcceptFee < 0) {
      throw new BadRequestException(
        'Invalid therapist booking accept fee configuration',
      );
    }

    /**
     * platformFee đã được snapshot vào booking
     * tại thời điểm khách tạo booking.
     */
    const bookingPlatformFee = Number(platformFee);

    if (!Number.isFinite(bookingPlatformFee) || bookingPlatformFee < 0) {
      throw new BadRequestException('Invalid booking platform fee');
    }

    /**
     * Tổng số tiền cần thu từ ví KTV.
     */
    const requiredAmount = bookingAcceptFee + bookingPlatformFee;

    const walletRepository = manager.getRepository(Wallet);

    const transactionRepository = manager.getRepository(WalletTransaction);

    /**
     * Lock wallet để tránh race condition.
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

    if (!wallet) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_WALLET_BALANCE',

        message:
          'Số dư ví không đủ để chấp nhận booking. Vui lòng nạp thêm tiền.',

        requiredAmount,

        currentBalance: 0,

        bookingAcceptFee,

        platformFee: bookingPlatformFee,
      });
    }

    /**
     * Một booking chỉ được charge một lần.
     */
    const referenceId = `booking:${bookingId}`;

    const existingTransaction = await transactionRepository.findOne({
      where: {
        walletId: wallet.id,
        type: WalletTransactionType.PAYMENT,
        referenceId,
      },
    });

    if (existingTransaction) {
      return {
        charged: false,
        alreadyCharged: true,

        amount: Math.abs(Number(existingTransaction.amount)),

        balance: Number(wallet.balance),

        bookingAcceptFee,

        platformFee: bookingPlatformFee,
      };
    }

    const currentBalance = Number(wallet.balance);

    /**
     * Kiểm tra ví dựa trên TỔNG số tiền:
     *
     * phí nhận booking + chiết khấu.
     */
    if (currentBalance < requiredAmount) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_WALLET_BALANCE',

        message:
          'Số dư ví không đủ để chấp nhận booking. Vui lòng nạp thêm tiền.',

        requiredAmount,

        currentBalance,

        bookingAcceptFee,

        platformFee: bookingPlatformFee,
      });
    }

    /**
     * Trừ toàn bộ số tiền một lần.
     */
    const balanceAfter = currentBalance - requiredAmount;

    wallet.balance = balanceAfter;

    wallet = await walletRepository.save(wallet);

    /**
     * Ghi transaction.
     *
     * amount âm = tiền ra khỏi ví.
     */
    await transactionRepository.save(
      transactionRepository.create({
        walletId: wallet.id,

        amount: -requiredAmount,

        type: WalletTransactionType.PAYMENT,

        referenceId,

        description:
          `Thanh toán phí booking #${bookingId}: ` +
          `phí nhận booking ${bookingAcceptFee}đ + ` +
          `phí nền tảng ${bookingPlatformFee}đ`,
      }),
    );

    return {
      charged: true,
      alreadyCharged: false,

      amount: requiredAmount,

      balance: Number(wallet.balance),

      bookingAcceptFee,

      platformFee: bookingPlatformFee,
    };
  }
}
