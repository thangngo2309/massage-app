import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class VoucherTranslationDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  terms?: string | null;
}
