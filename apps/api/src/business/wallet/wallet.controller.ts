import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';

import { CreateWalletTopupDto } from './dto/create-wallet-topup.dto.js';
import { WalletService } from './wallet.service.js';
import { VnpayService } from '../vnpay/vnpay.service.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly vnpayService: VnpayService,
  ) {}

  @Get('me')
  getMyWallet(@CurrentUser() currentUser: AuthUser) {
    return this.walletService.getMyWallet(currentUser.sub);
  }

  @Get('transactions')
  getMyTransactions(@CurrentUser() currentUser: AuthUser) {
    return this.walletService.getMyTransactions(currentUser.sub);
  }

  @Post('topup')
  createTopup(
    @CurrentUser() currentUser: AuthUser,
    @Body() dto: CreateWalletTopupDto,
    @Headers('x-forwarded-for')
    forwardedFor: string | undefined,
    @Ip() ip: string,
  ) {
    return this.vnpayService.createTopupPayment(
      currentUser.sub,
      dto.amount,
      forwardedFor ?? ip,
    );
  }
}
