"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import {
  CalendarDays,
  Clock3,
  LocateFixed,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import { useMemo, useRef, useState } from "react";

import { useForm } from "react-hook-form";

import { useTranslation } from "react-i18next";

import { toast } from "sonner";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { Input } from "@/components/ui/Input";

import { PageContainer } from "@/components/ui/PageContainer";

import { BookingVoucherSelector } from "@/components/bookings/BookingVoucherSelector";

import { createClientBooking } from "@/lib/bookings";

import { getApiErrorMessage } from "@/lib/http";

import { getClientService } from "@/lib/services";

import { getEligibleBookingVouchers } from "@/lib/vouchers";

import {
  checkTherapistAvailability,
  findMatchingTherapist,
} from "@/lib/therapist-search";

import type { TherapistSearchQuery } from "@/types/therapist-search";

import type { EligibleBookingVoucher } from "@/types/voucher";

type BookingFormValues = {
  address: string;

  clientNote: string;
};

export default function NewBookingPage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const { t, i18n } = useTranslation("booking");

  const submittingRef = useRef(false);

  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";

  const therapistId = Number(searchParams.get("therapistId"));

  const serviceId = Number(searchParams.get("serviceId"));

  const serviceOptionId = Number(searchParams.get("serviceOptionId"));

  const date = searchParams.get("date") ?? "";

  const startTime = searchParams.get("startTime") ?? "";

  const searchLatitudeParam = searchParams.get("latitude");

  const searchLongitudeParam = searchParams.get("longitude");

  const districtCode = searchParams.get("districtCode") ?? "";

  const provinceCode = searchParams.get("provinceCode") ?? "";

  const parseCoordinate = (value: string | null) => {
    if (value === null || value.trim() === "") {
      return undefined;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : undefined;
  };

  const searchLatitude = parseCoordinate(searchLatitudeParam);

  const searchLongitude = parseCoordinate(searchLongitudeParam);

  const validLatitude =
    searchLatitude !== undefined &&
    searchLatitude >= -90 &&
    searchLatitude <= 90;

  const validLongitude =
    searchLongitude !== undefined &&
    searchLongitude >= -180 &&
    searchLongitude <= 180;

  const hasSearchCoordinates = validLatitude && validLongitude;

  const hasSearchDistrict = districtCode.trim().length > 0;

  const [bookingLatitude, setBookingLatitude] = useState<number | null>(
    searchLatitude ?? null
  );

  const [bookingLongitude, setBookingLongitude] = useState<number | null>(
    searchLongitude ?? null
  );

  const [locating, setLocating] = useState(false);

  const [selectedVoucher, setSelectedVoucher] =
    useState<EligibleBookingVoucher | null>(null);

  const validParams =
    Number.isInteger(therapistId) &&
    therapistId > 0 &&
    Number.isInteger(serviceId) &&
    serviceId > 0 &&
    Number.isInteger(serviceOptionId) &&
    serviceOptionId > 0 &&
    !!date &&
    !!startTime &&
    (hasSearchCoordinates || hasSearchDistrict);

  const therapistSearchQuery = useMemo<TherapistSearchQuery>(
    () => ({
      serviceOptionId,

      date,

      startTime,

      ...(hasSearchCoordinates
        ? {
            latitude: searchLatitude,

            longitude: searchLongitude,
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

      startTime,

      hasSearchCoordinates,

      searchLatitude,

      searchLongitude,

      districtCode,

      provinceCode,
    ]
  );

  const {
    register,

    handleSubmit,

    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    defaultValues: {
      address: "",

      clientNote: "",
    },
  });

  const {
    data: service,

    isLoading: loadingService,

    isError: serviceError,
  } = useQuery({
    queryKey: ["booking-service", serviceId],

    queryFn: () => getClientService(serviceId),

    enabled: validParams,
  });

  const {
    data: therapist,

    isLoading: loadingTherapist,

    isError: therapistError,
  } = useQuery({
    queryKey: ["booking-therapist", therapistId, therapistSearchQuery],

    queryFn: () => findMatchingTherapist(therapistId, therapistSearchQuery),

    enabled: validParams,
  });

  const selectedOption = service?.options?.find(
    (option) => option.id === serviceOptionId
  );

  const {
    data: eligibleVouchers,
    isLoading: loadingEligibleVouchers,
    isError: eligibleVouchersError,
  } = useQuery({
    queryKey: ["eligible-booking-vouchers", therapistId, serviceOptionId],

    queryFn: () =>
      getEligibleBookingVouchers({
        therapistId,
        serviceOptionId,
      }),

    enabled: validParams && !!service && !!selectedOption && !!therapist,
  });

  const bookingOrderAmount =
    eligibleVouchers?.orderAmount ?? Number(therapist?.price ?? 0);

  const bookingDiscountAmount = selectedVoucher?.discountAmount ?? 0;

  const bookingFinalAmount = selectedVoucher?.finalAmount ?? bookingOrderAmount;

  const createMutation = useMutation({
    mutationFn: createClientBooking,
  });

  const formatBookingCurrency = (value: number | string) =>
    new Intl.NumberFormat(locale, {
      style: "currency",

      currency: "VND",

      maximumFractionDigits: 0,
    }).format(Number(value));

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

  const formatBookingDate = (value: string) => {
    const parts = value.split("-");

    if (parts.length !== 3) {
      return value;
    }

    const year = Number(parts[0]);

    const month = Number(parts[1]);

    const day = Number(parts[2]);

    if (!year || !month || !day) {
      return value;
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    }).format(new Date(year, month - 1, day));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("new.location.unsupported"));

      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBookingLatitude(position.coords.latitude);

        setBookingLongitude(position.coords.longitude);

        setLocating(false);

        toast.success(t("new.location.success"));
      },

      (error) => {
        setLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          toast.error(t("new.location.permissionDenied"));

          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error(t("new.location.unavailable"));

          return;
        }

        if (error.code === error.TIMEOUT) {
          toast.error(t("new.location.timeout"));

          return;
        }

        toast.error(t("new.location.error"));
      },

      {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 30000,
      }
    );
  };

  const onSubmit = async (values: BookingFormValues) => {
    if (!service) {
      toast.error(t("new.errors.serviceNotFound"));

      return;
    }

    if (!selectedOption) {
      toast.error(t("new.errors.optionNotFound"));

      return;
    }

    if (!therapist) {
      toast.error(t("new.errors.therapistUnavailable"));

      return;
    }

    if (bookingLatitude === null || bookingLongitude === null) {
      toast.error(t("new.location.required"));

      return;
    }

    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;

    try {
      const availability = await checkTherapistAvailability(therapistId, {
        serviceId,

        serviceOptionId,

        date,

        startTime,
      });

      if (!availability.available) {
        toast.error(availability.reason || t("new.errors.slotUnavailable"));

        return;
      }

      const booking = await createMutation.mutateAsync({
        therapistId,

        serviceOptionId,

        date,

        startTime,

        address: values.address.trim(),

        latitude: bookingLatitude,

        longitude: bookingLongitude,

        districtCode: districtCode || undefined,

        provinceCode: provinceCode || undefined,

        clientNote: values.clientNote.trim() || undefined,

        userVoucherId: selectedVoucher?.userVoucherId ?? undefined,
      });

      toast.success(t("new.success"));

      router.replace(`/client/bookings/${booking.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  };

  if (!validParams) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <MapPin className="size-10 text-slate-300" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t("new.invalid.title")}
          </h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t("new.invalid.description")}
          </p>

          <Button
            type="button"
            className="mt-6"
            onClick={() => router.push("/client/services")}
          >
            {t("new.invalid.selectService")}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  if (loadingService || loadingTherapist) {
    return (
      <PageContainer className="py-5 sm:py-6 lg:py-8">
        <div className="animate-pulse">
          <div className="h-8 w-56 rounded bg-slate-100" />

          <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />

          <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)\_380px]">
            <div className="h-[520px] rounded-2xl bg-slate-100" />

            <div className="h-[460px] rounded-2xl bg-slate-100" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (
    serviceError ||
    therapistError ||
    !service ||
    !selectedOption ||
    !therapist
  ) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <UserRound className="size-10 text-slate-300" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t("new.unavailable.title")}
          </h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t("new.unavailable.description")}
          </p>

          <Button
            type="button"
            className="mt-6"
            onClick={() => router.push("/client/services")}
          >
            {t("new.unavailable.action")}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {t("new.title")}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {t("new.description")}
        </p>
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)\_380px]">
        <form
          id="client-booking-form"
          onSubmit={handleSubmit(onSubmit)}
          className="min-w-0"
        >
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              {t("new.address.title")}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {t("new.address.description")}
            </p>

            <div className="mt-6 space-y-6">
              <Input
                id="address"
                label={t("new.address.label")}
                placeholder={t("new.address.placeholder")}
                autoComplete="street-address"
                error={errors.address?.message}
                {...register("address", {
                  required: t("new.address.validation.required"),

                  minLength: {
                    value: 5,

                    message: t("new.address.validation.minLength"),
                  },

                  maxLength: {
                    value: 500,

                    message: t("new.address.validation.maxLength"),
                  },
                })}
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {t("new.location.label")}
                </label>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {t("new.location.description")}
                </p>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    loading={locating}
                    onClick={handleUseCurrentLocation}
                  >
                    <LocateFixed className="size-5" />

                    {bookingLatitude !== null && bookingLongitude !== null
                      ? t("new.location.update")
                      : t("new.location.useCurrent")}
                  </Button>

                  {bookingLatitude !== null && bookingLongitude !== null && (
                    <div className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                      <MapPin className="size-4 shrink-0" />

                      <span>
                        {bookingLatitude.toFixed(5)},{" "}
                        {bookingLongitude.toFixed(5)}
                      </span>
                    </div>
                  )}
                </div>

                {bookingLatitude === null || bookingLongitude === null ? (
                  <div className="mt-2 text-xs text-amber-600">
                    {t("new.location.notSelected")}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-emerald-600">
                    {t("new.location.selected")}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="clientNote"
                  className="block text-sm font-semibold text-slate-700"
                >
                  {t("new.note.label")}
                </label>

                <textarea
                  id="clientNote"
                  rows={5}
                  placeholder={t("new.note.placeholder")}
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
                  {...register("clientNote", {
                    maxLength: {
                      value: 1000,

                      message: t("new.note.validation.maxLength"),
                    },
                  })}
                />

                {errors.clientNote && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.clientNote.message}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            size="lg"
            loading={isSubmitting || createMutation.isPending}
            className="mt-5 w-full xl:hidden"
          >
            {t("new.submit")}
          </Button>
        </form>

        <aside className="min-w-0">
          <div className="xl:sticky xl:top-24">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                {t("new.summary.title")}
              </h2>

              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <UserRound className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs text-slate-400">
                      {t("new.summary.therapist")}
                    </div>

                    <div className="mt-1 font-semibold text-slate-900">
                      {therapist.fullName}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <div className="font-bold text-slate-900">{service.name}</div>

                  <div className="mt-1 text-sm text-slate-500">
                    {selectedOption.label}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CalendarDays className="size-4" />

                      {t("new.summary.date")}
                    </div>

                    <div className="mt-1 font-semibold text-slate-900">
                      {formatBookingDate(date)}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock3 className="size-4" />

                      {t("new.summary.startTime")}
                    </div>

                    <div className="mt-1 font-semibold text-slate-900">
                      {startTime}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">
                      {t("new.summary.duration")}
                    </span>

                    <strong className="text-slate-900">
                      {formatBookingDuration(therapist.durationMinutes)}
                    </strong>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">
                      {t("new.summary.servicePrice")}
                    </span>

                    <strong className="text-lg text-emerald-700">
                      {formatBookingCurrency(therapist.price)}
                    </strong>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <div className="mb-3">
                    <div className="text-sm font-bold text-slate-900">
                      Ưu đãi
                    </div>

                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      Chọn voucher được cấp từ các chương trình khuyến mãi của
                      bạn.
                    </div>
                  </div>

                  <BookingVoucherSelector
                    items={eligibleVouchers?.items ?? []}
                    selectedUserVoucherId={
                      selectedVoucher?.userVoucherId ?? null
                    }
                    loading={loadingEligibleVouchers}
                    error={eligibleVouchersError}
                    onSelect={setSelectedVoucher}
                    formatCurrency={formatBookingCurrency}
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Giá dịch vụ</span>

                    <strong className="text-slate-900">
                      {formatBookingCurrency(bookingOrderAmount)}
                    </strong>
                  </div>

                  {bookingDiscountAmount > 0 && (
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500">Ưu đãi</span>

                      <strong className="text-emerald-700">
                        -{formatBookingCurrency(bookingDiscountAmount)}
                      </strong>
                    </div>
                  )}

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="flex items-end justify-between gap-3">
                      <span className="font-semibold text-slate-900">
                        Tổng thanh toán
                      </span>

                      <strong className="text-xl text-emerald-700">
                        {formatBookingCurrency(bookingFinalAmount)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />

                  <p className="text-xs leading-5 text-emerald-800">
                    {t("new.summary.availabilityNotice")}
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                form="client-booking-form"
                size="lg"
                loading={isSubmitting || createMutation.isPending}
                className="mt-6 hidden w-full xl:flex"
              >
                {t("new.submit")}
              </Button>

              <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                {t("new.afterSubmit")}
              </p>
            </Card>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
