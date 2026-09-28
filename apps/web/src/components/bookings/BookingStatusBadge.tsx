"use client";

import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/Badge";

import { BookingStatus } from "@/types/booking";

type BookingStatusBadgeProps = {
  status: BookingStatus;
};

type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "info";

type StatusConfig = {
  translationKey: string;
  variant: BadgeVariant;
};

const STATUS_CONFIG: Record<BookingStatus, StatusConfig> = {
  [BookingStatus.PENDING]: {
    translationKey: "status.pending",
    variant: "warning",
  },

  [BookingStatus.SEARCHING_THERAPIST]: {
    translationKey: "status.searchingTherapist",
    variant: "info",
  },

  [BookingStatus.WAITING_THERAPIST_ACCEPT]: {
    translationKey: "status.waitingTherapistAccept",
    variant: "warning",
  },

  [BookingStatus.CONFIRMED]: {
    translationKey: "status.confirmed",
    variant: "success",
  },

  [BookingStatus.THERAPIST_ON_THE_WAY]: {
    translationKey: "status.therapistOnTheWay",
    variant: "info",
  },

  [BookingStatus.ARRIVED]: {
    translationKey: "status.arrived",
    variant: "info",
  },

  [BookingStatus.IN_PROGRESS]: {
    translationKey: "status.inProgress",
    variant: "info",
  },

  [BookingStatus.COMPLETED]: {
    translationKey: "status.completed",
    variant: "success",
  },

  [BookingStatus.CANCELLED_BY_CLIENT]: {
    translationKey: "status.cancelledByClient",
    variant: "danger",
  },

  [BookingStatus.CANCELLED_BY_THERAPIST]: {
    translationKey: "status.cancelledByTherapist",
    variant: "danger",
  },

  [BookingStatus.CANCELLED_BY_ADMIN]: {
    translationKey: "status.cancelledByAdmin",
    variant: "danger",
  },

  [BookingStatus.REJECTED]: {
    translationKey: "status.rejected",
    variant: "danger",
  },

  [BookingStatus.EXPIRED]: {
    translationKey: "status.expired",
    variant: "neutral",
  },
};

export const BookingStatusBadge = ({ status }: BookingStatusBadgeProps) => {
  const { t } = useTranslation("booking");

  const config = STATUS_CONFIG[status];

  /**
   * Phòng trường hợp BE bổ sung status mới
   * nhưng FE chưa cập nhật STATUS_CONFIG.
   */
  if (!config) {
    return <Badge variant="neutral">{status}</Badge>;
  }

  return <Badge variant={config.variant}>{t(config.translationKey)}</Badge>;
};
