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

import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';

import type { AuthUser } from '../auth/types/auth-user.type.js';

import { UserRole } from '../enums/business.enums.js';

import {
  CreateTherapistGroupDto,
  InviteTherapistGroupMemberDto,
  RespondTherapistGroupInvitationDto,
  TherapistGroupCandidateQueryDto,
} from './dto/therapist-group.dto.js';

import { TherapistGroupService } from './therapist-group.service.js';

@Controller('therapist/groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.THERAPIST)
export class TherapistGroupController {
  constructor(private readonly therapistGroupService: TherapistGroupService) {}

  @Get('me')
  getMyGroup(@CurrentUser() user: AuthUser) {
    return this.therapistGroupService.getMyGroup(user.sub);
  }

  @Get('candidates')
  searchCandidates(
    @CurrentUser() user: AuthUser,
    @Query()
    query: TherapistGroupCandidateQueryDto,
  ) {
    return this.therapistGroupService.searchCandidates(user.sub, query);
  }

  @Get('invitations')
  getInvitations(@CurrentUser() user: AuthUser) {
    return this.therapistGroupService.getMyInvitations(user.sub);
  }

  @Post()
  createGroup(
    @CurrentUser() user: AuthUser,
    @Body()
    dto: CreateTherapistGroupDto,
  ) {
    return this.therapistGroupService.createGroup(user.sub, dto);
  }

  @Post(':groupId/invitations')
  invite(
    @CurrentUser() user: AuthUser,

    @Param('groupId', ParseIntPipe)
    groupId: number,

    @Body()
    dto: InviteTherapistGroupMemberDto,
  ) {
    return this.therapistGroupService.invite(
      user.sub,
      groupId,
      dto.therapistId,
    );
  }

  @Patch('invitations/:invitationId/respond')
  respondInvitation(
    @CurrentUser() user: AuthUser,

    @Param('invitationId', ParseIntPipe)
    invitationId: number,

    @Body()
    dto: RespondTherapistGroupInvitationDto,
  ) {
    return this.therapistGroupService.respondInvitation(
      user.sub,
      invitationId,
      dto.action,
    );
  }

  @Delete('me/leave')
  leaveGroup(@CurrentUser() user: AuthUser) {
    return this.therapistGroupService.leaveGroup(user.sub);
  }

  @Delete(':groupId/members/:therapistId')
  removeMember(
    @CurrentUser() user: AuthUser,

    @Param('groupId', ParseIntPipe)
    groupId: number,

    @Param('therapistId', ParseIntPipe)
    therapistId: number,
  ) {
    return this.therapistGroupService.removeMember(
      user.sub,
      groupId,
      therapistId,
    );
  }

  @Delete(':groupId')
  disbandGroup(
    @CurrentUser() user: AuthUser,

    @Param('groupId', ParseIntPipe)
    groupId: number,
  ) {
    return this.therapistGroupService.disbandGroup(user.sub, groupId);
  }
}
