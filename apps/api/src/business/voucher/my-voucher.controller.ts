import {
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { UserRole } from '../enums/business.enums.js';
import { MyVoucherQueryDto } from './dto/my-voucher-query.dto.js';
import { VoucherService } from './voucher.service.js';

@Controller('vouchers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT, UserRole.THERAPIST)
export class MyVoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get('me')
  getMyVouchers(
    @CurrentUser()
    user: AuthUser,

    @Query()
    query: MyVoucherQueryDto,

    @Headers('accept-language')
    acceptLanguage?: string,
  ) {
    return this.voucherService.getMyVouchers(user.sub, query, acceptLanguage);
  }

  @Get('me/:id')
  getMyVoucher(
    @CurrentUser()
    user: AuthUser,

    @Param('id', ParseIntPipe)
    id: number,

    @Headers('accept-language')
    acceptLanguage?: string,
  ) {
    return this.voucherService.getMyVoucher(user.sub, id, acceptLanguage);
  }
}
