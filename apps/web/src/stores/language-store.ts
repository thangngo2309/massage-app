import { create } from "zustand";

import { DEFAULT_LANGUAGE, LOCAL_LANGUAGES } from "@/i18n/config";

import type { I18nLanguage } from "@/i18n/types";

type LanguageStore = {
  language: string;

  languages: I18nLanguage[];

  bootstrapped: boolean;

  setLanguage: (language: string) => void;

  setLanguages: (languages: I18nLanguage[]) => void;

  setBootstrapped: (value: boolean) => void;
};

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: DEFAULT_LANGUAGE,

  languages: LOCAL_LANGUAGES,

  bootstrapped: false,

  setLanguage: (language) =>
    set({
      language,
    }),

  setLanguages: (languages) =>
    set({
      languages,
    }),

  setBootstrapped: (bootstrapped) =>
    set({
      bootstrapped,
    }),
}));
