import { apiFetch } from "@/lib/http";

import type {
  TherapistBooking,
  TherapistBookingsQuery,
  TherapistBookingsResponse,
  UpdateTherapistBookingStatusPayload,
} from "@/types/therapist-booking";

const ENDPOINTS = {
  list: "/therapist/bookings",

  detail: (id: number) => `/therapist/bookings/${id}`,
  status: (id: number) => `/therapist/bookings/${id}/status`,
};

export const getTherapistBookings = (query: TherapistBookingsQuery = {}) => {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 10));

  if (query.status) {
    params.set("status", query.status);
  }

  return apiFetch<TherapistBookingsResponse>(
    `${ENDPOINTS.list}?${params.toString()}`
  );
};

export const getTherapistBooking = (id: number) => {
  return apiFetch<TherapistBooking>(ENDPOINTS.detail(id));
};

export const updateTherapistBookingStatus = (
  id: number,
  payload: UpdateTherapistBookingStatusPayload
) => {
  return apiFetch<TherapistBooking>(ENDPOINTS.status(id), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};
