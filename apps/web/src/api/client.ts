import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
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
        .post("/auth/refresh", undefined, { skipAuthRefresh: true } as never)
        .then(() => undefined)
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      await refreshPromise;
      return await apiClient(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  },
);
