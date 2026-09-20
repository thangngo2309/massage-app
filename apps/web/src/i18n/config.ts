import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enResources from "./resources/en";
import viResources from "./resources/vi";

import type { I18nLanguage } from "./types";

export const DEFAULT_LANGUAGE = "vi";

export const I18N_NAMESPACES = [
  "auth",
  "booking",
  "common",
  "navigation",
  "validation",
] as const;

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
     * Không tự fallback sang vi khi đang chọn en.
     *
     * Vì en đã có bundled resource riêng.
     */
    fallbackLng: false,

    ns: [...I18N_NAMESPACES],

    defaultNS: "common",

    /**
     * Đây chính là phần trước đây đang thiếu.
     *
     * FE resource được bundle trực tiếp vào app.
     */
    resources: {
      vi: viResources,
      en: enResources,
    },

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
