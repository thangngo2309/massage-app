export type TherapistSearchSort = "distance" | "rating" | "price";

export type TherapistGender = "unknown" | "male" | "female" | "other";

/**
 * ============================================================
 * CURRENT AVAILABILITY
 * ============================================================
 */
export type TherapistSearchAvailabilityStatus = "available_now" | "busy";

/**
 * ============================================================
 * SEARCH QUERY
 * ============================================================
 *
 * Flow search mới:
 *
 * Service
 * → tìm KTV
 * → vào KTV
 * → mới chọn ServiceOption.
 */
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

/**
 * ============================================================
 * THERAPIST IMAGES
 * ============================================================
 */
export type TherapistSearchImage = {
  id: number;

  imageUrl: string;

  sortOrder: number;
};

/**
 * ============================================================
 * SEARCH ITEM
 * ============================================================
 */
export type TherapistSearchItem = {
  therapistId: number;

  userId: number;

  /**
   * Giữ lại để tương thích API / các consumer khác.
   *
   * Web Client không dùng tên thật để hiển thị public.
   */
  fullName: string;

  /**
   * Nghệ danh public.
   */
  stageName: string | null;

  bio: string | null;

  gender: TherapistGender;

  hasTattoo: boolean;

  avatarUrl: string | null;

  /**
   * PHẢI là array bắt buộc.
   *
   * Không để optional vì các màn hình detail
   * đang dùng trực tiếp:
   *
   * therapist.images.length
   */
  images: TherapistSearchImage[];

  /**
   * Service đang được khách tìm.
   */
  serviceId: number;

  serviceName: string;

  /**
   * Giá thấp nhất / cao nhất của các option
   * mà KTV cung cấp trong Service này.
   */
  minPrice: number;

  maxPrice: number;

  optionCount: number;

  experienceYears: number;

  ratingAverage: number;

  ratingCount: number;

  completedBookings: number;

  onlineStatus: string;

  distanceKm: number | null;

  /**
   * Trạng thái khả dụng tức thời.
   *
   * available_now:
   * không có booking đang chiếm thời gian hiện tại.
   *
   * busy:
   * đang có booking chưa kết thúc.
   */
  availabilityStatus: TherapistSearchAvailabilityStatus;

  /**
   * ISO datetime.
   *
   * null:
   * - khi đang rảnh
   * - hoặc KTV đang thực hiện booking quá expectedEndAt
   *   nên chưa xác định được thời điểm kết thúc.
   */
  busyUntil: string | null;
};

/**
 * ============================================================
 * SEARCH RESPONSE
 * ============================================================
 */
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
 * ============================================================
 * PUBLIC THERAPIST SERVICES
 * ============================================================
 *
 * Response phải bám đúng contract của Backend:
 *
 * serviceName
 * serviceSlug
 * serviceImageUrl
 *
 * Không map sang name / slug / imageUrl để tránh lệch contract.
 */

/**
 * Một ServiceOption mà KTV đang cung cấp.
 */
export type TherapistPublicServiceOption = {
  /**
   * ID TherapistService.
   *
   * Đây là ID được dùng khi tạo booking multi-service.
   */
  therapistServiceId: number;

  serviceOptionId: number;

  label: string | null;

  durationMinutes: number;

  /**
   * Giá thực tế của KTV.
   */
  price: number;

  /**
   * Phí nền tảng cấu hình riêng cho KTV + option này.
   */
  platformFeeRate: number;
};

/**
 * Một nhóm Service của KTV.
 *
 * Frontend dùng trực tiếp field đúng theo response Backend:
 *
 * group.serviceId
 * group.serviceName
 * group.serviceSlug
 * group.serviceImageUrl
 * group.options
 */
export type TherapistPublicService = {
  serviceId: number;

  serviceName: string;

  serviceSlug: string;

  serviceImageUrl: string | null;

  options: TherapistPublicServiceOption[];
};

/**
 * Response của endpoint lấy toàn bộ dịch vụ public của KTV.
 */
export type TherapistPublicServicesResponse = {
  therapistId: number;

  userId: number;

  fullName: string;

  avatarUrl: string | null;

  onlineStatus: string;

  isAcceptingBookings: boolean;

  services: TherapistPublicService[];
};

/**
 * ============================================================
 * AVAILABILITY
 * ============================================================
 */
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
