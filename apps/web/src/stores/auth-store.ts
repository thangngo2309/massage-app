import { create } from "zustand";

import { getMeApi, loginApi, logoutApi, registerApi } from "@/lib/auth";

import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setAuthSession,
  setStoredUser,
} from "@/lib/auth-storage";

import type { AuthUser, LoginPayload, RegisterPayload } from "@/types/auth";

type AuthState = {
  user: AuthUser | null;
  initialized: boolean;
  loading: boolean;

  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,
  loading: false,

  setUser: (user) => {
    if (user) {
      setStoredUser(user);
    }

    set({ user });
  },

  initialize: async () => {
    if (get().initialized || get().loading) return;

    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    const storedUser = getStoredUser();

    if (!accessToken && !refreshToken) {
      set({
        user: null,
        initialized: true,
        loading: false,
      });

      return;
    }

    /**
     * Dùng cached user trong lúc kiểm tra session.
     */
    set({
      user: storedUser,
      loading: true,
    });

    try {
      const user = await getMeApi();

      setStoredUser(user);

      set({
        user,
        initialized: true,
        loading: false,
      });
    } catch (error) {
      /**
       * http.ts có thể đã expire session nếu refresh token
       * thực sự invalid.
       *
       * Kiểm tra storage lại tại thời điểm catch.
       */
      const sessionStillExists = Boolean(getAccessToken() || getRefreshToken());

      if (!sessionStillExists) {
        set({
          user: null,
          initialized: true,
          loading: false,
        });

        return;
      }

      /**
       * Session vẫn còn => khả năng API offline/network/5xx.
       * Không logout user.
       */
      console.warn(
        "[Auth] Unable to verify session. Keeping local session.",
        error
      );

      set({
        user: storedUser,
        initialized: true,
        loading: false,
      });
    }
  },

  login: async (payload) => {
    set({ loading: true });

    try {
      const response = await loginApi({
        ...payload,
        deviceName: payload.deviceName ?? "web",
      });

      setAuthSession(response);

      set({
        user: response.user,
        initialized: true,
        loading: false,
      });

      return response.user;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (payload) => {
    set({ loading: true });

    try {
      const response = await registerApi({
        ...payload,
        deviceName: payload.deviceName ?? "web",
      });

      setAuthSession(response);

      set({
        user: response.user,
        initialized: true,
        loading: false,
      });

      return response.user;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = getRefreshToken();

    set({ loading: true });

    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch {
      /**
       * Logout chủ động:
       * kể cả API offline vẫn logout local.
       */
    } finally {
      clearAuthStorage();

      set({
        user: null,
        initialized: true,
        loading: false,
      });
    }
  },
}));
