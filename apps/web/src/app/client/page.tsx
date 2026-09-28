"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";

export default function ClientPage() {
  const { t } = useTranslation("home");

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <div className="relative z-10 max-w-2xl">
              <Badge className="bg-white/10 text-emerald-50">
                {t("hero.eyebrow")}
              </Badge>

              <h1 className="mt-5 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {t("hero.title")}
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-50/80 sm:text-base">
                {t("hero.description")}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/client/services">
                  <Button
                    size="lg"
                    className="w-full bg-white text-emerald-800 hover:bg-emerald-50 sm:w-auto"
                  >
                    <Sparkles className="size-5" />

                    {t("hero.exploreServices")}
                  </Button>
                </Link>

                <Link href="/client/therapists">
                  <Button
                    size="lg"
                    className="w-full border border-white/20 bg-white/10 hover:bg-white/20 sm:w-auto"
                  >
                    <Search className="size-5" />

                    {t("therapists.find")}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="absolute -bottom-32 -right-24 size-[420px] rounded-full bg-white/10 blur-3xl" />
          </section>

          {/* Services */}
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <Badge>
                  {t("services.eyebrow")}
                </Badge>

                <h2 className="mt-3 text-xl font-bold text-slate-950 sm:text-2xl">
                  {t("services.title")}
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  {t("services.description")}
                </p>
              </div>

              <Link
                href="/client/services"
                className="hidden items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:flex"
              >
                {t("services.viewAll")}

                <ArrowRight className="size-4" />
              </Link>
            </div>

            <Card className="overflow-hidden p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Sparkles className="size-6" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      {t("services.title")}
                    </h3>

                    <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                      {t("services.description")}
                    </p>
                  </div>
                </div>

                <Link href="/client/services">
                  <Button className="w-full sm:w-auto">
                    {t("services.viewAll")}

                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </section>

          {/* Therapists */}
          <section>
            <div className="mb-4">
              <Badge>
                {t("therapists.eyebrow")}
              </Badge>

              <h2 className="mt-3 text-xl font-bold text-slate-950 sm:text-2xl">
                {t("therapists.title")}
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                {t("therapists.description")}
              </p>
            </div>

            <Card className="overflow-hidden p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <UserRoundSearch className="size-6" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      {t("therapists.title")}
                    </h3>

                    <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                      {t("therapists.description")}
                    </p>
                  </div>
                </div>

                <Link href="/client/therapists">
                  <Button className="w-full sm:w-auto">
                    <Search className="size-4" />

                    {t("therapists.find")}
                  </Button>
                </Link>
              </div>
            </Card>
          </section>
        </div>

        <aside className="space-y-5">
          {/* Upcoming booking */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">
                {t("upcoming.title")}
              </h2>

              <CalendarDays className="size-5 text-emerald-700" />
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-500">
                {t("upcoming.empty")}
              </p>
            </div>

            <Link href="/client/bookings" className="block">
              <Button variant="outline" className="mt-4 w-full">
                {t("upcoming.viewDetail")}

                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </Card>

          {/* Safety */}
          <Card className="p-5">
            <ShieldCheck className="size-8 text-emerald-700" />

            <h3 className="mt-4 font-bold text-slate-900">
              {t("safety.title")}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {t("safety.description")}
            </p>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}