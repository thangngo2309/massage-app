import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class GetI18nResourcesQueryDto {
  @IsString()
  @Length(2, 10)
  lang!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/)
  namespace?: string;
}
