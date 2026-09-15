"use client";

import { useQuery } from "@tanstack/react-query";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Phone,
  RefreshCcw,
  UserRound,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";

import { BookingTimeline } from "@/components/bookings/BookingTimeline";

import { TherapistBookingActions } from "@/components/therapist-bookings/TherapistBookingActions";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import { getApiErrorMessage } from "@/lib/http";

import { getTherapistBooking } from "@/lib/therapist-bookings";

import { formatCurrency, formatDateTime, formatDuration } from "@/lib/utils";

export default function TherapistBookingDetailPage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const bookingId = Number(params.id);

  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["therapist-booking", bookingId],

    queryFn: () => getTherapistBooking(bookingId),

    enabled: Number.isInteger(bookingId) && bookingId > 0,
  });

  if (isLoading) {
    return (
      <PageContainer className="py-8">
        <div className="grid animate-pulse gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[520px] rounded-2xl bg-slate-100" />

          <div className="h-96 rounded-2xl bg-slate-100" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !booking) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <RefreshCcw className="size-9 text-red-500" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            Không thể tải booking
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {getApiErrorMessage(error)}
          </p>

          <Button
            className="mt-5"
            loading={isFetching}
            onClick={() => void refetch()}
          >
            Thử lại
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <button
        type="button"
        onClick={() => router.push("/therapist/bookings")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft className="size-4" />
        Booking của tôi
      </button>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Booking #{booking.id}
          </h1>

          <p className="mt-1 text-sm text-slate-500">{booking.serviceName}</p>
        </div>

        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              Thông tin khách hàng
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <UserRound className="mt-0.5 size-5 text-emerald-700" />

                <div>
                  <div className="text-xs text-slate-400">Khách hàng</div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {booking.client?.fullName || "Khách hàng"}
                  </div>
                </div>
              </div>

              {booking.client?.phone && (
                <div className="flex gap-3">
                  <Phone className="mt-0.5 size-5 text-emerald-700" />

                  <div>
                    <div className="text-xs text-slate-400">Số điện thoại</div>

                    <div className="mt-1 font-semibold text-slate-900">
                      {booking.client.phone}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              Thông tin lịch hẹn
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 size-5 text-emerald-700" />

                <div>
                  <div className="text-xs text-slate-400">Thời gian</div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {formatDateTime(booking.scheduledAt)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock3 className="mt-0.5 size-5 text-emerald-700" />

                <div>
                  <div className="text-xs text-slate-400">Thời lượng</div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {formatDuration(booking.durationMinutes)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 sm:col-span-2">
                <MapPin className="mt-0.5 size-5 shrink-0 text-emerald-700" />

                <div>
                  <div className="text-xs text-slate-400">Địa chỉ phục vụ</div>

                  <div className="mt-1 font-semibold text-slate-900">
                    {booking.address}
                  </div>
                </div>
              </div>
            </div>

            {booking.clientNote && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="text-xs text-slate-400">Ghi chú của khách</div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {booking.clientNote}
                </p>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">Tiến trình</h2>

            <div className="mt-6">
              <BookingTimeline histories={booking.statusHistories ?? []} />
            </div>
          </Card>
        </div>

        <aside>
          <div className="space-y-5 xl:sticky xl:top-24">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">Dịch vụ</h2>

              <div className="mt-5">
                <div className="font-bold text-slate-900">
                  {booking.serviceName}
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-slate-500">Thời lượng</span>

                    <strong>{formatDuration(booking.durationMinutes)}</strong>
                  </div>

                  <div className="mt-3 flex justify-between gap-4">
                    <span className="text-sm text-slate-500">Giá dịch vụ</span>

                    <strong className="text-lg text-emerald-700">
                      {formatCurrency(booking.servicePrice)}
                    </strong>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">Thao tác</h2>

              <div className="mt-5">
                <TherapistBookingActions
                  bookingId={booking.id}
                  status={booking.status}
                />
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
