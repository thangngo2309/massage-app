"use client";

import { Check, ChevronDown, TicketPercent, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";

import type { EligibleBookingVoucher } from "@/types/voucher";

type BookingVoucherSelectorProps = {
  items: EligibleBookingVoucher[];

  selectedUserVoucherId: number | null;

  loading?: boolean;

  error?: boolean;

  onSelect: (voucher: EligibleBookingVoucher | null) => void;

  formatCurrency: (value: number | string) => string;
};

export function BookingVoucherSelector({
  items,
  selectedUserVoucherId,
  loading = false,
  error = false,
  onSelect,
  formatCurrency,
}: BookingVoucherSelectorProps) {
  const { t } = useTranslation("booking");

  const [open, setOpen] = useState(false);

  const selectedVoucher =
    items.find((item) => item.userVoucherId === selectedUserVoucherId) ?? null;

  if (loading) {
    return <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        {t("voucherSelector.loadError")}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <TicketPercent className="size-5" />
        </div>

        <div>
          <div className="text-sm font-semibold text-slate-900">
            {t("voucherSelector.empty.title")}
          </div>

          <div className="mt-0.5 text-xs text-slate-500">
            {t("voucherSelector.empty.description")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <TicketPercent className="size-5" />
          </div>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">
              {selectedVoucher
                ? selectedVoucher.name
                : t("voucherSelector.select")}
            </div>

            <div className="mt-0.5 truncate text-xs text-slate-500">
              {selectedVoucher
                ? t("voucherSelector.discountAmount", {
                    amount: formatCurrency(selectedVoucher.discountAmount),
                  })
                : t("voucherSelector.availableCount", {
                    count: items.length,
                  })}
            </div>
          </div>
        </div>

        <ChevronDown
          className={`size-5 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <Card className="mt-3 overflow-hidden p-0">
          <button
            type="button"
            onClick={() => {
              onSelect(null);

              setOpen(false);
            }}
            className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 text-left hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <X className="size-4" />
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {t("voucherSelector.none.title")}
                </div>

                <div className="mt-0.5 text-xs text-slate-500">
                  {t("voucherSelector.none.description")}
                </div>
              </div>
            </div>

            {selectedUserVoucherId === null && (
              <Check className="size-5 text-emerald-700" />
            )}
          </button>

          {items.map((voucher) => {
            const selected = selectedUserVoucherId === voucher.userVoucherId;

            return (
              <button
                key={voucher.userVoucherId}
                type="button"
                onClick={() => {
                  onSelect(voucher);

                  setOpen(false);
                }}
                className="flex w-full items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 text-left last:border-b-0 hover:bg-slate-50"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <TicketPercent className="size-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">
                      {voucher.name}
                    </div>

                    <div className="mt-1 text-sm font-semibold text-emerald-700">
                      {t("voucherSelector.discountAmount", {
                        amount: formatCurrency(voucher.discountAmount),
                      })}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {t("voucherSelector.code", {
                        code: voucher.code,
                      })}
                    </div>

                    {voucher.description && (
                      <div className="mt-1 text-xs leading-5 text-slate-500">
                        {voucher.description}
                      </div>
                    )}

                    {voucher.terms && (
                      <div className="mt-1 text-xs leading-5 text-slate-400">
                        {voucher.terms}
                      </div>
                    )}
                  </div>
                </div>

                {selected && (
                  <Check className="mt-1 size-5 shrink-0 text-emerald-700" />
                )}
              </button>
            );
          })}
        </Card>
      )}
    </div>
  );
}
