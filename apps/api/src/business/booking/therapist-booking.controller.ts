import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';

import { BookingService } from './booking.service.js';
import { BookingQueryDto } from './dto/booking-query.dto.js';
import { ChangeBookingStatusDto } from './dto/change-booking-status.dto.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { UserRole } from '../enums/business.enums.js';

type CurrentAuthUser = {
  sub: number;
  role: UserRole;
  type: 'access';
};

@Controller('therapist/bookings')
@Roles(UserRole.THERAPIST)
export class TherapistBookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  getList(
    @CurrentUser() user: CurrentAuthUser,
    @Query() query: BookingQueryDto,
  ) {
    return this.bookingService.getTherapistBookings(user.sub, query);
  }

  @Get(':id')
  getDetail(
    @CurrentUser() user: CurrentAuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingService.getTherapistBooking(user.sub, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: CurrentAuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeBookingStatusDto,
  ) {
    return this.bookingService.updateTherapistBookingStatus(
      user.sub,
      id,
      dto.status,
      dto.reason,
    );
  }
}
