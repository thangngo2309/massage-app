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

export class CreateWorkingHourDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @Matches(TIME_REGEX)
  startTime!: string;

  @Matches(TIME_REGEX)
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
