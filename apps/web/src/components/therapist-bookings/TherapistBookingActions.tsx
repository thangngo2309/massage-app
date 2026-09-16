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

import { toast } from "sonner";

import { Button } from "@/components/ui/Button";

import { getApiErrorMessage } from "@/lib/http";

import { updateTherapistBookingStatus } from "@/lib/therapist-bookings";

import { BookingStatus } from "@/types/booking";

type Props = {
  bookingId: number;

  status: BookingStatus;
};

export const TherapistBookingActions = ({ bookingId, status }: Props) => {
  const queryClient = useQueryClient();

  const [rejecting, setRejecting] = useState(false);

  const [rejectionReason, setRejectionReason] = useState("");

  const mutation = useMutation({
    mutationFn: (payload: {
      status: BookingStatus;

      reason?: string;
    }) => updateTherapistBookingStatus(bookingId, payload),

    onSuccess: () => {
      toast.success("Cập nhật booking thành công.");

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
    if (mutation.isPending) {
      return;
    }

    mutation.mutate({
      status: nextStatus,
      reason: reason?.trim() || undefined,
    });
  };

  if (status === BookingStatus.WAITING_THERAPIST_ACCEPT && rejecting) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
        <label className="text-sm font-semibold text-red-900">
          Lý do từ chối
        </label>

        <textarea
          rows={3}
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          placeholder="Nhập lý do..."
          className="mt-2 w-full resize-none rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400"
        />

        <div className="mt-3 flex gap-2">
          <Button
            variant="danger"
            loading={mutation.isPending}
            disabled={mutation.isPending || !rejectionReason.trim()}
            onClick={() =>
              updateStatus(BookingStatus.REJECTED, rejectionReason)
            }
          >
            Xác nhận từ chối
          </Button>

          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => {
              setRejecting(false);

              setRejectionReason("");
            }}
          >
            Hủy
          </Button>
        </div>
      </div>
    );
  }

  switch (status) {
    case BookingStatus.WAITING_THERAPIST_ACCEPT:
      return (
        <div className="grid grid-cols-2 gap-3">
          <Button
            loading={mutation.isPending}
            onClick={() => updateStatus(BookingStatus.CONFIRMED)}
          >
            <Check className="size-4" />
            Xác nhận
          </Button>

          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => setRejecting(true)}
            className="text-red-600"
          >
            <X className="size-4" />
            Từ chối
          </Button>
        </div>
      );

    case BookingStatus.CONFIRMED:
      return (
        <Button
          className="w-full"
          loading={mutation.isPending}
          onClick={() => updateStatus(BookingStatus.THERAPIST_ON_THE_WAY)}
        >
          <Navigation className="size-4" />
          Bắt đầu di chuyển
        </Button>
      );

    case BookingStatus.THERAPIST_ON_THE_WAY:
      return (
        <Button
          className="w-full"
          loading={mutation.isPending}
          onClick={() => updateStatus(BookingStatus.ARRIVED)}
        >
          <MapPinCheck className="size-4" />
          Đã đến nơi
        </Button>
      );

    case BookingStatus.ARRIVED:
      return (
        <Button
          className="w-full"
          loading={mutation.isPending}
          onClick={() => updateStatus(BookingStatus.IN_PROGRESS)}
        >
          <Play className="size-4" />
          Bắt đầu dịch vụ
        </Button>
      );

    case BookingStatus.IN_PROGRESS:
      return (
        <Button
          className="w-full"
          loading={mutation.isPending}
          onClick={() => updateStatus(BookingStatus.COMPLETED)}
        >
          <CheckCircle2 className="size-4" />
          Hoàn thành
        </Button>
      );

    default:
      return null;
  }
};
