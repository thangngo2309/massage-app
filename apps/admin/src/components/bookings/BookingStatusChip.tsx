"use client";

import { Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";

import type { BookingStatus } from "@/lib/bookings";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Chờ xử lý",
  searching_therapist: "Đang tìm kỹ thuật viên",
  waiting_therapist_accept: "Chờ kỹ thuật viên nhận",
  confirmed: "Đã xác nhận",
  therapist_on_the_way: "Kỹ thuật viên đang đến",
  arrived: "Đã đến",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  cancelled_by_client: "Khách hủy",
  cancelled_by_therapist: "Kỹ thuật viên hủy",
  cancelled_by_admin: "Admin hủy",
  rejected: "Từ chối",
  expired: "Hết hạn",
};

const BOOKING_STATUS_COLORS: Record<BookingStatus, ChipProps["color"]> = {
  pending: "default",
  searching_therapist: "info",
  waiting_therapist_accept: "warning",
  confirmed: "primary",
  therapist_on_the_way: "info",
  arrived: "info",
  in_progress: "warning",
  completed: "success",
  cancelled_by_client: "error",
  cancelled_by_therapist: "error",
  cancelled_by_admin: "error",
  rejected: "error",
  expired: "default",
};

interface Props {
  status: BookingStatus;
}

export function BookingStatusChip({ status }: Props) {
  return (
    <Chip
      size="small"
      label={BOOKING_STATUS_LABELS[status]}
      color={BOOKING_STATUS_COLORS[status]}
      variant={status === "expired" ? "outlined" : "filled"}
    />
  );
}
