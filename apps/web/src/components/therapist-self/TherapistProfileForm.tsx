"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CheckCircle2, Save, ShieldCheck, Star } from "lucide-react";

import { useEffect } from "react";

import { useForm } from "react-hook-form";

import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";

import { Button } from "@/components/ui/Button";

import { Input } from "@/components/ui/Input";

import { getApiErrorMessage } from "@/lib/http";

import {
  updateAcceptingBookings,
  updateTherapistSelfProfile,
} from "@/lib/therapist-self";

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
  const queryClient = useQueryClient();

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

  const updateMutation = useMutation({
    mutationFn: updateTherapistSelfProfile,

    onSuccess: () => {
      toast.success("Đã cập nhật hồ sơ.");

      void queryClient.invalidateQueries({
        queryKey: ["therapist-self-profile"],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const acceptingMutation = useMutation({
    mutationFn: updateAcceptingBookings,

    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái nhận lịch.");

      void queryClient.invalidateQueries({
        queryKey: ["therapist-self-profile"],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    await updateMutation.mutateAsync({
      fullName: values.fullName.trim(),

      bio: values.bio.trim() || undefined,

      experienceYears:
        values.experienceYears === ""
          ? undefined
          : Number(values.experienceYears),
    });
  };

  const verified = profile.verificationStatus === "verified";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="size-4 text-emerald-700" />
            Xác minh
          </div>

          <div className="mt-2">
            <Badge variant={verified ? "success" : "warning"}>
              {verified ? "Đã xác minh" : "Chờ xác minh"}
            </Badge>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Star className="size-4 text-amber-500" />
            Đánh giá
          </div>

          <div className="mt-2 text-xl font-bold text-slate-950">
            {Number(profile.ratingAverage ?? 0).toFixed(1)}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 className="size-4 text-emerald-700" />
            Hoàn thành
          </div>

          <div className="mt-2 text-xl font-bold text-slate-950">
            {profile.completedBookings ?? 0}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-slate-900">
              Trạng thái nhận lịch
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Chỉ kỹ thuật viên đã xác minh mới được bật nhận booking.
            </p>
          </div>

          <button
            type="button"
            disabled={!verified || acceptingMutation.isPending}
            onClick={() =>
              acceptingMutation.mutate({
                isAcceptingBookings: !profile.isAcceptingBookings,
              })
            }
            className={
              profile.isAcceptingBookings
                ? "rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                : "rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
            }
          >
            {profile.isAcceptingBookings
              ? "Đang nhận lịch"
              : "Tạm ngừng nhận lịch"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          id="fullName"
          label="Họ và tên"
          error={errors.fullName?.message}
          {...register("fullName", {
            required: "Vui lòng nhập họ và tên.",

            minLength: {
              value: 2,

              message: "Họ và tên quá ngắn.",
            },
          })}
        />

        <Input
          id="experienceYears"
          label="Số năm kinh nghiệm"
          type="number"
          min={0}
          max={80}
          error={errors.experienceYears?.message}
          {...register("experienceYears", {
            min: {
              value: 0,

              message: "Số năm kinh nghiệm không hợp lệ.",
            },

            max: {
              value: 80,

              message: "Số năm kinh nghiệm không hợp lệ.",
            },
          })}
        />

        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-semibold text-slate-700"
          >
            Giới thiệu bản thân
          </label>

          <textarea
            id="bio"
            rows={6}
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
            placeholder="Giới thiệu kinh nghiệm, phong cách phục vụ..."
            {...register("bio", {
              maxLength: {
                value: 2000,

                message: "Giới thiệu không được vượt quá 2000 ký tự.",
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
        >
          <Save className="size-4" />
          Lưu hồ sơ
        </Button>
      </form>
    </div>
  );
};
