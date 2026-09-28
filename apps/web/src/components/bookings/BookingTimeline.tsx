"use client";

import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { BookingStatus, type BookingStatusHistory } from "@/types/booking";

type BookingTimelineProps = {
  histories: BookingStatusHistory[];
};

const STATUS_TRANSLATION_KEYS: Partial<Record<BookingStatus, string>> = {
  [BookingStatus.PENDING]: "timeline.status.pending",

  [BookingStatus.SEARCHING_THERAPIST]: "timeline.status.searchingTherapist",

  [BookingStatus.WAITING_THERAPIST_ACCEPT]:
    "timeline.status.waitingTherapistAccept",

  [BookingStatus.CONFIRMED]: "timeline.status.confirmed",

  [BookingStatus.THERAPIST_ON_THE_WAY]: "timeline.status.therapistOnTheWay",

  [BookingStatus.ARRIVED]: "timeline.status.arrived",

  [BookingStatus.IN_PROGRESS]: "timeline.status.inProgress",

  [BookingStatus.COMPLETED]: "timeline.status.completed",

  [BookingStatus.REJECTED]: "timeline.status.rejected",

  [BookingStatus.CANCELLED_BY_CLIENT]: "timeline.status.cancelledByClient",

  [BookingStatus.CANCELLED_BY_THERAPIST]:
    "timeline.status.cancelledByTherapist",

  [BookingStatus.CANCELLED_BY_ADMIN]: "timeline.status.cancelledByAdmin",

  [BookingStatus.EXPIRED]: "timeline.status.expired",
};

export const BookingTimeline = ({ histories }: BookingTimelineProps) => {
  const { t, i18n } = useTranslation("booking");

  const sorted = [...histories].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";

  const formatTimelineDateTime = (value: string) => {
    const date = new Date(value);

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const getStatusLabel = (status: BookingStatus) => {
    const translationKey = STATUS_TRANSLATION_KEYS[status];

    if (!translationKey) {
      return status;
    }

    return t(translationKey);
  };

  if (!sorted.length) {
    return (
      <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
        {t("timeline.empty")}
      </div>
    );
  }

  return (
    <div>
      {sorted.map((history, index) => {
        const last = index === sorted.length - 1;

        return (
          <div key={history.id} className="relative flex gap-4">
            {!last && (
              <div className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-slate-200" />
            )}

            <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="size-4" />
            </div>

            <div
              className={cn(
                "min-w-0 flex-1",

                !last && "pb-7"
              )}
            >
              <div className="font-semibold text-slate-900">
                {getStatusLabel(history.toStatus)}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {formatTimelineDateTime(history.createdAt)}
              </div>

              {history.note && (
                <p className="mt-2 text-sm text-slate-500">{history.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
