import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { Booking } from './booking.entity.js';
import { ServiceOption } from './service-option.entity.js';
import { TherapistProfile } from './therapist-profile.entity.js';

@Entity('therapist_services')
@Unique(
  'uq_therapist_services',
  [
    'therapistId',
    'serviceOptionId',
  ],
)
export class TherapistService extends BaseEntity {
  @Column({
    name: 'therapist_id',
    type: 'int',
  })
  therapistId!: number;

  @ManyToOne(
    () => TherapistProfile,
    (therapist) => therapist.services,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'therapist_id',
  })
  therapist!: Relation<TherapistProfile>;

  @Column({
    name: 'service_option_id',
    type: 'int',
  })
  serviceOptionId!: number;

  @ManyToOne(
    () => ServiceOption,
    (option) => option.therapistServices,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'service_option_id',
  })
  serviceOption!: Relation<ServiceOption>;

  @Column({
    type: 'int',
  })
  price!: number;

  @Column({
    name: 'platform_fee_rate',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  platformFeeRate!: number;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @OneToMany(
    () => Booking,
    (booking) => booking.therapistService,
  )
  bookings!: Relation<Booking[]>;
}