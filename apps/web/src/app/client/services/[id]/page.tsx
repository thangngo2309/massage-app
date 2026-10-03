"use client";

import { useQuery } from "@tanstack/react-query";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LocateFixed,
  MapPin,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";

import Link from "next/link";

import { useParams } from "next/navigation";

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

import { formatCurrency, formatDuration } from "@/lib/utils";

import { useClientBookingFlowStore } from "@/stores/client-booking-flow-store";

import type {
  TherapistSearchQuery,
  TherapistSearchSort,
} from "@/types/therapist-search";

export default function ServiceDetailPage() {
  const params = useParams<{
    id: string;
  }>();

  const { t, i18n } = useTranslation("services");

  const { t: tTherapists } = useTranslation("therapists");

  const { t: tCommon } = useTranslation("common");

  const serviceId = Number(params.id);

  const language = (i18n.resolvedLanguage ?? i18n.language ?? "vi")
    .split("-")[0]
    .toLowerCase();

  const locale = language === "en" ? "en-US" : "vi-VN";

  /**
   * ==========================================================
   * BOOKING FLOW LOCATION
   * ==========================================================
   */

  const address = useClientBookingFlowStore((state) => state.address);

  const latitude = useClientBookingFlowStore((state) => state.latitude);

  const longitude = useClientBookingFlowStore((state) => state.longitude);

  const provinceCode = useClientBookingFlowStore((state) => state.provinceCode);

  const provinceName = useClientBookingFlowStore((state) => state.provinceName);

  const wardCode = useClientBookingFlowStore((state) => state.wardCode);

  const wardName = useClientBookingFlowStore((state) => state.wardName);

  const setService = useClientBookingFlowStore((state) => state.setService);

  const validServiceId = Number.isInteger(serviceId) && serviceId > 0;

  const hasCoordinates = latitude !== null && longitude !== null;

  const hasAdministrativeArea =
    provinceCode.trim().length > 0 && wardCode.trim().length > 0;

  const hasAddress = address.trim().length >= 5;

  const locationReady = hasAddress && (hasCoordinates || hasAdministrativeArea);

  /**
   * Khi vào Service Detail, Service này trở thành
   * Service hiện tại của booking flow.
   *
   * setService() trong store chỉ reset selection phía sau
   * khi service thực sự thay đổi.
   */
  useEffect(() => {
    if (validServiceId) {
      setService(serviceId);
    }
  }, [validServiceId, serviceId, setService]);

  /**
   * ==========================================================
   * SERVICE
   * ==========================================================
   */

  const {
    data: service,

    isLoading: loadingService,

    isError: serviceError,

    error: serviceQueryError,

    refetch: refetchService,

    isFetching: fetchingService,
  } = useQuery({
    queryKey: ["client-service", serviceId, language],

    queryFn: () => getClientService(serviceId, language),

    enabled: validServiceId,
  });

  const activeOptions = useMemo(
    () => service?.options?.filter((option) => option.isActive) ?? [],
    [service?.options]
  );

  const reference = useMemo(() => {
    if (!activeOptions.length) {
      return null;
    }

    const prices = activeOptions.map((item) => Number(item.defaultPrice));

    const durations = activeOptions.map((item) => Number(item.durationMinutes));

    return {
      minPrice: Math.min(...prices),

      maxPrice: Math.max(...prices),

      minDuration: Math.min(...durations),

      maxDuration: Math.max(...durations),
    };
  }, [activeOptions]);

  /**
   * ==========================================================
   * THERAPIST SEARCH
   * ==========================================================
   */

  const [sortBy, setSortBy] = useState<TherapistSearchSort>(
    hasCoordinates ? "distance" : "rating"
  );

  const [page, setPage] = useState(1);

  /**
   * Nếu khách bỏ GPS nhưng sort hiện tại đang là distance,
   * chuyển về rating.
   */
  useEffect(() => {
    if (!hasCoordinates && sortBy === "distance") {
      setSortBy("rating");

      setPage(1);
    }
  }, [hasCoordinates, sortBy]);

  const therapistSearchQuery = useMemo<TherapistSearchQuery | null>(() => {
    if (!validServiceId || !locationReady) {
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

      page,

      limit: 12,
    };
  }, [
    validServiceId,
    locationReady,
    serviceId,
    sortBy,
    hasCoordinates,
    latitude,
    longitude,
    hasAdministrativeArea,
    provinceCode,
    wardCode,
    page,
  ]);

  const {
    data: therapistResult,

    isLoading: loadingTherapists,

    isFetching: fetchingTherapists,

    isError: therapistsError,

    error: therapistsQueryError,

    refetch: refetchTherapists,
  } = useQuery({
    queryKey: ["therapist-search", therapistSearchQuery, language],

    queryFn: () => searchTherapists(therapistSearchQuery!, language),

    enabled: therapistSearchQuery !== null,
  });

  const therapists = therapistResult?.items ?? [];

  /**
   * ==========================================================
   * INVALID SERVICE
   * ==========================================================
   */

  if (!validServiceId) {
    return (
      <PageContainer className="py-8">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-bold text-slate-950">
            {t("detail.invalid", {
              defaultValue: "Dịch vụ không hợp lệ",
            })}
          </h1>

          <Link href="/client/services" className="mt-5 inline-flex">
            <Button>
              {t("detail.back", {
                defaultValue: "Quay lại dịch vụ",
              })}
            </Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  /**
   * ==========================================================
   * SERVICE LOADING
   * ==========================================================
   */

  if (loadingService) {
    return (
      <PageContainer className="py-5 sm:py-6 lg:py-8">
        <div className="animate-pulse">
          <div className="h-5 w-36 rounded bg-slate-100" />

          <div className="mt-6 aspect-[16/6] rounded-[28px] bg-slate-100" />

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <TherapistSearchSkeleton key={index} />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  /**
   * ==========================================================
   * SERVICE ERROR
   * ==========================================================
   */

  if (serviceError || !service) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <RefreshCcw className="size-8 text-red-500" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t("detail.notFound", {
              defaultValue: "Không thể tải dịch vụ",
            })}
          </h1>

          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            {getApiErrorMessage(serviceQueryError)}
          </p>

          <Button
            className="mt-5"
            loading={fetchingService}
            onClick={() => void refetchService()}
          >
            <RefreshCcw className="size-4" />

            {tCommon("retry", {
              defaultValue: "Thử lại",
            })}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <Link
        href="/client/services"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
      >
        <ArrowLeft className="size-4" />

        {t("detail.back", {
          defaultValue: "Quay lại dịch vụ",
        })}
      </Link>

      {/* ======================================================
          SERVICE HERO
      ====================================================== */}

      <section className="mt-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 text-white">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="size-6" />
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              {service.name}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
              {service.description ||
                t("detail.defaultDescription", {
                  defaultValue:
                    "Dịch vụ chăm sóc tại nhà với kỹ thuật viên phù hợp khu vực của bạn.",
                })}
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-emerald-50/90">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5" />

                {t("detail.verifiedTherapists", {
                  defaultValue: "Kỹ thuật viên đã xác minh",
                })}
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5" />

                {t("detail.flexibleBooking", {
                  defaultValue: "Linh hoạt thời gian đặt lịch",
                })}
              </div>
            </div>
          </div>

          <div className="min-h-56 bg-white/5">
            {service.imageUrl ? (
              <img
                src={service.imageUrl}
                alt={service.name}
                className="h-full min-h-56 w-full object-cover lg:min-h-full"
              />
            ) : (
              <div className="flex h-full min-h-56 items-center justify-center">
                <Sparkles className="size-20 text-white/20" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ======================================================
          SERVICE INFORMATION
      ====================================================== */}

      <section className="mt-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="p-5 sm:p-6">
            <h2 className="text-xl font-bold text-slate-950">
              {t("detail.about.title", {
                defaultValue: "Thông tin dịch vụ",
              })}
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              {t("detail.about.description", {
                defaultValue:
                  "Mỗi kỹ thuật viên có thể cung cấp các thời lượng và mức giá khác nhau. Bạn sẽ chọn gói cụ thể sau khi chọn kỹ thuật viên.",
              })}
            </p>

            {reference && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Clock3 className="size-5" />
                  </div>

                  <div className="mt-4 text-xs text-slate-400">
                    {t("detail.referenceDuration", {
                      defaultValue: "Thời lượng tham khảo",
                    })}
                  </div>

                  <div className="mt-1 font-bold text-slate-950">
                    {reference.minDuration === reference.maxDuration
                      ? formatDuration(reference.minDuration, locale)
                      : `${formatDuration(
                          reference.minDuration,
                          locale
                        )} – ${formatDuration(reference.maxDuration, locale)}`}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <WalletCards className="size-5" />
                  </div>

                  <div className="mt-4 text-xs text-slate-400">
                    {t("detail.referencePrice", {
                      defaultValue: "Giá tham khảo",
                    })}
                  </div>

                  <div className="mt-1 font-bold text-emerald-700">
                    {reference.minPrice === reference.maxPrice
                      ? formatCurrency(reference.minPrice, locale)
                      : `${formatCurrency(
                          reference.minPrice,
                          locale
                        )} – ${formatCurrency(reference.maxPrice, locale)}`}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-emerald-700" />

              <h2 className="font-bold text-slate-950">
                {t("detail.location.title", {
                  defaultValue: "Địa điểm phục vụ",
                })}
              </h2>
            </div>

            <div className="mt-4 text-sm font-semibold leading-6 text-slate-900">
              {address ||
                t("detail.location.missing", {
                  defaultValue: "Chưa thiết lập địa chỉ",
                })}
            </div>

            {hasAdministrativeArea && (
              <div className="mt-2 text-sm text-slate-500">
                {wardName || wardCode}
                {", "}
                {provinceName || provinceCode}
              </div>
            )}

            {hasCoordinates && (
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700">
                <LocateFixed className="size-4" />

                {latitude.toFixed(5)}
                {", "}
                {longitude.toFixed(5)}
              </div>
            )}

            <Link href="/client/services" className="mt-5 block">
              <Button variant="outline" className="w-full">
                {t("detail.location.change", {
                  defaultValue: "Đổi địa điểm",
                })}
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* ======================================================
          THERAPISTS
      ====================================================== */}

      <section className="mt-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UsersRound className="size-6 text-emerald-700" />

              <h2 className="text-2xl font-bold text-slate-950">
                {t("detail.therapists.title", {
                  defaultValue: "Kỹ thuật viên phù hợp",
                })}
              </h2>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {t("detail.therapists.description", {
                defaultValue:
                  "Các kỹ thuật viên dưới đây đang cung cấp dịch vụ này và có thể phục vụ khu vực bạn đã chọn.",
              })}
            </p>

            {therapistResult && (
              <div className="mt-2 text-sm font-medium text-emerald-700">
                {t("detail.therapists.count", {
                  count: therapistResult.pagination.total,

                  defaultValue: `${therapistResult.pagination.total} kỹ thuật viên`,
                })}
              </div>
            )}
          </div>

          {locationReady && (
            <div className="w-full sm:w-auto">
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                {tTherapists("search.form.sort", {
                  defaultValue: "Sắp xếp",
                })}
              </label>

              <div className="relative">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value as TherapistSearchSort);

                    setPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 sm:min-w-[190px]"
                >
                  <option value="rating">
                    {tTherapists("search.sort.rating", {
                      defaultValue: "Đánh giá cao",
                    })}
                  </option>

                  <option value="price">
                    {tTherapists("search.sort.price", {
                      defaultValue: "Giá thấp",
                    })}
                  </option>

                  <option value="distance" disabled={!hasCoordinates}>
                    {tTherapists("search.sort.distance", {
                      defaultValue: "Gần nhất",
                    })}
                  </option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* LOCATION MISSING */}

        {!locationReady && (
          <Card className="mt-6 flex flex-col items-center px-6 py-14 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <MapPin className="size-7" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-950">
              {t("detail.therapists.locationRequired.title", {
                defaultValue: "Cần địa điểm phục vụ",
              })}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {t("detail.therapists.locationRequired.description", {
                defaultValue:
                  "Hãy nhập địa chỉ và chọn tỉnh/phường hoặc xác định vị trí để tìm kỹ thuật viên phù hợp.",
              })}
            </p>

            <Link href="/client/services" className="mt-5">
              <Button>
                <MapPin className="size-4" />

                {t("detail.therapists.locationRequired.action", {
                  defaultValue: "Thiết lập địa điểm",
                })}
              </Button>
            </Link>
          </Card>
        )}

        {/* LOADING */}

        {locationReady && loadingTherapists && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <TherapistSearchSkeleton key={index} />
            ))}
          </div>
        )}

        {/* ERROR */}

        {locationReady && therapistsError && (
          <Card className="mt-6 flex flex-col items-center px-6 py-14 text-center">
            <RefreshCcw className="size-8 text-red-500" />

            <h3 className="mt-4 font-bold text-slate-900">
              {t("detail.therapists.error.title", {
                defaultValue: "Không thể tải kỹ thuật viên",
              })}
            </h3>

            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              {getApiErrorMessage(therapistsQueryError)}
            </p>

            <Button
              className="mt-5"
              loading={fetchingTherapists}
              onClick={() => void refetchTherapists()}
            >
              <RefreshCcw className="size-4" />

              {tCommon("retry", {
                defaultValue: "Thử lại",
              })}
            </Button>
          </Card>
        )}

        {/* EMPTY */}

        {locationReady &&
          !loadingTherapists &&
          !therapistsError &&
          therapists.length === 0 && (
            <Card className="mt-6 flex flex-col items-center px-6 py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Search className="size-7" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-950">
                {t("detail.therapists.empty.title", {
                  defaultValue: "Chưa tìm thấy kỹ thuật viên phù hợp",
                })}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {t("detail.therapists.empty.description", {
                  defaultValue:
                    "Hiện chưa có kỹ thuật viên phù hợp với dịch vụ và khu vực này. Bạn có thể thử đổi địa điểm.",
                })}
              </p>
            </Card>
          )}

        {/* RESULTS */}

        {locationReady &&
          !loadingTherapists &&
          !therapistsError &&
          therapists.length > 0 && (
            <>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {therapists.map((therapist) => (
                  <TherapistSearchCard
                    key={therapist.therapistId}
                    therapist={therapist}
                    serviceId={serviceId}
                  />
                ))}
              </div>

              {therapistResult && therapistResult.pagination.totalPages > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page <= 1 || fetchingTherapists}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    {tTherapists("pagination.previous", {
                      defaultValue: "Trang trước",
                    })}
                  </Button>

                  <div className="text-sm text-slate-500">
                    {tTherapists("pagination.page", {
                      page,

                      totalPages: therapistResult.pagination.totalPages,

                      defaultValue: `Trang ${page} / ${therapistResult.pagination.totalPages}`,
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      page >= therapistResult.pagination.totalPages ||
                      fetchingTherapists
                    }
                    onClick={() => setPage((current) => current + 1)}
                  >
                    {tTherapists("pagination.next", {
                      defaultValue: "Trang sau",
                    })}
                  </Button>
                </div>
              )}
            </>
          )}
      </section>
    </PageContainer>
  );
}
