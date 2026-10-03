import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';

import { Booking } from './booking.entity.js';

import { MassageService } from './service.entity.js';

import { ServiceOption } from './service-option.entity.js';

import { TherapistService } from './therapist-service.entity.js';

@Entity('booking_items')
@Index('idx_booking_items_booking_id', ['bookingId'])
@Unique('uq_booking_items_booking_sort_order', ['bookingId', 'sortOrder'])
export class BookingItem extends BaseEntity {
  @Column({
    name: 'booking_id',
    type: 'int',
  })
  bookingId!: number;

  @ManyToOne(() => Booking, (booking) => booking.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'booking_id',
  })
  booking!: Relation<Booking>;

  /**
   * Snapshot relation tới Service.
   */
  @Column({
    name: 'service_id',
    type: 'int',
  })
  serviceId!: number;

  @ManyToOne(() => MassageService, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'service_id',
  })
  service!: Relation<MassageService>;

  @Column({
    name: 'service_option_id',
    type: 'int',
  })
  serviceOptionId!: number;

  @ManyToOne(() => ServiceOption, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'service_option_id',
  })
  serviceOption!: Relation<ServiceOption>;

  /**
   * TherapistService có thể bị xoá / thay đổi sau này,
   * nên relation nullable.
   *
   * Các thông tin price, duration, fee vẫn được snapshot
   * trực tiếp trên BookingItem.
   */
  @Column({
    name: 'therapist_service_id',
    type: 'int',
    nullable: true,
  })
  therapistServiceId!: number | null;

  @ManyToOne(() => TherapistService, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'therapist_service_id',
  })
  therapistService!: Relation<TherapistService> | null;

  /**
   * Snapshot tên Service tại thời điểm booking.
   */
  @Column({
    name: 'service_name',
    type: 'varchar',
    length: 255,
  })
  serviceName!: string;

  /**
   * Snapshot label ServiceOption.
   */
  @Column({
    name: 'option_label',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  optionLabel!: string | null;

  /**
   * Snapshot thời lượng của riêng item.
   */
  @Column({
    name: 'duration_minutes',
    type: 'int',
  })
  durationMinutes!: number;

  /**
   * Giá KTV tại thời điểm booking.
   */
  @Column({
    type: 'int',
  })
  price!: number;

  /**
   * Tỷ lệ platform fee tại thời điểm booking.
   */
  @Column({
    name: 'platform_fee_rate',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  platformFeeRate!: number;

  /**
   * Số tiền platform fee của riêng item.
   */
  @Column({
    name: 'platform_fee',
    type: 'int',
    default: 0,
  })
  platformFee!: number;

  /**
   * Giữ thứ tự dịch vụ khách đã chọn.
   */
  @Column({
    name: 'sort_order',
    type: 'int',
    default: 0,
  })
  sortOrder!: number;
}
