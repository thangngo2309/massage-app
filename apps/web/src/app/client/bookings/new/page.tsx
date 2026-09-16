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

import { toast } from "sonner";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { Input } from "@/components/ui/Input";

import { PageContainer } from "@/components/ui/PageContainer";

import { createClientBooking } from "@/lib/bookings";

import { getApiErrorMessage } from "@/lib/http";

import {
  checkTherapistAvailability,
  findMatchingTherapist,
} from "@/lib/therapist-search";

import { getClientService } from "@/lib/services";

import { formatCurrency, formatDuration } from "@/lib/utils";

import type { TherapistSearchQuery } from "@/types/therapist-search";

type BookingFormValues = {
  address: string;
  clientNote: string;
};

export default function NewBookingPage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const submittingRef = useRef(false);

  /**
   * =========================================
   * BOOKING PARAMS
   * =========================================
   */

  const therapistId = Number(searchParams.get("therapistId"));

  const serviceId = Number(searchParams.get("serviceId"));

  const serviceOptionId = Number(searchParams.get("serviceOptionId"));

  const date = searchParams.get("date") ?? "";

  const startTime = searchParams.get("startTime") ?? "";

  /**
   * =========================================
   * SEARCH LOCATION
   * =========================================
   *
   * Đây là vị trí đã dùng ở màn hình
   * tìm therapist.
   *
   * TUYỆT ĐỐI không thay đổi khi user
   * bấm "Dùng vị trí hiện tại" ở trang
   * booking.
   */

  const searchLatitudeParam = searchParams.get("latitude");

  const searchLongitudeParam = searchParams.get("longitude");

  const districtCode = searchParams.get("districtCode") ?? "";

  const provinceCode = searchParams.get("provinceCode") ?? "";

  const parseCoordinate = (value: string | null) => {
    if (value === null || value.trim() === "") {
      return undefined;
    }
  
    const number = Number(value);
  
    return Number.isFinite(number)
      ? number
      : undefined;
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

const hasSearchCoordinates =
  validLatitude &&
  validLongitude;

  const hasSearchDistrict = districtCode.trim().length > 0;

  /**
   * =========================================
   * BOOKING LOCATION
   * =========================================
   *
   * Đây mới là vị trí therapist sẽ đến
   * phục vụ khách.
   *
   * Có thể thay đổi độc lập với search
   * location.
   */

  const [bookingLatitude, setBookingLatitude] = useState<number | null>(
    searchLatitude ?? null
  );

  const [bookingLongitude, setBookingLongitude] = useState<number | null>(
    searchLongitude ?? null
  );

  const [locating, setLocating] = useState(false);

  /**
   * =========================================
   * VALID PARAMS
   * =========================================
   */

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

  /**
   * =========================================
   * SEARCH QUERY
   * =========================================
   *
   * Lưu ý:
   *
   * Query này chỉ dùng SEARCH LOCATION
   * lấy từ URL.
   *
   * bookingLatitude / bookingLongitude
   * KHÔNG nằm ở dependencies.
   *
   * Vì vậy user lấy GPS mới sẽ không làm
   * mất therapist đã chọn.
   */

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

  /**
   * =========================================
   * FORM
   * =========================================
   */

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

  /**
   * =========================================
   * LOAD SERVICE
   * =========================================
   */

  const {
    data: service,
    isLoading: loadingService,
    isError: serviceError,
  } = useQuery({
    queryKey: ["booking-service", serviceId],

    queryFn: () => getClientService(serviceId),

    enabled: validParams,
  });

  /**
   * =========================================
   * LOAD THERAPIST
   * =========================================
   *
   * Therapist được kiểm tra lại bằng
   * chính search condition ban đầu.
   */

  const {
    data: therapist,
    isLoading: loadingTherapist,
    isError: therapistError,
  } = useQuery({
    queryKey: ["booking-therapist", therapistId, therapistSearchQuery],

    queryFn: () => findMatchingTherapist(therapistId, therapistSearchQuery),

    enabled: validParams,
  });

  /**
   * =========================================
   * SELECTED OPTION
   * =========================================
   */

  const selectedOption = service?.options?.find(
    (option) => option.id === serviceOptionId
  );

  /**
   * =========================================
   * CREATE BOOKING MUTATION
   * =========================================
   */

  const createMutation = useMutation({
    mutationFn: createClientBooking,
  });

  /**
   * =========================================
   * CURRENT LOCATION
   * =========================================
   *
   * Chỉ update BOOKING LOCATION.
   *
   * Không update therapistSearchQuery.
   */

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị.");

      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBookingLatitude(position.coords.latitude);

        setBookingLongitude(position.coords.longitude);

        setLocating(false);

        toast.success("Đã lấy vị trí phục vụ.");
      },

      (error) => {
        setLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Bạn chưa cho phép trình duyệt truy cập vị trí.");

          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error("Không xác định được vị trí hiện tại.");

          return;
        }

        if (error.code === error.TIMEOUT) {
          toast.error("Quá thời gian lấy vị trí. Vui lòng thử lại.");

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

  /**
   * =========================================
   * SUBMIT
   * =========================================
   */

  const onSubmit = async (values: BookingFormValues) => {
    if (!service) {
      toast.error("Không tìm thấy dịch vụ.");

      return;
    }

    if (!selectedOption) {
      toast.error("Không tìm thấy liệu trình.");

      return;
    }

    if (!therapist) {
      toast.error("Kỹ thuật viên không còn khả dụng.");

      return;
    }

    /**
     * Booking vẫn sử dụng lat/lng.
     *
     * Nếu đã search bằng GPS thì mặc định
     * booking đã có coordinate.
     *
     * Nếu search bằng districtCode thì user
     * cần bấm "Dùng vị trí hiện tại".
     */

    if (bookingLatitude === null || bookingLongitude === null) {
      toast.error("Vui lòng xác định vị trí phục vụ.");
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
        toast.error(
          availability.reason ||
            "Khung giờ này không còn khả dụng. Vui lòng chọn lại."
        );

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
      });

      toast.success("Đặt lịch thành công.");

      router.replace(`/client/bookings/${booking.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  };

  /**
   * =========================================
   * INVALID PARAMS
   * =========================================
   */

  if (!validParams) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <MapPin className="size-10 text-slate-300" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            Thông tin đặt lịch không hợp lệ
          </h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Thông tin dịch vụ, kỹ thuật viên, thời gian hoặc khu vực đã bị
            thiếu.
          </p>

          <Button
            type="button"
            className="mt-6"
            onClick={() => router.push("/client/services")}
          >
            Chọn lại dịch vụ
          </Button>
        </Card>
      </PageContainer>
    );
  }

  /**
   * =========================================
   * LOADING
   * =========================================
   */

  if (loadingService || loadingTherapist) {
    return (
      <PageContainer className="py-5 sm:py-6 lg:py-8">
        <div className="animate-pulse">
          <div className="h-8 w-56 rounded bg-slate-100" />

          <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />

          <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="h-[520px] rounded-2xl bg-slate-100" />

            <div className="h-[460px] rounded-2xl bg-slate-100" />
          </div>
        </div>
      </PageContainer>
    );
  }

  /**
   * =========================================
   * SERVICE / THERAPIST NOT AVAILABLE
   * =========================================
   */

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
            Không thể tiếp tục đặt lịch
          </h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Dịch vụ hoặc kỹ thuật viên không còn phù hợp với điều kiện đã chọn.
          </p>

          <Button
            type="button"
            className="mt-6"
            onClick={() => router.push("/client/services")}
          >
            Chọn lại
          </Button>
        </Card>
      </PageContainer>
    );
  }

  /**
   * =========================================
   * PAGE
   * =========================================
   */

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Xác nhận đặt lịch
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Kiểm tra lại dịch vụ, kỹ thuật viên và nhập địa chỉ phục vụ trước khi
          gửi booking.
        </p>
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/*
         * =====================================
         * LEFT FORM
         * =====================================
         */}

        <form
          id="client-booking-form"
          onSubmit={handleSubmit(onSubmit)}
          className="min-w-0"
        >
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              Địa chỉ phục vụ
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Đây là địa điểm kỹ thuật viên sẽ đến thực hiện dịch vụ.
            </p>

            <div className="mt-6 space-y-6">
              {/*
               * ADDRESS
               */}

              <Input
                id="address"
                label="Địa chỉ chi tiết"
                placeholder="Ví dụ: 20 Quang Trung, Hải Châu, Đà Nẵng"
                autoComplete="street-address"
                error={errors.address?.message}
                {...register("address", {
                  required: "Vui lòng nhập địa chỉ phục vụ.",

                  minLength: {
                    value: 5,

                    message: "Địa chỉ quá ngắn.",
                  },

                  maxLength: {
                    value: 500,

                    message: "Địa chỉ không được vượt quá 500 ký tự.",
                  },
                })}
              />

              {/*
               * LOCATION
               */}

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Vị trí phục vụ
                </label>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Tọa độ giúp hệ thống và kỹ thuật viên xác định chính xác nơi
                  phục vụ.
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
                      ? "Cập nhật vị trí"
                      : "Dùng vị trí hiện tại"}
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
                    Vui lòng xác định vị trí trước khi đặt lịch.
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-emerald-600">
                    Đã xác định vị trí phục vụ.
                  </div>
                )}
              </div>

              {/*
               * NOTE
               */}

              <div>
                <label
                  htmlFor="clientNote"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Ghi chú cho kỹ thuật viên
                </label>

                <textarea
                  id="clientNote"
                  rows={5}
                  placeholder="Ví dụ: Vui lòng gọi trước khi đến..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
                  {...register("clientNote", {
                    maxLength: {
                      value: 1000,

                      message: "Ghi chú không được vượt quá 1000 ký tự.",
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

          {/*
           * MOBILE/TABLET SUBMIT
           */}

          <Button
            type="submit"
            size="lg"
            loading={isSubmitting || createMutation.isPending}
            className="mt-5 w-full xl:hidden"
          >
            Xác nhận đặt lịch
          </Button>
        </form>

        {/*
         * =====================================
         * BOOKING SUMMARY
         * =====================================
         */}

        <aside className="min-w-0">
          <div className="xl:sticky xl:top-24">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                Thông tin booking
              </h2>

              <div className="mt-6 space-y-5">
                {/*
                 * THERAPIST
                 */}

                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <UserRound className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs text-slate-400">Kỹ thuật viên</div>

                    <div className="mt-1 font-semibold text-slate-900">
                      {therapist.fullName}
                    </div>
                  </div>
                </div>

                {/*
                 * SERVICE
                 */}

                <div className="border-t border-slate-100 pt-5">
                  <div className="font-bold text-slate-900">{service.name}</div>

                  <div className="mt-1 text-sm text-slate-500">
                    {selectedOption.label}
                  </div>
                </div>

                {/*
                 * DATE/TIME
                 */}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CalendarDays className="size-4" />
                      Ngày
                    </div>

                    <div className="mt-1 font-semibold text-slate-900">
                      {date}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock3 className="size-4" />
                      Bắt đầu
                    </div>

                    <div className="mt-1 font-semibold text-slate-900">
                      {startTime}
                    </div>
                  </div>
                </div>

                {/*
                 * PRICE
                 */}

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Thời lượng</span>

                    <strong className="text-slate-900">
                      {formatDuration(therapist.durationMinutes)}
                    </strong>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Giá dịch vụ</span>

                    <strong className="text-lg text-emerald-700">
                      {formatCurrency(therapist.price)}
                    </strong>
                  </div>
                </div>

                {/*
                 * NOTE
                 */}

                <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />

                  <p className="text-xs leading-5 text-emerald-800">
                    Hệ thống sẽ kiểm tra lại lịch khả dụng ngay trước khi tạo
                    booking.
                  </p>
                </div>
              </div>

              {/*
               * DESKTOP SUBMIT
               *
               * form attribute giúp submit
               * form bên trái mà không cần
               * document.querySelector().
               */}

              <Button
                type="submit"
                form="client-booking-form"
                size="lg"
                loading={isSubmitting || createMutation.isPending}
                className="mt-6 hidden w-full xl:flex"
              >
                Xác nhận đặt lịch
              </Button>

              <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                Sau khi gửi, booking sẽ chờ kỹ thuật viên xác nhận.
              </p>
            </Card>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
