import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { Voucher } from './voucher.entity.js';

@Entity('voucher_translations')
@Unique('uq_voucher_translations_voucher_locale', ['voucherId', 'locale'])
@Index('idx_voucher_translations_locale', ['locale'])
export class VoucherTranslation extends BaseEntity {
  @Column({
    name: 'voucher_id',
    type: 'int',
  })
  voucherId!: number;

  @ManyToOne(() => Voucher, (voucher) => voucher.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'voucher_id',
  })
  voucher!: Relation<Voucher>;

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

  @Column({
    type: 'text',
    nullable: true,
  })
  terms!: string | null;
}
