import { IsBoolean } from 'class-validator';

export class UpdatePromotionActiveDto {
  @IsBoolean()
  isActive!: boolean;
}
