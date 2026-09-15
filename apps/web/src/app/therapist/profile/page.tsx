"use client";

import { useQuery } from "@tanstack/react-query";

import { RefreshCcw, UserRound } from "lucide-react";

import { TherapistProfileForm } from "@/components/therapist-self/TherapistProfileForm";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import { getApiErrorMessage } from "@/lib/http";

import { getTherapistSelfProfile } from "@/lib/therapist-self";
import { TherapistReviews } from "@/components/ratings/TherapistReviews";

export default function TherapistProfilePage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["therapist-self-profile"],

    queryFn: getTherapistSelfProfile,
  });

  if (isLoading) {
    return (
      <PageContainer className="py-8">
        <div className="h-[640px] animate-pulse rounded-2xl bg-slate-100" />
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <RefreshCcw className="size-9 text-red-500" />

          <h1 className="mt-5 text-xl font-bold">Không thể tải hồ sơ</h1>

          <p className="mt-2 text-sm text-slate-500">
            {getApiErrorMessage(error)}
          </p>

          <Button
            className="mt-5"
            loading={isFetching}
            onClick={() => void refetch()}
          >
            Thử lại
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <UserRound className="size-5" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Hồ sơ kỹ thuật viên
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Cập nhật thông tin hiển thị với khách hàng.
          </p>
        </div>
      </div>

      <div className="mt-7 space-y-7">
        <Card className="p-5 sm:p-6">
          <TherapistProfileForm profile={data} />
        </Card>

        <TherapistReviews
          therapistId={data.id}
          ratingAverage={data.ratingAverage || 0}
          ratingCount={data.ratingCount}
        />
      </div>
    </PageContainer>
  );
}
