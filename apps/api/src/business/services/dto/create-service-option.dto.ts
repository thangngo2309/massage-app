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

export class CreateServiceOptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  defaultPrice!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
