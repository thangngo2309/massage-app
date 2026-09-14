import { apiRequest } from "@/lib/api";

export type TherapistSearchSort = "distance" | "rating" | "price";

export interface TherapistSearchItem {
  therapistId: number;
  userId: number;

  fullName: string;
  avatarUrl: string | null;

  serviceOptionId: number;

  serviceName: string;
  optionLabel: string | null;

  durationMinutes: number;

  price: number;
  platformFeeRate: number;

  experienceYears: number;

  ratingAverage: number;
  ratingCount: number;

  completedBookings: number;

  onlineStatus: string;

  distanceKm: number | null;

  available: boolean;
}

export interface TherapistSearchResponse {
  items: TherapistSearchItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchTherapistsParams {
  serviceOptionId: number;

  date: string;
  startTime: string;

  latitude?: number;
  longitude?: number;

  provinceCode?: string;
  districtCode?: string;

  sortBy?: TherapistSearchSort;

  page?: number;
  limit?: number;
}

export function searchTherapists(params: SearchTherapistsParams) {
  const searchParams = new URLSearchParams();

  searchParams.set("serviceOptionId", String(params.serviceOptionId));
  searchParams.set("date", params.date);
  searchParams.set("startTime", params.startTime);

  if (params.latitude !== undefined) {
    searchParams.set("latitude", String(params.latitude));
  }

  if (params.longitude !== undefined) {
    searchParams.set("longitude", String(params.longitude));
  }

  if (params.provinceCode) {
    searchParams.set("provinceCode", params.provinceCode);
  }

  if (params.districtCode) {
    searchParams.set("districtCode", params.districtCode);
  }

  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  return apiRequest<TherapistSearchResponse>(
    `/therapists/search?${searchParams.toString()}`
  );
}
