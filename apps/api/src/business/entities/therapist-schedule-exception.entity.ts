import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { TherapistProfile } from './therapist-profile.entity.js';

@Entity(
  'therapist_schedule_exceptions',
)
@Index(
  'idx_therapist_schedule_exception_date',
  [
    'therapistId',
    'date',
  ],
)
export class TherapistScheduleException extends BaseEntity {
  @Column({
    name: 'therapist_id',
    type: 'int',
  })
  therapistId!: number;

  @ManyToOne(
    () => TherapistProfile,
    (therapist) =>
      therapist.scheduleExceptions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'therapist_id',
  })
  therapist!: Relation<TherapistProfile>;

  @Column({
    type: 'date',
  })
  date!: string;

  @Column({
    name: 'is_day_off',
    type: 'boolean',
    default: false,
  })
  isDayOff!: boolean;

  @Column({
    name: 'start_time',
    type: 'time',
    nullable: true,
  })
  startTime!: string | null;

  @Column({
    name: 'end_time',
    type: 'time',
    nullable: true,
  })
  endTime!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  note!: string | null;
}