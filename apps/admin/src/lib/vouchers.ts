import { apiRequest } from "@/lib/api";

export type VoucherAudience = "client" | "therapist";

export type VoucherDiscountType = "fixed" | "percent";

export interface VoucherTranslationItem {
  id?: number;
  locale: string;
  name: string;
  description: string | null;
  terms: string | null;
}

export interface VoucherItem {
  id: number;
  code: string;
  audience: VoucherAudience;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  startsAt: string | null;
  endsAt: string | null;
  issuanceLimit: number | null;
  isActive: boolean;
  translations: VoucherTranslationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface VoucherListResponse {
  items: VoucherItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VoucherListQuery {
  page?: number;
  limit?: number;
  q?: string;
  audience?: VoucherAudience | "";
  discountType?: VoucherDiscountType | "";
  isActive?: boolean;
}

export interface SaveVoucherTranslationPayload {
  locale: string;
  name: string;
  description?: string | null;
  terms?: string | null;
}

export interface SaveVoucherPayload {
  code: string;
  audience?: VoucherAudience;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  issuanceLimit?: number | null;
  isActive?: boolean;
  translations: SaveVoucherTranslationPayload[];
}

export async function getVouchers(query: VoucherListQuery = {}) {
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

  if (query.audience) {
    params.set("audience", query.audience);
  }

  if (query.discountType) {
    params.set("discountType", query.discountType);
  }

  if (query.isActive !== undefined) {
    params.set("isActive", String(query.isActive));
  }

  return apiRequest<VoucherListResponse>(
    `/admin/vouchers?${params.toString()}`
  );
}

export function getVoucher(id: number) {
  return apiRequest<VoucherItem>(`/admin/vouchers/${id}`);
}

export function createVoucher(payload: SaveVoucherPayload) {
  return apiRequest<VoucherItem>("/admin/vouchers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateVoucher(
  id: number,
  payload: Partial<SaveVoucherPayload>
) {
  return apiRequest<VoucherItem>(`/admin/vouchers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateVoucherActive(id: number, isActive: boolean) {
  return apiRequest<VoucherItem>(`/admin/vouchers/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({
      isActive,
    }),
  });
}

export function deleteVoucher(id: number) {
  return apiRequest<void>(`/admin/vouchers/${id}`, {
    method: "DELETE",
  });
}
