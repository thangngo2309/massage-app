import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';
import { TherapistServiceAreaType } from '../../enums/business.enums.js';

export class CreateServiceAreaDto {
  @IsEnum(TherapistServiceAreaType)
  type!: TherapistServiceAreaType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  areaName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  provinceCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  districtCode?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  centerLatitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  centerLongitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(500)
  radiusKm?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
