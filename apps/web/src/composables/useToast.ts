import { ref } from "vue";

const toastMessage = ref("");
const isToastVisible = ref(false);
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

export function useToast() {
  function showToast(message: string, durationMs = 2200): void {
    toastMessage.value = message;
    isToastVisible.value = true;

    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }

    hideTimeout = setTimeout(() => {
      isToastVisible.value = false;
    }, durationMs);
  }

  return {
    toastMessage,
    isToastVisible,
    showToast,
  };
}
