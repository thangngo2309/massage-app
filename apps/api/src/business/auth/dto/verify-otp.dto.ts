import {
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
