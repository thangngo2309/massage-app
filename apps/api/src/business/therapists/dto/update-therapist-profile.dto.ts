import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

import { Gender } from '../../enums/business.enums.js';

export class UpdateTherapistProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  bio?: string | null;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  stageName?: string | null;

  @IsOptional()
  @IsBoolean()
  hasTattoo?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  experienceYears?: number;

  @IsOptional()
  @IsBoolean()
  isAcceptingBookings?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500)
  serviceRadiusKm?: number;
}
