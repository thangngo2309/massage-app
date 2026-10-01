import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { AdministrativeProvince } from './administrative-province.entity.js';

@Entity('administrative_wards')
@Index('idx_administrative_wards_province', ['provinceId'])
@Index('idx_administrative_wards_province_active_sort', [
  'provinceId',
  'isActive',
  'sortOrder',
  'name',
])
export class AdministrativeWard extends BaseEntity {
  @Column({
    name: 'province_id',
    type: 'int',
  })
  provinceId!: number;

  @ManyToOne(() => AdministrativeProvince, (province) => province.wards, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'province_id',
  })
  province!: Relation<AdministrativeProvince>;

  @Column({
    type: 'varchar',
    length: 32,
    unique: true,
  })
  code!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name!: string;

  @Column({
    name: 'name_en',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  nameEn!: string | null;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  type!: string | null;

  @Column({
    name: 'sort_order',
    type: 'int',
    default: 0,
  })
  sortOrder!: number;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;
}
