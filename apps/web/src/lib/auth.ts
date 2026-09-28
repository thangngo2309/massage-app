import { apiFetch } from "@/lib/http";

import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  LogoutResponse,
  RefreshResponse,
  RegisterPayload,
  RegisterResponse,
  SendOtpPayload,
  SendOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
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
  return apiFetch<RegisterResponse>(
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

/**
 * Gửi lại OTP đăng ký.
 */
export const sendRegistrationOtpApi = (payload: SendOtpPayload) => {
  return apiFetch<SendOtpResponse>(
    "/auth/otp/send",
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

/**
 * Xác thực OTP đăng ký.
 */
export const verifyRegistrationOtpApi = (payload: VerifyOtpPayload) => {
  return apiFetch<VerifyOtpResponse>(
    "/auth/otp/verify",
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
