import { IsBoolean, IsNumber, Min } from 'class-validator';

export class UpdateTherapistSelfServiceDto {
  @IsNumber()
  @Min(0)
  price: number;

  @IsBoolean()
  isActive: boolean;
}
