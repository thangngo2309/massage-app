"use client";

import { useQuery } from "@tanstack/react-query";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Phone,
  RefreshCcw,
  UserRound,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { useTranslation } from "react-i18next";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";

import { BookingTimeline } from "@/components/bookings/BookingTimeline";

import { TherapistBookingActions } from "@/components/therapist-bookings/TherapistBookingActions";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import { getApiErrorMessage } from "@/lib/http";

import { getTherapistBooking } from "@/lib/therapist-bookings";

import { BookingStatus } from "@/types/booking";

export default function TherapistBookingDetailPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const router =
    useRouter();

  const {
    t,
    i18n,
  } = useTranslation(
    "therapistBooking"
  );

  const {
    t: tCommon,
  } = useTranslation(
    "common"
  );

  const {
    t: tBooking,
  } = useTranslation(
    "booking"
  );

  const bookingId =
    Number(params.id);

  /**
   * ==========================================================
   * CURRENT LANGUAGE
   * ==========================================================
   */
  const language = (
    i18n.resolvedLanguage ??
    i18n.language ??
    "vi"
  )
    .split("-")[0]
    .toLowerCase();

  const locale =
    language === "en"
      ? "en-US"
      : "vi-VN";

  const {
    data: booking,

    isLoading,

    isError,

    error,

    refetch,

    isFetching,
  } = useQuery({
    queryKey: [
      "therapist-booking",
      bookingId,
      language,
    ],

    queryFn: () =>
      getTherapistBooking(
        bookingId,
        language
      ),

    enabled:
      Number.isInteger(
        bookingId
      ) &&
      bookingId > 0,
  });

  const formatBookingCurrency = (
    value:
      | number
      | string
  ) =>
    new Intl.NumberFormat(
      locale,
      {
        style:
          "currency",

        currency:
          "VND",

        maximumFractionDigits:
          0,
      }
    ).format(
      Number(value)
    );

  const formatBookingDateTime = (
    value: string
  ) =>
    new Intl.DateTimeFormat(
      locale,
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",
      }
    ).format(
      new Date(value)
    );

  const formatBookingDuration = (
    minutes: number
  ) => {
    if (
      minutes < 60
    ) {
      return tBooking(
        "duration.minutes",
        {
          count:
            minutes,
        }
      );
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    const remainingMinutes =
      minutes % 60;

    if (
      remainingMinutes ===
      0
    ) {
      return tBooking(
        "duration.hours",
        {
          count:
            hours,
        }
      );
    }

    return tBooking(
      "duration.hoursMinutes",
      {
        hours,

        minutes:
          remainingMinutes,
      }
    );
  };

  if (isLoading) {
    return (
      <PageContainer className="py-8">
        <div className="grid animate-pulse gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[520px] rounded-2xl bg-slate-100" />

          <div className="h-96 rounded-2xl bg-slate-100" />
        </div>
      </PageContainer>
    );
  }

  if (
    isError ||
    !booking
  ) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <RefreshCcw className="size-9 text-red-500" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t(
              "detail.loadError"
            )}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {getApiErrorMessage(
              error
            )}
          </p>

          <Button
            className="mt-5"

            loading={
              isFetching
            }

            onClick={() =>
              void refetch()
            }
          >
            {tCommon(
              "retry"
            )}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const discountAmount =
    Number(
      booking.discountAmount ??
        0
    );

  const hasVoucherDiscount =
    discountAmount > 0;

  const compensationCompleted =
    booking.status ===
      BookingStatus.COMPLETED &&
    hasVoucherDiscount;

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <button
        type="button"

        onClick={() =>
          router.push(
            "/therapist/bookings"
          )
        }

        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft className="size-4" />

        {t(
          "detail.backToBookings"
        )}
      </button>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            {t(
              "detail.bookingNumber",
              {
                id:
                  booking.id,
              }
            )}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {
              booking.serviceName
            }
          </p>
        </div>

        <BookingStatusBadge
          status={
            booking.status
          }
        />
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              {t(
                "detail.customer.title"
              )}
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <UserRound className="mt-0.5 size-5 text-emerald-700" />

                <div>
                  <div className="text-xs text-slate-400">
                    {t(
                      "detail.customer.name"
                    )}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {booking
                      .client
                      ?.fullName ||
                      t(
                        "detail.customer.fallbackName"
                      )}
                  </div>
                </div>
              </div>

              {booking.client
                ?.phone && (
                <div className="flex gap-3">
                  <Phone className="mt-0.5 size-5 text-emerald-700" />

                  <div>
                    <div className="text-xs text-slate-400">
                      {t(
                        "detail.customer.phone"
                      )}
                    </div>

                    <div className="mt-1 font-semibold text-slate-900">
                      {
                        booking
                          .client
                          .phone
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              {t(
                "detail.appointment.title"
              )}
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 size-5 text-emerald-700" />

                <div>
                  <div className="text-xs text-slate-400">
                    {t(
                      "detail.appointment.time"
                    )}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {formatBookingDateTime(
                      booking.scheduledAt
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock3 className="mt-0.5 size-5 text-emerald-700" />

                <div>
                  <div className="text-xs text-slate-400">
                    {t(
                      "detail.appointment.duration"
                    )}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {formatBookingDuration(
                      booking.durationMinutes
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 sm:col-span-2">
                <MapPin className="mt-0.5 size-5 shrink-0 text-emerald-700" />

                <div>
                  <div className="text-xs text-slate-400">
                    {t(
                      "detail.appointment.address"
                    )}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {
                      booking.address
                    }
                  </div>
                </div>
              </div>
            </div>

            {booking.clientNote && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="text-xs text-slate-400">
                  {t(
                    "detail.appointment.clientNote"
                  )}
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {
                    booking.clientNote
                  }
                </p>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              {t(
                "detail.timeline.title"
              )}
            </h2>

            <div className="mt-6">
              <BookingTimeline
                histories={
                  booking.statusHistories ??
                  []
                }
              />
            </div>
          </Card>
        </div>

        <aside>
          <div className="space-y-5 xl:sticky xl:top-24">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                {t(
                  "detail.service.title"
                )}
              </h2>

              <div className="mt-5">
                <div className="font-bold text-slate-900">
                  {
                    booking.serviceName
                  }
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-slate-500">
                      {t(
                        "detail.service.duration"
                      )}
                    </span>

                    <strong>
                      {formatBookingDuration(
                        booking.durationMinutes
                      )}
                    </strong>
                  </div>

                  <div className="mt-3 flex justify-between gap-4 text-sm">
                    <span className="text-slate-500">
                      {t(
                        "detail.service.price"
                      )}
                    </span>

                    <strong className="text-slate-900">
                      {formatBookingCurrency(
                        booking.servicePrice
                      )}
                    </strong>
                  </div>

                  {hasVoucherDiscount && (
                    <>
                      <div className="mt-3 flex justify-between gap-4 text-sm">
                        <span className="text-slate-500">
                          {t(
                            "detail.service.customerPromotion"
                          )}
                        </span>

                        <strong className="text-emerald-700">
                          -
                          {formatBookingCurrency(
                            discountAmount
                          )}
                        </strong>
                      </div>

                      {booking.voucherCode && (
                        <div className="mt-2 flex justify-between gap-4 text-xs">
                          <span className="text-slate-400">
                            {t(
                              "detail.service.voucherCode"
                            )}
                          </span>

                          <span className="font-mono font-semibold text-slate-600">
                            {
                              booking.voucherCode
                            }
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="flex items-end justify-between gap-4">
                      <span className="text-sm font-semibold text-slate-900">
                        {t(
                          "detail.service.customerPayment"
                        )}
                      </span>

                      <strong className="text-xl text-emerald-700">
                        {formatBookingCurrency(
                          booking.totalAmount
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                {hasVoucherDiscount && (
                  <div
                    className={
                      compensationCompleted
                        ? "mt-4 rounded-2xl bg-emerald-50 p-4"
                        : "mt-4 rounded-2xl bg-amber-50 p-4"
                    }
                  >
                    <div
                      className={
                        compensationCompleted
                          ? "text-xs font-semibold uppercase tracking-wide text-emerald-700"
                          : "text-xs font-semibold uppercase tracking-wide text-amber-700"
                      }
                    >
                      {compensationCompleted
                        ? t(
                            "detail.service.compensation.completedTitle"
                          )
                        : t(
                            "detail.service.compensation.pendingTitle"
                          )}
                    </div>

                    <div
                      className={
                        compensationCompleted
                          ? "mt-1 text-xl font-bold text-emerald-800"
                          : "mt-1 text-xl font-bold text-amber-800"
                      }
                    >
                      +
                      {formatBookingCurrency(
                        discountAmount
                      )}
                    </div>

                    <p
                      className={
                        compensationCompleted
                          ? "mt-2 text-xs leading-5 text-emerald-700"
                          : "mt-2 text-xs leading-5 text-amber-700"
                      }
                    >
                      {compensationCompleted
                        ? t(
                            "detail.service.compensation.completedDescription"
                          )
                        : t(
                            "detail.service.compensation.pendingDescription"
                          )}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                {t(
                  "detail.actions.title"
                )}
              </h2>

              <div className="mt-5">
                <TherapistBookingActions
                  bookingId={
                    booking.id
                  }

                  status={
                    booking.status
                  }
                />
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}