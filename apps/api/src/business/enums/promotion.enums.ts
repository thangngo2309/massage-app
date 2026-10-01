export enum PromotionAudience {
  CLIENT = 'client',
  THERAPIST = 'therapist',
}

export enum PromotionTriggerType {
  /**
   * User hoàn tất quá trình đăng ký.
   *
   * Với flow hiện tại, trigger này sẽ được phát
   * sau khi verify OTP thành công và tài khoản
   * chuyển từ INACTIVE -> ACTIVE.
   */
  REGISTRATION_COMPLETED = 'registration_completed',

  /**
   * User nhập mã giới thiệu hợp lệ.
   */
  REFERRAL_CODE_ENTERED = 'referral_code_entered',

  /**
   * Người được giới thiệu đã đạt điều kiện
   * của chương trình referral.
   */
  REFERRAL_QUALIFIED = 'referral_qualified',

  /**
   * Tài khoản ACTIVE và đủ điều kiện nhận
   * ưu đãi booking đầu tiên.
   */
  FIRST_BOOKING_ELIGIBLE = 'first_booking_eligible',

  /**
   * User hoàn thành booking đầu tiên.
   */
  FIRST_BOOKING_COMPLETED = 'first_booking_completed',
}

export enum PromotionRewardType {
  /**
   * Cộng tiền vào promotion wallet.
   */
  WALLET_CREDIT = 'wallet_credit',

  /**
   * Cấp voucher.
   */
  VOUCHER = 'voucher',
}

export enum PromotionRewardRecipient {
  /**
   * Người trực tiếp tạo ra trigger.
   *
   * Ví dụ:
   * - đăng ký thành công -> người đăng ký
   * - hoàn thành booking đầu -> người hoàn thành booking
   */
  ACTOR = 'actor',

  /**
   * Người giới thiệu.
   *
   * Chỉ có thể xử lý nếu trigger runtime
   * có referral context.
   */
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