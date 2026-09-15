import Link from "next/link";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
} from "lucide-react";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";

import { Card } from "@/components/ui/Card";

import { formatCurrency, formatDuration } from "@/lib/utils";

import { BookingStatus, type ClientBooking } from "@/types/booking";
import { BookingRatingStatus } from "../ratings/BookingRatingStatus";

type BookingCardProps = {
  booking: ClientBooking;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",

    timeStyle: "short",
  }).format(date);
};

export const BookingCard = ({ booking }: BookingCardProps) => {
  return (
    <Link href={`/client/bookings/${booking.id}`} className="group block">
      <Card className="p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <h2 className="text-lg font-bold text-slate-950">
                {booking.serviceName}
              </h2>

              <BookingStatusBadge status={booking.status} />

              {booking.status === BookingStatus.COMPLETED && (
                <BookingRatingStatus bookingId={booking.id} />
              )}
            </div>

            <div className="mt-4 grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                {formatDateTime(booking.scheduledAt)}
              </div>

              <div className="flex items-start gap-2">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                {formatDuration(booking.durationMinutes)}
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                <span>{booking.address}</span>
              </div>

              <div className="flex items-start gap-2">
                <UserRound className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                {booking.therapist?.fullName || "Đang cập nhật"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-5 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div>
              <div className="text-xs text-slate-400">Tổng tiền</div>

              <div className="mt-1 whitespace-nowrap text-lg font-bold text-emerald-700">
                {formatCurrency(booking.totalAmount)}
              </div>
            </div>

            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
              <ArrowRight className="size-5" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
