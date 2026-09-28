"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { getTopupStatus } from "@/lib/wallet";

export default function PaymentResultPage() {
  const { t, i18n } = useTranslation("wallet");

  const searchParams = useSearchParams();

  const txnRef = searchParams.get("txnRef") ?? "";

  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const paymentQuery = useQuery({
    queryKey: ["wallet-topup-status", txnRef],

    queryFn: () => getTopupStatus(txnRef),

    enabled: Boolean(txnRef),

    refetchInterval: (query) => {
      const data = query.state.data;

      if (!data || data.status === "pending") {
        return 2_000;
      }

      return false;
    },
  });

  if (!txnRef) {
    return (
      <ResultLayout>
        <XCircle className="mx-auto h-16 w-16 text-red-500" />

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          {t("paymentResult.invalid.title")}
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          {t("paymentResult.invalid.description")}
        </p>

        <BackToWallet />
      </ResultLayout>
    );
  }

  if (paymentQuery.isLoading) {
    return (
      <ResultLayout>
        <RefreshCw className="mx-auto h-14 w-14 animate-spin text-emerald-600" />

        <h1 className="mt-5 text-xl font-bold text-slate-950">
          {t("paymentResult.checking.title")}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {t("paymentResult.checking.description")}
        </p>
      </ResultLayout>
    );
  }

  if (paymentQuery.isError || !paymentQuery.data) {
    return (
      <ResultLayout>
        <XCircle className="mx-auto h-16 w-16 text-red-500" />

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          {t("paymentResult.error.title")}
        </h1>

        <button
          type="button"
          onClick={() => paymentQuery.refetch()}
          className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 font-semibold text-white"
        >
          <RefreshCw className="h-4 w-4" />

          {t("paymentResult.error.retry")}
        </button>

        <BackToWallet />
      </ResultLayout>
    );
  }

  const transaction = paymentQuery.data;

  const success =
    transaction.status === "success" && transaction.processedToWallet;

  const failed = transaction.status === "fail";

  if (success) {
    return (
      <ResultLayout>
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          {t("paymentResult.success.title")}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {t("paymentResult.success.description")}
        </p>

        <div className="mt-7 rounded-2xl bg-emerald-50 p-5">
          <p className="text-sm text-emerald-700">
            {t("paymentResult.success.amount")}
          </p>

          <p className="mt-1 text-3xl font-bold text-emerald-700">
            +{formatMoney(transaction.amount)}
          </p>
        </div>

        <TransactionInfo
          txnRef={transaction.txnRef}
          bankCode={transaction.bankCode}
          vnpTransactionNo={transaction.vnpTransactionNo}
        />

        <BackToWallet primary />
      </ResultLayout>
    );
  }

  if (failed) {
    return (
      <ResultLayout>
        <XCircle className="mx-auto h-16 w-16 text-red-500" />

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          {t("paymentResult.failed.title")}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {t("paymentResult.failed.description")}
        </p>

        <TransactionInfo
          txnRef={transaction.txnRef}
          bankCode={transaction.bankCode}
          vnpTransactionNo={transaction.vnpTransactionNo}
        />

        <BackToWallet primary />
      </ResultLayout>
    );
  }

  return (
    <ResultLayout>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <Clock3 className="h-8 w-8 text-amber-500" />
      </div>

      <h1 className="mt-5 text-2xl font-bold text-slate-950">
        {t("paymentResult.pending.title")}
      </h1>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {t("paymentResult.pending.description")}
      </p>

      <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600">
        <RefreshCw className="h-4 w-4 animate-spin" />

        {t("paymentResult.pending.autoChecking")}
      </div>

      <TransactionInfo
        txnRef={transaction.txnRef}
        bankCode={transaction.bankCode}
        vnpTransactionNo={transaction.vnpTransactionNo}
      />

      <BackToWallet />
    </ResultLayout>
  );
}

function ResultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center px-4 py-8">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}

function TransactionInfo({
  txnRef,
  bankCode,
  vnpTransactionNo,
}: {
  txnRef: string;
  bankCode: string | null;
  vnpTransactionNo: string | null;
}) {
  const { t } = useTranslation("wallet");

  return (
    <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-left">
      <div>
        <p className="text-xs text-slate-400">
          {t("paymentResult.transaction.txnRef")}
        </p>

        <p className="mt-1 break-all text-sm font-semibold text-slate-700">
          {txnRef}
        </p>
      </div>

      {bankCode && (
        <div>
          <p className="text-xs text-slate-400">
            {t("paymentResult.transaction.bank")}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {bankCode}
          </p>
        </div>
      )}

      {vnpTransactionNo && (
        <div>
          <p className="text-xs text-slate-400">
            {t("paymentResult.transaction.vnpayTxnRef")}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {vnpTransactionNo}
          </p>
        </div>
      )}
    </div>
  );
}

function BackToWallet({ primary = false }: { primary?: boolean }) {
  const { t } = useTranslation("wallet");

  return (
    <Link
      href="/therapist/wallet"
      className={[
        "mt-7 flex h-12 w-full items-center justify-center rounded-2xl px-5 font-semibold transition",

        primary
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {t("paymentResult.backToWallet")}
    </Link>
  );
}
