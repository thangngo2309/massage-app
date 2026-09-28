"use client";

import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CreditCard,
  History,
  Plus,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  createWalletTopup,
  getMyWallet,
  getMyWalletTransactions,
  type WalletTransaction,
} from "@/lib/wallet";

const QUICK_AMOUNTS = [
  100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
];

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const getTransactionInfo = (transaction: WalletTransaction) => {
  switch (transaction.type) {
    case "topup":
      return {
        title: transaction.description || "Nạp tiền",
        positive: true,
        icon: ArrowDownLeft,
      };

    case "refund":
      return {
        title: transaction.description || "Hoàn tiền",
        positive: true,
        icon: ArrowDownLeft,
      };

    case "withdraw":
      return {
        title: transaction.description || "Rút tiền",
        positive: false,
        icon: ArrowUpRight,
      };

    case "payment":
      return {
        title: transaction.description || "Thanh toán",
        positive: false,
        icon: ArrowUpRight,
      };

    default:
      return {
        title: transaction.description || "Điều chỉnh số dư",
        positive: transaction.amount >= 0,
        icon: transaction.amount >= 0 ? ArrowDownLeft : ArrowUpRight,
      };
  }
};

export default function TherapistWalletPage() {
  const [showTopup, setShowTopup] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const [customAmount, setCustomAmount] = useState("");

  const walletQuery = useQuery({
    queryKey: ["therapist-wallet"],
    queryFn: getMyWallet,
  });

  const transactionsQuery = useQuery({
    queryKey: ["therapist-wallet-transactions"],
    queryFn: getMyWalletTransactions,
  });

  const topupMutation = useMutation({
    mutationFn: createWalletTopup,

    onSuccess: (data) => {
      if (!data.paymentUrl) {
        toast.error("Không nhận được đường dẫn thanh toán");
        return;
      }

      window.location.href = data.paymentUrl;
    },

    onError: (error: Error) => {
      toast.error(error.message || "Không thể tạo giao dịch nạp tiền");
    },
  });

  const amount = selectedAmount ?? Number(customAmount.replace(/\D/g, ""));

  const handleCustomAmount = (value: string) => {
    const numericValue = value.replace(/\D/g, "");

    setCustomAmount(numericValue);
    setSelectedAmount(null);
  };

  const handleTopup = () => {
    if (!Number.isFinite(amount) || amount < 10_000) {
      toast.error("Số tiền nạp tối thiểu là 10.000đ");
      return;
    }

    if (amount > 100_000_000) {
      toast.error("Số tiền nạp tối đa là 100.000.000đ");
      return;
    }

    topupMutation.mutate(amount);
  };

  if (walletQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="h-7 w-7 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (walletQuery.isError || !walletQuery.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">
            Không thể tải thông tin ví.
          </p>

          <button
            type="button"
            onClick={() => walletQuery.refetch()}
            className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const wallet = walletQuery.data;
  const transactions = transactionsQuery.data ?? [];

  if (showTopup) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        <button
          type="button"
          onClick={() => setShowTopup(false)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại ví
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-950">
              Nạp tiền vào ví
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Chọn số tiền bạn muốn nạp. Giao dịch sẽ được thanh toán an toàn
              qua VNPAY.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Chọn nhanh số tiền
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {QUICK_AMOUNTS.map((item) => {
                const selected = selectedAmount === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(item);
                      setCustomAmount("");
                    }}
                    className={[
                      "rounded-2xl border px-3 py-4 text-sm font-bold transition",
                      selected
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                    ].join(" ")}
                  >
                    {formatMoney(item)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-xs font-medium text-slate-400">HOẶC</span>

            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div>
            <label
              htmlFor="customAmount"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Nhập số tiền khác
            </label>

            <div className="relative">
              <input
                id="customAmount"
                inputMode="numeric"
                value={
                  customAmount
                    ? Number(customAmount).toLocaleString("vi-VN")
                    : ""
                }
                onChange={(event) => handleCustomAmount(event.target.value)}
                placeholder="Nhập số tiền"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-16 text-lg font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                VNĐ
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Tối thiểu 10.000đ · Tối đa 100.000.000đ
            </p>
          </div>

          {amount >= 10_000 && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Số tiền nạp</span>

                <span className="text-lg font-bold text-slate-950">
                  {formatMoney(amount)}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={topupMutation.isPending || !amount || amount < 10_000}
            onClick={handleTopup}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {topupMutation.isPending ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Đang tạo giao dịch...
              </>
            ) : (
              <>
                Thanh toán qua VNPAY
                <ArrowUpRight className="h-5 w-5" />
              </>
            )}
          </button>

          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <p className="text-xs leading-5 text-emerald-800">
              Thanh toán được thực hiện trên hệ thống VNPAY. Số dư ví chỉ được
              cập nhật sau khi hệ thống xác nhận giao dịch thành công.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-950">Ví của tôi</h1>

        <p className="mt-1 text-sm text-slate-500">
          Quản lý số dư và các giao dịch của bạn
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-emerald-50">
              <WalletCards className="h-5 w-5" />
              Số dư khả dụng
            </div>

            <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {formatMoney(wallet.balance)}
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTopup(true)}
          className="mt-8 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 font-bold text-emerald-700 transition hover:bg-emerald-50"
        >
          <Plus className="h-5 w-5" />
          Nạp tiền
        </button>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-slate-600" />

          <h2 className="text-lg font-bold text-slate-950">
            Lịch sử giao dịch
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {transactionsQuery.isLoading ? (
            <div className="flex justify-center p-10">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <History className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-3 font-medium text-slate-600">
                Chưa có giao dịch
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Các giao dịch ví sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((transaction) => {
                const info = getTransactionInfo(transaction);

                const Icon = info.icon;

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-4 sm:p-5"
                  >
                    <div
                      className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                        info.positive
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-orange-50 text-orange-600",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {info.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {new Intl.DateTimeFormat("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(transaction.createdAt))}
                      </p>
                    </div>

                    <p
                      className={[
                        "shrink-0 text-sm font-bold sm:text-base",
                        info.positive ? "text-emerald-600" : "text-slate-800",
                      ].join(" ")}
                    >
                      {info.positive ? "+" : "-"}
                      {formatMoney(Math.abs(transaction.amount))}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
