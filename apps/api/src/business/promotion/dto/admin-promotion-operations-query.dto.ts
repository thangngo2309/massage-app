import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { UserRole } from '../../enums/business.enums.js';
import {
  ReferralStatus,
  UserVoucherSourceType,
  UserVoucherStatus,
} from '../../enums/promotion.enums.js';
import { WalletType } from '../../entities/wallet.entity.js';
import { WalletTransactionType } from '../../entities/wallet-transaction.entity.js';

export class AdminPagingQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsString()
  q?: string;
}

export class AdminPromotionUsageQueryDto extends AdminPagingQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) promotionId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) userId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) bookingId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) referralId?: number;
}

export class AdminReferralQueryDto extends AdminPagingQueryDto {
  @IsOptional() @IsEnum(ReferralStatus) status?: ReferralStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) referrerUserId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) referredUserId?: number;
}

export class AdminReferralCodeQueryDto extends AdminPagingQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) userId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}

export class AdminUserVoucherQueryDto extends AdminPagingQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) userId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) voucherId?: number;
  @IsOptional() @IsEnum(UserVoucherStatus) status?: UserVoucherStatus;
  @IsOptional()
  @IsEnum(UserVoucherSourceType)
  sourceType?: UserVoucherSourceType;
}

export class AdminWalletQueryDto extends AdminPagingQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) userId?: number;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsEnum(WalletType) walletType?: WalletType;
}

export class AdminWalletTransactionQueryDto extends AdminPagingQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) userId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) walletId?: number;
  @IsOptional() @IsEnum(WalletType) walletType?: WalletType;
  @IsOptional() @IsEnum(WalletTransactionType) type?: WalletTransactionType;
  @IsOptional() @IsString() referenceId?: string;
}
