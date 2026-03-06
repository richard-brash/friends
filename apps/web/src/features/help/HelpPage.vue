<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { marked } from "marked";

type Guide = {
  id: string;
  title: string;
  fileName: string;
  description?: string;
};

const guides: Guide[] = [
  {
    id: "quick-start",
    title: "Quick Start",
    fileName: "quick-start.md",
    description: "Get started in minutes before you head out.",
  },
  {
    id: "recording-a-request",
    title: "Recording a Request",
    fileName: "recording-a-request.md",
    description: "Capture requests clearly during encounters.",
  },
  {
    id: "packing-requests",
    title: "Packing Requests",
    fileName: "packing-requests.md",
    description: "Move items from REQUESTED to READY in warehouse flow.",
  },
  {
    id: "delivering-items",
    title: "Delivering Items",
    fileName: "delivering-items.md",
    description: "Record deliveries safely and accurately in the field.",
  },
  {
    id: "field-tips",
    title: "Field Tips",
    fileName: "field-tips.md",
    description: "Practical habits for faster, safer outreach work.",
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    fileName: "troubleshooting.md",
    description: "Quick fixes for common app and workflow issues.",
  },
];

const defaultGuide: Guide = {
  id: "quick-start",
  title: "Quick Start",
  fileName: "quick-start.md",
  description: "Get started in minutes before you head out.",
};

const selectedGuideId = ref(defaultGuide.id);
const contentHtml = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const contentContainer = ref<HTMLElement | null>(null);

const selectedGuide = computed(() => {
  return guides.find((guide) => guide.id === selectedGuideId.value) ?? defaultGuide;
});

function resetContentScroll(): void {
  contentContainer.value?.scrollTo({ top: 0, behavior: "auto" });
}

async function loadGuide(guide: Guide): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`/docs/guides/${guide.fileName}`);
    if (!response.ok) {
      throw new Error(`Guide not found: ${guide.fileName}`);
    }

    const markdown = await response.text();
    contentHtml.value = await marked.parse(markdown);
  } catch {
    contentHtml.value = "";
    error.value = "Failed to load guide.";
  } finally {
    loading.value = false;
  }
}

function selectGuide(guide: Guide): void {
  if (loading.value || selectedGuideId.value === guide.id) {
    return;
  }

  selectedGuideId.value = guide.id;
  void nextTick(() => {
    resetContentScroll();
    void loadGuide(guide);
  });
}

onMounted(() => {
  void loadGuide(selectedGuide.value);
});
</script>

<template>
  <section class="mx-auto w-full max-w-6xl p-4 sm:p-6">
    <header class="mb-5">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Help & Guides</h1>
      <p class="mt-1 text-sm text-slate-600">Volunteer instructions and troubleshooting steps.</p>
    </header>

    <div class="grid gap-4 md:grid-cols-[260px_1fr] md:items-start">
      <aside class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:sticky md:top-4">
        <p class="mb-2 text-sm font-semibold text-slate-700">Guides</p>
        <div class="space-y-2">
          <button
            v-for="guide in guides"
            :key="guide.id"
            type="button"
            class="w-full min-h-[44px] rounded-xl px-3 py-2 text-left text-sm font-medium transition"
            :class="selectedGuideId === guide.id
              ? 'bg-sky-100 text-sky-900'
              : 'bg-slate-50 text-slate-800 hover:bg-slate-100'"
            @click="selectGuide(guide)"
          >
            {{ guide.title }}
          </button>
        </div>
      </aside>

      <article class="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header class="border-b border-slate-200 px-5 py-4">
          <h2 class="text-xl font-semibold text-slate-900">{{ selectedGuide.title }}</h2>
          <p v-if="selectedGuide.description" class="mt-1 text-sm text-slate-600">
            {{ selectedGuide.description }}
          </p>
        </header>

        <div ref="contentContainer" class="max-h-[65vh] overflow-auto px-5 py-4">
          <p v-if="loading" class="text-sm text-slate-600">Loading guide...</p>
          <p v-else-if="error" class="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{{ error }}</p>
          <div v-else class="prose prose-slate max-w-none" v-html="contentHtml"></div>
        </div>
      </article>
    </div>
  </section>
</template>
