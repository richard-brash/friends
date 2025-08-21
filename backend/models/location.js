// Location model (in-memory for now)
export let locations = [];
let nextId = 1;


// Optionally enrich locations with route info
export function getAllLocations(routesRef) {
  return locations.map(loc => {
    if (loc.routeId) {
      const route = routesRef.find(r => r.id === loc.routeId);
      return { ...loc, routeName: route ? route.name : undefined };
    }
    return loc;
  });
}

export function addLocation(description, notes = "", routeId, routesRef) {
  const location = { id: nextId++, description, notes };
  if (routeId) {
    location.routeId = routeId;
    // Add to route's locationIds
    const route = routesRef.find(r => r.id === routeId);
    if (route) route.locationIds.push(location.id);
  }
  locations.push(location);
  return location;
}

export function updateLocation(id, description, notes, routeId, routesRef) {
  const loc = locations.find(l => l.id === id);
  if (!loc) return null;
  if (description !== undefined) loc.description = description;
  if (notes !== undefined) loc.notes = notes;
  if (routeId !== undefined) {
    // If routeId is falsy ("" or undefined or null), disassociate from any route
    if (!routeId) {
      if (loc.routeId) {
        const oldRoute = routesRef.find(r => r.id === loc.routeId);
        if (oldRoute) oldRoute.locationIds = oldRoute.locationIds.filter(lid => lid !== id);
      }
      loc.routeId = undefined;
    } else if (loc.routeId !== routeId) {
      // Remove from old route
      if (loc.routeId) {
        const oldRoute = routesRef.find(r => r.id === loc.routeId);
        if (oldRoute) oldRoute.locationIds = oldRoute.locationIds.filter(lid => lid !== id);
      }
      // Add to new route
      const newRoute = routesRef.find(r => r.id === routeId);
      if (newRoute && !newRoute.locationIds.includes(id)) newRoute.locationIds.push(id);
      loc.routeId = routeId;
    }
  }
  return loc;
}

export function deleteLocation(id, routesRef) {
  // Remove from any route
  const loc = locations.find(l => l.id === id);
  if (loc && loc.routeId) {
    const route = routesRef.find(r => r.id === loc.routeId);
    if (route) route.locationIds = route.locationIds.filter(lid => lid !== id);
  }
  locations = locations.filter(l => l.id !== id);
}

// Seeding functions for sample data
export function seedLocations(sampleLocations) {
  locations.push(...sampleLocations.map(location => ({
    id: parseInt(location.id),
    description: location.name,
    notes: location.notes,
    address: location.address,
    type: location.type,
    createdAt: location.createdAt
  })));
  
  // Update nextId to avoid conflicts
  const maxId = Math.max(...locations.map(l => l.id), 0);
  nextId = maxId + 1;
}

export function clearAllLocations() {
  locations.length = 0;
  nextId = 1;
}
