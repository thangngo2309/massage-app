import {
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export class UpdateWorkingHourDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @Matches(TIME_REGEX)
  startTime?: string;

  @IsOptional()
  @Matches(TIME_REGEX)
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
