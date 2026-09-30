import { apiRequest } from "@/lib/api";

/* =========================================================
 * Common
 * ======================================================= */

export type PromotionOperationsUserRole =
  | "super_admin"
  | "system_admin"
  | "client"
  | "therapist";

export type PromotionOperationsUserStatus = "active" | "inactive" | "suspended";

export interface PromotionOperationsUserSummary {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  role: PromotionOperationsUserRole;
  status: PromotionOperationsUserStatus;
}

export interface PromotionOperationsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* =========================================================
 * User Voucher
 * ======================================================= */

export type UserVoucherStatus =
  | "available"
  | "reserved"
  | "used"
  | "expired"
  | "cancelled";

export type UserVoucherSourceType =
  | "promotion"
  | "referral"
  | "first_booking"
  | "admin";

export interface UserVoucherSummary {
  id: number;
  code: string;
  audience: "client" | "therapist";
  discountType: "fixed" | "percent";
  discountValue: number;
}

export interface AdminUserVoucherItem {
  id: number;
  user: PromotionOperationsUserSummary;
  voucher: UserVoucherSummary;
  status: UserVoucherStatus;
  sourceType: UserVoucherSourceType;
  sourceReferenceId: string | null;
  expiresAt: string | null;
  reservedAt: string | null;
  reservedBookingId: number | null;
  usedAt: string | null;
  usedBookingId: number | null;
  createdAt: string;
}

export interface AdminUserVoucherListResponse {
  items: AdminUserVoucherItem[];
  pagination: PromotionOperationsPagination;
}

export interface AdminUserVoucherListQuery {
  page?: number;
  limit?: number;
  q?: string;
  userId?: number;
  voucherId?: number;
  status?: UserVoucherStatus | "";
  sourceType?: UserVoucherSourceType | "";
}

export interface AdminGrantUserVoucherPayload {
  userId: number;
  voucherId: number;
  expiresAt?: string;
}

export interface AdminGrantUserVoucherResponse {
  id: number;
  userId: number;
  voucherId: number;
  status: UserVoucherStatus;
  sourceType: UserVoucherSourceType;
  expiresAt: string | null;
  createdAt: string;
}

export async function getAdminUserVouchers(
  query: AdminUserVoucherListQuery = {}
) {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.userId) params.set("userId", String(query.userId));
  if (query.voucherId) params.set("voucherId", String(query.voucherId));
  if (query.status) params.set("status", query.status);
  if (query.sourceType) params.set("sourceType", query.sourceType);

  const queryString = params.toString();

  return apiRequest<AdminUserVoucherListResponse>(
    `/admin/promotion-operations/user-vouchers${
      queryString ? `?${queryString}` : ""
    }`
  );
}

export function grantAdminUserVoucher(payload: AdminGrantUserVoucherPayload) {
  return apiRequest<AdminGrantUserVoucherResponse>(
    "/admin/promotion-operations/user-vouchers/grant",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function cancelAdminUserVoucher(id: number) {
  return apiRequest<AdminUserVoucherItem>(
    `/admin/promotion-operations/user-vouchers/${id}/cancel`,
    {
      method: "PATCH",
    }
  );
}

/* =========================================================
 * Referral
 * ======================================================= */

export type ReferralStatus = "pending" | "qualified" | "rewarded" | "invalid";

export interface AdminReferralUserSummary {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  role: PromotionOperationsUserRole;
}

export interface AdminReferralCodeSummary {
  id: number;
  code: string;
}

export interface AdminReferralItem {
  id: number;
  referrerUserId: number;
  referredUserId: number;
  referralCodeId: number;
  referralCodeSnapshot: string;
  status: ReferralStatus;
  qualifiedAt: string | null;
  rewardedAt: string | null;
  createdAt: string;
  referrer: AdminReferralUserSummary;
  referredUser: AdminReferralUserSummary;
  referralCode: AdminReferralCodeSummary;
}

export interface AdminReferralListResponse {
  items: AdminReferralItem[];
  pagination: PromotionOperationsPagination;
}

export interface AdminReferralListQuery {
  page?: number;
  limit?: number;
  q?: string;
  status?: ReferralStatus | "";
  referrerUserId?: number;
  referredUserId?: number;
}

export async function getAdminReferrals(query: AdminReferralListQuery = {}) {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.status) params.set("status", query.status);

  if (query.referrerUserId) {
    params.set("referrerUserId", String(query.referrerUserId));
  }

  if (query.referredUserId) {
    params.set("referredUserId", String(query.referredUserId));
  }

  const queryString = params.toString();

  return apiRequest<AdminReferralListResponse>(
    `/admin/promotion-operations/referrals${
      queryString ? `?${queryString}` : ""
    }`
  );
}

/* =========================================================
 * Referral Codes
 * ======================================================= */

export interface AdminReferralCodeItem {
  id: number;
  userId: number;
  code: string;
  isActive: boolean;
  createdAt: string;
  user: AdminReferralUserSummary;
}

export interface AdminReferralCodeListResponse {
  items: AdminReferralCodeItem[];
  pagination: PromotionOperationsPagination;
}

export interface AdminReferralCodeListQuery {
  page?: number;
  limit?: number;
  q?: string;
  userId?: number;
  isActive?: boolean | "";
}

export async function getAdminReferralCodes(
  query: AdminReferralCodeListQuery = {}
) {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.userId) params.set("userId", String(query.userId));

  if (query.isActive !== undefined && query.isActive !== "") {
    params.set("isActive", String(query.isActive));
  }

  const queryString = params.toString();

  return apiRequest<AdminReferralCodeListResponse>(
    `/admin/promotion-operations/referral-codes${
      queryString ? `?${queryString}` : ""
    }`
  );
}

