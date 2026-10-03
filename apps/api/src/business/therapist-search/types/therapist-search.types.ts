export interface TherapistSearchImage {
  id: number;

  imageUrl: string;

  sortOrder: number;
}

export interface TherapistSearchItem {
  therapistId: number;

  userId: number;

  fullName: string;

  avatarUrl: string | null;

  /**
   * Gallery hình ảnh của KTV.
   */
  images: TherapistSearchImage[];

  /**
   * Service mà khách hàng đang tìm.
   *
   * Ở bước search KTV chưa chọn ServiceOption.
   */
  serviceId: number;

  serviceName: string;

  /**
   * Giá thấp nhất trong các ServiceOption active
   * mà KTV đang cung cấp thuộc Service đang tìm.
   */
  minPrice: number;

  /**
   * Giá cao nhất trong các ServiceOption active
   * mà KTV đang cung cấp thuộc Service đang tìm.
   */
  maxPrice: number;

  /**
   * Tổng số ServiceOption thuộc Service đang tìm
   * mà KTV hiện đang cung cấp.
   */
  optionCount: number;

  experienceYears: number;

  ratingAverage: number;

  ratingCount: number;

  completedBookings: number;

  onlineStatus: string;

  /**
   * Khoảng cách từ vị trí khách hàng đến vị trí hiện tại của KTV.
   *
   * null nếu:
   * - khách hàng không cung cấp tọa độ
   * - hoặc KTV chưa có current location
   */
  distanceKm: number | null;
}

export interface TherapistSearchResponse {
  items: TherapistSearchItem[];

  pagination: {
    page: number;

    limit: number;

    total: number;

    totalPages: number;
  };
}
