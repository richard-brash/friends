// Route model (in-memory for now)
import { locations } from './location.js';

export let routes = [];
let nextId = 1;

export function getAllRoutes() {
  return routes;
}

export function addRoute(name, locationIds = []) {
  const route = { id: nextId++, name, locationIds };
  routes.push(route);
  return route;
}

export function updateRoute(id, name, locationIds) {
  const route = routes.find(r => r.id === id);
  if (route) {
    if (name !== undefined) route.name = name;
    if (locationIds !== undefined) {
      // Find locations removed from this route
      const removed = route.locationIds.filter(lid => !locationIds.includes(lid));
      // Find locations added to this route
      const added = locationIds.filter(lid => !route.locationIds.includes(lid));

      // Remove routeId from removed locations
      removed.forEach(lid => {
        const loc = locations.find(l => l.id === lid);
        if (loc && loc.routeId === id) loc.routeId = undefined;
      });

      // Set routeId for added locations, ensuring each location is only in one route
      added.forEach(lid => {
        const loc = locations.find(l => l.id === lid);
        if (loc) {
          // Remove from any other route
          if (loc.routeId && loc.routeId !== id) {
            const otherRoute = routes.find(r => r.id === loc.routeId);
            if (otherRoute) {
              otherRoute.locationIds = otherRoute.locationIds.filter(oid => oid !== lid);
            }
          }
          loc.routeId = id;
        }
      });

      route.locationIds = locationIds;
    }
  }
  return route;
}

export function deleteRoute(id) {
  routes = routes.filter(r => r.id !== id);
}
