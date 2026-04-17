import { ref } from "vue";
import axios from "axios";
import { apiClient, setAccessToken, setRefreshToken } from "../api/client";
import type { CurrentUser } from "../api/me";
import { loadCurrentUser, setCurrentUser } from "./user";

export const isAuthenticated = ref(false);
export const authReady = ref(false);
export const authError = ref<string | null>(null);

let initialized = false;

function clearAuthState(): void {
  setAccessToken(null);
  setRefreshToken(null);
  isAuthenticated.value = false;
  authError.value = null;
  setCurrentUser(null);
}

async function syncCurrentUser(): Promise<void> {
  try {
    await loadCurrentUser();
    isAuthenticated.value = true;
    authError.value = null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAuthState();
      return;
    }

    // A 5xx from /me is most likely an auth guard failure (e.g. expired token that
    // wasn't caught as a 401). Clear the stored token so the refresh flow can run
    // on the next page load, rather than leaving a stale Bearer token in memory.
    if (axios.isAxiosError(error) && error.response && error.response.status >= 500) {
      clearAuthState();
    } else {
      isAuthenticated.value = false;
      setCurrentUser(null);
    }

    authError.value = error instanceof Error ? error.message : "Failed to load current user.";
  }
}

export async function initializeAuth(): Promise<void> {
  if (initialized) {
    authReady.value = true;
    return;
  }

  try {
    await syncCurrentUser();
    initialized = true;
  } catch (error) {
    authError.value = error instanceof Error ? error.message : "Authentication is not configured.";
    clearAuthState();
  } finally {
    authReady.value = true;
  }
}

export async function sendEmailOtp(email: string): Promise<void> {
  await apiClient.post("/auth/request-email-code", {
    email,
  });
}

export async function verifyEmailOtp(email: string, token: string): Promise<void> {
  const { data } = await apiClient.post<{ user: CurrentUser; accessToken?: string; refreshToken?: string }>("/auth/verify-email-code", {
    email,
    token,
  });

  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }

  isAuthenticated.value = true;
  authError.value = null;
  setCurrentUser(data.user);
}

export async function signOut(): Promise<void> {
  try {
    await apiClient.post("/auth/logout", undefined, { skipAuthRefresh: true } as never);
  } catch {
    // no-op
  }

  clearAuthState();
}
