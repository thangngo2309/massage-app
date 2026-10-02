import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { InjectDataSource } from '@nestjs/typeorm';

import type { DataSource } from 'typeorm';

import { BookingService } from './booking.service.js';

import { AdminBookingQueryDto } from './dto/booking-query.dto.js';

import { ChangeBookingStatusDto } from './dto/change-booking-status.dto.js';

import {
  localizeBookingItem,
  localizeBookingListResponse,
} from './booking-localization.js';

import { BusinessI18nService } from '../business-i18n/business-i18n.service.js';

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
  constructor(
    private readonly bookingService: BookingService,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly businessI18nService: BusinessI18nService,
  ) {}

  @Get()
  async getList(
    @Query()
    query: AdminBookingQueryDto,

    @Headers('accept-language')
    acceptLanguage?: string,
  ) {
    const response = await this.bookingService.getAdminBookings(query);

    return localizeBookingListResponse(
      this.dataSource,
      this.businessI18nService,
      response,
      acceptLanguage,
    );
  }

  @Get(':id')
  async getDetail(
    @Param('id', ParseIntPipe)
    id: number,

    @Headers('accept-language')
    acceptLanguage?: string,
  ) {
    const booking = await this.bookingService.getAdminBooking(id);

    return localizeBookingItem(
      this.dataSource,
      this.businessI18nService,
      booking,
      acceptLanguage,
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: CurrentAuthUser,

    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: ChangeBookingStatusDto,

    @Headers('accept-language')
    acceptLanguage?: string,
  ) {
    const booking = await this.bookingService.updateAdminBookingStatus(
      user.sub,
      id,
      dto.status,
      dto.reason,
    );

    return localizeBookingItem(
      this.dataSource,
      this.businessI18nService,
      booking,
      acceptLanguage,
    );
  }
}
