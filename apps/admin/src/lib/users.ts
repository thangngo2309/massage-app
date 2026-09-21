import { apiRequest } from "@/lib/api";

import type { AuthUser, UserRole } from "@/lib/auth";

export type UserStatus = "active" | "inactive" | "suspended";

export interface UserListQuery {
  page?: number;
  limit?: number;
  q?: string;
  role?: UserRole | "";
  status?: UserStatus | "";
}

export interface UserListResponse {
  items: AuthUser[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getUsers(query: UserListQuery) {
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

  if (query.role) {
    params.set("role", query.role);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  return apiRequest<UserListResponse>(`/admin/users?${params.toString()}`);
}

export function updateUserStatus(userId: number, status: UserStatus) {
  return apiRequest<AuthUser>(`/admin/users/${userId}/status`, {
    method: "PATCH",

    body: JSON.stringify({
      status,
    }),
  });
}

export interface SaveUserPayload {
  fullName: string;
  phone: string;
  email?: string | null;
  password?: string;
  role: UserRole;
}

export function createUser(
  payload: SaveUserPayload & {
    password: string;
  }
) {
  return apiRequest<AuthUser>("/admin/users", {
    method: "POST",

    body: JSON.stringify(payload),
  });
}

export function updateUser(userId: number, payload: Partial<SaveUserPayload>) {
  return apiRequest<AuthUser>(`/admin/users/${userId}`, {
    method: "PATCH",

    body: JSON.stringify(payload),
  });
}

export interface RepairUserProfileResponse {
  repaired: boolean;
  profileType: "client" | "therapist";
  profileId: number;
  message: string;
}

export function repairUserProfile(userId: number) {
  return apiRequest<RepairUserProfileResponse>(
    `/admin/users/${userId}/repair-profile`,
    {
      method: "POST",
    }
  );
}
