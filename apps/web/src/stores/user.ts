import { ref } from "vue";
import { getCurrentUser, type CurrentUser } from "../api/me";

export const currentUser = ref<CurrentUser | null>(null);

export function setCurrentUser(user: CurrentUser | null): void {
  currentUser.value = user;
}

export async function loadCurrentUser(): Promise<void> {
  const user = await getCurrentUser();
  setCurrentUser(user);
}
