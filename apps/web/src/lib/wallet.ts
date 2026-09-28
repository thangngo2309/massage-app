import { apiFetch } from "@/lib/http";

export type Wallet = {
  id: number;
  type: "main";
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type WalletTransactionType =
  | "topup"
  | "withdraw"
  | "payment"
  | "refund"
  | "adjustment";

export type WalletTransaction = {
  id: number;

  amount: number;

  type: WalletTransactionType;

  referenceId: string | null;

  description: string | null;

  createdAt: string;
};

export type CreateTopupResponse = {
  transactionId: number;
  txnRef: string;
  amount: number;
  paymentUrl: string;
};

export type TopupStatus = "pending" | "success" | "fail";

export type TopupStatusResponse = {
  transactionId: number;

  txnRef: string;

  amount: number;

  status: TopupStatus;

  processedToWallet: boolean;

  bankCode: string | null;

  vnpTransactionNo: string | null;

  createdAt: string;
};

export const getMyWallet = () => {
  return apiFetch<Wallet>("/wallet/me");
};

export const getMyWalletTransactions = () => {
  return apiFetch<WalletTransaction[]>("/wallet/transactions");
};

export const createWalletTopup = (amount: number) => {
  return apiFetch<CreateTopupResponse>("/wallet/topup", {
    method: "POST",

    body: JSON.stringify({
      amount,
      client: "web",
    }),
  });
};

export const getTopupStatus = (txnRef: string) => {
  return apiFetch<TopupStatusResponse>(
    `/wallet/topup/status?txnRef=${encodeURIComponent(txnRef)}`
  );
};
