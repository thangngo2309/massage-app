import { AuthController } from './auth/auth.controller.js';
import { ClientBookingTransferController } from './booking-transfer/client-booking-transfer.controller.js';
import { TherapistBookingTransferController } from './booking-transfer/therapist-booking-transfer.controller.js';
import { AdminBookingController } from './booking/admin-booking.controller.js';
import { BookingController } from './booking/booking.controller.js';
import { TherapistBookingController } from './booking/therapist-booking.controller.js';
import { I18nAdminController } from './i18n/i18n-admin.controller.js';
import { I18nController } from './i18n/i18n.controller.js';
import { LocationController } from './location/location.controller.js';
import { ProfileController } from './profile/profile.controller.js';
import { AdminPromotionOperationsController } from './promotion/admin-promotion-operations.controller.js';
import { PromotionController } from './promotion/promotion.controller.js';
import { AdminRatingController } from './rating/admin-rating.controller.js';
import { RatingController } from './rating/rating.controller.js';
import { ReferralController } from './referral/referral.controller.js';
import { ServicesPublicController } from './services/services-public.controller.js';
import { ServicesController } from './services/services.controller.js';
import { TherapistAvailabilityController } from './therapist-availability/therapist-availability.controller.js';
import { TherapistGroupController } from './therapist-groups/therapist-group.controller.js';
import { TherapistSearchController } from './therapist-search/therapist-search.controller.js';
import { TherapistImagesController } from './therapists/therapist-images.controller.js';
import { TherapistSelfController } from './therapists/therapist-self.controller.js';
import { TherapistsController } from './therapists/therapists.controller.js';
import { UsersController } from './users/users.controller.js';
import { VnpayController } from './vnpay/vnpay.controller.js';
import { MyVoucherController } from './voucher/my-voucher.controller.js';
import { VoucherController } from './voucher/voucher.controller.js';
import { WalletController } from './wallet/wallet.controller.js';

export const BUSINESS_CONTROLLERS = [
  AuthController,
  UsersController,
  ServicesController,
  ServicesPublicController,
  TherapistsController,
  TherapistAvailabilityController,
  TherapistSearchController,
  BookingController,
  TherapistBookingController,
  AdminBookingController,
  RatingController,
  AdminRatingController,
  TherapistSelfController,
  I18nController,
  I18nAdminController,
  WalletController,
  VnpayController,
  TherapistImagesController,
  ProfileController,
  PromotionController,
  AdminPromotionOperationsController,
  VoucherController,
  MyVoucherController,
  ReferralController,
  LocationController,
  TherapistGroupController,
  TherapistBookingTransferController,
  ClientBookingTransferController,
];
