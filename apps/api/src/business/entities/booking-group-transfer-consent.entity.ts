import { Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { Booking } from './booking.entity.js';

@Entity('booking_group_transfer_consents')
@Unique('uq_booking_group_transfer_consents_booking', ['bookingId'])
export class BookingGroupTransferConsent extends BaseEntity {
  @Column({
    name: 'booking_id',
    type: 'int',
  })
  bookingId!: number;

  @OneToOne(() => Booking, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'booking_id',
  })
  booking!: Relation<Booking>;

  @Column({
    type: 'boolean',
    default: false,
  })
  allowed!: boolean;

  @Column({
    name: 'accepted_at',
    type: 'timestamptz',
    nullable: true,
  })
  acceptedAt!: Date | null;
}
