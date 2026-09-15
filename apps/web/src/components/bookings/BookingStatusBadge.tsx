import { Badge } from "@/components/ui/Badge";

import { BookingStatus } from "@/types/booking";

type BookingStatusBadgeProps = {
  status: BookingStatus;
};

const STATUS_CONFIG: Record<
  BookingStatus,
  {
    label: string;

    variant: "success" | "warning" | "danger" | "neutral" | "info";
  }
> = {
  [BookingStatus.PENDING]: {
    label: "Đang xử lý",
    variant: "warning",
  },

  [BookingStatus.SEARCHING_THERAPIST]: {
    label: "Đang tìm kỹ thuật viên",
    variant: "info",
  },

  [BookingStatus.WAITING_THERAPIST_ACCEPT]: {
    label: "Chờ kỹ thuật viên xác nhận",
    variant: "warning",
  },

  [BookingStatus.CONFIRMED]: {
    label: "Đã xác nhận",
    variant: "success",
  },

  [BookingStatus.THERAPIST_ON_THE_WAY]: {
    label: "Kỹ thuật viên đang đến",
    variant: "info",
  },

  [BookingStatus.ARRIVED]: {
    label: "Kỹ thuật viên đã đến",
    variant: "info",
  },

  [BookingStatus.IN_PROGRESS]: {
    label: "Đang thực hiện",
    variant: "info",
  },

  [BookingStatus.COMPLETED]: {
    label: "Hoàn thành",
    variant: "success",
  },

  [BookingStatus.CANCELLED_BY_CLIENT]: {
    label: "Khách hàng đã hủy",
    variant: "danger",
  },

  [BookingStatus.CANCELLED_BY_THERAPIST]: {
    label: "Kỹ thuật viên đã hủy",
    variant: "danger",
  },

  [BookingStatus.CANCELLED_BY_ADMIN]: {
    label: "Hệ thống đã hủy",
    variant: "danger",
  },

  [BookingStatus.REJECTED]: {
    label: "Kỹ thuật viên từ chối",
    variant: "danger",
  },

  [BookingStatus.EXPIRED]: {
    label: "Đã hết hạn",
    variant: "neutral",
  },
};

export const BookingStatusBadge = ({ status }: BookingStatusBadgeProps) => {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "neutral" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
