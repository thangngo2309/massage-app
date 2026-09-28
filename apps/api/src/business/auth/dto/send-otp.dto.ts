import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phone!: string;
}
