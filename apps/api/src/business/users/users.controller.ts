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

import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';

import type { AuthUser } from '../auth/types/auth-user.type.js';

import { UserRole } from '../enums/business.enums.js';

import { AdminUserQueryDto } from './dto/admin-user-query.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

import { UsersService } from './users.service.js';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto.js';
import { CreateAdminUserDto } from './dto/create-admin-user.dto.js';
import { ReferralService } from '../referral/referral.service.js';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly referralService: ReferralService,
  ) {}

  @Get()
  findAll(@Query() query: AdminUserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() currentUser: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(currentUser, id, dto.status);
  }

  @Post()
  create(
    @CurrentUser() currentUser: AuthUser,
    @Body() dto: CreateAdminUserDto,
  ) {
    return this.usersService.createUser(currentUser, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.usersService.updateUser(currentUser, id, dto);
  }

  /**
   * ============================================================
   * GENERATE REFERRAL CODE
   * ============================================================
   *
   * Chỉ Super Admin được tạo mã giới thiệu thủ công cho user cũ.
   *
   * ReferralService.getOrCreateReferralCode():
   *
   * - nếu user đã có mã active -> trả mã hiện tại
   * - nếu chưa có -> tạo mã mới
   *
   * Vì vậy endpoint này có thể gọi nhiều lần mà không sinh
   * thêm nhiều mã cho cùng một user.
   */
  @Post(':id/referral-code')
  @Roles(UserRole.SUPER_ADMIN)
  generateReferralCode(@Param('id', ParseIntPipe) id: number) {
    return this.referralService.getOrCreateReferralCode(id);
  }

  @Post(':id/repair-profile')
  repairProfile(
    @CurrentUser() currentUser: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.repairRoleProfile(currentUser, id);
  }
}
