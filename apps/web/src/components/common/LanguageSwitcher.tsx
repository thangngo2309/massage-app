"use client";

import { Check, ChevronDown, Globe2 } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { useAppI18n } from "@/i18n/I18nProvider";

import type { I18nLanguage } from "@/i18n/types";

import { useLanguageStore } from "@/stores/language-store";

type LanguageSwitcherProps = {
  className?: string;
};

const getLanguageName = (item: I18nLanguage) => {
  return item.name || item.code.toUpperCase();
};

export const LanguageSwitcher = ({ className }: LanguageSwitcherProps) => {
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const { changeLanguage } = useAppI18n();

  const language = useLanguageStore((state) => state.language);

  const languages = useLanguageStore((state) => state.languages);

  const bootstrapped = useLanguageStore((state) => state.bootstrapped);

  const isChanging = useLanguageStore((state) => state.isChanging);

  const selectedLanguage =
    languages.find(
      (item) => item.code.toLowerCase() === language.toLowerCase()
    ) ?? languages[0];

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const handleSelect = async (item: I18nLanguage) => {
    if (isChanging || item.code === language) {
      setOpen(false);

      return;
    }

    try {
      /**
       * KHÔNG gọi
       * setLanguage() ở đây.
       */
      await changeLanguage(item.code);

      setOpen(false);
    } catch (error) {
      console.error("[i18n] Unable to change language", error);
    }
  };

  if (!bootstrapped || !selectedLanguage) {
    return null;
  }

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        disabled={isChanging}
        onClick={() => setOpen((value) => !value)}
        className="flex min-w-[150px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          <Globe2 size={20} />

          <span className="font-medium">
            {getLanguageName(selectedLanguage)}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[230px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {languages.map((item) => {
            const selected = item.code.toLowerCase() === language.toLowerCase();

            return (
              <button
                key={item.code}
                type="button"
                disabled={isChanging}
                onClick={() => void handleSelect(item)}
                className={`flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left transition ${
                  selected
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>
                  <span className="block font-medium">
                    {getLanguageName(item)}
                  </span>

                  {item.nativeName && item.nativeName !== item.name ? (
                    <span className="mt-0.5 block text-sm text-slate-400">
                      {item.nativeName}
                    </span>
                  ) : null}
                </span>

                {selected ? <Check size={19} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
