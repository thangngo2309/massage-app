import Link from "next/link";

import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  MapPin,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { formatCurrency, formatDuration } from "@/lib/utils";

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

  if (query.districtCode) {
    params.set("districtCode", query.districtCode);
  }

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
                <Badge variant="success">Có thể đặt</Badge>
              ) : (
                <Badge variant="neutral">Không khả dụng</Badge>
              )}
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-sm">
              <Star className="size-4 fill-amber-400 text-amber-400" />

              <span className="font-bold text-slate-800">
                {Number(therapist.ratingAverage ?? 0).toFixed(1)}
              </span>

              <span className="text-slate-400">
                ({therapist.ratingCount ?? 0} đánh giá)
              </span>
            </div>

            {therapist.experienceYears !== null &&
              therapist.experienceYears !== undefined && (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <BriefcaseBusiness className="size-4 text-emerald-700" />
                  {therapist.experienceYears} năm kinh nghiệm
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

              {formatDuration(therapist.durationMinutes)}
            </div>

            {therapist.distanceKm !== null &&
              therapist.distanceKm !== undefined && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-emerald-700" />
                  {Number(therapist.distanceKm).toFixed(1)} km
                </div>
              )}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div>
            <div className="text-xs text-slate-400">Giá kỹ thuật viên</div>

            <div className="mt-1 text-xl font-bold text-emerald-700">
              {formatCurrency(therapist.price)}
            </div>
          </div>

          <Link
            href={`/client/therapists/${
              therapist.therapistId
            }?${params.toString()}`}
          >
            <Button size="sm" disabled={!therapist.available}>
              Chi tiết
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
