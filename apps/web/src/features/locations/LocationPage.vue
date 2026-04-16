<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { createDeliveryAttempt } from "../../api/deliveryAttempts";
import { useToast } from "../../composables/useToast";
import { getLocation } from "../../api/locations";
import { currentUser } from "../../stores/user";
import { activeRoute } from "../../stores/routeContext";
import type { LocationDetail, PersonSummary, RequestItem, RequestSummary } from "../../types/api";
import ItemActionSheet from "../../components/ItemActionSheet.vue";
import { addRequestItem, applyItemAction, updateRequestItem, closeRequest, type NeedStatus, type WarehouseRequestItem } from "../../api/requests";

type RequestsByPerson = {
  key: string;
  name: string;
  requests: RequestSummary[];
};

const route = useRoute();
const router = useRouter();
const location = ref<LocationDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const submittingItemIds = ref<Set<string>>(new Set());
const confirmingDeliveryItemId = ref<string | null>(null);
const expandedHistoryRequestIds = ref<Set<string>>(new Set());
let confirmDeliveryTimeout: ReturnType<typeof setTimeout> | null = null;
const { showToast } = useToast();
const deliveredExpanded = ref(false);

type SheetState =
  | { open: false }
  | { open: true; item: WarehouseRequestItem; requestId: string; requestStatus: RequestSummary["status"]; isNew: boolean };

const sheet = ref<SheetState>({ open: false });

const NEW_ITEM_PLACEHOLDER: WarehouseRequestItem = {
  id: "",
  description: "",
  quantityRequested: 1,
  status: "OPEN",
};

function toSheetItem(item: RequestItem): WarehouseRequestItem {
  return {
    id: item.id,
    description: item.description,
    quantityRequested: item.quantityRequested,
    status: (item.status ?? "OPEN") as NeedStatus,
  };
}

function hasAvailableActions(
  item: WarehouseRequestItem,
  requestStatus: RequestSummary["status"],
): boolean {
  if (requestStatus === "DELIVERED" || requestStatus === "CANCELLED" || requestStatus === "CLOSED_UNABLE") return false;
  const role = currentUser.value?.role ?? "volunteer";
  const editable = requestStatus === "REQUESTED" || requestStatus === "PREPARING";
  if (editable) return true;
  if ((role === "manager" || role === "admin") && item.status === "UNAVAILABLE") return true;
  if ((role === "manager" || role === "admin") && item.status === "OPEN") return true;
  return false;
}

function openSheet(item: WarehouseRequestItem, request: RequestSummary): void {
  sheet.value = {
    open: true,
    item,
    requestId: request.id,
    requestStatus: request.status,
    isNew: false,
  };
}

function openAddItem(request: RequestSummary): void {
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
      await addRequestItem(requestId, { description: payload.description, quantity: payload.quantity });
      showToast("Item added");
    } else {
      await updateRequestItem(requestId, item.id, { description: payload.description, quantity: payload.quantity });
      showToast("Item updated");
    }
    await loadLocation();
  } catch {
    showToast("Failed to save item");
  }
}

async function onSheetAction(payload: { type: string; notes: string }): Promise<void> {
  if (!sheet.value.open) return;
  const { requestId, item } = sheet.value;
  closeSheet();
  try {
    await applyItemAction(requestId, item.id, { action: payload.type, notes: payload.notes });
    const labels: Record<string, string> = {
      "mark-unavailable": "Item marked unavailable",
      "mark-available": "Item marked available",
      "mark-picked": "Item marked picked",
    };
    showToast(labels[payload.type] ?? "Done");
    await loadLocation();
  } catch {
    showToast("Failed to update item");
  }
}

async function onCloseUnable(requestId: string): Promise<void> {
  const confirmed = window.confirm("Close this request — unable to find person?");
  if (!confirmed) return;
  try {
    await closeRequest(requestId);
    showToast("Request closed");
    await loadLocation();
  } catch {
    showToast("Failed to close request");
  }
}

const locationId = computed(() => {
  const value = route.params.id;
  return typeof value === "string" ? value : value?.[0] ?? "";
});

const routeIdFromQuery = computed(() => {
  const value = route.query.routeId;
  return typeof value === "string" ? value : value?.[0] ?? "";
});

function goBackToRoute(): void {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  void router.push("/");
}

