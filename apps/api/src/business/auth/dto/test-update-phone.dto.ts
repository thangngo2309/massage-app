import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

import { Type } from 'class-transformer';

export class TestUpdatePhoneDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @IsString()
  @MinLength(9)
  @MaxLength(20)
  newPhone!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  testSecret!: string;
}
