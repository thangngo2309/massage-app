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

import { ApiError, ApiNetworkError, apiRequest } from "@/lib/api";

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
     * Tránh React StrictMode hoặc nhiều
     * component bootstrap session cùng lúc.
     */
    if (bootstrapPromise) {
      return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
      const accessToken = getAccessToken();

      const refreshToken = getRefreshToken();

      const cachedUser = getAuthUser();

      /**
       * Không có đầy đủ session local.
       *
       * Trường hợp này có thể xác định
       * unauthenticated ngay mà không cần
       * gọi Backend.
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
       * Có session nhưng role local không
       * phải Admin.
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
         * Bình thường vẫn verify session
         * với Backend.
         *
         * Nếu access token hết hạn,
         * apiRequest tự refresh token.
         */
        const user = await apiRequest<AuthUser>("/auth/me");

        /**
         * Backend trả user nhưng role
         * không còn quyền Admin.
         */
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
         * từ Backend.
         */
        saveAuthUser(user);

        set({
          user,
          status: "authenticated",
        });
      } catch (error) {
        /**
         * =================================================
         * NETWORK ERROR
         * =================================================
         *
         * Backend đang tắt / restart /
         * mất mạng.
         *
         * Không có bằng chứng session
         * đã hết hạn.
         *
         * Giữ cachedUser để Admin vẫn ở
         * trong ứng dụng.
         */
        if (error instanceof ApiNetworkError) {
          set({
            user: cachedUser,
            status: "authenticated",
          });

          return;
        }

        /**
         * =================================================
         * SERVER ERROR
         * =================================================
         *
         * 5xx không phải authentication
         * failure.
         *
         * Backend có thể đang deploy,
         * DB lỗi hoặc reverse proxy trả
         * 502/503.
         *
         * Không logout Admin.
         */
        if (error instanceof ApiError && error.status >= 500) {
          set({
            user: cachedUser,
            status: "authenticated",
          });

          return;
        }

        /**
         * =================================================
         * AUTHENTICATION ERROR
         * =================================================
         *
         * 401 / 403 hoặc lỗi xác định
         * session không hợp lệ.
         */
        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          clearAuth();

          set({
            user: null,
            status: "unauthenticated",
          });

          return;
        }

        /**
         * Với lỗi HTTP khác như 400/404,
         * bootstrap /auth/me không nên
         * xóa session một cách mù quáng.
         *
         * Giữ cached session.
         */
        set({
          user: cachedUser,
          status: "authenticated",
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
       * Logout là hành động chủ động
       * của người dùng.
       *
       * Dù Backend offline/network lỗi
       * thì local session vẫn phải được
       * xóa.
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
