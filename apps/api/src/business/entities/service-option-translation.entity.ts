import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { ServiceOption } from './service-option.entity.js';

@Entity('service_option_translations')
@Unique('uq_service_option_translations_option_locale', [
  'serviceOptionId',
  'locale',
])
@Index('idx_service_option_translations_locale', ['locale'])
export class ServiceOptionTranslation extends BaseEntity {
  @Column({
    name: 'service_option_id',
    type: 'int',
  })
  serviceOptionId!: number;

  @ManyToOne(() => ServiceOption, (option) => option.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'service_option_id',
  })
  serviceOption!: Relation<ServiceOption>;

  @Column({
    type: 'varchar',
    length: 20,
  })
  locale!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  label!: string;
}
