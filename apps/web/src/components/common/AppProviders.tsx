"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { RealtimeProvider } from "@/components/common/RealtimeProvider";
import { ApiError } from "@/lib/http";

type AppProvidersProps = {
  children: React.ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,

            retry: (failureCount, error) => {
              if (
                error instanceof ApiError &&
                [400, 401, 403, 404].includes(error.status)
              ) {
                return false;
              }

              return failureCount < 2;
            },

            /**
             * Browser ngủ/background một thời gian có thể
             * bỏ lỡ socket event.
             *
             * Khi quay lại tab, sync API lại cho chắc chắn.
             */
            refetchOnWindowFocus: true,

            /**
             * Khi mất mạng rồi có mạng trở lại,
             * React Query tự sync data.
             */
            refetchOnReconnect: true,
          },

          /**
           * Mutation có side effect không được retry tự động.
           *
           * Tránh:
           * POST booking 2 lần
           * PATCH status 2 lần
           * POST rating 2 lần
           */
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />

      <RealtimeProvider>{children}</RealtimeProvider>

      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
};
