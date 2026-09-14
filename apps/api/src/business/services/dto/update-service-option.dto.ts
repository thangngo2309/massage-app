import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class UpdateServiceOptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  defaultPrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
