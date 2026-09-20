import { create } from "zustand";

import { DEFAULT_LANGUAGE, LOCAL_LANGUAGES } from "@/i18n/config";

import type { I18nLanguage } from "@/i18n/types";

type LanguageState = {
  language: string;

  languages: I18nLanguage[];

  bootstrapped: boolean;

  isChanging: boolean;

  setLanguage: (language: string) => void;

  setLanguages: (languages: I18nLanguage[]) => void;

  setBootstrapped: (value: boolean) => void;

  setIsChanging: (value: boolean) => void;
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: DEFAULT_LANGUAGE,

  languages: LOCAL_LANGUAGES,

  bootstrapped: false,

  isChanging: false,

  setLanguage: (language) => {
    set({
      language,
    });
  },

  setLanguages: (languages) => {
    set({
      languages,
    });
  },

  setBootstrapped: (bootstrapped) => {
    set({
      bootstrapped,
    });
  },

  setIsChanging: (isChanging) => {
    set({
      isChanging,
    });
  },
}));
