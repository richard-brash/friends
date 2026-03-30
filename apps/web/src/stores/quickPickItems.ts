import { ref, watch } from "vue";

export type QuickPickItem = {
  id: string;
  label: string;
};

const STORAGE_KEY = "quick_pick_items";

const DEFAULT_ITEMS: QuickPickItem[] = [
  { id: "default-shirt", label: "shirt" },
  { id: "default-pants", label: "pants" },
  { id: "default-socks", label: "socks" },
  { id: "default-underwear", label: "underwear" },
];

function loadFromStorage(): QuickPickItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [...DEFAULT_ITEMS];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (
      Array.isArray(parsed)
      && parsed.every(
        (item): item is QuickPickItem =>
          typeof item === "object"
          && item !== null
          && typeof (item as QuickPickItem).id === "string"
          && typeof (item as QuickPickItem).label === "string",
      )
    ) {
      return parsed;
    }

    return [...DEFAULT_ITEMS];
  } catch {
    return [...DEFAULT_ITEMS];
  }
}

function saveToStorage(items: QuickPickItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

export const quickPickItems = ref<QuickPickItem[]>(loadFromStorage());

watch(quickPickItems, (items) => {
  saveToStorage(items);
}, { deep: true });

function generateId(): string {
  return `qp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function addQuickPickItem(label: string): void {
  const normalized = label.trim().toLowerCase();
  if (!normalized) {
    return;
  }

  const exists = quickPickItems.value.some(
    (item) => item.label.toLowerCase() === normalized,
  );
  if (exists) {
    return;
  }

  quickPickItems.value = [...quickPickItems.value, { id: generateId(), label: normalized }];
}

export function updateQuickPickItem(id: string, label: string): void {
  const normalized = label.trim().toLowerCase();
  if (!normalized) {
    return;
  }

  quickPickItems.value = quickPickItems.value.map((item) =>
    item.id === id ? { ...item, label: normalized } : item,
  );
}

export function removeQuickPickItem(id: string): void {
  quickPickItems.value = quickPickItems.value.filter((item) => item.id !== id);
}

export function resetQuickPickItems(): void {
  quickPickItems.value = [...DEFAULT_ITEMS];
}
