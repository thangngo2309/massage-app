import type { I18nResourcePack } from "./types";

const CACHE_VERSION = "v2";

const LANGUAGE_KEY = "massage:i18n:language";

const getVersionKey = (language: string) =>
  `massage:i18n:${CACHE_VERSION}:${language}:version`;

const getResourcesKey = (language: string) =>
  `massage:i18n:${CACHE_VERSION}:${language}:resources`;

const canUseStorage = () => typeof window !== "undefined";

export const getStoredLanguage = () => {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(LANGUAGE_KEY);
};

export const setStoredLanguage = (language: string) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(LANGUAGE_KEY, language);
};

export const getStoredVersion = (language: string) => {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(getVersionKey(language));
};

export const setStoredVersion = (language: string, version: string) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(getVersionKey(language), version);
};

export const removeStoredVersion = (language: string) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(getVersionKey(language));
};

export const getStoredResources = (
  language: string
): I18nResourcePack | null => {
  if (!canUseStorage()) {
    return null;
  }

  const key = getResourcesKey(language);

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as I18nResourcePack;
  } catch {
    /**
     * Cache hỏng thì xóa luôn,
     * tránh lỗi lặp lại ở lần sau.
     */
    window.localStorage.removeItem(key);

    return null;
  }
};

export const setStoredResources = (
  language: string,
  resources: I18nResourcePack
) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    getResourcesKey(language),
    JSON.stringify(resources)
  );
};

export const removeStoredResources = (language: string) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(getResourcesKey(language));
};
