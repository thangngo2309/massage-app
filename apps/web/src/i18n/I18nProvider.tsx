"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

import { I18nextProvider } from "react-i18next";

import i18n, { DEFAULT_LANGUAGE, LOCAL_LANGUAGES } from "./config";

import { getI18nLanguages, getI18nResources, getI18nVersion } from "./i18n-api";

import {
  getStoredLanguage,
  getStoredResources,
  getStoredVersion,
  setStoredLanguage,
  setStoredResources,
  setStoredVersion,
} from "./i18n-cache";

import type { I18nLanguage, I18nResourcePack } from "./types";

import { useLanguageStore } from "@/stores/language-store";

type I18nContextValue = {
  changeLanguage: (language: string) => Promise<void>;
};

const AppI18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  children: React.ReactNode;
};

const applyResources = (language: string, resources: I18nResourcePack) => {
  Object.entries(resources).forEach(([namespace, values]) => {
    i18n.addResourceBundle(language, namespace, values, true, true);
  });
};

const normalizeLanguageCode = (value: string) => {
  return value.trim().toLowerCase().split("-")[0];
};

const resolveLanguage = (languages: I18nLanguage[]): string => {
  const supportedCodes = new Set(
    languages.map((item) => item.code.toLowerCase())
  );

  /**
   * 1. Ưu tiên language user đã chọn trước đó.
   */
  const stored = getStoredLanguage();

  if (stored) {
    const storedLanguage = languages.find(
      (item) => item.code.toLowerCase() === stored.toLowerCase()
    );

    if (storedLanguage) {
      return storedLanguage.code;
    }
  }

  /**
   * 2. Kiểm tra language của browser.
   */
  if (typeof navigator !== "undefined") {
    const candidates = [
      ...(navigator.languages ?? []),
      navigator.language,
    ].filter((value): value is string => Boolean(value));

    for (const candidate of candidates) {
      const exact = candidate.toLowerCase();

      /**
       * Exact match:
       *
       * en-US -> en-US
       */
      if (supportedCodes.has(exact)) {
        const exactLanguage = languages.find(
          (item) => item.code.toLowerCase() === exact
        );

        if (exactLanguage) {
          return exactLanguage.code;
        }
      }

      /**
       * Base language match:
       *
       * en-US -> en
       * vi-VN -> vi
       */
      const base = normalizeLanguageCode(candidate);

      const matchedLanguage = languages.find(
        (item) => normalizeLanguageCode(item.code) === base
      );

      if (matchedLanguage) {
        return matchedLanguage.code;
      }
    }
  }

  /**
   * 3. Default language do Backend khai báo.
   */
  const defaultLanguage = languages.find((item) => item.isDefault);

  if (defaultLanguage) {
    return defaultLanguage.code;
  }

  /**
   * 4. Fallback cuối cùng.
   */
  return DEFAULT_LANGUAGE;
};

export const I18nProvider = ({ children }: I18nProviderProps) => {
  const initializedRef = useRef(false);

  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const setLanguages = useLanguageStore((state) => state.setLanguages);

  const setBootstrapped = useLanguageStore((state) => state.setBootstrapped);

  const syncRemoteResources = useCallback(async (language: string) => {
    try {
      const versionResponse = await getI18nVersion(language);

      const localVersion = getStoredVersion(language);

      if (localVersion === versionResponse.version) {
        return;
      }

      const resourceResponse = await getI18nResources(language);

      applyResources(language, resourceResponse.resources);

      setStoredResources(language, resourceResponse.resources);

      setStoredVersion(language, resourceResponse.version);

      if (i18n.language === language) {
        /**
         * React-i18next mặc định theo dõi
         * languageChanged.
         *
         * Gọi lại changeLanguage để UI
         * render resource BE vừa override.
         */
        await i18n.changeLanguage(language);
      }
    } catch (error) {
      /**
       * Không throw.
       *
       * Web vẫn hoạt động bằng:
       * - bundled resource
       * - cache resource
       */
      console.warn("[i18n] Unable to sync remote resources", error);
    }
  }, []);

  const activateLanguage = useCallback(
    async (language: string) => {
      const cachedResources = getStoredResources(language);

      if (cachedResources) {
        applyResources(language, cachedResources);
      }

      setStoredLanguage(language);

      setLanguage(language);

      if (typeof document !== "undefined") {
        document.documentElement.lang = language;
      }

      await i18n.changeLanguage(language);

      /**
       * Không block UI chờ BE.
       *
       * Resource local/cache đã render được.
       */
      void syncRemoteResources(language);
    },
    [setLanguage, syncRemoteResources]
  );

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const bootstrap = async () => {
      let languages: I18nLanguage[] = LOCAL_LANGUAGES;

      try {
        const remoteLanguages = await getI18nLanguages();

        if (remoteLanguages.length > 0) {
          languages = remoteLanguages;
        }
      } catch (error) {
        console.warn("[i18n] Unable to load languages", error);
      }

      setLanguages(languages);

      const initialLanguage = resolveLanguage(languages);

      await activateLanguage(initialLanguage);

      setBootstrapped(true);
    };

    void bootstrap();
  }, [activateLanguage, setBootstrapped, setLanguages]);

  return (
    <I18nextProvider i18n={i18n}>
      <AppI18nContext.Provider
        value={{
          changeLanguage: activateLanguage,
        }}
      >
        {children}
      </AppI18nContext.Provider>
    </I18nextProvider>
  );
};

export const useAppI18n = () => {
  const context = useContext(AppI18nContext);

  if (!context) {
    throw new Error("useAppI18n must be used inside I18nProvider");
  }

  return context;
};
