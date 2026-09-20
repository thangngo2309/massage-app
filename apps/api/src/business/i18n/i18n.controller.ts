import { Controller, Get, Query } from '@nestjs/common';

import { GetI18nResourcesQueryDto } from './dto/get-i18n-resources-query.dto.js';
import { I18nService } from './i18n.service.js';

@Controller('i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Get('languages')
  getLanguages() {
    return this.i18nService.getLanguages();
  }

  @Get('version')
  getVersion(
    @Query('lang')
    lang: string,
  ) {
    return this.i18nService.getVersion(lang);
  }

  @Get('resources')
  getResources(
    @Query()
    query: GetI18nResourcesQueryDto,
  ) {
    return this.i18nService.getResources(query.lang, query.namespace);
  }
}
