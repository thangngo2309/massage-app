import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreateBookingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  therapistId!: number;

  /**
   * Các TherapistService mà khách chọn.
   *
   * Không nhận serviceOptionId trực tiếp nữa.
   *
   * Backend sẽ tự resolve:
   *
   * TherapistService
   * → ServiceOption
   * → Service
   * → duration
   * → price
   * → platformFeeRate
   */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsInt({
    each: true,
  })
  @Min(1, {
    each: true,
  })
  therapistServiceIds!: number[];

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be YYYY-MM-DD',
  })
  date!: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be HH:mm',
  })
  startTime!: string;

  @IsString()
  @MaxLength(1000)
  address!: string;

  /**
   * Dùng để re-check ServiceArea.
   *
   * Flow frontend mới nên gửi đầy đủ:
   *
   * provinceCode + wardCode
   * latitude + longitude
   */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  provinceCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  wardCode?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  clientNote?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userVoucherId?: number;
}
