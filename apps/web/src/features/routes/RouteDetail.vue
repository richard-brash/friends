<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { getRoute } from "../../api/routes";
import { setActiveRoute } from "../../stores/routeContext";
import type { RouteDetail as RouteDetailType } from "../../types/api";

const route = useRoute();
const routeDetail = ref<RouteDetailType | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const routeId = computed(() => {
  const value = route.params.id;
  return typeof value === "string" ? value : value?.[0] ?? "";
});

async function loadRoute(): Promise<void> {
  if (!routeId.value) {
    error.value = "Invalid route id.";
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    routeDetail.value = await getRoute(routeId.value);
    setActiveRoute({
      id: routeDetail.value.id,
      name: routeDetail.value.name,
    });
  } catch (err) {
    console.error(err);
    error.value = "Failed to load route.";
  } finally {
    loading.value = false;
  }
}

watch(routeId, () => {
  void loadRoute();
}, { immediate: true });
</script>

<template>
  <section class="mx-auto w-full max-w-2xl p-4 sm:p-6">
    <RouterLink to="/" class="mb-4 inline-flex text-sm font-medium text-sky-700 hover:text-sky-900">
      Back to Routes
    </RouterLink>

    <p v-if="loading" class="rounded-xl bg-white p-4 text-slate-600 shadow-sm">Loading route...</p>
    <p v-else-if="error" class="rounded-xl bg-rose-50 p-4 text-rose-700">{{ error }}</p>

    <template v-else-if="routeDetail">
      <h1 class="mb-4 text-2xl font-bold tracking-tight text-slate-900">{{ routeDetail.name }}</h1>

      <div class="space-y-3">
        <RouterLink
          v-for="stop in routeDetail.stops"
          :key="`${routeDetail.id}-${stop.stopOrder}`"
          :to="{
            path: `/locations/${stop.location.id}`,
            query: { routeId: routeDetail.id },
          }"
          class="flex min-h-[44px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow"
        >
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
            {{ stop.stopOrder }}
          </span>
          <span class="text-base font-medium text-slate-900">{{ stop.location.name }}</span>
        </RouterLink>
      </div>
    </template>
  </section>
</template>
