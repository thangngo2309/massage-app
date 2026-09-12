import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { TherapistProfile } from './therapist-profile.entity.js';

@Entity('therapist_working_hours')
@Index(
  'idx_therapist_working_hours_lookup',
  [
    'therapistId',
    'dayOfWeek',
    'isActive',
  ],
)
@Check(
  'chk_therapist_working_hours_day',
  `"day_of_week" BETWEEN 0 AND 6`,
)
@Check(
  'chk_therapist_working_hours_time',
  `"end_time" > "start_time"`,
)
export class TherapistWorkingHour extends BaseEntity {
  @Column({
    name: 'therapist_id',
    type: 'int',
  })
  therapistId!: number;

  @ManyToOne(
    () => TherapistProfile,
    (therapist) => therapist.workingHours,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'therapist_id',
  })
  therapist!: Relation<TherapistProfile>;

  /**
   * 0 = Sunday
   * 1 = Monday
   * ...
   * 6 = Saturday
   */
  @Column({
    name: 'day_of_week',
    type: 'smallint',
  })
  dayOfWeek!: number;

  @Column({
    name: 'start_time',
    type: 'time',
  })
  startTime!: string;

  @Column({
    name: 'end_time',
    type: 'time',
  })
  endTime!: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;
}