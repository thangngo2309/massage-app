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

  note?: string | null;

  createdAt: string;
};

export type ClientBooking = {
  id: number;

  clientId?: number;

  therapistId?: number | null;

  serviceOptionId: number;

  therapistServiceId?: number | null;

  status: BookingStatus;

  scheduledAt: string;

  expectedEndAt?: string | null;

  serviceName: string;

  durationMinutes: number;

  servicePrice: number;

  platformFee?: number;

  taxAmount?: number;

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

  serviceOptionId: number;

  date: string;
  startTime: string;

  address: string;

  latitude: number;
  longitude: number;

  districtCode?: string;
  provinceCode?: string;

  clientNote?: string;
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
