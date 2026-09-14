export type TherapistSearchSort = "distance" | "rating" | "price";

export type TherapistSearchQuery = {
  serviceOptionId: number;

  date: string;
  startTime: string;

  latitude?: number;
  longitude?: number;

  provinceCode?: string;
  districtCode?: string;

  sortBy?: TherapistSearchSort;

  page?: number;
  limit?: number;
};

export type TherapistSearchItem = {
  therapistId: number;

  userId: number;

  fullName: string;

  avatarUrl?: string | null;

  serviceOptionId: number;

  serviceName: string;

  optionLabel: string;

  durationMinutes: number;

  price: number;

  platformFeeRate: number;

  experienceYears?: number | null;

  ratingAverage?: number | null;

  ratingCount?: number;

  completedBookings?: number;

  onlineStatus?: string | null;

  distanceKm?: number | null;

  available: boolean;
};

export type TherapistAvailabilitySlot = {
  startTime: string;

  endTime: string;

  available: boolean;

  reason?: string | null;
};

export type TherapistAvailabilitySlotsResult = {
  therapistId: number;

  serviceId: number;

  serviceOptionId: number;

  date: string;

  durationMinutes: number;

  slotInterval: number;

  available: boolean;

  reason?: string | null;

  slots: TherapistAvailabilitySlot[];
};

export type TherapistAvailabilityCheckResult = {
  therapistId: number;

  serviceId: number;

  serviceOptionId: number;

  date: string;

  startTime: string;

  endTime: string;

  durationMinutes: number;

  available: boolean;

  reason?: string | null;
};

export type TherapistSearchPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TherapistSearchResponse = {
  items: TherapistSearchItem[];

  pagination: TherapistSearchPagination;
};
