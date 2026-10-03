"use client";

import { useQuery } from "@tanstack/react-query";

import {
  LocateFixed,
  MapPin,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { toast } from "sonner";

import { ServiceCard } from "@/components/services/ServiceCard";

import { ServiceCardSkeleton } from "@/components/services/ServiceCardSkeleton";

import { ServicesEmptyState } from "@/components/services/ServicesEmptyState";

import { AutocompleteSelect } from "@/components/ui/AutocompleteSelect";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { Input } from "@/components/ui/Input";

import { PageContainer } from "@/components/ui/PageContainer";

import { getApiErrorMessage } from "@/lib/http";

import {
  getAdministrativeProvinces,
  getAdministrativeWards,
} from "@/lib/locations";

import { getClientServices } from "@/lib/services";

import { useClientBookingFlowStore } from "@/stores/client-booking-flow-store";

export default function ServicesPage() {
  const [search, setSearch] = useState("");

  const [locating, setLocating] = useState(false);

  const { t, i18n } = useTranslation("services");

  const { t: tCommon } = useTranslation("common");

  const language = (i18n.resolvedLanguage ?? i18n.language ?? "vi")
    .split("-")[0]
    .toLowerCase();

  const address = useClientBookingFlowStore((state) => state.address);

  const latitude = useClientBookingFlowStore((state) => state.latitude);

  const longitude = useClientBookingFlowStore((state) => state.longitude);

  const provinceCode = useClientBookingFlowStore((state) => state.provinceCode);

  const wardCode = useClientBookingFlowStore((state) => state.wardCode);

  const setLocation = useClientBookingFlowStore((state) => state.setLocation);

  const {
    data,

    isLoading,

    isError,

    error,

    refetch,

    isFetching,
  } = useQuery({
    queryKey: ["client-services", language],

    queryFn: () => getClientServices(language),
  });

  const provincesQuery = useQuery({
    queryKey: ["locations", "provinces", language],

    queryFn: getAdministrativeProvinces,
  });

  const wardsQuery = useQuery({
    queryKey: ["locations", "wards", provinceCode, language],

    queryFn: () => getAdministrativeWards(provinceCode),

    enabled: provinceCode.trim().length > 0,
  });

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

  const services = useMemo(() => {
    const items = data ?? [];

    const keyword = search.trim().toLocaleLowerCase(language);

    if (!keyword) {
      return items;
    }

    return items.filter((service) => {
      const name = service.name.toLocaleLowerCase(language);

      const description =
        service.description?.toLocaleLowerCase(language) ?? "";

      return name.includes(keyword) || description.includes(keyword);
    });
  }, [data, search, language]);

  const hasCoordinates = latitude !== null && longitude !== null;

  const hasAdministrativeArea =
    provinceCode.trim().length > 0 && wardCode.trim().length > 0;

  const hasAddress = address.trim().length >= 5;

  const locationReady = hasAddress && (hasCoordinates || hasAdministrativeArea);

  const handleProvinceChange = (value: string) => {
    const province = provinces.find((item) => item.code === value);

    setLocation({
      provinceCode: value,

      provinceName: province?.name ?? "",

      wardCode: "",

      wardName: "",
    });
  };

  const handleWardChange = (value: string) => {
    const ward = wards.find((item) => item.code === value);

    setLocation({
      wardCode: value,

      wardName: ward?.name ?? "",
    });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        t("location.unsupported", {
          defaultValue: "Trình duyệt không hỗ trợ định vị.",
        })
      );

      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,

          longitude: position.coords.longitude,
        });

        setLocating(false);

        toast.success(
          t("location.success", {
            defaultValue: "Đã xác định vị trí hiện tại.",
          })
        );
      },

      (locationError) => {
        setLocating(false);

        if (locationError.code === locationError.PERMISSION_DENIED) {
          toast.error(
            t("location.permissionDenied", {
              defaultValue: "Bạn chưa cấp quyền truy cập vị trí.",
            })
          );

          return;
        }

        toast.error(
          t("location.error", {
            defaultValue: "Không thể xác định vị trí hiện tại.",
          })
        );
      },

      {
        enableHighAccuracy: true,

        timeout: 15000,

        maximumAge: 30000,
      }
    );
  };

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="max-w-2xl">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles className="size-6" />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("hero.title")}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-emerald-50/80 sm:text-base">
            {t("hero.description")}
          </p>
        </div>
      </section>

      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-emerald-700" />

              <h2 className="text-lg font-bold text-slate-950">
                {t("bookingLocation.title", {
                  defaultValue: "Địa điểm phục vụ",
                })}
              </h2>
            </div>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {t("bookingLocation.description", {
                defaultValue:
                  "Nhập địa chỉ và khu vực để chúng tôi tìm kỹ thuật viên có thể phục vụ bạn.",
              })}
            </p>
          </div>

          {locationReady && (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="size-4" />

              {t("bookingLocation.ready", {
                defaultValue: "Đã đủ thông tin",
              })}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <Input
              id="booking-service-address"
              label={t("bookingLocation.address", {
                defaultValue: "Địa chỉ phục vụ",
              })}
              placeholder={t("bookingLocation.addressPlaceholder", {
                defaultValue: "Ví dụ: 117 Tố Hữu, Đà Nẵng",
              })}
              autoComplete="street-address"
              value={address}
              onChange={(event) =>
                setLocation({
                  address: event.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {t("bookingLocation.province", {
                defaultValue: "Tỉnh / thành phố",
              })}
            </label>

            <AutocompleteSelect
              id="booking-service-province"
              value={provinceCode}
              options={provinceOptions}
              loading={provincesQuery.isLoading}
              placeholder={t("bookingLocation.provincePlaceholder", {
                defaultValue: "Chọn tỉnh / thành phố",
              })}
              loadingText={t("bookingLocation.loading", {
                defaultValue: "Đang tải...",
              })}
              emptyText={t("bookingLocation.empty", {
                defaultValue: "Không tìm thấy dữ liệu",
              })}
              clearLabel={t("bookingLocation.clear", {
                defaultValue: "Xóa lựa chọn",
              })}
              startIcon={<MapPin className="size-5" />}
              onChange={handleProvinceChange}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {t("bookingLocation.ward", {
                defaultValue: "Phường / xã",
              })}
            </label>

            <AutocompleteSelect
              id="booking-service-ward"
              value={wardCode}
              options={wardOptions}
              loading={wardsQuery.isLoading}
              disabled={!provinceCode}
              placeholder={t("bookingLocation.wardPlaceholder", {
                defaultValue: "Chọn phường / xã",
              })}
              loadingText={t("bookingLocation.loading", {
                defaultValue: "Đang tải...",
              })}
              emptyText={t("bookingLocation.empty", {
                defaultValue: "Không tìm thấy dữ liệu",
              })}
              clearLabel={t("bookingLocation.clear", {
                defaultValue: "Xóa lựa chọn",
              })}
              startIcon={<MapPin className="size-5" />}
              onChange={handleWardChange}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            loading={locating}
            onClick={handleUseCurrentLocation}
          >
            <LocateFixed className="size-5" />

            {hasCoordinates
              ? t("bookingLocation.updateGps", {
                  defaultValue: "Cập nhật vị trí GPS",
                })
              : t("bookingLocation.useGps", {
                  defaultValue: "Sử dụng vị trí hiện tại",
                })}
          </Button>

          {hasCoordinates && (
            <div className="text-xs font-medium text-emerald-700">
              {latitude.toFixed(5)}
              {", "}
              {longitude.toFixed(5)}
            </div>
          )}
        </div>

        {!locationReady && (
          <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            {t("bookingLocation.required", {
              defaultValue:
                "Vui lòng nhập địa chỉ và chọn tỉnh/phường hoặc xác định vị trí GPS trước khi chọn dịch vụ.",
            })}
          </div>
        )}
      </Card>

      {locationReady && (
        <>
          <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("search.placeholder")}
                aria-label={t("search.placeholder")}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>

            <Card className="hidden items-center gap-3 px-4 py-3 lg:flex">
              <ShieldCheck className="size-5 shrink-0 text-emerald-700" />

              <div className="text-xs leading-5 text-slate-500">
                {t("verification.description")}
              </div>
            </Card>
          </section>

          <section className="mt-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
                  {t("list.title")}
                </h2>

                {!isLoading && !isError && (
                  <p className="mt-1 text-sm text-slate-500">
                    {t("list.count", {
                      count: services.length,
                    })}
                  </p>
                )}
              </div>
            </div>

            {isLoading && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({
                  length: 8,
                }).map((_, index) => (
                  <ServiceCardSkeleton key={index} />
                ))}
              </div>
            )}

            {isError && (
              <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <RefreshCcw className="size-7" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {t("error")}
                </h3>

                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  {getApiErrorMessage(error)}
                </p>

                <Button
                  type="button"
                  className="mt-5"
                  loading={isFetching}
                  onClick={() => void refetch()}
                >
                  <RefreshCcw className="size-4" />

                  {tCommon("retry")}
                </Button>
              </Card>
            )}

            {!isLoading && !isError && services.length === 0 && (
              <ServicesEmptyState />
            )}

            {!isLoading && !isError && services.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </PageContainer>
  );
}
