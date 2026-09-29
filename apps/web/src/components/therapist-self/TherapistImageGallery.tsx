"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Images,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";

import { getApiErrorMessage } from "@/lib/http";
import {
  deleteTherapistSelfImage,
  getTherapistSelfImages,
  updateTherapistSelfImageOrder,
  uploadTherapistSelfImages,
} from "@/lib/therapist-self";

import type { TherapistImage } from "@/types/therapist-self";

const MAX_IMAGES = 10;

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const TherapistImageGallery = () => {
  const { t } = useTranslation("therapistProfile");

  const queryClient = useQueryClient();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [error, setError] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);

  /**
   * =====================================
   * QUERY
   * =====================================
   */

  const {
    data: images = [],
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["therapist-self-images"],

    queryFn: getTherapistSelfImages,
  });

  /**
   * =====================================
   * UPLOAD
   * =====================================
   */

  const uploadMutation = useMutation({
    mutationFn: uploadTherapistSelfImages,

    onSuccess: async () => {
      setError("");

      await queryClient.invalidateQueries({
        queryKey: ["therapist-self-images"],
      });

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },

    onError: (mutationError) => {
      setError(getApiErrorMessage(mutationError));

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
  });

  /**
   * =====================================
   * DELETE
   * =====================================
   */

  const deleteMutation = useMutation({
    mutationFn: deleteTherapistSelfImage,

    onSuccess: async () => {
      setError("");

      await queryClient.invalidateQueries({
        queryKey: ["therapist-self-images"],
      });
    },

    onError: (mutationError) => {
      setError(getApiErrorMessage(mutationError));
    },

    onSettled: () => {
      setDeletingId(null);
    },
  });

  /**
   * =====================================
   * ORDER
   * =====================================
   */

  const orderMutation = useMutation({
    mutationFn: updateTherapistSelfImageOrder,

    onSuccess: async () => {
      setError("");

      await queryClient.invalidateQueries({
        queryKey: ["therapist-self-images"],
      });
    },

    onError: (mutationError) => {
      setError(getApiErrorMessage(mutationError));
    },
  });

  /**
   * =====================================
   * SELECT IMAGES
   * =====================================
   */

  const handleSelectImages = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");

    const selectedFiles = Array.from(event.target.files ?? []);

    if (!selectedFiles.length) {
      return;
    }

    /**
     * Maximum image count.
     */
    if (images.length + selectedFiles.length > MAX_IMAGES) {
      setError(
        t("gallery.maxImages", {
          max: MAX_IMAGES,
        })
      );

      event.target.value = "";

      return;
    }

    /**
     * File type.
     */
    const invalidType = selectedFiles.find(
      (file) => !ALLOWED_TYPES.includes(file.type)
    );

    if (invalidType) {
      setError(t("gallery.invalidType"));

      event.target.value = "";

      return;
    }

    /**
     * File size.
     */
    const oversizedFile = selectedFiles.find(
      (file) => file.size > MAX_FILE_SIZE
    );

    if (oversizedFile) {
      setError(t("gallery.maxFileSize"));

      event.target.value = "";

      return;
    }

    uploadMutation.mutate(selectedFiles);
  };

  /**
   * =====================================
   * DELETE IMAGE
   * =====================================
   */

  const handleDelete = (image: TherapistImage) => {
    if (deleteMutation.isPending) {
      return;
    }

    const confirmed = window.confirm(t("gallery.deleteConfirm"));

    if (!confirmed) {
      return;
    }

    setDeletingId(image.id);

    deleteMutation.mutate(image.id);
  };

  /**
   * =====================================
   * MOVE IMAGE
   * =====================================
   */

  const handleMove = (imageId: number, direction: "left" | "right") => {
    if (orderMutation.isPending) {
      return;
    }

    const sortedImages = [...images].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.id - b.id
    );

    const currentIndex = sortedImages.findIndex((item) => item.id === imageId);

    if (currentIndex < 0) {
      return;
    }

    const targetIndex =
      direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sortedImages.length) {
      return;
    }

    const reordered = [...sortedImages];

    const [current] = reordered.splice(currentIndex, 1);

    reordered.splice(targetIndex, 0, current);

    orderMutation.mutate({
      items: reordered.map((item, index) => ({
        id: item.id,
        sortOrder: index,
      })),
    });
  };

  /**
   * =====================================
   * LOADING
   * =====================================
   */

  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-emerald-600" />
      </div>
    );
  }

  /**
   * =====================================
   * ERROR
   * =====================================
   */

  if (isError) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        {getApiErrorMessage(queryError)}
      </div>
    );
  }

  const sortedImages = [...images].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id
  );

  const canUploadMore = images.length < MAX_IMAGES;

  return (
    <div>
      {/*
       * =====================================
       * HEADER
       * =====================================
       */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Images className="size-5 text-emerald-700" />

            <h2 className="text-lg font-bold text-slate-950">
              {t("gallery.title")}
            </h2>
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {t("gallery.description", {
              max: MAX_IMAGES,
            })}
          </p>
        </div>

        <div className="shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleSelectImages}
          />

          <Button
            type="button"
            disabled={!canUploadMore || uploadMutation.isPending}
            loading={uploadMutation.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="mr-2 size-4" />

            {t("gallery.add")}
          </Button>
        </div>
      </div>

      {/*
       * =====================================
       * COUNT
       * =====================================
       */}

      <div className="mt-3 text-xs font-medium text-slate-400">
        {t("gallery.imageCount", {
          count: images.length,

          max: MAX_IMAGES,
        })}
      </div>

      {/*
       * =====================================
       * ERROR
       * =====================================
       */}

      {error && (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/*
       * =====================================
       * EMPTY
       * =====================================
       */}

      {sortedImages.length === 0 ? (
        <button
          type="button"
          disabled={!canUploadMore || uploadMutation.isPending}
          onClick={() => inputRef.current?.click()}
          className="mt-5 flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
            <ImagePlus className="size-5" />
          </div>

          <div className="mt-4 font-semibold text-slate-900">
            {t("gallery.addImages")}
          </div>

          <div className="mt-1 text-sm text-slate-500">
            {t("gallery.selectFromDevice")}
          </div>
        </button>
      ) : (
        /**
         * =====================================
         * IMAGE GRID
         * =====================================
         */
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sortedImages.map((image, index) => {
            const isDeleting =
              deleteMutation.isPending && deletingId === image.id;

            return (
              <div
                key={image.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                  <img
                    src={image.imageUrl}
                    alt={t("gallery.imageAlt", {
                      index: index + 1,
                    })}
                    className="h-full w-full object-cover"
                  />

                  {index === 0 && (
                    <div className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
                      {t("gallery.firstImage")}
                    </div>
                  )}

                  {isDeleting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <LoaderCircle className="size-7 animate-spin text-white" />
                    </div>
                  )}
                </div>

                {/*
                 * =====================================
                 * ACTIONS
                 * =====================================
                 */}

                <div className="flex items-center justify-between gap-1 p-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title={t("gallery.moveLeft")}
                      aria-label={t("gallery.moveLeft")}
                      disabled={index === 0 || orderMutation.isPending}
                      onClick={() => handleMove(image.id, "left")}
                      className="flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowLeft className="size-4" />
                    </button>

                    <button
                      type="button"
                      title={t("gallery.moveRight")}
                      aria-label={t("gallery.moveRight")}
                      disabled={
                        index === sortedImages.length - 1 ||
                        orderMutation.isPending
                      }
                      onClick={() => handleMove(image.id, "right")}
                      className="flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowRight className="size-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    title={t("gallery.deleteImage")}
                    aria-label={t("gallery.deleteImage")}
                    disabled={deleteMutation.isPending}
                    onClick={() => handleDelete(image)}
                    className="flex size-9 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/*
       * =====================================
       * ORDER SAVING
       * =====================================
       */}

      {orderMutation.isPending && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle className="size-4 animate-spin" />

          {t("gallery.savingOrder")}
        </div>
      )}
    </div>
  );
};
