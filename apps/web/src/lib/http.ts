import {
  expireAuthSession,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/auth-storage";

import { useLanguageStore } from "@/stores/language-store";

import type { RefreshResponse } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7200/api";

type ApiFetchOptions = {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * =========================================
 * LANGUAGE
 * =========================================
 */

/**
 * Lấy language hiện tại trực tiếp từ Zustand store.
 *
 * Không sử dụng React hook trong apiFetch vì apiFetch
 * không phải React component/hook.
 *
 * Zustand cho phép đọc state bên ngoài React thông qua:
 *
 * useLanguageStore.getState()
 */
const getCurrentLanguage = () => {
  const language = useLanguageStore.getState().language?.trim();

  return language || "vi";
};

/**
 * =========================================
 * ERROR RESPONSE
 * =========================================
 */

const parseErrorResponse = async (response: Response) => {
  let data: ApiErrorPayload | null = null;

  try {
    data = (await response.json()) as ApiErrorPayload;
  } catch {
    data = null;
  }

  let message = `Request failed with status ${response.status}`;

  if (Array.isArray(data?.message)) {
    message = data.message.join(", ");
  } else if (typeof data?.message === "string") {
    message = data.message;
  } else if (typeof data?.error === "string") {
    message = data.error;
  }

  return new ApiError(message, response.status, data);
};

/**
 * =========================================
 * REFRESH TOKEN
 * =========================================
 */

let refreshPromise: Promise<string> | null = null;

const performRefresh = async (): Promise<string> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    expireAuthSession();

    throw new ApiError("Phiên đăng nhập đã hết hạn.", 401);
  }

  const language = getCurrentLanguage();

  /**
   * Nếu fetch throw do Backend offline /
   * network error, KHÔNG clear session.
   */
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      /**
       * Giữ Accept-Language đồng nhất
       * cho cả refresh request.
       */
      "Accept-Language": language,
    },

    body: JSON.stringify({
      refreshToken,
      deviceName: "web",
    }),
  });

  if (!response.ok) {
    const error = await parseErrorResponse(response);

    /**
     * Refresh token thật sự không hợp lệ.
     *
     * 400: malformed/invalid refresh payload
     * 401: expired/revoked token
     * 403: token/user không còn được phép
     *
     * 5xx KHÔNG clear vì đó là lỗi server.
     */
    if ([400, 401, 403].includes(response.status)) {
      expireAuthSession();
    }

    throw error;
  }

  const data = (await response.json()) as RefreshResponse;

  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);

  return data.accessToken;
};

export const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

/**
 * =========================================
 * API FETCH
 * =========================================
 */

export const apiFetch = async <T>(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {}
): Promise<T> => {
  const { auth = true, retryOnUnauthorized = true } = options;

  const headers = new Headers(init.headers);

  /**
   * =========================================
   * ACCEPT LANGUAGE
   * =========================================
   *
   * Nếu caller chưa chủ động truyền
   * Accept-Language thì tự động lấy language
   * hiện tại từ Zustand store.
   *
   * Ví dụ:
   *
   * language-store = "en"
   *
   * =>
   *
   * Accept-Language: en
   *
   * Caller vẫn có thể override:
   *
   * apiFetch("/services", {
   *   headers: {
   *     "Accept-Language": "vi",
   *   },
   * });
   */
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", getCurrentLanguage());
  }

  /**
   * =========================================
   * CONTENT TYPE
   * =========================================
   */

  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  /**
   * =========================================
   * AUTHORIZATION
   * =========================================
   */

  if (auth) {
    const accessToken = getAccessToken();

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  /**
   * Network error ở đây sẽ throw trực tiếp.
   *
   * Không có bất kỳ
   * clearAuthStorage nào.
   */
  let response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  /**
   * =========================================
   * AUTO REFRESH TOKEN
   * =========================================
   */

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      expireAuthSession();

      throw await parseErrorResponse(response);
    }

    /**
     * refreshAccessToken tự quyết định:
     *
     * invalid refresh
     *   → expire session
     *
     * network / 5xx
     *   → giữ session
     */
    const newAccessToken = await refreshAccessToken();

    headers.set("Authorization", `Bearer ${newAccessToken}`);

    /**
     * Đọc lại language trước khi retry.
     *
     * Trong trường hợp user vừa đổi language
     * trong lúc request đang refresh token,
     * request retry sẽ dùng language mới nhất.
     *
     * Tuy nhiên nếu caller chủ động override
     * Accept-Language thì giữ nguyên override.
     */
    if (!init.headers) {
      headers.set("Accept-Language", getCurrentLanguage());
    } else {
      const originalHeaders = new Headers(init.headers);

      if (!originalHeaders.has("Accept-Language")) {
        headers.set("Accept-Language", getCurrentLanguage());
      }
    }

    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
    });

    /**
     * Refresh vừa thành công nhưng access
     * token mới vẫn bị 401 => session không
     * còn hợp lệ.
     */
    if (response.status === 401) {
      expireAuthSession();
    }
  }

  /**
   * =========================================
   * RESPONSE ERROR
   * =========================================
   */

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  /**
   * =========================================
   * EMPTY RESPONSE
   * =========================================
   */

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
};

/**
 * =========================================
 * API ERROR MESSAGE
 * =========================================
 */

export const getApiErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã xảy ra lỗi. Vui lòng thử lại.";
};
