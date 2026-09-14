import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

import {
  TherapistOnlineStatus,
  TherapistVerificationStatus,
} from '../../enums/business.enums.js';

export class AdminTherapistQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(TherapistVerificationStatus)
  verificationStatus?: TherapistVerificationStatus;

  @IsOptional()
  @IsEnum(TherapistOnlineStatus)
  onlineStatus?: TherapistOnlineStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') {
      return undefined;
    }

    if (value === true || value === 'true') {
      return true;
    }

    if (value === false || value === 'false') {
      return false;
    }

    return value;
  })
  @IsBoolean()
  isAcceptingBookings?: boolean;
}
