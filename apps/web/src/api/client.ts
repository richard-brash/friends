import axios from "axios";

const TOKEN_STORAGE_KEY = "fh_access_token_fallback";
const REFRESH_TOKEN_STORAGE_KEY = "fh_refresh_token_fallback";

let bearerAccessToken: string | null = null;
let storedRefreshToken: string | null = null;

function readStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // no-op
  }
}

function readStoredRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredRefreshToken(token: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (token) {
      window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // no-op
  }
}

bearerAccessToken = readStoredToken();
storedRefreshToken = readStoredRefreshToken();

export function setAccessToken(token: string | null): void {
  bearerAccessToken = token?.trim() || null;
  writeStoredToken(bearerAccessToken);
}

export function setRefreshToken(token: string | null): void {
  storedRefreshToken = token?.trim() || null;
  writeStoredRefreshToken(storedRefreshToken);
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (bearerAccessToken && !config.headers?.Authorization) {
    const headers = config.headers;

    if (headers && typeof (headers as { set?: unknown }).set === "function") {
      (headers as { set: (key: string, value: string) => void }).set(
        "Authorization",
        `Bearer ${bearerAccessToken}`,
      );
    } else {
      config.headers = {
        ...(headers || {}),
        Authorization: `Bearer ${bearerAccessToken}`,
      } as typeof config.headers;
    }
  }

  return config;
});

let refreshPromise: Promise<void> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as (typeof error.config & {
      _retry?: boolean;
      skipAuthRefresh?: boolean;
    }) | undefined;

    if (
      !originalRequest
      || originalRequest._retry
      || originalRequest.skipAuthRefresh
      || error.response?.status !== 401
      || (typeof originalRequest.url === "string" && originalRequest.url.startsWith("/auth/"))
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = apiClient
        .post<{ accessToken?: string; refreshToken?: string }>(
          "/auth/refresh",
          storedRefreshToken ? { refreshToken: storedRefreshToken } : undefined,
          { skipAuthRefresh: true } as never,
        )
        .then(({ data }) => {
          if (data?.accessToken) {
            setAccessToken(data.accessToken);
          }
          if (data?.refreshToken) {
            setRefreshToken(data.refreshToken);
          }
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      await refreshPromise;
      return await apiClient(originalRequest);
    } catch {
      setAccessToken(null);
      return Promise.reject(error);
    }
  },
);
