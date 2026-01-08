import { API_BASE } from './api.js';

// Runs API client - using clean architecture by default
const runsApi = {
  // Get all runs with optional filters
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    
    const url = `${API_BASE}/runs${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch runs');
    }

    return await response.json();
  },

  // Get single run by ID
  async getById(id) {
    const response = await fetch(`${API_BASE}/runs/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch run');
    }

    return await response.json();
  },

  // Create new run
  async create(runData) {
    const response = await fetch(`${API_BASE}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(runData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create run');
    }

    return await response.json();
  },

  // Update existing run
  async update(id, runData) {
    const response = await fetch(`${API_BASE}/runs/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(runData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update run');
    }

    return await response.json();
  },

  // Delete run
  async delete(id) {
    const response = await fetch(`${API_BASE}/runs/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete run');
    }

    return await response.json();
  }
};

export default runsApi;