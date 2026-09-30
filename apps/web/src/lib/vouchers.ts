import { apiFetch } from "@/lib/http";
import { EligibleBookingVouchersQuery, EligibleBookingVouchersResponse } from "@/types/voucher";

const VOUCHER_ENDPOINTS = {
  eligible: "/vouchers/me/eligible",
};

export const getEligibleBookingVouchers = (
  query: EligibleBookingVouchersQuery
) => {
  const params = new URLSearchParams();

  params.set("therapistId", String(query.therapistId));
  params.set("serviceOptionId", String(query.serviceOptionId));

  return apiFetch<EligibleBookingVouchersResponse>(
    `${VOUCHER_ENDPOINTS.eligible}?${params.toString()}`
  );
};
