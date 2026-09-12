import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { Booking } from './booking.entity.js';
import { Rating } from './rating.entity.js';
import { User } from './user.entity.js';

@Entity('client_profiles')
@Unique(
  'uq_client_profiles_user_id',
  ['userId'],
)
export class ClientProfile extends BaseEntity {
  @Column({
    name: 'user_id',
    type: 'int',
  })
  userId!: number;

  @OneToOne(
    () => User,
    (user) => user.clientProfile,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'user_id',
  })
  user!: Relation<User>;

  @Column({
    name: 'default_address',
    type: 'text',
    nullable: true,
  })
  defaultAddress!: string | null;

  @Column({
    name: 'default_latitude',
    type: 'double precision',
    nullable: true,
  })
  defaultLatitude!: number | null;

  @Column({
    name: 'default_longitude',
    type: 'double precision',
    nullable: true,
  })
  defaultLongitude!: number | null;

  @OneToMany(
    () => Booking,
    (booking) => booking.client,
  )
  bookings!: Relation<Booking[]>;

  @OneToMany(
    () => Rating,
    (rating) => rating.client,
  )
  ratings!: Relation<Rating[]>;
}