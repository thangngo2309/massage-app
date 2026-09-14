import { apiFetch } from "@/lib/http";

import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  LogoutResponse,
  RefreshResponse,
  RegisterPayload,
} from "@/types/auth";

export const loginApi = (payload: LoginPayload) => {
  return apiFetch<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    {
      auth: false,
      retryOnUnauthorized: false,
    }
  );
};

export const registerApi = (payload: RegisterPayload) => {
  return apiFetch<AuthResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    {
      auth: false,
      retryOnUnauthorized: false,
    }
  );
};

export const refreshApi = (refreshToken: string) => {
  return apiFetch<RefreshResponse>(
    "/auth/refresh",
    {
      method: "POST",

      body: JSON.stringify({
        refreshToken,
        deviceName: "web",
      }),
    },
    {
      auth: false,
      retryOnUnauthorized: false,
    }
  );
};

export const getMeApi = () => {
  return apiFetch<AuthUser>("/auth/me");
};

export const logoutApi = (refreshToken: string) => {
  return apiFetch<LogoutResponse>(
    "/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({
        refreshToken,
      }),
    },
    {
      auth: false,
      retryOnUnauthorized: false,
    }
  );
};
