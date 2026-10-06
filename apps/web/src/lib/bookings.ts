import { apiFetch } from "@/lib/http";

import { setClientBookingTransferConsent } from "@/lib/booking-transfers";

import { useBookingTransferConsentStore } from "@/stores/booking-transfer-consent-store";

import type {
  ClientBooking,
  ClientBookingsQuery,
  ClientBookingsResponse,
  CreateClientBookingPayload,
} from "@/types/booking";

const BOOKING_ENDPOINTS = {
  create: "/bookings",

  list: "/bookings",

  detail: (id: number) => `/bookings/${id}`,

  cancel: (id: number) => `/bookings/${id}/cancel`,
};

const buildLanguageHeaders = (acceptLanguage?: string) => {
  if (!acceptLanguage) {
    return undefined;
  }

  return {
    "Accept-Language": acceptLanguage,
  };
};

export const createClientBooking = async (
  payload: CreateClientBookingPayload
) => {
  const booking = await apiFetch<ClientBooking>(BOOKING_ENDPOINTS.create, {
    method: "POST",

    body: JSON.stringify(payload),
  });

  const consentStore = useBookingTransferConsentStore.getState();

  if (!consentStore.allowGroupTransfer) {
    consentStore.reset();

    return booking;
  }

  /**
   * Đánh dấu booking vừa tạo.
   *
   * Nếu API lưu consent lỗi,
   * ClientBookingTransferPanel
   * sẽ tự retry đúng booking này.
   */
  consentStore.setPendingBookingId(booking.id);

  try {
    await setClientBookingTransferConsent(booking.id, true);

    consentStore.reset();
  } catch (error) {
    /**
     * Booking đã được tạo thành công.
     *
     * Không throw để tránh user
     * submit lại và sinh booking trùng.
     *
     * Store vẫn giữ pendingBookingId
     * để detail page retry.
     */
    console.error("Failed to persist group transfer consent", error);
  }

  return booking;
};

export const getMyBookings = (
  query: ClientBookingsQuery = {},
  acceptLanguage?: string
) => {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 1));

  params.set("limit", String(query.limit ?? 10));

  if (query.status) {
    params.set("status", query.status);
  }

  return apiFetch<ClientBookingsResponse>(
    `${BOOKING_ENDPOINTS.list}?${params.toString()}`,
    {
      headers: buildLanguageHeaders(acceptLanguage),
    }
  );
};

export const getMyBooking = (id: number, acceptLanguage?: string) => {
  return apiFetch<ClientBooking>(BOOKING_ENDPOINTS.detail(id), {
    headers: buildLanguageHeaders(acceptLanguage),
  });
};

export const cancelMyBooking = (id: number, reason: string) => {
  return apiFetch<ClientBooking>(BOOKING_ENDPOINTS.cancel(id), {
    method: "PATCH",

    body: JSON.stringify({
      reason,
    }),
  });
};
