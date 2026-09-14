import { Controller, Get, Query } from '@nestjs/common';

import { SearchTherapistsQueryDto } from './dto/search-therapists.dto.js';
import { TherapistSearchService } from './therapist-search.service.js';

@Controller('therapists')
export class TherapistSearchController {
  constructor(
    private readonly therapistSearchService: TherapistSearchService,
  ) {}

  /**
   * GET /api/therapists/search
   */
  @Get('search')
  search(
    @Query()
    query: SearchTherapistsQueryDto,
  ) {
    return this.therapistSearchService.search(query);
  }
}
