<template>
  <div class="app-layout">
    <aside class="sidebar">
      <h2 class="sidebar-title">Admin</h2>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-link">Dashboard</router-link>
        <router-link to="/users" class="nav-link">Users</router-link>
      </nav>
    </aside>

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #f6f7fb;
  color: #1f2937;
}

.sidebar {
  width: 220px;
  background: #eef2f7;
  border-right: 1px solid #d9e0ea;
  padding: 1rem;
}

.sidebar-title {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  text-decoration: none;
  color: #374151;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
}

.nav-link.router-link-active {
  background: #dfe7f3;
  color: #0f172a;
  font-weight: 600;
}

.main-content {
  flex: 1;
  padding: 1.5rem;
}
</style>
