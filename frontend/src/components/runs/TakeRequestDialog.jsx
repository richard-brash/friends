import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  Person,
  PersonAdd,
  LocationOn,
  Route as RouteIcon,
  CalendarToday,
  Flag,
  AddLocation
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

export default function TakeRequestDialog({ 
  open, 
  onClose, 
  run, 
  route, 
  currentLocation,
  onRequestTaken 
}) {
  const [friends, setFriends] = useState([]);
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Friend search and selection
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendSearchText, setFriendSearchText] = useState('');
  const [showNewFriendForm, setShowNewFriendForm] = useState(false);
  
  // New friend form
  const [newFriend, setNewFriend] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  
  // Location creation
  const [showNewLocationForm, setShowNewLocationForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    description: '',
    address: '',
    notes: '',
    latitude: '',
    longitude: ''
  });
  
  // Request details
  const [requestData, setRequestData] = useState({
    itemCategory: 'clothing', // 'clothing' or 'non-clothing'
    itemRequested: '',
    itemDetails: '',
    clothingSize: '',
    clothingGender: '',
    quantity: 1,
    urgency: 'medium',
    specialInstructions: '',
    routeId: run?.routeId || '',
    locationId: currentLocation?.id || '',
    dateRequested: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (open) {
      fetchData();
      // Reset form when dialog opens
      setRequestData({
        itemCategory: 'clothing',
        itemRequested: '',
        itemDetails: '',
        clothingSize: '',
        clothingGender: '',
        quantity: 1,
        urgency: 'medium',
        specialInstructions: '',
        routeId: run?.routeId || '',
        locationId: currentLocation?.id || '',
        dateRequested: new Date().toISOString().split('T')[0]
      });
      setSelectedFriend(null);
      setFriendSearchText('');
      setShowNewFriendForm(false);
      setShowNewLocationForm(false);
      setNewLocation({
        description: '',
        address: '',
        notes: '',
        latitude: '',
        longitude: ''
      });
      setError('');
    }
  }, [open, run, currentLocation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [friendsRes, locationsRes, routesRes] = await Promise.all([
        axios.get(`${API_BASE}/friends`),
        axios.get(`${API_BASE}/locations`),
        axios.get(`${API_BASE}/routes`)
      ]);
      
      const friendsData = friendsRes.data;
      const locationsData = locationsRes.data;
      const routesData = routesRes.data;
      
      setFriends(friendsData.friends || []);
      setLocations(locationsData.locations || []);
      setRoutes(routesData.routes || []);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter friends based on search text and optionally by route/location
  const filteredFriends = friends.filter(friend => {
    if (!friendSearchText) return true;
    
    const searchLower = friendSearchText.toLowerCase();
    return (
      friend.name.toLowerCase().includes(searchLower) ||
      friend.email?.toLowerCase().includes(searchLower) ||
      friend.phone?.includes(friendSearchText)
    );
  });

  const handleFriendSelection = (friend) => {
    setSelectedFriend(friend);
    setShowNewFriendForm(false);
    
    // Auto-update friend's location if we're at a specific location
    if (currentLocation && friend.locationId !== currentLocation.id) {
      // Could show a confirmation dialog here, for now just update silently
      updateFriendLocation(friend, currentLocation.id);
    }
  };

  const updateFriendLocation = async (friend, newLocationId) => {
    try {
      await axios.put(`${API_BASE}/friends/${friend.id}`, {
        ...friend,
        locationId: newLocationId,
        lastSeenAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Failed to update friend location:', err);
    }
  };

  const handleCreateNewFriend = () => {
    setShowNewFriendForm(true);
    setSelectedFriend(null);
    setNewFriend({
      name: friendSearchText || '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    });
  };

  const handleCreateNewLocation = () => {
    setShowNewLocationForm(true);
    setNewLocation({
      description: '',
      address: '',
      notes: '',
      latitude: '',
      longitude: ''
    });
  };

  const createLocationAndAddToRoute = async () => {
    if (!newLocation.description.trim()) {
      setError('Location description is required');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      // 1. Create the new location
      const locationResponse = await axios.post(`${API_BASE}/locations`, {
        ...newLocation,
        routeId: requestData.routeId || run?.routeId
      });

      const createdLocation = locationResponse.data.location;
      
      // 2. Add location to the current route's locationIds array
      if (run?.routeId) {
        const currentRoute = routes.find(r => r.id.toString() === run.routeId.toString());
        if (currentRoute) {
          const updatedLocationIds = [...(currentRoute.locationIds || []), createdLocation.id];
          
          await axios.put(`${API_BASE}/routes/${run.routeId}`, {
            ...currentRoute,
            locationIds: updatedLocationIds
          });
        }
      }
      
      // 3. Update local state
      setLocations(prev => [...prev, createdLocation]);
      setRequestData(prev => ({ ...prev, locationId: createdLocation.id }));
      setShowNewLocationForm(false);
      
      // 4. Reset form
      setNewLocation({
        description: '',
        address: '',
        notes: '',
        latitude: '',
        longitude: ''
      });
      
    } catch (err) {
      setError('Failed to create location: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const createFriendAndRequest = async () => {
    setSubmitting(true);
    setError('');
    
    try {
      // First create the new friend
      const friendResponse = await axios.post(`${API_BASE}/friends`, {
        ...newFriend,
        locationId: requestData.locationId,
        lastSeenAt: new Date().toISOString()
      });
      
      const createdFriend = friendResponse.data;
      
      // Then create the request with the new friend
      await createRequest(createdFriend);
      
    } catch (err) {
      setError('Failed to create friend and request: ' + err.message);
      setSubmitting(false);
    }
  };

  const createRequest = async (friend = selectedFriend) => {
    if (!submitting) setSubmitting(true);
    
    try {
      const response = await axios.post(`${API_BASE}/requests`, {
        ...requestData,
        friendId: friend.id,
        runId: run.id
      });
      
      if (!response.ok) {
        throw new Error('Failed to create request');
      }
      
      const request = response.data;
      
      // Notify parent component
      if (onRequestTaken) {
        onRequestTaken(request, friend);
      }
      
      onClose();
      
    } catch (err) {
      setError('Failed to create request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = () => {
    const baseRequirements = requestData.itemRequested.trim();
    const clothingRequirements = requestData.itemCategory === 'clothing' 
      ? requestData.clothingGender && requestData.clothingSize.trim()
      : true;
    
    if (showNewFriendForm) {
      return newFriend.name.trim() && baseRequirements && clothingRequirements;
    }
    return selectedFriend && baseRequirements && clothingRequirements;
  };

  const handleSubmit = () => {
    if (showNewFriendForm) {
      createFriendAndRequest();
    } else {
      createRequest();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd color="primary" />
          Take Request from Friend
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && (
              <Alert severity="error">{error}</Alert>
            )}
            
            {/* Context Information */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Request Context:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  icon={<RouteIcon />} 
                  label={route?.name || 'No Route'} 
                  size="small" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<LocationOn />} 
                  label={currentLocation?.description || 'No Location'} 
                  size="small" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<CalendarToday />} 
                  label={format(new Date(run?.scheduledDate), 'PP')} 
                  size="small" 
                  variant="outlined" 
                />
              </Box>
            </Paper>

            {/* Friend Selection */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Select Friend
              </Typography>
              
              {!showNewFriendForm ? (
                <>
                  <Autocomplete
                    options={filteredFriends}
                    getOptionLabel={(friend) => `${friend.name} (${friend.email || friend.phone || 'No contact'})`}
                    value={selectedFriend}
                    onChange={(_, friend) => handleFriendSelection(friend)}
                    inputValue={friendSearchText}
                    onInputChange={(_, text) => setFriendSearchText(text)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search for friend..."
                        placeholder="Type name, email, or phone"
                        fullWidth
                      />
                    )}
                    renderOption={(props, friend) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box component="li" key={key} {...otherProps}>
                          <Box>
                            <Typography variant="body1">{friend.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {friend.email || friend.phone || 'No contact info'}
                            </Typography>
                            {friend.lastSeenAt && (
                              <Typography variant="caption" color="text.secondary">
                                Last seen: {format(new Date(friend.lastSeenAt), 'PPp')}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    }}
                    noOptionsText={
                      <Button
                        fullWidth
                        startIcon={<PersonAdd />}
                        onClick={handleCreateNewFriend}
                      >
                        Create new friend "{friendSearchText}"
                      </Button>
                    }
                  />
                  
                  {friendSearchText && filteredFriends.length === 0 && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PersonAdd />}
                      onClick={handleCreateNewFriend}
                      sx={{ mt: 2 }}
                    >
                      Create New Friend: "{friendSearchText}"
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Creating new friend:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Name *"
                        value={newFriend.name}
                        onChange={(e) => setNewFriend({ ...newFriend, name: e.target.value })}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        type="email"
                        value={newFriend.email}
                        onChange={(e) => setNewFriend({ ...newFriend, email: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Phone"
                        value={newFriend.phone}
                        onChange={(e) => setNewFriend({ ...newFriend, phone: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Address"
                        value={newFriend.address}
                        onChange={(e) => setNewFriend({ ...newFriend, address: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Notes"
                        value={newFriend.notes}
                        onChange={(e) => setNewFriend({ ...newFriend, notes: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                  <Button
                    onClick={() => setShowNewFriendForm(false)}
                    sx={{ mt: 2 }}
                  >
                    Cancel - Search Existing Friends
                  </Button>
                </>
              )}
            </Box>

            <Divider />

            {/* Request Details */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Request Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Item Category *</InputLabel>
                    <Select
                      value={requestData.itemCategory}
                      label="Item Category *"
                      onChange={(e) => setRequestData({ 
                        ...requestData, 
                        itemCategory: e.target.value,
                        // Clear clothing-specific fields if switching to non-clothing
                        clothingSize: e.target.value === 'non-clothing' ? '' : requestData.clothingSize,
                        clothingGender: e.target.value === 'non-clothing' ? '' : requestData.clothingGender
                      })}
                    >
                      <MenuItem value="clothing">Clothing</MenuItem>
                      <MenuItem value="non-clothing">Non-Clothing</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={requestData.quantity}
                    onChange={(e) => setRequestData({ ...requestData, quantity: parseInt(e.target.value) || 1 })}
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Item Requested *"
                    value={requestData.itemRequested}
                    onChange={(e) => setRequestData({ ...requestData, itemRequested: e.target.value })}
                    fullWidth
                    required
                    placeholder={requestData.itemCategory === 'clothing' 
                      ? "e.g., Winter jacket, Jeans, Thermal underwear, Athletic shoes..." 
                      : "e.g., Sleeping bag, Personal hygiene kit, Backpack, Phone charger..."
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Item Details"
                    value={requestData.itemDetails}
                    onChange={(e) => setRequestData({ ...requestData, itemDetails: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder={requestData.itemCategory === 'clothing'
                      ? "Specific clothing details: style, color preferences, material, etc."
                      : "Specific item requirements: features, specifications, brand preferences, etc."
                    }
                  />
                </Grid>
                
                {/* Clothing-specific fields */}
                {requestData.itemCategory === 'clothing' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Gender *</InputLabel>
                        <Select
                          value={requestData.clothingGender}
                          label="Gender *"
                          onChange={(e) => setRequestData({ ...requestData, clothingGender: e.target.value })}
                        >
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="unisex">Unisex</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Size *"
                        value={requestData.clothingSize}
                        onChange={(e) => setRequestData({ ...requestData, clothingSize: e.target.value })}
                        fullWidth
                        required
                        placeholder="XS, S, M, L, XL, XXL or shoe size"
                        helperText="For shoes, use numeric sizes (e.g., 8, 9.5, 10)"
                      />
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Urgency</InputLabel>
                    <Select
                      value={requestData.urgency}
                      label="Urgency"
                      onChange={(e) => setRequestData({ ...requestData, urgency: e.target.value })}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date Requested"
                    type="date"
                    value={requestData.dateRequested}
                    onChange={(e) => setRequestData({ ...requestData, dateRequested: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Special Instructions"
                    value={requestData.specialInstructions}
                    onChange={(e) => setRequestData({ ...requestData, specialInstructions: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Any special requirements, preferences, delivery notes, or additional context..."
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Context Settings - Editable */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Request Context (Editable)
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Route</InputLabel>
                    <Select
                      value={requestData.routeId}
                      label="Route"
                      onChange={(e) => setRequestData({ ...requestData, routeId: e.target.value })}
                    >
                      {routes.map(route => (
                        <MenuItem key={route.id} value={route.id}>
                          {route.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  {!showNewLocationForm ? (
                    <Box>
                      <FormControl fullWidth>
                        <InputLabel>Location</InputLabel>
                        <Select
                          value={requestData.locationId}
                          label="Location"
                          onChange={(e) => setRequestData({ ...requestData, locationId: e.target.value })}
                        >
                          {locations.map(location => (
                            <MenuItem key={location.id} value={location.id}>
                              {location.description}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AddLocation />}
                        onClick={handleCreateNewLocation}
                        sx={{ mt: 1 }}
                        size="small"
                      >
                        Add New Location to Route
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Adding new location to current route:
                      </Typography>
                      <TextField
                        label="Location Description *"
                        value={newLocation.description}
                        onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                        fullWidth
                        required
                        size="small"
                        sx={{ mb: 1 }}
                        placeholder="e.g., Central Park East Entrance, Downtown Library Steps..."
                      />
                      <TextField
                        label="Address"
                        value={newLocation.address}
                        onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                        fullWidth
                        size="small"
                        sx={{ mb: 1 }}
                        placeholder="Street address or nearby landmark"
                      />
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Button
                          size="small"
                          onClick={() => setShowNewLocationForm(false)}
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={createLocationAndAddToRoute}
                          disabled={!newLocation.description.trim() || submitting}
                          startIcon={submitting ? <CircularProgress size={16} /> : <AddLocation />}
                        >
                          {submitting ? 'Adding...' : 'Add Location'}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>

            {/* New Location Details (when creating location) */}
            {showNewLocationForm && (
              <Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  New Location Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Location Notes"
                      value={newLocation.notes}
                      onChange={(e) => setNewLocation({ ...newLocation, notes: e.target.value })}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Additional details about this location: accessibility, best approach, safety notes, typical gathering times..."
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Latitude (Optional)"
                      value={newLocation.latitude}
                      onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                      fullWidth
                      placeholder="e.g., 40.7829"
                      helperText="GPS coordinates if available"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Longitude (Optional)"
                      value={newLocation.longitude}
                      onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
                      fullWidth
                      placeholder="e.g., -73.9654"
                      helperText="GPS coordinates if available"
                    />
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 2 }}>
                  This location will be added to the current route "<strong>{route?.name}</strong>" and will be available for future runs.
                </Alert>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit() || submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : <Person />}
        >
          {submitting ? 'Creating...' : 'Take Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}