import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;
}
