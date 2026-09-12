import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { ClientProfile } from './client-profile.entity.js';
import { RefreshToken } from './refresh-token.entity.js';
import { TherapistProfile } from './therapist-profile.entity.js';

import {
  UserRole,
  UserStatus,
} from '../enums/business.enums.js';

@Entity('users')
@Unique('uq_users_phone', ['phone'])
@Unique('uq_users_email', ['email'])
@Index('idx_users_role', ['role'])
@Index('idx_users_status', ['status'])
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 20,
  })
  phone!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email!: string | null;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordHash!: string | null;

  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 255,
  })
  fullName!: string;

  @Column({
    name: 'avatar_url',
    type: 'text',
    nullable: true,
  })
  avatarUrl!: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role_enum',
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    enumName: 'user_status_enum',
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({
    name: 'last_login_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastLoginAt!: Date | null;

  @OneToOne(
    () => ClientProfile,
    (profile) => profile.user,
  )
  clientProfile!: Relation<ClientProfile> | null;

  @OneToOne(
    () => TherapistProfile,
    (profile) => profile.user,
  )
  therapistProfile!: Relation<TherapistProfile> | null;

  @OneToMany(
    () => RefreshToken,
    (token) => token.user,
  )
  refreshTokens!: Relation<RefreshToken[]>;
}