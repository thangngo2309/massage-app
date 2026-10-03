"use client";

import { useQuery } from "@tanstack/react-query";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Layers3,
  LocateFixed,
  MapPin,
  RefreshCcw,
  Star,
} from "lucide-react";

import { format } from "date-fns";

import { useParams, useRouter, useSearchParams } from "next/navigation";

import { useEffect, useMemo } from "react";

import { useTranslation } from "react-i18next";

import { TherapistReviews } from "@/components/ratings/TherapistReviews";

import { AvailabilitySlots } from "@/components/therapists/AvailabilitySlots";

import { TherapistPublicGallery } from "@/components/therapists/TherapistPublicGallery";

import { Badge } from "@/components/ui/Badge";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import { getApiErrorMessage } from "@/lib/http";

import {
  findMatchingTherapist,
  getTherapistAvailabilitySlots,
  getTherapistPublicServices,
} from "@/lib/therapist-search";

import { formatCurrency, formatDuration } from "@/lib/utils";

import { useClientBookingFlowStore } from "@/stores/client-booking-flow-store";

import type {
  TherapistAvailabilitySlot,
  TherapistPublicServiceOption,
  TherapistSearchQuery,
} from "@/types/therapist-search";

type SelectableServiceOption = TherapistPublicServiceOption & {
  serviceId: number;

  serviceName: string;
};

