import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Box,
  Typography,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
  Button,
  TextField
} from '@mui/material';
import {
  LocationOn,
  ArrowUpward,
  ArrowDownward,
  MoreVert,
  Delete,
  MoveUp,
  Edit,
  AddLocation,
  Done,
  Close
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../../config/api';

/**
 * Reusable LocationsList component for displaying and managing route locations
 * 
 * @param {Array} locations - Array of location objects (must include id, description, routeOrder)
 * @param {number} routeId - ID of the current route
 * @param {string} routeName - Name of the route (for Add Location dialog)
 * @param {boolean} editable - Whether locations can be reordered/modified (default: false)
 * @param {function} onLocationsChanged - Callback when locations are modified (optional)
 * @param {Array} allRoutes - Array of all routes for moving locations (optional)
 * @param {boolean} showAddButton - Show "Add Location" button (default: true when editable)
 */
export default function LocationsList({ 
  locations = [], 
  routeId,
  routeName,
  editable = false, 
  onLocationsChanged,
  allRoutes = [],
  showAddButton = true
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  
  // Inline add form state
  const [addName, setAddName] = useState('');
  const [addNotes, setAddNotes] = useState('');

  const handleMenuOpen = (event, location) => {
    setMenuAnchor(event.currentTarget);
    setSelectedLocation(location);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedLocation(null);
  };
  
  const handleStartEdit = (location) => {
    setEditingId(location.id);
    setEditName(location.name || '');
    setEditNotes(location.notes || '');
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditNotes('');
  };
  
  const handleSaveEdit = async (location) => {
    if (!editName.trim()) {
      alert('Location name is required');
      return;
    }
    
    setUpdating(true);
    
    try {
      await axios.put(`${API_BASE}/v2/locations/${location.id}`, {
        name: editName.trim(),
        notes: editNotes.trim() || null
      });
      
      setEditingId(null);
      
      // Notify parent to refresh
      if (onLocationsChanged) {
        onLocationsChanged();
      }
      
    } catch (err) {
      console.error('Failed to update location:', err);
      alert('Failed to update location. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  const handleCancelAdd = () => {
    setShowAddForm(false);
    setAddName('');
    setAddNotes('');
  };
  
  const handleSaveAdd = async () => {
    if (!addName.trim()) {
      alert('Location name is required');
      return;
    }
    
    setUpdating(true);
    
    try {
      // First, shift all existing locations down to make room at position 1
      const shiftUpdates = locations.map((loc, index) =>
        axios.put(`${API_BASE}/v2/locations/${loc.id}`, {
          routeOrder: index + 2  // Shift all down by 1 (2, 3, 4, ...)
        })
      );
      
      await Promise.all(shiftUpdates);
      
      // Now create the new location at position 1
      await axios.post(`${API_BASE}/v2/locations`, {
        name: addName.trim(),
        notes: addNotes.trim() || null,
        routeId: routeId,
        routeOrder: 1  // Add at the beginning
      });
      
      // Reset form
      setShowAddForm(false);
      setAddName('');
      setAddNotes('');
      
      // Notify parent to refresh
      if (onLocationsChanged) {
        onLocationsChanged();
      }
      
    } catch (err) {
      console.error('Failed to add location:', err);
      alert('Failed to add location. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleMoveUp = async (location) => {
    if (!location || !editable) return;
    
    const currentIndex = locations.findIndex(loc => loc.id === location.id);
    if (currentIndex <= 0) return; // Already at top
    
    await reorderLocations(currentIndex, currentIndex - 1);
  };

  const handleMoveDown = async (location) => {
    if (!location || !editable) return;
    
    const currentIndex = locations.findIndex(loc => loc.id === location.id);
    if (currentIndex < 0 || currentIndex >= locations.length - 1) return; // Already at bottom
    
    await reorderLocations(currentIndex, currentIndex + 1);
  };

  const reorderLocations = async (fromIndex, toIndex) => {
    setUpdating(true);
    
    try {
      // Create new order by swapping items
      const reordered = [...locations];
      const [movedItem] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, movedItem);
      
      // Update ALL locations in the new order (use camelCase - backend handles conversion)
      const updates = reordered.map((loc, index) =>
        axios.put(`${API_BASE}/v2/locations/${loc.id}`, {
          routeOrder: index + 1  // Use camelCase
        })
      );
      
      // Send all updates in parallel
      await Promise.all(updates);
      
      // Notify parent to refresh
      if (onLocationsChanged) {
        onLocationsChanged();
      }
      
    } catch (err) {
      console.error('Failed to reorder locations:', err);
      alert('Failed to reorder locations. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleMoveToRoute = async (targetRouteId) => {
    if (!selectedLocation || !editable) return;
    
    setUpdating(true);
    handleMenuClose();
    
    try {
      // Update location's routeId (use camelCase - backend handles conversion)
      await axios.put(`${API_BASE}/v2/locations/${selectedLocation.id}`, {
        routeId: targetRouteId,
        routeOrder: null // Will be assigned at end of new route
      });
      
      // Notify parent to refresh
      if (onLocationsChanged) {
        onLocationsChanged();
      }
      
    } catch (err) {
      console.error('Failed to move location:', err);
      alert('Failed to move location. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLocation || !editable) return;
    
    if (!confirm(`Remove "${selectedLocation.name}" from ${routeName}?\n\nThe location will remain in the system but will be unassigned.`)) {
      handleMenuClose();
      return;
    }
    
    setUpdating(true);
    handleMenuClose();
    
    try {
      // Remove from route by setting routeId to null (use camelCase)
      await axios.put(`${API_BASE}/v2/locations/${selectedLocation.id}`, {
        routeId: null,
        routeOrder: null
      });
      
      // Notify parent to refresh
      if (onLocationsChanged) {
        onLocationsChanged();
      }
      
    } catch (err) {
      console.error('Failed to remove location:', err);
      alert('Failed to remove location. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/* Add Location Button and Inline Form */}
      {editable && showAddButton && (
        <Box sx={{ mb: 2 }}>
          {!showAddForm ? (
            <Button
              variant="outlined"
              startIcon={<AddLocation />}
              onClick={() => setShowAddForm(true)}
              fullWidth
              disabled={updating}
            >
              Add Location to Route
            </Button>
          ) : (
            <Paper sx={{ p: 2, border: '2px solid', borderColor: 'primary.main' }}>
              <Typography variant="subtitle2" gutterBottom>
                Add New Location (will be added as first stop)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  size="small"
                  label="Location Name"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  fullWidth
                  autoFocus
                  disabled={updating}
                  required
                />
                <TextField
                  size="small"
                  label="Notes"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  disabled={updating}
                />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<Done />}
                    onClick={handleSaveAdd}
                    disabled={updating || !addName.trim()}
                  >
                    Add Location
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Close />}
                    onClick={handleCancelAdd}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {locations.length === 0 && !showAddForm ? (
        <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography color="text.secondary">
            No locations assigned to this route
          </Typography>
          {editable && showAddButton && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Click "Add Location to Route" to get started
            </Typography>
          )}
        </Box>
      ) : (
        <List dense={!editable}>
        {locations.map((location, index) => {
          const isEditing = editingId === location.id;
          
          return (
          <ListItem 
            key={location?.id || index}
            sx={{ 
              borderRadius: 1,
              mb: 0.5,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: isEditing ? 'primary.main' : 'divider',
              opacity: updating ? 0.6 : 1
            }}
            secondaryAction={
              editable && !isEditing && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Edit">
                    <IconButton 
                      size="small" 
                      onClick={() => handleStartEdit(location)}
                      disabled={updating}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Move up">
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => handleMoveUp(location)}
                        disabled={index === 0 || updating}
                      >
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Move down">
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => handleMoveDown(location)}
                        disabled={index === locations.length - 1 || updating}
                      >
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="More options">
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleMenuOpen(e, location)}
                      disabled={updating}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )
            }
          >
            <ListItemAvatar>
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.main',
                  width: 32, 
                  height: 32 
                }}
              >
                <Typography variant="caption">{index + 1}</Typography>
              </Avatar>
            </ListItemAvatar>
            
            {isEditing ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, mr: 1 }}>
                <TextField
                  size="small"
                  label="Location Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  fullWidth
                  autoFocus
                  disabled={updating}
                />
                <TextField
                  size="small"
                  label="Notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  disabled={updating}
                />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleSaveEdit(location)}
                    disabled={updating}
                  >
                    <Done />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={handleCancelEdit}
                    disabled={updating}
                  >
                    <Close />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <ListItemText
                primary={location?.name || location?.description || `Location ${index + 1}`}
                secondary={
                  <Box component="span">
                    {location?.address && (
                      <Typography variant="caption" display="block" component="span">
                        {location.address}
                      </Typography>
                    )}
                    {location?.notes && (
                      <Typography variant="caption" display="block" component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        {location.notes}
                      </Typography>
                    )}
                  </Box>
                }
                secondaryTypographyProps={{ component: 'div' }}
              />
            )}
          </ListItem>
          );
        })}
      </List>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {allRoutes.length > 0 && (
          <MenuItem disabled sx={{ opacity: 1, fontWeight: 'bold', fontSize: '0.875rem' }}>
            Move to Route:
          </MenuItem>
        )}
        {allRoutes
          .filter(route => route.id !== routeId)
          .map(route => (
            <MenuItem 
              key={route.id} 
              onClick={() => handleMoveToRoute(route.id)}
              sx={{ pl: 3 }}
            >
              {route.name}
            </MenuItem>
          ))
        }
        {allRoutes.length > 0 && <MenuItem divider disabled sx={{ my: 0, py: 0 }} />}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Remove from Route
        </MenuItem>
      </Menu>
    </>
  );
}
