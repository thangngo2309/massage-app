import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { BookingService } from './booking.service.js';
import { AdminBookingQueryDto } from './dto/booking-query.dto.js';
import { ChangeBookingStatusDto } from './dto/change-booking-status.dto.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { UserRole } from '../enums/business.enums.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';

type CurrentAuthUser = {
  sub: number;
  role: UserRole;
  type: 'access';
};

@Controller('admin/bookings')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
export class AdminBookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getList(
    @Query() query: AdminBookingQueryDto,
  ) {
    return this.bookingService.getAdminBookings(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getDetail(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingService.getAdminBooking(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @CurrentUser() user: CurrentAuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeBookingStatusDto,
  ) {
    return this.bookingService.updateAdminBookingStatus(
      user.sub,
      id,
      dto.status,
      dto.reason,
    );
  }
}
