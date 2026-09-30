import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { UserRole } from '../enums/business.enums.js';
import { ApplyReferralCodeDto } from './dto/apply-referral-code.dto.js';
import { ReferralService } from './referral.service.js';

@Controller('referrals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT, UserRole.THERAPIST)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('me')
  getMe(
    @CurrentUser()
    user: AuthUser,
  ) {
    return this.referralService.getMyReferralInfo(user.sub);
  }

  @Post('code')
  getOrCreateCode(
    @CurrentUser()
    user: AuthUser,
  ) {
    return this.referralService.getOrCreateReferralCode(user.sub);
  }

  @Post('validate')
  validate(
    @CurrentUser()
    user: AuthUser,

    @Body()
    dto: ApplyReferralCodeDto,
  ) {
    return this.referralService.validateReferralCode(user.sub, dto.code);
  }

  @Post('apply')
  apply(
    @CurrentUser()
    user: AuthUser,

    @Body()
    dto: ApplyReferralCodeDto,
  ) {
    return this.referralService.applyReferralCode(user.sub, dto.code);
  }
}
