<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div>
          <p class="text-lg font-semibold text-slate-900">Friend Helper</p>
          <RouterLink
            v-if="runningRoute"
            :to="`/routes/${runningRoute.id}`"
            class="mt-1 inline-flex cursor-pointer text-sm font-medium text-slate-600 underline-offset-2 hover:text-sky-900 hover:underline"
          >
            <span class="mr-1" aria-hidden="true">📍</span>
            {{ runningRoute.name }}
          </RouterLink>
        </div>

        <nav class="flex items-center gap-4 sm:gap-6">
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
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:px-6">
      <p>Friend Helper MVP v0.1</p>
      <p class="mt-1">© 2026 BrashTEK, BeMoreCaring</p>
    </footer>

    <Toast :visible="isToastVisible" :message="toastMessage" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterView } from "vue-router";
import Toast from "./components/Toast.vue";
import { useToast } from "./composables/useToast";
import { activeRoute, getActiveRoute } from "./stores/routeContext";

const { isToastVisible, toastMessage } = useToast();
const runningRoute = computed(() => activeRoute.value ?? getActiveRoute());
</script>
