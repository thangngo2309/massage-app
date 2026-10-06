"use client";

import Link from "next/link";

import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
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

  /**
   * ==========================================================
   * BUSY UNTIL
   * ==========================================================
   *
   * Backend trả ISO datetime.
   *
   * Vì sản phẩm hiện phục vụ Việt Nam nên format
   * theo Asia/Ho_Chi_Minh để không phụ thuộc timezone
   * của thiết bị/browser.
   */
  const formatBusyUntil = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const now = new Date();

    const timeZone = "Asia/Ho_Chi_Minh";

    const dayFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,

      year: "numeric",

      month: "2-digit",

      day: "2-digit",
    });

    const sameDay = dayFormatter.format(date) === dayFormatter.format(now);

    if (sameDay) {
      return new Intl.DateTimeFormat(locale, {
        timeZone,

        hour: "2-digit",

        minute: "2-digit",

        hour12: false,
      }).format(date);
    }

    return new Intl.DateTimeFormat(locale, {
      timeZone,

      day: "2-digit",

      month: "2-digit",

      hour: "2-digit",

      minute: "2-digit",

      hour12: false,
    }).format(date);
  };

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

  const isBusy = therapist.availabilityStatus === "busy";

  const busyUntilText = therapist.busyUntil
    ? formatBusyUntil(therapist.busyUntil)
    : null;

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
            CURRENT AVAILABILITY
        ================================================ */}

        {isBusy ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
            <div className="flex items-start gap-2.5">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-amber-600" />

              <div className="min-w-0">
                <div className="text-sm font-bold text-amber-800">
                  {t("card.availability.busy", {
                    defaultValue: "Đang bận",
                  })}
                </div>

                <div className="mt-0.5 text-xs leading-5 text-amber-700">
                  {busyUntilText
                    ? t("card.availability.busyUntil", {
                        time: busyUntilText,

                        defaultValue: `Dự kiến có thể đặt lại khoảng ${busyUntilText}`,
                      })
                    : t("card.availability.busyUnknown", {
                        defaultValue:
                          "KTV đang có booking. Thời gian rảnh đang được cập nhật.",
                      })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="size-4 shrink-0" />

              {t("card.availability.availableNow", {
                defaultValue: "Có thể đặt ngay",
              })}
            </div>
          </div>
        )}

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

          {/*
           * KTV đang BUSY vẫn được mở detail.
           *
           * Khách có thể xem KTV và chọn
           * khung giờ sau busyUntil.
           *
           * Không disable nút này.
           */}
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
