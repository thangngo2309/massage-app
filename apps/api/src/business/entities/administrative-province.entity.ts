import { Column, Entity, Index, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { AdministrativeWard } from './administrative-ward.entity.js';

@Entity('administrative_provinces')
@Index('idx_administrative_provinces_active_sort', [
  'isActive',
  'sortOrder',
  'name',
])
export class AdministrativeProvince extends BaseEntity {
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

  @OneToMany(() => AdministrativeWard, (ward) => ward.province)
  wards!: Relation<AdministrativeWard[]>;
}
