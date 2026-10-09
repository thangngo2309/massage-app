"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { useEffect, useState } from "react";

import { Toaster } from "sonner";

import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { RealtimeProvider } from "@/components/common/RealtimeProvider";

import { I18nProvider } from "@/i18n/I18nProvider";

import { ApiError } from "@/lib/http";

import { useAuthStore } from "@/stores/auth-store";

type AppProvidersProps = {
  children: React.ReactNode;
};

type ProviderChildrenProps = {
  children: React.ReactNode;
};

/**
 * Tạo QueryClient theo cùng một cấu hình chung.
 *
 * App có 2 cấp QueryClient:
 *
 * 1. Root QueryClient:
 *    - sống xuyên suốt vòng đời của Web Portal;
 *    - dành cho provider global như i18n;
 *    - không chứa dữ liệu account-specific của các page.
 *
 * 2. Session QueryClient:
 *    - được tạo mới theo từng identity/session;
 *    - chứa toàn bộ query của Client/Therapist;
 *    - tự bị hủy khi user logout hoặc đổi account.
 */
const createQueryClient = () =>
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
  });

/**
 * Một QueryClient thật sự cho đúng một session identity.
 *
 * Component này được remount bằng React `key`.
 * Vì vậy mỗi lần identity thay đổi sẽ tạo QueryClient hoàn toàn mới.
 */
const SessionQueryClientProvider = ({
  children,
}: ProviderChildrenProps) => {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    return () => {
      /**
       * Session cũ không còn được phép giữ:
       *
       * - query đang chạy;
       * - cached query data;
       * - mutation cache.
       *
       * cancelQueries() là best-effort vì không phải mọi queryFn
       * hiện tại đều truyền AbortSignal xuống fetch.
       *
       * queryClient.clear() vẫn đảm bảo cache của session cũ
       * không còn được sử dụng bởi session tiếp theo.
       */
      void queryClient.cancelQueries();

      queryClient.clear();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * ============================================================
 * AUTH SESSION -> REACT QUERY CACHE BOUNDARY
 * ============================================================
 *
 * Đây là phần quan trọng để ngăn:
 *
 * User A
 *   -> logout
 *   -> User B login
 *   -> UI vẫn dùng cache của A.
 *
 * Session key gồm:
 *
 * - trạng thái bootstrap;
 * - user.id;
 * - user.role.
 *
 * Khi key thay đổi, React unmount SessionQueryClientProvider cũ
 * và mount provider mới với QueryClient mới hoàn toàn.
 */
const SessionQueryBoundary = ({
  children,
}: ProviderChildrenProps) => {
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);

  const sessionKey = !initialized
    ? "auth:bootstrapping"
    : user
      ? `auth:user:${user.role}:${user.id}`
      : "auth:anonymous";

  return (
    <SessionQueryClientProvider key={sessionKey}>
      {children}
    </SessionQueryClientProvider>
  );
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  /**
   * Root QueryClient không chứa cache account-specific
   * vì toàn bộ app pages nằm dưới SessionQueryBoundary.
   *
   * Giữ root provider để I18nProvider và các global provider
   * khác vẫn có QueryClient ổn định nếu cần.
   */
  const [rootQueryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={rootQueryClient}>
      <I18nProvider>
        <AuthBootstrap />

        <SessionQueryBoundary>
          <RealtimeProvider>{children}</RealtimeProvider>
        </SessionQueryBoundary>

        <Toaster position="top-right" richColors closeButton />
      </I18nProvider>
    </QueryClientProvider>
  );
};
