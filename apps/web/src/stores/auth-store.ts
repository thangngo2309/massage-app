import { create } from "zustand";

import { getMeApi, loginApi, logoutApi, registerApi } from "@/lib/auth";

import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
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

    set({
      user,
    });
  },

  initialize: async () => {
    if (get().initialized || get().loading) {
      return;
    }

    const accessToken = getAccessToken();

    const refreshToken = getRefreshToken();

    if (!accessToken && !refreshToken) {
      set({
        user: null,
        initialized: true,
        loading: false,
      });

      return;
    }

    set({
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
    } catch {
      clearAuthStorage();

      set({
        user: null,
        initialized: true,
        loading: false,
      });
    }
  },

  login: async (payload) => {
    set({
      loading: true,
    });

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
      set({
        loading: false,
      });

      throw error;
    }
  },

  register: async (payload) => {
    set({
      loading: true,
    });

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
      set({
        loading: false,
      });

      throw error;
    }
  },

  logout: async () => {
    const refreshToken = getRefreshToken();

    set({
      loading: true,
    });

    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch {
      // FE vẫn clear session nếu
      // API logout lỗi.
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
