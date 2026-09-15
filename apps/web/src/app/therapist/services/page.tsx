"use client";

import { useQuery } from "@tanstack/react-query";

import { RefreshCcw, Sparkles } from "lucide-react";

import { TherapistServiceCard } from "@/components/therapist-self/TherapistServiceCard";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import { getApiErrorMessage } from "@/lib/http";

import { getTherapistSelfServices } from "@/lib/therapist-self";

export default function TherapistServicesPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["therapist-self-services"],

    queryFn: getTherapistSelfServices,
  });

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          Dịch vụ của tôi
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Quản lý giá và trạng thái nhận từng dịch vụ.
        </p>
      </div>

      {isLoading && (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      )}

      {isError && (
        <Card className="mt-7 flex flex-col items-center px-6 py-14 text-center">
          <RefreshCcw className="size-8 text-red-500" />

          <h2 className="mt-4 font-bold">Không thể tải dịch vụ</h2>

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
      )}

      {!isLoading && !isError && !data?.length && (
        <Card className="mt-7 flex flex-col items-center px-6 py-16 text-center">
          <Sparkles className="size-10 text-slate-300" />

          <h2 className="mt-5 text-lg font-bold">Chưa có dịch vụ</h2>

          <p className="mt-2 text-sm text-slate-500">
            Admin chưa gán dịch vụ nào cho tài khoản của bạn.
          </p>
        </Card>
      )}

      {!!data?.length && (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => (
            <TherapistServiceCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
