import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { I18nLanguage } from './i18n-language.entity.js';

@Entity('i18n_resources')
@Index(
  'UQ_i18n_resources_language_namespace_key',
  ['languageId', 'namespace', 'key'],
  {
    unique: true,
  },
)
export class I18nResource extends BaseEntity {
  @Column({
    name: 'language_id',
    type: 'integer',
  })
  languageId!: number;

  @ManyToOne(() => I18nLanguage, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'language_id',
  })
  language!: Relation<I18nLanguage>;

  @Column({
    type: 'varchar',
    length: 100,
  })
  namespace!: string;

  /**
   * Ví dụ:
   *
   * save
   * status.completed
   * form.phone.label
   *
   * Không lưu:
   * booking.status.completed
   *
   * vì namespace đã là booking.
   */
  @Column({
    type: 'varchar',
    length: 255,
  })
  key!: string;

  @Column({
    type: 'text',
  })
  value!: string;
}
