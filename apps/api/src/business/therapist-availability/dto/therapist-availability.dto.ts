import { Transform, Type } from 'class-transformer';

import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Hỗ trợ cả:
 *
 * ?therapistServiceIds=1,2,3
 *
 * và:
 *
 * ?therapistServiceIds=1&therapistServiceIds=2
 */
const transformTherapistServiceIds = ({
  value,
}: {
  value: unknown;
}): unknown => {
  if (value === undefined || value === null || value === '') {
    return value;
  }

  const rawValues = Array.isArray(value) ? value : [value];

  return rawValues
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item));
};

export class CheckTherapistAvailabilityQueryDto {
  /**
   * ID của TherapistService, không phải ServiceOption.
   *
   * Một booking có thể chọn nhiều dịch vụ.
   */
  @Transform(transformTherapistServiceIds)
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

  @Matches(DATE_REGEX, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string;

  @Matches(TIME_REGEX, {
    message: 'startTime must be in HH:mm format',
  })
  startTime!: string;
}

export class GetTherapistAvailabilitySlotsQueryDto {
  /**
   * ID của TherapistService, không phải ServiceOption.
   */
  @Transform(transformTherapistServiceIds)
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

  @Matches(DATE_REGEX, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(120)
  slotInterval?: number = 30;
}
