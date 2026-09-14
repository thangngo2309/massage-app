import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminUpdateRatingDto {
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string | null;
}
