import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class TherapistImageOrderItemDto {
  @IsInt()
  @Min(1)
  id!: number;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class UpdateTherapistImageOrderDto {
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({
    each: true,
  })
  @Type(() => TherapistImageOrderItemDto)
  items!: TherapistImageOrderItemDto[];
}
