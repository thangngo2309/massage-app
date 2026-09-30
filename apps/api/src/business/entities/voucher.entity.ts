import { Column, Entity, Index, OneToMany, Unique } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { UserVoucher } from './user-voucher.entity.js';
import { VoucherTranslation } from './voucher-translation.entity.js';

import {
  PromotionAudience,
  VoucherDiscountType,
} from '../enums/promotion.enums.js';

@Entity('vouchers')
@Unique('uq_vouchers_code', ['code'])
@Index('idx_vouchers_active_period', ['isActive', 'startsAt', 'endsAt'])
export class Voucher extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
  })
  code!: string;

  @Column({
    type: 'enum',
    enum: PromotionAudience,
    enumName: 'voucher_audience_enum',
    default: PromotionAudience.CLIENT,
  })
  audience!: PromotionAudience;

  @Column({
    name: 'discount_type',
    type: 'enum',
    enum: VoucherDiscountType,
    enumName: 'voucher_discount_type_enum',
  })
  discountType!: VoucherDiscountType;

  /**
   * FIXED:
   *   số tiền giảm.
   *
   * PERCENT:
   *   phần trăm giảm, ví dụ 10 = 10%.
   */
  @Column({
    name: 'discount_value',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  discountValue!: number;

  /**
   * Giảm tối đa.
   * Chủ yếu dùng với voucher PERCENT.
   */
  @Column({
    name: 'max_discount_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  maxDiscountAmount!: number | null;

  @Column({
    name: 'min_order_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  minOrderAmount!: number;

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
   * null = không giới hạn tổng số voucher được cấp.
   */
  @Column({
    name: 'issuance_limit',
    type: 'int',
    nullable: true,
  })
  issuanceLimit!: number | null;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @OneToMany(() => VoucherTranslation, (translation) => translation.voucher)
  translations!: Relation<VoucherTranslation[]>;

  @OneToMany(() => UserVoucher, (item) => item.voucher)
  userVouchers!: Relation<UserVoucher[]>;
}
