import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  /**
   * Có thể là phone hoặc email.
   */
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  login!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;
}
