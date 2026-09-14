import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export const THERAPIST_SEARCH_SORT_VALUES = [
  'distance',
  'rating',
  'price',
] as const;

export type TherapistSearchSort = (typeof THERAPIST_SEARCH_SORT_VALUES)[number];

export class SearchTherapistsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceOptionId: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be YYYY-MM-DD',
  })
  date: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be HH:mm',
  })
  startTime: string;

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

  @IsOptional()
  @IsString()
  provinceCode?: string;

  @IsOptional()
  @IsString()
  districtCode?: string;

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
