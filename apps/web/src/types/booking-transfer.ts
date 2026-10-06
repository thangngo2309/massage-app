export enum BookingTherapistTransferStatus {
  PENDING_THERAPIST = "pending_therapist",
  PENDING_CLIENT = "pending_client",
  READY_TO_ACCEPT = "ready_to_accept",
  COMPLETED = "completed",
  REJECTED_BY_THERAPIST = "rejected_by_therapist",
  REJECTED_BY_CLIENT = "rejected_by_client",
  CANCELLED = "cancelled",
}

export type BookingTransferTherapist = {
  therapistId: number;

  stageName?: string | null;

  fullName?: string | null;
};

export type BookingTransferGroup = {
  id: number;

  name: string;
};

export type BookingTherapistTransfer = {
  id: number;

  bookingId: number;

  groupId: number;

  group?: BookingTransferGroup | null;

  fromTherapist: BookingTransferTherapist;

  toTherapist: BookingTransferTherapist;

  status: BookingTherapistTransferStatus;

  reason?: string | null;

  therapistRespondedAt?: string | null;

  clientRespondedAt?: string | null;

  completedAt?: string | null;

  createdAt: string;

  updatedAt?: string;
};

export type ClientBookingTransferResponse = {
  consent: {
    allowed: boolean;

    acceptedAt?: string | null;
  };

  transfer: BookingTherapistTransfer | null;
};

export type BookingTransferCandidate = {
  therapistId: number;

  stageName?: string | null;

  fullName?: string | null;

  ratingAverage: number;

  ratingCount: number;

  completedBookings: number;

  available: boolean;

  reason?: string | null;
};

export type BookingTransferCandidatesResponse = {
  groupId: number;

  items: BookingTransferCandidate[];
};

export type IncomingBookingTransfersResponse = {
  items: BookingTherapistTransfer[];
};

export type CreateBookingTransferPayload = {
  toTherapistId: number;

  reason?: string;
};

export type RespondBookingTransferPayload = {
  accepted: boolean;

  reason?: string;
};
