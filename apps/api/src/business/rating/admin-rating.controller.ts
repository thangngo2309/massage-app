import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { RatingService } from './rating.service.js';
import { AdminRatingQueryDto } from './dto/admin-rating-query.dto.js';
import { AdminUpdateRatingDto } from './dto/admin-update-rating.dto.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { UserRole } from '../enums/business.enums.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';

@Controller('admin/ratings')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
export class AdminRatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Get()
  getList(
    @Query() query: AdminRatingQueryDto,
  ) {
    return this.ratingService.getAdminRatings(query);
  }

  @Get(':id')
  getDetail(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ratingService.getAdminRating(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateRatingDto,
  ) {
    return this.ratingService.updateAdminRating(id, dto);
  }
}
