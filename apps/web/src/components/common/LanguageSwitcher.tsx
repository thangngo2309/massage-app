"use client";

import { Check, ChevronDown, Globe2 } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

import { useAppI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/stores/language-store";

type LanguageSwitcherProps = {
  className?: string;
};

export const LanguageSwitcher = ({ className }: LanguageSwitcherProps) => {
  const { t } = useTranslation("common");

  const { changeLanguage } = useAppI18n();

  const language = useLanguageStore((state) => state.language);

  const languages = useLanguageStore((state) => state.languages);

  const [open, setOpen] = useState(false);

  const [changing, setChanging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((item) => item.code === language);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleChangeLanguage = async (nextLanguage: string) => {
    if (changing || nextLanguage === language) {
      setOpen(false);
      return;
    }

    try {
      setChanging(true);

      await changeLanguage(nextLanguage);

      setOpen(false);
    } finally {
      setChanging(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={changing}
        aria-label={t("language.change")}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="
          flex h-10 items-center
          gap-2 rounded-xl
          border border-slate-200
          bg-white px-3
          text-sm font-semibold
          text-slate-600
          shadow-sm
          transition
          hover:border-emerald-200
          hover:bg-emerald-50/50
          hover:text-emerald-800
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        <Globe2 className="size-4 shrink-0" />

        <span className="sm:hidden">{language.toUpperCase()}</span>

        <span className="hidden sm:inline">
          {currentLanguage?.nativeName ?? language.toUpperCase()}
        </span>

        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className="
            absolute right-0 top-[calc(100%+0.5rem)]
            z-[100]
            min-w-[190px]
            overflow-hidden
            rounded-2xl
            border border-slate-200
            bg-white
            p-1.5
            shadow-xl
            shadow-slate-950/10
          "
        >
          {languages.map((item) => {
            const selected = item.code === language;

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => void handleChangeLanguage(item.code)}
                className={cn(
                  `
                      flex min-h-11
                      w-full
                      items-center
                      justify-between
                      gap-4
                      rounded-xl
                      px-3
                      text-left
                      text-sm
                      transition-colors
                    `,
                  selected
                    ? "bg-emerald-50 font-semibold text-emerald-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                )}
              >
                <div>
                  <div>{item.nativeName}</div>

                  {item.name !== item.nativeName && (
                    <div className="mt-0.5 text-[11px] font-normal text-slate-400">
                      {item.name}
                    </div>
                  )}
                </div>

                {selected && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
