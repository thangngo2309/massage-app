import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  isAdminRole,
  LoginResponse,
  saveAuth,
} from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7200/api";

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Dùng chung cho nhiều request bị 401 cùng lúc.
 *
 * Ví dụ:
 *
 * GET /users   -> 401
 * GET /booking -> 401
 * GET /service -> 401
 *
 * Chỉ gọi /auth/refresh 1 lần.
 */
let refreshPromise: Promise<string | null> | null = null;

function shouldTryRefresh(path: string) {
  return !["/auth/login", "/auth/register", "/auth/refresh"].includes(path);
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearAuth();

      return null;
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          refreshToken,
          deviceName: "Admin Web",
        }),
      });

      if (!response.ok) {
        clearAuth();

        return null;
      }

      const data = (await response.json()) as LoginResponse;

      /**
       * Admin Web tuyệt đối không giữ session
       * của client hoặc therapist.
       */
      if (!isAdminRole(data.user.role)) {
        clearAuth();

        return null;
      }

      /**
       * saveAuth sẽ replace cả:
       *
       * access token
       * refresh token mới
       * user
       *
       * => tương thích refresh-token rotation BE.
       */
      saveAuth(data);

      return data.accessToken;
    } catch {
      clearAuth();

      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  let errorData: ApiErrorResponse = {};

  try {
    errorData = await response.json();
  } catch {
    //
  }

  let message = "Có lỗi xảy ra";

  if (Array.isArray(errorData.message)) {
    message = errorData.message.join(", ");
  } else if (errorData.message) {
    message = errorData.message;
  } else if (errorData.error) {
    message = errorData.error;
  }

  return new ApiError(message, response.status);
}

function buildHeaders(options: RequestInit, accessToken?: string | null) {
  const headers = new Headers(options.headers);

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

async function executeRequest(
  path: string,
  options: RequestInit,
  accessToken?: string | null
) {
  return fetch(`${API_URL}${path}`, {
    ...options,

    headers: buildHeaders(options, accessToken),
  });
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();

  let response = await executeRequest(path, options, accessToken);

  /**
   * Access token có thể hết hạn.
   *
   * 401
   * ↓
   * refresh token
   * ↓
   * lấy access token mới
   * ↓
   * retry request ban đầu đúng 1 lần
   */
  if (response.status === 401 && shouldTryRefresh(path)) {
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      response = await executeRequest(path, options, newAccessToken);
    }
  }

  if (!response.ok) {
    /**
     * Sau refresh vẫn 401
     * => session thực sự không còn hợp lệ.
     */
    if (response.status === 401) {
      clearAuth();
    }

    throw await parseErrorResponse(response);
  }

  /**
   * Cho phép những API DELETE/PATCH sau này
   * trả 204 No Content.
   */
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
