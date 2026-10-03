import { Type } from 'class-transformer';

import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const THERAPIST_SEARCH_SORT_VALUES = [
  'distance',
  'rating',
  'price',
] as const;

export type TherapistSearchSort =
  (typeof THERAPIST_SEARCH_SORT_VALUES)[number];

export class SearchTherapistsQueryDto {
  /**
   * Service mà khách hàng đang muốn tìm.
   *
   * Không chọn ServiceOption ở bước search KTV nữa.
   */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceId: number;

  /**
   * Tọa độ địa chỉ phục vụ.
   *
   * latitude + longitude phải được gửi cùng nhau.
   *
   * Tọa độ được dùng để:
   * - kiểm tra service area kiểu radius
   * - tính khoảng cách từ khách đến KTV
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  /**
   * Khu vực hành chính mà khách hàng đã chọn.
   *
   * Dùng để match TherapistServiceArea kiểu ward.
   */
  @IsOptional()
  @IsString()
  provinceCode?: string;

  @IsOptional()
  @IsString()
  wardCode?: string;

  @IsOptional()
  @IsIn(THERAPIST_SEARCH_SORT_VALUES)
  sortBy?: TherapistSearchSort = 'distance';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}