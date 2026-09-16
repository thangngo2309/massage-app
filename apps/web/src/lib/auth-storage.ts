import type { AuthResponse, AuthUser } from "@/types/auth";

const ACCESS_TOKEN_KEY = "massage_web_access_token";
const REFRESH_TOKEN_KEY = "massage_web_refresh_token";
const USER_KEY = "massage_web_user";

export const AUTH_SESSION_EXPIRED_EVENT = "massage:auth-session-expired";

const isBrowser = () => typeof window !== "undefined";

export const getAccessToken = () => {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = () => {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getStoredUser = (): AuthUser | null => {
  if (!isBrowser()) return null;

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const setAccessToken = (accessToken: string) => {
  if (!isBrowser()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
};

export const setRefreshToken = (refreshToken: string) => {
  if (!isBrowser()) return;
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const setStoredUser = (user: AuthUser) => {
  if (!isBrowser()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const setAuthSession = (response: AuthResponse) => {
  setAccessToken(response.accessToken);
  setRefreshToken(response.refreshToken);
  setStoredUser(response.user);
};

export const clearAuthStorage = () => {
  if (!isBrowser()) return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Chỉ gọi khi Backend xác nhận session thực sự không còn hợp lệ.
 *
 * Không gọi khi:
 * - API offline
 * - network error
 * - 500 / 502 / 503
 */
export const expireAuthSession = () => {
  clearAuthStorage();

  if (isBrowser()) {
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
  }
};