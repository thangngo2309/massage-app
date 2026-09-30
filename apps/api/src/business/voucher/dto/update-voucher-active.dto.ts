import { IsBoolean } from 'class-validator';

export class UpdateVoucherActiveDto {
  @IsBoolean()
  isActive!: boolean;
}
