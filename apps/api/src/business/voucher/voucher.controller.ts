import {
  Body,
  Controller,
  Delete,
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
import { AdminVoucherQueryDto } from './dto/admin-voucher-query.dto.js';
import { CreateVoucherDto } from './dto/create-voucher.dto.js';
import { UpdateVoucherActiveDto } from './dto/update-voucher-active.dto.js';
import { UpdateVoucherDto } from './dto/update-voucher.dto.js';
import { VoucherService } from './voucher.service.js';

@Controller('admin/vouchers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get()
  findAll(
    @Query()
    query: AdminVoucherQueryDto,
  ) {
    return this.voucherService.findAll(query);
  }

  @Post()
  create(
    @Body()
    dto: CreateVoucherDto,
  ) {
    return this.voucherService.create(dto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.voucherService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateVoucherDto,
  ) {
    return this.voucherService.update(id, dto);
  }

  @Patch(':id/active')
  updateActive(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateVoucherActiveDto,
  ) {
    return this.voucherService.updateActive(id, dto.isActive);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.voucherService.remove(id);
  }
}
