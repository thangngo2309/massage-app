import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import type { I18nLanguage } from "./types";

export const DEFAULT_LANGUAGE = "vi";

export const DEFAULT_NAMESPACE = "translation";

export const LOCAL_LANGUAGES: I18nLanguage[] = [
  {
    code: "vi",
    name: "Tiếng Việt",
    nativeName: "Vietnamese",
    isDefault: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    isDefault: false,
    isActive: true,
    sortOrder: 2,
  },
];

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    lng: DEFAULT_LANGUAGE,

    /**
     * Không fallback en -> vi.
     *
     * Nếu resource tiếng Anh chưa sẵn sàng,
     * Provider sẽ load resource trước khi
     * activate language.
     */
    fallbackLng: false,

    defaultNS: DEFAULT_NAMESPACE,

    ns: [DEFAULT_NAMESPACE],

    resources: {},

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

    returnNull: false,

    returnEmptyString: false,

    cleanCode: true,

    load: "currentOnly",
  });
}

export default i18n;
