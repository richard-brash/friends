<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div class="flex items-start justify-between gap-3">
          <p class="text-lg font-semibold text-slate-900">Friend Helper</p>
          <div class="text-right">
            <p v-if="currentUser" class="text-sm font-medium text-slate-700">{{ currentUser.name }}</p>
            <button
              v-if="currentUser"
              type="button"
              class="mt-1 text-sm font-medium text-slate-600 underline-offset-2 hover:text-sky-900 hover:underline"
              @click="handleSignOut"
            >
              Sign out
            </button>
          </div>
        </div>

        <nav v-if="route.name !== 'login'" class="flex items-center gap-4 sm:gap-6">
          <RouterLink to="/" class="text-sm font-medium text-slate-700 hover:text-slate-900">
            Routes
          </RouterLink>
          <RouterLink to="/warehouse" class="text-sm font-medium text-slate-700 hover:text-slate-900">
            Warehouse
          </RouterLink>
          <RouterLink to="/dashboard" class="text-sm font-medium text-slate-700 hover:text-slate-900">
            Dashboard
          </RouterLink>
          <RouterLink to="/help" class="text-sm font-medium text-slate-700 hover:text-slate-900">
            Help
          </RouterLink>
          <RouterLink
            v-if="canManageSettings"
            to="/settings"
            class="text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            Settings
          </RouterLink>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:px-6">
      <p>Friend Helper: {{ versionString }}</p>
      <p class="mt-1">© 2026 BrashTEK, BeMoreCaring</p>
    </footer>

    <Toast :visible="isToastVisible" :message="toastMessage" />
    <InstallPromptBanner />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import Toast from "./components/Toast.vue";
import InstallPromptBanner from "./components/InstallPromptBanner.vue";
import { useToast } from "./composables/useToast";
import { signOut } from "./stores/auth";
import { currentUser } from "./stores/user";
import { getVersionString } from "./lib/version";

const { isToastVisible, toastMessage } = useToast();
const route = useRoute();
const router = useRouter();
const versionString = ref("");
const canManageSettings = computed(() => {
  const role = currentUser.value?.role;
  return role === "admin" || role === "manager";
});

onMounted(() => {
  versionString.value = getVersionString();
});

async function handleSignOut(): Promise<void> {
  await signOut();
  await router.push("/login");
}
</script>
