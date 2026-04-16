<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { markRequestReady, closeRequest, getRequests, type WarehouseRequest, type WarehouseRequestItem } from "../../api/requests";
import { getRoutes } from "../../api/routes";
import type { RouteSummary } from "../../types/api";
import { useToast } from "../../composables/useToast";
import { currentUser } from "../../stores/user";
import ItemActionSheet from "../../components/ItemActionSheet.vue";

type StatusFilter = "" | "REQUESTED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED" | "CLOSED_UNABLE";

const STATUS_LABELS: Record<StatusFilter, string> = {
  "": "All Statuses",
  REQUESTED: "Requested",
  PREPARING: "Preparing",
  READY: "Ready for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  CLOSED_UNABLE: "Closed — Unable",
};

const queue = ref<WarehouseRequest[]>([]);
const routes = ref<RouteSummary[]>([]);
const selectedRouteId = ref<string>("");
const selectedStatus = ref<StatusFilter>("REQUESTED");
const loading = ref(true);
const routeLoading = ref(true);
const error = ref<string | null>(null);
const updatingIds = ref<Set<string>>(new Set());
const expandedHistoryRequestIds = ref<Set<string>>(new Set());
const { showToast } = useToast();

type SheetState =
  | { open: false }
  | { open: true; item: WarehouseRequestItem; requestId: string; requestStatus: WarehouseRequest["status"]; isNew: false }
  | { open: true; item: WarehouseRequestItem; requestId: string; requestStatus: WarehouseRequest["status"]; isNew: true };

const sheet = ref<SheetState>({ open: false });

const NEW_ITEM_PLACEHOLDER: WarehouseRequestItem = {
  id: "",
  description: "",
  quantityRequested: 1,
  status: "OPEN",
};

function hasAvailableActions(
  item: WarehouseRequestItem,
  requestStatus: WarehouseRequest["status"],
): boolean {
  if (requestStatus === "DELIVERED" || requestStatus === "CANCELLED" || requestStatus === "CLOSED_UNABLE") return false;
  const role = currentUser.value?.role ?? "volunteer";
  const editable = requestStatus === "REQUESTED" || requestStatus === "PREPARING";
  if (editable) return true;
  if ((role === "manager" || role === "admin") && item.status === "UNAVAILABLE") return true;
  if ((role === "manager" || role === "admin") && item.status === "OPEN") return true;
  return false;
}

function openSheet(item: WarehouseRequestItem, request: WarehouseRequest): void {
  sheet.value = {
    open: true,
    item,
    requestId: request.id,
    requestStatus: request.status,
    isNew: false,
  };
}

function openAddItem(request: WarehouseRequest): void {
  sheet.value = {
    open: true,
    item: { ...NEW_ITEM_PLACEHOLDER },
    requestId: request.id,
    requestStatus: request.status,
    isNew: true,
  };
}

function closeSheet(): void {
  sheet.value = { open: false };
}

async function onSheetSave(payload: { description: string; quantity: number }): Promise<void> {
  if (!sheet.value.open) return;
  const { requestId, isNew, item } = sheet.value;
  closeSheet();

  try {
    if (isNew) {
      await import("../../api/requests").then(({ addRequestItem }) =>
        addRequestItem(requestId, { description: payload.description, quantity: payload.quantity }),
      );
      showToast("Item added");
    } else {
      await import("../../api/requests").then(({ updateRequestItem }) =>
        updateRequestItem(requestId, item.id, { description: payload.description, quantity: payload.quantity }),
      );
      showToast("Item updated");
    }
    await loadQueue();
  } catch {
    showToast("Failed to save item");
  }
}

async function onSheetAction(payload: { type: string; notes: string }): Promise<void> {
  if (!sheet.value.open) return;
  const { requestId, item } = sheet.value;
  closeSheet();

  try {
    await import("../../api/requests").then(({ applyItemAction }) =>
      applyItemAction(requestId, item.id, { action: payload.type, notes: payload.notes }),
    );
    const labels: Record<string, string> = {
      "mark-unavailable": "Item marked unavailable",
      "mark-available": "Item marked available",
      "mark-picked": "Item marked picked",
    };
    showToast(labels[payload.type] ?? "Done");
    await loadQueue();
  } catch {
    showToast("Failed to update item");
  }
}

type ParsedNeedDetails = {
  base: string;
  modifiers: string[];
};

function parseNeedDetails(description: string): ParsedNeedDetails {
  const trimmed = description.trim();
  const match = trimmed.match(/^(.*?)\s*\((.*)\)$/);

  if (!match) {
    return {
      base: trimmed,
      modifiers: [],
    };
  }

  const base = (match[1] ?? "").trim();
  const modifierChunk = (match[2] ?? "").trim();

  if (!modifierChunk) {
    return {
      base: base || trimmed,
      modifiers: [],
    };
  }

  return {
    base: base || trimmed,
    modifiers: modifierChunk
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
  };
}

const showPackingSummary = computed(
  () => selectedStatus.value === "REQUESTED" || selectedStatus.value === "",
);

