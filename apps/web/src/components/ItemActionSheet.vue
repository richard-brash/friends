<script setup lang="ts">
import { ref, computed } from "vue";
import type { NeedStatus, WarehouseRequestItem } from "../api/requests";

type UserRole = "admin" | "manager" | "volunteer";
type SheetMode = "actions" | "edit" | "confirm";
type ActionType = "mark-unavailable" | "mark-available" | "mark-picked";

const props = defineProps<{
  item: WarehouseRequestItem;
  requestStatus: "REQUESTED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED" | "CLOSED_UNABLE";
  userRole: UserRole;
  isNew?: boolean;
}>();

const emit = defineEmits<{
  save: [{ description: string; quantity: number }];
  action: [{ type: ActionType; notes: string }];
  close: [];
}>();

const mode = ref<SheetMode>(props.isNew ? "edit" : "actions");
const pendingAction = ref<ActionType | null>(null);

const editDescription = ref(props.item.description);
const editQuantity = ref(props.item.quantityRequested);
const confirmNotes = ref("");

const isEditable = computed(() =>
  props.requestStatus === "REQUESTED" || props.requestStatus === "PREPARING",
);

const canEdit = computed(() => isEditable.value);
const canMarkUnavailable = computed(
  () =>
    (props.userRole === "manager" || props.userRole === "admin") &&
    (props.item.status === "OPEN" || props.item.status === "READY") &&
    isEditable.value,
);
const canMarkAvailable = computed(
  () =>
    (props.userRole === "manager" || props.userRole === "admin") &&
    props.item.status === "UNAVAILABLE",
);
const canMarkPicked = computed(
  () =>
    (props.userRole === "manager" || props.userRole === "admin") &&
    props.item.status === "OPEN",
);

const NEED_STATUS_LABELS: Record<NeedStatus, string> = {
  OPEN: "Open",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CLOSED_UNABLE: "Closed",
  UNAVAILABLE: "Unavailable",
};

const NEED_STATUS_BADGE: Record<NeedStatus, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  READY: "bg-emerald-100 text-emerald-800",
  OUT_FOR_DELIVERY: "bg-sky-100 text-sky-800",
  DELIVERED: "bg-slate-100 text-slate-700",
  CLOSED_UNABLE: "bg-rose-100 text-rose-700",
  UNAVAILABLE: "bg-orange-100 text-orange-800",
};

const CONFIRM_LABELS: Record<ActionType, { title: string; button: string; buttonClass: string }> = {
  "mark-unavailable": {
    title: "Mark as unavailable?",
    button: "Mark Unavailable",
    buttonClass: "bg-orange-600 hover:bg-orange-700",
  },
  "mark-available": {
    title: "Mark as available again?",
    button: "Mark Available",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700",
  },
  "mark-picked": {
    title: "Mark as picked?",
    button: "Mark Picked",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700",
  },
};

function decrementQuantity() {
  if (editQuantity.value > 1) editQuantity.value--;
}

function incrementQuantity() {
  editQuantity.value++;
}

function onSave() {
  if (!editDescription.value.trim()) return;
  emit("save", {
    description: editDescription.value.trim(),
    quantity: editQuantity.value,
  });
}

function onSelectAction(type: ActionType) {
  pendingAction.value = type;
  confirmNotes.value = "";
  mode.value = "confirm";
}

function onConfirmAction() {
  if (!pendingAction.value) return;
  emit("action", { type: pendingAction.value, notes: confirmNotes.value.trim() });
}

function onBackToActions() {
  mode.value = "actions";
  pendingAction.value = null;
}
</script>

