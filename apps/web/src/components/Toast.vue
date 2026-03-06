<script setup lang="ts">
defineProps<{
  visible: boolean;
  message: string;
}>();
</script>

<template>
  <transition name="toast-fade">
    <div
      v-if="visible && message"
      class="pointer-events-none fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
      role="status"
      aria-live="polite"
    >
      {{ message }}
    </div>
  </transition>
</template>

<style scoped>
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
