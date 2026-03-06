<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { getRoutes } from "../../api/routes";
import type { RouteSummary } from "../../types/api";

const routes = ref<RouteSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    routes.value = await getRoutes();
  } catch (err) {
    console.error(err);
    error.value = "Failed to load routes.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="mx-auto w-full max-w-2xl p-4 sm:p-6">
    <header class="mb-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Routes</h1>
          <p class="mt-1 text-sm text-slate-600">Choose a route to view stops.</p>
        </div>
      </div>
    </header>

    <p v-if="loading" class="rounded-xl bg-white p-4 text-slate-600 shadow-sm">Loading routes...</p>
    <p v-else-if="error" class="rounded-xl bg-rose-50 p-4 text-rose-700">{{ error }}</p>

    <div v-else class="space-y-3">
      <RouterLink
        v-for="route in routes"
        :key="route.id"
        :to="`/routes/${route.id}`"
        class="block min-h-[44px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        <p class="text-lg font-semibold text-slate-900">{{ route.name }}</p>
        <p class="mt-1 text-sm text-slate-600">{{ route.stopCount }} stops</p>
      </RouterLink>
    </div>
  </section>
</template>
