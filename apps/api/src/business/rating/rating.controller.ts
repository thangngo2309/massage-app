import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { RatingService } from './rating.service.js';
import { CreateRatingDto } from './dto/create-rating.dto.js';
import { UpdateRatingDto } from './dto/update-rating.dto.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { UserRole } from '../enums/business.enums.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';

type CurrentAuthUser = {
  sub: number;
  role: UserRole;
  type: 'access';
};

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(
    @CurrentUser() user: CurrentAuthUser,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingService.createRating(user.sub, dto);
  }

  @Patch(':id')
  @Roles(UserRole.CLIENT)
  update(
    @CurrentUser() user: CurrentAuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRatingDto,
  ) {
    return this.ratingService.updateMyRating(user.sub, id, dto);
  }

  @Get('booking/:bookingId')
  @Roles(UserRole.CLIENT)
  getByBooking(
    @CurrentUser()user: CurrentAuthUser,
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ) {
    return this.ratingService.getMyRatingByBooking(user.sub, bookingId);
  }

  @Get('therapist/:therapistId')
  @Roles(UserRole.CLIENT, UserRole.THERAPIST)
  getTherapistRatings(
    @Param('therapistId', ParseIntPipe) therapistId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.ratingService.getTherapistRatings(therapistId, page, limit);
  }
}
