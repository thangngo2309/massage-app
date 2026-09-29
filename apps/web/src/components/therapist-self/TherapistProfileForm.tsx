"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Save, ShieldCheck, Star } from "lucide-react";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { UserAvatarUpload } from "@/components/common/UserAvatarUpload";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { getApiErrorMessage } from "@/lib/http";
import {
  updateAcceptingBookings,
  updateTherapistSelfProfile,
} from "@/lib/therapist-self";

import { useAuthStore } from "@/stores/auth-store";

import type { Gender, TherapistSelfProfile } from "@/types/therapist-self";

type Props = {
  profile: TherapistSelfProfile;
};

type ProfileFormValues = {
  fullName: string;

  gender: Gender;

  dateOfBirth: string;

  address: string;

  stageName: string;

  hasTattoo: boolean;

  experienceYears: number | "";

  bio: string;
};

export const TherapistProfileForm = ({ profile }: Props) => {
  const { t } = useTranslation("therapistProfile");

  const { t: tProfile } = useTranslation("profile");

  const queryClient = useQueryClient();

  const updateLockRef = useRef(false);

  const authUser = useAuthStore((state) => state.user);

  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      fullName: profile.fullName,

      gender: profile.gender ?? "unknown",

      dateOfBirth: profile.dateOfBirth ?? "",

      address: profile.address ?? "",

      stageName: profile.stageName ?? "",

      hasTattoo: profile.hasTattoo ?? false,

      experienceYears: profile.experienceYears ?? "",

      bio: profile.bio ?? "",
    },
  });

  useEffect(() => {
    reset({
      fullName: profile.fullName,

      gender: profile.gender ?? "unknown",

      dateOfBirth: profile.dateOfBirth ?? "",

      address: profile.address ?? "",

      stageName: profile.stageName ?? "",

      hasTattoo: profile.hasTattoo ?? false,

      experienceYears: profile.experienceYears ?? "",

      bio: profile.bio ?? "",
    });
  }, [profile, reset]);

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

        gender: values.gender,

        dateOfBirth: values.dateOfBirth || null,

        address: values.address.trim() || null,

        stageName: values.stageName.trim() || null,

        hasTattoo: values.hasTattoo,

        experienceYears:
          values.experienceYears === "" ? null : Number(values.experienceYears),

        bio: values.bio.trim() || null,
      });
    } catch {
      // mutation onError handles toast
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
      {/* Avatar */}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatarUpload avatarUrl={authUser?.avatarUrl} />

          <div>
            <div className="font-bold text-slate-950">
              {tProfile("avatar.title")}
            </div>

            <p className="mt-1 max-w-lg text-sm leading-6 text-slate-500">
              {tProfile("avatar.therapistDescription")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}

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

      {/* Accept booking */}

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

      {/* Profile form */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
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
            id="stageName"
            label={t("form.stageName.label")}
            placeholder={t("form.stageName.placeholder")}
            error={errors.stageName?.message}
            {...register("stageName", {
              maxLength: {
                value: 255,
                message: t("form.stageName.maxLength"),
              },
            })}
          />

          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-semibold text-slate-700"
            >
              {t("form.gender.label")}
            </label>

            <select
              id="gender"
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
              {...register("gender")}
            >
              <option value="unknown">{t("form.gender.unknown")}</option>

              <option value="male">{t("form.gender.male")}</option>

              <option value="female">{t("form.gender.female")}</option>

              <option value="other">{t("form.gender.other")}</option>
            </select>
          </div>

          <Input
            id="dateOfBirth"
            label={t("form.dateOfBirth.label")}
            type="date"
            error={errors.dateOfBirth?.message}
            {...register("dateOfBirth")}
          />

          <Input
            id="experienceYears"
            label={t("form.experienceYears.label")}
            type="number"
            min={0}
            max={100}
            error={errors.experienceYears?.message}
            {...register("experienceYears", {
              min: {
                value: 0,
                message: t("form.experienceYears.invalid"),
              },

              max: {
                value: 100,
                message: t("form.experienceYears.invalid"),
              },
            })}
          />

          <Controller
            name="hasTattoo"
            control={control}
            render={({ field }) => (
              <div>
                <div className="block text-sm font-semibold text-slate-700">
                  {t("form.hasTattoo.label")}
                </div>

                <div className="mt-1.5 flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2">
                  <button
                    type="button"
                    onClick={() => field.onChange(false)}
                    className={
                      !field.value
                        ? "flex-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                        : "flex-1 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
                    }
                  >
                    {t("form.hasTattoo.no")}
                  </button>

                  <button
                    type="button"
                    onClick={() => field.onChange(true)}
                    className={
                      field.value
                        ? "flex-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                        : "flex-1 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
                    }
                  >
                    {t("form.hasTattoo.yes")}
                  </button>
                </div>
              </div>
            )}
          />
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-semibold text-slate-700"
          >
            {t("form.address.label")}
          </label>

          <textarea
            id="address"
            rows={3}
            placeholder={t("form.address.placeholder")}
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
            {...register("address", {
              maxLength: {
                value: 2000,
                message: t("form.address.maxLength"),
              },
            })}
          />

          {errors.address && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.address.message}
            </p>
          )}
        </div>

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
