"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useState } from "react";
import { Toaster } from "sonner";

import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { RealtimeProvider } from "./RealtimeProvider";

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
            retry: 1,
            refetchOnWindowFocus: false,
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
