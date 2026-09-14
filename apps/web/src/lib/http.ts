import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/auth-storage";

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

let refreshPromise: Promise<string> | null = null;

const performRefresh = async (): Promise<string> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthStorage();

    throw new ApiError("Phiên đăng nhập đã hết hạn.", 401);
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      refreshToken,
      deviceName: "web",
    }),
  });

  if (!response.ok) {
    clearAuthStorage();

    throw await parseErrorResponse(response);
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

export const apiFetch = async <T>(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {}
): Promise<T> => {
  const { auth = true, retryOnUnauthorized = true } = options;

  const headers = new Headers(init.headers);

  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const accessToken = getAccessToken();

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (
    response.status === 401 &&
    auth &&
    retryOnUnauthorized &&
    getRefreshToken()
  ) {
    try {
      const newAccessToken = await refreshAccessToken();

      headers.set("Authorization", `Bearer ${newAccessToken}`);

      response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
      });
    } catch (error) {
      clearAuthStorage();

      throw error;
    }
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
};

export const getApiErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã xảy ra lỗi. Vui lòng thử lại.";
};
