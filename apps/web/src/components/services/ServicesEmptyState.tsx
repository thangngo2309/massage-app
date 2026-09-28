"use client";

import { SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";

export const ServicesEmptyState = () => {
  const { t } = useTranslation("services");

  return (
    <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <SearchX className="size-7" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">
        {t("empty.title")}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {t("empty.description")}
      </p>
    </Card>
  );
};
