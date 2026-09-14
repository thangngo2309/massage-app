import {
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

  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceOptionId!: number;

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
   * Không lưu vào Booking vì entity hiện tại
   * không có 2 field này.
   *
   * Chỉ dùng để re-check ServiceArea.
   */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  provinceCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  districtCode?: string;

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
}
