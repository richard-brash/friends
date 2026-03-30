<script setup lang="ts">
import { useInstallPrompt } from "../composables/useInstallPrompt";

const { state, show, install, dismiss } = useInstallPrompt();
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="show"
      class="fixed bottom-0 left-0 right-0 z-50 border-t border-sky-200 bg-sky-50 px-4 py-4 shadow-lg sm:px-6"
    >
      <!-- Android: native install button -->
      <div v-if="state === 'android-prompted'" class="mx-auto flex max-w-lg items-center gap-3">
        <div class="flex-1">
          <p class="text-sm font-semibold text-sky-900">Add to your home screen</p>
          <p class="text-xs text-sky-700">Install for quick access without a browser.</p>
        </div>
        <button
          type="button"
          class="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
          @click="install"
        >
          Install
        </button>
        <button type="button" class="p-1 text-sky-500 hover:text-sky-700" aria-label="Dismiss" @click="dismiss">
          ✕
        </button>
      </div>

      <!-- iOS: manual instructions -->
      <div v-else-if="state === 'ios'" class="mx-auto max-w-lg">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-sky-900">Add to your home screen</p>
            <p class="mt-1 text-xs text-sky-700">
              Tap <span class="font-semibold">Share</span> (the box with an arrow) at the bottom of Safari, then choose
              <span class="font-semibold">"Add to Home Screen"</span> for the best experience.
            </p>
          </div>
          <button type="button" class="shrink-0 p-1 text-sky-500 hover:text-sky-700" aria-label="Dismiss" @click="dismiss">
            ✕
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
