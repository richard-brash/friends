/**
 * Routes API - V2 Clean Architecture Integration
 * Follows established patterns from locationsApi and friendsApi
 * Provides consistent API interface for route management
 */

import { API_BASE } from './api.js';

// Routes API client - using clean architecture V2
const routesApi = {
  /**
   * Get all routes with location and friend counts
   */
  async getAll() {
    const url = `${API_BASE}/v2/routes`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch routes: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Get route by ID with detailed location information
   */
  async getById(id) {
    const url = `${API_BASE}/v2/routes/${id}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch route ${id}: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Create new route
   */
  async create(routeData) {
    const url = `${API_BASE}/v2/routes`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(routeData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create route: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Update route
   */
  async update(id, routeData) {
    const url = `${API_BASE}/v2/routes/${id}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(routeData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update route ${id}: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Delete route
   */
  async delete(id) {
    const url = `${API_BASE}/v2/routes/${id}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete route ${id}: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Add location to route
   */
  async addLocation(routeId, locationId, orderInRoute = null) {
    const url = `${API_BASE}/v2/routes/${routeId}/locations`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locationId,
        orderInRoute
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to add location to route ${routeId}: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Remove location from route
   */
  async removeLocation(routeId, locationId) {
    const url = `${API_BASE}/v2/routes/${routeId}/locations/${locationId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to remove location from route ${routeId}: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Reorder locations in route
   */
  async reorderLocations(routeId, locationOrders) {
    const url = `${API_BASE}/v2/routes/${routeId}/locations/reorder`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locationOrders
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to reorder locations in route ${routeId}: ${response.statusText}`);
    }

    return await response.json();
  }
};

export default routesApi;