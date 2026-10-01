import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import type { Request } from 'express';

import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';

import type { AuthUser } from './types/auth-user.type.js';

import { AuthService } from './auth.service.js';

import { LoginDto } from './dto/login.dto.js';

import { LogoutDto } from './dto/logout.dto.js';

import { RefreshTokenDto } from './dto/refresh-token.dto.js';

import { RegisterDto } from './dto/register.dto.js';

import { OtpService } from './otp.service.js';

import { SendOtpDto } from './dto/send-otp.dto.js';

import { VerifyOtpDto } from './dto/verify-otp.dto.js';

import { TestUpdatePhoneDto } from './dto/test-update-phone.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,

    private readonly otpService: OtpService,
  ) {}

  @Post('register')
  register(
    @Body() dto: RegisterDto,

    @Req() request: Request,
  ) {
    return this.authService.register(dto, {
      ipAddress: this.getRequestIp(request),
    });
  }

  @Post('otp/send')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendRegistrationOtp(dto.phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyRegistrationOtp(dto.phone, dto.code);
  }

  /**
   * ============================================================
   * TEST ONLY - UPDATE PHONE
   * ============================================================
   *
   * Public endpoint chỉ phục vụ DEV/TEST.
   *
   * Không yêu cầu JWT.
   *
   * Bắt buộc:
   *
   * - APP_ENV !== production
   * - testSecret === TEST_API_SECRET
   */
  @Post('test/update-phone')
  testUpdatePhone(@Body() dto: TestUpdatePhoneDto) {
    return this.authService.updatePhoneForTest({
      userId: dto.userId,

      newPhone: dto.newPhone,

      testSecret: dto.testSecret,
    });
  }

  @Post('login')
  login(
    @Body() dto: LoginDto,

    @Req() request: Request,
  ) {
    return this.authService.login(dto, {
      ipAddress: this.getRequestIp(request),
    });
  }

  @Post('refresh')
  refresh(
    @Body() dto: RefreshTokenDto,

    @Req() request: Request,
  ) {
    return this.authService.refresh(dto, {
      ipAddress: this.getRequestIp(request),
    });
  }

  @Post('logout')
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() currentUser: AuthUser) {
    return this.authService.me(currentUser.sub);
  }

  private getRequestIp(request: Request): string | null {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0]?.trim() || null;
    }

    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0] ?? null;
    }

    return request.ip ?? null;
  }
}
