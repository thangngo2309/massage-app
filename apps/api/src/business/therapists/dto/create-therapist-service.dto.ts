import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreateTherapistServiceDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceOptionId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  platformFeeRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
