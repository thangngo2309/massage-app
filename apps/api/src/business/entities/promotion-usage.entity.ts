import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { Booking } from './booking.entity.js';
import { Promotion } from './promotion.entity.js';
import { User } from './user.entity.js';

@Entity('promotion_usages')
@Index('idx_promotion_usages_promotion', ['promotionId'])
@Index('idx_promotion_usages_user', ['userId'])
@Index('idx_promotion_usages_booking', ['bookingId'])
@Index('uq_promotion_usages_unique_key', ['uniqueKey'], {
  unique: true,
})
export class PromotionUsage extends BaseEntity {
  @Column({
    name: 'promotion_id',
    type: 'int',
  })
  promotionId!: number;

  @ManyToOne(() => Promotion, (promotion) => promotion.usages, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'promotion_id',
  })
  promotion!: Relation<Promotion>;

  /**
   * User thực tế nhận reward.
   */
  @Column({
    name: 'user_id',
    type: 'int',
  })
  userId!: number;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user!: Relation<User>;

  @Column({
    name: 'booking_id',
    type: 'int',
    nullable: true,
  })
  bookingId!: number | null;

  @ManyToOne(() => Booking, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'booking_id',
  })
  booking!: Relation<Booking> | null;

  @Column({
    name: 'referral_id',
    type: 'int',
    nullable: true,
  })
  referralId!: number | null;

  /**
   * Khóa idempotency do Promotion Engine sinh.
   *
   * Ví dụ:
   * promotion:1:user:20:booking:100
   * promotion:2:user:20:referral:5
   */
  @Column({
    name: 'unique_key',
    type: 'varchar',
    length: 255,
  })
  uniqueKey!: string;

  @Column({
    name: 'reward_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  rewardAmount!: number;
}
