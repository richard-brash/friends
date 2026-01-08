import { API_BASE } from './api.js';

// Locations API client - using clean architecture V2
const locationsApi = {
  // Get all locations with optional filters
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.routeId) params.append('routeId', filters.routeId);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    
    const url = `${API_BASE}/v2/locations${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch locations');
    }

    return await response.json();
  },

  // Get single location by ID with full details
  async getById(id) {
    const response = await fetch(`${API_BASE}/v2/locations/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch location');
    }

    return await response.json();
  },

  // Create new location
  async create(locationData) {
    const response = await fetch(`${API_BASE}/v2/locations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(locationData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create location');
    }

    return await response.json();
  },

  // Update existing location
  async update(id, locationData) {
    const response = await fetch(`${API_BASE}/v2/locations/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(locationData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update location');
    }

    return await response.json();
  },

  // Delete location
  async delete(id) {
    const response = await fetch(`${API_BASE}/v2/locations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete location');
    }

    return await response.json();
  },

  // Search locations by name or address
  async search(searchTerm) {
    const response = await fetch(`${API_BASE}/v2/locations/search/${encodeURIComponent(searchTerm)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to search locations');
    }

    return await response.json();
  }
};

export default locationsApi;