"use client";

import { useQuery } from "@tanstack/react-query";

import { CalendarCheck, CheckCircle2, Clock3, ListChecks } from "lucide-react";

import Link from "next/link";

import { useMemo } from "react";

import { useTranslation } from "react-i18next";

import { TherapistBookingCard } from "@/components/therapist-bookings/TherapistBookingCard";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import { StatCard } from "@/components/ui/StatCard";

import { getTherapistBookings } from "@/lib/therapist-bookings";

import { BookingStatus } from "@/types/booking";

export default function TherapistDashboardPage() {
  const { t, i18n } = useTranslation("therapistDashboard");

  /**
   * ==========================================================
   * CURRENT LANGUAGE
   * ==========================================================
   *
   * Booking.serviceName là business translation từ Backend,
   * vì vậy language phải:
   *
   * 1. nằm trong React Query key
   * 2. được gửi qua Accept-Language
   */
  const language = (i18n.resolvedLanguage ?? i18n.language ?? "vi")
    .split("-")[0]
    .toLowerCase();

  const { data, isLoading } = useQuery({
    queryKey: ["therapist-dashboard-bookings", language],

    queryFn: () =>
      getTherapistBookings(
        {
          page: 1,

          limit: 50,
        },
        language
      ),
  });

  const bookings = data?.items ?? [];

  const stats = useMemo(() => {
    const now = new Date();

    const today = bookings.filter((booking) => {
      const value = new Date(booking.scheduledAt);

      return (
        value.getFullYear() === now.getFullYear() &&
        value.getMonth() === now.getMonth() &&
        value.getDate() === now.getDate()
      );
    });

    const waiting = bookings.filter(
      (booking) => booking.status === BookingStatus.WAITING_THERAPIST_ACCEPT
    );

    const active = bookings.filter((booking) =>
      [
        BookingStatus.CONFIRMED,

        BookingStatus.THERAPIST_ON_THE_WAY,

        BookingStatus.ARRIVED,

        BookingStatus.IN_PROGRESS,
      ].includes(booking.status)
    );

    const completed = bookings.filter(
      (booking) => booking.status === BookingStatus.COMPLETED
    );

    return {
      today: today.length,

      waiting: waiting.length,

      active: active.length,

      completed: completed.length,
    };
  }, [bookings]);

  const upcoming = useMemo(() => {
    const now = Date.now();

    return bookings
      .filter(
        (booking) =>
          new Date(booking.scheduledAt).getTime() >= now &&
          ![
            BookingStatus.COMPLETED,

            BookingStatus.REJECTED,

            BookingStatus.CANCELLED_BY_ADMIN,

            BookingStatus.CANCELLED_BY_CLIENT,

            BookingStatus.CANCELLED_BY_THERAPIST,

            BookingStatus.EXPIRED,
          ].includes(booking.status)
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
      .slice(0, 5);
  }, [bookings]);

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {t("page.title")}
        </h1>

        <p className="mt-1 text-sm text-slate-500">{t("page.description")}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label={t("stats.today")}
          value={isLoading ? "-" : stats.today}
          helper={t("stats.booking")}
        />

        <StatCard
          icon={Clock3}
          label={t("stats.waiting")}
          value={isLoading ? "-" : stats.waiting}
          helper={t("stats.booking")}
        />

        <StatCard
          icon={ListChecks}
          label={t("stats.active")}
          value={isLoading ? "-" : stats.active}
          helper={t("stats.booking")}
        />

        <StatCard
          icon={CheckCircle2}
          label={t("stats.completed")}
          value={isLoading ? "-" : stats.completed}
          helper={t("stats.booking")}
        />
      </div>

      <Card className="mt-7 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {t("upcoming.title")}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {t("upcoming.description")}
            </p>
          </div>

          <Link href="/therapist/bookings">
            <Button variant="outline">{t("upcoming.viewAll")}</Button>
          </Link>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({
                length: 3,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : upcoming.length ? (
            <div className="space-y-4">
              {upcoming.map((booking) => (
                <TherapistBookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-500">
              {t("upcoming.empty")}
            </div>
          )}
        </div>
      </Card>
    </PageContainer>
  );
}