<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-40 bg-black/40"
    aria-hidden="true"
    @click="emit('close')"
  />

  <!-- Sheet -->
  <div
    role="dialog"
    aria-modal="true"
    class="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white shadow-xl sm:inset-x-auto sm:left-1/2 sm:bottom-auto sm:top-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
    @keydown.esc="emit('close')"
  >
    <!-- Action list mode -->
    <div v-if="mode === 'actions'" class="p-5">
      <!-- Item header -->
      <div class="mb-4 flex items-start justify-between gap-3">
        <div>
          <p class="text-base font-semibold text-slate-900">
            {{ item.description }} <span class="font-normal text-slate-500">({{ item.quantityRequested }})</span>
          </p>
          <span
            class="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
            :class="NEED_STATUS_BADGE[item.status]"
          >
            {{ NEED_STATUS_LABELS[item.status] }}
          </span>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-full p-1 text-slate-400 hover:text-slate-600"
          aria-label="Close"
          @click="emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <div class="divide-y divide-slate-100 rounded-xl border border-slate-200">
        <button
          v-if="canEdit"
          type="button"
          class="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
          @click="mode = 'edit'"
        >
          Edit
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          v-if="canMarkPicked"
          type="button"
          class="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          @click="onSelectAction('mark-picked')"
        >
          Mark Picked
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          v-if="canMarkAvailable"
          type="button"
          class="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          @click="onSelectAction('mark-available')"
        >
          Mark Available Again
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          v-if="canMarkUnavailable"
          type="button"
          class="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-orange-700 hover:bg-orange-50"
          @click="onSelectAction('mark-unavailable')"
        >
          Mark Unavailable
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Edit mode -->
    <div v-else-if="mode === 'edit'" class="p-5">
      <div class="mb-5 flex items-center gap-2">
        <button
          v-if="!isNew"
          type="button"
          class="shrink-0 rounded-full p-1 text-slate-400 hover:text-slate-600"
          aria-label="Back"
          @click="onBackToActions"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <h2 class="text-base font-semibold text-slate-900">{{ isNew ? "Add item" : "Edit item" }}</h2>
        <button
          v-if="isNew"
          type="button"
          class="ml-auto shrink-0 rounded-full p-1 text-slate-400 hover:text-slate-600"
          aria-label="Close"
          @click="emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label for="item-description" class="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <input
            id="item-description"
            v-model="editDescription"
            type="text"
            class="min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            placeholder="e.g. Socks"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 text-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              :disabled="editQuantity <= 1"
              @click="decrementQuantity"
            >
              −
            </button>
            <span class="w-8 text-center text-lg font-semibold text-slate-900">{{ editQuantity }}</span>
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 text-lg font-semibold text-slate-700 hover:bg-slate-50"
              @click="incrementQuantity"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div class="mt-6 flex gap-3">
        <button
          type="button"
          class="min-h-[44px] flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="isNew ? emit('close') : onBackToActions()"
        >
          Cancel
        </button>
        <button
          type="button"
          class="min-h-[44px] flex-1 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-slate-300"
          :disabled="!editDescription.trim()"
          @click="onSave"
        >
          Save
        </button>
      </div>
    </div>

    <!-- Confirm mode -->
    <div v-else-if="mode === 'confirm' && pendingAction" class="p-5">
      <div class="mb-5 flex items-center gap-2">
        <button
          type="button"
          class="shrink-0 rounded-full p-1 text-slate-400 hover:text-slate-600"
          aria-label="Back"
          @click="onBackToActions"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <h2 class="text-base font-semibold text-slate-900">{{ CONFIRM_LABELS[pendingAction].title }}</h2>
      </div>

      <p class="mb-4 text-sm text-slate-600">
        <span class="font-medium text-slate-800">{{ item.description }}</span> ({{ item.quantityRequested }})
      </p>

      <div>
        <label for="confirm-notes" class="mb-1 block text-sm font-medium text-slate-700">
          Notes <span class="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          id="confirm-notes"
          v-model="confirmNotes"
          rows="2"
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          placeholder="Reason..."
        />
      </div>

      <div class="mt-5 flex gap-3">
        <button
          type="button"
          class="min-h-[44px] flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="onBackToActions"
        >
          Cancel
        </button>
        <button
          type="button"
          class="min-h-[44px] flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          :class="CONFIRM_LABELS[pendingAction].buttonClass"
          @click="onConfirmAction"
        >
          {{ CONFIRM_LABELS[pendingAction].button }}
        </button>
      </div>
    </div>
  </div>
</template>
