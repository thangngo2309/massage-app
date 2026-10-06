import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class SetBookingGroupTransferConsentDto {
  @IsBoolean()
  allowed!: boolean;
}

export class CreateBookingTherapistTransferDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  toTherapistId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class RespondBookingTherapistTransferDto {
  @IsBoolean()
  accepted!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
