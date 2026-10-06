import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { TherapistGroup } from './therapist-group.entity.js';
import { TherapistProfile } from './therapist-profile.entity.js';

import { TherapistGroupMemberRole } from '../therapist-groups/therapist-group.enums.js';

@Entity('therapist_group_members')
@Index('idx_therapist_group_members_group', ['groupId'])
@Index('idx_therapist_group_members_therapist', ['therapistId'])
export class TherapistGroupMember extends BaseEntity {
  @Column({
    name: 'group_id',
    type: 'int',
  })
  groupId!: number;

  @ManyToOne(() => TherapistGroup, (group) => group.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'group_id',
  })
  group!: Relation<TherapistGroup>;

  @Column({
    name: 'therapist_id',
    type: 'int',
  })
  therapistId!: number;

  @ManyToOne(() => TherapistProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'therapist_id',
  })
  therapist!: Relation<TherapistProfile>;

  @Column({
    type: 'varchar',
    length: 20,
    default: TherapistGroupMemberRole.MEMBER,
  })
  role!: TherapistGroupMemberRole;
}
