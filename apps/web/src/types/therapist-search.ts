export type TherapistSearchSort = "distance" | "rating" | "price";

export type TherapistGender = "unknown" | "male" | "female" | "other";

export type TherapistSearchAvailabilityStatus = "available_now" | "busy";

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

  /**
   * Chỉ giữ để tương thích response.
   *
   * Public Web không dùng tên thật.
   */
  fullName: string;

  stageName?: string | null;

  bio?: string | null;

  gender?: TherapistGender;

  hasTattoo?: boolean;

  avatarUrl?: string | null;

  images?: TherapistSearchImage[];

  serviceId: number;

  serviceName: string;

  minPrice: number;

  maxPrice: number;

  optionCount: number;

  experienceYears?: number | null;

  ratingAverage?: number | null;

  ratingCount?: number;

  completedBookings?: number;

  onlineStatus?: string | null;

  distanceKm?: number | null;

  /**
   * Trạng thái khả dụng tức thời.
   */
  availabilityStatus: TherapistSearchAvailabilityStatus;

  /**
   * ISO datetime.
   *
   * null khi:
   * - KTV đang rảnh
   * - hoặc đang thực hiện booking quá giờ dự kiến.
   */
  busyUntil: string | null;
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
