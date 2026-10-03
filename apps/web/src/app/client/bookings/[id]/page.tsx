"use client";

import { useQuery } from "@tanstack/react-query";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Layers3,
  MapPin,
  RefreshCcw,
  TicketPercent,
  UserRound,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";

import { useMemo } from "react";

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

import { BookingStatus, type ClientBookingItem } from "@/types/booking";

export default function ClientBookingDetailPage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const { t, i18n } = useTranslation("booking");

  const { t: tCommon } = useTranslation("common");

  const bookingId = Number(params.id);

  const validBookingId = Number.isInteger(bookingId) && bookingId > 0;

  const language = (i18n.resolvedLanguage ?? i18n.language ?? "vi")
    .split("-")[0]
    .toLowerCase();

  const locale = language === "en" ? "en-US" : "vi-VN";

  const {
    data: booking,

    isLoading,

    isError,

    error,

    refetch,

    isFetching,
  } = useQuery({
    queryKey: ["my-booking", bookingId, language],

    queryFn: () => getMyBooking(bookingId, language),

    enabled: validBookingId,
  });

  const {
    data: rating,

    isLoading: loadingRating,
  } = useQuery({
    queryKey: ["booking-rating", bookingId],

    queryFn: () => getRatingByBooking(bookingId),

    enabled: validBookingId && booking?.status === BookingStatus.COMPLETED,
  });

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
   * Booking cũ trước migration vẫn có thể fallback
   * về legacy single-service fields.
   */
  const displayItems = useMemo<ClientBookingItem[]>(() => {
    if (!booking) {
      return [];
    }

    if (booking.items?.length) {
      return [...booking.items].sort(
        (left, right) => left.sortOrder - right.sortOrder
      );
    }

    return [
      {
        id: -1,

        serviceId: 0,

        serviceOptionId: booking.serviceOptionId,

        therapistServiceId: booking.therapistServiceId,

        serviceName: booking.serviceName,

        optionLabel: booking.serviceOptionLabel,

        durationMinutes: booking.durationMinutes,

        price: booking.servicePrice,

        sortOrder: 0,
      },
    ];
  }, [booking]);

  if (isLoading) {
    return (
      <PageContainer className="py-8">
        <div className="grid animate-pulse gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[560px] rounded-2xl bg-slate-100" />

          <div className="h-96 rounded-2xl bg-slate-100" />
        </div>
      </PageContainer>
    );
  }

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

  const discountAmount = Number(booking.discountAmount ?? 0);

  const firstServiceName = displayItems[0]?.serviceName || booking.serviceName;

  const extraServices = Math.max(0, displayItems.length - 1);

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

          <p className="mt-1 text-sm text-slate-500">
            {extraServices > 0
              ? t("detail.multiServiceSummary", {
                  service: firstServiceName,

                  count: extraServices,

                  defaultValue: `${firstServiceName} + ${extraServices} dịch vụ khác`,
                })
              : firstServiceName}
          </p>
        </div>

        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
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

          {/* MULTI-SERVICE */}

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Layers3 className="size-5 text-emerald-700" />

              <h2 className="text-lg font-bold text-slate-950">
                {t("detail.services.title", {
                  defaultValue: "Dịch vụ đã đặt",
                })}
              </h2>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {displayItems.map((item, index) => (
                <div
                  key={
                    item.id > 0 ? item.id : `${item.serviceOptionId}-${index}`
                  }
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-950">
                      {item.serviceName}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      {item.optionLabel && <span>{item.optionLabel}</span>}

                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="size-3.5" />

                        {formatBookingDuration(item.durationMinutes)}
                      </span>
                    </div>
                  </div>

                  <div className="font-bold text-emerald-700">
                    {formatBookingCurrency(item.price)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <div className="text-xs text-slate-400">
                  {t("detail.services.totalDuration", {
                    defaultValue: "Tổng thời lượng",
                  })}
                </div>

                <div className="mt-1 font-bold text-slate-900">
                  {formatBookingDuration(booking.durationMinutes)}
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-xs text-slate-400">
                  {t("detail.services.subtotal", {
                    defaultValue: "Tạm tính dịch vụ",
                  })}
                </div>

                <div className="mt-1 font-bold text-emerald-700">
                  {formatBookingCurrency(booking.servicePrice)}
                </div>
              </div>
            </div>
          </Card>

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

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              {t("detail.timelineTitle")}
            </h2>

            <div className="mt-6">
              <BookingTimeline histories={booking.statusHistories ?? []} />
            </div>
          </Card>
        </div>

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

                {discountAmount > 0 && (
                  <>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="flex items-center gap-2 text-slate-500">
                        <TicketPercent className="size-4 text-emerald-700" />

                        {t("detail.cost.discount")}
                      </span>

                      <span className="font-semibold text-emerald-700">
                        -{formatBookingCurrency(discountAmount)}
                      </span>
                    </div>

                    {booking.voucherCode && (
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-slate-400">
                          {t("detail.cost.voucherCode")}
                        </span>

                        <span className="font-mono font-semibold text-slate-600">
                          {booking.voucherCode}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <span className="font-semibold text-slate-900">
                      {t("detail.cost.payTherapist")}
                    </span>

                    <span className="text-2xl font-bold text-emerald-700">
                      {formatBookingCurrency(booking.totalAmount)}
                    </span>
                  </div>
                </div>

                {discountAmount > 0 && (
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800">
                    {t("detail.cost.compensationNotice", {
                      amount: formatBookingCurrency(discountAmount),
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
