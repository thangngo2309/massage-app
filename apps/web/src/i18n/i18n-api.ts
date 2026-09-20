import { apiFetch } from "@/lib/http";

import type {
  I18nLanguage,
  I18nResourcesResponse,
  I18nVersionResponse,
} from "./types";

const PUBLIC_I18N_OPTIONS = {
  auth: false,
  retryOnUnauthorized: false,
} as const;

export const getI18nLanguages = async (): Promise<I18nLanguage[]> => {
  return apiFetch<I18nLanguage[]>(
    "/i18n/languages",
    {
      method: "GET",
    },
    PUBLIC_I18N_OPTIONS
  );
};

export const getI18nVersion = async (
  language: string
): Promise<I18nVersionResponse> => {
  const params = new URLSearchParams({
    lang: language,
  });

  return apiFetch<I18nVersionResponse>(
    `/i18n/version?${params.toString()}`,
    {
      method: "GET",
    },
    PUBLIC_I18N_OPTIONS
  );
};

export const getI18nResources = async (
  language: string
): Promise<I18nResourcesResponse> => {
  const params = new URLSearchParams({
    lang: language,
  });

  return apiFetch<I18nResourcesResponse>(
    `/i18n/resources?${params.toString()}`,
    {
      method: "GET",
    },
    PUBLIC_I18N_OPTIONS
  );
};