function formatLastSeen(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const days = Math.round((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-days, "day");
}

function getLastSeenLabel(person: PersonSummary): string {
  const relativeTime = formatLastSeen(person.lastEncounterAt);
  if (!relativeTime) {
    return "New contact";
  }

  const locationName = person.lastEncounterLocationName?.trim();
  if (!locationName) {
    return `Last seen: ${relativeTime}`;
  }

  return `Last seen: ${relativeTime} - ${locationName}`;
}

const people = computed<PersonSummary[]>(() => location.value?.people ?? []);

const needsDeliveryRequestsByPerson = computed<RequestsByPerson[]>(() => {
  const grouped = new Map<string, RequestsByPerson>();

  for (const request of location.value?.requests ?? []) {
    if (request.status !== "REQUESTED" && request.status !== "READY") {
      continue;
    }

    const personName = request.person?.displayName?.trim() || "Unknown person";
    const key = personName.toLowerCase();
    const existing = grouped.get(key);

    if (existing) {
      existing.requests.push(request);
    } else {
      grouped.set(key, {
        key,
        name: personName,
        requests: [request],
      });
    }
  }

  return Array.from(grouped.values());
});

const deliveredRequestsByPerson = computed<RequestsByPerson[]>(() => {
  const grouped = new Map<string, RequestsByPerson>();

  for (const request of location.value?.requests ?? []) {
    if (request.status !== "DELIVERED") {
      continue;
    }

    const personName = request.person?.displayName?.trim() || "Unknown person";
    const key = personName.toLowerCase();
    const existing = grouped.get(key);

    if (existing) {
      existing.requests.push(request);
    } else {
      grouped.set(key, {
        key,
        name: personName,
        requests: [request],
      });
    }
  }

  return Array.from(grouped.values());
});

function getStatusBadgeClass(status: RequestSummary["status"]): string {
  if (status === "REQUESTED") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "READY") {
    return "bg-sky-100 text-sky-800";
  }

  if (status === "DELIVERED") {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-slate-100 text-slate-700";
}

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

function getRequestHistory(request: RequestSummary) {
  return request.history ?? [];
}

function clearDeliveryConfirmationTimeout(): void {
  if (!confirmDeliveryTimeout) {
    return;
  }

  clearTimeout(confirmDeliveryTimeout);
  confirmDeliveryTimeout = null;
}

function resetDeliveryConfirmation(): void {
  clearDeliveryConfirmationTimeout();
  confirmingDeliveryItemId.value = null;
}

function startDeliveryConfirmation(requestItemId: string): void {
  confirmingDeliveryItemId.value = requestItemId;
  clearDeliveryConfirmationTimeout();
  confirmDeliveryTimeout = setTimeout(() => {
    confirmingDeliveryItemId.value = null;
    confirmDeliveryTimeout = null;
  }, 3000);
}

function handleDeliveryButtonClick(requestItemId: string): void {
  if (confirmingDeliveryItemId.value === requestItemId) {
    void submitDeliveryAttempt(requestItemId, "DELIVERED");
    return;
  }

  startDeliveryConfirmation(requestItemId);
}

function handleDocumentClick(event: Event): void {
  if (!confirmingDeliveryItemId.value) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    resetDeliveryConfirmation();
    return;
  }

  if (target.closest('[data-delivery-confirm-button="true"]')) {
    return;
  }

  resetDeliveryConfirmation();
}

function getDeliveryContext(): { routeId?: string; locationName?: string } {
  return {
    routeId: activeRoute.value?.id,
    locationName: location.value?.name,
  };
}

async function submitDeliveryAttempt(requestItemId: string, outcome: "DELIVERED" | "ATTEMPTED_NOT_FOUND") {
  if (submittingItemIds.value.has(requestItemId)) {
    return;
  }

  if (!currentUser.value?.id) {
    error.value = "Unable to identify current user.";
    return;
  }

  const next = new Set(submittingItemIds.value);
  next.add(requestItemId);
  submittingItemIds.value = next;
  resetDeliveryConfirmation();

  try {
    await createDeliveryAttempt(requestItemId, outcome, getDeliveryContext());
    showToast(outcome === "DELIVERED" ? "Delivery recorded" : "Delivery attempt recorded");
    await loadLocation();
  } catch {
    error.value = "Failed to record delivery attempt.";
    showToast("Failed to record delivery");
  } finally {
    const updated = new Set(submittingItemIds.value);
    updated.delete(requestItemId);
    submittingItemIds.value = updated;
  }
}

