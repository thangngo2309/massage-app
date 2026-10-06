"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Check,
  CheckCircle2,
  MapPinCheck,
  Navigation,
  Play,
  X,
} from "lucide-react";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { toast } from "sonner";

import { TherapistBookingTransferPanel } from "@/components/therapist-bookings/TherapistBookingTransferPanel";

import { Button } from "@/components/ui/Button";

import { getApiErrorMessage } from "@/lib/http";

import { updateTherapistBookingStatus } from "@/lib/therapist-bookings";

import { BookingStatus } from "@/types/booking";

type Props = {
  bookingId: number;

  status: BookingStatus;
};

export const TherapistBookingActions = ({ bookingId, status }: Props) => {
  const { t } = useTranslation("therapistBooking");

  const queryClient = useQueryClient();

  const [rejecting, setRejecting] = useState(false);

  const [rejectionReason, setRejectionReason] = useState("");

  /**
   * Sau khi A đã tạo transfer request,
   * không cho A tiếp tục Accept/Reject
   * booking ngay trên phiên UI hiện tại.
   */
  const [transferCreated, setTransferCreated] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: {
      status: BookingStatus;

      reason?: string;
    }) => updateTherapistBookingStatus(bookingId, payload),

    onSuccess: () => {
      toast.success(t("actions.updateSuccess"));

      setRejecting(false);

      setRejectionReason("");

      void queryClient.invalidateQueries({
        queryKey: ["therapist-booking", bookingId],
      });

      void queryClient.invalidateQueries({
        queryKey: ["therapist-bookings"],
      });

      void queryClient.invalidateQueries({
        queryKey: ["therapist-dashboard-bookings"],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const updateStatus = (nextStatus: BookingStatus, reason?: string) => {
    if (mutation.isPending || transferCreated) {
      return;
    }

    mutation.mutate({
      status: nextStatus,

      reason: reason?.trim() || undefined,
    });
  };

  /**
   * ==========================================================
   * REJECT FORM
   * ==========================================================
   */

  if (status === BookingStatus.WAITING_THERAPIST_ACCEPT && rejecting) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
        <label className="text-sm font-semibold text-red-900">
          {t("actions.rejectReasonLabel")}
        </label>

        <textarea
          rows={3}
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          placeholder={t("actions.rejectReasonPlaceholder")}
          className="mt-2 w-full resize-none rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
        />

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="danger"
            loading={mutation.isPending}
            disabled={mutation.isPending || !rejectionReason.trim()}
            onClick={() =>
              updateStatus(BookingStatus.REJECTED, rejectionReason)
            }
          >
            {t("actions.confirmReject")}
          </Button>

          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => {
              setRejecting(false);

              setRejectionReason("");
            }}
          >
            {t("actions.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  /**
   * ==========================================================
   * BOOKING ACTIONS
   * ==========================================================
   */

  switch (status) {
    /**
     * --------------------------------------------------------
     * WAITING THERAPIST ACCEPT
     * --------------------------------------------------------
     *
     * A có 3 lựa chọn:
     *
     * 1. Xác nhận booking.
     * 2. Từ chối booking.
     * 3. Chủ động chuyển cho B trong cùng nhóm.
     */
    case BookingStatus.WAITING_THERAPIST_ACCEPT:
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              loading={mutation.isPending}
              disabled={transferCreated}
              onClick={() => updateStatus(BookingStatus.CONFIRMED)}
            >
              <Check className="size-4" />

              {t("actions.confirm")}
            </Button>

            <Button
              variant="outline"
              disabled={mutation.isPending || transferCreated}
              onClick={() => setRejecting(true)}
              className="text-red-600"
            >
              <X className="size-4" />

              {t("actions.reject")}
            </Button>
          </div>

          <TherapistBookingTransferPanel
            bookingId={bookingId}
            disabled={mutation.isPending || transferCreated}
            onTransferCreated={() => setTransferCreated(true)}
          />

          {transferCreated && (
            <p className="rounded-xl bg-blue-50 px-3 py-2 text-center text-xs leading-5 text-blue-700">
              {t("actions.transferInProgress")}
            </p>
          )}
        </div>
      );

    /**
     * --------------------------------------------------------
     * CONFIRMED
     * --------------------------------------------------------
     */
    case BookingStatus.CONFIRMED:
      return (
        <Button
          className="w-full"
          loading={mutation.isPending}
          onClick={() => updateStatus(BookingStatus.THERAPIST_ON_THE_WAY)}
        >
          <Navigation className="size-4" />

          {t("actions.startTravel")}
        </Button>
      );

    /**
     * --------------------------------------------------------
     * ON THE WAY
     * --------------------------------------------------------
     */
    case BookingStatus.THERAPIST_ON_THE_WAY:
      return (
        <Button
          className="w-full"
          loading={mutation.isPending}
          onClick={() => updateStatus(BookingStatus.ARRIVED)}
        >
          <MapPinCheck className="size-4" />

          {t("actions.arrived")}
        </Button>
      );

    /**
     * --------------------------------------------------------
     * ARRIVED
     * --------------------------------------------------------
     */
    case BookingStatus.ARRIVED:
      return (
        <Button
          className="w-full"
          loading={mutation.isPending}
          onClick={() => updateStatus(BookingStatus.IN_PROGRESS)}
        >
          <Play className="size-4" />

          {t("actions.startService")}
        </Button>
      );

    /**
     * --------------------------------------------------------
     * IN PROGRESS
     * --------------------------------------------------------
     */
    case BookingStatus.IN_PROGRESS:
      return (
        <Button
          className="w-full"
          loading={mutation.isPending}
          onClick={() => updateStatus(BookingStatus.COMPLETED)}
        >
          <CheckCircle2 className="size-4" />

          {t("actions.complete")}
        </Button>
      );

    default:
      return null;
  }
};
