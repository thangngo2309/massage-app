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

import { useRouter } from "next/navigation";

import { useEffect, useMemo, useRef, useState } from "react";

import { useForm } from "react-hook-form";

import { useTranslation } from "react-i18next";

import { toast } from "sonner";

import { BookingVoucherSelector } from "@/components/bookings/BookingVoucherSelector";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import { createClientBooking } from "@/lib/bookings";

import { getApiErrorMessage } from "@/lib/http";

import {
  checkTherapistAvailability,
  findMatchingTherapist,
  getTherapistPublicServices,
} from "@/lib/therapist-search";

import { getEligibleBookingVouchers } from "@/lib/vouchers";

import { useClientBookingFlowStore } from "@/stores/client-booking-flow-store";

import type { TherapistSearchQuery } from "@/types/therapist-search";

import type { EligibleBookingVoucher } from "@/types/voucher";

type BookingFormValues = {
  clientNote: string;
};

export default function NewBookingPage() {
  const router = useRouter();

  const {
    t,

    i18n,
  } = useTranslation("booking");

  const language = (i18n.resolvedLanguage ?? i18n.language ?? "vi")

    .split("-")[0]
    .toLowerCase();

  const locale = language === "en" ? "en-US" : "vi-VN";

  const submittingRef = useRef(false);

  /**



   * ==========================================================



   * BOOKING FLOW STORE



   * ==========================================================



   */

  const serviceId = useClientBookingFlowStore((state) => state.serviceId);

  const therapistId = useClientBookingFlowStore((state) => state.therapistId);

  const therapistServiceIds = useClientBookingFlowStore(
    (state) => state.therapistServiceIds
  );

  const date = useClientBookingFlowStore((state) => state.date);

  const startTime = useClientBookingFlowStore((state) => state.startTime);

  const address = useClientBookingFlowStore((state) => state.address);

  const searchLatitude = useClientBookingFlowStore((state) => state.latitude);

  const searchLongitude = useClientBookingFlowStore((state) => state.longitude);

  const provinceCode = useClientBookingFlowStore((state) => state.provinceCode);

  const provinceName = useClientBookingFlowStore((state) => state.provinceName);

  const wardCode = useClientBookingFlowStore((state) => state.wardCode);

  const wardName = useClientBookingFlowStore((state) => state.wardName);

  const resetSelection = useClientBookingFlowStore(
    (state) => state.resetSelection
  );

  /**



   * ==========================================================



   * BOOKING GPS



   * ==========================================================



   *



   * GPS ở bước checkout không update lại booking-flow store



   * vì setLocation() có chủ đích reset KTV + dịch vụ đã chọn.



   */

  const [bookingLatitude, setBookingLatitude] = useState<number | null>(
    searchLatitude
  );

  const [bookingLongitude, setBookingLongitude] = useState<number | null>(
    searchLongitude
  );

  const [locating, setLocating] = useState(false);

  const [selectedVoucher, setSelectedVoucher] =
    useState<EligibleBookingVoucher | null>(null);

  const hasSearchCoordinates =
    searchLatitude !== null && searchLongitude !== null;

  const hasAdministrativeArea =
    Boolean(provinceCode?.trim()) && Boolean(wardCode?.trim());

  const validFlow =
    Number.isInteger(serviceId) &&
    Number(serviceId) > 0 &&
    Number.isInteger(therapistId) &&
    Number(therapistId) > 0 &&
    therapistServiceIds.length > 0 &&
    Boolean(date) &&
    Boolean(startTime) &&
    address.trim().length >= 5 &&
    (hasSearchCoordinates || hasAdministrativeArea);

  /**



   * ==========================================================



   * THERAPIST SEARCH QUERY



   * ==========================================================



   *



   * Checkout lấy lại TherapistSearchItem thay vì giả định



   * GET /therapists/:id/services có object therapist.



   */

  const therapistSearchQuery = useMemo<TherapistSearchQuery | null>(() => {
    if (!Number.isInteger(serviceId) || Number(serviceId) <= 0) {
      return null;
    }

    if (!hasSearchCoordinates && !hasAdministrativeArea) {
      return null;
    }

    return {
      serviceId: Number(serviceId),

      ...(hasSearchCoordinates
        ? {
            latitude: searchLatitude!,

            longitude: searchLongitude!,
          }
        : {}),

      ...(hasAdministrativeArea
        ? {
            provinceCode: provinceCode.trim(),

            wardCode: wardCode.trim(),
          }
        : {}),

      page: 1,

      limit: 50,
    };
  }, [
    serviceId,

    hasSearchCoordinates,

    searchLatitude,

    searchLongitude,

    hasAdministrativeArea,

    provinceCode,

    wardCode,
  ]);

  const {
    register,

    handleSubmit,

    formState: {
      errors,

      isSubmitting,
    },
  } = useForm<BookingFormValues>({
    defaultValues: {
      clientNote: "",
    },
  });

  /**



   * ==========================================================



   * THERAPIST



   * ==========================================================



   *



   * Đây là nguồn thông tin KTV:



   *



   * - stageName



   * - avatar



   * - rating



   * - trạng thái đủ điều kiện Search



   *



   * Không lấy từ publicServices.therapist.



   */

  const {
    data: therapist,

    isLoading: loadingTherapist,

    isError: therapistError,

    error: therapistQueryError,
  } = useQuery({
    queryKey: [
      "booking-therapist",

      therapistId,

      therapistSearchQuery,

      language,
    ],

    queryFn: () =>
      findMatchingTherapist(
        Number(therapistId),

        therapistSearchQuery!,

        language
      ),

    enabled: validFlow && therapistSearchQuery !== null,
  });

  /**



   * ==========================================================



   * THERAPIST SERVICES



   * ==========================================================



   *



   * Endpoint này chỉ dùng để resolve:



   *



   * therapistServiceIds[]



   * → service



   * → option



   * → duration



   * → price



   */

  const {
    data: publicServices,

    isLoading: loadingServices,

    isError: servicesError,

    error: servicesQueryError,
  } = useQuery({
    queryKey: ["booking-therapist-services", therapistId, language],

    queryFn: () =>
      getTherapistPublicServices(
        Number(therapistId),

        language
      ),

    enabled: validFlow,
  });

  const allTherapistServices = useMemo(
    () =>
      (publicServices?.services ?? []).flatMap((service) =>
        service.options.map((option) => ({
          ...option,

          serviceId: service.serviceId,

          serviceName: service.serviceName,
        }))
      ),

    [publicServices?.services]
  );

  const selectedServices = useMemo(() => {
    const selectedIds = new Set(therapistServiceIds);

    return allTherapistServices.filter((item) =>
      selectedIds.has(item.therapistServiceId)
    );
  }, [allTherapistServices, therapistServiceIds]);

  /**



   * Nếu store có 3 therapistServiceIds thì API phải



   * resolve đủ cả 3.



   */

  const selectionResolved =
    selectedServices.length === therapistServiceIds.length;

  const totalDuration = selectedServices.reduce(
    (
      total,

      item
    ) => total + Number(item.durationMinutes),

    0
  );

  const fallbackOrderAmount = selectedServices.reduce(
    (
      total,

      item
    ) => total + Number(item.price),

    0
  );

  /**



   * ==========================================================



   * VOUCHERS



   * ==========================================================



   */

  const {
    data: eligibleVouchers,

    isLoading: loadingEligibleVouchers,

    isError: eligibleVouchersError,
  } = useQuery({
    queryKey: [
      "eligible-booking-vouchers",

      therapistId,

      therapistServiceIds,

      language,
    ],

    queryFn: () =>
      getEligibleBookingVouchers(
        {
          therapistId: Number(therapistId),

          therapistServiceIds,
        },

        language
      ),

    enabled:
      validFlow &&
      selectionResolved &&
      Boolean(publicServices) &&
      Boolean(therapist),
  });

  /**



   * Nếu selection thay đổi và voucher cũ



   * không còn eligible thì bỏ voucher.



   */

  useEffect(() => {
    if (!selectedVoucher || !eligibleVouchers) {
      return;
    }

    const stillEligible = eligibleVouchers.items.some(
      (voucher) => voucher.userVoucherId === selectedVoucher.userVoucherId
    );

    if (!stillEligible) {
      setSelectedVoucher(null);
    }
  }, [eligibleVouchers, selectedVoucher]);

  const bookingOrderAmount =
    eligibleVouchers?.orderAmount ?? fallbackOrderAmount;

  const bookingDiscountAmount = selectedVoucher?.discountAmount ?? 0;

  const bookingFinalAmount = selectedVoucher?.finalAmount ?? bookingOrderAmount;

  /**



   * ==========================================================



   * CREATE BOOKING



   * ==========================================================



   */

  const createMutation = useMutation({
    mutationFn: createClientBooking,
  });

  /**



   * ==========================================================



   * FORMAT



   * ==========================================================



   */

  const formatBookingCurrency = (value: number | string) =>
    new Intl.NumberFormat(
      locale,

      {
        style: "currency",

        currency: "VND",

        maximumFractionDigits: 0,
      }
    ).format(Number(value));

  const formatBookingDuration = (minutes: number) => {
    if (minutes < 60) {
      return t(
        "duration.minutes",

        {
          count: minutes,
        }
      );
    }

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    if (!remainingMinutes) {
      return t(
        "duration.hours",

        {
          count: hours,
        }
      );
    }

    return t(
      "duration.hoursMinutes",

      {
        hours,

        minutes: remainingMinutes,
      }
    );
  };

  const formatBookingDate = (value: string) => {
    const [year, month, day] = value

      .split("-")

      .map(Number);

    if (!year || !month || !day) {
      return value;
    }

    return new Intl.DateTimeFormat(
      locale,

      {
        dateStyle: "medium",
      }
    ).format(
      new Date(
        year,

        month - 1,

        day
      )
    );
  };

  /**



   * ==========================================================



   * CURRENT LOCATION



   * ==========================================================



   */

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

      (locationError) => {
        setLocating(false);

        if (locationError.code === locationError.PERMISSION_DENIED) {
          toast.error(t("new.location.permissionDenied"));

          return;
        }

        if (locationError.code === locationError.POSITION_UNAVAILABLE) {
          toast.error(t("new.location.unavailable"));

          return;
        }

        if (locationError.code === locationError.TIMEOUT) {
          toast.error(t("new.location.timeout"));

          return;
        }

        toast.error(t("new.location.error"));
      },

      {
        enableHighAccuracy: true,

        timeout: 15000,

        maximumAge: 30000,
      }
    );
  };

  /**



   * ==========================================================



   * SUBMIT



   * ==========================================================



   */

  const onSubmit = async (values: BookingFormValues) => {
    if (!validFlow || !therapistId) {
      toast.error(t("new.invalid.description"));

      return;
    }

    if (!therapist) {
      toast.error(t("new.errors.therapistUnavailable"));

      return;
    }

    if (!publicServices || !selectionResolved) {
      toast.error(
        t(
          "new.errors.optionNotFound",

          {
            defaultValue: "Một hoặc nhiều dịch vụ đã chọn không còn khả dụng.",
          }
        )
      );

      return;
    }

    /**



       * Backend CreateBookingDto yêu cầu GPS thật.



       */

    if (bookingLatitude === null || bookingLongitude === null) {
      toast.error(t("new.location.required"));

      return;
    }

    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;

    try {
      /**



         * Re-check toàn bộ multi-service interval



         * ngay trước khi POST Booking.



         */

      const availability = await checkTherapistAvailability(
        Number(therapistId),

        {
          therapistServiceIds,

          date,

          startTime,
        }
      );

      if (!availability.available) {
        toast.error(availability.reason || t("new.errors.slotUnavailable"));

        return;
      }

      const booking = await createMutation.mutateAsync({
        therapistId: Number(therapistId),

        therapistServiceIds,

        date,

        startTime,

        address: address.trim(),

        latitude: bookingLatitude,

        longitude: bookingLongitude,

        provinceCode: provinceCode || undefined,

        wardCode: wardCode || undefined,

        clientNote: values.clientNote.trim() || undefined,

        userVoucherId: selectedVoucher?.userVoucherId ?? undefined,
      });

      toast.success(t("new.success"));

      resetSelection();

      router.replace(`/client/bookings/${booking.id}`);
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError));
    } finally {
      submittingRef.current = false;
    }
  };

  /**



   * ==========================================================



   * INVALID FLOW



   * ==========================================================



   */

  if (!validFlow) {
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

  /**



   * ==========================================================



   * LOADING



   * ==========================================================



   */

  if (loadingTherapist || loadingServices) {
    return (
      <PageContainer className="py-5 sm:py-6 lg:py-8">
        <div className="animate-pulse">
          <div className="h-8 w-56 rounded bg-slate-100" />

          <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />

          <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="h-[420px] rounded-2xl bg-slate-100" />

            <div className="h-[560px] rounded-2xl bg-slate-100" />
          </div>
        </div>
      </PageContainer>
    );
  }

  /**



   * ==========================================================



   * DATA UNAVAILABLE



   * ==========================================================



   */

  if (
    therapistError ||
    servicesError ||
    !therapist ||
    !publicServices ||
    !selectionResolved
  ) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <UserRound className="size-10 text-slate-300" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t("new.unavailable.title")}
          </h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {therapistQueryError || servicesQueryError
              ? getApiErrorMessage(therapistQueryError ?? servicesQueryError)
              : t("new.unavailable.description")}
          </p>

          <Button
            type="button"
            className="mt-6"
            onClick={() =>
              router.push(
                `/client/therapists/${therapistId}?serviceId=${serviceId}`
              )
            }
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

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_400px]">
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

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-emerald-700" />

                <div>
                  <div className="font-semibold text-slate-900">{address}</div>

                  {hasAdministrativeArea && (
                    <div className="mt-1 text-sm text-slate-500">
                      {wardName || wardCode}

                      {", "}

                      {provinceName || provinceCode}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
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
                      {bookingLatitude.toFixed(5)}

                      {", "}

                      {bookingLongitude.toFixed(5)}
                    </span>
                  </div>
                )}
              </div>

              {bookingLatitude === null || bookingLongitude === null ? (
                <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
                  {t("new.location.notSelected")}
                </div>
              ) : (
                <div className="mt-2 text-xs font-medium text-emerald-600">
                  {t("new.location.selected")}
                </div>
              )}
            </div>

            <div className="mt-6">
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
                {...register(
                  "clientNote",

                  {
                    maxLength: {
                      value: 2000,

                      message: t("new.note.validation.maxLength"),
                    },
                  }
                )}
              />

              {errors.clientNote && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.clientNote.message}
                </p>
              )}
            </div>
          </Card>

          <Button
            type="submit"
            size="lg"
            disabled={bookingLatitude === null || bookingLongitude === null}
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
                      {therapist.stageName?.trim() ||
                        t("new.summary.therapistUpdating", {
                          defaultValue: "Đang cập nhật nghệ danh",
                        })}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="font-bold text-slate-900">
                      {t(
                        "new.summary.services",

                        {
                          defaultValue: "Dịch vụ đã chọn",
                        }
                      )}
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {selectedServices.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedServices.map((service) => (
                      <div
                        key={service.therapistServiceId}
                        className="rounded-xl bg-slate-50 p-3"
                      >
                        <div className="text-sm font-semibold text-slate-900">
                          {service.serviceName}
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-500">
                            {service.label ||
                              formatBookingDuration(service.durationMinutes)}
                          </span>

                          <span className="font-semibold text-emerald-700">
                            {formatBookingCurrency(service.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
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
                      {formatBookingDuration(totalDuration)}
                    </strong>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">
                      {t("new.summary.servicePrice")}
                    </span>

                    <strong className="text-lg text-emerald-700">
                      {formatBookingCurrency(bookingOrderAmount)}
                    </strong>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <div className="mb-3">
                    <div className="text-sm font-bold text-slate-900">
                      {t("new.voucher.title")}
                    </div>

                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      {t("new.voucher.description")}
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
                    <span className="text-slate-500">
                      {t("new.summary.servicePrice")}
                    </span>

                    <strong className="text-slate-900">
                      {formatBookingCurrency(bookingOrderAmount)}
                    </strong>
                  </div>

                  {bookingDiscountAmount > 0 && (
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500">
                        {t("new.summary.discount")}
                      </span>

                      <strong className="text-emerald-700">
                        -{formatBookingCurrency(bookingDiscountAmount)}
                      </strong>
                    </div>
                  )}

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="flex items-end justify-between gap-3">
                      <span className="font-semibold text-slate-900">
                        {t("new.summary.totalPayment")}
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
                disabled={bookingLatitude === null || bookingLongitude === null}
                loading={isSubmitting || createMutation.isPending}
                className="mt-6 hidden w-full xl:flex"
              >
                {t("new.submit")}
              </Button>

              {(bookingLatitude === null || bookingLongitude === null) && (
                <p className="mt-3 text-center text-xs leading-5 text-amber-600">
                  {t("new.location.required")}
                </p>
              )}

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
