import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';

import { UserRole } from '../enums/business.enums.js';

import { UpdateTherapistSelfProfileDto } from './dto/update-therapist-self-profile.dto.js';
import { UpdateTherapistAcceptingDto } from './dto/update-therapist-accepting.dto.js';
import { UpdateTherapistSelfServiceDto } from './dto/update-therapist-self-service.dto.js';
import { CreateTherapistScheduleExceptionDto } from './dto/create-therapist-schedule-exception.dto.js';
import { ReplaceTherapistWorkingHoursDto } from './dto/therapist-working-hour-item.dto.js';
import { TherapistSelfService } from './therapist-self.service.js';

type CurrentAuthUser = {
  sub: number;

  role: UserRole;

  type: 'access';
};

@Controller('therapist/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.THERAPIST)
export class TherapistSelfController {
  constructor(private readonly therapistSelfService: TherapistSelfService) {}

  @Get()
  getProfile(
    @CurrentUser()
    user: CurrentAuthUser,
  ) {
    return this.therapistSelfService.getProfile(user.sub);
  }

  @Patch()
  updateProfile(
    @CurrentUser()
    user: CurrentAuthUser,

    @Body()
    dto: UpdateTherapistSelfProfileDto,
  ) {
    return this.therapistSelfService.updateProfile(user.sub, dto);
  }

  @Patch('accepting-bookings')
  updateAccepting(
    @CurrentUser()
    user: CurrentAuthUser,

    @Body()
    dto: UpdateTherapistAcceptingDto,
  ) {
    return this.therapistSelfService.updateAcceptingBookings(user.sub, dto);
  }

  @Get('services')
  getServices(
    @CurrentUser()
    user: CurrentAuthUser,
  ) {
    return this.therapistSelfService.getServices(user.sub);
  }

  @Patch('services/:id')
  updateService(
    @CurrentUser()
    user: CurrentAuthUser,

    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateTherapistSelfServiceDto,
  ) {
    return this.therapistSelfService.updateService(user.sub, id, dto);
  }

  @Get('working-hours')
  getWorkingHours(
    @CurrentUser()
    user: CurrentAuthUser,
  ) {
    return this.therapistSelfService.getWorkingHours(user.sub);
  }

  @Put('working-hours')
  replaceWorkingHours(
    @CurrentUser()
    user: CurrentAuthUser,

    @Body()
    dto: ReplaceTherapistWorkingHoursDto,
  ) {
    return this.therapistSelfService.replaceWorkingHours(user.sub, dto);
  }

  @Get('schedule-exceptions')
  getExceptions(
    @CurrentUser()
    user: CurrentAuthUser,
  ) {
    return this.therapistSelfService.getScheduleExceptions(user.sub);
  }

  @Post('schedule-exceptions')
  createException(
    @CurrentUser()
    user: CurrentAuthUser,

    @Body()
    dto: CreateTherapistScheduleExceptionDto,
  ) {
    return this.therapistSelfService.createScheduleException(user.sub, dto);
  }

  @Delete('schedule-exceptions/:id')
  deleteException(
    @CurrentUser()
    user: CurrentAuthUser,

    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.therapistSelfService.deleteScheduleException(user.sub, id);
  }
}