export default function TherapistDetailPage() {
  const { t, i18n } = useTranslation("therapists");

  const { t: tCommon } = useTranslation("common");

  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const searchParams = useSearchParams();

  const therapistId = Number(params.id);

  const serviceId = Number(searchParams.get("serviceId"));

  const language = (i18n.resolvedLanguage ?? i18n.language ?? "vi")

    .split("-")[0]
    .toLowerCase();

  const locale = language === "en" ? "en-US" : "vi-VN";

  const address = useClientBookingFlowStore((state) => state.address);

  const latitude = useClientBookingFlowStore((state) => state.latitude);

  const longitude = useClientBookingFlowStore((state) => state.longitude);

  const provinceCode = useClientBookingFlowStore((state) => state.provinceCode);

  const provinceName = useClientBookingFlowStore((state) => state.provinceName);

  const wardCode = useClientBookingFlowStore((state) => state.wardCode);

  const wardName = useClientBookingFlowStore((state) => state.wardName);

  const selectedTherapistServiceIds = useClientBookingFlowStore(
    (state) => state.therapistServiceIds
  );

  const selectedDate = useClientBookingFlowStore((state) => state.date);

  const selectedTime = useClientBookingFlowStore((state) => state.startTime);

  const setService = useClientBookingFlowStore((state) => state.setService);

  const setTherapist = useClientBookingFlowStore((state) => state.setTherapist);

  const setTherapistServices = useClientBookingFlowStore(
    (state) => state.setTherapistServices
  );

  const setDate = useClientBookingFlowStore((state) => state.setDate);

  const setStartTime = useClientBookingFlowStore((state) => state.setStartTime);

  const hasCoordinates = latitude !== null && longitude !== null;

  const hasAdministrativeArea =
    provinceCode.trim().length > 0 && wardCode.trim().length > 0;

  const locationReady =
    address.trim().length >= 5 && (hasCoordinates || hasAdministrativeArea);

  const validParams =
    Number.isInteger(therapistId) &&
    therapistId > 0 &&
    Number.isInteger(serviceId) &&
    serviceId > 0 &&
    locationReady;

  const searchQuery = useMemo<TherapistSearchQuery>(
    () => ({
      serviceId,

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

      page: 1,

      limit: 50,
    }),

    [
      serviceId,

      hasCoordinates,

      latitude,

      longitude,

      hasAdministrativeArea,

      provinceCode,

      wardCode,
    ]
  );

  useEffect(() => {
    if (Number.isInteger(serviceId) && serviceId > 0) {
      setService(serviceId);
    }
  }, [serviceId, setService]);

  useEffect(() => {
    if (Number.isInteger(therapistId) && therapistId > 0) {
      setTherapist(therapistId);
    }
  }, [therapistId, setTherapist]);

  useEffect(() => {
    if (!selectedDate) {
      setDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [selectedDate, setDate]);

  const {
    data: therapist,

    isLoading: loadingTherapist,

    isError: therapistError,

    error: therapistQueryError,

    refetch: refetchTherapist,

    isFetching: fetchingTherapist,
  } = useQuery({
    queryKey: ["therapist-search", "match", therapistId, searchQuery, language],

    queryFn: () => findMatchingTherapist(therapistId, searchQuery, language),

    enabled: validParams,
  });

  const {
    data: publicServices,

    isLoading: loadingServices,

    isError: servicesError,

    error: servicesQueryError,

    refetch: refetchServices,

    isFetching: fetchingServices,
  } = useQuery({
    queryKey: ["therapist-public-services", therapistId, language],

    queryFn: () => getTherapistPublicServices(therapistId, language),

    enabled: validParams,
  });

  const serviceGroups = useMemo(() => {
    const groups = [...(publicServices?.services ?? [])];

    groups.sort((left, right) => {
      if (left.serviceId === serviceId && right.serviceId !== serviceId) {
        return -1;
      }

      if (right.serviceId === serviceId && left.serviceId !== serviceId) {
        return 1;
      }

      return left.name.localeCompare(right.name, language);
    });

    return groups;
  }, [publicServices?.services, serviceId, language]);

  const selectableOptions = useMemo<SelectableServiceOption[]>(
    () =>
      serviceGroups.flatMap((group) =>
        group.options.map((option) => ({
          ...option,

          serviceId: group.serviceId,

          serviceName: group.name,
        }))
      ),

    [serviceGroups]
  );

  /**

   * Nếu dữ liệu KTV thay đổi và một TherapistService

   * cũ không còn tồn tại thì tự loại khỏi selection.

   */

  useEffect(() => {
    if (!publicServices) {
      return;
    }

    const validIds = new Set(
      selectableOptions.map((item) => item.therapistServiceId)
    );

    const next = selectedTherapistServiceIds.filter((id) => validIds.has(id));

    if (next.length !== selectedTherapistServiceIds.length) {
      setTherapistServices(next);
    }
  }, [
    publicServices,

    selectableOptions,

    selectedTherapistServiceIds,

    setTherapistServices,
  ]);

  const selectedOptions = useMemo(() => {
    const selected = new Set(selectedTherapistServiceIds);

    return selectableOptions.filter((item) =>
      selected.has(item.therapistServiceId)
    );
  }, [selectableOptions, selectedTherapistServiceIds]);

  const totalDuration = selectedOptions.reduce(
    (total, item) => total + Number(item.durationMinutes),

    0
  );

  const totalPrice = selectedOptions.reduce(
    (total, item) => total + Number(item.price),

    0
  );

  const availabilityQueryEnabled =
    validParams &&
    selectedTherapistServiceIds.length > 0 &&
    Boolean(selectedDate);

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

      selectedTherapistServiceIds,

      selectedDate,
    ],

    queryFn: () =>
      getTherapistAvailabilitySlots(therapistId, {
        therapistServiceIds: selectedTherapistServiceIds,

        date: selectedDate,

        slotInterval: 30,
      }),

    enabled: availabilityQueryEnabled,
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
      setStartTime("");
    }
  }, [availability, selectedTime, setStartTime]);

  const handleToggleOption = (therapistServiceId: number) => {
    const selected = selectedTherapistServiceIds.includes(therapistServiceId);

    if (selected) {
      setTherapistServices(
        selectedTherapistServiceIds.filter((id) => id !== therapistServiceId)
      );

      return;
    }

    setTherapistServices([...selectedTherapistServiceIds, therapistServiceId]);
  };

  const handleSlotSelect = (slot: TherapistAvailabilitySlot) => {
    if (!slot.available) {
      return;
    }

    setStartTime(slot.startTime);
  };

  const handleContinue = () => {
    if (
      !therapist ||
      !publicServices ||
      !selectedTherapistServiceIds.length ||
      !selectedDate ||
      !selectedTime ||
      !selectedSlotAvailable
    ) {
      return;
    }

    /**

     * Batch B sẽ đọc toàn bộ checkout state

     * từ Zustand store này.

     */

    router.push("/client/bookings/new");
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

          <Button
            className="mt-6"
            onClick={() => router.push("/client/services")}
          >
            {t("detail.invalid.action")}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  if (loadingTherapist || loadingServices) {
    return (
      <PageContainer className="py-8">
        <div className="animate-pulse">
          <div className="h-5 w-40 rounded bg-slate-100" />

          <div className="mt-6 h-72 rounded-[28px] bg-slate-100" />

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-[520px] rounded-2xl bg-slate-100" />

            <div className="h-80 rounded-2xl bg-slate-100" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (therapistError || servicesError || !therapist || !publicServices) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <RefreshCcw className="size-9 text-red-500" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t("detail.notFound.title")}
          </h1>

          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            {getApiErrorMessage(therapistQueryError ?? servicesQueryError)}
          </p>

          <Button
            className="mt-5"
            variant="outline"
            loading={fetchingTherapist || fetchingServices}
            onClick={() => {
              void refetchTherapist();

              void refetchServices();
            }}
          >
            {tCommon("retry")}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const therapistName =
    therapist.stageName?.trim() ||
    t("detail.stageNameUpdating", {
      defaultValue: "Đang cập nhật nghệ danh",
    });

  const therapistBio = therapist.bio?.trim() || null;

  const therapistGender = therapist.gender ?? "unknown";

  const therapistGenderLabel = t(
    `detail.profile.genderValues.${therapistGender}`,
    {
      defaultValue: t("detail.profile.notUpdated", {
        defaultValue: "Chưa cập nhật",
      }),
    }
  );

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
                alt={therapistName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl font-bold">
                {therapistName.trim().charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Badge className="bg-white/10 text-white">
              {t("detail.badge")}
            </Badge>

            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              {therapistName}
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
            therapistName={therapistName}
          />
        </div>
      )}

      <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-7">
          <Card className="p-5 sm:p-6">
            <h2 className="text-xl font-bold text-slate-950">
              {t("detail.profile.title", {
                defaultValue: "Thông tin kỹ thuật viên",
              })}
            </h2>

            {therapistBio ? (
              <div className="mt-5">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t("detail.profile.bio", {
                    defaultValue: "Giới thiệu",
                  })}
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {therapistBio}
                </p>
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-400">
                  {t("detail.profile.stageName", {
                    defaultValue: "Nghệ danh",
                  })}
                </div>

                <div className="mt-1 font-semibold text-slate-900">
                  {therapistName}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-400">
                  {t("detail.profile.gender", {
                    defaultValue: "Giới tính",
                  })}
                </div>

                <div className="mt-1 font-semibold text-slate-900">
                  {therapistGenderLabel}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-400">
                  {t("detail.profile.tattoo", {
                    defaultValue: "Hình xăm",
                  })}
                </div>

                <div className="mt-1 font-semibold text-slate-900">
                  {therapist.hasTattoo
                    ? t("detail.profile.tattooYes", {
                        defaultValue: "Có",
                      })
                    : t("detail.profile.tattooNo", {
                        defaultValue: "Không",
                      })}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {t("detail.service.title", {
                  defaultValue: "Chọn dịch vụ",
                })}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {t("detail.service.multiDescription", {
                  defaultValue:
                    "Bạn có thể chọn một hoặc nhiều dịch vụ của cùng kỹ thuật viên trong một lần đặt lịch.",
                })}
              </p>
            </div>

            <div className="mt-6 space-y-6">
              {serviceGroups.map((group) => (
                <div key={group.serviceId}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">{group.name}</h3>

                    {group.serviceId === serviceId && (
                      <Badge variant="success">
                        {t("detail.service.searchTarget", {
                          defaultValue: "Dịch vụ bạn đang tìm",
                        })}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {group.options.map((option) => {
                      const selected = selectedTherapistServiceIds.includes(
                        option.therapistServiceId
                      );

                      return (
                        <button
                          key={option.therapistServiceId}
                          type="button"
                          onClick={() =>
                            handleToggleOption(option.therapistServiceId)
                          }
                          className={`relative rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/10"
                              : "border-slate-200 bg-white hover:border-emerald-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-bold text-slate-900">
                                {option.label ||
                                  formatDuration(
                                    option.durationMinutes,

                                    locale
                                  )}
                              </div>

                              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                <Clock3 className="size-4 text-emerald-700" />

                                {formatDuration(option.durationMinutes, locale)}
                              </div>
                            </div>

                            <div
                              className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
                                selected
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {selected && <Check className="size-4" />}
                            </div>
                          </div>

                          <div className="mt-4 text-lg font-bold text-emerald-700">
                            {formatCurrency(option.price, locale)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-xl font-bold text-slate-950">
              {t("detail.availability.title")}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {selectedOptions.length > 0
                ? t("detail.availability.multiDescription", {
                    duration: formatDuration(totalDuration, locale),

                    defaultValue: `Hệ thống sẽ tìm một khoảng thời gian liên tục đủ ${formatDuration(
                      totalDuration,

                      locale
                    )} cho toàn bộ dịch vụ đã chọn.`,
                  })
                : t("detail.availability.selectServicesFirst", {
                    defaultValue:
                      "Hãy chọn ít nhất một dịch vụ trước khi chọn lịch.",
                  })}
            </p>

            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                {t("detail.availability.date", {
                  defaultValue: "Ngày phục vụ",
                })}
              </label>

              <div className="relative max-w-xs">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="date"
                  min={format(new Date(), "yyyy-MM-dd")}
                  value={selectedDate}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin className="size-4" />

                {address}
              </div>

              {hasCoordinates && (
                <div className="flex items-center gap-2">
                  <LocateFixed className="size-4" />

                  {t("detail.availability.yourLocation")}
                </div>
              )}

              {hasAdministrativeArea && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />

                  {wardName || wardCode}

                  {", "}

                  {provinceName || provinceCode}
                </div>
              )}
            </div>

            <div className="mt-6">
              {selectedOptions.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">
                  <Layers3 className="mx-auto size-8 text-slate-300" />

                  <div className="mt-3 font-semibold text-slate-800">
                    {t("detail.availability.noServices.title", {
                      defaultValue: "Chưa chọn dịch vụ",
                    })}
                  </div>
                </div>
              )}

              {loadingSlots && selectedOptions.length > 0 && (
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

              {slotsError && selectedOptions.length > 0 && (
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

              {availability &&
                !loadingSlots &&
                !slotsError &&
                selectedOptions.length > 0 && (
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

              <div className="mt-5">
                <div className="text-xs text-slate-400">
                  {t("detail.booking.therapist")}
                </div>

                <div className="mt-1 font-semibold text-slate-900">
                  {therapistName}
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-900">
                    {t("detail.booking.services", {
                      defaultValue: "Dịch vụ đã chọn",
                    })}
                  </div>

                  <Badge variant="neutral">{selectedOptions.length}</Badge>
                </div>

                {selectedOptions.length === 0 ? (
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {t("detail.booking.noServices", {
                      defaultValue: "Chưa chọn dịch vụ.",
                    })}
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {selectedOptions.map((item) => (
                      <div
                        key={item.therapistServiceId}
                        className="rounded-xl bg-slate-50 p-3"
                      >
                        <div className="text-sm font-semibold text-slate-900">
                          {item.serviceName}
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-3 text-xs text-slate-500">
                          <span>
                            {item.label ||
                              formatDuration(item.durationMinutes, locale)}
                          </span>

                          <span className="font-semibold text-emerald-700">
                            {formatCurrency(item.price, locale)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">
                    {t("detail.booking.duration", {
                      defaultValue: "Tổng thời lượng",
                    })}
                  </span>

                  <strong className="text-slate-900">
                    {formatDuration(totalDuration, locale)}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">
                    {t("detail.booking.totalPrice", {
                      defaultValue: "Tổng dịch vụ",
                    })}
                  </span>

                  <strong className="text-lg text-emerald-700">
                    {formatCurrency(totalPrice, locale)}
                  </strong>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
                <div>
                  <div className="text-xs text-slate-400">
                    {t("detail.booking.date")}
                  </div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {selectedDate || "—"}
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
              </div>

              <Button
                size="lg"
                className="mt-6 w-full"
                disabled={
                  selectedOptions.length === 0 ||
                  !selectedDate ||
                  !selectedTime ||
                  !selectedSlotAvailable ||
                  fetchingSlots
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
