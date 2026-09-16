export type TherapistVerificationStatus = "pending" | "verified" | "rejected";

export type TherapistSelfProfile = {
  id: number;

  userId: number;

  fullName: string;

  phone: string;

  email?: string | null;

  avatarUrl?: string | null;

  bio?: string | null;

  experienceYears?: number | null;

  verificationStatus: TherapistVerificationStatus;

  isAcceptingBookings: boolean;

  ratingAverage?: number | null;

  ratingCount?: number;

  completedBookings?: number;

  createdAt?: string;
  updatedAt?: string;
};

export type UpdateTherapistProfilePayload = {
  fullName: string;
  bio?: string | null;
  experienceYears?: number | null;
};

export type UpdateAcceptingBookingsPayload = {
  isAcceptingBookings: boolean;
};

export type TherapistSelfService = {
  id: number;

  therapistId: number;

  serviceOptionId: number;

  serviceName: string;

  optionLabel: string;

  durationMinutes: number;

  defaultPrice: number;

  price: number;

  platformFeeRate: number;

  isActive: boolean;
};

export type UpdateTherapistServicePayload = {
  price: number;

  isActive: boolean;
};

export type TherapistWorkingHour = {
  id?: number;

  dayOfWeek: number;

  startTime: string;

  endTime: string;

  isActive: boolean;
};

export type TherapistWorkingHourInput = {
  dayOfWeek: number;

  startTime: string;

  endTime: string;

  isActive: boolean;
};

export type ReplaceWorkingHoursPayload = {
  items: TherapistWorkingHourInput[];
};

export type TherapistScheduleException = {
  id: number;

  date: string;

  isDayOff: boolean;

  startTime?: string | null;

  endTime?: string | null;

  note?: string | null;

  createdAt?: string;
};

export type CreateTherapistScheduleExceptionPayload = {
  date: string;

  isDayOff: boolean;

  startTime?: string;

  endTime?: string;

  note?: string;
};
