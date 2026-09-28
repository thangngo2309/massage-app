"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock3, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { getApiErrorMessage } from "@/lib/http";
import { updateTherapistSelfService } from "@/lib/therapist-self";

import type { TherapistSelfService } from "@/types/therapist-self";

type Props = {
  item: TherapistSelfService;
};

export const TherapistServiceCard = ({ item }: Props) => {
  const { t, i18n } = useTranslation("therapistServices");

  const { t: tBooking } = useTranslation("booking");

  const queryClient = useQueryClient();

  const [price, setPrice] = useState(String(item.price));

  const [active, setActive] = useState(item.isActive);

  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";

  useEffect(() => {
    setPrice(String(item.price));

    setActive(item.isActive);
  }, [item]);

  /**
   * =========================================
   * FORMATTERS
   * =========================================
   */

  const formatServiceCurrency = (value: number | string) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const formatServiceDuration = (minutes: number) => {
    if (minutes < 60) {
      return tBooking("duration.minutes", {
        count: minutes,
      });
    }

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return tBooking("duration.hours", {
        count: hours,
      });
    }

    return tBooking("duration.hoursMinutes", {
      hours,
      minutes: remainingMinutes,
    });
  };

  /**
   * =========================================
   * UPDATE SERVICE
   * =========================================
   */

  const mutation = useMutation({
    mutationFn: () =>
      updateTherapistSelfService(item.id, {
        price: Number(price),

        isActive: active,
      }),

    onSuccess: () => {
      toast.success(t("card.updateSuccess"));

      void queryClient.invalidateQueries({
        queryKey: ["therapist-self-services"],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  return (
    <Card className="p-5">
      {/*
       * =====================================
       * SERVICE INFORMATION
       * =====================================
       */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-950">{item.serviceName}</h2>

          <p className="mt-1 text-sm text-slate-500">{item.optionLabel}</p>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Clock3 className="size-4 text-emerald-700" />

            {formatServiceDuration(item.durationMinutes)}
          </div>
        </div>

        <Badge variant={active ? "success" : "neutral"}>
          {active ? t("card.status.active") : t("card.status.inactive")}
        </Badge>
      </div>

      {/*
       * =====================================
       * DEFAULT PRICE / PLATFORM FEE
       * =====================================
       */}

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="text-xs text-slate-400">{t("card.defaultPrice")}</div>

        <div className="mt-1 font-semibold text-slate-700">
          {formatServiceCurrency(item.defaultPrice)}
        </div>

        <div className="mt-4 text-xs text-slate-400">
          {t("card.platformFee")}
        </div>

        <div className="mt-1 font-semibold text-slate-700">
          {item.platformFeeRate}%
        </div>
      </div>

      {/*
       * =====================================
       * THERAPIST PRICE
       * =====================================
       */}

      <div className="mt-5">
        <label
          htmlFor={`therapist-service-price-${item.id}`}
          className="text-sm font-semibold text-slate-700"
        >
          {t("card.yourPrice")}
        </label>

        <input
          id={`therapist-service-price-${item.id}`}
          type="number"
          min={0}
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
        />
      </div>

      {/*
       * =====================================
       * ACTIONS
       * =====================================
       */}

      <div className="mt-5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setActive((current) => !current)}
          className={
            active
              ? "rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
              : "rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
          }
        >
          {active ? t("card.toggle.active") : t("card.toggle.inactive")}
        </button>

        <Button
          size="sm"
          loading={mutation.isPending}
          disabled={!price || Number(price) <= 0}
          onClick={() => mutation.mutate()}
        >
          <Save className="size-4" />

          {t("card.save")}
        </Button>
      </div>
    </Card>
  );
};
