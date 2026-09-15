import { MessageSquareText, Star } from "lucide-react";

import type { Rating } from "@/types/rating";
import { formatDateTime } from "@/lib/utils";

type Props = {
  rating: Rating;
};

export const BookingRatingCard = ({ rating }: Props) => {
  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-bold text-slate-950">Đánh giá của bạn</div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((score) => (
            <Star
              key={score}
              className={
                score <= rating.rating
                  ? "size-5 fill-amber-400 text-amber-400"
                  : "size-5 text-slate-300"
              }
            />
          ))}
        </div>
      </div>

      {rating.comment && (
        <div className="mt-4 flex gap-3">
          <MessageSquareText className="mt-0.5 size-5 shrink-0 text-amber-600" />

          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {rating.comment}
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-400">
        {formatDateTime(rating.createdAt)}
      </div>
    </div>
  );
};
