export enum BookingStatus {
  PENDING = "pending",

  SEARCHING_THERAPIST = "searching_therapist",

  WAITING_THERAPIST_ACCEPT = "waiting_therapist_accept",

  CONFIRMED = "confirmed",

  THERAPIST_ON_THE_WAY = "therapist_on_the_way",

  ARRIVED = "arrived",

  IN_PROGRESS = "in_progress",

  COMPLETED = "completed",

  CANCELLED_BY_CLIENT = "cancelled_by_client",

  CANCELLED_BY_THERAPIST = "cancelled_by_therapist",

  CANCELLED_BY_ADMIN = "cancelled_by_admin",

  REJECTED = "rejected",

  EXPIRED = "expired",
}

export type BookingTherapist = {
  id: number;

  userId?: number;

  fullName?: string | null;

  avatarUrl?: string | null;

  phone?: string | null;
};

export type BookingStatusHistory = {
  id: number;

  bookingId?: number;

  fromStatus?: BookingStatus | null;

  toStatus: BookingStatus;

  /**
   * Một số response cũ đang dùng note,
   * entity/backend mới có thể trả reason.
   */
  note?: string | null;

  reason?: string | null;

  createdAt: string;
};

export type BookingItemService = {
  id: number;

  name?: string;

  slug?: string;
};

export type BookingItemServiceOption = {
  id: number;

  label?: string | null;

  durationMinutes?: number;
};

export type ClientBookingItem = {
  id: number;

  bookingId?: number;

  serviceId: number;

  serviceOptionId: number;

  therapistServiceId?: number | null;

  /**
   * Snapshot tại thời điểm booking.
   */
  serviceName: string;

  optionLabel?: string | null;

  durationMinutes: number;

  price: number;

  platformFeeRate?: number | string;

  platformFee?: number;

  sortOrder: number;

  service?: BookingItemService;

  serviceOption?: BookingItemServiceOption;

  createdAt?: string;

  updatedAt?: string;
};

export type ClientBooking = {
  id: number;

  bookingCode?: string;

  clientId?: number;

  therapistId?: number | null;

  /**
   * Legacy fields.
   *
   * Booking multi-service vẫn giữ để tương thích
   * với frontend/admin/mobile cũ.
   */
  serviceOptionId: number;

  therapistServiceId?: number | null;

  status: BookingStatus;

  scheduledAt: string;

  expectedEndAt?: string | null;

  /**
   * Legacy snapshot của item đầu tiên.
   */
  serviceName: string;

  serviceNameSnapshot?: string;

  serviceOptionLabel?: string | null;

  /**
   * Multi-service items.
   */
  items?: ClientBookingItem[];

  /**
   * Tổng của toàn Booking.
   */
  durationMinutes: number;

  servicePrice: number;

  platformFee?: number;

  taxAmount?: number;

  userVoucherId?: number | null;

  voucherCode?: string | null;

  discountAmount?: number;

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

  therapist?: BookingTherapist | null;

  statusHistories?: BookingStatusHistory[];
};

export type CreateClientBookingPayload = {
  therapistId: number;

  /**
   * ID TherapistService.
   *
   * Không gửi serviceOptionId nữa.
   */
  therapistServiceIds: number[];

  date: string;

  startTime: string;

  address: string;

  latitude: number;

  longitude: number;

  provinceCode?: string;

  wardCode?: string;

  clientNote?: string;

  userVoucherId?: number;
};

export type ClientBookingPagination = {
  page: number;

  limit: number;

  total: number;

  totalPages: number;
};

export type ClientBookingsResponse = {
  items: ClientBooking[];

  pagination: ClientBookingPagination;
};

export type ClientBookingsQuery = {
  page?: number;

  limit?: number;

  status?: BookingStatus;
};
