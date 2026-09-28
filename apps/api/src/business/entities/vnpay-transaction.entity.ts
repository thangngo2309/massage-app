import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { User } from './user.entity.js';

export enum VnpayTransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAIL = 'fail',
}

@Entity('vnpay_transactions')
@Index('UQ_vnpay_transactions_txn_ref', ['txnRef'], {
  unique: true,
})
@Index('IDX_vnpay_transactions_user_id', ['userId'])
export class VnpayTransaction extends BaseEntity {
  @Column({
    name: 'user_id',
    type: 'int',
  })
  userId: number;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({
    name: 'txn_ref',
    type: 'varchar',
    length: 100,
  })
  txnRef: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  amount: number;

  @Column({
    name: 'bank_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  bankCode: string | null;

  @Column({
    type: 'enum',
    enum: VnpayTransactionStatus,
    enumName: 'vnpay_transaction_status_enum',
    default: VnpayTransactionStatus.PENDING,
  })
  status: VnpayTransactionStatus;

  @Column({
    name: 'processed_to_wallet',
    type: 'boolean',
    default: false,
  })
  processedToWallet: boolean;

  @Column({
    name: 'vnp_transaction_no',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  vnpTransactionNo: string | null;

  @Column({
    name: 'vnp_response_code',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  vnpResponseCode: string | null;
}