function isRequestSubmitting(request: RequestSummary): boolean {
  return request.items.some((item) => submittingItemIds.value.has(item.id));
}

async function submitDeliverAll(request: RequestSummary): Promise<void> {
  if (isRequestSubmitting(request)) {
    return;
  }

  const confirmed = window.confirm("Deliver all items for this request?");
  if (!confirmed) {
    return;
  }

  if (!currentUser.value?.id) {
    error.value = "Unable to identify current user.";
    return;
  }

  const next = new Set(submittingItemIds.value);
  for (const item of request.items) {
    next.add(item.id);
  }
  submittingItemIds.value = next;

  try {
    for (const item of request.items) {
      await createDeliveryAttempt(item.id, "DELIVERED", getDeliveryContext());
    }

    showToast("Delivery recorded");
    await loadLocation();
  } catch {
    error.value = "Failed to record delivery attempt.";
    showToast("Failed to record delivery");
  } finally {
    const updated = new Set(submittingItemIds.value);
    for (const item of request.items) {
      updated.delete(item.id);
    }
    submittingItemIds.value = updated;
  }
}

async function loadLocation(): Promise<void> {
  if (!locationId.value) {
    error.value = "Invalid location id.";
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    location.value = await getLocation(locationId.value);
  } catch {
    error.value = "Failed to load location.";
  } finally {
    loading.value = false;
  }
}

