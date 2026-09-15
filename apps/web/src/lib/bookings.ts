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

export const createClientBooking = (payload: CreateClientBookingPayload) => {
  return apiFetch<ClientBooking>(BOOKING_ENDPOINTS.create, {
    method: "POST",

    body: JSON.stringify(payload),
  });
};

export const getMyBookings = (query: ClientBookingsQuery = {}) => {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 1));

  params.set("limit", String(query.limit ?? 10));

  if (query.status) {
    params.set("status", query.status);
  }

  return apiFetch<ClientBookingsResponse>(
    `${BOOKING_ENDPOINTS.list}?${params.toString()}`
  );
};

export const getMyBooking = (id: number) => {
  return apiFetch<ClientBooking>(BOOKING_ENDPOINTS.detail(id));
};

export const cancelMyBooking = (id: number, reason: string) => {
  return apiFetch<ClientBooking>(BOOKING_ENDPOINTS.cancel(id), {
    method: "PATCH",

    body: JSON.stringify({
      reason,
    }),
  });
};
