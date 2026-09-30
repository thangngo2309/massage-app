import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class PromotionTranslationDto {
  @IsString()
  @Length(2, 20)
  locale!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;
}
