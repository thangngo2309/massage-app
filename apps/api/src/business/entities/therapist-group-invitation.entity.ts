import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { TherapistGroup } from './therapist-group.entity.js';
import { TherapistProfile } from './therapist-profile.entity.js';

import { TherapistGroupInvitationStatus } from '../therapist-groups/therapist-group.enums.js';

@Entity('therapist_group_invitations')
@Index('idx_therapist_group_invitations_group', ['groupId'])
@Index('idx_therapist_group_invitations_invited', [
  'invitedTherapistId',
  'status',
])
export class TherapistGroupInvitation extends BaseEntity {
  @Column({
    name: 'group_id',
    type: 'int',
  })
  groupId!: number;

  @ManyToOne(() => TherapistGroup, (group) => group.invitations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'group_id',
  })
  group!: Relation<TherapistGroup>;

  @Column({
    name: 'invited_by_therapist_id',
    type: 'int',
  })
  invitedByTherapistId!: number;

  @ManyToOne(() => TherapistProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'invited_by_therapist_id',
  })
  invitedByTherapist!: Relation<TherapistProfile>;

  @Column({
    name: 'invited_therapist_id',
    type: 'int',
  })
  invitedTherapistId!: number;

  @ManyToOne(() => TherapistProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'invited_therapist_id',
  })
  invitedTherapist!: Relation<TherapistProfile>;

  @Column({
    type: 'varchar',
    length: 32,
    default: TherapistGroupInvitationStatus.PENDING,
  })
  status!: TherapistGroupInvitationStatus;

  @Column({
    name: 'responded_at',
    type: 'timestamptz',
    nullable: true,
  })
  respondedAt!: Date | null;
}
