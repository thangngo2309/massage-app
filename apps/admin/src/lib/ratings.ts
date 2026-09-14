import { apiRequest } from "@/lib/api";

export interface RatingItem {
  id: number;
  bookingId: number;
  clientId: number;
  therapistId: number;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  adminNote: string | null;

  createdAt: string;
  updatedAt: string;

  booking?: {
    id: number;
    bookingCode: string;
    serviceName: string;
  };

  client?: {
    id: number;
    user?: {
      id: number;
      fullName: string;
      phone: string;
      email: string | null;
    };
  };

  therapist?: {
    id: number;
    user?: {
      id: number;
      fullName: string;
      phone: string;
      email: string | null;
    };
  };
}

export interface RatingListResponse {
  items: RatingItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetRatingsParams {
  page?: number;
  limit?: number;
  q?: string;
  therapistId?: number;
  rating?: number;
  isVisible?: boolean;
  from?: string;
  to?: string;
}

export function getRatings(query: GetRatingsParams) {
  const params = new URLSearchParams();

  if (query.page) {
    params.set("page", String(query.page));
  }

  if (query.limit) {
    params.set("limit", String(query.limit));
  }

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.therapistId) {
    params.set("therapistId", String(query.therapistId));
  }

  if (query.rating) {
    params.set("rating", String(query.rating));
  }

  if (query.isVisible !== undefined) {
    params.set("isVisible", String(query.isVisible));
  }

  if (query.from) {
    params.set("from", query.from);
  }

  if (query.to) {
    params.set("to", query.to);
  }

  return apiRequest<RatingListResponse>(`/admin/ratings?${params.toString()}`);
}

export function getRating(id: number) {
  return apiRequest<RatingItem>(`/admin/ratings/${id}`);
}

export function updateRatingModeration(
  id: number,
  payload: {
    isVisible?: boolean;
    adminNote?: string | null;
  }
) {
  return apiRequest<RatingItem>(`/admin/ratings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
