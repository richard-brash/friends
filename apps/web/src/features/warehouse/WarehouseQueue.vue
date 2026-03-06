<script setup lang="ts">
import { onMounted, ref } from "vue";
import { markRequestReady, getRequestedQueue, type WarehouseRequest } from "../../api/requests";
import { useToast } from "../../composables/useToast";

const queue = ref<WarehouseRequest[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const updatingIds = ref<Set<string>>(new Set());
const { showToast } = useToast();

async function loadQueue(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    queue.value = await getRequestedQueue();
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
  void loadQueue();
});
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-4 sm:p-6">
    <header class="mb-5">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Warehouse Queue</h1>
      <p class="mt-1 text-sm text-slate-600">Requests waiting to be prepared.</p>
    </header>

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
