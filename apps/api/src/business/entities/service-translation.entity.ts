import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { MassageService } from './service.entity.js';

@Entity('service_translations')
@Unique('uq_service_translations_service_locale', ['serviceId', 'locale'])
@Index('idx_service_translations_locale', ['locale'])
export class ServiceTranslation extends BaseEntity {
  @Column({
    name: 'service_id',
    type: 'int',
  })
  serviceId!: number;

  @ManyToOne(() => MassageService, (service) => service.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'service_id',
  })
  service!: Relation<MassageService>;

  @Column({
    type: 'varchar',
    length: 20,
  })
  locale!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;
}
