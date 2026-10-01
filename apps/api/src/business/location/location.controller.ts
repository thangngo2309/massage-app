import { Controller, Get, Param } from '@nestjs/common';

import { LocationService } from './location.service.js';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * ==========================================================
   * PROVINCES / CITIES
   * ==========================================================
   *
   * GET /api/locations/provinces
   */

  @Get('provinces')
  getProvinces() {
    return this.locationService.getProvinces();
  }

  /**
   * ==========================================================
   * WARDS / COMMUNES
   * ==========================================================
   *
   * GET /api/locations/provinces/:provinceCode/wards
   */

  @Get('provinces/:provinceCode/wards')
  getWardsByProvinceCode(
    @Param('provinceCode')
    provinceCode: string,
  ) {
    return this.locationService.getWardsByProvinceCode(provinceCode);
  }
}
