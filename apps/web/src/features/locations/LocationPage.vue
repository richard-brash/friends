<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { getLocation } from "../../api/locations";
import type { LocationDetail, RequestSummary } from "../../types/api";

type PersonWithRequests = {
  id: string;
  displayName: string | null;
  lastSeenAt?: string | null;
  requests: RequestSummary[];
};

const route = useRoute();
const location = ref<LocationDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const locationId = computed(() => {
  const value = route.params.id;
  return typeof value === "string" ? value : value?.[0] ?? "";
});

function formatLastSeen(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    "day",
  );
}

const peopleWithRequests = computed<PersonWithRequests[]>(() => {
  if (!location.value) {
    return [];
  }

  const byPersonKey = new Map<string, PersonWithRequests>();

  for (const person of location.value.people) {
    const key = person.id;
    byPersonKey.set(key, {
      id: person.id,
      displayName: person.displayName,
      lastSeenAt: person.lastSeenAt,
      requests: [],
    });
  }

  for (const request of location.value.requests) {
    const personName = request.person?.displayName ?? null;
    const existingByName = Array.from(byPersonKey.values()).find(
      (entry) => entry.displayName === personName,
    );

    if (existingByName) {
      existingByName.requests.push(request);
      continue;
    }

    const fallbackKey = `unknown-${request.id}`;
    byPersonKey.set(fallbackKey, {
      id: fallbackKey,
      displayName: personName,
      requests: [request],
    });
  }

  return Array.from(byPersonKey.values()).filter(
    (person) => person.requests.length > 0 || person.displayName !== null,
  );
});

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
  } catch (err) {
    console.error(err);
    error.value = "Failed to load location.";
  } finally {
    loading.value = false;
  }
}

watch(locationId, () => {
  void loadLocation();
}, { immediate: true });
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-4 sm:p-6">
    <RouterLink to="/" class="mb-4 inline-flex text-sm font-medium text-sky-700 hover:text-sky-900">
      Back to routes
    </RouterLink>

    <p v-if="loading" class="rounded-xl bg-white p-4 text-slate-600 shadow-sm">Loading location...</p>
    <p v-else-if="error" class="rounded-xl bg-rose-50 p-4 text-rose-700">{{ error }}</p>

    <template v-else-if="location">
      <h1 class="mb-5 text-2xl font-bold tracking-tight text-slate-900">{{ location.name }}</h1>

      <div class="space-y-4">
        <article
          v-for="person in peopleWithRequests"
          :key="person.id"
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 class="text-lg font-semibold text-slate-900">{{ person.displayName ?? "Unknown person" }}</h2>
          <p v-if="formatLastSeen(person.lastSeenAt)" class="mt-1 text-sm text-slate-600">
            Last seen: {{ formatLastSeen(person.lastSeenAt) }}
          </p>

          <div class="mt-4">
            <p class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Needs</p>

            <div v-for="request in person.requests" :key="request.id" class="space-y-2">
              <label
                v-for="(item, itemIndex) in request.items"
                :key="`${request.id}-${itemIndex}-${item.description}`"
                class="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <input type="checkbox" class="h-5 w-5 rounded border-slate-300 text-emerald-600" />
                <span class="text-base text-slate-800">{{ item.description }} ({{ item.quantityRequested }})</span>
              </label>
            </div>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>
