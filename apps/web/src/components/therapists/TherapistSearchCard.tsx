"use client";

import Link from "next/link";

import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Layers3,
  MapPin,
  Star,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/Badge";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import type { TherapistSearchItem } from "@/types/therapist-search";

type TherapistSearchCardProps = {
  therapist: TherapistSearchItem;

  serviceId: number;
};

export const TherapistSearchCard = ({
  therapist,
  serviceId,
}: TherapistSearchCardProps) => {
  const { t, i18n } = useTranslation("therapists");

  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";

  const formatPrice = (value: number | string) =>
    new Intl.NumberFormat(locale, {
      style: "currency",

      currency: "VND",

      maximumFractionDigits: 0,
    }).format(Number(value));

  const minPrice = Number(therapist.minPrice ?? 0);

  const maxPrice = Number(therapist.maxPrice ?? minPrice);

  const priceText =
    minPrice === maxPrice
      ? formatPrice(minPrice)
      : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`;

  const ratingAverage = Number(therapist.ratingAverage ?? 0);

  const ratingCount = therapist.ratingCount ?? 0;

  const optionCount = therapist.optionCount ?? 0;

  const therapistName =
    therapist.stageName?.trim() ||
    t("card.stageNameUpdating", {
      defaultValue: "Đang cập nhật nghệ danh",
    });

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
      <div className="flex h-full flex-col p-5">
        {/* ================================================
            HEADER
        ================================================ */}

        <div className="flex items-start gap-4">
          <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50">
            {therapist.avatarUrl ? (
              <img
                src={therapist.avatarUrl}
                alt={therapistName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl font-bold text-emerald-700">
                {therapistName.trim().charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 truncate text-lg font-bold text-slate-950">
                {therapistName}
              </h3>

              <Badge variant="success">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" />

                  {t("card.verified", {
                    defaultValue: "Đã xác minh",
                  })}
                </span>
              </Badge>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="size-4 fill-amber-400 text-amber-400" />

                <span className="font-bold text-slate-800">
                  {ratingAverage.toFixed(1)}
                </span>

                <span className="text-slate-400">
                  (
                  {t("card.reviews", {
                    count: ratingCount,

                    defaultValue: `${ratingCount} đánh giá`,
                  })}
                  )
                </span>
              </div>
            </div>

            {therapist.experienceYears !== null &&
              therapist.experienceYears !== undefined && (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <BriefcaseBusiness className="size-4 text-emerald-700" />

                  {t("card.experience", {
                    count: therapist.experienceYears,

                    defaultValue: `${therapist.experienceYears} năm kinh nghiệm`,
                  })}
                </div>
              )}
          </div>
        </div>

        {/* ================================================
            SERVICE
        ================================================ */}

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {t("card.service", {
              defaultValue: "Dịch vụ",
            })}
          </div>

          <div className="mt-1 font-semibold text-slate-900">
            {therapist.serviceName}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Layers3 className="size-4 text-emerald-700" />

              {t("card.options", {
                count: optionCount,

                defaultValue: `${optionCount} lựa chọn`,
              })}
            </div>

            {therapist.distanceKm !== null &&
              therapist.distanceKm !== undefined && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-emerald-700" />

                  {t("card.distance", {
                    distance: Number(therapist.distanceKm).toFixed(1),

                    defaultValue: `${Number(therapist.distanceKm).toFixed(
                      1
                    )} km`,
                  })}
                </div>
              )}
          </div>
        </div>

        {/* ================================================
            PRICE + ACTION
        ================================================ */}

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div className="min-w-0">
            <div className="text-xs text-slate-400">
              {t("card.priceRange", {
                defaultValue: "Khoảng giá",
              })}
            </div>

            <div className="mt-1 text-lg font-bold text-emerald-700">
              {priceText}
            </div>
          </div>

          <Link
            href={`/client/therapists/${therapist.therapistId}?serviceId=${serviceId}`}
            className="shrink-0"
          >
            <Button size="sm">
              {t("card.selectTherapist", {
                defaultValue: "Chọn KTV",
              })}

              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
