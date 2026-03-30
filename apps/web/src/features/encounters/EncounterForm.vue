<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createEncounter } from "../../api/encounters";
import { getLocation } from "../../api/locations";
import { useToast } from "../../composables/useToast";
import { currentUser } from "../../stores/user";

type EncounterItem = {
  description: string;
  quantity: number;
  modifier?: string;
};

const LAST_REQUEST_STORAGE_KEY = "friend-helper:last-request-items";

const QUICK_ITEMS = [
  "Socks",
  "Underwear",
  "Shoes",
  "Blanket",
  "Jacket",
  "Tent",
  "Food",
  "Water",
] as const;

const route = useRoute();
const router = useRouter();

const personName = ref("");
const nameInput = ref<HTMLInputElement | null>(null);
const observationText = ref("");
const items = ref<EncounterItem[]>([]);
const manualItemName = ref("");
const submitting = ref(false);
const error = ref<string | null>(null);
const locationName = ref<string | null>(null);
const locationContextLoading = ref(false);
const recentPeople = ref<string[]>([]);
const hasLastRequest = ref(false);
const { showToast } = useToast();

const locationId = computed(() => {
  const value = route.params.id;
  return typeof value === "string" ? value : value?.[0] ?? "";
});

const routeIdFromQuery = computed(() => {
  const value = route.query.routeId;
  return typeof value === "string" ? value : value?.[0] ?? "";
});

async function loadLocationContext(): Promise<void> {
  if (!locationId.value) {
    locationName.value = null;
    recentPeople.value = [];
    return;
  }

  locationContextLoading.value = true;

  try {
    const location = await getLocation(locationId.value);
    locationName.value = location.name;
    recentPeople.value = Array.from(new Set(
      location.people
        .map((person) => person.displayName?.trim() ?? "")
        .filter((name) => name.length > 0),
    ));
  } catch {
    locationName.value = null;
    recentPeople.value = [];
  } finally {
    locationContextLoading.value = false;
  }
}

function selectRecentPerson(name: string): void {
  personName.value = name;
}

function changeLocation(): void {
  if (routeIdFromQuery.value) {
    void router.push(`/routes/${routeIdFromQuery.value}`);
    return;
  }

  void router.back();
}

const canSubmit = computed(() => {
  return personName.value.trim().length > 0
    && items.value.length > 0
    && !submitting.value
    && Boolean(currentUser.value?.id);
});

function addOrIncrementItem(description: string): void {
  const normalizedDescription = description.trim();
  if (!normalizedDescription) {
    return;
  }

  const existing = items.value.find(
    (item) => item.description.toLowerCase() === normalizedDescription.toLowerCase(),
  );

  if (existing) {
    existing.quantity += 1;
    return;
  }

  items.value.push({
    description: normalizedDescription,
    quantity: 1,
    modifier: "",
  });
}

function updateItemModifier(description: string, value: string): void {
  const item = items.value.find((entry) => entry.description === description);
  if (!item) {
    return;
  }

  item.modifier = value;
}

function addManualItem(): void {
  addOrIncrementItem(manualItemName.value);
  manualItemName.value = "";
}

function decrementItem(description: string): void {
  const item = items.value.find((entry) => entry.description === description);
  if (!item) {
    return;
  }

  if (item.quantity <= 1) {
    items.value = items.value.filter((entry) => entry.description !== description);
    return;
  }

  item.quantity -= 1;
}

function sanitizeItemsForStorage(rawItems: unknown): EncounterItem[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  const sanitized: EncounterItem[] = [];

  for (const rawItem of rawItems) {
    if (typeof rawItem !== "object" || rawItem === null) {
      continue;
    }

    const item = rawItem as { description?: unknown; quantity?: unknown; modifier?: unknown };
    const description = typeof item.description === "string" ? item.description.trim() : "";
    const quantity = typeof item.quantity === "number" ? item.quantity : Number.NaN;
    const modifier = typeof item.modifier === "string" ? item.modifier.trim() : "";

    if (!description || !Number.isInteger(quantity) || quantity <= 0) {
      continue;
    }

    sanitized.push({
      description,
      quantity,
      modifier,
    });
  }

  return sanitized;
}

function getLastRequestItemsFromStorage(): EncounterItem[] {
  try {
    const raw = localStorage.getItem(LAST_REQUEST_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    return sanitizeItemsForStorage(parsed);
  } catch {
    return [];
  }
}

function refreshLastRequestAvailability(): void {
  hasLastRequest.value = getLastRequestItemsFromStorage().length > 0;
}

function repeatLastRequest(): void {
  const lastItems = getLastRequestItemsFromStorage();
  if (!lastItems.length) {
    showToast("No previous request found");
    return;
  }

  items.value = lastItems.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    modifier: item.modifier ?? "",
  }));
  showToast("Loaded last request");
}

function saveLastRequestItemsToStorage(): void {
  const payload = items.value.map((item) => ({
    description: item.description.trim(),
    quantity: item.quantity,
    modifier: item.modifier?.trim() ?? "",
  }));

  localStorage.setItem(LAST_REQUEST_STORAGE_KEY, JSON.stringify(payload));
  hasLastRequest.value = payload.length > 0;
}

