import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class EligibleVoucherQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  therapistId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceOptionId!: number;
}
