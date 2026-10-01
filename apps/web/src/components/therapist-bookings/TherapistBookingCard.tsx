"use client";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
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
    <Link href={`/therapist/bookings/${booking.id}`} className="group block">
      <Card className="p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-bold text-slate-950">
                {booking.serviceName}
              </h3>

              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="mt-4 grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-emerald-700" />

                {booking.client?.fullName || t("card.customerFallback")}
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-emerald-700" />

                {formatBookingDateTime(booking.scheduledAt)}
              </div>

              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-emerald-700" />

                {formatBookingDuration(booking.durationMinutes)}
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                <span className="line-clamp-2">{booking.address}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-5 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="min-w-[180px]">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                <span>{t("card.servicePrice")}</span>

                <span>{formatBookingCurrency(booking.servicePrice)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="mt-1 flex items-center justify-between gap-3 text-xs text-emerald-700">
                  <span>{t("card.systemCompensation")}</span>

                  <span>+{formatBookingCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="mt-2 text-xs text-slate-400">
                {t("card.customerPayment")}
              </div>

              <div className="mt-1 whitespace-nowrap text-lg font-bold text-emerald-700">
                {formatBookingCurrency(booking.totalAmount)}
              </div>
            </div>

            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
              <ArrowRight className="size-5" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
