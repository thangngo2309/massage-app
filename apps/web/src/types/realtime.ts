import type { BookingStatus } from "@/types/booking";

import type { UserRole } from "@/types/auth";

export type BookingRealtimePayload = {
  id: number;

  clientId: number;

  therapistId: number | null;

  status: BookingStatus;

  scheduledAt?: string | null;

  updatedAt?: string | null;

  sourceRole?: UserRole;
};

export type ServerToClientEvents = {
  "booking.created": (payload: BookingRealtimePayload) => void;

  "booking.updated": (payload: BookingRealtimePayload) => void;
};
