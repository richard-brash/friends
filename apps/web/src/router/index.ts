import { createRouter, createWebHistory } from "vue-router";
import RouteList from "../features/routes/RouteList.vue";
import RouteDetail from "../features/routes/RouteDetail.vue";
import LocationPage from "../features/locations/LocationPage.vue";
import EncounterForm from "../features/encounters/EncounterForm.vue";
import WarehouseQueue from "../features/warehouse/WarehouseQueue.vue";
import Dashboard from "../features/dashboard/Dashboard.vue";
import HelpPage from "../features/help/HelpPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
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
      component: EncounterForm,
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
  ],
});
