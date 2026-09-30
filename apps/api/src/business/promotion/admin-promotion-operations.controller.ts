import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { UserRole } from '../enums/business.enums.js';
import { AdminGrantUserVoucherDto } from './dto/admin-grant-user-voucher.dto.js';
import {
  AdminPromotionUsageQueryDto,
  AdminReferralCodeQueryDto,
  AdminReferralQueryDto,
  AdminUserVoucherQueryDto,
  AdminWalletQueryDto,
  AdminWalletTransactionQueryDto,
} from './dto/admin-promotion-operations-query.dto.js';
import { AdminPromotionOperationsService } from './admin-promotion-operations.service.js';

@Controller('admin/promotion-operations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
export class AdminPromotionOperationsController {
  constructor(private readonly service: AdminPromotionOperationsService) {}

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Get('promotion-usages')
  getPromotionUsages(@Query() query: AdminPromotionUsageQueryDto) {
    return this.service.getPromotionUsages(query);
  }

  @Get('referrals')
  getReferrals(@Query() query: AdminReferralQueryDto) {
    return this.service.getReferrals(query);
  }

  @Get('referral-codes')
  getReferralCodes(@Query() query: AdminReferralCodeQueryDto) {
    return this.service.getReferralCodes(query);
  }

  @Get('user-vouchers')
  getUserVouchers(@Query() query: AdminUserVoucherQueryDto) {
    return this.service.getUserVouchers(query);
  }

  @Post('user-vouchers/grant')
  grantUserVoucher(
    @CurrentUser() user: AuthUser,
    @Body() dto: AdminGrantUserVoucherDto,
  ) {
    return this.service.grantUserVoucher(user.sub, dto);
  }

  @Patch('user-vouchers/:id/cancel')
  cancelUserVoucher(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancelUserVoucher(id);
  }

  @Get('wallets')
  getWallets(@Query() query: AdminWalletQueryDto) {
    return this.service.getWallets(query);
  }

  @Get('wallet-transactions')
  getWalletTransactions(@Query() query: AdminWalletTransactionQueryDto) {
    return this.service.getWalletTransactions(query);
  }
}
