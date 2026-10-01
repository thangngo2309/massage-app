"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Gift,
  RefreshCcw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { getMyReferralInfo } from "@/lib/referrals";

export function ReferralCodeCard() {
  const [copied, setCopied] =
    useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "my-referral-info",
    ],

    queryFn:
      getMyReferralInfo,
  });

  const copyCode =
    async () => {
      if (
        !data?.referralCode
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          data.referralCode,
        );

        setCopied(true);

        toast.success(
          "Đã sao chép mã giới thiệu",
        );

        window.setTimeout(
          () =>
            setCopied(
              false,
            ),
          1500,
        );
      } catch {
        toast.error(
          "Không thể sao chép mã giới thiệu",
        );
      }
    };

  if (isLoading) {
    return (
      <Card className="h-36 animate-pulse bg-slate-100" />
    );
  }

  if (
    isError ||
    !data
  ) {
    return (
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-950">
              Mã giới thiệu
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Không thể tải mã giới thiệu.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            loading={
              isFetching
            }
            onClick={() =>
              void refetch()
            }
          >
            <RefreshCcw className="size-4" />

            Thử lại
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
          <h2 className="font-bold text-slate-950">
            Mã giới thiệu của bạn
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Chia sẻ mã này cho người khác khi họ đăng ký tài khoản.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-lg font-bold tracking-wider text-slate-950">
              {
                data.referralCode
              }
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={
                copyCode
              }
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}

              {copied
                ? "Đã sao chép"
                : "Sao chép"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}