import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateI18nLanguageDto {
  @IsString()
  @Length(2, 10)
  @Matches(/^[a-zA-Z]{2,3}(?:-[a-zA-Z]{2,4})?$/)
  code!: string;

  @IsString()
  @Length(1, 100)
  name!: string;

  @IsString()
  @Length(1, 100)
  nativeName!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
