"use client";

import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import type { TherapistSearchImage } from "@/types/therapist-search";

type Props = {
  images?: TherapistSearchImage[];
  therapistName: string;
};

export const TherapistPublicGallery = ({
  images = [],
  therapistName,
}: Props) => {
  const { t } = useTranslation("therapists");

  const sortedImages = useMemo(
    () => [...images].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [images]
  );

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedImage =
    selectedIndex !== null ? sortedImages[selectedIndex] : null;

  const close = () => {
    setSelectedIndex(null);
  };

  const previous = () => {
    if (selectedIndex === null) {
      return;
    }

    setSelectedIndex(
      selectedIndex === 0 ? sortedImages.length - 1 : selectedIndex - 1
    );
  };

  const next = () => {
    if (selectedIndex === null) {
      return;
    }

    setSelectedIndex(
      selectedIndex === sortedImages.length - 1 ? 0 : selectedIndex + 1
    );
  };

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }

      if (event.key === "ArrowLeft") {
        previous();
      }

      if (event.key === "ArrowRight") {
        next();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = previousOverflow;
    };
  }, [selectedIndex, sortedImages.length]);

  if (!sortedImages.length) {
    return null;
  }

  const visibleImages = sortedImages.slice(0, 5);

  return (
    <>
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Images className="size-5 text-emerald-700" />

          <h2 className="text-xl font-bold text-slate-950">
            {t("detail.gallery.title")}
          </h2>

          <span className="text-sm text-slate-400">
            {t("detail.gallery.count", {
              count: sortedImages.length,
            })}
          </span>
        </div>

        {/* Mobile */}

        <div className="flex snap-x gap-3 overflow-x-auto pb-2 md:hidden">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className="relative aspect-[4/5] w-[78%] shrink-0 snap-center overflow-hidden rounded-2xl bg-slate-100"
            >
              <img
                src={image.imageUrl}
                alt={t("detail.gallery.imageAlt", {
                  name: therapistName,
                  index: index + 1,
                })}
                className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                loading="lazy"
              />
            </button>
          ))}
        </div>

        {/* Desktop */}

        <div className="hidden h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[24px] md:grid">
          {visibleImages.map((image, index) => {
            const remaining = sortedImages.length - visibleImages.length;

            const isLast = index === visibleImages.length - 1;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={
                  index === 0
                    ? "group relative col-span-2 row-span-2 overflow-hidden bg-slate-100"
                    : "group relative overflow-hidden bg-slate-100"
                }
              >
                <img
                  src={image.imageUrl}
                  alt={t("detail.gallery.imageAlt", {
                    name: therapistName,
                    index: index + 1,
                  })}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />

                {isLast && remaining > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                    <div className="text-center text-white">
                      <Images className="mx-auto size-6" />

                      <div className="mt-2 text-lg font-bold">+{remaining}</div>

                      <div className="mt-1 text-xs font-medium">
                        {t("detail.gallery.viewAll")}
                      </div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Lightbox */}

      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-20 flex size-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label={t("detail.gallery.close")}
          >
            <X className="size-6" />
          </button>

          {sortedImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();

                  previous();
                }}
                className="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:left-6"
                aria-label={t("detail.gallery.previous")}
              >
                <ChevronLeft className="size-7" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();

                  next();
                }}
                className="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-6"
                aria-label={t("detail.gallery.next")}
              >
                <ChevronRight className="size-7" />
              </button>
            </>
          )}

          <div
            className="flex max-h-full max-w-6xl flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedImage.imageUrl}
              alt={t("detail.gallery.imageAlt", {
                name: therapistName,

                index: (selectedIndex ?? 0) + 1,
              })}
              className="max-h-[82vh] max-w-full rounded-xl object-contain"
            />

            <div className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
              {(selectedIndex ?? 0) + 1}
              {" / "}
              {sortedImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
