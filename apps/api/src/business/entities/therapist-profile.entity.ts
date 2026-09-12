import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { Booking } from './booking.entity.js';
import { Rating } from './rating.entity.js';
import { TherapistScheduleException } from './therapist-schedule-exception.entity.js';
import { TherapistService } from './therapist-service.entity.js';
import { TherapistServiceArea } from './therapist-service-area.entity.js';
import { TherapistWorkingHour } from './therapist-working-hour.entity.js';
import { User } from './user.entity.js';

import {
  Gender,
  TherapistOnlineStatus,
  TherapistVerificationStatus,
} from '../enums/business.enums.js';

@Entity('therapist_profiles')
@Unique(
  'uq_therapist_profiles_user_id',
  ['userId'],
)
@Index(
  'idx_therapist_profiles_verification',
  ['verificationStatus'],
)
@Index(
  'idx_therapist_profiles_online_status',
  ['onlineStatus'],
)
export class TherapistProfile extends BaseEntity {
  @Column({
    name: 'user_id',
    type: 'int',
  })
  userId!: number;

  @OneToOne(
    () => User,
    (user) => user.therapistProfile,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'user_id',
  })
  user!: Relation<User>;

  @Column({
    type: 'text',
    nullable: true,
  })
  bio!: string | null;

  @Column({
    type: 'enum',
    enum: Gender,
    enumName: 'gender_enum',
    default: Gender.UNKNOWN,
  })
  gender!: Gender;

  @Column({
    name: 'date_of_birth',
    type: 'date',
    nullable: true,
  })
  dateOfBirth!: string | null;

  @Column({
    name: 'experience_years',
    type: 'int',
    default: 0,
  })
  experienceYears!: number;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: TherapistVerificationStatus,
    enumName:
      'therapist_verification_status_enum',
    default:
      TherapistVerificationStatus.PENDING,
  })
  verificationStatus!: TherapistVerificationStatus;

  @Column({
    name: 'online_status',
    type: 'enum',
    enum: TherapistOnlineStatus,
    enumName:
      'therapist_online_status_enum',
    default:
      TherapistOnlineStatus.OFFLINE,
  })
  onlineStatus!: TherapistOnlineStatus;

  @Column({
    name: 'is_accepting_bookings',
    type: 'boolean',
    default: false,
  })
  isAcceptingBookings!: boolean;

  @Column({
    name: 'service_radius_km',
    type: 'double precision',
    default: 10,
  })
  serviceRadiusKm!: number;

  @Column({
    name: 'current_latitude',
    type: 'double precision',
    nullable: true,
  })
  currentLatitude!: number | null;

  @Column({
    name: 'current_longitude',
    type: 'double precision',
    nullable: true,
  })
  currentLongitude!: number | null;

  @Column({
    name: 'rating_average',
    type: 'numeric',
    precision: 3,
    scale: 2,
    default: 0,
  })
  ratingAverage!: number;

  @Column({
    name: 'rating_count',
    type: 'int',
    default: 0,
  })
  ratingCount!: number;

  @Column({
    name: 'completed_bookings',
    type: 'int',
    default: 0,
  })
  completedBookings!: number;

  @OneToMany(
    () => TherapistService,
    (item) => item.therapist,
  )
  services!: Relation<TherapistService[]>;

  @OneToMany(
    () => TherapistWorkingHour,
    (item) => item.therapist,
  )
  workingHours!: Relation<TherapistWorkingHour[]>;

  @OneToMany(
    () => TherapistScheduleException,
    (item) => item.therapist,
  )
  scheduleExceptions!: Relation<
    TherapistScheduleException[]
  >;

  @OneToMany(
    () => TherapistServiceArea,
    (item) => item.therapist,
  )
  serviceAreas!: Relation<TherapistServiceArea[]>;

  @OneToMany(
    () => Booking,
    (booking) => booking.therapist,
  )
  bookings!: Relation<Booking[]>;

  @OneToMany(
    () => Rating,
    (rating) => rating.therapist,
  )
  ratings!: Relation<Rating[]>;
}