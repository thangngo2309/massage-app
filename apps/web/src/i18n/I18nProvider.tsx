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

const normalizeLanguageCode = (value: string) => {
  return value.trim().toLowerCase().split("-")[0];
};

/**
 * Kiểm tra resource pack thực sự
 * có dữ liệu hay không.
 */
const hasUsableResources = (
  resources: I18nResourcePack | null | undefined
): resources is I18nResourcePack => {
  if (!resources) {
    return false;
  }

  const namespaces = Object.values(resources);

  if (namespaces.length === 0) {
    return false;
  }

  return namespaces.some((namespace) => {
    return (
      namespace !== null &&
      typeof namespace === "object" &&
      Object.keys(namespace).length > 0
    );
  });
};

/**
 * Kiểm tra i18next hiện đã có
 * resource của language chưa.
 *
 * Hữu ích nếu sau này bạn muốn
 * bundle một số translation local.
 */
const hasLoadedResources = (language: string) => {
  const data = i18n.getDataByLanguage(language);

  if (!data) {
    return false;
  }

  return Object.values(data).some(
    (namespace) =>
      namespace &&
      typeof namespace === "object" &&
      Object.keys(namespace).length > 0
  );
};

const applyResources = (language: string, resources: I18nResourcePack) => {
  Object.entries(resources).forEach(([namespace, values]) => {
    i18n.addResourceBundle(language, namespace, values, true, true);
  });
};

const isSameLanguage = (left: string, right: string) => {
  return normalizeLanguageCode(left) === normalizeLanguageCode(right);
};

const resolveLanguage = (languages: I18nLanguage[]): string => {
  /**
   * 1. Language user đã chọn.
   */
  const stored = getStoredLanguage();

  if (stored) {
    const matched = languages.find(
      (item) => item.code.toLowerCase() === stored.toLowerCase()
    );

    if (matched) {
      return matched.code;
    }
  }

  /**
   * 2. Language của browser.
   */
  if (typeof navigator !== "undefined") {
    const candidates = [
      ...(navigator.languages ?? []),
      navigator.language,
    ].filter((value): value is string => Boolean(value));

    for (const candidate of candidates) {
      const exact = candidate.toLowerCase();

      const exactMatch = languages.find(
        (item) => item.code.toLowerCase() === exact
      );

      if (exactMatch) {
        return exactMatch.code;
      }

      const base = normalizeLanguageCode(candidate);

      const baseMatch = languages.find(
        (item) => normalizeLanguageCode(item.code) === base
      );

      if (baseMatch) {
        return baseMatch.code;
      }
    }
  }

  /**
   * 3. Default từ Backend.
   */
  const defaultLanguage = languages.find((item) => item.isDefault);

  if (defaultLanguage) {
    return defaultLanguage.code;
  }

  /**
   * 4. Fallback cuối.
   */
  return DEFAULT_LANGUAGE;
};

/**
 * Validate nếu Backend có trả
 * field language.
 *
 * Tránh trường hợp gọi lang=en
 * nhưng Backend trả resource vi.
 */
const validateResponseLanguage = (
  requestedLanguage: string,
  responseLanguage?: string
) => {
  if (!responseLanguage) {
    return true;
  }

  return isSameLanguage(requestedLanguage, responseLanguage);
};

