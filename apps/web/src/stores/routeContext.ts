import { ref } from "vue";

export type ActiveRoute = {
  id: string;
  name: string;
};

const STORAGE_KEY = "friend-helper:active-route";

function readStoredActiveRoute(): ActiveRoute | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const candidate = parsed as { id?: unknown; name?: unknown };
    const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";

    if (!id || !name) {
      return null;
    }

    return { id, name };
  } catch {
    return null;
  }
}

export const activeRoute = ref<ActiveRoute | null>(readStoredActiveRoute());

export function setActiveRoute(route: ActiveRoute): void {
  const normalizedRoute: ActiveRoute = {
    id: route.id.trim(),
    name: route.name.trim(),
  };

  activeRoute.value = normalizedRoute;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedRoute));
}

export function getActiveRoute(): ActiveRoute | null {
  return activeRoute.value;
}
