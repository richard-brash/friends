import { API_BASE } from './api.js';

// Friends API client - using clean architecture
const friendsApi = {
  // Get all friends with optional filters
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.locationId) params.append('locationId', filters.locationId);
    if (filters.search) params.append('search', filters.search);
    
    const url = `${API_BASE}/v2/friends${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch friends');
    }

    return await response.json();
  },

  // Get single friend by ID with full details
  async getById(id) {
    const response = await fetch(`${API_BASE}/v2/friends/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch friend');
    }

    return await response.json();
  },

  // Create new friend
  async create(friendData) {
    const response = await fetch(`${API_BASE}/v2/friends`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(friendData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create friend');
    }

    return await response.json();
  },

  // Update existing friend
  async update(id, friendData) {
    const response = await fetch(`${API_BASE}/v2/friends/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(friendData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update friend');
    }

    return await response.json();
  },

  // Delete friend (soft delete)
  async delete(id) {
    const response = await fetch(`${API_BASE}/v2/friends/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete friend');
    }

    return await response.json();
  },

  // Search friends by name or nickname
  async search(searchTerm) {
    const response = await fetch(`${API_BASE}/v2/friends/search/${encodeURIComponent(searchTerm)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to search friends');
    }

    return await response.json();
  },

  // Get location history for a specific friend (for tooltips/on-demand)
  async getLocationHistory(friendId) {
    const response = await fetch(`${API_BASE}/v2/friends/${friendId}/location-history`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get location history');
    }

    return await response.json();
  },

  // Add location history entry for a friend
  async addLocationHistory(friendId, locationData) {
    const response = await fetch(`${API_BASE}/v2/friends/${friendId}/location-history`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(locationData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to add location history');
    }

    return await response.json();
  }
};

export default friendsApi;