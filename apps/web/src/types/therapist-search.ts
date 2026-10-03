export type TherapistSearchSort = "distance" | "rating" | "price";

export type TherapistSearchQuery = {
  serviceId: number;

  latitude?: number;

  longitude?: number;

  provinceCode?: string;

  wardCode?: string;

  sortBy?: TherapistSearchSort;

  page?: number;

  limit?: number;
};

export type TherapistSearchImage = {
  id: number;

  imageUrl: string;

  sortOrder: number;
};

export type TherapistSearchItem = {
  therapistId: number;

  userId: number;

  fullName: string;

  avatarUrl?: string | null;

  images: TherapistSearchImage[];

  serviceId: number;

  serviceName: string;

  /**
   * Khoảng giá của các option thuộc Service
   * mà KTV đang cung cấp.
   */
  minPrice: number;

  maxPrice: number;

  optionCount: number;

  experienceYears?: number | null;

  ratingAverage?: number | null;

  ratingCount?: number;

  completedBookings?: number;

  onlineStatus?: string | null;

  distanceKm?: number | null;
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

/**
 * ==========================================================
 * PUBLIC THERAPIST SERVICES
 * ==========================================================
 */

export type TherapistPublicServiceOption = {
  /**
   * ID quan trọng nhất cho booking flow mới.
   */
  therapistServiceId: number;

  serviceOptionId: number;

  label: string | null;

  durationMinutes: number;

  price: number;

  platformFeeRate: number;
};

export type TherapistPublicService = {
  serviceId: number;

  name: string;

  slug: string;

  imageUrl?: string | null;

  options: TherapistPublicServiceOption[];
};

export type TherapistPublicServicesResponse = {
  therapist: {
    id: number;

    userId: number;

    fullName: string;

    avatarUrl?: string | null;

    isAcceptingBookings: boolean;
  };

  services: TherapistPublicService[];
};

/**
 * ==========================================================
 * AVAILABILITY
 * ==========================================================
 */

export type TherapistAvailabilitySelectedService = {
  therapistServiceId: number;

  serviceOptionId: number;

  serviceId: number;

  durationMinutes: number;
};

export type TherapistAvailabilitySlot = {
  startTime: string;

  endTime: string;

  available: boolean;

  reason?: string | null;
};

export type TherapistAvailabilitySlotsResult = {
  therapistId: number;

  therapistServiceIds: number[];

  selectedServices: TherapistAvailabilitySelectedService[];

  date: string;

  durationMinutes: number;

  slotInterval: number;

  available: boolean;

  reason?: string | null;

  slots: TherapistAvailabilitySlot[];
};

export type TherapistAvailabilityCheckResult = {
  therapistId: number;

  therapistServiceIds: number[];

  selectedServices: TherapistAvailabilitySelectedService[];

  date: string;

  startTime: string;

  endTime: string;

  durationMinutes: number;

  available: boolean;

  reason?: string | null;
};
