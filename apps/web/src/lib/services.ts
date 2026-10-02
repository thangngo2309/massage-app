import { apiFetch } from "@/lib/http";

import type { Service, ServiceListItem } from "@/types/service";

const SERVICES_PATH = "/services";

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

export const getClientServices = (acceptLanguage?: string) => {
  return apiFetch<ServiceListItem[]>(SERVICES_PATH, {
    headers: buildLanguageHeaders(acceptLanguage),
  });
};

export const getClientService = (id: number, acceptLanguage?: string) => {
  return apiFetch<Service>(`${SERVICES_PATH}/${id}`, {
    headers: buildLanguageHeaders(acceptLanguage),
  });
};
