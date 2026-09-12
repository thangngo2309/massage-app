import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { Booking } from './booking.entity.js';
import { User } from './user.entity.js';

import {
  BookingStatus,
} from '../enums/business.enums.js';

@Entity('booking_status_histories')
@Index(
  'idx_booking_status_histories_booking',
  [
    'bookingId',
    'createdAt',
  ],
)
export class BookingStatusHistory extends BaseEntity {
  @Column({
    name: 'booking_id',
    type: 'int',
  })
  bookingId!: number;

  @ManyToOne(
    () => Booking,
    (booking) =>
      booking.statusHistories,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'booking_id',
  })
  booking!: Relation<Booking>;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: BookingStatus,
    enumName: 'booking_status_enum',
    nullable: true,
  })
  fromStatus!: BookingStatus | null;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: BookingStatus,
    enumName: 'booking_status_enum',
  })
  toStatus!: BookingStatus;

  @Column({
    name: 'changed_by_user_id',
    type: 'int',
    nullable: true,
  })
  changedByUserId!: number | null;

  @ManyToOne(
    () => User,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'changed_by_user_id',
  })
  changedByUser!: Relation<User> | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  reason!: string | null;
}