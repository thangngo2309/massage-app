import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { Booking } from './booking.entity.js';
import { User } from './user.entity.js';
import { Voucher } from './voucher.entity.js';

import {
  UserVoucherSourceType,
  UserVoucherStatus,
} from '../enums/promotion.enums.js';

@Entity('user_vouchers')
@Index('idx_user_vouchers_user_status', ['userId', 'status'])
@Index('idx_user_vouchers_voucher', ['voucherId'])
@Index(
  'uq_user_vouchers_source',
  ['userId', 'voucherId', 'sourceType', 'sourceReferenceId'],
  {
    unique: true,
  },
)
export class UserVoucher extends BaseEntity {
  @Column({
    name: 'user_id',
    type: 'int',
  })
  userId!: number;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user!: Relation<User>;

  @Column({
    name: 'voucher_id',
    type: 'int',
  })
  voucherId!: number;

  @ManyToOne(() => Voucher, (voucher) => voucher.userVouchers, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'voucher_id',
  })
  voucher!: Relation<Voucher>;

  @Column({
    type: 'enum',
    enum: UserVoucherStatus,
    enumName: 'user_voucher_status_enum',
    default: UserVoucherStatus.AVAILABLE,
  })
  status!: UserVoucherStatus;

  @Column({
    name: 'source_type',
    type: 'enum',
    enum: UserVoucherSourceType,
    enumName: 'user_voucher_source_type_enum',
  })
  sourceType!: UserVoucherSourceType;

  /**
   * ID nguồn cấp voucher.
   *
   * Ví dụ:
   * referral id / promotion usage id / booking id.
   */
  @Column({
    name: 'source_reference_id',
    type: 'varchar',
    length: 100,
  })
  sourceReferenceId!: string;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  expiresAt!: Date | null;

  @Column({
    name: 'reserved_at',
    type: 'timestamptz',
    nullable: true,
  })
  reservedAt!: Date | null;

  @Column({
    name: 'reserved_booking_id',
    type: 'int',
    nullable: true,
  })
  reservedBookingId!: number | null;

  @ManyToOne(() => Booking, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'reserved_booking_id',
  })
  reservedBooking!: Relation<Booking> | null;

  @Column({
    name: 'used_at',
    type: 'timestamptz',
    nullable: true,
  })
  usedAt!: Date | null;

  @Column({
    name: 'used_booking_id',
    type: 'int',
    nullable: true,
  })
  usedBookingId!: number | null;

  @ManyToOne(() => Booking, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'used_booking_id',
  })
  usedBooking!: Relation<Booking> | null;
}
