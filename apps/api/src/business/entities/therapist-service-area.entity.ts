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

import {
  TherapistServiceAreaType,
} from '../enums/business.enums.js';

@Entity('therapist_service_areas')
@Index(
  'idx_therapist_service_areas_therapist',
  ['therapistId'],
)
export class TherapistServiceArea extends BaseEntity {
  @Column({
    name: 'therapist_id',
    type: 'int',
  })
  therapistId!: number;

  @ManyToOne(
    () => TherapistProfile,
    (therapist) =>
      therapist.serviceAreas,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'therapist_id',
  })
  therapist!: Relation<TherapistProfile>;

  @Column({
    type: 'enum',
    enum: TherapistServiceAreaType,
    enumName:
      'therapist_service_area_type_enum',
  })
  type!: TherapistServiceAreaType;

  @Column({
    name: 'area_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  areaName!: string | null;

  @Column({
    name: 'province_code',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  provinceCode!: string | null;

  @Column({
    name: 'district_code',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  districtCode!: string | null;

  @Column({
    name: 'center_latitude',
    type: 'double precision',
    nullable: true,
  })
  centerLatitude!: number | null;

  @Column({
    name: 'center_longitude',
    type: 'double precision',
    nullable: true,
  })
  centerLongitude!: number | null;

  @Column({
    name: 'radius_km',
    type: 'double precision',
    nullable: true,
  })
  radiusKm!: number | null;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;
}