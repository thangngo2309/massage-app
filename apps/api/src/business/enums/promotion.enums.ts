export enum PromotionAudience {
  CLIENT = 'client',
  THERAPIST = 'therapist',
}

export enum PromotionTriggerType {
  REFERRAL_CODE_ENTERED = 'referral_code_entered',
  REFERRAL_QUALIFIED = 'referral_qualified',
  /** Tài khoản ACTIVE và đủ điều kiện nhận ưu đãi booking đầu tiên. */
  FIRST_BOOKING_ELIGIBLE = 'first_booking_eligible',
  FIRST_BOOKING_COMPLETED = 'first_booking_completed',
}

export enum PromotionRewardType {
  WALLET_CREDIT = 'wallet_credit',
  VOUCHER = 'voucher',
}
export enum PromotionRewardRecipient {
  ACTOR = 'actor',
  REFERRER = 'referrer',
}
export enum ReferralStatus {
  PENDING = 'pending',
  QUALIFIED = 'qualified',
  REWARDED = 'rewarded',
  INVALID = 'invalid',
}
export enum VoucherDiscountType {
  FIXED = 'fixed',
  PERCENT = 'percent',
}
export enum UserVoucherStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}
export enum UserVoucherSourceType {
  PROMOTION = 'promotion',
  REFERRAL = 'referral',
  FIRST_BOOKING = 'first_booking',
  ADMIN = 'admin',
}
