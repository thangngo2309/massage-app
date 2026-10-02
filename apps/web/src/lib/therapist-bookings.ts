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

export const getTherapistBookings = (
  query: TherapistBookingsQuery = {},
  acceptLanguage?: string
) => {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 1));

  params.set("limit", String(query.limit ?? 10));

  if (query.status) {
    params.set("status", query.status);
  }

  return apiFetch<TherapistBookingsResponse>(
    `${ENDPOINTS.list}?${params.toString()}`,
    {
      headers: buildLanguageHeaders(acceptLanguage),
    }
  );
};

export const getTherapistBooking = (id: number, acceptLanguage?: string) => {
  return apiFetch<TherapistBooking>(ENDPOINTS.detail(id), {
    headers: buildLanguageHeaders(acceptLanguage),
  });
};

export const updateTherapistBookingStatus = (
  id: number,
  payload: UpdateTherapistBookingStatusPayload,
  acceptLanguage?: string
) => {
  return apiFetch<TherapistBooking>(ENDPOINTS.status(id), {
    method: "PATCH",

    headers: buildLanguageHeaders(acceptLanguage),

    body: JSON.stringify(payload),
  });
};
