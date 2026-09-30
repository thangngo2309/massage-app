import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  PromotionAudience,
  PromotionRewardRecipient,
  PromotionRewardType,
  PromotionTriggerType,
} from '../../enums/promotion.enums.js';
import { PromotionTranslationDto } from './promotion-translation.dto.js';

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsEnum(PromotionAudience)
  audience?: PromotionAudience;

  @IsOptional()
  @IsEnum(PromotionTriggerType)
  triggerType?: PromotionTriggerType;

  @IsOptional()
  @IsEnum(PromotionRewardType)
  rewardType?: PromotionRewardType;

  @IsOptional()
  @IsEnum(PromotionRewardRecipient)
  rewardRecipient?: PromotionRewardRecipient;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  rewardValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  voucherId?: number | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimitPerUser?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({
    each: true,
  })
  @Type(() => PromotionTranslationDto)
  translations?: PromotionTranslationDto[];
}
