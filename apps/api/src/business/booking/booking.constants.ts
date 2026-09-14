import { BookingStatus } from '../enums/business.enums.js';

/**
 * Các trạng thái được coi là đang chiếm lịch therapist.
 *
 * COMPLETED / CANCELLED / REJECTED / EXPIRED
 * không còn block slot.
 */
export const BOOKING_BLOCKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.SEARCHING_THERAPIST,
  BookingStatus.WAITING_THERAPIST_ACCEPT,
  BookingStatus.CONFIRMED,
  BookingStatus.THERAPIST_ON_THE_WAY,
  BookingStatus.ARRIVED,
  BookingStatus.IN_PROGRESS,
];

export const BOOKING_STATUS_TRANSITIONS: Record<
  BookingStatus,
  BookingStatus[]
> = {
  [BookingStatus.PENDING]: [
    BookingStatus.SEARCHING_THERAPIST,
    BookingStatus.WAITING_THERAPIST_ACCEPT,
    BookingStatus.CANCELLED_BY_CLIENT,
    BookingStatus.CANCELLED_BY_ADMIN,
    BookingStatus.EXPIRED,
  ],
  [BookingStatus.SEARCHING_THERAPIST]: [
    BookingStatus.WAITING_THERAPIST_ACCEPT,
    BookingStatus.CANCELLED_BY_CLIENT,
    BookingStatus.CANCELLED_BY_ADMIN,
    BookingStatus.EXPIRED,
  ],
  [BookingStatus.WAITING_THERAPIST_ACCEPT]: [
    BookingStatus.CONFIRMED,
    BookingStatus.REJECTED,
    BookingStatus.CANCELLED_BY_CLIENT,
    BookingStatus.CANCELLED_BY_THERAPIST,
    BookingStatus.CANCELLED_BY_ADMIN,
    BookingStatus.EXPIRED,
  ],
  [BookingStatus.CONFIRMED]: [
    BookingStatus.THERAPIST_ON_THE_WAY,
    BookingStatus.CANCELLED_BY_CLIENT,
    BookingStatus.CANCELLED_BY_THERAPIST,
    BookingStatus.CANCELLED_BY_ADMIN,
  ],
  [BookingStatus.THERAPIST_ON_THE_WAY]: [
    BookingStatus.ARRIVED,
    BookingStatus.CANCELLED_BY_CLIENT,
    BookingStatus.CANCELLED_BY_THERAPIST,
    BookingStatus.CANCELLED_BY_ADMIN,
  ],
  [BookingStatus.ARRIVED]: [
    BookingStatus.IN_PROGRESS,
    BookingStatus.CANCELLED_BY_THERAPIST,
    BookingStatus.CANCELLED_BY_ADMIN,
  ],
  [BookingStatus.IN_PROGRESS]: [
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED_BY_ADMIN,
  ],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED_BY_CLIENT]: [],
  [BookingStatus.CANCELLED_BY_THERAPIST]: [],
  [BookingStatus.CANCELLED_BY_ADMIN]: [],
  [BookingStatus.REJECTED]: [],
  [BookingStatus.EXPIRED]: [],
};
