"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Save, ShieldCheck, Star } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { getApiErrorMessage } from "@/lib/http";
import {
  updateAcceptingBookings,
  updateTherapistSelfProfile,
} from "@/lib/therapist-self";

import { useAuthStore } from "@/stores/auth-store";

import type { TherapistSelfProfile } from "@/types/therapist-self";

type Props = {
  profile: TherapistSelfProfile;
};

type ProfileFormValues = {
  fullName: string;
  bio: string;
  experienceYears: number | "";
};

export const TherapistProfileForm = ({ profile }: Props) => {
  const { t } = useTranslation("therapistProfile");

  const queryClient = useQueryClient();

  const updateLockRef = useRef(false);

  const authUser = useAuthStore((state) => state.user);

  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      fullName: profile.fullName,

      bio: profile.bio ?? "",

      experienceYears: profile.experienceYears ?? "",
    },
  });

  useEffect(() => {
    reset({
      fullName: profile.fullName,

      bio: profile.bio ?? "",

      experienceYears: profile.experienceYears ?? "",
    });
  }, [profile, reset]);

  /**
   * =========================================
   * UPDATE PROFILE
   * =========================================
   */

  const updateMutation = useMutation({
    mutationFn: updateTherapistSelfProfile,

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["therapist-self-profile"], updatedProfile);

      if (authUser) {
        setUser({
          ...authUser,

          fullName: updatedProfile.fullName,
        });
      }

      void queryClient.invalidateQueries({
        queryKey: ["therapist-search"],
      });

      toast.success(t("form.updateSuccess"));
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },

    onSettled: () => {
      updateLockRef.current = false;
    },
  });

  /**
   * =========================================
   * ACCEPTING BOOKINGS
   * =========================================
   */

  const acceptingMutation = useMutation({
    mutationFn: updateAcceptingBookings,

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["therapist-self-profile"], updatedProfile);

      void Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: ["therapist-search"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["therapist-availability"],
        }),
      ]);

      toast.success(t("form.acceptingUpdateSuccess"));
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    if (updateLockRef.current || updateMutation.isPending) {
      return;
    }

    updateLockRef.current = true;

    try {
      await updateMutation.mutateAsync({
        fullName: values.fullName.trim(),

        bio: values.bio.trim() || null,

        experienceYears:
          values.experienceYears === "" ? null : Number(values.experienceYears),
      });
    } catch {
      // onError của mutation đã xử lý toast.
    }
  };

  const handleToggleAccepting = () => {
    if (acceptingMutation.isPending) {
      return;
    }

    acceptingMutation.mutate({
      isAcceptingBookings: !profile.isAcceptingBookings,
    });
  };

  const verified = profile.verificationStatus === "verified";

  return (
    <div className="space-y-6">
      {/*
       * =====================================
       * SUMMARY
       * =====================================
       */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="size-4 text-emerald-700" />

            {t("form.stats.verification")}
          </div>

          <div className="mt-2">
            <Badge variant={verified ? "success" : "warning"}>
              {verified
                ? t("form.stats.verified")
                : t("form.stats.pendingVerification")}
            </Badge>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Star className="size-4 text-amber-500" />

            {t("form.stats.rating")}
          </div>

          <div className="mt-2 text-xl font-bold text-slate-950">
            {Number(profile.ratingAverage ?? 0).toFixed(1)}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 className="size-4 text-emerald-700" />

            {t("form.stats.completed")}
          </div>

          <div className="mt-2 text-xl font-bold text-slate-950">
            {profile.completedBookings ?? 0}
          </div>
        </div>
      </div>

      {/*
       * =====================================
       * ACCEPTING BOOKINGS
       * =====================================
       */}

      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-slate-900">
              {t("form.accepting.title")}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {t("form.accepting.description")}
            </p>
          </div>

          <button
            type="button"
            disabled={!verified || acceptingMutation.isPending}
            onClick={handleToggleAccepting}
            className={
              profile.isAcceptingBookings
                ? "rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                : "rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            {acceptingMutation.isPending
              ? t("form.accepting.updating")
              : profile.isAcceptingBookings
              ? t("form.accepting.active")
              : t("form.accepting.inactive")}
          </button>
        </div>
      </div>

      {/*
       * =====================================
       * PROFILE FORM
       * =====================================
       */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          id="fullName"
          label={t("form.fullName.label")}
          error={errors.fullName?.message}
          {...register("fullName", {
            required: t("form.fullName.required"),

            minLength: {
              value: 2,

              message: t("form.fullName.minLength"),
            },

            maxLength: {
              value: 255,

              message: t("form.fullName.maxLength"),
            },
          })}
        />

        <Input
          id="experienceYears"
          label={t("form.experienceYears.label")}
          type="number"
          min={0}
          max={80}
          error={errors.experienceYears?.message}
          {...register("experienceYears", {
            min: {
              value: 0,

              message: t("form.experienceYears.invalid"),
            },

            max: {
              value: 80,

              message: t("form.experienceYears.invalid"),
            },
          })}
        />

        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-semibold text-slate-700"
          >
            {t("form.bio.label")}
          </label>

          <textarea
            id="bio"
            rows={6}
            placeholder={t("form.bio.placeholder")}
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
            {...register("bio", {
              maxLength: {
                value: 2000,

                message: t("form.bio.maxLength"),
              },
            })}
          />

          {errors.bio && (
            <p className="mt-1.5 text-xs text-red-600">{errors.bio.message}</p>
          )}
        </div>

        <Button
          type="submit"
          loading={isSubmitting || updateMutation.isPending}
          disabled={isSubmitting || updateMutation.isPending}
        >
          <Save className="size-4" />

          {t("form.save")}
        </Button>
      </form>
    </div>
  );
};
