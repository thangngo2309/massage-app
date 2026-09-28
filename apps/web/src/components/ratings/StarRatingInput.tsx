"use client";

import { Star } from "lucide-react";

import { useTranslation } from "react-i18next";

type Props = {
  value: number;

  onChange: (value: number) => void;

  disabled?: boolean;

  size?: number;
};

export const StarRatingInput = ({
  value,
  onChange,
  disabled = false,
  size = 32,
}: Props) => {
  const { t } = useTranslation("booking");

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onChange(score)}
          className="rounded-md p-1 transition hover:scale-110 disabled:cursor-default disabled:hover:scale-100"
          aria-label={t("rating.starLabel", {
            score,
          })}
        >
          <Star
            size={size}
            className={
              score <= value
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
            }
          />
        </button>
      ))}
    </div>
  );
};
