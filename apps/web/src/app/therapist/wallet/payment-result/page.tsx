"use client";

import { CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import Link from "next/link";

import { useSearchParams } from "next/navigation";

import { getTopupStatus } from "@/lib/wallet";

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function PaymentResultPage() {
  const searchParams = useSearchParams();

  const txnRef = searchParams.get("txnRef") ?? "";

  const paymentQuery = useQuery({
    queryKey: ["wallet-topup-status", txnRef],

    queryFn: () => getTopupStatus(txnRef),

    enabled: Boolean(txnRef),

    /*
     * RETURN đôi khi về browser trước IPN.
     *
     * Nếu DB vẫn pending thì hỏi lại mỗi 2 giây.
     */
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
          Không xác định được giao dịch
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Không tìm thấy mã giao dịch thanh toán.
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
          Đang xác nhận giao dịch
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Hệ thống đang kiểm tra kết quả thanh toán với VNPAY.
        </p>
      </ResultLayout>
    );
  }

  if (paymentQuery.isError || !paymentQuery.data) {
    return (
      <ResultLayout>
        <XCircle className="mx-auto h-16 w-16 text-red-500" />

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          Không thể kiểm tra giao dịch
        </h1>

        <button
          type="button"
          onClick={() => paymentQuery.refetch()}
          className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 font-semibold text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Kiểm tra lại
        </button>

        <BackToWallet />
      </ResultLayout>
    );
  }

  const transaction = paymentQuery.data;

  const success =
    transaction.status === "success" && transaction.processedToWallet;

  const failed = transaction.status === "fail";

  // =====================================
  // SUCCESS
  // =====================================

  if (success) {
    return (
      <ResultLayout>
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          Nạp tiền thành công
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Tiền đã được cộng vào ví của bạn.
        </p>

        <div className="mt-7 rounded-2xl bg-emerald-50 p-5">
          <p className="text-sm text-emerald-700">Số tiền nạp</p>

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

  // =====================================
  // FAILED
  // =====================================

  if (failed) {
    return (
      <ResultLayout>
        <XCircle className="mx-auto h-16 w-16 text-red-500" />

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          Thanh toán không thành công
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Giao dịch chưa hoàn tất hoặc đã bị hủy. Số dư ví không bị thay đổi.
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

  // =====================================
  // PENDING
  // =====================================

  return (
    <ResultLayout>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <Clock3 className="h-8 w-8 text-amber-500" />
      </div>

      <h1 className="mt-5 text-2xl font-bold text-slate-950">
        Đang xác nhận thanh toán
      </h1>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        VNPAY đã chuyển bạn về hệ thống. Chúng tôi đang chờ xác nhận giao dịch
        từ VNPAY.
      </p>

      <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Đang kiểm tra tự động...
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
  return (
    <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-left">
      <div>
        <p className="text-xs text-slate-400">Mã giao dịch</p>

        <p className="mt-1 break-all text-sm font-semibold text-slate-700">
          {txnRef}
        </p>
      </div>

      {bankCode && (
        <div>
          <p className="text-xs text-slate-400">Ngân hàng</p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {bankCode}
          </p>
        </div>
      )}

      {vnpTransactionNo && (
        <div>
          <p className="text-xs text-slate-400">Mã giao dịch VNPAY</p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {vnpTransactionNo}
          </p>
        </div>
      )}
    </div>
  );
}

function BackToWallet({ primary = false }: { primary?: boolean }) {
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
      Quay lại ví
    </Link>
  );
}
