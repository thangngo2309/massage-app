import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreateTherapistGroupDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class InviteTherapistGroupMemberDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  therapistId!: number;
}

export class RespondTherapistGroupInvitationDto {
  @IsIn(['accept', 'reject'])
  action!: 'accept' | 'reject';
}

export class TherapistGroupCandidateQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;
}