watch(locationId, () => {
  void loadLocation();
}, { immediate: true });

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
  clearDeliveryConfirmationTimeout();
});
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-4 sm:p-6">
    <div class="mb-4 flex items-center gap-4">
      <button
        type="button"
        class="inline-flex min-h-[44px] items-center text-sm font-medium text-sky-700 hover:text-sky-900"
        @click="goBackToRoute"
      >
        Back
      </button>
      <RouterLink
        v-if="activeRoute"
        :to="`/routes/${activeRoute.id}`"
        class="inline-flex min-h-[44px] items-center text-sm font-semibold text-sky-700 hover:text-sky-900"
      >
        Back to Route Stops
      </RouterLink>
    </div>

    <p v-if="loading" class="rounded-xl bg-white p-4 text-slate-600 shadow-sm">Loading location...</p>
    <p v-else-if="error" class="rounded-xl bg-rose-50 p-4 text-rose-700">{{ error }}</p>

    <template v-else-if="location">
      <div class="mb-6 flex items-start justify-between gap-3">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ location.name }}</h1>
        <RouterLink
          :to="{
            path: `/locations/${location.id}/encounter`,
            query: routeIdFromQuery ? { routeId: routeIdFromQuery } : undefined,
          }"
          class="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          New Request
        </RouterLink>
      </div>

      <section class="mb-6">
        <h2 class="mb-3 text-lg font-semibold text-slate-900">People Here</h2>
        <div v-if="people.length" class="space-y-3">
          <article
            v-for="person in people"
            :key="person.id"
            class="min-h-[44px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p class="text-base font-medium text-slate-900">{{ person.displayName ?? "Unknown person" }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ getLastSeenLabel(person) }}</p>
          </article>
        </div>
        <p v-else class="rounded-xl bg-white p-4 text-slate-600 shadow-sm">No people recorded here yet.</p>
      </section>

      <section>
        <h2 class="mb-3 text-xl font-semibold text-slate-900">Needs Delivery</h2>
        <div v-if="needsDeliveryRequestsByPerson.length" class="mb-6 space-y-4">
          <article
            v-for="entry in needsDeliveryRequestsByPerson"
            :key="entry.key"
            class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"
          >
            <h3 class="text-base font-semibold text-slate-900">{{ entry.name }}</h3>
            <ul class="mt-2 space-y-2">
              <li
                v-for="request in entry.requests"
                :key="request.id"
                class="space-y-2 rounded-xl bg-white p-3"
              >
                <div class="mb-2 flex items-center justify-between">
                  <p class="text-xs font-medium text-slate-500">Request</p>
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-flex min-h-[24px] items-center rounded-full px-2 py-1 text-xs font-semibold"
                      :class="getStatusBadgeClass(request.status)"
                    >
                      [ {{ request.status }} ]
                    </span>
                    <button
                      v-if="request.status === 'READY'"
                      type="button"
                      class="min-h-[44px] rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="isRequestSubmitting(request) || !currentUser"
                      @click="submitDeliverAll(request)"
                    >
                      Deliver All
                    </button>
                    <button
                      type="button"
                      class="min-h-[44px] rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      @click="onCloseUnable(request.id)"
                    >
                      Can't Find Person
                    </button>
                  </div>
                </div>
                <div
                  v-for="(item, itemIndex) in request.items"
                  :key="`${request.id}-${item.id}-${itemIndex}`"
                  class="rounded-lg border border-slate-200 p-3"
                >
                  <component
                    :is="hasAvailableActions(toSheetItem(item), request.status) ? 'button' : 'div'"
                    v-bind="hasAvailableActions(toSheetItem(item), request.status) ? { type: 'button' } : {}"
                    class="mb-3 flex w-full items-center justify-between gap-2 text-left"
                    :class="hasAvailableActions(toSheetItem(item), request.status) ? 'cursor-pointer' : ''"
                    @click="hasAvailableActions(toSheetItem(item), request.status) ? openSheet(toSheetItem(item), request) : undefined"
                  >
                    <span class="text-base text-slate-800">{{ item.description }} ({{ item.quantityRequested }})</span>
                    <div class="flex shrink-0 items-center gap-2">
                      <span
                        v-if="item.status && item.status !== 'OPEN'"
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
                        v-if="hasAvailableActions(toSheetItem(item), request.status)"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 shrink-0 text-slate-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </component>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-if="request.status === 'READY'"
                      data-delivery-confirm-button="true"
                      type="button"
                      class="min-h-[44px] rounded-lg bg-emerald-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      :disabled="submittingItemIds.has(item.id) || !currentUser"
                      @click="handleDeliveryButtonClick(item.id)"
                    >
                      {{ confirmingDeliveryItemId === item.id ? "Confirm Delivery" : "Deliver" }}
                    </button>
                    <button
                      v-if="request.status === 'READY'"
                      type="button"
                      class="min-h-[44px] rounded-lg bg-amber-500 px-3 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                      :disabled="submittingItemIds.has(item.id) || !currentUser"
                      @click="submitDeliveryAttempt(item.id, 'ATTEMPTED_NOT_FOUND')"
                    >
                      Not Found
                    </button>
                  </div>
                </div>

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

                <div class="rounded-lg border border-slate-200 bg-slate-50">
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
              </li>
            </ul>
          </article>
        </div>
        <p v-else class="mb-6 rounded-xl bg-white p-4 text-slate-600 shadow-sm">
          No requests currently need delivery at this location.
        </p>

        <div class="my-6 border-t border-slate-200"></div>

        <button
          type="button"
          class="mb-3 flex w-full items-center justify-between gap-2 text-left"
          @click="deliveredExpanded = !deliveredExpanded"
        >
          <h2 class="text-xl font-semibold text-slate-900">
            Delivered
            <span v-if="deliveredRequestsByPerson.length" class="ml-1 text-base font-normal text-slate-500">
              ({{ deliveredRequestsByPerson.length }})
            </span>
          </h2>
          <span class="text-slate-400 transition-transform" :class="deliveredExpanded ? 'rotate-180' : ''">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
            </svg>
          </span>
        </button>

        <template v-if="deliveredExpanded">
          <div v-if="deliveredRequestsByPerson.length" class="space-y-4">
            <article
              v-for="entry in deliveredRequestsByPerson"
              :key="entry.key"
              class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h3 class="text-base font-semibold text-slate-900">{{ entry.name }}</h3>
              <p class="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Needs:</p>
              <ul class="mt-2 space-y-2">
                <li
                  v-for="request in entry.requests"
                  :key="request.id"
                  class="space-y-2 rounded-xl bg-slate-50 p-3"
                >
                  <div class="mb-2 flex items-center justify-end">
                    <span
                      class="inline-flex min-h-[24px] items-center rounded-full px-2 py-1 text-xs font-semibold"
                      :class="getStatusBadgeClass(request.status)"
                    >
                      [ {{ request.status }} ]
                    </span>
                  </div>
                  <p
                    v-for="(item, itemIndex) in request.items"
                    :key="`${request.id}-${itemIndex}-${item.description}`"
                    class="text-base text-slate-800"
                  >
                    {{ item.description }} ({{ item.quantityRequested }})
                  </p>

                  <div class="rounded-lg border border-slate-200 bg-white">
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
                </li>
              </ul>
            </article>
          </div>
          <p v-else class="rounded-xl bg-white p-4 text-slate-600 shadow-sm">No delivered requests yet at this location.</p>
        </template>
      </section>
    </template>
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
  </section>
</template>
