import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { Type } from 'class-transformer';

import { Gender, UserRole } from '../../enums/business.enums.js';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName!: string;

  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsIn([UserRole.CLIENT, UserRole.THERAPIST])
  role!: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;

  /**
   * Mã giới thiệu của user khác.
   *
   * Chỉ ghi nhận quan hệ Referral khi đăng ký.
   * Phần thưởng chỉ được phát sau khi user verify OTP thành công.
   */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  referralCode?: string;

  /**
   * =========================================
   * THERAPIST PROFILE
   * =========================================
   *
   * Các field này optional ở DTO vì CLIENT
   * cũng dùng endpoint register.
   */

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
}
