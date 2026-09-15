"use client";

import { useQuery } from "@tanstack/react-query";

import { CheckCircle2, Star } from "lucide-react";

import { getRatingByBooking } from "@/lib/ratings";

type Props = {
  bookingId: number;
};

export const BookingRatingStatus = ({ bookingId }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["booking-rating", bookingId],

    queryFn: () => getRatingByBooking(bookingId),

    enabled: bookingId > 0,

    retry: false,
  });

  if (isLoading) {
    return <div className="mt-3 h-5 w-28 animate-pulse rounded bg-slate-100" />;
  }

  if (data) {
    return (
      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="size-4" />
        Đã đánh giá
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
      <Star className="size-4" />
      Chưa đánh giá
    </div>
  );
};
