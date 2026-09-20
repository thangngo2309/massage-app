import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminI18nResourceQueryDto {
  @IsString()
  lang!: string;

  @IsOptional()
  @IsString()
  namespace?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 50;
}
