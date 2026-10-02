"use client";

import { useQuery } from "@tanstack/react-query";

import {
  CalendarDays,
  Clock3,
  LocateFixed,
  MapPin,
  RefreshCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import Link from "next/link";

import { useSearchParams } from "next/navigation";

import { useMemo, useState } from "react";

import { format } from "date-fns";

import { useTranslation } from "react-i18next";

import { toast } from "sonner";

import { TherapistSearchCard } from "@/components/therapists/TherapistSearchCard";

import { TherapistSearchSkeleton } from "@/components/therapists/TherapistSearchSkeleton";

import { AutocompleteSelect } from "@/components/ui/AutocompleteSelect";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import { getApiErrorMessage } from "@/lib/http";

import {
  getAdministrativeProvinces,
  getAdministrativeWards,
} from "@/lib/locations";

import { searchTherapists } from "@/lib/therapist-search";

import type {
  TherapistSearchQuery,
  TherapistSearchSort,
} from "@/types/therapist-search";

export default function TherapistsPage() {
  const { t, i18n } = useTranslation("therapists");

  const { t: tCommon } = useTranslation("common");

  const language = i18n.resolvedLanguage ?? i18n.language ?? "vi";

  const searchParams = useSearchParams();

  const serviceId = Number(searchParams.get("serviceId"));

  const serviceOptionId = Number(searchParams.get("serviceOptionId"));

  const [date, setDate] = useState(
    searchParams.get("date") || format(new Date(), "yyyy-MM-dd")
  );

  const [startTime, setStartTime] = useState(
    searchParams.get("startTime") || ""
  );

  const [sortBy, setSortBy] = useState<TherapistSearchSort>("rating");

  const parseCoordinate = (
    value: string | null,

    min: number,

    max: number
  ): number | null => {
    if (value === null || value.trim() === "") {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      return null;
    }

    return parsed;
  };

  const [latitude, setLatitude] = useState<number | null>(() =>
    parseCoordinate(searchParams.get("latitude"), -90, 90)
  );

  const [longitude, setLongitude] = useState<number | null>(() =>
    parseCoordinate(searchParams.get("longitude"), -180, 180)
  );

  const [provinceCode, setProvinceCode] = useState(
    searchParams.get("provinceCode") ?? ""
  );

  const [wardCode, setWardCode] = useState(searchParams.get("wardCode") ?? "");

  const [locating, setLocating] = useState(false);

  const [page, setPage] = useState(1);

  const [submittedQuery, setSubmittedQuery] =
    useState<TherapistSearchQuery | null>(null);

  const validService =
    Number.isInteger(serviceId) &&
    serviceId > 0 &&
    Number.isInteger(serviceOptionId) &&
    serviceOptionId > 0;

  const provincesQuery = useQuery({
    queryKey: ["locations", "provinces", language],

    queryFn: getAdministrativeProvinces,
  });

  const wardsQuery = useQuery({
    queryKey: ["locations", "wards", provinceCode, language],

    queryFn: () => getAdministrativeWards(provinceCode),

    enabled: provinceCode.trim().length > 0,
  });

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["therapist-search", submittedQuery, page, language],

    queryFn: () =>
      searchTherapists({
        ...submittedQuery!,

        page,

        limit: 12,
      }),

    enabled: submittedQuery !== null,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const provinces = provincesQuery.data ?? [];

  const wards = wardsQuery.data ?? [];

  const provinceOptions = useMemo(
    () =>
      provinces.map((province) => ({
        value: province.code,

        label: province.name,

        searchText: [
          province.nameEn ?? "",

          province.type ?? "",

          province.code,
        ].join(" "),
      })),
    [provinces]
  );

  const wardOptions = useMemo(
    () =>
      wards.map((ward) => ({
        value: ward.code,

        label: ward.name,

        searchText: [
          ward.nameEn ?? "",

          ward.type ?? "",

          ward.code,

          ward.provinceName,
        ].join(" "),
      })),
    [wards]
  );

  const hasCoordinates = latitude !== null && longitude !== null;

  const hasAdministrativeArea =
    provinceCode.trim().length > 0 && wardCode.trim().length > 0;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("location.unsupported"));

      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);

        setLongitude(position.coords.longitude);

        setProvinceCode("");

        setWardCode("");

        setLocating(false);

        toast.success(t("location.success"));
      },

      (locationError) => {
        setLocating(false);

        if (locationError.code === locationError.PERMISSION_DENIED) {
          toast.error(t("location.permissionDenied"));

          return;
        }

        toast.error(t("location.error"));
      },

      {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 30000,
      }
    );
  };

  const clearCoordinates = () => {
    setLatitude(null);

    setLongitude(null);

    if (sortBy === "distance") {
      setSortBy("rating");
    }
  };

  const handleProvinceChange = (value: string) => {
    setProvinceCode(value);

    setWardCode("");

    if (value.trim()) {
      clearCoordinates();
    }
  };

  const handleWardChange = (value: string) => {
    setWardCode(value);

    if (value.trim()) {
      clearCoordinates();
    }
  };

  const handleSearch = () => {
    if (!validService) {
      toast.error(t("validation.invalidService"));

      return;
    }

    if (!date) {
      toast.error(t("validation.dateRequired"));

      return;
    }

    if (!startTime) {
      toast.error(t("validation.startTimeRequired"));

      return;
    }

    const now = new Date();

    const today = format(now, "yyyy-MM-dd");

    const currentTime = format(now, "HH:mm");

    if (date < today) {
      toast.error(t("validation.invalidDate"));

      return;
    }

    if (date === today && startTime <= currentTime) {
      toast.error(t("validation.futureTime"));

      return;
    }

    if (!hasCoordinates && !hasAdministrativeArea) {
      toast.error(t("validation.locationRequired"));

      return;
    }

    setPage(1);

    setSubmittedQuery({
      serviceOptionId,

      date,

      startTime,

      sortBy,

      ...(hasCoordinates
        ? {
            latitude: latitude!,

            longitude: longitude!,
          }
        : {
            provinceCode: provinceCode.trim(),

            wardCode: wardCode.trim(),
          }),
    });
  };

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
            {t("search.hero.description")}
          </p>
        </div>
      </section>

      <Card className="mt-6 p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {t("search.form.date")}
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                type="date"
                value={date}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(event) => setDate(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {t("search.form.startTime")}
            </label>

            <div className="relative">
              <Clock3 className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {t("search.form.sort")}
            </label>

            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as TherapistSearchSort)
                }
                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
              >
                <option value="rating">{t("search.sort.rating")}</option>

                <option value="price">{t("search.sort.price")}</option>

                <option value="distance" disabled={!hasCoordinates}>
                  {t("search.sort.distance")}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {t("search.form.location")}
            </label>

            <Button
              type="button"
              variant="outline"
              size="lg"
              loading={locating}
              onClick={handleUseCurrentLocation}
              className="w-full"
            >
              <LocateFixed className="size-5" />

              {hasCoordinates
                ? t("search.form.locationReady")
                : t("search.form.currentLocation")}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {t("search.form.province")}
            </label>

            <AutocompleteSelect
              id="therapist-search-province"
              value={provinceCode}
              options={provinceOptions}
              loading={provincesQuery.isLoading}
              placeholder={t("search.form.provincePlaceholder")}
              loadingText={t("search.form.autocomplete.loading")}
              emptyText={t("search.form.autocomplete.empty")}
              clearLabel={t("search.form.autocomplete.clear")}
              startIcon={<MapPin className="size-5" />}
              onChange={handleProvinceChange}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {t("search.form.ward")}
            </label>

            <AutocompleteSelect
              id="therapist-search-ward"
              value={wardCode}
              options={wardOptions}
              loading={wardsQuery.isLoading}
              disabled={!provinceCode}
              placeholder={t("search.form.wardPlaceholder")}
              loadingText={t("search.form.autocomplete.loading")}
              emptyText={t("search.form.autocomplete.empty")}
              clearLabel={t("search.form.autocomplete.clear")}
              startIcon={<MapPin className="size-5" />}
              onChange={handleWardChange}
            />
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full md:col-span-2 lg:col-span-1 lg:w-auto"
            disabled={
              !date || !startTime || (!hasCoordinates && !hasAdministrativeArea)
            }
            onClick={handleSearch}
          >
            <Search className="size-5" />

            {t("search.form.submit")}
          </Button>

          {hasCoordinates && (
            <div className="md:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <LocateFixed className="size-3.5" />
                {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
              </div>
            </div>
          )}

          {!hasCoordinates && hasAdministrativeArea && (
            <div className="md:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <MapPin className="size-3.5" />

                {t("search.form.areaValue", {
                  ward:
                    wards.find((ward) => ward.code === wardCode)?.name ??
                    wardCode,

                  province:
                    provinces.find((province) => province.code === provinceCode)
                      ?.name ?? provinceCode,
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {!submittedQuery && (
        <Card className="mt-6 flex flex-col items-center justify-center px-6 py-16 text-center">
          <Search className="size-10 text-emerald-300" />

          <h2 className="mt-5 text-lg font-bold text-slate-900">
            {t("search.initial.title")}
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t("search.initial.description")}
          </p>
        </Card>
      )}

      {submittedQuery && (
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
                    query={{
                      ...submittedQuery,

                      page,
                    }}
                  />
                ))}
              </div>

              {data && data.pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || isFetching}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
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
      )}
    </PageContainer>
  );
}