const packingSummary = computed<Array<{ description: string; quantity: number }>>(() => {
  const countsByKey = new Map<string, { description: string; quantity: number }>();

  for (const request of queue.value) {
    if (request.status !== "REQUESTED") {
      continue;
    }

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

function toggleHistory(requestId: string): void {
  const next = new Set(expandedHistoryRequestIds.value);
  if (next.has(requestId)) {
    next.delete(requestId);
  } else {
    next.add(requestId);
  }

  expandedHistoryRequestIds.value = next;
}

function isHistoryExpanded(requestId: string): boolean {
  return expandedHistoryRequestIds.value.has(requestId);
}

function formatHistoryTimestamp(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function getRequestHistory(request: WarehouseRequest) {
  return request.history ?? [];
}

function getStatusBadgeClass(status: WarehouseRequest["status"]): string {
  const map: Record<WarehouseRequest["status"], string> = {
    REQUESTED: "bg-amber-100 text-amber-800",
    PREPARING: "bg-sky-100 text-sky-800",
    READY: "bg-emerald-100 text-emerald-800",
    DELIVERED: "bg-slate-100 text-slate-700",
    CANCELLED: "bg-rose-100 text-rose-700",
    CLOSED_UNABLE: "bg-rose-100 text-rose-700",
  };

  return map[status] ?? "bg-slate-100 text-slate-700";
}

function getStatusLabel(status: WarehouseRequest["status"]): string {
  return STATUS_LABELS[status] ?? status;
}

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
    queue.value = await getRequests(
      selectedStatus.value || undefined,
      selectedRouteId.value || undefined,
    );
  } catch {
    error.value = "Failed to load requests.";
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
    if (selectedStatus.value === "REQUESTED") {
      queue.value = queue.value.filter((request) => request.id !== requestId);
    } else {
      await loadQueue();
    }

    showToast("Request marked ready");
  } catch {
    error.value = "Failed to update request status.";
  } finally {
    const updated = new Set(updatingIds.value);
    updated.delete(requestId);
    updatingIds.value = updated;
  }
}

async function onCloseUnable(requestId: string): Promise<void> {
  const confirmed = window.confirm("Close this request — unable to find person? This will close all open items.");
  if (!confirmed) return;

  if (updatingIds.value.has(requestId)) return;

  const next = new Set(updatingIds.value);
  next.add(requestId);
  updatingIds.value = next;

  try {
    await closeRequest(requestId);
    queue.value = queue.value.filter((r) => r.id !== requestId);
    showToast("Request closed");
  } catch {
    error.value = "Failed to close request.";
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

watch([selectedRouteId, selectedStatus], () => {
  void loadQueue();
});
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-4 sm:p-6">
    <header class="mb-5">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Warehouse</h1>
      <p class="mt-1 text-sm text-slate-600">Track and manage all requests across the workflow.</p>
    </header>

    <!-- Filters -->
    <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 class="mb-3 text-sm font-semibold text-slate-700">Filters</h2>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label for="status-filter" class="mb-1 block text-xs font-medium text-slate-600">Status</label>
          <select
            id="status-filter"
            v-model="selectedStatus"
            class="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500"
          >
            <option v-for="(label, value) in STATUS_LABELS" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>
        <div>
          <label for="route-filter" class="mb-1 block text-xs font-medium text-slate-600">Route</label>
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
        </div>
      </div>
    </section>

    <!-- Packing Summary (only relevant for REQUESTED view) -->
    <section v-if="showPackingSummary" class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="mb-3 text-lg font-semibold text-slate-900">Packing Summary</h2>
      <ul v-if="packingSummary.length" class="space-y-2">
        <li
          v-for="summaryItem in packingSummary"
          :key="summaryItem.description"
          class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
        >
          <span class="text-sm text-slate-800">
            <span class="font-medium">{{ parseNeedDetails(summaryItem.description).base }}</span>
            <span
              v-if="parseNeedDetails(summaryItem.description).modifiers.length"
              class="ml-1 text-slate-600"
            >
              - {{ parseNeedDetails(summaryItem.description).modifiers.join(", ") }}
            </span>
          </span>
          <span class="text-sm font-semibold text-slate-900">{{ summaryItem.quantity }}</span>
        </li>
      </ul>
      <p v-else class="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">No items to pack for the selected filters.</p>
    </section>

    <!-- Request count -->
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-slate-900">Requests</h2>
      <span v-if="!loading" class="text-sm text-slate-500">{{ queue.length }} result{{ queue.length === 1 ? "" : "s" }}</span>
    </div>

    <p v-if="loading" class="rounded-xl bg-white p-4 text-slate-600 shadow-sm">Loading...</p>
    <p v-else-if="error" class="rounded-xl bg-rose-50 p-4 text-rose-700">{{ error }}</p>

    <div v-else-if="queue.length" class="space-y-4">
      <article
        v-for="request in queue"
        :key="request.id"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <!-- Header row -->
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold text-slate-900">
              {{ request.personName ?? "Unknown person" }}
            </h3>
            <p class="mt-0.5 text-sm text-slate-500">{{ request.locationName }}</p>
          </div>
          <span
            class="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="getStatusBadgeClass(request.status)"
          >
            {{ getStatusLabel(request.status) }}
          </span>
        </div>

        <!-- Needs -->
        <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Needs</p>
        <ul class="mt-2 space-y-2">
          <li
            v-for="(item, itemIndex) in request.items"
            :key="`${request.id}-${itemIndex}-${item.description}`"
          >
            <component
              :is="hasAvailableActions(item, request.status) ? 'button' : 'div'"
              v-bind="hasAvailableActions(item, request.status) ? { type: 'button' } : {}"
              class="w-full rounded-xl bg-slate-50 px-3 py-3 text-left"
              :class="hasAvailableActions(item, request.status) ? 'hover:bg-slate-100 active:bg-slate-200 cursor-pointer' : ''"
              @click="hasAvailableActions(item, request.status) ? openSheet(item, request) : undefined"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p class="text-base text-slate-800">
                    {{ parseNeedDetails(item.description).base }} ({{ item.quantityRequested }})
                  </p>
                  <div
                    v-if="parseNeedDetails(item.description).modifiers.length"
                    class="mt-2 flex flex-wrap gap-1"
                  >
                    <span
                      v-for="modifier in parseNeedDetails(item.description).modifiers"
                      :key="`${item.description}-${modifier}`"
                      class="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800"
                    >
                      {{ modifier }}
                    </span>
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <span
                    v-if="item.status !== 'OPEN'"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                    :class="{
                      'bg-emerald-100 text-emerald-800': item.status === 'READY',
                      'bg-sky-100 text-sky-800': item.status === 'OUT_FOR_DELIVERY',
                      'bg-slate-100 text-slate-700': item.status === 'DELIVERED',
                      'bg-rose-100 text-rose-700': item.status === 'CLOSED_UNABLE',
                      'bg-orange-100 text-orange-800': item.status === 'UNAVAILABLE',
                    }"
                  >
                    {{
                      item.status === 'READY' ? 'Ready' :
                      item.status === 'OUT_FOR_DELIVERY' ? 'Out for delivery' :
                      item.status === 'DELIVERED' ? 'Delivered' :
                      item.status === 'CLOSED_UNABLE' ? 'Closed' :
                      item.status === 'UNAVAILABLE' ? 'Unavailable' : ''
                    }}
                  </span>
                  <svg
                    v-if="hasAvailableActions(item, request.status)"
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 shrink-0 text-slate-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </component>
          </li>
        </ul>

        <!-- Add item -->
        <button
          v-if="request.status === 'REQUESTED' || request.status === 'PREPARING'"
          type="button"
          class="mt-2 flex w-full items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700"
          @click="openAddItem(request)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add item
        </button>

        <!-- History accordion -->
        <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 px-3 py-3 text-left"
            @click="toggleHistory(request.id)"
          >
            <span class="text-sm font-semibold text-slate-800">
              History
              <span class="ml-1 font-normal text-slate-500">({{ getRequestHistory(request).length }})</span>
            </span>
            <span class="text-slate-400 transition-transform" :class="isHistoryExpanded(request.id) ? 'rotate-180' : ''">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
              </svg>
            </span>
          </button>
          <div v-if="isHistoryExpanded(request.id)" class="border-t border-slate-200 px-3 py-3">
            <ul v-if="getRequestHistory(request).length" class="space-y-3">
              <li v-for="entry in getRequestHistory(request)" :key="`${request.id}-${entry.timestamp}-${entry.title}-${entry.detail ?? ''}`">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ formatHistoryTimestamp(entry.timestamp) }}</p>
                <p class="mt-1 text-sm font-medium text-slate-800">{{ entry.title }}</p>
                <p v-if="entry.detail" class="mt-1 text-sm text-slate-600">{{ entry.detail }}</p>
              </li>
            </ul>
            <p v-else class="text-sm text-slate-500">No history recorded yet.</p>
          </div>
        </div>

        <!-- Action: Mark Ready / Close Unable (only for REQUESTED/PREPARING) -->
        <div
          v-if="request.status === 'REQUESTED' || request.status === 'PREPARING'"
          class="mt-4 flex gap-2"
        >
          <button
            type="button"
            class="min-h-[44px] flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="updatingIds.has(request.id)"
            @click="onMarkReady(request.id)"
          >
            {{ updatingIds.has(request.id) ? "Updating..." : "Mark Ready" }}
          </button>
          <button
            type="button"
            class="min-h-[44px] rounded-xl border border-rose-300 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="updatingIds.has(request.id)"
            @click="onCloseUnable(request.id)"
          >
            Can't Find Person
          </button>
        </div>
      </article>
    </div>

    <p v-else class="rounded-xl bg-white p-4 text-slate-600 shadow-sm">
      No requests found for the selected filters.
    </p>
  </section>

  <!-- Item action sheet (teleported to body to escape card stacking context) -->
  <Teleport to="body">
    <ItemActionSheet
      v-if="sheet.open"
      :item="sheet.item"
      :request-status="sheet.requestStatus"
      :user-role="currentUser?.role ?? 'volunteer'"
      :is-new="sheet.isNew"
      @save="onSheetSave"
      @action="onSheetAction"
      @close="closeSheet"
    />
  </Teleport>
</template>
