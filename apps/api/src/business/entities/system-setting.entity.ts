import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from './base.entity.js';

export enum SystemSettingValueType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

@Entity('system_settings')
@Index('UQ_system_settings_key', ['key'], {
  unique: true,
})
export class SystemSetting extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
  })
  key!: string;

  @Column({
    type: 'text',
  })
  value!: string;

  @Column({
    name: 'value_type',
    type: 'enum',
    enum: SystemSettingValueType,
    enumName: 'system_setting_value_type_enum',
    default: SystemSettingValueType.STRING,
  })
  valueType!: SystemSettingValueType;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  description!: string | null;

  @Column({
    name: 'is_public',
    type: 'boolean',
    default: false,
  })
  isPublic!: boolean;
}
