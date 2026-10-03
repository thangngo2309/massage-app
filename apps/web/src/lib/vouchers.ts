import { apiFetch } from "@/lib/http";

import type {
  EligibleBookingVouchersQuery,
  EligibleBookingVouchersResponse,
} from "@/types/voucher";

const VOUCHER_ENDPOINTS = {
  eligible: "/vouchers/me/eligible",
};

const buildLanguageHeaders = (
  acceptLanguage?: string
): HeadersInit | undefined => {
  const language = acceptLanguage?.trim();

  if (!language) {
    return undefined;
  }

  return {
    "Accept-Language": language,
  };
};

export const getEligibleBookingVouchers = (
  query: EligibleBookingVouchersQuery,
  acceptLanguage?: string
) => {
  const params = new URLSearchParams();

  params.set("therapistId", String(query.therapistId));

  params.set(
    "therapistServiceIds",
    Array.from(new Set(query.therapistServiceIds)).join(",")
  );

  return apiFetch<EligibleBookingVouchersResponse>(
    `${VOUCHER_ENDPOINTS.eligible}?${params.toString()}`,
    {
      headers: buildLanguageHeaders(acceptLanguage),
    }
  );
};
