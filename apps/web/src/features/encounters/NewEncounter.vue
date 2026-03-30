<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createEncounter } from "../../api/encounters";
import { createFriend, searchFriends, type FriendSummary } from "../../api/friends";
import { getLocations } from "../../api/locations";
import { getQuickPickItems, type QuickPickItem } from "../../api/quickPickItems";
import { useToast } from "../../composables/useToast";
import { currentUser } from "../../stores/user";
import type { LocationOption } from "../../types/api";

const props = defineProps<{
  prefilledLocationId?: string;
}>();

const FIT_OPTIONS = ["unisex", "men", "women", "kids"] as const;
const quickNeeds = ref<QuickPickItem[]>([]);

type NeedCartItem = {
  label: string;
  quantity: number;
  size?: string;
  fit?: string;
  detailNotes?: string;
};

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();

const locationOptions = ref<LocationOption[]>([]);
const selectedLocationId = ref("");
const loadingLocations = ref(false);

const friendSearch = ref("");
const searchingFriends = ref(false);
const friendResults = ref<FriendSummary[]>([]);
const selectedFriend = ref<FriendSummary | null>(null);
const showFriendMenu = ref(false);

const needInput = ref("");
const needs = ref<NeedCartItem[]>([]);
const notes = ref("");
const isModifierSheetOpen = ref(false);
const editingNeedLabel = ref<string | null>(null);
const modifierSize = ref("");
const modifierFit = ref("");
const modifierNotes = ref("");

const submitting = ref(false);
const error = ref<string | null>(null);

const routeLocationId = computed(() => {
  const value = route.params.id;
  return typeof value === "string" ? value : value?.[0] ?? "";
});

const canCreateFriendInline = computed(() => {
  const value = friendSearch.value.trim();
  if (!value) {
    return false;
  }

  return !friendResults.value.some((item) => item.preferred_name?.toLowerCase() === value.toLowerCase());
});

const canSubmit = computed(() => {
  return Boolean(selectedLocationId.value)
    && Boolean(selectedFriend.value?.id)
    && needs.value.length > 0
    && Boolean(currentUser.value?.id)
    && !submitting.value;
});

function addNeed(label: string): void {
  const normalized = label.trim().toLowerCase();
  if (!normalized) {
    return;
  }

  const existing = needs.value.find((item) => item.label === normalized);
  if (existing) {
    existing.quantity += 1;
    return;
  }

  needs.value.push({
    label: normalized,
    quantity: 1,
  });
}

const editingNeed = computed(() => {
  if (!editingNeedLabel.value) {
    return null;
  }

  return needs.value.find((item) => item.label === editingNeedLabel.value) ?? null;
});

function getNeedModifierSummary(item: NeedCartItem): string {
  const parts = [item.size?.trim(), item.fit?.trim(), item.detailNotes?.trim()].filter(
    (value): value is string => Boolean(value),
  );

  return parts.join(" - ");
}

function getNeedPayloadLabel(item: NeedCartItem): string {
  const modifiers = [item.size?.trim(), item.fit?.trim(), item.detailNotes?.trim()].filter(
    (value): value is string => Boolean(value),
  );

  if (!modifiers.length) {
    return item.label;
  }

  return `${item.label} (${modifiers.join(", ")})`;
}

function openModifierSheet(label: string): void {
  const item = needs.value.find((entry) => entry.label === label);
  if (!item) {
    return;
  }

  editingNeedLabel.value = label;
  modifierSize.value = item.size ?? "";
  modifierFit.value = item.fit ?? "";
  modifierNotes.value = item.detailNotes ?? "";
  isModifierSheetOpen.value = true;
}

function closeModifierSheet(): void {
  isModifierSheetOpen.value = false;
  editingNeedLabel.value = null;
  modifierSize.value = "";
  modifierFit.value = "";
  modifierNotes.value = "";
}

function saveModifiers(): void {
  if (!editingNeed.value) {
    closeModifierSheet();
    return;
  }

  editingNeed.value.size = modifierSize.value.trim() || undefined;
  editingNeed.value.fit = modifierFit.value.trim() || undefined;
  editingNeed.value.detailNotes = modifierNotes.value.trim() || undefined;
  closeModifierSheet();
}

