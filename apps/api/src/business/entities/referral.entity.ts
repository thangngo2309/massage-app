import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { User } from './user.entity.js';
import { UserReferralCode } from './user-referral-code.entity.js';

import { ReferralStatus } from '../enums/promotion.enums.js';

@Entity('referrals')
@Unique('uq_referrals_referred_user', ['referredUserId'])
@Index('idx_referrals_referrer_status', ['referrerUserId', 'status'])
@Index('idx_referrals_status', ['status'])
export class Referral extends BaseEntity {
  @Column({
    name: 'referrer_user_id',
    type: 'int',
  })
  referrerUserId!: number;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'referrer_user_id',
  })
  referrerUser!: Relation<User>;

  @Column({
    name: 'referred_user_id',
    type: 'int',
  })
  referredUserId!: number;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'referred_user_id',
  })
  referredUser!: Relation<User>;

  @Column({
    name: 'referral_code_id',
    type: 'int',
  })
  referralCodeId!: number;

  @ManyToOne(() => UserReferralCode, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'referral_code_id',
  })
  referralCode!: Relation<UserReferralCode>;

  /**
   * Snapshot mã tại thời điểm nhập.
   */
  @Column({
    name: 'referral_code',
    type: 'varchar',
    length: 32,
  })
  referralCodeSnapshot!: string;

  @Column({
    type: 'enum',
    enum: ReferralStatus,
    enumName: 'referral_status_enum',
    default: ReferralStatus.PENDING,
  })
  status!: ReferralStatus;

  @Column({
    name: 'qualified_at',
    type: 'timestamptz',
    nullable: true,
  })
  qualifiedAt!: Date | null;

  @Column({
    name: 'rewarded_at',
    type: 'timestamptz',
    nullable: true,
  })
  rewardedAt!: Date | null;
}
