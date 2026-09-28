"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { BookingCard } from "@/components/bookings/BookingCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";

import { getMyBookings } from "@/lib/bookings";
import { getApiErrorMessage } from "@/lib/http";

import { BookingStatus } from "@/types/booking";

type StatusFilter = "all" | BookingStatus;

type FilterItem = {
  translationKey: string;
  value: StatusFilter;
};

const FILTERS: FilterItem[] = [
  {
    translationKey: "list.filters.all",
    value: "all",
  },
  {
    translationKey: "list.filters.waitingTherapistAccept",
    value: BookingStatus.WAITING_THERAPIST_ACCEPT,
  },
  {
    translationKey: "list.filters.confirmed",
    value: BookingStatus.CONFIRMED,
  },
  {
    translationKey: "list.filters.inProgress",
    value: BookingStatus.IN_PROGRESS,
  },
  {
    translationKey: "list.filters.completed",
    value: BookingStatus.COMPLETED,
  },
];

export default function ClientBookingsPage() {
  const { t } = useTranslation("booking");

  const { t: tCommon } = useTranslation("common");

  const [status, setStatus] = useState<StatusFilter>("all");

  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["my-bookings", status, page],

    queryFn: () =>
      getMyBookings({
        page,
        limit: 10,

        status: status === "all" ? undefined : status,
      }),
  });

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {t("list.title")}
        </h1>

        <p className="mt-2 text-sm text-slate-500">{t("list.description")}</p>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setStatus(item.value);
              setPage(1);
            }}
            className={
              status === item.value
                ? "whitespace-nowrap rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
                : "whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            }
          >
            {t(item.translationKey)}
          </button>
        ))}
      </div>

      <section className="mt-6">
        {isLoading && (
          <div className="space-y-4">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        )}

        {isError && (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <RefreshCcw className="size-8 text-red-500" />

            <h2 className="mt-4 font-bold text-slate-900">
              {t("list.error.title")}
            </h2>

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
        )}

        {!isLoading && !isError && !data?.items.length && (
          <Card className="flex flex-col items-center px-6 py-16 text-center">
            <CalendarDays className="size-10 text-slate-300" />

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              {t("list.empty.title")}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {t("list.empty.description")}
            </p>
          </Card>
        )}

        {!!data?.items.length && (
          <>
            <div className="space-y-4">
              {data.items.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>

            {data.pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  {t("list.pagination.previous")}
                </Button>

                <span className="text-sm text-slate-500">
                  {t("list.pagination.page", {
                    page,
                    totalPages: data.pagination.totalPages,
                  })}
                </span>

                <Button
                  variant="outline"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  {t("list.pagination.next")}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </PageContainer>
  );
}
