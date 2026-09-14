import { apiRequest } from "@/lib/api";

export type VerificationStatus = "pending" | "verified" | "rejected";
export type OnlineStatus = "offline" | "online" | "busy";
export type Gender = "unknown" | "male" | "female" | "other";
export type ServiceAreaType = "district" | "radius";

export interface TherapistListItem {
  id: number;
  profileId: number | null;

  fullName: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;

  status: string;

  verificationStatus: VerificationStatus;
  onlineStatus: OnlineStatus;

  isAcceptingBookings: boolean;

  experienceYears: number;

  ratingAverage: number;
  ratingCount: number;

  completedBookings: number;

  createdAt: string;
}

export interface TherapistServiceItem {
  id: number;
  serviceOptionId: number;
  price: number;
  platformFeeRate: number;
  isActive: boolean;

  option: {
    id: number;
    label: string | null;
    durationMinutes: number;
    defaultPrice: number;

    service: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

export interface WorkingHourItem {
  id: number;
  therapistId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ScheduleExceptionItem {
  id: number;
  therapistId: number;
  date: string;
  isDayOff: boolean;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
}

export interface ServiceAreaItem {
  id: number;
  therapistId: number;
  type: ServiceAreaType;

  areaName: string | null;
  provinceCode: string | null;
  districtCode: string | null;

  centerLatitude: number | null;
  centerLongitude: number | null;
  radiusKm: number | null;

  isActive: boolean;
}

export interface TherapistDetail {
  id: number;
  userId: number;

  bio: string | null;
  gender: Gender;
  dateOfBirth: string | null;
  experienceYears: number;

  verificationStatus: VerificationStatus;
  onlineStatus: OnlineStatus;

  isAcceptingBookings: boolean;
  serviceRadiusKm: number;

  currentLatitude: number | null;
  currentLongitude: number | null;

  ratingAverage: number;
  ratingCount: number;
  completedBookings: number;

  user: {
    id: number;
    fullName: string;
    phone: string;
    email: string | null;
    avatarUrl: string | null;
    role: string;
    status: string;
  };

  services: TherapistServiceItem[];

  workingHours: WorkingHourItem[];

  scheduleExceptions: ScheduleExceptionItem[];

  serviceAreas: ServiceAreaItem[];
}

export interface TherapistListResponse {
  items: TherapistListItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ServiceOptionLookup {
  id: number;
  serviceId: number;
  serviceName: string;
  label: string | null;
  durationMinutes: number;
  defaultPrice: number;
  isActive: boolean;
  serviceIsActive: boolean;
}

export function getTherapists(query: {
  page?: number;
  limit?: number;
  q?: string;
  verificationStatus?: VerificationStatus | "";
  onlineStatus?: OnlineStatus | "";
  isAcceptingBookings?: boolean;
}) {
  const params = new URLSearchParams();

  if (query.page) {
    params.set("page", String(query.page));
  }

  if (query.limit) {
    params.set("limit", String(query.limit));
  }

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.verificationStatus) {
    params.set("verificationStatus", query.verificationStatus);
  }

  if (query.onlineStatus) {
    params.set("onlineStatus", query.onlineStatus);
  }

  if (query.isAcceptingBookings !== undefined) {
    params.set("isAcceptingBookings", String(query.isAcceptingBookings));
  }

  return apiRequest<TherapistListResponse>(
    `/admin/therapists?${params.toString()}`
  );
}

export function getTherapist(userId: number) {
  return apiRequest<TherapistDetail>(`/admin/therapists/${userId}`);
}

export function updateTherapistProfile(
  userId: number,
  payload: {
    bio?: string | null;
    gender?: Gender;
    dateOfBirth?: string | null;
    experienceYears?: number;
    isAcceptingBookings?: boolean;
    serviceRadiusKm?: number;
  }
) {
  return apiRequest(`/admin/therapists/${userId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateTherapistVerification(
  userId: number,
  verificationStatus: VerificationStatus
) {
  return apiRequest(`/admin/therapists/${userId}/verification`, {
    method: "PATCH",
    body: JSON.stringify({
      verificationStatus,
    }),
  });
}

export function getTherapistServiceOptions() {
  return apiRequest<ServiceOptionLookup[]>(
    "/admin/therapists/lookups/service-options"
  );
}

export function createTherapistService(
  userId: number,
  payload: {
    serviceOptionId: number;
    price: number;
    platformFeeRate?: number;
    isActive?: boolean;
  }
) {
  return apiRequest(`/admin/therapists/${userId}/services`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTherapistService(
  userId: number,
  itemId: number,
  payload: {
    price?: number;
    platformFeeRate?: number;
    isActive?: boolean;
  }
) {
  return apiRequest(`/admin/therapists/${userId}/services/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createWorkingHour(
  userId: number,
  payload: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive?: boolean;
  }
) {
  return apiRequest(`/admin/therapists/${userId}/working-hours`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateWorkingHour(
  userId: number,
  itemId: number,
  payload: Partial<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>
) {
  return apiRequest(`/admin/therapists/${userId}/working-hours/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createScheduleException(
  userId: number,
  payload: {
    date: string;
    isDayOff: boolean;
    startTime?: string | null;
    endTime?: string | null;
    note?: string | null;
  }
) {
  return apiRequest(`/admin/therapists/${userId}/schedule-exceptions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateScheduleException(
  userId: number,
  itemId: number,
  payload: Record<string, unknown>
) {
  return apiRequest(
    `/admin/therapists/${userId}/schedule-exceptions/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export function deleteScheduleException(userId: number, itemId: number) {
  return apiRequest(
    `/admin/therapists/${userId}/schedule-exceptions/${itemId}`,
    {
      method: "DELETE",
    }
  );
}

export function createServiceArea(
  userId: number,
  payload: Record<string, unknown>
) {
  return apiRequest(`/admin/therapists/${userId}/service-areas`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateServiceArea(
  userId: number,
  itemId: number,
  payload: Record<string, unknown>
) {
  return apiRequest(`/admin/therapists/${userId}/service-areas/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteWorkingHour(userId: number, itemId: number) {
  return apiRequest<{
    success: boolean;
  }>(`/admin/therapists/${userId}/working-hours/${itemId}`, {
    method: "DELETE",
  });
}

export function deleteServiceArea(userId: number, itemId: number) {
  return apiRequest<{
    success: boolean;
  }>(`/admin/therapists/${userId}/service-areas/${itemId}`, {
    method: "DELETE",
  });
}
