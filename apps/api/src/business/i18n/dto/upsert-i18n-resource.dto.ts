import { IsString, Length, Matches } from 'class-validator';

export class UpsertI18nResourceDto {
  @IsString()
  @Length(2, 10)
  languageCode!: string;

  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  namespace!: string;

  @IsString()
  @Length(1, 255)
  @Matches(/^[a-zA-Z0-9_.-]+$/)
  key!: string;

  @IsString()
  value!: string;
}
