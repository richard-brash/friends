import { createRouter, createWebHistory } from "vue-router";
import RouteList from "../features/routes/RouteList.vue";
import RouteDetail from "../features/routes/RouteDetail.vue";
import LocationPage from "../features/locations/LocationPage.vue";
import NewEncounter from "../features/encounters/NewEncounter.vue";
import WarehouseQueue from "../features/warehouse/WarehouseQueue.vue";
import Dashboard from "../features/dashboard/Dashboard.vue";
import HelpPage from "../features/help/HelpPage.vue";
import SettingsPage from "../features/settings/SettingsPage.vue";
import LoginPage from "../features/auth/LoginPage.vue";
import { authReady, initializeAuth, isAuthenticated } from "../stores/auth";
import { currentUser } from "../stores/user";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginPage,
      meta: { public: true },
    },
    {
      path: "/",
      name: "route-list",
      component: RouteList,
    },
    {
      path: "/routes/:id",
      name: "route-detail",
      component: RouteDetail,
    },
    {
      path: "/locations/:id",
      name: "location-page",
      component: LocationPage,
    },
    {
      path: "/locations/:id/encounter",
      name: "encounter-form",
      component: NewEncounter,
    },
    {
      path: "/warehouse",
      name: "warehouse-queue",
      component: WarehouseQueue,
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: Dashboard,
    },
    {
      path: "/help",
      name: "help",
      component: HelpPage,
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsPage,
      meta: { requiredRoles: ["admin", "manager"] },
    },
  ],
});

router.beforeEach(async (to) => {
  if (!authReady.value) {
    await initializeAuth();
  }

  const isPublic = Boolean(to.meta.public);
  const authenticated = Boolean(isAuthenticated.value);

  if (!authenticated && !isPublic) {
    return {
      path: "/login",
      query: to.fullPath !== "/" ? { redirect: to.fullPath } : undefined,
    };
  }

  if (authenticated && to.path === "/login") {
    return "/";
  }

  const requiredRoles = Array.isArray(to.meta.requiredRoles)
    ? (to.meta.requiredRoles as Array<"admin" | "manager" | "volunteer">)
    : [];

  if (requiredRoles.length > 0) {
    const role = currentUser.value?.role;
    if (!role || !requiredRoles.includes(role)) {
      return "/";
    }
  }

  return true;
});
