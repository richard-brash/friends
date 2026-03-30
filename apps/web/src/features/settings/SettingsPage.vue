<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  createQuickPickItem,
  deleteQuickPickItem,
  getQuickPickItems,
  seedDefaultQuickPickItems,
  updateQuickPickItem,
  type QuickPickItem,
} from "../../api/quickPickItems";
import { useToast } from "../../composables/useToast";
import { currentUser } from "../../stores/user";

const { showToast } = useToast();

const items = ref<QuickPickItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const newLabel = ref("");
const addingItem = ref(false);

const editingId = ref<string | null>(null);
const editingLabel = ref("");
const savingEditId = ref<string | null>(null);
const deletingId = ref<string | null>(null);

function orgId(): string {
  return currentUser.value?.organization_id ?? "";
}

async function loadItems(): Promise<void> {
  const org = orgId();
  if (!org) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    items.value = await getQuickPickItems(org);
  } catch {
    error.value = "Failed to load quick pick items.";
  } finally {
    loading.value = false;
  }
}

async function addItem(): Promise<void> {
  const label = newLabel.value.trim();
  if (!label || !orgId()) {
    return;
  }

  addingItem.value = true;
  error.value = null;

  try {
    const created = await createQuickPickItem(orgId(), label);
    items.value = [...items.value, created];
    newLabel.value = "";
    showToast(`Added "${created.label}"`);
  } catch {
    error.value = "Failed to add item. It may already exist.";
  } finally {
    addingItem.value = false;
  }
}

function startEdit(item: QuickPickItem): void {
  editingId.value = item.id;
  editingLabel.value = item.label;
}

function cancelEdit(): void {
  editingId.value = null;
  editingLabel.value = "";
}

async function saveEdit(item: QuickPickItem): Promise<void> {
  const label = editingLabel.value.trim();
  if (!label || !orgId()) {
    return;
  }

  savingEditId.value = item.id;
  error.value = null;

  try {
    const updated = await updateQuickPickItem(item.id, orgId(), { label });
    items.value = items.value.map((i) => (i.id === item.id ? updated : i));
    editingId.value = null;
    showToast("Item updated");
  } catch {
    error.value = "Failed to update item.";
  } finally {
    savingEditId.value = null;
  }
}

async function removeItem(item: QuickPickItem): Promise<void> {
  if (!orgId()) {
    return;
  }

  deletingId.value = item.id;
  error.value = null;

  try {
    await deleteQuickPickItem(item.id, orgId());
    items.value = items.value.filter((i) => i.id !== item.id);
    showToast(`Removed "${item.label}"`);
  } catch {
    error.value = "Failed to remove item.";
  } finally {
    deletingId.value = null;
  }
}

async function seedDefaults(): Promise<void> {
  if (!orgId()) {
    return;
  }

  try {
    await seedDefaultQuickPickItems(orgId());
    await loadItems();
    showToast("Default items added");
  } catch {
    error.value = "Failed to seed defaults.";
  }
}

onMounted(() => {
  void loadItems();
});
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-4 sm:p-6">
    <h1 class="mb-6 text-2xl font-bold tracking-tight text-slate-900">Settings</h1>

    <!-- Quick Pick Items -->
    <div class="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Quick Pick Items</h2>
          <p class="mt-1 text-sm text-slate-500">
            These buttons appear in the New Request form for fast need entry.
          </p>
        </div>
        <button
          v-if="!loading && items.length === 0"
          type="button"
          class="shrink-0 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          @click="seedDefaults"
        >
          Add defaults
        </button>
      </div>

      <p v-if="error" class="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ error }}</p>
      <p v-if="loading" class="text-sm text-slate-500">Loading...</p>

      <ul v-else class="mb-4 space-y-2">
        <li
          v-for="item in items"
          :key="item.id"
          class="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
        >
          <!-- Edit mode -->
          <template v-if="editingId === item.id">
            <input
              v-model="editingLabel"
              type="text"
              class="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              @keydown.enter="saveEdit(item)"
              @keydown.escape="cancelEdit"
            />
            <button
              type="button"
              class="min-h-[36px] rounded-lg bg-sky-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
              :disabled="savingEditId === item.id"
              @click="saveEdit(item)"
            >
              Save
            </button>
            <button
              type="button"
              class="min-h-[36px] rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
              @click="cancelEdit"
            >
              Cancel
            </button>
          </template>

          <!-- View mode -->
          <template v-else>
            <span class="flex-1 text-sm font-medium text-slate-800">{{ item.label }}</span>
            <button
              type="button"
              class="min-h-[36px] rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
              @click="startEdit(item)"
            >
              Edit
            </button>
            <button
              type="button"
              class="min-h-[36px] rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
              :disabled="deletingId === item.id"
              @click="removeItem(item)"
            >
              {{ deletingId === item.id ? "Removing…" : "Remove" }}
            </button>
          </template>
        </li>

        <li v-if="!loading && items.length === 0" class="text-sm text-slate-500">
          No quick pick items yet.
        </li>
      </ul>

      <!-- Add new item row -->
      <div class="flex gap-2">
        <input
          v-model="newLabel"
          type="text"
          placeholder="e.g. jacket"
          class="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          @keydown.enter="addItem"
        />
        <button
          type="button"
          class="min-h-[44px] rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!newLabel.trim() || addingItem"
          @click="addItem"
        >
          Add
        </button>
      </div>
    </div>

    <!-- Placeholder for future sections -->
    <p class="text-sm text-slate-400">More settings coming soon.</p>
  </section>
</template>