/* =========================================================
 * Promotion Usage / Reward History
 * ======================================================= */

export interface AdminPromotionUsageUserSummary {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  role: PromotionOperationsUserRole;
}

export interface AdminPromotionUsageItem {
  id: number;

  promotionId: number;
  promotionCode: string;

  userId: number;
  user: AdminPromotionUsageUserSummary;

  bookingId: number | null;
  bookingCode: string | null;

  referralId: number | null;

  rewardAmount: number;

  uniqueKey: string;

  createdAt: string;
}

export interface AdminPromotionUsageListResponse {
  items: AdminPromotionUsageItem[];

  pagination: PromotionOperationsPagination;
}

export interface AdminPromotionUsageListQuery {
  page?: number;
  limit?: number;
  q?: string;

  promotionId?: number;
  userId?: number;
  bookingId?: number;
  referralId?: number;
}

export async function getAdminPromotionUsages(
  query: AdminPromotionUsageListQuery = {},
) {
  const params = new URLSearchParams();

  if (query.page) {
    params.set("page", String(query.page));
  }

  if (query.limit) {
    params.set("limit", String(query.limit));
  }

  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }

  if (query.promotionId) {
    params.set("promotionId", String(query.promotionId));
  }

  if (query.userId) {
    params.set("userId", String(query.userId));
  }

  if (query.bookingId) {
    params.set("bookingId", String(query.bookingId));
  }

  if (query.referralId) {
    params.set("referralId", String(query.referralId));
  }

  const queryString = params.toString();

  return apiRequest<AdminPromotionUsageListResponse>(
    `/admin/promotion-operations/promotion-usages${
      queryString ? `?${queryString}` : ""
    }`,
  );
}

/* =========================================================
 * Wallets
 * ======================================================= */

export type WalletType = "main" | "promotion";

export type WalletTransactionType =
  | "topup"
  | "withdraw"
  | "payment"
  | "refund"
  | "adjustment"
  | "promotion_reward";

export interface AdminWalletUserSummary {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  role: PromotionOperationsUserRole;
}

export interface AdminWalletItem {
  id: number;

  type: WalletType;

  balance: number;

  user: AdminWalletUserSummary;

  createdAt: string;
  updatedAt: string;
}

export interface AdminWalletListResponse {
  items: AdminWalletItem[];

  pagination: PromotionOperationsPagination;
}

export interface AdminWalletListQuery {
  page?: number;
  limit?: number;
  q?: string;

  userId?: number;

  role?: PromotionOperationsUserRole | "";

  walletType?: WalletType | "";
}

export async function getAdminWallets(
  query: AdminWalletListQuery = {},
) {
  const params = new URLSearchParams();

  if (query.page) {
    params.set("page", String(query.page));
  }

  if (query.limit) {
    params.set("limit", String(query.limit));
  }

  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }

  if (query.userId) {
    params.set("userId", String(query.userId));
  }

  if (query.role) {
    params.set("role", query.role);
  }

  if (query.walletType) {
    params.set("walletType", query.walletType);
  }

  const queryString = params.toString();

  return apiRequest<AdminWalletListResponse>(
    `/admin/promotion-operations/wallets${
      queryString ? `?${queryString}` : ""
    }`,
  );
}

/* =========================================================
 * Wallet Transactions
 * ======================================================= */

export interface AdminWalletTransactionItem {
  id: number;

  walletId: number;

  walletType: WalletType;

  user: AdminWalletUserSummary;

  amount: number;

  type: WalletTransactionType;

  referenceId: string | null;

  description: string | null;

  createdAt: string;
}

export interface AdminWalletTransactionListResponse {
  items: AdminWalletTransactionItem[];

  pagination: PromotionOperationsPagination;
}

export interface AdminWalletTransactionListQuery {
  page?: number;
  limit?: number;
  q?: string;

  userId?: number;

  walletId?: number;

  walletType?: WalletType | "";

  type?: WalletTransactionType | "";

  referenceId?: string;
}

export async function getAdminWalletTransactions(
  query: AdminWalletTransactionListQuery = {},
) {
  const params = new URLSearchParams();

  if (query.page) {
    params.set("page", String(query.page));
  }

  if (query.limit) {
    params.set("limit", String(query.limit));
  }

  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }

  if (query.userId) {
    params.set("userId", String(query.userId));
  }

  if (query.walletId) {
    params.set("walletId", String(query.walletId));
  }

  if (query.walletType) {
    params.set("walletType", query.walletType);
  }

  if (query.type) {
    params.set("type", query.type);
  }

  if (query.referenceId?.trim()) {
    params.set(
      "referenceId",
      query.referenceId.trim(),
    );
  }

  const queryString = params.toString();

  return apiRequest<AdminWalletTransactionListResponse>(
    `/admin/promotion-operations/wallet-transactions${
      queryString ? `?${queryString}` : ""
    }`,
  );
}
