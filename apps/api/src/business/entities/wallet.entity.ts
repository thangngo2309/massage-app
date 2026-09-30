import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';

import { BaseEntity } from './base.entity.js';
import { User } from './user.entity.js';

export enum WalletType {
  MAIN = 'main',
  PROMOTION = 'promotion',
}

@Entity('wallets')
@Index('UQ_wallets_user_type', ['userId', 'type'], {
  unique: true,
})
export class Wallet extends BaseEntity {
  @Column({
    name: 'user_id',
    type: 'int',
  })
  userId!: number;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user!: Relation<User>;

  @Column({
    type: 'enum',
    enum: WalletType,
    enumName: 'wallet_type_enum',
    default: WalletType.MAIN,
  })
  type!: WalletType;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  balance!: number;
}
