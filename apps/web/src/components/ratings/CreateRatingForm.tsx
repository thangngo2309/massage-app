"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { StarRatingInput } from "@/components/ratings/StarRatingInput";
import { Button } from "@/components/ui/Button";

import { getApiErrorMessage } from "@/lib/http";
import { createRating } from "@/lib/ratings";

type Props = {
  bookingId: number;
  therapistId?: number;
  onSuccess?: () => void;
};

export const CreateRatingForm = ({
  bookingId,
  therapistId,
  onSuccess,
}: Props) => {
  const { t } = useTranslation("booking");

  const queryClient = useQueryClient();

  const submitLockRef = useRef(false);

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
      toast.success(t("detail.rating.success"));

      void queryClient.invalidateQueries({
        queryKey: ["booking-rating", bookingId],
      });

      void queryClient.invalidateQueries({
        queryKey: ["my-booking", bookingId],
      });

      void queryClient.invalidateQueries({
        queryKey: ["my-bookings"],
      });

      if (therapistId) {
        void queryClient.invalidateQueries({
          queryKey: ["therapist-ratings", therapistId],
        });
      }

      onSuccess?.();
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },

    onSettled: () => {
      submitLockRef.current = false;
    },
  });

  const handleSubmit = () => {
    if (submitLockRef.current || mutation.isPending) {
      return;
    }

    if (score < 1 || score > 5) {
      toast.error(t("detail.rating.selectStars"));

      return;
    }

    submitLockRef.current = true;

    mutation.mutate();
  };

  const getScoreLabel = () => {
    switch (score) {
      case 5:
        return t("detail.rating.score.excellent");

      case 4:
        return t("detail.rating.score.veryGood");

      case 3:
        return t("detail.rating.score.good");

      case 2:
        return t("detail.rating.score.notGood");

      case 1:
        return t("detail.rating.score.dissatisfied");

      default:
        return "";
    }
  };

  return (
    <div>
      <div>
        <div className="text-sm font-semibold text-slate-700">
          {t("detail.rating.question")}
        </div>

        <div className="mt-3">
          <StarRatingInput
            value={score}
            onChange={setScore}
            disabled={mutation.isPending}
          />
        </div>

        <div className="mt-2 text-sm font-medium text-amber-600">
          {getScoreLabel()}
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="rating-comment"
          className="block text-sm font-semibold text-slate-700"
        >
          {t("detail.rating.commentLabel")}
        </label>

        <textarea
          id="rating-comment"
          rows={5}
          value={comment}
          maxLength={1000}
          disabled={mutation.isPending}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t("detail.rating.commentPlaceholder")}
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 disabled:bg-slate-50"
        />

        <div className="mt-1 text-right text-xs text-slate-400">
          {comment.length}/1000
        </div>
      </div>

      <Button
        type="button"
        className="mt-5 w-full"
        loading={mutation.isPending}
        disabled={mutation.isPending}
        onClick={handleSubmit}
      >
        <Send className="size-4" />

        {t("detail.rating.submit")}
      </Button>
    </div>
  );
};
