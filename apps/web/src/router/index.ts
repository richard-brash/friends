import { createRouter, createWebHistory } from "vue-router";
import RouteList from "../features/routes/RouteList.vue";
import RouteDetail from "../features/routes/RouteDetail.vue";
import LocationPage from "../features/locations/LocationPage.vue";

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
  ],
});
