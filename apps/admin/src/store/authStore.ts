import { create } from "zustand";

import {
  AuthUser,
  clearAuth,
  getAccessToken,
  getAuthUser,
  getRefreshToken,
  isAdminRole,
  saveAuthUser,
} from "@/lib/auth";

import { apiRequest } from "@/lib/api";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  setAuthenticated: (user: AuthUser) => void;
  setUnauthenticated: () => void;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
}

let bootstrapPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  status: "loading",

  setAuthenticated: (user: AuthUser) => {
    set({
      user,
      status: "authenticated",
    });
  },

  setUnauthenticated: () => {
    clearAuth();

    set({
      user: null,
      status: "unauthenticated",
    });
  },

  bootstrap: async () => {
    /**
     * Tránh React StrictMode hoặc nhiều component
     * bootstrap session cùng lúc.
     */
    if (bootstrapPromise) {
      return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      const cachedUser = getAuthUser();

      /**
       * Không có session local.
       */
      if (!accessToken || !refreshToken || !cachedUser) {
        clearAuth();

        set({
          user: null,
          status: "unauthenticated",
        });

        return;
      }

      /**
       * Có session nhưng role local không phải admin.
       */
      if (!isAdminRole(cachedUser.role)) {
        clearAuth();

        set({
          user: null,
          status: "unauthenticated",
        });

        return;
      }

      try {
        /**
         * Không tin tuyệt đối user trong localStorage.
         *
         * Luôn verify lại với Backend.
         *
         * Nếu access token hết hạn,
         * apiRequest tự refresh.
         */
        const user = await apiRequest<AuthUser>("/auth/me");

        if (!isAdminRole(user.role)) {
          clearAuth();

          set({
            user: null,
            status: "unauthenticated",
          });

          return;
        }

        /**
         * Đồng bộ dữ liệu user mới nhất
         * từ Backend vào localStorage.
         */
        saveAuthUser(user);

        set({
          user,
          status: "authenticated",
        });
      } catch {
        clearAuth();

        set({
          user: null,
          status: "unauthenticated",
        });
      }
    })().finally(() => {
      bootstrapPromise = null;
    });

    return bootstrapPromise;
  },

  logout: async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await apiRequest("/auth/logout", {
          method: "POST",

          body: JSON.stringify({
            refreshToken,
          }),
        });
      }
    } catch {
      /**
       * Dù Backend lỗi/network lỗi,
       * phía Admin vẫn phải logout local.
       */
    } finally {
      clearAuth();

      set({
        user: null,
        status: "unauthenticated",
      });
    }
  },
}));