export const I18nProvider = ({ children }: I18nProviderProps) => {
  const initializedRef = useRef(false);

  /**
   * Tránh nhiều request resource
   * cùng language chạy song song.
   */
  const resourceRequestsRef = useRef(new Map<string, Promise<boolean>>());

  const language = useLanguageStore((state) => state.language);

  const bootstrapped = useLanguageStore((state) => state.bootstrapped);

  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const setLanguages = useLanguageStore((state) => state.setLanguages);

  const setBootstrapped = useLanguageStore((state) => state.setBootstrapped);

  const setIsChanging = useLanguageStore((state) => state.setIsChanging);

  /**
   * Fetch resource từ Backend,
   * apply vào i18next và ghi cache.
   */
  const fetchAndApplyResources = useCallback(
    async (targetLanguage: string): Promise<boolean> => {
      const requestKey = normalizeLanguageCode(targetLanguage);

      const existingRequest = resourceRequestsRef.current.get(requestKey);

      if (existingRequest) {
        return existingRequest;
      }

      const request = (async () => {
        try {
          const response = await getI18nResources(targetLanguage);

          if (!validateResponseLanguage(targetLanguage, response.language)) {
            console.warn(
              `[i18n] Backend returned language "${response.language}" while "${targetLanguage}" was requested.`
            );

            return false;
          }

          if (!hasUsableResources(response.resources)) {
            console.warn(
              `[i18n] Backend returned empty resources for "${targetLanguage}".`
            );

            return false;
          }

          applyResources(targetLanguage, response.resources);

          setStoredResources(targetLanguage, response.resources);

          setStoredVersion(targetLanguage, String(response.version));

          return true;
        } catch (error) {
          console.warn(
            `[i18n] Unable to load resources for "${targetLanguage}"`,
            error
          );

          return false;
        } finally {
          resourceRequestsRef.current.delete(requestKey);
        }
      })();

      resourceRequestsRef.current.set(requestKey, request);

      return request;
    },
    []
  );

  /**
   * Kiểm tra version Backend.
   *
   * Chỉ skip fetch resource nếu:
   *
   * - version giống nhau
   * - cache resource vẫn tồn tại
   * - cache resource có dữ liệu.
   */
  const syncRemoteResources = useCallback(
    async (targetLanguage: string) => {
      try {
        const versionResponse = await getI18nVersion(targetLanguage);

        const remoteVersion = String(versionResponse.version);

        const localVersion = getStoredVersion(targetLanguage);

        const cachedResources = getStoredResources(targetLanguage);

        if (
          localVersion === remoteVersion &&
          hasUsableResources(cachedResources)
        ) {
          return;
        }

        const updated = await fetchAndApplyResources(targetLanguage);

        if (!updated) {
          return;
        }

        /**
         * Resource của language
         * hiện tại vừa thay đổi.
         *
         * Trigger react-i18next
         * render lại.
         */
        if (i18n.language && isSameLanguage(i18n.language, targetLanguage)) {
          await i18n.changeLanguage(targetLanguage);
        }
      } catch (error) {
        console.warn(
          `[i18n] Unable to sync remote resources for "${targetLanguage}"`,
          error
        );
      }
    },
    [fetchAndApplyResources]
  );

  /**
   * Đảm bảo resource tồn tại
   * TRƯỚC KHI đổi language.
   */
  const ensureResources = useCallback(
    async (targetLanguage: string): Promise<boolean> => {
      const cachedResources = getStoredResources(targetLanguage);

      /**
       * Ưu tiên cache để UI
       * render nhanh.
       */
      if (hasUsableResources(cachedResources)) {
        applyResources(targetLanguage, cachedResources);

        return true;
      }

      /**
       * Nếu config có bundled
       * resource thì vẫn dùng được.
       */
      if (hasLoadedResources(targetLanguage)) {
        return true;
      }

      /**
       * Không có cache/local:
       * phải tải Backend trước.
       */
      return fetchAndApplyResources(targetLanguage);
    },
    [fetchAndApplyResources]
  );

  const activateLanguage = useCallback(
    async (targetLanguage: string) => {
      setIsChanging(true);

      try {
        /**
         * BƯỚC QUAN TRỌNG:
         *
         * resource phải sẵn sàng
         * trước changeLanguage().
         */
        const ready = await ensureResources(targetLanguage);

        if (!ready) {
          throw new Error(
            `Không tải được dữ liệu ngôn ngữ "${targetLanguage}".`
          );
        }

        /**
         * Chuyển i18next trước.
         *
         * Chỉ sau khi thành công mới
         * update Zustand/dropdown.
         */
        await i18n.changeLanguage(targetLanguage);

        setStoredLanguage(targetLanguage);

        setLanguage(targetLanguage);

        if (typeof document !== "undefined") {
          document.documentElement.lang = targetLanguage;
        }

        /**
         * UI đã đúng.
         *
         * Sau đó mới check version
         * background.
         */
        void syncRemoteResources(targetLanguage);
      } finally {
        setIsChanging(false);
      }
    },
    [ensureResources, setIsChanging, setLanguage, syncRemoteResources]
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

      try {
        await activateLanguage(initialLanguage);
      } catch (error) {
        console.warn(`[i18n] Unable to activate "${initialLanguage}"`, error);

        /**
         * Nếu language user chọn
         * lỗi thì thử default.
         */
        if (!isSameLanguage(initialLanguage, DEFAULT_LANGUAGE)) {
          try {
            await activateLanguage(DEFAULT_LANGUAGE);
          } catch (fallbackError) {
            console.warn(
              `[i18n] Unable to activate fallback "${DEFAULT_LANGUAGE}"`,
              fallbackError
            );
          }
        }
      } finally {
        /**
         * Chỉ cho app render
         * sau khi bootstrap xong.
         */
        setBootstrapped(true);
      }
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
        {bootstrapped ? (
          children
        ) : (
          <div className="flex min-h-screen items-center justify-center bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
          </div>
        )}
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
