import { IsEnum } from 'class-validator';
import { TherapistVerificationStatus } from '../../enums/business.enums.js';

export class UpdateTherapistVerificationDto {
  @IsEnum(TherapistVerificationStatus)
  verificationStatus!: TherapistVerificationStatus;
}
