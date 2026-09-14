import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CheckTherapistAvailabilityQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceOptionId: number;

  @Matches(DATE_REGEX, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;

  @Matches(TIME_REGEX, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;
}

export class GetTherapistAvailabilitySlotsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceOptionId: number;

  @Matches(DATE_REGEX, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(120)
  slotInterval?: number = 30;
}
