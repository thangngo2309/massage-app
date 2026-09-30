import {
  Column,
  Entity,
  OneToMany,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { ServiceOption } from './service-option.entity.js';
import { ServiceTranslation } from './service-translation.entity.js';

@Entity('services')
@Unique(
  'uq_services_slug',
  ['slug'],
)
export class MassageService extends BaseEntity {
  /**
   * Nội dung mặc định/fallback.
   *
   * Giữ lại để tương thích với API hiện tại.
   */
  @Column({
    type: 'varchar',
    length: 255,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  slug!: string;

  /**
   * Nội dung mặc định/fallback.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @Column({
    name: 'image_url',
    type: 'text',
    nullable: true,
  })
  imageUrl!: string | null;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @Column({
    name: 'sort_order',
    type: 'int',
    default: 0,
  })
  sortOrder!: number;

  @OneToMany(
    () => ServiceOption,
    (option) => option.service,
  )
  options!: Relation<ServiceOption[]>;

  @OneToMany(
    () => ServiceTranslation,
    (translation) => translation.service,
  )
  translations!: Relation<ServiceTranslation[]>;
}