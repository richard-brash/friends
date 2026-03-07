<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { createDeliveryAttempt } from "../../api/deliveryAttempts";
import { useToast } from "../../composables/useToast";
import { getLocation } from "../../api/locations";
import { currentUser } from "../../stores/user";
import { activeRoute } from "../../stores/routeContext";
import type { LocationDetail, PersonSummary, RequestSummary } from "../../types/api";

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
let confirmDeliveryTimeout: ReturnType<typeof setTimeout> | null = null;
const { showToast } = useToast();

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

async function submitDeliveryAttempt(requestItemId: string, outcome: "DELIVERED" | "PERSON_NOT_FOUND") {
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
    await createDeliveryAttempt(requestItemId, outcome, currentUser.value.id, getDeliveryContext());
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
      await createDeliveryAttempt(item.id, "DELIVERED", currentUser.value.id, getDeliveryContext());
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
          New Encounter
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
                  </div>
                </div>
                <div
                  v-for="(item, itemIndex) in request.items"
                  :key="`${request.id}-${item.id}-${itemIndex}`"
                  class="rounded-lg border border-slate-200 p-3"
                >
                  <p class="mb-3 text-base text-slate-800">
                    {{ item.description }} ({{ item.quantityRequested }})
                  </p>
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
                      @click="submitDeliveryAttempt(item.id, 'PERSON_NOT_FOUND')"
                    >
                      Not Found
                    </button>
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

        <h2 class="mb-3 text-xl font-semibold text-slate-900">Delivered</h2>
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
                class="rounded-xl bg-slate-50 p-3"
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
              </li>
            </ul>
          </article>
        </div>
        <p v-else class="rounded-xl bg-white p-4 text-slate-600 shadow-sm">No delivered requests yet at this location.</p>
      </section>
    </template>
  </section>
</template>
