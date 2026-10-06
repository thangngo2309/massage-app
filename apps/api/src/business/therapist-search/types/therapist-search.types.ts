import type { Gender } from '../../enums/business.enums.js';

export type TherapistSearchAvailabilityStatus =
  | 'available_now'
  | 'busy';

export interface TherapistSearchImage {
  id: number;

  imageUrl: string;

  sortOrder: number;
}

export interface TherapistSearchItem {
  therapistId: number;

  userId: number;

  /**
   * Tên thật vẫn giữ trong response để không breaking
   * các consumer hiện tại như mobile/admin.
   *
   * Web Client tuyệt đối không dùng field này để hiển thị public.
   */
  fullName: string;

  /**
   * Nghệ danh dùng để hiển thị public cho khách hàng.
   */
  stageName: string | null;

  /**
   * Giới thiệu public của KTV.
   */
  bio: string | null;

  gender: Gender;

  hasTattoo: boolean;

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

  /**
   * Trạng thái khả dụng tức thời dựa trên booking.
   *
   * available_now:
   * Không có booking đang chiếm thời gian hiện tại.
   *
   * busy:
   * Đang có booking chiếm thời gian hiện tại
   * hoặc booking đang ở trạng thái thực hiện thực tế.
   */
  availabilityStatus: TherapistSearchAvailabilityStatus;

  /**
   * Thời điểm dự kiến KTV rảnh.
   *
   * ISO datetime.
   *
   * null khi:
   * - KTV đang rảnh
   * - hoặc KTV đang thực hiện booking quá giờ dự kiến,
   *   nên hệ thống không thể xác định giờ kết thúc chính xác.
   */
  busyUntil: string | null;
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