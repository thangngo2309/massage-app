import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class AdminGrantUserVoucherDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  voucherId!: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}
