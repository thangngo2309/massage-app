import { apiFetch } from "@/lib/http";

import type {
  TherapistAvailabilityCheckResult,
  TherapistAvailabilitySlotsResult,
  TherapistPublicServicesResponse,
  TherapistSearchItem,
  TherapistSearchQuery,
  TherapistSearchResponse,
} from "@/types/therapist-search";

const buildLanguageHeaders = (
  acceptLanguage?: string
): HeadersInit | undefined => {
  const language = acceptLanguage?.trim();

  if (!language) {
    return undefined;
  }

  return {
    "Accept-Language": language,
  };
};

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

  params.set("serviceId", String(query.serviceId));

  appendOptionalNumber(params, "latitude", query.latitude);

  appendOptionalNumber(params, "longitude", query.longitude);

  appendOptionalString(params, "provinceCode", query.provinceCode);

  appendOptionalString(params, "wardCode", query.wardCode);

  if (query.sortBy) {
    params.set("sortBy", query.sortBy);
  }

  params.set("page", String(query.page ?? 1));

  params.set("limit", String(query.limit ?? 12));

  return params;
};

const normalizeTherapistServiceIds = (values: number[]) =>
  Array.from(new Set(values)).filter(
    (value) => Number.isInteger(value) && value > 0
  );

export const searchTherapists = async (
  query: TherapistSearchQuery,
  acceptLanguage?: string
) => {
  const params = buildSearchQuery(query);

  return apiFetch<TherapistSearchResponse>(
    `/therapists/search?${params.toString()}`,
    {
      headers: buildLanguageHeaders(acceptLanguage),
    }
  );
};

export const findMatchingTherapist = async (
  therapistId: number,
  query: TherapistSearchQuery,
  acceptLanguage?: string
): Promise<TherapistSearchItem | null> => {
  let page = 1;

  const limit = 50;

  while (page <= 20) {
    const result = await searchTherapists(
      {
        ...query,

        page,

        limit,
      },
      acceptLanguage
    );

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

/**
 * ==========================================================
 * PUBLIC THERAPIST SERVICES
 * ==========================================================
 */

export const getTherapistPublicServices = (
  therapistId: number,
  acceptLanguage?: string
) => {
  return apiFetch<TherapistPublicServicesResponse>(
    `/therapists/${therapistId}/services`,
    {
      headers: buildLanguageHeaders(acceptLanguage),
    }
  );
};

/**
 * ==========================================================
 * AVAILABILITY
 * ==========================================================
 */

export const getTherapistAvailabilitySlots = (
  therapistId: number,

  params: {
    therapistServiceIds: number[];

    date: string;

    slotInterval?: number;
  }
) => {
  const therapistServiceIds = normalizeTherapistServiceIds(
    params.therapistServiceIds
  );

  const query = new URLSearchParams({
    therapistServiceIds: therapistServiceIds.join(","),

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
    therapistServiceIds: number[];

    date: string;

    startTime: string;
  }
) => {
  const therapistServiceIds = normalizeTherapistServiceIds(
    params.therapistServiceIds
  );

  const query = new URLSearchParams({
    therapistServiceIds: therapistServiceIds.join(","),

    date: params.date,

    startTime: params.startTime,
  });

  return apiFetch<TherapistAvailabilityCheckResult>(
    `/therapists/${therapistId}/availability/check?${query.toString()}`
  );
};
