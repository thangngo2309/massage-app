import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { BookingStatusHistory } from './booking-status-history.entity.js';
import { ClientProfile } from './client-profile.entity.js';
import { Rating } from './rating.entity.js';
import { ServiceOption } from './service-option.entity.js';
import { TherapistProfile } from './therapist-profile.entity.js';
import { TherapistService } from './therapist-service.entity.js';

import {
  BookingStatus,
} from '../enums/business.enums.js';

@Entity('bookings')
@Unique(
  'uq_bookings_booking_code',
  ['bookingCode'],
)
@Index(
  'idx_bookings_status',
  ['status'],
)
@Index(
  'idx_bookings_client_created',
  [
    'clientId',
    'createdAt',
  ],
)
@Index(
  'idx_bookings_therapist_schedule',
  [
    'therapistId',
    'scheduledAt',
  ],
)
export class Booking extends BaseEntity {
  @Column({
    name: 'booking_code',
    type: 'varchar',
    length: 32,
  })
  bookingCode!: string;

  @Column({
    name: 'client_id',
    type: 'int',
  })
  clientId!: number;

  @ManyToOne(
    () => ClientProfile,
    (client) => client.bookings,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'client_id',
  })
  client!: Relation<ClientProfile>;

  @Column({
    name: 'therapist_id',
    type: 'int',
    nullable: true,
  })
  therapistId!: number | null;

  @ManyToOne(
    () => TherapistProfile,
    (therapist) => therapist.bookings,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'therapist_id',
  })
  therapist!: Relation<TherapistProfile> | null;

  @Column({
    name: 'service_option_id',
    type: 'int',
  })
  serviceOptionId!: number;

  @ManyToOne(
    () => ServiceOption,
    (option) => option.bookings,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'service_option_id',
  })
  serviceOption!: Relation<ServiceOption>;

  @Column({
    name: 'therapist_service_id',
    type: 'int',
    nullable: true,
  })
  therapistServiceId!: number | null;

  @ManyToOne(
    () => TherapistService,
    (item) => item.bookings,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'therapist_service_id',
  })
  therapistService!:
    | Relation<TherapistService>
    | null;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    enumName: 'booking_status_enum',
    default: BookingStatus.PENDING,
  })
  status!: BookingStatus;

  @Column({
    name: 'scheduled_at',
    type: 'timestamptz',
  })
  scheduledAt!: Date;

  @Column({
    name: 'expected_end_at',
    type: 'timestamptz',
  })
  expectedEndAt!: Date;

  /**
   * Snapshot tên dịch vụ tại thời điểm đặt.
   */
  @Column({
    name: 'service_name',
    type: 'varchar',
    length: 255,
  })
  serviceName!: string;

  /**
   * Snapshot thời lượng.
   */
  @Column({
    name: 'duration_minutes',
    type: 'int',
  })
  durationMinutes!: number;

  /**
   * Snapshot giá dịch vụ.
   */
  @Column({
    name: 'service_price',
    type: 'int',
  })
  servicePrice!: number;

  @Column({
    name: 'platform_fee',
    type: 'int',
    default: 0,
  })
  platformFee!: number;

  @Column({
    name: 'tax_amount',
    type: 'int',
    default: 0,
  })
  taxAmount!: number;

  @Column({
    name: 'total_amount',
    type: 'int',
  })
  totalAmount!: number;

  @Column({
    type: 'text',
  })
  address!: string;

  @Column({
    type: 'double precision',
  })
  latitude!: number;

  @Column({
    type: 'double precision',
  })
  longitude!: number;

  @Column({
    name: 'client_note',
    type: 'text',
    nullable: true,
  })
  clientNote!: string | null;

  @Column({
    name: 'accepted_at',
    type: 'timestamptz',
    nullable: true,
  })
  acceptedAt!: Date | null;

  @Column({
    name: 'arrived_at',
    type: 'timestamptz',
    nullable: true,
  })
  arrivedAt!: Date | null;

  @Column({
    name: 'started_at',
    type: 'timestamptz',
    nullable: true,
  })
  startedAt!: Date | null;

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

  @Column({
    name: 'cancellation_reason',
    type: 'text',
    nullable: true,
  })
  cancellationReason!: string | null;

  @OneToMany(
    () => BookingStatusHistory,
    (history) => history.booking,
  )
  statusHistories!: Relation<
    BookingStatusHistory[]
  >;

  @OneToOne(
    () => Rating,
    (rating) => rating.booking,
  )
  rating!: Relation<Rating> | null;
}