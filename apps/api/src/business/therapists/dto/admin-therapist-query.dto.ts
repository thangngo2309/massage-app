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

const transformQueryBoolean = (
  value: unknown,
): boolean | undefined | unknown => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }

    if (normalized === '') {
      return undefined;
    }
  }

  /**
   * Giữ nguyên giá trị không hợp lệ để @IsBoolean()
   * phía dưới trả validation error thay vì âm thầm convert.
   */
  return value;
};

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
  @Transform(
    ({ obj }) => {
      /**
       * QUAN TRỌNG:
       *
       * Project đang bật:
       *
       * enableImplicitConversion: true
       *
       * nên nếu dùng:
       *
       * @Transform(({ value }) => ...)
       *
       * thì query string:
       *
       * "false"
       *
       * có thể đã bị convert trước thành:
       *
       * Boolean("false") === true
       *
       * Vì vậy ở đây phải lấy RAW VALUE trực tiếp
       * từ plain query object.
       */
      const rawValue = (obj as Record<string, unknown>).isAcceptingBookings;

      return transformQueryBoolean(rawValue);
    },
    {
      toClassOnly: true,
    },
  )
  @IsBoolean()
  isAcceptingBookings?: boolean;
}
