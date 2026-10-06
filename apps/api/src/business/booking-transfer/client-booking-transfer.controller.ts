import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';

import type { AuthUser } from '../auth/types/auth-user.type.js';

import { UserRole } from '../enums/business.enums.js';

import {
  RespondBookingTherapistTransferDto,
  SetBookingGroupTransferConsentDto,
} from './dto/booking-transfer.dto.js';

import { BookingTransferService } from './booking-transfer.service.js';

@Controller('client/booking-transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT)
export class ClientBookingTransferController {
  constructor(
    private readonly bookingTransferService: BookingTransferService,
  ) {}

  /**
   * Gọi ngay sau khi POST /bookings thành công.
   *
   * Lựa chọn allowed đã được khách
   * tick trước khi bấm xác nhận booking.
   */
  @Put('booking/:bookingId/consent')
  setConsent(
    @CurrentUser() user: AuthUser,

    @Param('bookingId', ParseIntPipe)
    bookingId: number,

    @Body()
    dto: SetBookingGroupTransferConsentDto,
  ) {
    return this.bookingTransferService.setClientConsent(
      user.sub,
      bookingId,
      dto.allowed,
    );
  }

  /**
   * Khách xem trạng thái chuyển hiện tại.
   */
  @Get('booking/:bookingId')
  getTransfer(
    @CurrentUser() user: AuthUser,

    @Param('bookingId', ParseIntPipe)
    bookingId: number,
  ) {
    return this.bookingTransferService.getClientTransfer(user.sub, bookingId);
  }

  /**
   * Khách xác nhận hoặc từ chối B.
   */
  @Patch(':transferId/respond')
  respond(
    @CurrentUser() user: AuthUser,

    @Param('transferId', ParseIntPipe)
    transferId: number,

    @Body()
    dto: RespondBookingTherapistTransferDto,
  ) {
    return this.bookingTransferService.respondByClient(
      user.sub,
      transferId,
      dto,
    );
  }
}
