import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { Booking } from './booking.entity.js';
import { TherapistGroup } from './therapist-group.entity.js';
import { TherapistProfile } from './therapist-profile.entity.js';

import { BookingTherapistTransferStatus } from '../therapist-groups/therapist-group.enums.js';

@Entity('booking_therapist_transfers')
@Index('idx_booking_therapist_transfers_booking', ['bookingId', 'createdAt'])
@Index('idx_booking_therapist_transfers_to_status', ['toTherapistId', 'status'])
export class BookingTherapistTransfer extends BaseEntity {
  @Column({
    name: 'booking_id',
    type: 'int',
  })
  bookingId!: number;

  @ManyToOne(() => Booking, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'booking_id',
  })
  booking!: Relation<Booking>;

  /**
   * Snapshot group tại thời điểm A gửi yêu cầu.
   */
  @Column({
    name: 'group_id',
    type: 'int',
  })
  groupId!: number;

  @ManyToOne(() => TherapistGroup, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'group_id',
  })
  group!: Relation<TherapistGroup>;

  @Column({
    name: 'from_therapist_id',
    type: 'int',
  })
  fromTherapistId!: number;

  @ManyToOne(() => TherapistProfile, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'from_therapist_id',
  })
  fromTherapist!: Relation<TherapistProfile>;

  @Column({
    name: 'to_therapist_id',
    type: 'int',
  })
  toTherapistId!: number;

  @ManyToOne(() => TherapistProfile, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'to_therapist_id',
  })
  toTherapist!: Relation<TherapistProfile>;

  @Column({
    type: 'varchar',
    length: 40,
    default: BookingTherapistTransferStatus.PENDING_THERAPIST,
  })
  status!: BookingTherapistTransferStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  reason!: string | null;

  @Column({
    name: 'therapist_responded_at',
    type: 'timestamptz',
    nullable: true,
  })
  therapistRespondedAt!: Date | null;

  @Column({
    name: 'client_responded_at',
    type: 'timestamptz',
    nullable: true,
  })
  clientRespondedAt!: Date | null;

  @Column({
    name: 'completed_at',
    type: 'timestamptz',
    nullable: true,
  })
  completedAt!: Date | null;

  @Column({
    name: 'cancelled_at',
    type: 'timestamptz',
    nullable: true,
  })
  cancelledAt!: Date | null;
}
