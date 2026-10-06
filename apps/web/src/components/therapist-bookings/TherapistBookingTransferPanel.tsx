"use client";

import {
  ArrowRightLeft,
  CheckCircle2,
  RefreshCcw,
  Star,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import Link from "next/link";

import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import { useTranslation } from "react-i18next";

import { toast } from "sonner";

import { Button } from "@/components/ui/Button";

import {
  createTherapistBookingTransfer,
  getTherapistTransferCandidates,
} from "@/lib/booking-transfers";

import { getApiErrorMessage } from "@/lib/http";

type Props = {
  bookingId: number;

  disabled?: boolean;

  onTransferCreated?: () => void;
};

export const TherapistBookingTransferPanel = ({
  bookingId,

  disabled = false,

  onTransferCreated,
}: Props) => {
  const { t } = useTranslation("bookingTransfer");

  const [opened, setOpened] = useState(false);

  const [selectedTherapistId, setSelectedTherapistId] = useState<number | null>(
    null
  );

  const [reason, setReason] = useState("");

  const [created, setCreated] = useState(false);

  /**
   * ==========================================================
   * TRANSFER CANDIDATES
   * ==========================================================
   *
   * Backend đã lọc:
   *
   * - Cùng nhóm với A.
   * - Active.
   * - Verified.
   * - Đang nhận booking.
   * - Có đầy đủ dịch vụ.
   * - Availability phù hợp.
   */
  const {
    data,

    isLoading,

    isError,

    error,

    refetch,

    isFetching,
  } = useQuery({
    queryKey: ["booking-transfer-candidates", bookingId],

    queryFn: () => getTherapistTransferCandidates(bookingId),

    enabled: opened && !created,
  });

  /**
   * ==========================================================
   * CREATE TRANSFER
   * ==========================================================
   */

  const createMutation = useMutation({
    mutationFn: () => {
      if (!selectedTherapistId) {
        throw new Error(t("therapist.errors.selectTherapist"));
      }

      return createTherapistBookingTransfer(bookingId, {
        toTherapistId: selectedTherapistId,

        reason: reason.trim() || undefined,
      });
    },

    onSuccess: (transfer) => {
      /**
       * Sau bước này:
       *
       * booking.therapistId vẫn là A.
       *
       * transfer:
       * pending_therapist
       *
       * Đang chờ B đồng ý.
       */
      setCreated(true);

      setSelectedTherapistId(transfer.toTherapist.therapistId);

      onTransferCreated?.();

      toast.success(t("therapist.messages.requestSent"));
    },

    onError: (mutationError) => {
      toast.error(getApiErrorMessage(mutationError));
    },
  });

  /**
   * ==========================================================
   * TRANSFER CREATED
   * ==========================================================
   */

  if (created) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-blue-700" />

          <div>
            <div className="font-semibold text-blue-900">
              {t("therapist.created.title")}
            </div>

            <p className="mt-1 text-sm leading-6 text-blue-700">
              {t("therapist.created.description")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ==========================================================
   * CLOSED
   * ==========================================================
   */

  if (!opened) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={disabled}
          onClick={() => setOpened(true)}
        >
          <ArrowRightLeft className="size-4" />

          {t("therapist.actions.open")}
        </Button>

        <div className="text-center">
          <Link
            href="/therapist/group"
            className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline"
          >
            {t("therapist.actions.manageGroup")}
          </Link>
        </div>
      </div>
    );
  }

  /**
   * ==========================================================
   * OPEN PANEL
   * ==========================================================
   */

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-bold text-slate-950">
            <UsersRound className="size-5 shrink-0 text-emerald-700" />

            <span>{t("therapist.panel.title")}</span>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {t("therapist.panel.description")}
          </p>
        </div>

        <button
          type="button"
          aria-label={t("therapist.actions.close")}
          title={t("therapist.actions.close")}
          disabled={createMutation.isPending}
          onClick={() => setOpened(false)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* =================================================== */}
      {/* CANDIDATE LIST */}
      {/* =================================================== */}

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-xl bg-white"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm leading-6 text-red-700">
            {getApiErrorMessage(error)}
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            loading={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCcw className="size-4" />

            {t("therapist.actions.retry")}
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {data?.items.length ? (
            data.items.map((candidate) => {
              const selected = selectedTherapistId === candidate.therapistId;

              const name =
                candidate.stageName ||
                candidate.fullName ||
                t("therapist.candidate.fallbackName", {
                  id: candidate.therapistId,
                });

              return (
                <button
                  key={candidate.therapistId}
                  type="button"
                  disabled={!candidate.available || createMutation.isPending}
                  onClick={() => setSelectedTherapistId(candidate.therapistId)}
                  className={[
                    "w-full rounded-xl border p-3 text-left transition",

                    selected
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10"
                      : "border-slate-200 bg-white",

                    candidate.available
                      ? "hover:border-emerald-300"
                      : "cursor-not-allowed opacity-60",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <UserRound className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-slate-900">
                        {name}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Star className="size-3.5" />

                          {Number(candidate.ratingAverage ?? 0).toFixed(1)}
                        </span>

                        <span>
                          {t("therapist.candidate.completedBookings", {
                            count: candidate.completedBookings,
                          })}
                        </span>
                      </div>

                      {!candidate.available && candidate.reason && (
                        <div className="mt-1.5 text-xs leading-5 text-red-600">
                          {candidate.reason}
                        </div>
                      )}
                    </div>

                    {selected && (
                      <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-xl border border-slate-100 bg-white p-4 text-center text-sm text-slate-500">
              {t("therapist.empty")}
            </div>
          )}
        </div>
      )}

      {/* =================================================== */}
      {/* REASON */}
      {/* =================================================== */}

      <div className="mt-4">
        <label
          htmlFor={`booking-transfer-reason-${bookingId}`}
          className="text-sm font-semibold text-slate-700"
        >
          {t("therapist.reason.label")}
        </label>

        <textarea
          id={`booking-transfer-reason-${bookingId}`}
          rows={3}
          value={reason}
          disabled={createMutation.isPending}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t("therapist.reason.placeholder")}
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
        />
      </div>

      {/* =================================================== */}
      {/* SUBMIT */}
      {/* =================================================== */}

      <Button
        type="button"
        className="mt-4 w-full"
        disabled={disabled || !selectedTherapistId || createMutation.isPending}
        loading={createMutation.isPending}
        onClick={() => createMutation.mutate()}
      >
        <ArrowRightLeft className="size-4" />

        {t("therapist.actions.sendRequest")}
      </Button>
    </div>
  );
};
