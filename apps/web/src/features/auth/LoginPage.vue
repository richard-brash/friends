<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authError, sendEmailOtp, verifyEmailOtp } from "../../stores/auth";

const REMEMBERED_EMAIL_KEY = "login-email";

const router = useRouter();
const route = useRoute();

type Step = "input" | "code";

const step = ref<Step>("input");
const email = ref("");
const otpCode = ref("");
const submitting = ref(false);
const error = ref<string | null>(null);
const message = ref<string | null>(null);

onMounted(() => {
  const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY);
  if (saved) {
    email.value = saved;
  }
});

const canSendCode = computed(() => !submitting.value && email.value.trim().includes("@"));
const canVerifyCode = computed(() => otpCode.value.trim().length >= 6 && !submitting.value);
const hasRememberedEmail = ref(!!localStorage.getItem(REMEMBERED_EMAIL_KEY));

function forgetEmail(): void {
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  email.value = "";
  hasRememberedEmail.value = false;
}

async function requestCode(): Promise<void> {
  submitting.value = true;
  error.value = null;
  message.value = null;

  try {
    await sendEmailOtp(email.value.trim());
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email.value.trim());
    message.value = "Code sent. Check your email.";
    step.value = "code";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to send code.";
  } finally {
    submitting.value = false;
  }
}

async function verifyCode(): Promise<void> {
  submitting.value = true;
  error.value = null;

  try {
    await verifyEmailOtp(email.value.trim(), otpCode.value.trim());
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.push(redirect);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Invalid code.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center p-4 sm:p-6">
    <div class="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Sign in</h1>
      <p class="mt-2 text-sm text-slate-600">Use your email to receive a one-time login code.</p>

      <form class="mt-5 space-y-4" @submit.prevent="step === 'input' ? requestCode() : verifyCode()">
        <div>
          <div class="mb-2 flex items-baseline justify-between">
            <label for="email-address" class="text-sm font-semibold text-slate-700">Email address</label>
            <button
              v-if="hasRememberedEmail && step === 'input'"
              type="button"
              class="text-xs text-slate-400 hover:text-rose-500"
              @click="forgetEmail"
            >
              Forget me
            </button>
          </div>
          <input
            id="email-address"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500"
            :disabled="step === 'code'"
          />
        </div>

        <!-- OTP code input -->
        <div v-if="step === 'code'">
          <label for="otp-code" class="mb-2 block text-sm font-semibold text-slate-700">Verification code</label>
          <input
            id="otp-code"
            v-model="otpCode"
            inputmode="numeric"
            autocomplete="one-time-code"
            placeholder="123456"
            class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500"
          />
        </div>

        <p v-if="message" class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{{ message }}</p>
        <p v-if="error || authError" class="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{{ error ?? authError }}</p>

        <button
          v-if="step === 'input'"
          type="submit"
          class="w-full rounded-xl bg-sky-700 px-4 py-4 text-base font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="!canSendCode"
        >
          {{ submitting ? "Sending..." : "Send code" }}
        </button>

        <button
          v-else
          type="submit"
          class="w-full rounded-xl bg-emerald-600 px-4 py-4 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="!canVerifyCode"
        >
          {{ submitting ? "Verifying..." : "Verify and sign in" }}
        </button>

        <button
          v-if="step === 'code'"
          type="button"
          class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          @click="requestCode"
        >
          Resend code
        </button>
      </form>
    </div>
  </section>
</template>
