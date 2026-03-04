<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api } from "../api/api";
import Loading from "../components/Loading.vue";

const users = ref<any[]>([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  loading.value = true;
  error.value = "";

  try {
    users.value = await api("/users");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load users.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h1>Users</h1>

    <Loading v-if="loading" />
    <p v-else-if="error" class="error-message">{{ error }}</p>

    <table v-else class="users-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Email</th>
          <th>CreatedAt</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.createdAt || "-" }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.error-message {
  color: #b91c1c;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

.users-table th,
.users-table td {
  text-align: left;
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
}

.users-table th {
  background: #f3f4f6;
  font-weight: 600;
}
</style>
