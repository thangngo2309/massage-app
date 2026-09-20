import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enAuth from "./resources/en/auth";
import enCommon from "./resources/en/common";
import enNavigation from "./resources/en/navigation";
import enValidation from "./resources/en/validation";

import viAuth from "./resources/vi/auth";
import viCommon from "./resources/vi/common";
import viNavigation from "./resources/vi/navigation";
import viValidation from "./resources/vi/validation";

export const DEFAULT_LANGUAGE = "vi";

export const LOCAL_LANGUAGES = [
  {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    isDefault: true,
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    isDefault: false,
  },
];

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    lng: DEFAULT_LANGUAGE,

    fallbackLng: DEFAULT_LANGUAGE,

    supportedLngs: false,

    ns: ["common", "navigation", "auth", "validation"],

    defaultNS: "common",

    resources: {
      vi: {
        common: viCommon,
        navigation: viNavigation,
        auth: viAuth,
        validation: viValidation,
      },

      en: {
        common: enCommon,
        navigation: enNavigation,
        auth: enAuth,
        validation: enValidation,
      },
    },

    interpolation: {
      escapeValue: false,
    },

    returnNull: false,
  });
}

export default i18n;
