"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  MapPin,
  Star,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import type {
  TherapistSearchItem,
  TherapistSearchQuery,
} from "@/types/therapist-search";

type TherapistSearchCardProps = {
  therapist: TherapistSearchItem;
  serviceId: number;
  query: TherapistSearchQuery;
};

export const TherapistSearchCard = ({
  therapist,
  serviceId,
  query,
}: TherapistSearchCardProps) => {
  const { t, i18n } = useTranslation("therapists");

  const params = new URLSearchParams({
    serviceId: String(serviceId),
    serviceOptionId: String(query.serviceOptionId),
    date: query.date,
    startTime: query.startTime,
  });

  if (query.latitude !== undefined) {
    params.set("latitude", String(query.latitude));
  }

  if (query.longitude !== undefined) {
    params.set("longitude", String(query.longitude));
  }

  if (query.provinceCode) {
    params.set("provinceCode", query.provinceCode);
  }

  if (query.wardCode) {
    params.set("wardCode", query.wardCode);
  }

  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";

  const formatPrice = (value: number | string) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const formatTherapistDuration = (minutes: number) => {
    if (minutes < 60) {
      return t("duration.minutes", {
        count: minutes,
      });
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return t("duration.hours", {
        count: hours,
      });
    }

    return t("duration.hoursMinutes", {
      hours,
      minutes: remainingMinutes,
    });
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start gap-4">
          <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50">
            {therapist.avatarUrl ? (
              <img
                src={therapist.avatarUrl}
                alt={therapist.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl font-bold text-emerald-700">
                {therapist.fullName.trim().charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="truncate text-lg font-bold text-slate-950">
                {therapist.fullName}
              </h3>

              {therapist.available ? (
                <Badge variant="success">{t("card.available")}</Badge>
              ) : (
                <Badge variant="neutral">{t("card.unavailable")}</Badge>
              )}
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-sm">
              <Star className="size-4 fill-amber-400 text-amber-400" />

              <span className="font-bold text-slate-800">
                {Number(therapist.ratingAverage ?? 0).toFixed(1)}
              </span>

              <span className="text-slate-400">
                (
                {t("card.reviews", {
                  count: therapist.ratingCount ?? 0,
                })}
                )
              </span>
            </div>

            {therapist.experienceYears !== null &&
              therapist.experienceYears !== undefined && (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <BriefcaseBusiness className="size-4 text-emerald-700" />

                  {t("card.experience", {
                    count: therapist.experienceYears,
                  })}
                </div>
              )}
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <div className="font-semibold text-slate-900">
            {therapist.serviceName}
          </div>

          <div className="mt-1 text-sm text-slate-500">
            {therapist.optionLabel}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock3 className="size-4 text-emerald-700" />

              {formatTherapistDuration(therapist.durationMinutes)}
            </div>

            {therapist.distanceKm !== null &&
              therapist.distanceKm !== undefined && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-emerald-700" />

                  {t("card.distance", {
                    distance: Number(therapist.distanceKm).toFixed(1),
                  })}
                </div>
              )}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div>
            <div className="text-xs text-slate-400">{t("card.price")}</div>

            <div className="mt-1 text-xl font-bold text-emerald-700">
              {formatPrice(therapist.price)}
            </div>
          </div>

          <Link
            href={`/client/therapists/${
              therapist.therapistId
            }?${params.toString()}`}
          >
            <Button size="sm" disabled={!therapist.available}>
              {t("card.detail")}

              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
