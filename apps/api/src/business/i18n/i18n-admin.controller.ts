import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../shared/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';
import { UserRole } from '../enums/business.enums.js';
import { AdminI18nResourceQueryDto } from './dto/admin-i18n-resource-query.dto.js';
import { CreateI18nLanguageDto } from './dto/create-i18n-language.dto.js';
import { UpsertI18nResourceDto } from './dto/upsert-i18n-resource.dto.js';
import { I18nService } from './i18n.service.js';

@Controller('admin/i18n')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
export class I18nAdminController {
  constructor(private readonly i18nService: I18nService) {}

  @Get('resources')
  getResources(
    @Query()
    query: AdminI18nResourceQueryDto,
  ) {
    return this.i18nService.getAdminResources(query);
  }

  @Post('resources/upsert')
  upsertResource(
    @Body()
    dto: UpsertI18nResourceDto,
  ) {
    return this.i18nService.upsertResource(dto);
  }

  @Delete('resources/:id')
  deleteResource(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.i18nService.deleteResource(id);
  }

  @Post('languages')
  createLanguage(
    @Body()
    dto: CreateI18nLanguageDto,
  ) {
    return this.i18nService.createLanguage(dto);
  }
}
