import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Wallet, WalletType } from '../entities/wallet.entity.js';

import { WalletTransaction } from '../entities/wallet-transaction.entity.js';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,

    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepository: Repository<WalletTransaction>,
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
      // Trường hợp 2 request đồng thời cùng tạo wallet.
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
}
