"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Gift, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { getMyReferralInfo } from "@/lib/referrals";

export function ReferralCodeCard() {
  const { t } = useTranslation("referral");

  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["my-referral-info"],

    queryFn: getMyReferralInfo,
  });

  const copyCode = async () => {
    if (!data?.referralCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(data.referralCode);

      setCopied(true);

      toast.success(t("card.copySuccess"));

      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("card.copyError"));
    }
  };

  if (isLoading) {
    return <Card className="h-36 animate-pulse bg-slate-100" />;
  }

  if (isError || !data) {
    return (
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-950">{t("card.title")}</h2>

            <p className="mt-1 text-sm text-slate-500">{t("card.loadError")}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            loading={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCcw className="size-4" />

            {t("card.retry")}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Gift className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-slate-950">{t("card.myTitle")}</h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {t("card.description")}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-lg font-bold tracking-wider text-slate-950">
              {data.referralCode}
            </div>

            <Button type="button" variant="outline" onClick={copyCode}>
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}

              {copied ? t("card.copied") : t("card.copy")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
