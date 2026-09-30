import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertServiceTranslationDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
