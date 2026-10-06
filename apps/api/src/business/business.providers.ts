import { AuthService } from './auth/auth.service.js';
import { BookingRealtimeGateway } from './booking/booking-realtime.gateway.js';
import { BookingService } from './booking/booking.service.js';
import { BusinessI18nService } from './business-i18n/business-i18n.service.js';
import { I18nService } from './i18n/i18n.service.js';
import { OtpService } from './auth/otp.service.js';
import { ProfileService } from './profile/profile.service.js';
import { AdminPromotionOperationsService } from './promotion/admin-promotion-operations.service.js';
import { PromotionRewardService } from './promotion/promotion-reward.service.js';
import { PromotionService } from './promotion/promotion.service.js';
import { RatingService } from './rating/rating.service.js';
import { ReferralService } from './referral/referral.service.js';
import { ServicesService } from './services/services.service.js';
import { SystemSettingService } from './system-setting/system-setting.service.js';
import { TherapistAvailabilityService } from './therapist-availability/therapist-availability.service.js';
import { TherapistImagesService } from './therapists/therapist-images.service.js';
import { TherapistSearchService } from './therapist-search/therapist-search.service.js';
import { TherapistSelfService } from './therapists/therapist-self.service.js';
import { TherapistsService } from './therapists/therapists.service.js';
import { UsersService } from './users/users.service.js';
import { VnpayService } from './vnpay/vnpay.service.js';
import { VoucherService } from './voucher/voucher.service.js';
import { WalletService } from './wallet/wallet.service.js';
import { LocationService } from './location/location.service.js';
import { BookingTransferService } from './booking-transfer/booking-transfer.service.js';
import { TherapistGroupService } from './therapist-groups/therapist-group.service.js';

export const BUSINESS_PROVIDERS = [
  AuthService,
  UsersService,
  ServicesService,
  TherapistsService,
  TherapistAvailabilityService,
  TherapistSearchService,
  BookingService,
  RatingService,
  TherapistSelfService,
  BookingRealtimeGateway,
  I18nService,
  OtpService,
  WalletService,
  VnpayService,
  TherapistImagesService,
  ProfileService,
  SystemSettingService,
  PromotionService,
  PromotionRewardService,
  AdminPromotionOperationsService,
  VoucherService,
  ReferralService,
  BusinessI18nService,
  LocationService,
  TherapistGroupService,
  BookingTransferService,
];
