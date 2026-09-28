"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ServiceOptionCard } from "@/components/services/ServiceOptionCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { getApiErrorMessage } from "@/lib/http";
import { getClientService } from "@/lib/services";
import type { ServiceOption } from "@/types/service";

export default function ServiceDetailPage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const { t, i18n } = useTranslation("services");
  const { t: tCommon } = useTranslation("common");

  const serviceId = Number(params.id);

  const [selectedOption, setSelectedOption] = useState<ServiceOption | null>(
    null
  );

  const {
    data: service,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["client-service", serviceId],

    queryFn: () => getClientService(serviceId),

    enabled: Number.isInteger(serviceId) && serviceId > 0,
  });

  const activeOptions = useMemo(() => {
    return service?.options?.filter((option) => option.isActive) ?? [];
  }, [service?.options]);

  const locale = i18n.resolvedLanguage || i18n.language || "vi-VN";

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const handleContinue = () => {
    if (!selectedOption) {
      return;
    }

    const query = new URLSearchParams({
      serviceId: String(service?.id),
      serviceOptionId: String(selectedOption.id),
    });

    router.push(`/client/therapists?${query.toString()}`);
  };

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return (
      <PageContainer className="py-8">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-bold">{t("detail.invalid")}</h1>

          <Link
            href="/client/services"
            className="mt-4 inline-flex text-sm font-semibold text-emerald-700"
          >
            {t("detail.back")}
          </Link>
        </Card>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer className="py-5 sm:py-6 lg:py-8">
        <div className="animate-pulse">
          <div className="h-5 w-36 rounded bg-slate-100" />

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="aspect-[16/7] rounded-[28px] bg-slate-100" />

              <div className="mt-6 h-9 w-1/2 rounded bg-slate-100" />

              <div className="mt-4 h-4 w-full rounded bg-slate-100" />

              <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
            </div>

            <div className="h-72 rounded-2xl bg-slate-100" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !service) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <RefreshCcw className="size-8 text-red-500" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t("detail.notFound")}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {getApiErrorMessage(error)}
          </p>

          <Button
            className="mt-5"
            loading={isFetching}
            onClick={() => void refetch()}
          >
            {tCommon("retry")}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <Link
        href="/client/services"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
      >
        <ArrowLeft className="size-4" />

        {t("detail.back")}
      </Link>

      <section className="mt-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 text-white">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="size-6" />
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              {service.name}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
              {service.description || t("detail.defaultDescription")}
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-emerald-50/90">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5" />

                {t("detail.verifiedTherapists")}
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5" />

                {t("detail.flexibleBooking")}
              </div>
            </div>
          </div>

          <div className="min-h-56 bg-white/5">
            {service.imageUrl ? (
              <img
                src={service.imageUrl}
                alt={service.name}
                className="h-full min-h-56 w-full object-cover lg:min-h-full"
              />
            ) : (
              <div className="flex h-full min-h-56 items-center justify-center">
                <Sparkles className="size-20 text-white/20" />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div>
            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
              {t("detail.chooseOption")}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {t("detail.chooseOptionDescription")}
            </p>
          </div>

          {activeOptions.length > 0 ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {activeOptions.map((option) => (
                <ServiceOptionCard
                  key={option.id}
                  option={option}
                  selected={selectedOption?.id === option.id}
                  onSelect={setSelectedOption}
                />
              ))}
            </div>
          ) : (
            <Card className="mt-5 px-6 py-12 text-center">
              <Clock3 className="mx-auto size-8 text-slate-300" />

              <h3 className="mt-4 font-bold text-slate-900">
                {t("detail.noOptions")}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {t("detail.noOptionsDescription")}
              </p>
            </Card>
          )}
        </section>

        <aside>
          <div className="xl:sticky xl:top-24">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                {t("detail.selection.title")}
              </h2>

              {!selectedOption ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                  {t("detail.selection.empty")}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-emerald-50 p-5">
                  <div className="font-bold text-emerald-950">
                    {selectedOption.label}
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-800">
                    <Clock3 className="size-4" />

                    {t("detail.durationValue", {
                      count: selectedOption.durationMinutes,
                    })}
                  </div>

                  <div className="mt-4 text-xs text-emerald-700/70">
                    {t("detail.defaultPrice")}
                  </div>

                  <div className="mt-1 text-2xl font-bold text-emerald-800">
                    {formatCurrency(selectedOption.defaultPrice)}
                  </div>
                </div>
              )}

              <Button
                size="lg"
                disabled={!selectedOption}
                onClick={handleContinue}
                className="mt-5 w-full"
              >
                {t("detail.findTherapist")}

                <ArrowRight className="size-5" />
              </Button>

              <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                {t("detail.priceNotice")}
              </p>
            </Card>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