refreshLastRequestAvailability();

watch(locationId, () => {
  void loadLocationContext();
}, { immediate: true });

onMounted(() => {
  nameInput.value?.focus();
});

async function onSubmit(): Promise<void> {
  if (!canSubmit.value || !locationId.value || !currentUser.value?.id) {
    if (!currentUser.value?.id) {
      error.value = "Unable to identify current user.";
    }
    return;
  }

  submitting.value = true;
  error.value = null;

  try {
    await createEncounter({
      person: { displayName: personName.value.trim() },
      locationId: locationId.value,
      items: items.value.map((item) => ({
        description: item.modifier?.trim()
          ? `${item.description} (${item.modifier.trim()})`
          : item.description,
        quantity: item.quantity,
      })),
      observation: observationText.value.trim() || undefined,
    });

    saveLastRequestItemsToStorage();

    showToast("Encounter saved");

    await router.push(`/locations/${locationId.value}`);
  } catch {
    error.value = "Failed to save encounter.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-4 sm:p-6">
    <button
      type="button"
      class="mb-4 inline-flex text-sm font-medium text-sky-700 hover:text-sky-900"
      @click="router.back()"
    >
      Back to Location
    </button>

    <h1 class="mb-4 text-2xl font-bold tracking-tight text-slate-900">New Encounter</h1>

    <div class="mb-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
      <div class="flex items-center justify-between gap-3">
        <p class="text-lg font-semibold text-slate-900">
          <span class="mr-1" aria-hidden="true">📍</span>
          {{ locationContextLoading ? "Loading..." : (locationName ?? "Unknown location") }}
        </p>
        <button
          type="button"
          class="inline-flex min-h-[44px] items-center text-sm font-semibold text-sky-700 hover:text-sky-900"
          @click="changeLocation"
        >
          Change
        </button>
      </div>
    </div>

    <form class="space-y-5" @submit.prevent="onSubmit">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="mb-2 text-sm font-semibold text-slate-700">Recently Seen Here</p>
        <div v-if="recentPeople.length" class="flex flex-wrap gap-2">
          <button
            v-for="name in recentPeople"
            :key="name"
            type="button"
            class="min-h-[44px] rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            @click="selectRecentPerson(name)"
          >
            {{ name }}
          </button>
        </div>
        <p v-else class="text-sm text-slate-500">No recently seen people at this location yet.</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label class="mb-2 block text-sm font-semibold text-slate-700" for="person-name">Person Name</label>
        <input
          id="person-name"
          ref="nameInput"
          v-model="personName"
          type="text"
          placeholder="Enter person name"
          class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500"
        />
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between gap-3">
          <p class="text-sm font-semibold text-slate-700">Requested Items</p>
          <button
            type="button"
            class="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            :disabled="!hasLastRequest"
            @click="repeatLastRequest"
          >
            Repeat Last Request
          </button>
        </div>
        <div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            v-for="item in QUICK_ITEMS"
            :key="item"
            type="button"
            class="min-h-[44px] rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            @click="addOrIncrementItem(item)"
          >
            {{ item }}
          </button>
        </div>

        <div class="mb-4 flex gap-2">
          <input
            v-model="manualItemName"
            type="text"
            placeholder="Add custom item"
            class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500"
          />
          <button
            type="button"
            class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            @click="addManualItem"
          >
            Add
          </button>
        </div>

        <div class="rounded-xl bg-slate-50 p-3">
          <p class="mb-2 text-sm font-semibold text-slate-700">Selected Items</p>
          <ul v-if="items.length" class="space-y-2">
            <li
              v-for="item in items"
              :key="item.description"
              class="space-y-3 rounded-lg bg-white px-3 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <span class="text-base text-slate-900">{{ item.description }} ({{ item.quantity }})</span>
                <button
                  type="button"
                  class="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  @click="decrementItem(item.description)"
                >
                  -1
                </button>
              </div>

              <div>
                <label :for="`modifier-${item.description}`" class="mb-1 block text-sm font-medium text-slate-700">
                  Modifier
                </label>
                <input
                  :id="`modifier-${item.description}`"
                  :value="item.modifier ?? ''"
                  type="text"
                  placeholder="e.g. size 11, men's, large"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500"
                  @input="updateItemModifier(item.description, ($event.target as HTMLInputElement).value)"
                />
              </div>
            </li>
          </ul>
          <p v-else class="text-sm text-slate-600">Tap quick item buttons to add requests.</p>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label class="mb-2 block text-sm font-semibold text-slate-700" for="observation">Observation (optional)</label>
        <textarea
          id="observation"
          v-model="observationText"
          rows="4"
          placeholder="Add notes about the encounter"
          class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500"
        />
      </div>

      <p v-if="error" class="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{{ error }}</p>

      <button
        type="submit"
        :disabled="!canSubmit"
        class="w-full rounded-xl bg-emerald-600 px-4 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {{ submitting ? "Saving..." : "Save" }}
      </button>
    </form>
  </section>
</template>