function clearModifiers(): void {
  modifierSize.value = "";
  modifierFit.value = "";
  modifierNotes.value = "";
}

function decrementNeed(label: string): void {
  const existing = needs.value.find((item) => item.label === label);
  if (!existing) {
    return;
  }

  if (existing.quantity <= 1) {
    needs.value = needs.value.filter((item) => item.label !== label);
    return;
  }

  existing.quantity -= 1;
}

function chooseFriend(friend: FriendSummary): void {
  selectedFriend.value = friend;
  friendSearch.value = friend.preferred_name ?? "";
  showFriendMenu.value = false;
}

function clearFriendSelection(): void {
  selectedFriend.value = null;
  friendSearch.value = "";
  friendResults.value = [];
  showFriendMenu.value = false;
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;

async function runFriendSearch(query: string): Promise<void> {
  const orgId = currentUser.value?.organization_id;
  if (!orgId || query.trim().length < 2) {
    friendResults.value = [];
    searchingFriends.value = false;
    return;
  }

  searchingFriends.value = true;

  try {
    friendResults.value = await searchFriends(query.trim(), orgId);
  } catch {
    friendResults.value = [];
  } finally {
    searchingFriends.value = false;
  }
}

watch(friendSearch, (value) => {
  if (selectedFriend.value && selectedFriend.value.preferred_name === value) {
    return;
  }

  selectedFriend.value = null;
  showFriendMenu.value = true;

  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(() => {
    void runFriendSearch(value);
  }, 200);
});

async function createFriendFromSearch(): Promise<void> {
  const preferredName = friendSearch.value.trim();
  const orgId = currentUser.value?.organization_id;

  if (!preferredName || !orgId) {
    return;
  }

  try {
    const created = await createFriend({
      preferred_name: preferredName,
      org_id: orgId,
    });

    chooseFriend(created);
    showToast(`Created ${preferredName}`);
  } catch {
    error.value = "Could not create friend.";
  }
}

async function loadLocations(): Promise<void> {
  loadingLocations.value = true;

  try {
    const orgId = currentUser.value?.organization_id;
    locationOptions.value = await getLocations(orgId);

    if (!selectedLocationId.value && locationOptions.value.length) {
      const firstLocation = locationOptions.value[0];
      if (firstLocation) {
        selectedLocationId.value = firstLocation.id;
      }
    }
  } catch {
    error.value = "Could not load locations.";
  } finally {
    loadingLocations.value = false;
  }
}

onMounted(() => {
  selectedLocationId.value = props.prefilledLocationId ?? routeLocationId.value;
  void loadLocations();
  const orgId = currentUser.value?.organization_id;
  if (orgId) {
    void getQuickPickItems(orgId).then((items) => {
      quickNeeds.value = items;
    });
  }
});

async function submit(): Promise<void> {
  if (!canSubmit.value || !currentUser.value?.id || !selectedFriend.value?.id) {
    error.value = "Location and friend are required.";
    return;
  }

  submitting.value = true;
  error.value = null;

  try {
    await createEncounter({
      friendId: selectedFriend.value.id,
      locationId: selectedLocationId.value,
      needs: needs.value.map((item) => ({
        label: getNeedPayloadLabel(item),
        quantity: item.quantity,
      })),
      notes: notes.value.trim() || undefined,
    });

    showToast("Request saved");
    await router.push(`/locations/${selectedLocationId.value}`);
  } catch {
    error.value = "Failed to save encounter.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-4 sm:p-6">
    <h1 class="mb-4 text-2xl font-bold tracking-tight text-slate-900">New Request</h1>

    <form class="space-y-5" @submit.prevent="submit">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label class="mb-2 block text-sm font-semibold text-slate-700" for="location-select">Location</label>
        <select
          id="location-select"
          v-model="selectedLocationId"
          class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500"
          :disabled="loadingLocations"
        >
          <option value="" disabled>Select a location</option>
          <option v-for="location in locationOptions" :key="location.id" :value="location.id">
            {{ location.name }}
          </option>
        </select>
      </div>

      <div class="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label class="mb-2 block text-sm font-semibold text-slate-700" for="friend-search">Friend</label>
        <div class="flex gap-2">
          <input
            id="friend-search"
            v-model="friendSearch"
            type="text"
            placeholder="Search friend"
            class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500"
            @focus="showFriendMenu = true"
          />
          <button
            v-if="selectedFriend"
            type="button"
            class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            @click="clearFriendSelection"
          >
            Clear
          </button>
        </div>

        <p v-if="selectedFriend" class="mt-2 text-sm text-emerald-700">
          Selected: {{ selectedFriend.preferred_name ?? "Unnamed" }}
        </p>

        <div
          v-if="showFriendMenu && friendSearch.trim().length >= 2"
          class="absolute left-4 right-4 z-10 mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          <p v-if="searchingFriends" class="px-2 py-2 text-sm text-slate-500">Searching...</p>

          <button
            v-for="friend in friendResults"
            :key="friend.id"
            type="button"
            class="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
            @click="chooseFriend(friend)"
          >
            <span class="font-medium">{{ friend.preferred_name ?? "Unnamed" }}</span>
            <span v-if="friend.aliases.length" class="ml-2 text-slate-500">({{ friend.aliases.join(", ") }})</span>
          </button>

          <button
            v-if="canCreateFriendInline"
            type="button"
            class="mt-1 block w-full rounded-lg bg-emerald-50 px-3 py-2 text-left text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
            @click="createFriendFromSearch"
          >
            Create new: {{ friendSearch.trim() }}
          </button>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="mb-3 text-sm font-semibold text-slate-700">Needs</p>

        <div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            v-for="item in quickNeeds"
            :key="item.id"
            type="button"
            class="min-h-[44px] rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            @click="addNeed(item.label)"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="mb-4 flex gap-2">
          <input
            v-model="needInput"
            type="text"
            placeholder="Add custom need"
            class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500"
          />
          <button
            type="button"
            class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            @click="addNeed(needInput); needInput = ''"
          >
            Add
          </button>
        </div>

        <ul v-if="needs.length" class="space-y-2">
          <li
            v-for="item in needs"
            :key="item.label"
            class="rounded-lg border border-slate-200 px-3 py-2"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-slate-900">{{ item.label }} ({{ item.quantity }})</span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  @click="openModifierSheet(item.label)"
                >
                  Details
                </button>
                <button
                  type="button"
                  class="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  @click="decrementNeed(item.label)"
                >
                  -1
                </button>
              </div>
            </div>
            <p v-if="getNeedModifierSummary(item)" class="mt-2 text-sm text-slate-600">
              {{ getNeedModifierSummary(item) }}
            </p>
          </li>
        </ul>

        <p v-else class="text-sm text-slate-600">Add at least one need.</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label class="mb-2 block text-sm font-semibold text-slate-700" for="encounter-notes">Notes (optional)</label>
        <textarea
          id="encounter-notes"
          v-model="notes"
          rows="3"
          class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500"
          placeholder="Add context for this encounter"
        />
      </div>

      <p v-if="error" class="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{{ error }}</p>

      <button
        type="submit"
        :disabled="!canSubmit"
        class="w-full rounded-xl bg-emerald-600 px-4 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {{ submitting ? "Saving..." : "Save Request" }}
      </button>
    </form>

    <div
      v-if="isModifierSheetOpen"
      class="fixed inset-0 z-40 bg-slate-900/30"
      @click.self="closeModifierSheet"
    >
      <div class="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 shadow-2xl">
        <div class="mx-auto w-full max-w-3xl">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-slate-900">
              Edit Details: {{ editingNeed?.label ?? "Need" }}
            </h2>
            <button
              type="button"
              class="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              @click="closeModifierSheet"
            >
              Close
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="modifier-size">Size</label>
              <input
                id="modifier-size"
                v-model="modifierSize"
                type="text"
                placeholder="e.g. M, 32x30, size 11"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="modifier-fit">Fit/Gender</label>
              <select
                id="modifier-fit"
                v-model="modifierFit"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500"
              >
                <option value="">Not specified</option>
                <option v-for="fit in FIT_OPTIONS" :key="fit" :value="fit">{{ fit }}</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="modifier-notes">Extra Details</label>
              <input
                id="modifier-notes"
                v-model="modifierNotes"
                type="text"
                placeholder="e.g. thermal, black, crew cut"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              @click="clearModifiers"
            >
              Clear
            </button>
            <button
              type="button"
              class="min-h-[44px] rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              @click="saveModifiers"
            >
              Save Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
