import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert
} from '@mui/material';
import { AddLocation } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../../config/api';

/**
 * Reusable dialog for adding a new location to a route
 * 
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onClose - Called when dialog should close
 * @param {number} routeId - ID of the route to add location to
 * @param {string} routeName - Name of the route (for display)
 * @param {function} onLocationAdded - Callback after successful add (optional)
 */
export default function AddLocationDialog({ open, onClose, routeId, routeName, onLocationAdded }) {
  const [formData, setFormData] = useState({
    description: '',
    address: '',
    notes: '',
    latitude: '',
    longitude: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleReset = () => {
    setFormData({
      description: '',
      address: '',
      notes: '',
      latitude: '',
      longitude: ''
    });
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      setError('Location description is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Create the new location with routeId
      const response = await axios.post(`${API_BASE}/v2/locations`, {
        description: formData.description,
        address: formData.address || null,
        notes: formData.notes || null,
        coordinates: formData.latitude && formData.longitude 
          ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) }
          : null,
        routeId: routeId
      });

      const createdLocation = response.data?.data || response.data?.location;
      
      // Call success callback if provided
      if (onLocationAdded) {
        onLocationAdded(createdLocation);
      }
      
      // Close and reset
      handleClose();
      
    } catch (err) {
      console.error('Failed to add location:', err);
      setError(err.response?.data?.error || 'Failed to add location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddLocation color="primary" />
          Add New Location to Route
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {routeName && (
            <Alert severity="info">
              Adding a new location to route "<strong>{routeName}</strong>". 
              This location will be available for future runs on this route.
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          <TextField
            label="Location Description *"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            required
            placeholder="e.g., Central Park East Entrance, Downtown Library Steps..."
            helperText="A clear, descriptive name for this location"
            disabled={saving}
          />
          
          <TextField
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            fullWidth
            placeholder="Street address or nearby landmark"
            helperText="Physical address or recognizable landmark"
            disabled={saving}
          />
          
          <TextField
            label="Location Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
            multiline
            rows={3}
            placeholder="Additional details: accessibility, best approach, safety notes, typical gathering times..."
            disabled={saving}
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Latitude (Optional)"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              fullWidth
              placeholder="e.g., 40.7829"
              helperText="GPS coordinates if available"
              disabled={saving}
            />
            <TextField
              label="Longitude (Optional)"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              fullWidth
              placeholder="e.g., -73.9654"
              helperText="GPS coordinates if available"
              disabled={saving}
            />
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.description.trim() || saving}
          startIcon={<AddLocation />}
        >
          {saving ? 'Adding...' : 'Add Location'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
