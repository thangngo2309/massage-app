import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { TherapistProfile } from './therapist-profile.entity.js';

@Entity('therapist_images')
@Index('idx_therapist_images_therapist_id', ['therapistId'])
@Index('idx_therapist_images_therapist_sort', ['therapistId', 'sortOrder'])
@Index('uq_therapist_images_storage_path', ['storagePath'], {
  unique: true,
})
export class TherapistImage extends BaseEntity {
  @Column({
    name: 'therapist_id',
    type: 'int',
  })
  therapistId!: number;

  @ManyToOne(() => TherapistProfile, (therapist) => therapist.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'therapist_id',
  })
  therapist!: Relation<TherapistProfile>;

  @Column({
    name: 'image_url',
    type: 'text',
  })
  imageUrl!: string;

  @Column({
    name: 'storage_path',
    type: 'text',
  })
  storagePath!: string;

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
