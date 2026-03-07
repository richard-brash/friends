<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { markRequestReady, getRequestedQueue, type WarehouseRequest } from "../../api/requests";
import { getRoutes } from "../../api/routes";
import type { RouteSummary } from "../../types/api";
import { useToast } from "../../composables/useToast";

const queue = ref<WarehouseRequest[]>([]);
const routes = ref<RouteSummary[]>([]);
const selectedRouteId = ref<string>("");
const loading = ref(true);
const routeLoading = ref(true);
const error = ref<string | null>(null);
const updatingIds = ref<Set<string>>(new Set());
const { showToast } = useToast();

const packingSummary = computed<Array<{ description: string; quantity: number }>>(() => {
  const countsByKey = new Map<string, { description: string; quantity: number }>();

  for (const request of queue.value) {
    for (const item of request.items) {
      const description = item.description.trim();
      if (!description) {
        continue;
      }

      const key = description.toLowerCase();
      const existing = countsByKey.get(key);

      if (existing) {
        existing.quantity += item.quantityRequested;
      } else {
        countsByKey.set(key, {
          description,
          quantity: item.quantityRequested,
        });
      }
    }
  }

  return Array.from(countsByKey.values()).sort((a, b) => b.quantity - a.quantity);
});

async function loadRoutes(): Promise<void> {
  routeLoading.value = true;

  try {
    routes.value = await getRoutes();
  } catch {
    routes.value = [];
  } finally {
    routeLoading.value = false;
  }
}

async function loadQueue(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    queue.value = await getRequestedQueue(selectedRouteId.value || undefined);
  } catch {
    error.value = "Failed to load warehouse queue.";
  } finally {
    loading.value = false;
  }
}

async function onMarkReady(requestId: string): Promise<void> {
  if (updatingIds.value.has(requestId)) {
    return;
  }

  const next = new Set(updatingIds.value);
  next.add(requestId);
  updatingIds.value = next;

  try {
    await markRequestReady(requestId);
    queue.value = queue.value.filter((request) => request.id !== requestId);
    showToast("Request marked ready");
  } catch {
    error.value = "Failed to update request status.";
  } finally {
    const updated = new Set(updatingIds.value);
    updated.delete(requestId);
    updatingIds.value = updated;
  }
}

onMounted(() => {
  void loadRoutes();
  void loadQueue();
});

watch(selectedRouteId, () => {
  void loadQueue();
});
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-4 sm:p-6">
    <header class="mb-5">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Warehouse Queue</h1>
      <p class="mt-1 text-sm text-slate-600">Requests waiting to be prepared.</p>
    </header>

    <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label for="route-filter" class="mb-2 block text-sm font-semibold text-slate-700">Route Filter</label>
      <select
        id="route-filter"
        v-model="selectedRouteId"
        class="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500"
        :disabled="routeLoading"
      >
        <option value="">All Routes</option>
        <option v-for="route in routes" :key="route.id" :value="route.id">
          {{ route.name }}
        </option>
      </select>
    </section>

    <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="mb-3 text-lg font-semibold text-slate-900">Packing Summary</h2>
      <ul v-if="packingSummary.length" class="space-y-2">
        <li
          v-for="summaryItem in packingSummary"
          :key="summaryItem.description"
          class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
        >
          <span class="text-sm text-slate-800">{{ summaryItem.description }}</span>
          <span class="text-sm font-semibold text-slate-900">{{ summaryItem.quantity }}</span>
        </li>
      </ul>
      <p v-else class="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">No items to pack for the selected route.</p>
    </section>

    <h2 class="mb-3 text-xl font-semibold text-slate-900">Requests</h2>

    <p v-if="loading" class="rounded-xl bg-white p-4 text-slate-600 shadow-sm">Loading queue...</p>
    <p v-else-if="error" class="rounded-xl bg-rose-50 p-4 text-rose-700">{{ error }}</p>

    <div v-else-if="queue.length" class="space-y-4">
      <article
        v-for="request in queue"
        :key="request.id"
        class="min-h-[44px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <h2 class="text-lg font-semibold text-slate-900">
            {{ request.personName ?? "Unknown person" }} - {{ request.locationName }}
          </h2>
          <span class="inline-flex min-h-[24px] items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
            [ REQUESTED ]
          </span>
        </div>

        <p class="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Needs:</p>
        <ul class="mt-2 space-y-2">
          <li
            v-for="(item, itemIndex) in request.items"
            :key="`${request.id}-${itemIndex}-${item.description}`"
            class="rounded-xl bg-slate-50 px-3 py-3 text-base text-slate-800"
          >
            {{ item.description }} ({{ item.quantityRequested }})
          </li>
        </ul>

        <button
          type="button"
          class="mt-4 min-h-[44px] w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="updatingIds.has(request.id)"
          @click="onMarkReady(request.id)"
        >
          {{ updatingIds.has(request.id) ? "Updating..." : "Mark Ready" }}
        </button>
      </article>
    </div>

    <p v-else class="rounded-xl bg-white p-4 text-slate-600 shadow-sm">No requests currently waiting in the queue.</p>
  </section>
</template>
