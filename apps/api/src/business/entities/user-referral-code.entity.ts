import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { User } from './user.entity.js';

@Entity('user_referral_codes')
@Unique('uq_user_referral_codes_code', ['code'])
@Index('idx_user_referral_codes_user_active', ['userId', 'isActive'])
export class UserReferralCode extends BaseEntity {
  @Column({
    name: 'user_id',
    type: 'int',
  })
  userId!: number;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user!: Relation<User>;

  @Column({
    type: 'varchar',
    length: 32,
  })
  code!: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;
}
