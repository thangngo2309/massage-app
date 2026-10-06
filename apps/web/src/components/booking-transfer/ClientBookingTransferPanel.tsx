"use client";

import {
  ArrowRightLeft,
  Check,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { useEffect, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

import { Button } from "@/components/ui/Button";

import {
  getClientBookingTransfer,
  respondClientBookingTransfer,
  setClientBookingTransferConsent,
} from "@/lib/booking-transfers";

import { getApiErrorMessage } from "@/lib/http";

import { useBookingTransferConsentStore } from "@/stores/booking-transfer-consent-store";

import { BookingTherapistTransferStatus } from "@/types/booking-transfer";

type Props = {
  bookingId: number;
};

const getTherapistName = (
  therapist:
    | {
        therapistId: number;
        stageName?: string | null;
        fullName?: string | null;
      }
    | undefined
) => {
  if (!therapist) {
    return "Kỹ thuật viên";
  }

  return (
    therapist.stageName || therapist.fullName || `KTV #${therapist.therapistId}`
  );
};

export const ClientBookingTransferPanel = ({ bookingId }: Props) => {
  const queryClient = useQueryClient();

  const syncStartedRef = useRef(false);

  const pendingBookingId = useBookingTransferConsentStore(
    (state) => state.pendingBookingId
  );

  const allowGroupTransfer = useBookingTransferConsentStore(
    (state) => state.allowGroupTransfer
  );

  const resetConsentStore = useBookingTransferConsentStore(
    (state) => state.reset
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["client-booking-transfer", bookingId],

    queryFn: () => getClientBookingTransfer(bookingId),

    enabled: Number.isInteger(bookingId) && bookingId > 0,

    /**
     * Chưa tích hợp transfer realtime.
     *
     * Polling giúp khách thấy ngay
     * khi B xác nhận yêu cầu chuyển.
     */
    refetchInterval: 5000,
  });

  const syncConsentMutation = useMutation({
    mutationFn: () => setClientBookingTransferConsent(bookingId, true),

    onSuccess: () => {
      resetConsentStore();

      void queryClient.invalidateQueries({
        queryKey: ["client-booking-transfer", bookingId],
      });
    },

    onError: (syncError) => {
      syncStartedRef.current = false;

      toast.error(
        `Booking đã được tạo nhưng chưa lưu được quyền chuyển KTV: ${getApiErrorMessage(
          syncError
        )}`
      );
    },
  });

  /**
   * Trường hợp:
   *
   * POST booking thành công
   * nhưng PUT consent lỗi.
   *
   * Detail page sẽ retry đúng
   * booking vừa tạo.
   */
  useEffect(() => {
    if (
      !data ||
      data.consent.allowed ||
      !allowGroupTransfer ||
      pendingBookingId !== bookingId ||
      syncStartedRef.current
    ) {
      return;
    }

    syncStartedRef.current = true;

    syncConsentMutation.mutate();
  }, [
    allowGroupTransfer,
    bookingId,
    data,
    pendingBookingId,
    syncConsentMutation,
  ]);

  const respondMutation = useMutation({
    mutationFn: (input: {
      transferId: number;

      accepted: boolean;
    }) =>
      respondClientBookingTransfer(input.transferId, {
        accepted: input.accepted,
      }),

    onSuccess: (_result, variables) => {
      toast.success(
        variables.accepted
          ? "Bạn đã đồng ý đổi kỹ thuật viên."
          : "Bạn đã từ chối kỹ thuật viên được đề xuất."
      );

      void queryClient.invalidateQueries({
        queryKey: ["client-booking-transfer", bookingId],
      });

      void queryClient.invalidateQueries({
        queryKey: ["my-booking", bookingId],
      });
    },

    onError: (respondError) => {
      toast.error(getApiErrorMessage(respondError));
    },
  });

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        {getApiErrorMessage(error)}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const transfer = data.transfer;

  if (!transfer) {
    if (!data.consent.allowed) {
      return null;
    }

    return (
      <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />

        <div>
          <div className="font-semibold text-emerald-900">
            Đã cho phép chuyển KTV trong nhóm
          </div>

          <p className="mt-1 text-sm leading-6 text-emerald-700">
            Nếu KTV hiện tại không thể nhận lịch, bạn sẽ được xác nhận KTV thay
            thế trước khi booking được chuyển.
          </p>
        </div>
      </div>
    );
  }

  const fromName = getTherapistName(transfer.fromTherapist);

  const toName = getTherapistName(transfer.toTherapist);

  if (transfer.status === BookingTherapistTransferStatus.PENDING_THERAPIST) {
    return (
      <div className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <Clock3 className="mt-0.5 size-5 shrink-0 text-amber-600" />

        <div>
          <div className="font-semibold text-amber-900">
            Đang chờ KTV được đề xuất xác nhận
          </div>

          <p className="mt-1 text-sm leading-6 text-amber-700">
            {fromName} đã đề nghị chuyển booking cho <strong>{toName}</strong>.
            Bạn chưa cần thao tác ở bước này.
          </p>
        </div>
      </div>
    );
  }

  if (transfer.status === BookingTherapistTransferStatus.PENDING_CLIENT) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
        <div className="flex gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
            <ArrowRightLeft className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-950">
              Xác nhận đổi kỹ thuật viên
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {fromName} không thể thực hiện booking và đề nghị chuyển cho một
              thành viên khác trong cùng nhóm.
            </p>

            <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <UserRound className="size-5" />
                </div>

                <div>
                  <div className="text-xs text-slate-400">KTV được đề xuất</div>

                  <div className="mt-0.5 font-bold text-slate-900">
                    {toName}
                  </div>
                </div>
              </div>
            </div>

            {transfer.reason && (
              <div className="mt-3 text-xs leading-5 text-slate-500">
                Lý do: {transfer.reason}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                loading={respondMutation.isPending}
                disabled={respondMutation.isPending}
                onClick={() =>
                  respondMutation.mutate({
                    transferId: transfer.id,

                    accepted: true,
                  })
                }
              >
                <Check className="size-4" />
                Đồng ý với {toName}
              </Button>

              <Button
                variant="outline"
                disabled={respondMutation.isPending}
                onClick={() =>
                  respondMutation.mutate({
                    transferId: transfer.id,

                    accepted: false,
                  })
                }
                className="text-red-600"
              >
                <X className="size-4" />
                Không đồng ý
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (transfer.status === BookingTherapistTransferStatus.READY_TO_ACCEPT) {
    return (
      <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" />

        <div>
          <div className="font-semibold text-emerald-900">
            Bạn đã đồng ý với {toName}
          </div>

          <p className="mt-1 text-sm leading-6 text-emerald-700">
            Đang chờ {toName} xác nhận nhận booking chính thức.
          </p>
        </div>
      </div>
    );
  }

  if (transfer.status === BookingTherapistTransferStatus.COMPLETED) {
    return (
      <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" />

        <div>
          <div className="font-semibold text-emerald-900">
            Đã đổi kỹ thuật viên
          </div>

          <p className="mt-1 text-sm leading-6 text-emerald-700">
            Booking hiện đã được <strong>{toName}</strong> xác nhận nhận chính
            thức.
          </p>
        </div>
      </div>
    );
  }

  return null;
};
