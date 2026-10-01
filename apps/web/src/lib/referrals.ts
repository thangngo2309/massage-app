import { apiFetch } from "@/lib/http";

export interface MyReferralInfo {
  referralCode: string;

  referredBy: {
    referralId: number;
    code: string;
    status: string;
    qualifiedAt: string | null;
    rewardedAt: string | null;
  } | null;

  stats: {
    total: number;
    qualified: number;
    rewarded: number;
  };
}

export const getMyReferralInfo = () => {
  return apiFetch<MyReferralInfo>("/referrals/me");
};
