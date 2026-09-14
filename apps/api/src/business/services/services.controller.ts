import {
  Body,
  Controller,
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
import { ServicesService } from './services.service.js';
import { AdminServiceQueryDto } from './dto/admin-service-query.dto.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { UpdateActiveDto } from './dto/update-active.dto.js';
import { CreateServiceOptionDto } from './dto/create-service-option.dto.js';
import { UpdateServiceOptionDto } from './dto/update-service-option.dto.js';

@Controller('admin/services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(
    @Query()
    query: AdminServiceQueryDto,
  ) {
    return this.servicesService.findAll(query);
  }

  @Post()
  create(
    @Body()
    dto: CreateServiceDto,
  ) {
    return this.servicesService.create(dto);
  }

  @Post(':serviceId/options')
  createOption(
    @Param('serviceId', ParseIntPipe)
    serviceId: number,

    @Body()
    dto: CreateServiceOptionDto,
  ) {
    return this.servicesService.createOption(serviceId, dto);
  }

  @Patch(':serviceId/options/:optionId')
  updateOption(
    @Param('serviceId', ParseIntPipe)
    serviceId: number,

    @Param('optionId', ParseIntPipe)
    optionId: number,

    @Body()
    dto: UpdateServiceOptionDto,
  ) {
    return this.servicesService.updateOption(serviceId, optionId, dto);
  }

  @Patch(':serviceId/options/:optionId/active')
  updateOptionActive(
    @Param('serviceId', ParseIntPipe)
    serviceId: number,

    @Param('optionId', ParseIntPipe)
    optionId: number,

    @Body()
    dto: UpdateActiveDto,
  ) {
    return this.servicesService.updateOptionActive(
      serviceId,
      optionId,
      dto.isActive,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, dto);
  }

  @Patch(':id/active')
  updateActive(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateActiveDto,
  ) {
    return this.servicesService.updateActive(id, dto.isActive);
  }
}
