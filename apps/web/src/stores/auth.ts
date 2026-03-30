import { ref } from "vue";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import { setApiAccessToken } from "../api/client";
import { loadCurrentUser, setCurrentUser } from "./user";

export const authSession = ref<Session | null>(null);
export const authReady = ref(false);
export const authError = ref<string | null>(null);

let initialized = false;

async function syncCurrentUser(session: Session | null): Promise<void> {
  authSession.value = session;
  setApiAccessToken(session?.access_token ?? null);

  if (!session) {
    setCurrentUser(null);
    return;
  }

  try {
    await loadCurrentUser();
    authError.value = null;
  } catch (error) {
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
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    await syncCurrentUser(data.session ?? null);

    supabase.auth.onAuthStateChange((_event, session) => {
      void syncCurrentUser(session);
    });

    initialized = true;
  } catch (error) {
    authError.value = error instanceof Error ? error.message : "Authentication is not configured.";
    authSession.value = null;
    setCurrentUser(null);
    setApiAccessToken(null);
  } finally {
    authReady.value = true;
  }
}

export async function sendPhoneOtp(phoneNumber: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber,
  });

  if (error) {
    throw error;
  }
}

export async function verifyPhoneOtp(phoneNumber: string, token: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token,
    type: "sms",
  });

  if (error) {
    throw error;
  }

  await syncCurrentUser(data.session ?? null);
}

export async function sendEmailOtp(email: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({ email });

  if (error) {
    throw error;
  }
}

export async function verifyEmailOtp(email: string, token: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    throw error;
  }

  await syncCurrentUser(data.session ?? null);
}

export async function signOut(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // no-op
  }

  await syncCurrentUser(null);
}
