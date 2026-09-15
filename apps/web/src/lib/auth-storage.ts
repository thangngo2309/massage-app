import type { AuthResponse, AuthUser } from "@/types/auth";
const ACCESS_TOKEN_KEY = "massage_web_access_token";
const REFRESH_TOKEN_KEY = "massage_web_refresh_token";
const USER_KEY = "massage_web_user";

const isBrowser = () => typeof window !== "undefined";

export const getAccessToken = () => {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = () => {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const setAccessToken = (accessToken: string) => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
};

export const setRefreshToken = (refreshToken: string) => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const setStoredUser = (user: AuthUser) => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const setAuthSession = (response: AuthResponse) => {
  setAccessToken(response.accessToken);
  setRefreshToken(response.refreshToken);
  setStoredUser(response.user);
};

export const clearAuthStorage = () => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
