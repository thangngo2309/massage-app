import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../shared/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';
import { UserRole } from '../enums/business.enums.js';
import { TherapistsService } from './therapists.service.js';
import { AdminTherapistQueryDto } from './dto/admin-therapist-query.dto.js';
import { UpdateTherapistProfileDto } from './dto/update-therapist-profile.dto.js';
import { UpdateTherapistVerificationDto } from './dto/update-therapist-verification.dto.js';
import { CreateTherapistServiceDto } from './dto/create-therapist-service.dto.js';
import { UpdateTherapistServiceDto } from './dto/update-therapist-service.dto.js';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto.js';
import { UpdateWorkingHourDto } from './dto/update-working-hour.dto.js';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto.js';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto.js';
import { CreateServiceAreaDto } from './dto/create-service-area.dto.js';
import { UpdateServiceAreaDto } from './dto/update-service-area.dto.js';

@Controller('admin/therapists')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
export class TherapistsController {
  constructor(private readonly therapistsService: TherapistsService) {}

  @Get('lookups/service-options')
  getServiceOptionsLookup() {
    return this.therapistsService.getServiceOptionsLookup();
  }

  @Get()
  findAll(@Query() query: AdminTherapistQueryDto) {
    return this.therapistsService.findAll(query);
  }

  @Get(':userId')
  findOne(@Param('userId', ParseIntPipe) userId: number) {
    return this.therapistsService.findOne(userId);
  }

  @Patch(':userId/profile')
  updateProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateTherapistProfileDto,
  ) {
    return this.therapistsService.updateProfile(userId, dto);
  }

  @Patch(':userId/verification')
  updateVerification(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateTherapistVerificationDto,
  ) {
    return this.therapistsService.updateVerification(userId, dto);
  }

  @Post(':userId/services')
  createService(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateTherapistServiceDto,
  ) {
    return this.therapistsService.createService(userId, dto);
  }

  @Patch(':userId/services/:itemId')
  updateService(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateTherapistServiceDto,
  ) {
    return this.therapistsService.updateService(userId, itemId, dto);
  }

  @Post(':userId/working-hours')
  createWorkingHour(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateWorkingHourDto,
  ) {
    return this.therapistsService.createWorkingHour(userId, dto);
  }

  @Patch(':userId/working-hours/:itemId')
  updateWorkingHour(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateWorkingHourDto,
  ) {
    return this.therapistsService.updateWorkingHour(userId, itemId, dto);
  }

  @Delete(':userId/working-hours/:itemId')
  deleteWorkingHour(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.therapistsService.deleteWorkingHour(userId, itemId);
  }

  @Post(':userId/schedule-exceptions')
  createScheduleException(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateScheduleExceptionDto,
  ) {
    return this.therapistsService.createScheduleException(userId, dto);
  }

  @Patch(':userId/schedule-exceptions/:itemId')
  updateScheduleException(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateScheduleExceptionDto,
  ) {
    return this.therapistsService.updateScheduleException(userId, itemId, dto);
  }

  @Delete(':userId/schedule-exceptions/:itemId')
  deleteScheduleException(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.therapistsService.deleteScheduleException(userId, itemId);
  }

  @Post(':userId/service-areas')
  createServiceArea(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateServiceAreaDto,
  ) {
    return this.therapistsService.createServiceArea(userId, dto);
  }

  @Patch(':userId/service-areas/:itemId')
  updateServiceArea(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateServiceAreaDto,
  ) {
    return this.therapistsService.updateServiceArea(userId, itemId, dto);
  }

  @Delete(':userId/service-areas/:itemId')
  deleteServiceArea(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.therapistsService.deleteServiceArea(userId, itemId);
  }
}
