import { apiFetch } from "@/lib/http";

import type {
  CreateRatingPayload,
  Rating,
  TherapistRatingsResponse,
} from "@/types/rating";

/**
 * Toàn bộ Rating API gom tại đây.
 *
 * Nếu controller backend hiện tại
 * dùng path khác, chỉ sửa ENDPOINTS.
 */
const ENDPOINTS = {
  create: "/ratings",

  byBooking: (bookingId: number) => `/ratings/booking/${bookingId}`,

  byTherapist: (therapistId: number) => `/ratings/therapist/${therapistId}`,
};

export const createRating = (payload: CreateRatingPayload) => {
  return apiFetch<Rating>(ENDPOINTS.create, {
    method: "POST",

    body: JSON.stringify(payload),
  });
};

export const getRatingByBooking = async (
  bookingId: number
): Promise<Rating | null> => {
  const result = await apiFetch<Rating | null | undefined>(
    ENDPOINTS.byBooking(bookingId)
  );

  /**
   * React Query không cho queryFn
   * trả về undefined.
   *
   * Booking chưa có rating
   * => luôn trả null.
   */
  return result ?? null;
};

export const getTherapistRatings = (
  therapistId: number,
  page = 1,
  limit = 5
) => {
  const params = new URLSearchParams();

  params.set("page", String(page));

  params.set("limit", String(limit));

  return apiFetch<TherapistRatingsResponse>(
    `${ENDPOINTS.byTherapist(therapistId)}?${params.toString()}`
  );
};
