import { apiFetch } from "@/lib/http";

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

/**
 * ==========================================================
 * CREATE BOOKING
 * ==========================================================
 *
 * Chỉ nhận payload.
 *
 * Không truyền acceptLanguage ở đây để function có thể được
 * dùng trực tiếp làm React Query mutationFn:
 *
 * mutationFn: createClientBooking
 *
 * Sau khi tạo booking, Web redirect sang booking detail.
 * Booking detail sẽ fetch lại theo language hiện tại.
 */
export const createClientBooking = (payload: CreateClientBookingPayload) => {
  return apiFetch<ClientBooking>(BOOKING_ENDPOINTS.create, {
    method: "POST",

    body: JSON.stringify(payload),
  });
};

/**
 * ==========================================================
 * CLIENT BOOKING LIST
 * ==========================================================
 *
 * Booking.serviceName là business translation từ Backend,
 * nên GET phải gửi Accept-Language.
 */
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

/**
 * ==========================================================
 * CLIENT BOOKING DETAIL
 * ==========================================================
 */
export const getMyBooking = (id: number, acceptLanguage?: string) => {
  return apiFetch<ClientBooking>(BOOKING_ENDPOINTS.detail(id), {
    headers: buildLanguageHeaders(acceptLanguage),
  });
};

/**
 * ==========================================================
 * CANCEL BOOKING
 * ==========================================================
 */
export const cancelMyBooking = (
  id: number,
  reason: string,
  acceptLanguage?: string
) => {
  return apiFetch<ClientBooking>(BOOKING_ENDPOINTS.cancel(id), {
    method: "PATCH",

    headers: buildLanguageHeaders(acceptLanguage),

    body: JSON.stringify({
      reason,
    }),
  });
};
