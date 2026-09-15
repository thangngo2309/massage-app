import type { BookingStatus, BookingStatusHistory } from "@/types/booking";

export type TherapistBookingClient = {
  id?: number;

  userId?: number;

  fullName?: string | null;

  phone?: string | null;

  avatarUrl?: string | null;
};

export type TherapistBooking = {
  id: number;

  clientId?: number;

  therapistId: number | null;

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
