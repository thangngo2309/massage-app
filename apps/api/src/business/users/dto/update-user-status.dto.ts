import { IsEnum } from 'class-validator';
import { UserStatus } from '../../enums/business.enums.js';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}
