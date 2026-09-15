import { IsBoolean } from 'class-validator';

export class UpdateTherapistAcceptingDto {
  @IsBoolean()
  isAcceptingBookings: boolean;
}
