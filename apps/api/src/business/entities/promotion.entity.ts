import { Column, Entity, Index, OneToMany, Unique } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { PromotionTranslation } from './promotion-translation.entity.js';
import { PromotionUsage } from './promotion-usage.entity.js';

import {
  PromotionAudience,
  PromotionRewardRecipient,
  PromotionRewardType,
  PromotionTriggerType,
} from '../enums/promotion.enums.js';

@Entity('promotions')
@Unique('uq_promotions_code', ['code'])
@Index('idx_promotions_active_period', ['isActive', 'startsAt', 'endsAt'])
@Index('idx_promotions_audience_trigger', ['audience', 'triggerType'])
export class Promotion extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
  })
  code!: string;

  @Column({
    type: 'enum',
    enum: PromotionAudience,
    enumName: 'promotion_audience_enum',
  })
  audience!: PromotionAudience;

  @Column({
    name: 'trigger_type',
    type: 'enum',
    enum: PromotionTriggerType,
    enumName: 'promotion_trigger_type_enum',
  })
  triggerType!: PromotionTriggerType;

  @Column({
    name: 'reward_type',
    type: 'enum',
    enum: PromotionRewardType,
    enumName: 'promotion_reward_type_enum',
  })
  rewardType!: PromotionRewardType;

  @Column({
    name: 'reward_recipient',
    type: 'enum',
    enum: PromotionRewardRecipient,
    enumName: 'promotion_reward_recipient_enum',
    default: PromotionRewardRecipient.ACTOR,
  })
  rewardRecipient!: PromotionRewardRecipient;

  /**
   * Giá trị reward.
   *
   * WALLET_CREDIT:
   * - số tiền cộng vào promotion wallet.
   *
   * VOUCHER:
   * - giá trị này có thể không dùng vì voucher sẽ
   *   lấy cấu hình trực tiếp từ voucherId.
   */
  @Column({
    name: 'reward_value',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  rewardValue!: number;

  /**
   * Voucher được cấp nếu rewardType = VOUCHER.
   *
   * Chưa khai báo relation trực tiếp ở đây để tránh
   * circular dependency Promotion <-> Voucher.
   */
  @Column({
    name: 'voucher_id',
    type: 'int',
    nullable: true,
  })
  voucherId!: number | null;

  @Column({
    name: 'starts_at',
    type: 'timestamptz',
    nullable: true,
  })
  startsAt!: Date | null;

  @Column({
    name: 'ends_at',
    type: 'timestamptz',
    nullable: true,
  })
  endsAt!: Date | null;

  /**
   * Tổng số lần promotion được phép phát thưởng.
   * null = không giới hạn.
   */
  @Column({
    name: 'usage_limit',
    type: 'int',
    nullable: true,
  })
  usageLimit!: number | null;

  /**
   * Số lần tối đa một user được nhận promotion.
   * null = không giới hạn.
   */
  @Column({
    name: 'usage_limit_per_user',
    type: 'int',
    nullable: true,
  })
  usageLimitPerUser!: number | null;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @OneToMany(() => PromotionTranslation, (translation) => translation.promotion)
  translations!: Relation<PromotionTranslation[]>;

  @OneToMany(() => PromotionUsage, (usage) => usage.promotion)
  usages!: Relation<PromotionUsage[]>;
}
