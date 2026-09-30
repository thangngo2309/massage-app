"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LocateFixed,
  MapPin,
  RefreshCcw,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { TherapistReviews } from "@/components/ratings/TherapistReviews";
import { AvailabilitySlots } from "@/components/therapists/AvailabilitySlots";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { getApiErrorMessage } from "@/lib/http";
import {
  findMatchingTherapist,
  getTherapistAvailabilitySlots,
} from "@/lib/therapist-search";
import { formatCurrency, formatDuration } from "@/lib/utils";
import type {
  TherapistAvailabilitySlot,
  TherapistSearchQuery,
} from "@/types/therapist-search";
import { TherapistPublicGallery } from "@/components/therapists/TherapistPublicGallery";

export default function TherapistDetailPage() {
  const { t } = useTranslation("therapists");
  const { t: tCommon } = useTranslation("common");

  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const searchParams = useSearchParams();

  const therapistId = Number(params.id);

  const serviceId = Number(searchParams.get("serviceId"));

  const serviceOptionId = Number(searchParams.get("serviceOptionId"));

  const date = searchParams.get("date") ?? "";

  const originalStartTime = searchParams.get("startTime") ?? "";

  const latitudeParam = searchParams.get("latitude");

  const longitudeParam = searchParams.get("longitude");

  const provinceCode = searchParams.get("provinceCode") ?? "";

  const districtCode = searchParams.get("districtCode") ?? "";

  const parseCoordinate = (value: string | null, min: number, max: number) => {
    if (value === null || value.trim() === "") {
      return undefined;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      return undefined;
    }

    return parsed;
  };

  const latitude = parseCoordinate(latitudeParam, -90, 90);

  const longitude = parseCoordinate(longitudeParam, -180, 180);

  const [selectedTime, setSelectedTime] = useState(originalStartTime);

  const hasCoordinates = latitude !== undefined && longitude !== undefined;

  const hasDistrict = districtCode.trim().length > 0;

  const validParams =
    Number.isInteger(therapistId) &&
    therapistId > 0 &&
    Number.isInteger(serviceId) &&
    serviceId > 0 &&
    Number.isInteger(serviceOptionId) &&
    serviceOptionId > 0 &&
    !!date &&
    !!originalStartTime &&
    (hasCoordinates || hasDistrict);

  const searchQuery = useMemo<TherapistSearchQuery>(
    () => ({
      serviceOptionId,

      date,

      startTime: originalStartTime,

      ...(hasCoordinates
        ? {
            latitude,

            longitude,
          }
        : {
            districtCode: districtCode.trim(),

            ...(provinceCode
              ? {
                  provinceCode,
                }
              : {}),
          }),

      page: 1,

      limit: 50,
    }),
    [
      serviceOptionId,
      date,
      originalStartTime,
      hasCoordinates,
      latitude,
      longitude,
      districtCode,
      provinceCode,
    ]
  );

  const {
    data: therapist,
    isLoading: loadingTherapist,
    isError: therapistError,
    error: therapistQueryError,
    refetch: refetchTherapist,
    isFetching: fetchingTherapist,
  } = useQuery({
    queryKey: ["therapist-search", "match", therapistId, searchQuery],

    queryFn: () => findMatchingTherapist(therapistId, searchQuery),

    enabled: validParams,
  });

  const {
    data: availability,
    isLoading: loadingSlots,
    isError: slotsError,
    error: slotsQueryError,
    refetch: refetchSlots,
    isFetching: fetchingSlots,
  } = useQuery({
    queryKey: [
      "therapist-availability",
      "slots",
      therapistId,
      serviceId,
      serviceOptionId,
      date,
    ],

    queryFn: () =>
      getTherapistAvailabilitySlots(therapistId, {
        serviceId,

        serviceOptionId,

        date,

        slotInterval: 30,
      }),

    enabled: validParams,
  });

  const selectedSlotAvailable = Boolean(
    selectedTime &&
      availability?.slots?.some(
        (slot) => slot.startTime === selectedTime && slot.available
      )
  );

  useEffect(() => {
    if (!availability || !selectedTime) {
      return;
    }

    const stillAvailable = availability.slots?.some(
      (slot) => slot.startTime === selectedTime && slot.available
    );

    if (!stillAvailable) {
      setSelectedTime("");
    }
  }, [availability, selectedTime]);

  const handleSlotSelect = (slot: TherapistAvailabilitySlot) => {
    if (!slot.available) {
      return;
    }

    setSelectedTime(slot.startTime);
  };

  const handleContinue = () => {
    if (!therapist || !selectedTime || !selectedSlotAvailable) {
      return;
    }

    const query = new URLSearchParams({
      therapistId: String(therapist.therapistId),

      serviceId: String(serviceId),

      serviceOptionId: String(serviceOptionId),

      date,

      startTime: selectedTime,
    });

    if (hasCoordinates) {
      query.set("latitude", String(latitude));

      query.set("longitude", String(longitude));
    }

    if (provinceCode) {
      query.set("provinceCode", provinceCode);
    }

    if (districtCode) {
      query.set("districtCode", districtCode);
    }

    router.push(`/client/bookings/new?${query.toString()}`);
  };

  if (!validParams) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-14 text-center">
          <MapPin className="size-9 text-red-400" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t("detail.invalid.title")}
          </h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t("detail.invalid.description")}
          </p>

          <Link href="/client/services" className="mt-6">
            <Button>{t("detail.invalid.action")}</Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  if (loadingTherapist) {
    return (
      <PageContainer className="py-8">
        <div className="animate-pulse">
          <div className="h-5 w-40 rounded bg-slate-100" />

          <div className="mt-6 h-72 rounded-[28px] bg-slate-100" />

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-96 rounded-2xl bg-slate-100" />

            <div className="h-72 rounded-2xl bg-slate-100" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (therapistError || !therapist) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <RefreshCcw className="size-9 text-red-500" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t("detail.notFound.title")}
          </h1>

          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            {therapistQueryError
              ? getApiErrorMessage(therapistQueryError)
              : t("detail.notFound.description")}
          </p>

          <Button
            className="mt-5"
            variant="outline"
            loading={fetchingTherapist}
            onClick={() => void refetchTherapist()}
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
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
      >
        <ArrowLeft className="size-4" />

        {t("detail.back")}
      </button>

      <section className="mt-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 p-6 text-white sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="size-28 shrink-0 overflow-hidden rounded-[28px] bg-white/10 sm:size-32">
            {therapist.avatarUrl ? (
              <img
                src={therapist.avatarUrl}
                alt={therapist.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl font-bold">
                {therapist.fullName.trim().charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Badge className="bg-white/10 text-white">
              {t("detail.badge")}
            </Badge>

            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              {therapist.fullName}
            </h1>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-emerald-50/90">
              <div className="flex items-center gap-2">
                <Star className="size-5 fill-amber-400 text-amber-400" />

                {Number(therapist.ratingAverage ?? 0).toFixed(1)}

                <span className="text-emerald-50/60">
                  (
                  {t("detail.reviews", {
                    count: therapist.ratingCount ?? 0,
                  })}
                  )
                </span>
              </div>

              {therapist.experienceYears !== null &&
                therapist.experienceYears !== undefined && (
                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="size-5" />

                    {t("detail.experience", {
                      count: therapist.experienceYears,
                    })}
                  </div>
                )}

              {therapist.completedBookings !== undefined && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5" />

                  {t("detail.completedBookings", {
                    count: therapist.completedBookings,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {therapist.images?.length > 0 && (
        <div className="mt-8">
          <TherapistPublicGallery
            images={therapist.images}
            therapistName={therapist.fullName}
          />
        </div>
      )}

      <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-7">
          <Card className="p-5 sm:p-6">
            <h2 className="text-xl font-bold text-slate-950">
              {t("detail.service.title")}
            </h2>

            <div className="mt-5 rounded-2xl bg-emerald-50 p-5">
              <div className="text-lg font-bold text-emerald-950">
                {therapist.serviceName}
              </div>

              <div className="mt-1 text-sm text-emerald-700">
                {therapist.optionLabel}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-emerald-800">
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4" />

                  {formatDuration(therapist.durationMinutes)}
                </div>

                <div className="text-lg font-bold">
                  {formatCurrency(therapist.price)}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {t("detail.availability.title")}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4" />

                  {date}
                </div>

                {hasCoordinates && (
                  <div className="flex items-center gap-2">
                    <LocateFixed className="size-4" />

                    {t("detail.availability.yourLocation")}
                  </div>
                )}

                {!hasCoordinates && hasDistrict && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4" />

                    {districtCode}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              {loadingSlots && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({
                    length: 8,
                  }).map((_, index) => (
                    <div
                      key={index}
                      className="h-16 animate-pulse rounded-xl bg-slate-100"
                    />
                  ))}
                </div>
              )}

              {slotsError && (
                <div className="rounded-2xl bg-red-50 p-5">
                  <div className="font-semibold text-red-700">
                    {t("detail.availability.error")}
                  </div>

                  <p className="mt-1 text-sm text-red-600">
                    {slotsQueryError
                      ? getApiErrorMessage(slotsQueryError)
                      : t("detail.availability.retryDescription")}
                  </p>

                  <Button
                    variant="outline"
                    className="mt-4"
                    loading={fetchingSlots}
                    onClick={() => void refetchSlots()}
                  >
                    {tCommon("retry")}
                  </Button>
                </div>
              )}

              {availability && !loadingSlots && !slotsError && (
                <AvailabilitySlots
                  slots={availability.slots ?? []}
                  selectedTime={selectedTime}
                  onSelect={handleSlotSelect}
                />
              )}
            </div>
          </Card>
        </div>

        <aside>
          <div className="xl:sticky xl:top-24">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                {t("detail.booking.title")}
              </h2>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="text-xs text-slate-400">
                    {t("detail.booking.therapist")}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {therapist.fullName}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    {t("detail.booking.service")}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {therapist.serviceName}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {therapist.optionLabel}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    {t("detail.booking.date")}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {date}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    {t("detail.booking.startTime")}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {selectedTime || t("detail.booking.notSelected")}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="text-xs text-slate-400">
                    {t("detail.booking.price")}
                  </div>

                  <div className="mt-1 text-2xl font-bold text-emerald-700">
                    {formatCurrency(therapist.price)}
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="mt-6 w-full"
                disabled={
                  !selectedTime || !selectedSlotAvailable || fetchingSlots
                }
                onClick={handleContinue}
              >
                {t("detail.booking.continue")}
              </Button>

              <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                {t("detail.booking.notice")}
              </p>

              <TherapistReviews
                therapistId={therapist.therapistId}
                ratingAverage={therapist.ratingAverage || 0}
                ratingCount={therapist.ratingCount}
              />
            </Card>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
