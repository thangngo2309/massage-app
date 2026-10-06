import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { TherapistProfile } from './therapist-profile.entity.js';
import { TherapistGroupMember } from './therapist-group-member.entity.js';
import { TherapistGroupInvitation } from './therapist-group-invitation.entity.js';

@Entity('therapist_groups')
@Index('idx_therapist_groups_owner', ['ownerTherapistId'])
@Index('idx_therapist_groups_active', ['isActive'])
export class TherapistGroup extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 120,
  })
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @Column({
    name: 'owner_therapist_id',
    type: 'int',
  })
  ownerTherapistId!: number;

  @ManyToOne(() => TherapistProfile, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'owner_therapist_id',
  })
  ownerTherapist!: Relation<TherapistProfile>;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @OneToMany(() => TherapistGroupMember, (member) => member.group)
  members!: Relation<TherapistGroupMember[]>;

  @OneToMany(() => TherapistGroupInvitation, (invitation) => invitation.group)
  invitations!: Relation<TherapistGroupInvitation[]>;
}
