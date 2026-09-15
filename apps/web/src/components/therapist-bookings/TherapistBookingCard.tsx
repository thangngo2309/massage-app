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

import { formatCurrency, formatDateTime, formatDuration } from "@/lib/utils";

import type { TherapistBooking } from "@/types/therapist-booking";

type Props = {
  booking: TherapistBooking;
};

export const TherapistBookingCard = ({ booking }: Props) => {
  return (
    <Link href={`/therapist/bookings/${booking.id}`} className="group block">
      <Card className="p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-bold text-slate-950">
                {booking.serviceName}
              </h3>

              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="mt-4 grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-emerald-700" />

                {booking.client?.fullName || "Khách hàng"}
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-emerald-700" />

                {formatDateTime(booking.scheduledAt)}
              </div>

              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-emerald-700" />

                {formatDuration(booking.durationMinutes)}
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                <span className="line-clamp-2">{booking.address}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-5 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div>
              <div className="text-xs text-slate-400">Giá dịch vụ</div>

              <div className="mt-1 whitespace-nowrap text-lg font-bold text-emerald-700">
                {formatCurrency(booking.servicePrice)}
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
