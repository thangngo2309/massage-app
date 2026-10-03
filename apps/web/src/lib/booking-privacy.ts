import { BookingStatus } from "@/types/booking";

type BookingContactVisibilitySource = {
  status: BookingStatus;

  acceptedAt?: string | null;
};

const POST_ACCEPTANCE_STATUSES = new Set<BookingStatus>([
  BookingStatus.CONFIRMED,
  BookingStatus.THERAPIST_ON_THE_WAY,
  BookingStatus.ARRIVED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
]);

/**
 * Contact information chỉ được hiển thị sau khi KTV đã chấp nhận booking.
 *
 * acceptedAt được ưu tiên để xử lý đúng cả trường hợp booking
 * đã từng được chấp nhận nhưng sau đó bị hủy.
 *
 * Danh sách status phía trên là fallback cho dữ liệu legacy
 * có thể chưa có acceptedAt.
 */
export const canShowBookingContactInfo = (
  booking: BookingContactVisibilitySource
): boolean => {
  if (booking.acceptedAt) {
    return true;
  }

  return POST_ACCEPTANCE_STATUSES.has(booking.status);
};
