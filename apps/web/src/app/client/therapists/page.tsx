"use client";

import { useQuery } from "@tanstack/react-query";

import {
  LocateFixed,
  MapPin,
  RefreshCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import Link from "next/link";

import { useSearchParams } from "next/navigation";

import { useEffect, useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { TherapistSearchCard } from "@/components/therapists/TherapistSearchCard";

import { TherapistSearchSkeleton } from "@/components/therapists/TherapistSearchSkeleton";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import { getApiErrorMessage } from "@/lib/http";

import { getClientService } from "@/lib/services";

import { searchTherapists } from "@/lib/therapist-search";

import { useClientBookingFlowStore } from "@/stores/client-booking-flow-store";

import type {
  TherapistSearchQuery,
  TherapistSearchSort,
} from "@/types/therapist-search";

export default function TherapistsPage() {
  const { t, i18n } = useTranslation("therapists");

  const { t: tCommon } = useTranslation("common");

  const language = (i18n.resolvedLanguage ?? i18n.language ?? "vi")
    .split("-")[0]
    .toLowerCase();

  const searchParams = useSearchParams();

  const serviceId = Number(searchParams.get("serviceId"));

  const address = useClientBookingFlowStore((state) => state.address);

  const latitude = useClientBookingFlowStore((state) => state.latitude);

  const longitude = useClientBookingFlowStore((state) => state.longitude);

  const provinceCode = useClientBookingFlowStore((state) => state.provinceCode);

  const provinceName = useClientBookingFlowStore((state) => state.provinceName);

  const wardCode = useClientBookingFlowStore((state) => state.wardCode);

  const wardName = useClientBookingFlowStore((state) => state.wardName);

  const setService = useClientBookingFlowStore((state) => state.setService);

  const hasCoordinates = latitude !== null && longitude !== null;

  const hasAdministrativeArea =
    provinceCode.trim().length > 0 && wardCode.trim().length > 0;

  const locationReady =
    address.trim().length >= 5 && (hasCoordinates || hasAdministrativeArea);

  const validService = Number.isInteger(serviceId) && serviceId > 0;

  const [sortBy, setSortBy] = useState<TherapistSearchSort>(
    hasCoordinates ? "distance" : "rating"
  );

  const [page, setPage] = useState(1);

  useEffect(() => {
    if (validService) {
      setService(serviceId);
    }
  }, [validService, serviceId, setService]);

  useEffect(() => {
    if (!hasCoordinates && sortBy === "distance") {
      setSortBy("rating");
    }
  }, [hasCoordinates, sortBy]);

  const searchQuery = useMemo<TherapistSearchQuery | null>(() => {
    if (!validService || !locationReady) {
      return null;
    }

    return {
      serviceId,

      sortBy,

      ...(hasCoordinates
        ? {
            latitude: latitude!,

            longitude: longitude!,
          }
        : {}),

      ...(hasAdministrativeArea
        ? {
            provinceCode: provinceCode.trim(),

            wardCode: wardCode.trim(),
          }
        : {}),
    };
  }, [
    validService,
    locationReady,
    serviceId,
    sortBy,
    hasCoordinates,
    latitude,
    longitude,
    hasAdministrativeArea,
    provinceCode,
    wardCode,
  ]);

  const serviceQuery = useQuery({
    queryKey: ["client-service", serviceId, language],

    queryFn: () => getClientService(serviceId, language),

    enabled: validService,
  });

  const {
    data,

    isLoading,

    isFetching,

    isError,

    error,

    refetch,
  } = useQuery({
    queryKey: ["therapist-search", searchQuery, page, language],

    queryFn: () =>
      searchTherapists(
        {
          ...searchQuery!,

          page,

          limit: 12,
        },

        language
      ),

    enabled: searchQuery !== null,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  if (!validService) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <Search className="size-10 text-slate-300" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t("search.serviceRequired.title")}
          </h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t("search.serviceRequired.description")}
          </p>

          <Link href="/client/services" className="mt-6">
            <Button>{t("search.serviceRequired.action")}</Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  if (!locationReady) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <MapPin className="size-10 text-amber-400" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t("search.locationRequired.title", {
              defaultValue: "Chưa có địa điểm phục vụ",
            })}
          </h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t("search.locationRequired.description", {
              defaultValue:
                "Hãy thiết lập địa chỉ và khu vực trước khi tìm kỹ thuật viên.",
            })}
          </p>

          <Link href="/client/services" className="mt-6">
            <Button>
              {t("search.locationRequired.action", {
                defaultValue: "Thiết lập địa chỉ",
              })}
            </Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 px-6 py-9 text-white sm:px-8 lg:px-12 lg:py-12">
        <div className="max-w-2xl">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
            <Search className="size-6" />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("search.hero.title")}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-emerald-50/80 sm:text-base">
            {serviceQuery.data
              ? t("search.hero.serviceDescription", {
                  service: serviceQuery.data.name,

                  defaultValue: `Các kỹ thuật viên đang cung cấp ${serviceQuery.data.name} trong khu vực của bạn.`,
                })
              : t("search.hero.description")}
          </p>
        </div>
      </section>

      <Card className="mt-6 p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MapPin className="size-4 text-emerald-700" />

              {t("search.currentLocation", {
                defaultValue: "Địa điểm phục vụ",
              })}
            </div>

            <div className="mt-1 text-sm text-slate-500">{address}</div>

            <div className="mt-2 flex flex-wrap gap-3 text-xs text-emerald-700">
              {hasAdministrativeArea && (
                <span>
                  {wardName || wardCode}
                  {", "}
                  {provinceName || provinceCode}
                </span>
              )}

              {hasCoordinates && (
                <span className="inline-flex items-center gap-1">
                  <LocateFixed className="size-3.5" />

                  {latitude.toFixed(5)}
                  {", "}
                  {longitude.toFixed(5)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                {t("search.form.sort")}
              </label>

              <div className="relative">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value as TherapistSearchSort);

                    setPage(1);
                  }}
                  className="h-11 appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
                >
                  <option value="rating">{t("search.sort.rating")}</option>

                  <option value="price">{t("search.sort.price")}</option>

                  <option value="distance" disabled={!hasCoordinates}>
                    {t("search.sort.distance")}
                  </option>
                </select>
              </div>
            </div>

            <Link href="/client/services">
              <Button variant="outline" className="w-full sm:w-auto">
                {t("search.changeLocation", {
                  defaultValue: "Đổi địa điểm",
                })}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <section className="mt-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
              {t("search.results.title")}
            </h2>

            {data && (
              <p className="mt-1 text-sm text-slate-500">
                {t("search.results.count", {
                  count: data.pagination.total,
                })}
              </p>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <TherapistSearchSkeleton key={index} />
            ))}
          </div>
        )}

        {isError && (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <RefreshCcw className="size-8 text-red-500" />

            <h3 className="mt-4 font-bold text-slate-900">
              {t("search.results.error")}
            </h3>

            <p className="mt-2 max-w-lg text-sm text-slate-500">
              {getApiErrorMessage(error)}
            </p>

            <Button
              className="mt-5"
              loading={isFetching}
              onClick={() => void refetch()}
            >
              <RefreshCcw className="size-4" />

              {tCommon("retry")}
            </Button>
          </Card>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <Card className="flex flex-col items-center px-6 py-16 text-center">
            <Search className="size-9 text-slate-300" />

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {t("search.results.emptyTitle")}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {t("search.results.emptyDescription")}
            </p>
          </Card>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((therapist) => (
                <TherapistSearchCard
                  key={therapist.therapistId}
                  therapist={therapist}
                  serviceId={serviceId}
                />
              ))}
            </div>

            {data && data.pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  {t("pagination.previous")}
                </Button>

                <div className="text-sm text-slate-500">
                  {t("pagination.page", {
                    page,

                    totalPages: data.pagination.totalPages,
                  })}
                </div>

                <Button
                  variant="outline"
                  disabled={page >= data.pagination.totalPages || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  {t("pagination.next")}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </PageContainer>
  );
}
