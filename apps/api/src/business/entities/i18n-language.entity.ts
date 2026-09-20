import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from './base.entity.js';

@Entity('i18n_languages')
@Index('UQ_i18n_languages_code', ['code'], {
  unique: true,
})
export class I18nLanguage extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 10,
  })
  code!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  name!: string;

  @Column({
    name: 'native_name',
    type: 'varchar',
    length: 100,
  })
  nativeName!: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @Column({
    name: 'is_default',
    type: 'boolean',
    default: false,
  })
  isDefault!: boolean;

  /**
   * Tăng mỗi lần DB override thay đổi.
   *
   * API version thực tế:
   * revision + hash của resource JSON BE.
   */
  @Column({
    type: 'integer',
    default: 1,
  })
  revision!: number;
}
