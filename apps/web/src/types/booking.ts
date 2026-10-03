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

export type BookingTherapistUser = {
  id?: number;

  fullName?: string | null;

  phone?: string | null;

  email?: string | null;

  avatarUrl?: string | null;
};

export type BookingTherapist = {
  id: number;

  userId?: number;

  /**
   * Giữ lại để tương thích với response hoặc consumer cũ.
   *
   * Client Web không dùng fullName để hiển thị public.
   */
  fullName?: string | null;

  /**
   * Nghệ danh dùng để hiển thị cho khách hàng.
   */
  stageName?: string | null;

  avatarUrl?: string | null;

  phone?: string | null;

  /**
   * BookingService hiện load relation therapist.user.
   */
  user?: BookingTherapistUser | null;
};

export type BookingStatusHistory = {
  id: number;

  bookingId?: number;

  fromStatus?: BookingStatus | null;

  toStatus: BookingStatus;

  note?: string | null;

  reason?: string | null;

  createdAt: string;
};

export type ClientBookingItem = {
  id: number;

  bookingId?: number;

  serviceId?: number;

  serviceOptionId: number;

  /**
   * Có thể null nếu TherapistService đã bị xóa
   * hoặc booking legacy không còn relation tương ứng.
   */
  therapistServiceId?: number | null;

  serviceName: string;

  /**
   * Snapshot label của ServiceOption.
   *
   * Có thể null với dữ liệu cũ.
   */
  optionLabel?: string | null;

  durationMinutes: number;

  price: number;

  platformFeeRate?: number;

  platformFee?: number;

  sortOrder: number;
};

export type ClientBooking = {
  id: number;

  bookingCode?: string;

  clientId?: number;

  therapistId?: number | null;

  /**
   * Legacy primary service option.
   *
   * Booking multi-service vẫn giữ field này để tương thích.
   */
  serviceOptionId: number;

  /**
   * Legacy primary therapist service.
   */
  therapistServiceId?: number | null;

  status: BookingStatus;

  scheduledAt: string;

  expectedEndAt?: string | null;

  serviceName: string;

  /**
   * Label của ServiceOption đã localize.
   *
   * Field này được booking localization bổ sung vào response.
   */
  serviceOptionLabel?: string | null;

  durationMinutes: number;

  servicePrice: number;

  platformFee?: number;

  taxAmount?: number;

  /**
   * Voucher snapshot.
   */
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

  /**
   * Multi-service booking items.
   */
  items?: ClientBookingItem[];

  statusHistories?: BookingStatusHistory[];
};

export type CreateClientBookingPayload = {
  therapistId: number;

  therapistServiceIds: number[];

  date: string;

  startTime: string;

  address: string;

  latitude: number;

  longitude: number;

  provinceCode?: string;

  wardCode?: string;

  clientNote?: string;

  userVoucherId?: number | null;
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
