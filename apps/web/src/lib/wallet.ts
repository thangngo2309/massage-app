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
    }),
  });
};
