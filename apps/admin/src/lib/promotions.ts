import { apiRequest } from "@/lib/api";

export type PromotionAudience = "client" | "therapist";

export type PromotionTriggerType =
  | "registration_completed"
  | "referral_code_entered"
  | "referral_qualified"
  | "first_booking_eligible"
  | "first_booking_completed";

export type PromotionRewardType = "wallet_credit" | "voucher";

export type PromotionRewardRecipient = "actor" | "referrer";

export interface PromotionTranslationItem {
  id?: number;

  locale: string;

  name: string;

  description: string | null;
}

export interface PromotionItem {
  id: number;

  code: string;

  audience: PromotionAudience;

  triggerType: PromotionTriggerType;

  rewardType: PromotionRewardType;

  rewardRecipient: PromotionRewardRecipient;

  rewardValue: number;

  voucherId: number | null;

  startsAt: string | null;

  endsAt: string | null;

  usageLimit: number | null;

  usageLimitPerUser: number | null;

  isActive: boolean;

  translations: PromotionTranslationItem[];

  createdAt: string;

  updatedAt: string;
}

export interface PromotionListResponse {
  items: PromotionItem[];

  pagination: {
    page: number;

    limit: number;

    total: number;

    totalPages: number;
  };
}

export interface PromotionListQuery {
  page?: number;

  limit?: number;

  q?: string;

  audience?: PromotionAudience | "";

  triggerType?: PromotionTriggerType | "";

  rewardType?: PromotionRewardType | "";

  isActive?: boolean;
}

export interface SavePromotionTranslationPayload {
  locale: string;

  name: string;

  description?: string | null;
}

export interface SavePromotionPayload {
  code: string;

  audience: PromotionAudience;

  triggerType: PromotionTriggerType;

  rewardType: PromotionRewardType;

  rewardRecipient: PromotionRewardRecipient;

  rewardValue?: number;

  voucherId?: number | null;

  startsAt?: string | null;

  endsAt?: string | null;

  usageLimit?: number | null;

  usageLimitPerUser?: number | null;

  isActive?: boolean;

  translations: SavePromotionTranslationPayload[];
}

export async function getPromotions(query: PromotionListQuery) {
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

  if (query.triggerType) {
    params.set("triggerType", query.triggerType);
  }

  if (query.rewardType) {
    params.set("rewardType", query.rewardType);
  }

  if (query.isActive !== undefined) {
    params.set("isActive", String(query.isActive));
  }

  return apiRequest<PromotionListResponse>(
    `/admin/promotions?${params.toString()}`
  );
}

export function getPromotion(id: number) {
  return apiRequest<PromotionItem>(`/admin/promotions/${id}`);
}

export function createPromotion(payload: SavePromotionPayload) {
  return apiRequest<PromotionItem>("/admin/promotions", {
    method: "POST",

    body: JSON.stringify(payload),
  });
}

export function updatePromotion(
  id: number,

  payload: Partial<SavePromotionPayload>
) {
  return apiRequest<PromotionItem>(`/admin/promotions/${id}`, {
    method: "PATCH",

    body: JSON.stringify(payload),
  });
}

export function updatePromotionActive(
  id: number,

  isActive: boolean
) {
  return apiRequest<PromotionItem>(`/admin/promotions/${id}/active`, {
    method: "PATCH",

    body: JSON.stringify({
      isActive,
    }),
  });
}

export function deletePromotion(id: number) {
  return apiRequest<{
    success: boolean;

    id: number;
  }>(`/admin/promotions/${id}`, {
    method: "DELETE",
  });
}
