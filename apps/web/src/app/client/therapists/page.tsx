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

import { toast } from "sonner";

import { TherapistSearchCard } from "@/components/therapists/TherapistSearchCard";

import { TherapistSearchSkeleton } from "@/components/therapists/TherapistSearchSkeleton";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import { getApiErrorMessage } from "@/lib/http";

import { searchTherapists } from "@/lib/therapist-search";

import type {
  TherapistSearchQuery,
  TherapistSearchSort,
} from "@/types/therapist-search";

export default function TherapistsPage() {
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

  const [latitude, setLatitude] = useState<number | null>(
    searchParams.get("latitude") ? Number(searchParams.get("latitude")) : null
  );

  const [longitude, setLongitude] = useState<number | null>(
    searchParams.get("longitude") ? Number(searchParams.get("longitude")) : null
  );

  const [districtCode, setDistrictCode] = useState(
    searchParams.get("districtCode") ?? ""
  );

  const [locating, setLocating] = useState(false);

  const [page, setPage] = useState(1);

  const [submittedQuery, setSubmittedQuery] =
    useState<TherapistSearchQuery | null>(null);

  const validService =
    Number.isInteger(serviceId) &&
    serviceId > 0 &&
    Number.isInteger(serviceOptionId) &&
    serviceOptionId > 0;

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["therapist-search", submittedQuery, page],

    queryFn: () =>
      searchTherapists({
        ...submittedQuery!,

        page,

        limit: 12,
      }),

    enabled: submittedQuery !== null,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const hasCoordinates = latitude !== null && longitude !== null;

  const hasDistrict = districtCode.trim().length > 0;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị.");

      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);

        setLongitude(position.coords.longitude);

        setDistrictCode("");

        setLocating(false);

        toast.success("Đã lấy vị trí hiện tại.");
      },

      (error) => {
        setLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Bạn chưa cho phép trình duyệt truy cập vị trí.");

          return;
        }

        toast.error("Không thể lấy vị trí hiện tại.");
      },

      {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 30000,
      }
    );
  };

  const handleDistrictChange = (value: string) => {
    setDistrictCode(value);

    if (value.trim()) {
      setLatitude(null);
      setLongitude(null);

      if (sortBy === "distance") {
        setSortBy("rating");
      }
    }
  };

  const handleSearch = () => {
    if (!validService) {
      toast.error("Dịch vụ không hợp lệ.");

      return;
    }

    if (!date) {
      toast.error("Vui lòng chọn ngày.");

      return;
    }

    if (!startTime) {
      toast.error("Vui lòng chọn giờ bắt đầu.");

      return;
    }

    if (!hasCoordinates && !hasDistrict) {
      toast.error("Vui lòng dùng vị trí hiện tại hoặc chọn khu vực.");

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
            districtCode: districtCode.trim(),
          }),
    });
  };

  if (!validService) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <Search className="size-10 text-slate-300" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            Hãy chọn dịch vụ trước
          </h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Bạn cần chọn dịch vụ và liệu trình trước khi tìm kỹ thuật viên.
          </p>

          <Link href="/client/services" className="mt-6">
            <Button>Chọn dịch vụ</Button>
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
            Tìm kỹ thuật viên
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-emerald-50/80 sm:text-base">
            Chọn thời gian và vị trí, hệ thống sẽ tìm những kỹ thuật viên phù
            hợp và đang khả dụng.
          </p>
        </div>
      </section>

      <Card className="mt-6 p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Ngày
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
              Giờ bắt đầu
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
              Sắp xếp
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
                <option value="rating">Đánh giá tốt nhất</option>

                <option value="price">Giá thấp nhất</option>

                <option value="distance" disabled={!hasCoordinates}>
                  Gần nhất
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Vị trí
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

              {hasCoordinates ? "Đã lấy vị trí" : "Vị trí hiện tại"}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-lg">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Hoặc tìm theo quận/huyện
            </label>

            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                value={districtCode}
                onChange={(event) => handleDistrictChange(event.target.value)}
                placeholder="Nhập districtCode để test"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>

            {hasCoordinates && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <LocateFixed className="size-3.5" />
                {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
              </div>
            )}

            {!hasCoordinates && hasDistrict && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <MapPin className="size-3.5" />
                Khu vực: {districtCode}
              </div>
            )}
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full lg:w-auto"
            disabled={!date || !startTime || (!hasCoordinates && !hasDistrict)}
            onClick={handleSearch}
          >
            <Search className="size-5" />
            Tìm kiếm
          </Button>
        </div>
      </Card>

      {!submittedQuery && (
        <Card className="mt-6 flex flex-col items-center justify-center px-6 py-16 text-center">
          <Search className="size-10 text-emerald-300" />

          <h2 className="mt-5 text-lg font-bold text-slate-900">
            Bắt đầu tìm kiếm
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Chọn ngày, giờ và vị trí để tìm kỹ thuật viên phù hợp.
          </p>
        </Card>
      )}

      {submittedQuery && (
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
                Kỹ thuật viên phù hợp
              </h2>

              {data && (
                <p className="mt-1 text-sm text-slate-500">
                  Tìm thấy{" "}
                  <span className="font-semibold text-slate-700">
                    {data.pagination.total}
                  </span>{" "}
                  kỹ thuật viên
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
                Không thể tìm kỹ thuật viên
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
                Thử lại
              </Button>
            </Card>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <Card className="flex flex-col items-center px-6 py-16 text-center">
              <Search className="size-9 text-slate-300" />

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                Chưa tìm thấy kỹ thuật viên
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Không có kỹ thuật viên phù hợp tại thời gian và vị trí đã chọn.
                Hãy thử khung giờ khác.
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
                    type="button"
                    variant="outline"
                    disabled={page <= 1 || isFetching}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    Trước
                  </Button>

                  <div className="text-sm text-slate-500">
                    Trang <strong className="text-slate-900">{page}</strong> /{" "}
                    {data.pagination.totalPages}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={page >= data.pagination.totalPages || isFetching}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Sau
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
