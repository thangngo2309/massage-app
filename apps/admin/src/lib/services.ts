import { apiRequest } from "@/lib/api";

export interface ServiceOptionItem {
  id: number;
  serviceId: number;
  label: string | null;
  durationMinutes: number;
  defaultPrice: number;
  isActive: boolean;
}

export interface MassageServiceItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  optionCount: number;
}

export interface MassageServiceDetail extends MassageServiceItem {
  options: ServiceOptionItem[];
}

export interface ServiceListResponse {
  items: MassageServiceItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ServiceListQuery {
  page?: number;
  limit?: number;
  q?: string;
  isActive?: boolean;
}

export interface SaveServicePayload {
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface SaveServiceOptionPayload {
  label?: string | null;
  durationMinutes: number;
  defaultPrice: number;
  isActive?: boolean;
}

export async function getServices(query: ServiceListQuery) {
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

  if (query.isActive !== undefined) {
    params.set("isActive", String(query.isActive));
  }

  return apiRequest<ServiceListResponse>(
    `/admin/services?${params.toString()}`
  );
}

export function getService(id: number) {
  return apiRequest<MassageServiceDetail>(`/admin/services/${id}`);
}

export function createService(payload: SaveServicePayload) {
  return apiRequest<MassageServiceItem>("/admin/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateService(
  id: number,
  payload: Partial<SaveServicePayload>
) {
  return apiRequest<MassageServiceItem>(`/admin/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateServiceActive(id: number, isActive: boolean) {
  return apiRequest<MassageServiceItem>(`/admin/services/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({
      isActive,
    }),
  });
}

export function createServiceOption(
  serviceId: number,
  payload: SaveServiceOptionPayload
) {
  return apiRequest<ServiceOptionItem>(`/admin/services/${serviceId}/options`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateServiceOption(
  serviceId: number,
  optionId: number,
  payload: Partial<SaveServiceOptionPayload>
) {
  return apiRequest<ServiceOptionItem>(
    `/admin/services/${serviceId}/options/${optionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export function updateServiceOptionActive(
  serviceId: number,
  optionId: number,
  isActive: boolean
) {
  return apiRequest<ServiceOptionItem>(
    `/admin/services/${serviceId}/options/${optionId}/active`,
    {
      method: "PATCH",
      body: JSON.stringify({
        isActive,
      }),
    }
  );
}
