import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { Promotion } from './promotion.entity.js';

@Entity('promotion_translations')
@Unique('uq_promotion_translations_promotion_locale', ['promotionId', 'locale'])
@Index('idx_promotion_translations_locale', ['locale'])
export class PromotionTranslation extends BaseEntity {
  @Column({
    name: 'promotion_id',
    type: 'int',
  })
  promotionId!: number;

  @ManyToOne(() => Promotion, (promotion) => promotion.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'promotion_id',
  })
  promotion!: Relation<Promotion>;

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
