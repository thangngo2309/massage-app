import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { BookingStatus } from '../../enums/business.enums.js';

export class ChangeBookingStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}

export class CancelBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
