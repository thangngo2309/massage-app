import { Type } from 'class-transformer';

import {
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class TherapistWorkingHourItemDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;

  @IsBoolean()
  isActive: boolean;
}

export class ReplaceTherapistWorkingHoursDto {
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => TherapistWorkingHourItemDto)
  items: TherapistWorkingHourItemDto[];
}
