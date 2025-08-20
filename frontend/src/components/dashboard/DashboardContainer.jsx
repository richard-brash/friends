import React, { useState, useEffect } from "react";
import RouteList from "./RouteList";
import AddRouteForm from "./AddRouteForm";
import AddLocationForm from "./AddLocationForm";

export default function DashboardContainer({ showToast, setError }) {
  const [routes, setRoutes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  // Persist expanded/editing route state across refreshes
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null);

  // Fetch all data
  const refreshAll = async () => {
    setLoading(true);
    try {
      const [routesRes, locsRes] = await Promise.all([
        fetch("/api/routes"),
        fetch("/api/locations")
      ]);
      const routesData = await routesRes.json();
      const locsData = await locsRes.json();
      // Support both array and {routes: []} shapes
      const newRoutes = Array.isArray(routesData) ? routesData : routesData.routes || [];
      setRoutes(newRoutes);
      setLocations(Array.isArray(locsData) ? locsData : locsData.locations || []);
      // If editingRoute is set, keep it only if the route still exists
      if (editingRoute && !newRoutes.some(r => r.id === editingRoute)) {
        setEditingRoute(null);
      }
    } catch (err) {
      setError && setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshAll(); }, []);

  // Handlers
  const handleAddRoute = async (name) => {
    // Generate a temporary ID for optimistic update
    const tempId = Date.now();
    const tempRoute = { id: tempId, name, locationIds: [] };
    
    // Optimistically add to local state immediately
    setRoutes(prevRoutes => [...prevRoutes, tempRoute]);
    
    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const response = await res.json();
      
      // Handle both response formats: {route: {...}} or {...}
      const newRoute = response.route || response;
      
      // Replace temp route with real route from server
      setRoutes(prevRoutes => prevRoutes.map(r => 
        r.id === tempId ? newRoute : r
      ));
      
      showToast && showToast("Route added");
    } catch (error) {
      // Remove temp route on error
      setRoutes(prevRoutes => prevRoutes.filter(r => r.id !== tempId));
      setError && setError("Failed to add route");
    }
  };

  const handleAddLocation = async (loc) => {
    // Generate a temporary ID for optimistic update
    const tempId = Date.now();
    const tempLocation = { ...loc, id: tempId };
    
    // Optimistically add to local state immediately
    setLocations(prevLocs => [...prevLocs, tempLocation]);
    
    // If location has a routeId, add it to that route's locationIds
    if (tempLocation.routeId) {
      setRoutes(prevRoutes => prevRoutes.map(r =>
        r.id === tempLocation.routeId 
          ? { ...r, locationIds: [...r.locationIds, tempId] }
          : r
      ));
    }
    
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loc)
      });
      if (!res.ok) {
        console.error("Server response not ok:", res.status, res.statusText);
        throw new Error(`Server error: ${res.status}`);
      }
      const response = await res.json();
      
      // Handle both response formats: {location: {...}} or {...}
      const newLocation = response.location || response;
      
      // Replace temp location with real location from server
      setLocations(prevLocs => prevLocs.map(l => 
        l.id === tempId ? newLocation : l
      ));
      
      // Update route with real location ID if needed
      if (newLocation.routeId) {
        setRoutes(prevRoutes => prevRoutes.map(r =>
          r.id === newLocation.routeId 
            ? { ...r, locationIds: r.locationIds.map(id => id === tempId ? newLocation.id : id) }
            : r
        ));
      }
      
      showToast && showToast("Location added");
    } catch (error) {
      // Remove temp location on error
      setLocations(prevLocs => prevLocs.filter(l => l.id !== tempId));
      if (tempLocation.routeId) {
        setRoutes(prevRoutes => prevRoutes.map(r =>
          r.id === tempLocation.routeId 
            ? { ...r, locationIds: r.locationIds.filter(id => id !== tempId) }
            : r
        ));
      }
      setError && setError("Failed to add location");
    }
  };


  // Edit route name (optimistic update)
  const handleEditRoute = async (routeId, name) => {
    // Optimistically update local state
    const oldRoutes = routes;
    setRoutes(prevRoutes => prevRoutes.map(r => 
      r.id === routeId ? { ...r, name } : r
    ));
    
    try {
      const res = await fetch(`/api/routes/${routeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error();
      showToast && showToast("Route updated");
    } catch {
      // Rollback on error
      setRoutes(oldRoutes);
      setError && setError("Failed to update route");
    }
  };

  // Delete route (disassociate all locations, then delete route)
  const handleDeleteRoute = async (routeId, routeLocations) => {
    // Store old state for rollback
    const oldRoutes = routes;
    const oldLocations = locations;
    
    // Optimistically update local state
    setRoutes(prevRoutes => prevRoutes.filter(r => r.id !== routeId));
    setLocations(prevLocs => prevLocs.map(l =>
      l.routeId === routeId ? { ...l, routeId: null } : l
    ));

    try {
      // Disassociate all locations from this route
      for (const loc of routeLocations) {
        await fetch(`/api/locations/${loc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ routeId: null })
        });
      }
      // Now delete the route
      const res = await fetch(`/api/routes/${routeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast && showToast("Route deleted");
    } catch {
      // Rollback on error
      setRoutes(oldRoutes);
      setLocations(oldLocations);
      setError && setError("Failed to delete route");
    }
  };


  // Edit location (optimistic update)
  const handleEditLocation = async (locId, updates) => {
    // Optimistically update local state
    const oldLocations = locations;
    setLocations(prevLocs => prevLocs.map(l =>
      l.id === locId ? { ...l, ...updates } : l
    ));

    try {
      // Ensure routeId is number or null
      let payload = { ...updates };
      if ('routeId' in payload) {
        payload.routeId = payload.routeId === "" || payload.routeId === undefined ? null : Number(payload.routeId);
      }
      const res = await fetch(`/api/locations/${locId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      showToast && showToast("Location updated");
    } catch {
      // Rollback on error
      setLocations(oldLocations);
      setError && setError("Failed to update location");
    }
  };

  // Delete location (optimistic update)
  const handleDeleteLocation = async (locId) => {
    // Optimistically update local state
    const oldLocations = locations;
    const oldRoutes = routes;
    
    setLocations(prevLocs => prevLocs.filter(l => l.id !== locId));
    setRoutes(prevRoutes => prevRoutes.map(r => ({
      ...r,
      locationIds: r.locationIds.filter(id => id !== locId)
    })));

    try {
      const res = await fetch(`/api/locations/${locId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast && showToast("Location deleted");
    } catch {
      // Rollback on error
      setLocations(oldLocations);
      setRoutes(oldRoutes);
      setError && setError("Failed to delete location");
    }
  };

  // Move location to another route (optimistic update)
  const handleMoveLocation = async (locId, newRouteId) => {
    const loc = locations.find(l => l.id === locId);
    if (!loc) return;

    // Store old state for rollback
    const oldLocations = locations;
    const oldRoutes = routes;
    
    // Optimistically update local state
    setLocations(prevLocs => prevLocs.map(l =>
      l.id === locId ? { ...l, routeId: newRouteId === "" || newRouteId === undefined ? null : Number(newRouteId) } : l
    ));
    
    setRoutes(prevRoutes => prevRoutes.map(r => {
      // Remove from old route
      if (r.id === loc.routeId) {
        return { ...r, locationIds: r.locationIds.filter(id => id !== locId) };
      }
      // Add to new route
      if (r.id === newRouteId) {
        return { ...r, locationIds: [...r.locationIds, locId] };
      }
      return r;
    }));

    try {
      const res = await fetch(`/api/locations/${locId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: loc.description,
          notes: loc.notes,
          routeId: newRouteId === "" || newRouteId === undefined ? null : Number(newRouteId)
        })
      });
      if (!res.ok) throw new Error();
      showToast && showToast("Location moved");
    } catch {
      // Rollback on error
      setLocations(oldLocations);
      setRoutes(oldRoutes);
      setError && setError("Failed to move location");
    }
  };

  // Reorder locations within a route (optimistic update)
  const handleReorderLocations = async (routeId, newLocOrder) => {
    // Optimistically update local state
    const oldRoutes = routes;
    setRoutes(prevRoutes => prevRoutes.map(r =>
      r.id === routeId ? { ...r, locationIds: newLocOrder } : r
    ));

    try {
      const route = routes.find(r => r.id === routeId);
      if (!route) return;
      const res = await fetch(`/api/routes/${routeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: route.name, locationIds: newLocOrder })
      });
      if (!res.ok) throw new Error();
      showToast && showToast("Order saved");
    } catch {
      // Rollback on error
      setRoutes(oldRoutes);
      setError && setError("Failed to reorder locations");
    }
  };

  if (loading) return <div>Loading...</div>;

  // Always pass arrays to children, and all handlers
  return (
    <div>
      <h2>Routes & Locations</h2>
      <AddRouteForm onAdd={handleAddRoute} />
      <AddLocationForm onAdd={handleAddLocation} routes={routes || []} />
      <RouteList
        routes={routes || []}
        locations={locations || []}
        expandedRoute={expandedRoute}
        setExpandedRoute={setExpandedRoute}
        editingRoute={editingRoute}
        setEditingRoute={setEditingRoute}
        onEditRoute={handleEditRoute}
        onDeleteRoute={handleDeleteRoute}
        onAddLocation={handleAddLocation}
        onEditLocation={handleEditLocation}
        onDeleteLocation={handleDeleteLocation}
        onMoveLocation={handleMoveLocation}
        onReorderLocations={handleReorderLocations}
      />
    </div>
  );
}
