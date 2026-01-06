import React, { useState, useEffect } from "react";
import RouteList from "./RouteList";
import AddRouteForm from "./AddRouteForm";
import routesApi from '../../config/routesApi.js';
import locationsApi from '../../config/locationsApi.js';

export default function DashboardContainer({ showToast, setError }) {
  const [routes, setRoutes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all routes and locations from the API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [routesRes, locationsRes] = await Promise.all([
        routesApi.getAll(),
        locationsApi.getAll()
      ]);
      setRoutes(routesRes.data || []);
      setLocations(locationsRes.data || []);
    } catch (err) {
      setError && setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);
  // Persist expanded/editing route state across refreshes
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null);

  // Fetch all data
  const refreshAll = async () => {
    setLoading(true);
    try {
      console.log('🔄 Using V2 Routes and Locations APIs (Clean Architecture)');
      const [routesRes, locsRes] = await Promise.all([
        routesApi.getAll(),
        locationsApi.getAll()
      ]);
      const routesData = routesRes.data || [];
      const locsData = locsRes.data || [];
      
      console.log('✅ V2 APIs response:', routesData.length, 'routes,', locsData.length, 'locations loaded');
      
      // V2 API returns data directly in clean format
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setLocations(Array.isArray(locsData) ? locsData : []);
      // If editingRoute is set, keep it only if the route still exists
      if (editingRoute && !routesData.some(r => r.id === editingRoute)) {
        setEditingRoute(null);
      }
    } catch (err) {
      console.error('❌ Failed to load data:', err);
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
    const tempRoute = { id: tempId, name, locationCount: 0, friendCount: 0 };
    
    // Optimistically add to local state immediately
    setRoutes(prevRoutes => [...prevRoutes, tempRoute]);
    
    try {
      const response = await routesApi.create({ name });
      const newRoute = response.data;
      
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
    
    try {
      const response = await locationsApi.create(loc);
      const newLocation = response.data;
      
      // Replace temp location with real location from server
      setLocations(prevLocs => prevLocs.map(l => 
        l.id === tempId ? newLocation : l
      ));
      
      showToast && showToast("Location added");
    } catch (error) {
      // Remove temp location on error
      setLocations(prevLocs => prevLocs.filter(l => l.id !== tempId));
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
      await routesApi.update(routeId, { name });
      showToast && showToast("Route updated");
    } catch {
      // Rollback on error
      setRoutes(oldRoutes);
      setError && setError("Failed to update route");
    }
  };

  // Delete route
  const handleDeleteRoute = async (routeId, routeLocations) => {
    // Store old state for rollback
    const oldRoutes = routes;
    
    // Optimistically update local state
    setRoutes(prevRoutes => prevRoutes.filter(r => r.id !== routeId));

    try {
      await routesApi.delete(routeId);
      showToast && showToast("Route deleted");
    } catch {
      // Rollback on error
      setRoutes(oldRoutes);
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
      await locationsApi.update(locId, updates);
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
    
    setLocations(prevLocs => prevLocs.filter(l => l.id !== locId));

    try {
      await locationsApi.delete(locId);
      showToast && showToast("Location deleted");
    } catch {
      // Rollback on error
      setLocations(oldLocations);
      setError && setError("Failed to delete location");
    }
  };

  // Move location to another route (optimistic update)
  const handleMoveLocation = async (locId, newRouteId) => {
    const loc = locations.find(l => l.id === locId);
    if (!loc) return;

    // Store old state for rollback
    const oldLocations = locations;
    
    // Optimistically update local state
    setLocations(prevLocs => prevLocs.map(l =>
      l.id === locId ? { ...l, routeId: newRouteId === "" || newRouteId === undefined ? null : Number(newRouteId) } : l
    ));

    try {
      await locationsApi.update(locId, {
        ...loc,
        routeId: newRouteId === "" || newRouteId === undefined ? null : Number(newRouteId)
      });
      showToast && showToast("Location moved");
    } catch {
      // Rollback on error
      setLocations(oldLocations);
      setError && setError("Failed to move location");
    }
  };

  // Reorder locations within a route (refresh approach)
  const handleReorderLocations = async (routeId, newLocOrder) => {
    // Optimistically update local state
    const oldLocations = locations;
    const reorderedLocations = [...locations];
    // Only reorder locations in the current route
    const routeLocationIds = newLocOrder;
    routeLocationIds.forEach((locationId, index) => {
      const locIdx = reorderedLocations.findIndex(l => l.id === locationId);
      if (locIdx !== -1) {
        reorderedLocations[locIdx] = {
          ...reorderedLocations[locIdx],
          routeOrder: index + 1
        };
      }
    });
    setLocations(reorderedLocations);

    try {
      // Send to backend
      const locationOrders = newLocOrder.map((locationId, index) => ({
        locationId: locationId,
        orderInRoute: index + 1
      }));
      await routesApi.reorderLocations(routeId, locationOrders);
      showToast && showToast("Locations reordered successfully");
    } catch (error) {
      // Rollback on error
      setLocations(oldLocations);
      setError && setError("Failed to reorder locations");
    }
  };

  if (loading) return <div>Loading...</div>;

  // Always pass arrays to children, and all handlers
  return (
    <div>
      <h2>Routes & Locations</h2>
      <AddRouteForm onAdd={handleAddRoute} />
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
