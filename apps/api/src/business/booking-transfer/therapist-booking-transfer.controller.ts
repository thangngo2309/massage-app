import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';

import type { AuthUser } from '../auth/types/auth-user.type.js';

import { UserRole } from '../enums/business.enums.js';

import {
  CreateBookingTherapistTransferDto,
  RespondBookingTherapistTransferDto,
} from './dto/booking-transfer.dto.js';

import { BookingTransferService } from './booking-transfer.service.js';

@Controller('therapist/booking-transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.THERAPIST)
export class TherapistBookingTransferController {
  constructor(
    private readonly bookingTransferService: BookingTransferService,
  ) {}

  /**
   * Danh sách yêu cầu A/B đang xử lý
   * mà B là người được đề xuất nhận.
   */
  @Get('incoming')
  getIncoming(@CurrentUser() user: AuthUser) {
    return this.bookingTransferService.getIncomingTransfers(user.sub);
  }

  /**
   * A xem các KTV trong cùng nhóm
   * có khả năng nhận booking.
   */
  @Get('booking/:bookingId/candidates')
  getCandidates(
    @CurrentUser() user: AuthUser,

    @Param('bookingId', ParseIntPipe)
    bookingId: number,
  ) {
    return this.bookingTransferService.getTransferCandidates(
      user.sub,
      bookingId,
    );
  }

  /**
   * A gửi đề nghị chuyển sang B.
   */
  @Post('booking/:bookingId')
  createTransfer(
    @CurrentUser() user: AuthUser,

    @Param('bookingId', ParseIntPipe)
    bookingId: number,

    @Body()
    dto: CreateBookingTherapistTransferDto,
  ) {
    return this.bookingTransferService.createTransfer(user.sub, bookingId, dto);
  }

  /**
   * B xác nhận hoặc từ chối
   * đề nghị chuyển từ A.
   */
  @Patch(':transferId/respond')
  respond(
    @CurrentUser() user: AuthUser,

    @Param('transferId', ParseIntPipe)
    transferId: number,

    @Body()
    dto: RespondBookingTherapistTransferDto,
  ) {
    return this.bookingTransferService.respondByTherapist(
      user.sub,
      transferId,
      dto,
    );
  }

  /**
   * Sau khi khách đã đồng ý B,
   * B bấm nhận booking chính thức.
   */
  @Post(':transferId/accept-booking')
  acceptBooking(
    @CurrentUser() user: AuthUser,

    @Param('transferId', ParseIntPipe)
    transferId: number,
  ) {
    return this.bookingTransferService.acceptTransferredBooking(
      user.sub,
      transferId,
    );
  }
}
