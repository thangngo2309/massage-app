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
import { MassageService } from './service.entity.js';
import { TherapistService } from './therapist-service.entity.js';

@Entity('service_options')
@Unique(
  'uq_service_options_service_duration',
  [
    'serviceId',
    'durationMinutes',
  ],
)
export class ServiceOption extends BaseEntity {
  @Column({
    name: 'service_id',
    type: 'int',
  })
  serviceId!: number;

  @ManyToOne(
    () => MassageService,
    (service) => service.options,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'service_id',
  })
  service!: Relation<MassageService>;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  label!: string | null;

  @Column({
    name: 'duration_minutes',
    type: 'int',
  })
  durationMinutes!: number;

  @Column({
    name: 'default_price',
    type: 'int',
    default: 0,
  })
  defaultPrice!: number;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @OneToMany(
    () => TherapistService,
    (item) => item.serviceOption,
  )
  therapistServices!: Relation<
    TherapistService[]
  >;

  @OneToMany(
    () => Booking,
    (booking) => booking.serviceOption,
  )
  bookings!: Relation<Booking[]>;
}