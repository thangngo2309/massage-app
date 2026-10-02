import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { InjectDataSource } from '@nestjs/typeorm';

import type { DataSource } from 'typeorm';

import { BookingService } from './booking.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { BookingQueryDto } from './dto/booking-query.dto.js';
import { CancelBookingDto } from './dto/change-booking-status.dto.js';

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

@Controller('bookings')
@Roles(UserRole.CLIENT)
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly businessI18nService: BusinessI18nService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: CurrentAuthUser,

    @Body() dto: CreateBookingDto,

    @Headers('accept-language')
    acceptLanguage?: string,
  ) {
    const booking = await this.bookingService.createClientBooking(
      user.sub,
      dto,
    );

    return localizeBookingItem(
      this.dataSource,
      this.businessI18nService,
      booking,
      acceptLanguage,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getList(
    @CurrentUser() user: CurrentAuthUser,

    @Query() query: BookingQueryDto,

    @Headers('accept-language')
    acceptLanguage?: string,
  ) {
    const response = await this.bookingService.getClientBookings(
      user.sub,
      query,
    );

    return localizeBookingListResponse(
      this.dataSource,
      this.businessI18nService,
      response,
      acceptLanguage,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getDetail(
    @CurrentUser() user: CurrentAuthUser,

    @Param('id', ParseIntPipe)
    id: number,

    @Headers('accept-language')
    acceptLanguage?: string,
  ) {
    const booking = await this.bookingService.getClientBooking(user.sub, id);

    return localizeBookingItem(
      this.dataSource,
      this.businessI18nService,
      booking,
      acceptLanguage,
    );
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(
    @CurrentUser() user: CurrentAuthUser,

    @Param('id', ParseIntPipe)
    id: number,

    @Body() dto: CancelBookingDto,

    @Headers('accept-language')
    acceptLanguage?: string,
  ) {
    const booking = await this.bookingService.cancelClientBooking(
      user.sub,
      id,
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
