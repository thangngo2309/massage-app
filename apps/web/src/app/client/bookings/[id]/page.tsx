"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  RefreshCcw,
  UserRound,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { BookingTimeline } from "@/components/bookings/BookingTimeline";
import { BookingRatingCard } from "@/components/ratings/BookingRatingCard";
import { CreateRatingForm } from "@/components/ratings/CreateRatingForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";

import { getMyBooking } from "@/lib/bookings";
import { getApiErrorMessage } from "@/lib/http";
import { getRatingByBooking } from "@/lib/ratings";

import { BookingStatus } from "@/types/booking";

export default function ClientBookingDetailPage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const { t, i18n } = useTranslation("booking");

  const { t: tCommon } = useTranslation("common");

  const bookingId = Number(params.id);

  const validBookingId = Number.isInteger(bookingId) && bookingId > 0;

  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";

  /**
   * =========================================
   * BOOKING
   * =========================================
   */

  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["my-booking", bookingId],

    queryFn: () => getMyBooking(bookingId),

    enabled: validBookingId,
  });

  /**
   * =========================================
   * RATING
   * =========================================
   */

  const { data: rating, isLoading: loadingRating } = useQuery({
    queryKey: ["booking-rating", bookingId],

    queryFn: () => getRatingByBooking(bookingId),

    enabled: validBookingId && booking?.status === BookingStatus.COMPLETED,
  });

  /**
   * =========================================
   * FORMATTERS
   * =========================================
   */

  const formatBookingCurrency = (value: number | string) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value));

  const formatBookingDateTime = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  const formatBookingDuration = (minutes: number) => {
    if (minutes < 60) {
      return t("duration.minutes", {
        count: minutes,
      });
    }

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    if (!remainingMinutes) {
      return t("duration.hours", {
        count: hours,
      });
    }

    return t("duration.hoursMinutes", {
      hours,
      minutes: remainingMinutes,
    });
  };

  /**
   * =========================================
   * LOADING
   * =========================================
   */

  if (isLoading) {
    return (
      <PageContainer className="py-8">
        <div className="grid animate-pulse gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[500px] rounded-2xl bg-slate-100" />

          <div className="h-96 rounded-2xl bg-slate-100" />
        </div>
      </PageContainer>
    );
  }

  /**
   * =========================================
   * ERROR
   * =========================================
   */

  if (isError || !booking) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <RefreshCcw className="size-9 text-red-500" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t("detail.loadError")}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {getApiErrorMessage(error)}
          </p>

          <Button
            className="mt-5"
            loading={isFetching}
            onClick={() => void refetch()}
          >
            {tCommon("retry")}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <button
        type="button"
        onClick={() => router.push("/client/bookings")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft className="size-4" />

        {t("detail.backToBookings")}
      </button>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            {t("detail.bookingNumber", {
              id: booking.id,
            })}
          </h1>

          <p className="mt-1 text-sm text-slate-500">{booking.serviceName}</p>
        </div>

        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* BOOKING INFORMATION */}

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              {t("detail.information.title")}
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 size-5 text-emerald-700" />

                <div>
                  <div className="text-xs text-slate-400">
                    {t("detail.information.time")}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {formatBookingDateTime(booking.scheduledAt)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock3 className="mt-0.5 size-5 text-emerald-700" />

                <div>
                  <div className="text-xs text-slate-400">
                    {t("detail.information.duration")}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {formatBookingDuration(booking.durationMinutes)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 sm:col-span-2">
                <MapPin className="mt-0.5 size-5 shrink-0 text-emerald-700" />

                <div>
                  <div className="text-xs text-slate-400">
                    {t("detail.information.address")}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {booking.address}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <UserRound className="mt-0.5 size-5 text-emerald-700" />

                <div>
                  <div className="text-xs text-slate-400">
                    {t("detail.information.therapist")}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {booking.therapist?.fullName ||
                      t("detail.information.therapistUpdating")}
                  </div>
                </div>
              </div>
            </div>

            {booking.clientNote && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="text-xs text-slate-400">
                  {t("detail.information.note")}
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {booking.clientNote}
                </p>
              </div>
            )}
          </Card>

          {/* RATING */}

          {booking.status === BookingStatus.COMPLETED && (
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                {t("detail.ratingSection.title")}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {t("detail.ratingSection.description")}
              </p>

              <div className="mt-6">
                {loadingRating ? (
                  <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
                ) : rating ? (
                  <BookingRatingCard rating={rating} />
                ) : (
                  <CreateRatingForm
                    bookingId={booking.id}
                    therapistId={booking.therapist?.id}
                  />
                )}
              </div>
            </Card>
          )}

          {/* TIMELINE */}

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              {t("detail.timelineTitle")}
            </h2>

            <div className="mt-6">
              <BookingTimeline histories={booking.statusHistories ?? []} />
            </div>
          </Card>
        </div>

        {/* COST */}

        <aside>
          <div className="xl:sticky xl:top-24">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                {t("detail.cost.title")}
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    {t("detail.cost.service")}
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatBookingCurrency(booking.servicePrice)}
                  </span>
                </div>

                {!!booking.taxAmount && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-slate-500">
                      {t("detail.cost.tax")}
                    </span>

                    <span className="font-semibold text-slate-900">
                      {formatBookingCurrency(booking.taxAmount)}
                    </span>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <span className="font-semibold text-slate-900">
                      {t("detail.cost.total")}
                    </span>

                    <span className="text-2xl font-bold text-emerald-700">
                      {formatBookingCurrency(booking.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
