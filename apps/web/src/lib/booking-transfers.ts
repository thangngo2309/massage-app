import { apiFetch } from "@/lib/http";

import type { TherapistBooking } from "@/types/therapist-booking";

import type {
  BookingTherapistTransfer,
  BookingTransferCandidatesResponse,
  ClientBookingTransferResponse,
  CreateBookingTransferPayload,
  IncomingBookingTransfersResponse,
  RespondBookingTransferPayload,
} from "@/types/booking-transfer";

const ENDPOINTS = {
  clientDetail: (bookingId: number) =>
    `/client/booking-transfers/booking/${bookingId}`,

  clientConsent: (bookingId: number) =>
    `/client/booking-transfers/booking/${bookingId}/consent`,

  clientRespond: (transferId: number) =>
    `/client/booking-transfers/${transferId}/respond`,

  therapistIncoming: "/therapist/booking-transfers/incoming",

  therapistCandidates: (bookingId: number) =>
    `/therapist/booking-transfers/booking/${bookingId}/candidates`,

  therapistCreate: (bookingId: number) =>
    `/therapist/booking-transfers/booking/${bookingId}`,

  therapistRespond: (transferId: number) =>
    `/therapist/booking-transfers/${transferId}/respond`,

  therapistAccept: (transferId: number) =>
    `/therapist/booking-transfers/${transferId}/accept-booking`,
};

export const setClientBookingTransferConsent = (
  bookingId: number,
  allowed: boolean
) => {
  return apiFetch(ENDPOINTS.clientConsent(bookingId), {
    method: "PUT",

    body: JSON.stringify({
      allowed,
    }),
  });
};

export const getClientBookingTransfer = (bookingId: number) => {
  return apiFetch<ClientBookingTransferResponse>(
    ENDPOINTS.clientDetail(bookingId)
  );
};

export const respondClientBookingTransfer = (
  transferId: number,
  payload: RespondBookingTransferPayload
) => {
  return apiFetch<BookingTherapistTransfer>(
    ENDPOINTS.clientRespond(transferId),
    {
      method: "PATCH",

      body: JSON.stringify(payload),
    }
  );
};

export const getTherapistTransferCandidates = (bookingId: number) => {
  return apiFetch<BookingTransferCandidatesResponse>(
    ENDPOINTS.therapistCandidates(bookingId)
  );
};

export const createTherapistBookingTransfer = (
  bookingId: number,
  payload: CreateBookingTransferPayload
) => {
  return apiFetch<BookingTherapistTransfer>(
    ENDPOINTS.therapistCreate(bookingId),
    {
      method: "POST",

      body: JSON.stringify(payload),
    }
  );
};

export const getIncomingBookingTransfers = () => {
  return apiFetch<IncomingBookingTransfersResponse>(
    ENDPOINTS.therapistIncoming
  );
};

export const respondTherapistBookingTransfer = (
  transferId: number,
  payload: RespondBookingTransferPayload
) => {
  return apiFetch<BookingTherapistTransfer>(
    ENDPOINTS.therapistRespond(transferId),
    {
      method: "PATCH",

      body: JSON.stringify(payload),
    }
  );
};

export const acceptTransferredBooking = (transferId: number) => {
  return apiFetch<TherapistBooking>(ENDPOINTS.therapistAccept(transferId), {
    method: "POST",
  });
};
