import { apiRequest } from "@/lib/api";

export interface PromotionOperationsTotals {
  promotionUsages: number;
  referrals: number;
  userVouchers: number;
  wallets: number;
}

export interface PromotionOperationsVoucherStatusSummary {
  available?: number;
  reserved?: number;
  used?: number;
  expired?: number;
  cancelled?: number;
  [key: string]: number | undefined;
}

export interface PromotionOperationsReferralStatusSummary {
  pending?: number;
  qualified?: number;
  rewarded?: number;
  invalid?: number;
  [key: string]: number | undefined;
}

export interface PromotionOperationsWalletBalanceSummary {
  main?: number;
  promotion?: number;
  [key: string]: number | undefined;
}

export interface AdminPromotionOperationsSummary {
  totals: PromotionOperationsTotals;

  userVouchersByStatus: PromotionOperationsVoucherStatusSummary;

  referralsByStatus: PromotionOperationsReferralStatusSummary;

  walletBalanceByType: PromotionOperationsWalletBalanceSummary;
}

export function getAdminPromotionOperationsSummary() {
  return apiRequest<AdminPromotionOperationsSummary>(
    "/admin/promotion-operations/summary"
  );
}
