"use client";

import { Camera, LoaderCircle, Trash2, UserRound } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/http";
import { deleteAvatar, uploadAvatar } from "@/lib/profile";

import { useAuthStore } from "@/stores/auth-store";

type Props = {
  avatarUrl?: string | null;
  size?: "md" | "lg";
};

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const UserAvatarUpload = ({ avatarUrl, size = "lg" }: Props) => {
  const { t } = useTranslation("profile");

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const user = useAuthStore((state) => state.user);

  const setUser = useAuthStore((state) => state.setUser);

  const busy = uploading || deleting;

  const avatarSize = size === "lg" ? "size-24 sm:size-28" : "size-20";

  const handleChoose = () => {
    if (busy) {
      return;
    }

    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    /**
     * Reset input để user có thể chọn lại
     * cùng một file sau đó.
     */
    event.target.value = "";

    if (!file) {
      return;
    }

    /**
     * =====================================
     * VALIDATE TYPE
     * =====================================
     */
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t("avatar.invalidType"));

      return;
    }

    /**
     * =====================================
     * VALIDATE SIZE
     * =====================================
     */
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("avatar.maxSize"));

      return;
    }

    /**
     * =====================================
     * UPLOAD
     * =====================================
     */
    try {
      setUploading(true);

      const response = await uploadAvatar(file);

      /**
       * Đồng bộ Auth Store để toàn bộ Web
       * nhận avatar mới ngay lập tức.
       */
      if (user) {
        setUser({
          ...user,
          avatarUrl: response.avatarUrl,
        });
      }

      toast.success(t("avatar.uploadSuccess"));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (busy || !avatarUrl) {
      return;
    }

    try {
      setDeleting(true);

      const response = await deleteAvatar();

      /**
       * Đồng bộ Auth Store.
       */
      if (user) {
        setUser({
          ...user,
          avatarUrl: response.avatarUrl,
        });
      }

      toast.success(t("avatar.deleteSuccess"));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      {/*
       * =====================================
       * AVATAR
       * =====================================
       */}

      <div className="relative">
        <div
          className={[
            avatarSize,
            "overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm",
          ].join(" ")}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={t("avatar.alt")}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <UserRound className="size-10" />
            </div>
          )}
        </div>

        {/*
         * =====================================
         * CHANGE BUTTON
         * =====================================
         */}

        <button
          type="button"
          disabled={busy}
          onClick={handleChoose}
          aria-label={t("avatar.change")}
          title={t("avatar.change")}
          className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full border-2 border-white bg-emerald-700 text-white shadow transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
        </button>
      </div>

      {/*
       * =====================================
       * FILE INPUT
       * =====================================
       */}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/*
       * =====================================
       * DELETE
       * =====================================
       */}

      {avatarUrl && (
        <button
          type="button"
          disabled={busy}
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}

          {deleting ? t("avatar.deleting") : t("avatar.remove")}
        </button>
      )}

      {/*
       * =====================================
       * FORMAT NOTE
       * =====================================
       */}

      <p className="max-w-[220px] text-center text-xs leading-5 text-slate-400 sm:text-left">
        {uploading ? t("avatar.uploading") : t("avatar.formats")}
      </p>
    </div>
  );
};
