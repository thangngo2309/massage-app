import { BookingStatusHistory } from './booking-status-history.entity.js';
import { Booking } from './booking.entity.js';
import { ClientProfile } from './client-profile.entity.js';
import { I18nLanguage } from './i18n-language.entity.js';
import { I18nResource } from './i18n-resource.entity.js';
import { PromotionTranslation } from './promotion-translation.entity.js';
import { PromotionUsage } from './promotion-usage.entity.js';
import { Promotion } from './promotion.entity.js';
import { Rating } from './rating.entity.js';
import { Referral } from './referral.entity.js';
import { RefreshToken } from './refresh-token.entity.js';
import { ServiceOptionTranslation } from './service-option-translation.entity.js';
import { ServiceOption } from './service-option.entity.js';
import { ServiceTranslation } from './service-translation.entity.js';
import { MassageService } from './service.entity.js';
import { SystemSetting } from './system-setting.entity.js';
import { TherapistImage } from './therapist-image.entity.js';
import { TherapistProfile } from './therapist-profile.entity.js';
import { TherapistScheduleException } from './therapist-schedule-exception.entity.js';
import { TherapistServiceArea } from './therapist-service-area.entity.js';
import { TherapistService } from './therapist-service.entity.js';
import { TherapistWorkingHour } from './therapist-working-hour.entity.js';
import { UserReferralCode } from './user-referral-code.entity.js';
import { UserVoucher } from './user-voucher.entity.js';
import { User } from './user.entity.js';
import { VnpayTransaction } from './vnpay-transaction.entity.js';
import { VoucherTranslation } from './voucher-translation.entity.js';
import { Voucher } from './voucher.entity.js';
import { WalletTransaction } from './wallet-transaction.entity.js';
import { Wallet } from './wallet.entity.js';

export const BUSINESS_ENTITIES = [
  User,
  RefreshToken,
  ClientProfile,
  TherapistProfile,
  MassageService,
  ServiceOption,
  TherapistService,
  TherapistWorkingHour,
  TherapistScheduleException,
  TherapistServiceArea,
  Booking,
  BookingStatusHistory,
  Rating,
  I18nLanguage,
  I18nResource,
  Wallet,
  WalletTransaction,
  VnpayTransaction,
  TherapistImage,
  SystemSetting,
  Promotion,
  PromotionTranslation,
  PromotionUsage,
  UserReferralCode,
  Referral,
  Voucher,
  VoucherTranslation,
  UserVoucher,
  ServiceTranslation,
  ServiceOptionTranslation,
];
