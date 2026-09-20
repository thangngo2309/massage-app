"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useState } from "react";

import { Toaster } from "sonner";

import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { RealtimeProvider } from "@/components/common/RealtimeProvider";

import { I18nProvider } from "@/i18n/I18nProvider";

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

            refetchOnWindowFocus: true,

            refetchOnReconnect: true,
          },

          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthBootstrap />

        <RealtimeProvider>{children}</RealtimeProvider>

        <Toaster position="top-right" richColors closeButton />
      </I18nProvider>
    </QueryClientProvider>
  );
};
