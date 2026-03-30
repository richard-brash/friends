import { onMounted, onUnmounted, ref } from "vue";

type InstallState = "standalone" | "android-prompted" | "android-dismissed" | "ios" | "unsupported";

// Strongly typed wrapper for the browser's deferred install prompt
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "install-prompt-dismissed";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function useInstallPrompt() {
  const state = ref<InstallState>("unsupported");
  const show = ref(false);
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  function handleBeforeInstallPrompt(e: Event) {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    if (!sessionStorage.getItem(DISMISSED_KEY)) {
      state.value = "android-prompted";
      show.value = true;
    }
  }

  onMounted(() => {
    if (isStandalone()) {
      state.value = "standalone";
      show.value = false;
      return;
    }

    if (sessionStorage.getItem(DISMISSED_KEY)) {
      show.value = false;
      return;
    }

    if (isIos()) {
      state.value = "ios";
      show.value = true;
      return;
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  });

  onUnmounted(() => {
    window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  });

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === "accepted") {
      state.value = "standalone";
    }
    show.value = false;
  }

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    show.value = false;
  }

  return { state, show, install, dismiss };
}
