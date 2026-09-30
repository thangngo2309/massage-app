export type VoucherDiscountType = "fixed" | "percent";

export type EligibleBookingVoucher = {
  userVoucherId: number;
  voucherId: number;
  code: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  discountAmount: number;
  finalAmount: number;
  expiresAt: string | null;
  sourceType: string;
  name: string;
  description: string | null;
  terms: string | null;
};

export type EligibleBookingVouchersResponse = {
  orderAmount: number;
  therapistId: number;
  serviceOptionId: number;
  items: EligibleBookingVoucher[];
};

export type EligibleBookingVouchersQuery = {
  therapistId: number;
  serviceOptionId: number;
};
