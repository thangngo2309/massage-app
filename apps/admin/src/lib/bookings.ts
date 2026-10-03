import { apiRequest } from "@/lib/api";

export type BookingStatus =
  | "pending"
  | "searching_therapist"
  | "waiting_therapist_accept"
  | "confirmed"
  | "therapist_on_the_way"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled_by_client"
  | "cancelled_by_therapist"
  | "cancelled_by_admin"
  | "rejected"
  | "expired";

export interface BookingStatusHistoryItem {
  id: number;

  fromStatus: BookingStatus | null;

  toStatus: BookingStatus;

  changedByUserId: number | null;

  reason: string | null;

  createdAt: string;

  changedByUser?: {
    id: number;

    fullName: string;
  } | null;
}

/**
 * ============================================================
 * BOOKING SERVICE ITEM
 * ============================================================
 *
 * Một Booking có thể chứa nhiều BookingServiceItem.
 *
 * Đây là snapshot tại thời điểm khách đặt lịch.
 */
export interface BookingServiceItem {
  id: number;

  bookingId?: number;

  serviceId: number;

  serviceOptionId: number;

  therapistServiceId: number | null;

  serviceName: string;

  optionLabel: string | null;

  durationMinutes: number;

  price: number;

  /**
   * PostgreSQL NUMERIC có thể được serialize thành string
   * tùy driver/config, nên cho phép cả number và string.
   */
  platformFeeRate: number | string;

  platformFee: number;

  sortOrder: number;

  createdAt?: string;

  updatedAt?: string;

  service?: {
    id: number;

    name?: string;

    slug?: string;
  };

  serviceOption?: {
    id: number;

    label?: string | null;

    durationMinutes?: number;
  };

  therapistService?: {
    id: number;

    price?: number;

    platformFeeRate?: number | string;
  } | null;
}

/**
 * ============================================================
 * BOOKING
 * ============================================================
 */
export interface BookingItem {
  id: number;

  bookingCode: string;

  clientId: number;

  therapistId: number | null;

  /**
   * Legacy single-service fields.
   *
   * Booking multi-service vẫn giữ lại để tương thích với
   * code cũ. Chi tiết đầy đủ phải đọc từ items[].
   */
  serviceOptionId: number;

  therapistServiceId: number | null;

  status: BookingStatus;

  scheduledAt: string;

  expectedEndAt: string;

  /**
   * Legacy summary của item đầu tiên.
   */
  serviceName: string;

  /**
   * Multi-service.
   */
  items?: BookingServiceItem[];

  /**
   * Tổng của toàn bộ booking.
   */
  durationMinutes: number;

  servicePrice: number;

  platformFee: number;

  taxAmount: number;

  /**
   * Voucher snapshot.
   */
  userVoucherId?: number | null;

  voucherCode?: string | null;

  discountAmount?: number;

  totalAmount: number;

  address: string;

  latitude: number;

  longitude: number;

  clientNote: string | null;

  acceptedAt: string | null;

  arrivedAt: string | null;

  startedAt: string | null;

  completedAt: string | null;

  cancelledAt: string | null;

  cancellationReason: string | null;

  createdAt: string;

  updatedAt: string;

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
  } | null;

  statusHistories?: BookingStatusHistoryItem[];
}

export interface BookingListResponse {
  items: BookingItem[];

  pagination: {
    page: number;

    limit: number;

    total: number;

    totalPages: number;
  };
}

export interface GetBookingsParams {
  page?: number;

  limit?: number;

  q?: string;

  status?: BookingStatus | "";

  therapistId?: number;

  clientId?: number;

  from?: string;

  to?: string;
}

export function getBookings(query: GetBookingsParams) {
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

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.therapistId) {
    params.set("therapistId", String(query.therapistId));
  }

  if (query.clientId) {
    params.set("clientId", String(query.clientId));
  }

  if (query.from) {
    params.set("from", query.from);
  }

  if (query.to) {
    params.set("to", query.to);
  }

  return apiRequest<BookingListResponse>(
    `/admin/bookings?${params.toString()}`
  );
}

export function getBooking(id: number) {
  return apiRequest<BookingItem>(`/admin/bookings/${id}`);
}

export function updateBookingStatus(
  id: number,
  payload: {
    status: BookingStatus;

    reason?: string;
  }
) {
  return apiRequest<BookingItem>(`/admin/bookings/${id}/status`, {
    method: "PATCH",

    body: JSON.stringify(payload),
  });
}
