import { ref } from "vue";
import axios from "axios";
import { apiClient } from "../api/client";
import type { CurrentUser } from "../api/me";
import { loadCurrentUser, setCurrentUser } from "./user";

export const isAuthenticated = ref(false);
export const authReady = ref(false);
export const authError = ref<string | null>(null);

let initialized = false;

function clearAuthState(): void {
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

    isAuthenticated.value = false;
    setCurrentUser(null);
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
  const { data } = await apiClient.post<{ user: CurrentUser }>("/auth/verify-email-code", {
    email,
    token,
  });

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
