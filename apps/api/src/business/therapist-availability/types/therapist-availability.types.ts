export enum TherapistUnavailableReason {
  THERAPIST_INACTIVE = 'therapist_inactive',
  NOT_VERIFIED = 'not_verified',
  NOT_ACCEPTING_BOOKINGS = 'not_accepting_bookings',
  SERVICE_OPTION_UNAVAILABLE = 'service_option_unavailable',
  SERVICE_NOT_SUPPORTED = 'service_not_supported',
  OUTSIDE_WORKING_HOURS = 'outside_working_hours',
  SCHEDULE_EXCEPTION = 'schedule_exception',
  BOOKING_CONFLICT = 'booking_conflict',
  PAST_TIME = 'past_time',
}

export interface TherapistAvailabilityCheckResult {
  therapistId: number;
  serviceId: number;
  serviceOptionId: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  available: boolean;
  reason: TherapistUnavailableReason | null;
}

export interface TherapistAvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason: TherapistUnavailableReason | null;
}

export interface TherapistAvailabilitySlotsResult {
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
