"use client";

import { useQuery } from "@tanstack/react-query";

import { RefreshCcw, Search, ShieldCheck, Sparkles } from "lucide-react";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { ServiceCard } from "@/components/services/ServiceCard";

import { ServiceCardSkeleton } from "@/components/services/ServiceCardSkeleton";

import { ServicesEmptyState } from "@/components/services/ServicesEmptyState";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import { getApiErrorMessage } from "@/lib/http";

import { getClientServices } from "@/lib/services";

export default function ServicesPage() {
  const [search, setSearch] = useState("");

  const { t, i18n } = useTranslation("services");

  const { t: tCommon } = useTranslation("common");

  /**
   * Language hiện tại vừa dùng làm cache key,
   * vừa được gửi Backend qua Accept-Language.
   */
  const language = (i18n.resolvedLanguage ?? i18n.language ?? "vi")
    .split("-")[0]
    .toLowerCase();

  const {
    data,

    isLoading,

    isError,

    error,

    refetch,

    isFetching,
  } = useQuery({
    queryKey: ["client-services", language],

    queryFn: () => getClientServices(language),
  });

  const services = useMemo(() => {
    const items = data ?? [];

    const keyword = search.trim().toLocaleLowerCase(language);

    if (!keyword) {
      return items;
    }

    return items.filter((service) => {
      const name = service.name.toLocaleLowerCase(language);

      const description =
        service.description?.toLocaleLowerCase(language) ?? "";

      return name.includes(keyword) || description.includes(keyword);
    });
  }, [data, search, language]);

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="max-w-2xl">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles className="size-6" />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("hero.title")}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-emerald-50/80 sm:text-base">
            {t("hero.description")}
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("search.placeholder")}
            aria-label={t("search.placeholder")}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
          />
        </div>

        <Card className="hidden items-center gap-3 px-4 py-3 lg:flex">
          <ShieldCheck className="size-5 shrink-0 text-emerald-700" />

          <div className="text-xs leading-5 text-slate-500">
            {t("verification.description")}
          </div>
        </Card>
      </section>

      <section className="mt-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
              {t("list.title")}
            </h2>

            {!isLoading && !isError && (
              <p className="mt-1 text-sm text-slate-500">
                {t("list.count", {
                  count: services.length,
                })}
              </p>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({
              length: 8,
            }).map((_, index) => (
              <ServiceCardSkeleton key={index} />
            ))}
          </div>
        )}

        {isError && (
          <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <RefreshCcw className="size-7" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {t("error")}
            </h3>

            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              {getApiErrorMessage(error)}
            </p>

            <Button
              type="button"
              className="mt-5"
              loading={isFetching}
              onClick={() => void refetch()}
            >
              <RefreshCcw className="size-4" />

              {tCommon("retry")}
            </Button>
          </Card>
        )}

        {!isLoading && !isError && services.length === 0 && (
          <ServicesEmptyState />
        )}

        {!isLoading && !isError && services.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
