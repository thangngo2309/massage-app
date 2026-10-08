"use client";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Layers3,
  MapPin,
  UserRound,
} from "lucide-react";

import Link from "next/link";

import { useTranslation } from "react-i18next";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { Card } from "@/components/ui/Card";

import type { TherapistBooking } from "@/types/therapist-booking";

type Props = {
  booking: TherapistBooking;
};

export const TherapistBookingCard = ({ booking }: Props) => {
  const { t, i18n } = useTranslation("therapistBooking");

  const { t: tBooking } = useTranslation("booking");

  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";

  const discountAmount = Number(booking.discountAmount ?? 0);

  /**
   * ==========================================================
   * CLIENT
   * ==========================================================
   */

  const clientName =
    booking.client?.user?.fullName?.trim() ||
    booking.client?.fullName?.trim() ||
    t("card.customerFallback");

  /**
   * ==========================================================
   * MULTI SERVICE
   * ==========================================================
   *
   * Card chỉ hiển thị dạng tóm tắt giống phía Client:
   *
   * Massage body + 1 dịch vụ khác
   * 2 dịch vụ
   *
   * Danh sách chi tiết sẽ xem trong booking detail.
   */

  const bookingItems = [...(booking.items ?? [])].sort(
    (left, right) => left.sortOrder - right.sortOrder
  );

  const firstServiceName =
    bookingItems[0]?.serviceName?.trim() || booking.serviceName;

  const serviceCount = bookingItems.length > 0 ? bookingItems.length : 1;

  const extraServiceCount = Math.max(0, serviceCount - 1);

  const serviceSummary =
    extraServiceCount > 0
      ? t("card.multiServiceSummary", {
          service: firstServiceName,

          count: extraServiceCount,

          defaultValue: `${firstServiceName} + ${extraServiceCount} dịch vụ khác`,
        })
      : firstServiceName;

  /**
   * ==========================================================
   * FORMATTERS
   * ==========================================================
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
      return tBooking("duration.minutes", {
        count: minutes,
      });
    }

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return tBooking("duration.hours", {
        count: hours,
      });
    }

    return tBooking("duration.hoursMinutes", {
      hours,

      minutes: remainingMinutes,
    });
  };

  return (
    <Link
      href={`/therapist/bookings/${booking.id}`}
      className="group block"
    >
      <Card className="p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          {/* =====================================================
           * LEFT
           * ===================================================== */}

          <div className="min-w-0 flex-1">
            {/* TITLE + STATUS */}

            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-bold text-slate-950">
                {serviceSummary}
              </h3>

              <BookingStatusBadge status={booking.status} />
            </div>

            {/* SERVICE COUNT */}

            {serviceCount > 1 && (
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700">
                <Layers3 className="size-4 shrink-0" />

                <span>
                  {t("card.serviceCount", {
                    count: serviceCount,

                    defaultValue: `${serviceCount} dịch vụ`,
                  })}
                </span>
              </div>
            )}

            {/* BOOKING INFO
             *
             * Bố cục giống Client:
             *
             * Thời gian        Thời lượng
             * Địa chỉ          Khách hàng
             */}

            <div
              className={
                serviceCount > 1
                  ? "mt-5 grid gap-3 text-sm text-slate-500 sm:grid-cols-2"
                  : "mt-4 grid gap-3 text-sm text-slate-500 sm:grid-cols-2"
              }
            >
              <div className="flex min-w-0 items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                <span>
                  {formatBookingDateTime(booking.scheduledAt)}
                </span>
              </div>

              <div className="flex min-w-0 items-start gap-2">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                <span>
                  {formatBookingDuration(booking.durationMinutes)}
                </span>
              </div>

              <div className="flex min-w-0 items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                <span className="line-clamp-2">
                  {booking.address}
                </span>
              </div>

              <div className="flex min-w-0 items-start gap-2">
                <UserRound className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                <span className="truncate">
                  {clientName}
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================
           * PAYMENT
           * ===================================================== */}

          <div className="flex items-center justify-between gap-5 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="min-w-[180px]">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                <span>
                  {t("card.servicePrice")}
                </span>

                <span>
                  {formatBookingCurrency(booking.servicePrice)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="mt-1 flex items-center justify-between gap-3 text-xs text-emerald-700">
                  <span>
                    {t("card.systemCompensation")}
                  </span>

                  <span>
                    +{formatBookingCurrency(discountAmount)}
                  </span>
                </div>
              )}

              <div className="mt-2 text-xs text-slate-400">
                {t("card.customerPayment")}
              </div>

              <div className="mt-1 whitespace-nowrap text-lg font-bold text-emerald-700">
                {formatBookingCurrency(booking.totalAmount)}
              </div>
            </div>

            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
              <ArrowRight className="size-5" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};