<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getDashboardStats, type DashboardStats } from '../../api/dashboard';

const stats = ref<DashboardStats | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  error.value = null;

  try {
    stats.value = await getDashboardStats();
  } catch {
    error.value = 'Failed to load dashboard.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="mx-auto w-full max-w-4xl p-4 sm:p-6">
    <header class="mb-5">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      <p class="mt-1 text-sm text-slate-600">Coordinator overview of outreach and warehouse operations.</p>
    </header>

    <p v-if="loading" class="rounded-xl bg-white p-4 text-slate-600 shadow-sm">Loading dashboard...</p>
    <p v-else-if="error" class="rounded-xl bg-rose-50 p-4 text-rose-700">{{ error }}</p>

    <template v-else-if="stats">
      <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="mb-3 text-lg font-semibold text-slate-900">Today's Activity</h2>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article class="rounded-xl bg-slate-50 p-4">
            <p class="text-sm font-medium text-slate-600">Encounters today</p>
            <p class="mt-1 text-2xl font-bold text-slate-900">{{ stats.todaysActivity.encountersToday }}</p>
          </article>
          <article class="rounded-xl bg-slate-50 p-4">
            <p class="text-sm font-medium text-slate-600">Requests created today</p>
            <p class="mt-1 text-2xl font-bold text-slate-900">{{ stats.todaysActivity.requestsCreatedToday }}</p>
          </article>
          <article class="rounded-xl bg-slate-50 p-4">
            <p class="text-sm font-medium text-slate-600">Items delivered today</p>
            <p class="mt-1 text-2xl font-bold text-slate-900">{{ stats.todaysActivity.itemsDeliveredToday }}</p>
          </article>
        </div>
      </section>

      <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="mb-3 text-lg font-semibold text-slate-900">Warehouse Status</h2>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article class="rounded-xl bg-amber-50 p-4">
            <p class="text-sm font-medium text-amber-700">REQUESTED</p>
            <p class="mt-1 text-2xl font-bold text-slate-900">{{ stats.warehouseStatus.REQUESTED }}</p>
          </article>
          <article class="rounded-xl bg-sky-50 p-4">
            <p class="text-sm font-medium text-sky-700">READY</p>
            <p class="mt-1 text-2xl font-bold text-slate-900">{{ stats.warehouseStatus.READY }}</p>
          </article>
          <article class="rounded-xl bg-emerald-50 p-4">
            <p class="text-sm font-medium text-emerald-700">DELIVERED</p>
            <p class="mt-1 text-2xl font-bold text-slate-900">{{ stats.warehouseStatus.DELIVERED }}</p>
          </article>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="mb-3 text-lg font-semibold text-slate-900">Top Requested Items</h2>
        <ul v-if="stats.topRequestedItems.length" class="space-y-2">
          <li
            v-for="item in stats.topRequestedItems"
            :key="item.description"
            class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
          >
            <span class="text-base text-slate-900">{{ item.description }}</span>
            <span class="text-sm font-semibold text-slate-600">{{ item.count }}</span>
          </li>
        </ul>
        <p v-else class="rounded-xl bg-slate-50 p-4 text-slate-600">No item requests recorded yet.</p>
      </section>
    </template>
  </section>
</template>
