export enum TherapistUnavailableReason {
  THERAPIST_INACTIVE = 'therapist_inactive',

  NOT_VERIFIED = 'not_verified',

  NOT_ACCEPTING_BOOKINGS = 'not_accepting_bookings',

  /**
   * Một hoặc nhiều TherapistService:
   *
   * - không tồn tại
   * - không thuộc KTV
   * - không active
   * - ServiceOption không active
   * - Service không active
   */
  THERAPIST_SERVICE_UNAVAILABLE = 'therapist_service_unavailable',

  OUTSIDE_WORKING_HOURS = 'outside_working_hours',

  SCHEDULE_EXCEPTION = 'schedule_exception',

  BOOKING_CONFLICT = 'booking_conflict',

  PAST_TIME = 'past_time',

  /**
   * Giữ lại để tương thích với code cũ trong thời gian
   * chuyển đổi Booking sang multi-service.
   */
  SERVICE_OPTION_UNAVAILABLE = 'service_option_unavailable',

  SERVICE_NOT_SUPPORTED = 'service_not_supported',
}

export interface TherapistAvailabilitySelectedService {
  therapistServiceId: number;

  serviceOptionId: number;

  serviceId: number;

  durationMinutes: number;
}

export interface TherapistAvailabilityCheckResult {
  therapistId: number;

  therapistServiceIds: number[];

  selectedServices: TherapistAvailabilitySelectedService[];

  date: string;

  startTime: string;

  endTime: string;

  /**
   * Tổng thời lượng của tất cả service option.
   */
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

  therapistServiceIds: number[];

  selectedServices: TherapistAvailabilitySelectedService[];

  date: string;

  /**
   * Tổng thời lượng của tất cả dịch vụ.
   */
  durationMinutes: number;

  slotInterval: number;

  available: boolean;

  reason: TherapistUnavailableReason | null;

  slots: TherapistAvailabilitySlot[];
}
