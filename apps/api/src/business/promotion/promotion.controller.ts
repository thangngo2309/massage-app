import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
import { AdminPromotionQueryDto } from './dto/admin-promotion-query.dto.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { UpdatePromotionActiveDto } from './dto/update-promotion-active.dto.js';
import { UpdatePromotionDto } from './dto/update-promotion.dto.js';
import { PromotionService } from './promotion.service.js';

@Controller('admin/promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  findAll(
    @Query()
    query: AdminPromotionQueryDto,
  ) {
    return this.promotionService.findAll(query);
  }

  @Post()
  create(
    @Body()
    dto: CreatePromotionDto,
  ) {
    return this.promotionService.create(dto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.promotionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdatePromotionDto,
  ) {
    return this.promotionService.update(id, dto);
  }

  @Patch(':id/active')
  updateActive(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdatePromotionActiveDto,
  ) {
    return this.promotionService.updateActive(id, dto.isActive);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.promotionService.remove(id);
  }
}
