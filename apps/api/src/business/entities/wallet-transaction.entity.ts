import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { Wallet } from './wallet.entity.js';

export enum WalletTransactionType {
  TOPUP = 'topup',
  WITHDRAW = 'withdraw',
  PAYMENT = 'payment',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',

  /**
   * Tiền thưởng được cấp bởi Promotion Engine.
   */
  PROMOTION_REWARD = 'promotion_reward',

  /**
   * Khoản nền tảng bù phần voucher/discount của khách hàng
   * vào ví MAIN của kỹ thuật viên sau khi booking hoàn thành.
   */
  BOOKING_DISCOUNT_COMPENSATION = 'booking_discount_compensation',
}

@Entity('wallet_transactions')
@Index('IDX_wallet_transactions_wallet_id', ['walletId'])
@Index('IDX_wallet_transactions_reference_id', ['referenceId'])
@Index(
  'UQ_wallet_transactions_wallet_type_reference',
  ['walletId', 'type', 'referenceId'],
  {
    unique: true,
    where: `"reference_id" IS NOT NULL AND "deleted_at" IS NULL`,
  },
)
export class WalletTransaction extends BaseEntity {
  @Column({
    name: 'wallet_id',
    type: 'int',
  })
  walletId!: number;

  @ManyToOne(() => Wallet, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'wallet_id',
  })
  wallet!: Relation<Wallet>;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  amount!: number;

  @Column({
    type: 'enum',
    enum: WalletTransactionType,
    enumName: 'wallet_transaction_type_enum',
  })
  type!: WalletTransactionType;

  @Column({
    name: 'reference_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  referenceId!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  description!: string | null;
}
