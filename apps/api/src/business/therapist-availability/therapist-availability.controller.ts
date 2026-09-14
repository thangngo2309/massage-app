import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';

import { TherapistAvailabilityService } from './therapist-availability.service.js';

import {
  CheckTherapistAvailabilityQueryDto,
  GetTherapistAvailabilitySlotsQueryDto,
} from './dto/therapist-availability.dto.js';

@Controller('therapists/:therapistId/availability')
export class TherapistAvailabilityController {
  constructor(
    private readonly therapistAvailabilityService: TherapistAvailabilityService,
  ) {}

  /**
   * GET
   * /api/therapists/:therapistId/availability/check
   */
  @Get('check')
  checkAvailability(
    @Param('therapistId', ParseIntPipe) therapistId: number,
    @Query() query: CheckTherapistAvailabilityQueryDto,
  ) {
    return this.therapistAvailabilityService.checkAvailability(
      therapistId,
      query,
    );
  }

  /**
   * GET
   * /api/therapists/:therapistId/availability/slots
   */
  @Get('slots')
  getAvailableSlots(
    @Param('therapistId', ParseIntPipe) therapistId: number,
    @Query() query: GetTherapistAvailabilitySlotsQueryDto,
  ) {
    return this.therapistAvailabilityService.getAvailableSlots(
      therapistId,
      query,
    );
  }
}
