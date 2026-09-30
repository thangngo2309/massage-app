import { IsString, MaxLength } from 'class-validator';

export class UpsertServiceOptionTranslationDto {
  @IsString()
  @MaxLength(255)
  label!: string;
}
