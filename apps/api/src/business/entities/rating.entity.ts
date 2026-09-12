import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { Booking } from './booking.entity.js';
import { ClientProfile } from './client-profile.entity.js';
import { TherapistProfile } from './therapist-profile.entity.js';

@Entity('ratings')
@Unique(
  'uq_ratings_booking_id',
  ['bookingId'],
)
@Index(
  'idx_ratings_therapist_id',
  ['therapistId'],
)
@Check(
  'chk_ratings_rating',
  `"rating" BETWEEN 1 AND 5`,
)
export class Rating extends BaseEntity {
  @Column({
    name: 'booking_id',
    type: 'int',
  })
  bookingId!: number;

  @OneToOne(
    () => Booking,
    (booking) => booking.rating,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'booking_id',
  })
  booking!: Relation<Booking>;

  @Column({
    name: 'client_id',
    type: 'int',
  })
  clientId!: number;

  @ManyToOne(
    () => ClientProfile,
    (client) => client.ratings,
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
  })
  therapistId!: number;

  @ManyToOne(
    () => TherapistProfile,
    (therapist) =>
      therapist.ratings,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'therapist_id',
  })
  therapist!: Relation<TherapistProfile>;

  @Column({
    type: 'smallint',
  })
  rating!: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  comment!: string | null;

  @Column({
    name: 'is_visible',
    type: 'boolean',
    default: true,
  })
  isVisible!: boolean;

  @Column({
    name: 'admin_note',
    type: 'text',
    nullable: true,
  })
  adminNote!: string | null;
}