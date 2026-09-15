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

import { BookingService } from './booking.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { BookingQueryDto } from './dto/booking-query.dto.js';
import { CancelBookingDto } from './dto/change-booking-status.dto.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { UserRole } from '../enums/business.enums.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';

type CurrentAuthUser = {
  sub: number;
  role: UserRole;
  type: 'access';
};

@Controller('bookings')
@Roles(UserRole.CLIENT)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: CurrentAuthUser,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingService.createClientBooking(user.sub, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getList(
    @CurrentUser() user: CurrentAuthUser,
    @Query() query: BookingQueryDto,
  ) {
    return this.bookingService.getClientBookings(user.sub, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getDetail(
    @CurrentUser() user: CurrentAuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingService.getClientBooking(user.sub, id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(
    @CurrentUser() user: CurrentAuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancelClientBooking(user.sub, id, dto.reason);
  }
}
