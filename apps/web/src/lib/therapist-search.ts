import { apiFetch } from "@/lib/http";

import type {
  TherapistAvailabilityCheckResult,
  TherapistAvailabilitySlotsResult,
  TherapistSearchItem,
  TherapistSearchQuery,
  TherapistSearchResponse,
} from "@/types/therapist-search";

type RawTherapistSearchResponse =
  | TherapistSearchItem[]
  | TherapistSearchResponse;

const appendOptionalNumber = (
  params: URLSearchParams,
  key: string,
  value: number | undefined
) => {
  if (value !== undefined && Number.isFinite(value)) {
    params.set(key, String(value));
  }
};

const appendOptionalString = (
  params: URLSearchParams,
  key: string,
  value: string | undefined
) => {
  const normalized = value?.trim();

  if (normalized) {
    params.set(key, normalized);
  }
};

const buildSearchQuery = (query: TherapistSearchQuery) => {
  const params = new URLSearchParams();

  params.set("serviceOptionId", String(query.serviceOptionId));
  params.set("date", query.date);
  params.set("startTime", query.startTime);

  appendOptionalNumber(params, "latitude", query.latitude);
  appendOptionalNumber(params, "longitude", query.longitude);
  appendOptionalString(params, "provinceCode", query.provinceCode);
  appendOptionalString(params, "districtCode", query.districtCode);

  if (query.sortBy) {
    params.set("sortBy", query.sortBy);
  }

  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 12));

  return params;
};

export const searchTherapists = async (query: TherapistSearchQuery) => {
  const params = buildSearchQuery(query);

  return apiFetch<TherapistSearchResponse>(
    `/therapists/search?${params.toString()}`
  );
};

export const findMatchingTherapist = async (
  therapistId: number,
  query: TherapistSearchQuery
): Promise<TherapistSearchItem | null> => {
  let page = 1;

  const limit = 50;

  while (page <= 20) {
    const result = await searchTherapists({
      ...query,
      page,
      limit,
    });

    const therapist = result.items.find(
      (item) => item.therapistId === therapistId
    );

    if (therapist) {
      return therapist;
    }

    if (result.pagination.totalPages <= page || result.items.length === 0) {
      break;
    }

    page += 1;
  }

  return null;
};

export const getTherapistAvailabilitySlots = (
  therapistId: number,
  params: {
    serviceId: number;
    serviceOptionId: number;
    date: string;
    slotInterval?: number;
  }
) => {
  const query = new URLSearchParams({
    serviceId: String(params.serviceId),
    serviceOptionId: String(params.serviceOptionId),
    date: params.date,
    slotInterval: String(params.slotInterval ?? 30),
  });

  return apiFetch<TherapistAvailabilitySlotsResult>(
    `/therapists/${therapistId}/availability/slots?${query.toString()}`
  );
};

export const checkTherapistAvailability = (
  therapistId: number,
  params: {
    serviceId: number;
    serviceOptionId: number;
    date: string;
    startTime: string;
  }
) => {
  const query = new URLSearchParams({
    serviceId: String(params.serviceId),
    serviceOptionId: String(params.serviceOptionId),
    date: params.date,
    startTime: params.startTime,
  });

  return apiFetch<TherapistAvailabilityCheckResult>(
    `/therapists/${therapistId}/availability/check?${query.toString()}`
  );
};
