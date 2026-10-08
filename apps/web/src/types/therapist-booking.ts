import type { BookingStatus, BookingStatusHistory } from "@/types/booking";

export type TherapistBookingItem = {
  id: number;

  bookingId?: number;

  serviceId: number;

  serviceOptionId: number;

  therapistServiceId?: number | null;

  serviceName: string;

  optionLabel?: string | null;

  durationMinutes: number;

  price: number;

  platformFeeRate?: number;

  platformFee?: number;

  sortOrder: number;
};

export type TherapistBookingClientUser = {
  id?: number;

  fullName?: string | null;

  phone?: string | null;

  email?: string | null;

  avatarUrl?: string | null;
};

export type TherapistBookingClient = {
  id?: number;

  userId?: number;

  /**
   * Giữ các field flat để tương thích
   * với response cũ nếu có.
   */
  fullName?: string | null;

  phone?: string | null;

  avatarUrl?: string | null;

  /**
   * BookingService hiện load relation client.user.
   */
  user?: TherapistBookingClientUser | null;
};

export type TherapistBooking = {
  id: number;

  clientId?: number;

  therapistId: number | null;

  /**
   * Legacy single-service fields.
   *
   * Booking multi-service vẫn giữ lại
   * để tương thích booking cũ.
   */
  serviceOptionId: number;

  therapistServiceId?: number | null;

  serviceName: string;

  durationMinutes: number;

  servicePrice: number;

  /**
   * Danh sách dịch vụ thực tế của booking.
   *
   * Booking mới multi-service sử dụng field này.
   */
  items?: TherapistBookingItem[];

  status: BookingStatus;

  scheduledAt: string;

  expectedEndAt?: string | null;

  platformFee?: number;

  taxAmount?: number;

  /**
   * Voucher snapshot.
   */
  userVoucherId?: number | null;

  voucherCode?: string | null;

  discountAmount?: number;

  /**
   * Số tiền khách thực tế phải thanh toán.
   */
  totalAmount: number;

  address: string;

  latitude?: number | null;

  longitude?: number | null;

  clientNote?: string | null;

  acceptedAt?: string | null;

  arrivedAt?: string | null;

  startedAt?: string | null;

  completedAt?: string | null;

  cancelledAt?: string | null;

  cancellationReason?: string | null;

  createdAt?: string;

  updatedAt?: string;

  client?: TherapistBookingClient | null;

  statusHistories?: BookingStatusHistory[];
};

export type TherapistBookingPagination = {
  page: number;

  limit: number;

  total: number;

  totalPages: number;
};

export type TherapistBookingsResponse = {
  items: TherapistBooking[];

  pagination: TherapistBookingPagination;
};

export type TherapistBookingsQuery = {
  page?: number;

  limit?: number;

  status?: BookingStatus;
};

export type UpdateTherapistBookingStatusPayload = {
  status: BookingStatus;

  reason?: string;
};
