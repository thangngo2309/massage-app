import {
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { SearchTherapistsQueryDto } from './dto/search-therapists.dto.js';
import { TherapistSearchService } from './therapist-search.service.js';

@Controller('therapists')
export class TherapistSearchController {
  constructor(
    private readonly therapistSearchService: TherapistSearchService,
  ) {}

  /**
   * GET /api/therapists/search
   *
   * Tìm KTV theo:
   * - Service
   * - khu vực / địa chỉ khách hàng
   *
   * Không kiểm tra availability tại bước này.
   */
  @Get('search')
  search(
    @Query()
    query: SearchTherapistsQueryDto,

    @Headers('accept-language')
    acceptLanguage?: string,
  ) {
    return this.therapistSearchService.search(query, acceptLanguage);
  }

  /**
   * GET /api/therapists/:therapistId/services
   *
   * Lấy toàn bộ Service + ServiceOption
   * mà KTV hiện đang cung cấp.
   *
   * therapistId là TherapistProfile.id.
   */
  @Get(':therapistId/services')
  getTherapistServices(
    @Param('therapistId', ParseIntPipe)
    therapistId: number,

    @Headers('accept-language')
    acceptLanguage?: string,
  ) {
    return this.therapistSearchService.getTherapistServices(
      therapistId,
      acceptLanguage,
    );
  }
}