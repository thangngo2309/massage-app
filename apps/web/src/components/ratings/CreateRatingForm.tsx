"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Send } from "lucide-react";

import { useState } from "react";

import { toast } from "sonner";

import { StarRatingInput } from "@/components/ratings/StarRatingInput";

import { Button } from "@/components/ui/Button";

import { getApiErrorMessage } from "@/lib/http";

import { createRating } from "@/lib/ratings";

type Props = {
  bookingId: number;

  onSuccess?: () => void;
};

export const CreateRatingForm = ({ bookingId, onSuccess }: Props) => {
  const queryClient = useQueryClient();

  const [score, setScore] = useState(5);

  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createRating({
        bookingId,

        rating: score,

        comment: comment.trim() || undefined,
      }),

    onSuccess: () => {
      toast.success("Cảm ơn bạn đã đánh giá.");

      void queryClient.invalidateQueries({
        queryKey: ["booking-rating", bookingId],
      });

      void queryClient.invalidateQueries({
        queryKey: ["client-booking", bookingId],
      });

      void queryClient.invalidateQueries({
        queryKey: ["client-bookings"],
      });

      onSuccess?.();
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleSubmit = () => {
    if (score < 1 || score > 5) {
      toast.error("Vui lòng chọn số sao.");

      return;
    }

    mutation.mutate();
  };

  return (
    <div>
      <div>
        <div className="text-sm font-semibold text-slate-700">
          Bạn đánh giá dịch vụ này thế nào?
        </div>

        <div className="mt-3">
          <StarRatingInput
            value={score}
            onChange={setScore}
            disabled={mutation.isPending}
          />
        </div>

        <div className="mt-2 text-sm font-medium text-amber-600">
          {score === 5 && "Tuyệt vời"}

          {score === 4 && "Rất tốt"}

          {score === 3 && "Khá tốt"}

          {score === 2 && "Chưa tốt"}

          {score === 1 && "Không hài lòng"}
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="rating-comment"
          className="block text-sm font-semibold text-slate-700"
        >
          Nhận xét
        </label>

        <textarea
          id="rating-comment"
          rows={5}
          value={comment}
          maxLength={1000}
          disabled={mutation.isPending}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn về kỹ thuật viên và dịch vụ..."
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 disabled:bg-slate-50"
        />

        <div className="mt-1 text-right text-xs text-slate-400">
          {comment.length}
          /1000
        </div>
      </div>

      <Button
        type="button"
        className="mt-5 w-full"
        loading={mutation.isPending}
        onClick={handleSubmit}
      >
        <Send className="size-4" />
        Gửi đánh giá
      </Button>
    </div>
  );
};
