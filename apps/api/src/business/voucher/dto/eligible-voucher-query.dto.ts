import { Transform, Type } from 'class-transformer';

import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

const transformTherapistServiceIds = ({
  value,
}: {
  value: unknown;
}): unknown => {
  if (value === undefined || value === null || value === '') {
    return value;
  }

  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item));
};

export class EligibleVoucherQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  therapistId!: number;

  /**
   * Các TherapistService mà khách đã chọn.
   *
   * Hỗ trợ:
   *
   * ?therapistServiceIds=10,15,20
   *
   * hoặc:
   *
   * ?therapistServiceIds=10
   * &therapistServiceIds=15
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
}
