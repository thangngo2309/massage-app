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

import { useClientBookingFlowStore } from "@/stores/client-booking-flow-store";

import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
} from "@/types/auth";

type AuthState = {
  user: AuthUser | null;

  initialized: boolean;

  loading: boolean;

  initialize: () => Promise<void>;

  login: (payload: LoginPayload) => Promise<AuthUser>;

  register: (payload: RegisterPayload) => Promise<RegisterResponse>;

  logout: () => Promise<void>;

  setUser: (user: AuthUser | null) => void;
};

const bindBookingFlowToUser = (userId: number) => {
  useClientBookingFlowStore.getState().bindUser(userId);
};

const resetBookingFlow = () => {
  useClientBookingFlowStore.getState().reset();
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,

  initialized: false,

  loading: false,

  /**
   * =============================================
   * SET USER
   * =============================================
   *
   * setUser(null) hiện đang được AuthBootstrap dùng
   * khi nhận AUTH_SESSION_EXPIRED_EVENT.
   *
   * Vì vậy reset booking flow tại đây để session
   * hết hạn cũng không giữ lại data của user cũ.
   */
  setUser: (user) => {
    if (user) {
      setStoredUser(user);

      bindBookingFlowToUser(user.id);
    } else {
      resetBookingFlow();
    }

    set({
      user,
    });
  },

  /**
   * =============================================
   * INITIALIZE
   * =============================================
   */
  initialize: async () => {
    if (get().initialized || get().loading) {
      return;
    }

    const accessToken = getAccessToken();

    const refreshToken = getRefreshToken();

    const storedUser = getStoredUser();

    /**
     * Không có bất kỳ session nào.
     *
     * Không cho booking flow cũ tồn tại tiếp.
     */
    if (!accessToken && !refreshToken) {
      resetBookingFlow();

      set({
        user: null,

        initialized: true,

        loading: false,
      });

      return;
    }

    /**
     * Dùng cached user trong lúc kiểm tra session.
     *
     * Đồng thời bind booking flow ngay lập tức để
     * tránh render dữ liệu của user khác trong lúc
     * GET /auth/me đang chạy.
     */
    if (storedUser) {
      bindBookingFlowToUser(storedUser.id);
    }

    set({
      user: storedUser,

      loading: true,
    });

    try {
      const user = await getMeApi();

      setStoredUser(user);

      /**
       * Nếu cached user và user trả về từ server
       * không giống nhau thì bindUser sẽ tự reset.
       */
      bindBookingFlowToUser(user.id);

      set({
        user,

        initialized: true,

        loading: false,
      });
    } catch (error) {
      /**
       * http.ts có thể đã expire session
       * nếu refresh token thực sự invalid.
       *
       * Kiểm tra storage lại tại thời điểm catch.
       */
      const sessionStillExists = Boolean(getAccessToken() || getRefreshToken());

      if (!sessionStillExists) {
        resetBookingFlow();

        set({
          user: null,

          initialized: true,

          loading: false,
        });

        return;
      }

      /**
       * Session vẫn còn =>
       * khả năng API offline/network/5xx.
       *
       * Không logout user.
       */
      console.warn(
        "[Auth] Unable to verify session. Keeping local session.",
        error
      );

      if (storedUser) {
        bindBookingFlowToUser(storedUser.id);
      }

      set({
        user: storedUser,

        initialized: true,

        loading: false,
      });
    }
  },

  /**
   * =============================================
   * LOGIN
   * =============================================
   */
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

      /**
       * Nếu sessionStorage còn flow của user trước
       * thì bindUser sẽ reset ngay tại đây.
       */
      bindBookingFlowToUser(response.user.id);

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

  /**
   * =============================================
   * REGISTER
   * =============================================
   *
   * Register hiện tại chưa login ngay.
   *
   * User phải đi qua OTP trước nên không bind
   * booking flow ở đây.
   */
  register: async (payload) => {
    set({
      loading: true,
    });

    try {
      const response = await registerApi({
        ...payload,

        deviceName: payload.deviceName ?? "web",
      });

      set({
        loading: false,
      });

      return response;
    } catch (error) {
      set({
        loading: false,
      });

      throw error;
    }
  },

  /**
   * =============================================
   * LOGOUT
   * =============================================
   */
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
      /**
       * Logout chủ động:
       *
       * kể cả Backend offline hoặc request logout
       * thất bại thì phía local vẫn phải logout.
       */
    } finally {
      /**
       * Auth data.
       */
      clearAuthStorage();

      /**
       * Booking flow cũng là dữ liệu theo user.
       *
       * Tuyệt đối không để user tiếp theo
       * sử dụng location / service / KTV của user cũ.
       */
      resetBookingFlow();

      set({
        user: null,

        initialized: true,

        loading: false,
      });
    }
  },
}));
