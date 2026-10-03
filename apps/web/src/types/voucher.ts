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

export type EligibleBookingVoucherSelectedService = {
  therapistServiceId: number;

  serviceOptionId: number;

  serviceId: number;

  serviceName: string;

  optionLabel: string | null;

  durationMinutes: number;

  price: number;
};

export type EligibleBookingVouchersResponse = {
  therapistId: number;

  therapistServiceIds: number[];

  selectedServices: EligibleBookingVoucherSelectedService[];

  orderAmount: number;

  items: EligibleBookingVoucher[];
};

export type EligibleBookingVouchersQuery = {
  therapistId: number;

  therapistServiceIds: number[];
};
