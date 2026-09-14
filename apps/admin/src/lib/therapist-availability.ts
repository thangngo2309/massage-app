import { apiRequest } from "@/lib/api";

export type TherapistUnavailableReason =
  | "therapist_inactive"
  | "not_verified"
  | "not_accepting_bookings"
  | "service_option_unavailable"
  | "service_not_supported"
  | "outside_working_hours"
  | "schedule_exception"
  | "booking_conflict"
  | "past_time";

export interface TherapistAvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason: TherapistUnavailableReason | null;
}

export interface TherapistAvailabilitySlotsResponse {
  therapistId: number;
  serviceId: number;
  serviceOptionId: number;
  date: string;
  durationMinutes: number;
  slotInterval: number;
  available: boolean;
  reason: TherapistUnavailableReason | null;
  slots: TherapistAvailabilitySlot[];
}

export interface GetTherapistAvailabilitySlotsParams {
  serviceId: number;
  serviceOptionId: number;
  date: string;
  slotInterval?: number;
}

export async function getTherapistAvailabilitySlotsApi(
  therapistId: number,
  params: GetTherapistAvailabilitySlotsParams
) {
  const searchParams = new URLSearchParams();
  searchParams.set("serviceId", String(params.serviceId));
  searchParams.set("serviceOptionId", String(params.serviceOptionId));
  searchParams.set("date", params.date);

  if (params.slotInterval) {
    searchParams.set("slotInterval", String(params.slotInterval));
  }

  return apiRequest<TherapistAvailabilitySlotsResponse>(
    `/therapists/${therapistId}/availability/slots?${searchParams.toString()}`
  );
}
