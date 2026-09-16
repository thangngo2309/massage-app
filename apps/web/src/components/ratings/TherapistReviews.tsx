"use client";

import { useQuery } from "@tanstack/react-query";

import { MessageSquareText, Star } from "lucide-react";

import { Card } from "@/components/ui/Card";

import { getTherapistRatings } from "@/lib/ratings";

type Props = {
  therapistId: number;

  ratingAverage?: number;

  ratingCount?: number;
};

export const TherapistReviews = ({
  therapistId,
  ratingAverage = 0,
  ratingCount = 0,
}: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["therapist-ratings", therapistId],
    queryFn: () => getTherapistRatings(therapistId, 1, 5),
    enabled: therapistId > 0,
  });

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            Đánh giá từ khách hàng
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Trải nghiệm thực tế từ những khách hàng đã sử dụng dịch vụ.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3">
          <Star className="size-5 fill-amber-400 text-amber-400" />

          <strong className="text-lg text-slate-950">
            {Number(ratingAverage).toFixed(1)}
          </strong>

          <span className="text-sm text-slate-500">({ratingCount})</span>
        </div>
      </div>

      {isLoading && (
        <div className="mt-6 space-y-4">
          {Array.from({
            length: 3,
          }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
          Chưa thể tải danh sách đánh giá.
        </div>
      )}

      {!isLoading && !isError && !data?.items?.length && (
        <div className="mt-6 flex flex-col items-center rounded-2xl bg-slate-50 px-5 py-10 text-center">
          <MessageSquareText className="size-9 text-slate-300" />

          <div className="mt-3 font-semibold text-slate-700">
            Chưa có đánh giá
          </div>

          <p className="mt-1 text-sm text-slate-400">
            Kỹ thuật viên chưa nhận được đánh giá nào.
          </p>
        </div>
      )}

      {!!data?.items?.length && (
        <div className="mt-6 divide-y divide-slate-100">
          {data.items.map((item) => (
            <div key={item.id} className="py-5 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-900">
                    {item.client?.fullName || "Khách hàng"}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "medium",
                    }).format(new Date(item.createdAt))}
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={
                        star <= item.rating
                          ? "size-4 fill-amber-400 text-amber-400"
                          : "size-4 text-slate-200"
                      }
                    />
                  ))}
                </div>
              </div>

              {item.comment && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {item.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
