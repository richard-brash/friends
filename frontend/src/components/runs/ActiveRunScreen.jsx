import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Restaurant as RestaurantIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  PersonAdd as PersonAddIcon,
  Map as MapIcon,
  Flag as FlagIcon,
  Assignment as Assignment,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../../config/api';
import { DEFAULT_CATEGORIES } from '../SettingsPage';
import syncQueue from '../../utils/offlineSync';

export default function ActiveRunScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pollingInterval = useRef(null);

  // State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ pending: 0, syncing: false });
  const [mealsDelivered, setMealsDelivered] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [newFriendPhone, setNewFriendPhone] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [prePopulatedFriend, setPrePopulatedFriend] = useState(null); // Track pre-populated friend
  const [newRequest, setNewRequest] = useState({
    friendId: '',
    category: DEFAULT_CATEGORIES[0].id,
    itemName: '',
    description: '',
    quantity: 1,
    priority: 'medium'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [lastSync, setLastSync] = useState(new Date().toISOString());
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);

  useEffect(() => {
    initializeScreen();
    startPolling();

    return () => stopPolling();
  }, [id]);

  const initializeScreen = async () => {
    await syncQueue.init();
    
    // Subscribe to sync events
    const unsubscribe = syncQueue.subscribe(handleSyncEvent);
    
    await fetchExecutionContext();
    
    return unsubscribe;
  };

  const handleSyncEvent = (event) => {
    if (event.type === 'syncStart') {
      setSyncStatus(prev => ({ ...prev, syncing: true }));
    } else if (event.type === 'syncEnd') {
      setSyncStatus({ syncing: false, pending: event.remaining });
    } else if (event.type === 'synced') {
      showSnackbar('Action synced successfully', 'success');
      // Refresh data after successful sync
      fetchExecutionContext();
    } else if (event.type === 'syncError') {
      showSnackbar('Sync failed - will retry', 'warning');
    }
  };

  const fetchExecutionContext = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_BASE}/v2/execution/${id}`);
      const ctx = response.data.data;
      setData(ctx);
      
      // Set initial meals delivered for current stop
      const currentStop = getCurrentStop(ctx);
      if (currentStop?.delivery) {
        setMealsDelivered(currentStop.delivery.mealsDelivered);
        setDeliveryNotes(currentStop.delivery.notes || '');
      } else {
        setMealsDelivered(0);
        setDeliveryNotes('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    // Poll for changes every 20 seconds
    pollingInterval.current = setInterval(async () => {
      await pollForChanges();
    }, 20000);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const pollForChanges = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/v2/execution/${id}/changes?since=${lastSync}`
      );

      const changes = response.data.data;

      // Merge changes into current data
      if (changes.run || changes.updatedRequests.length > 0 || changes.recentSpottings.length > 0) {
        await fetchExecutionContext(); // Full refresh for now
        setLastSync(changes.timestamp);
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  const getCurrentStop = (contextData = data) => {
    if (!contextData) return null;
    const { stops, currentStopIndex } = contextData;
    return stops[currentStopIndex] || null;
  };

  const handleAdvanceStop = async () => {
    const currentStop = getCurrentStop();
    if (!currentStop || mealsDelivered === null) return;

    try {
      // Save delivery count before advancing
      await syncQueue.queueAction({
        type: 'RECORD_DELIVERY',
        payload: {
          runId: parseInt(id),
          locationId: currentStop.id,
          mealsDelivered,
          notes: deliveryNotes
        }
      });

      await syncQueue.queueAction({
        type: 'ADVANCE_STOP',
        payload: { runId: parseInt(id) }
      });

      showSnackbar('Moving to next stop...', 'info');
      
      // Reset meals counter for next stop
      setMealsDelivered(null);
      setDeliveryNotes('');
      
      // Optimistically update UI
      setData(prev => ({
        ...prev,
        currentStopIndex: Math.min(prev.currentStopIndex + 1, prev.stops.length - 1)
      }));
    } catch (err) {
      showSnackbar('Failed to advance stop', 'error');
    }
  };

  const handlePreviousStop = async () => {
    try {
      await syncQueue.queueAction({
        type: 'PREVIOUS_STOP',
        payload: { runId: parseInt(id) }
      });

      showSnackbar('Returning to previous stop...', 'info');
      
      // Optimistically update UI
      setData(prev => ({
        ...prev,
        currentStopIndex: Math.max(prev.currentStopIndex - 1, 0)
      }));
    } catch (err) {
      showSnackbar('Failed to go back', 'error');
    }
  };

  const handleRecordDelivery = async () => {
    const currentStop = getCurrentStop();
    if (!currentStop) return;

    try {
      await syncQueue.queueAction({
        type: 'RECORD_DELIVERY',
        payload: {
          runId: parseInt(id),
          locationId: currentStop.id,
          mealsDelivered,
          notes: deliveryNotes
        }
      });

      showSnackbar('Delivery recorded', 'success');
    } catch (err) {
      showSnackbar('Failed to record delivery', 'error');
    }
  };

  const handleSpotFriend = async (friend) => {
    const currentStop = getCurrentStop();
    if (!currentStop) return;

    try {
      await syncQueue.queueAction({
        type: 'SPOT_FRIEND',
        payload: {
          runId: parseInt(id),
          friendId: friend.id,
          locationId: currentStop.id,
          notes: ''
        }
      });

      showSnackbar(`${friend.name} marked as spotted`, 'success');
      
      // Optimistically update UI
      setData(prev => {
        const newStops = [...prev.stops];
        const stopIndex = prev.currentStopIndex;
        const updatedStop = { ...newStops[stopIndex] };
        const friendIndex = updatedStop.expectedFriends.findIndex(f => f.id === friend.id);
        
        if (friendIndex >= 0) {
          updatedStop.expectedFriends[friendIndex] = {
            ...updatedStop.expectedFriends[friendIndex],
            spotted: true
          };
        }
        
        newStops[stopIndex] = updatedStop;
        return { ...prev, stops: newStops };
      });
    } catch (err) {
      showSnackbar('Failed to record spotting', 'error');
    }
  };

  const handleRequestForFriend = (friend) => {
    const currentStop = getCurrentStop();
    if (!currentStop) return;

    // Pre-populate the request form with friend and location
    setNewRequest({
      friendId: friend.id,
      category: 'food',
      itemName: '',
      description: '',
      quantity: 1,
      priority: 'medium'
    });
    setPrePopulatedFriend(friend); // Set the pre-populated friend
    setShowRequestDialog(true);
  };

  const searchFriends = async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await axios.get(`${API_BASE}/v2/friends`, {
        params: { search: query.trim() }
      });
      
      const results = response.data.data || [];
      setSearchResults(results);
    } catch (err) {
      console.error('Friend search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSpotExistingFriend = async (friend) => {
    await handleSpotFriend(friend);
    handleCloseSpotDialog();
  };

  const handleSpotNewFriend = async () => {
    const currentStop = getCurrentStop();
    if (!currentStop || !friendSearchQuery.trim()) return;

    try {
      // Create new friend
      const friendResponse = await axios.post(`${API_BASE}/v2/friends`, {
        name: friendSearchQuery.trim(),
        phone: newFriendPhone.trim() || null,
        status: 'active'
      });

      const newFriend = friendResponse.data.data;

      // Spot the new friend (adds location history)
      await handleSpotFriend(newFriend);

      showSnackbar(`New friend ${newFriend.name} added and spotted`, 'success');
      handleCloseSpotDialog();
    } catch (err) {
      console.error('Error adding new friend:', err);
      showSnackbar('Failed to add new friend', 'error');
    }
  };

  const handleCloseSpotDialog = () => {
    setShowFriendSearch(false);
    setFriendSearchQuery('');
    setSearchResults([]);
    setNewFriendPhone('');
  };

  const handleAddRequest = async () => {
    const currentStop = getCurrentStop();
    if (!currentStop) return;

    try {
      await axios.post(`${API_BASE}/v2/requests`, {
        friendId: parseInt(newRequest.friendId),
        locationId: currentStop.id,
        runId: parseInt(id),
        category: newRequest.category,
        itemName: newRequest.itemName,
        description: newRequest.description,
        quantity: parseInt(newRequest.quantity),
        priority: newRequest.priority,
        status: 'pending'
      });

      showSnackbar('Request added successfully', 'success');
      setShowRequestDialog(false);
      setPrePopulatedFriend(null);
      setNewRequest({
        friendId: '',
        category: DEFAULT_CATEGORIES[0].id,
        itemName: '',
        description: '',
        quantity: 1,
        priority: 'medium'
      });
      fetchExecutionContext(); // Refresh to show new requests
    } catch (err) {
      console.error('Error adding request:', err);
      showSnackbar('Failed to add request', 'error');
    }
  };

  const handleMarkDelivered = async (request) => {
    try {
      await syncQueue.queueAction({
        type: 'MARK_DELIVERED',
        payload: {
          requestId: request.id,
          notes: ''
        }
      });

      showSnackbar(`${request.itemName} marked as delivered`, 'success');
      
      // Optimistically update UI
      setData(prev => {
        const newStops = [...prev.stops];
        const stopIndex = prev.currentStopIndex;
        const updatedStop = { ...newStops[stopIndex] };
        updatedStop.requests = updatedStop.requests.map(r =>
          r.id === request.id ? { ...r, status: 'delivered' } : r
        );
        newStops[stopIndex] = updatedStop;
        return { ...prev, stops: newStops };
      });
    } catch (err) {
      showSnackbar('Failed to mark as delivered', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/runs')} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to Runs
        </Button>
      </Box>
    );
  }

  if (!data) return null;

  const { run, stops, currentStopIndex } = data;
  
  // If run hasn't been started yet, redirect to preparation
  if (run.status === 'scheduled') {
    return (
      <Box p={3} maxWidth="md" mx="auto">
        <Alert severity="info" sx={{ mb: 2 }}>
          This run hasn't been started yet. Please go through the preparation checklist first.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate(`/runs/${id}/prepare`)}
        >
          Go to Preparation
        </Button>
      </Box>
    );
  }

  const currentStop = stops[currentStopIndex];
  const isFirstStop = currentStopIndex === 0;
  const isLastStop = currentStopIndex === stops.length - 1;

  if (!currentStop) {
    return (
      <Box p={3}>
        <Alert severity="warning">No current stop found. Current stop index: {currentStopIndex}, Total stops: {stops.length}</Alert>
        <Button variant="outlined" onClick={() => navigate(`/runs/${id}`)} sx={{ mt: 2 }}>
          Back to Run Details
        </Button>
      </Box>
    );
  }

  const pendingRequests = currentStop.requests.filter(r => r.status !== 'delivered' && r.status !== 'cancelled');
  const deliveredRequests = currentStop.requests.filter(r => r.status === 'delivered');

  // Get all requests across all stops (for seeing what's on the vehicle)
  const allStopRequests = data?.stops.flatMap(stop => stop.requests) || [];
  const otherLocationRequests = allStopRequests.filter(r => 
    r.locationId !== currentStop.id && 
    r.status !== 'delivered' && 
    r.status !== 'cancelled'
  );

  return (
    <Box p={{ xs: 2, sm: 3 }} maxWidth="md" mx="auto">
      {/* Header */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/runs')}
          sx={{ mb: 2 }}
        >
          End Run
        </Button>
        
        {/* Sync Status */}
        {(syncStatus.pending > 0 || syncStatus.syncing) && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {syncStatus.syncing ? 'Syncing...' : `${syncStatus.pending} actions pending sync`}
          </Alert>
        )}

        {/* Stop Progress */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Stop {currentStopIndex + 1} of {stops.length}
          </Typography>
          <Chip
            icon={<FlagIcon />}
            label={run.status}
            color={run.status === 'in_progress' ? 'primary' : 'default'}
          />
        </Box>

        {/* Location Info */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
              <Box>
                <Typography variant="h6">{currentStop.name}</Typography>
                {currentStop.address && (
                  <Typography variant="body2" color="text.secondary">
                    {currentStop.address}
                  </Typography>
                )}
              </Box>
              {currentStop.coordinates && (
                <IconButton
                  size="small"
                  onClick={() => window.open(
                    `https://maps.google.com/?q=${currentStop.coordinates.lat},${currentStop.coordinates.lng}`,
                    '_blank'
                  )}
                >
                  <MapIcon />
                </IconButton>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Meal Counter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Meals Delivered at This Stop
          </Typography>
          <TextField
            fullWidth
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter number of meals (0 if none)"
            value={mealsDelivered === null ? '' : mealsDelivered}
            onChange={(e) => {
              const val = e.target.value;
              setMealsDelivered(val === '' ? null : Math.max(0, parseInt(val) || 0));
            }}
            inputProps={{
              min: 0,
              style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }
            }}
            sx={{ mt: 2, mb: 2 }}
          />
          
          <Box display="flex" gap={2} mb={2}>
            <Button
              variant="outlined"
              onClick={handlePreviousStop}
              disabled={isFirstStop}
              startIcon={<ArrowBackIcon />}
              fullWidth
            >
              PREV
            </Button>
            <Button
              variant="contained"
              onClick={handleAdvanceStop}
              disabled={isLastStop || mealsDelivered === null}
              endIcon={<ArrowForwardIcon />}
              fullWidth
            >
              NEXT STOP
            </Button>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => setShowNotesDialog(true)}
          >
            Take Note
          </Button>

          {isLastStop && (
            <Typography variant="caption" display="block" textAlign="center" mt={2} color="text.secondary">
              This is the last stop on the route
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Delivery Requests */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Deliveries ({pendingRequests.length} pending)
          </Typography>

          {currentStop.requests.length === 0 ? (
            <Alert severity="info">No requests assigned to this location. Use REQUEST ITEM button to add one.</Alert>
          ) : pendingRequests.length === 0 ? (
            <Alert severity="success">All deliveries completed at this stop!</Alert>
          ) : (
              <List>
                {pendingRequests.map((request, index) => (
                  <Box key={request.id}>
                    <ListItem
                      secondaryAction={
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleMarkDelivered(request)}
                          startIcon={<CheckCircleIcon />}
                        >
                          DELIVERED
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={`${request.itemName} for ${request.friendName}`}
                        secondary={`${request.category} • Priority: ${request.priority}`}
                      />
                    </ListItem>
                    {index < pendingRequests.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}

          {deliveredRequests.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Completed ({deliveredRequests.length})
              </Typography>
              <List dense>
                {deliveredRequests.map(request => (
                  <ListItem key={request.id}>
                    <ListItemText
                      primary={`✓ ${request.itemName} for ${request.friendName}`}
                      sx={{ textDecoration: 'line-through', opacity: 0.6 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Other Requests on Vehicle */}
          {otherLocationRequests.length > 0 && (
            <Box mt={3} pt={2} borderTop={1} borderColor="divider">
              <Button
                fullWidth
                variant="text"
                onClick={() => setShowAllRequests(!showAllRequests)}
                endIcon={showAllRequests ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ mb: 1 }}
              >
                Other Requests on Vehicle ({otherLocationRequests.length})
              </Button>
              {showAllRequests && (
                <List dense>
                  {otherLocationRequests.map((request, index) => (
                    <Box key={request.id}>
                      <ListItem
                        secondaryAction={
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleMarkDelivered(request)}
                            startIcon={<CheckCircleIcon />}
                          >
                            DELIVERED
                          </Button>
                        }
                      >
                        <ListItemText
                          primary={`${request.itemName} for ${request.friendName}`}
                          secondary={`${request.category} • ${request.locationName || 'Unknown location'} • Priority: ${request.priority}`}
                        />
                      </ListItem>
                      {index < otherLocationRequests.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Friends Expected */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Friends Expected ({currentStop.expectedFriends.length})
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Assignment />}
                onClick={() => setShowRequestDialog(true)}
              >
                REQUEST ITEM
              </Button>
              <Button
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={() => setShowFriendSearch(true)}
              >
                SPOT A FRIEND
              </Button>
            </Box>
          </Box>

          {currentStop.expectedFriends.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No friends recently seen here
            </Typography>
          ) : (
            <List>
              {currentStop.expectedFriends.map((friend, index) => {
                // Check if there's a request for this friend in all requests
                const hasRequest = allStopRequests.some(r => 
                  (r.friendId === friend.id || r.friend_id === friend.id) && 
                  r.status === 'taken'
                );
                
                return (
                  <Box key={friend.id}>
                    <ListItem
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Assignment />}
                            onClick={() => handleRequestForFriend(friend)}
                          >
                            REQUEST
                          </Button>
                          {friend.spotted ? (
                            <Chip icon={<CheckCircleIcon />} label="SPOTTED" color="success" size="small" />
                          ) : (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleSpotFriend(friend)}
                            >
                              SPOT
                            </Button>
                          )}
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {friend.name}
                            {hasRequest && (
                              <Chip 
                                icon={<LocalShippingIcon />} 
                                label="Has Request" 
                                size="small" 
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={`Last seen: ${new Date(friend.lastSeen).toLocaleDateString()}`}
                      />
                    </ListItem>
                    {index < currentStop.expectedFriends.length - 1 && <Divider />}
                  </Box>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Request Item Dialog */}
      <Dialog open={showRequestDialog} onClose={() => {
        setShowRequestDialog(false);
        setFriendSearchQuery('');
        setSearchResults([]);
        setNewFriendPhone('');
        setPrePopulatedFriend(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Request Item for Friend</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              {prePopulatedFriend ? (
                // Scenario 3: Show pre-populated friend info (from friend list)
                <Alert severity="info">
                  <Typography variant="body2" fontWeight="bold">
                    Friend: {prePopulatedFriend.name}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Location: {currentStop?.name}
                  </Typography>
                </Alert>
              ) : (
                // Scenario 2: Friend search mode (from top button)
                <>
                  <TextField
                    autoFocus
                    fullWidth
                    label="Friend Name"
                    value={friendSearchQuery}
                    onChange={(e) => {
                      setFriendSearchQuery(e.target.value);
                      searchFriends(e.target.value);
                    }}
                    placeholder="Start typing to search..."
                    helperText="Location will be set to current stop"
                  />

                  {searchLoading && (
                    <Box display="flex" justifyContent="center" p={2}>
                      <CircularProgress size={24} />
                    </Box>
                  )}

                  {!searchLoading && searchResults.length > 0 && (
                    <Paper elevation={2} sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                      <List>
                        {searchResults.map((friend) => (
                          <ListItem
                            key={friend.id}
                            button
                            onClick={() => {
                              setNewRequest({ ...newRequest, friendId: friend.id });
                              setFriendSearchQuery('');
                              setSearchResults([]);
                            }}
                          >
                            <ListItemText
                              primary={friend.name}
                              secondary={
                                <>
                                  {friend.phone && `${friend.phone} • `}
                                  {friend.locationName ? `Last seen: ${friend.locationName}` : 'No location'}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}

                  {!searchLoading && friendSearchQuery.trim().length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        {searchResults.length > 0 ? 'Or add as new friend:' : 'Add as new friend:'}
                      </Typography>
                      <TextField
                        fullWidth
                        label="Phone Number (optional)"
                        value={newFriendPhone}
                        onChange={(e) => setNewFriendPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        sx={{ mb: 1 }}
                      />
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={async () => {
                          try {
                            const response = await axios.post(`${API_BASE}/v2/friends`, {
                              name: friendSearchQuery.trim(),
                              phone: newFriendPhone.trim() || null,
                              locationId: null
                            });
                            const newFriend = response.data?.data || response.data?.friend;
                            setNewRequest({ ...newRequest, friendId: newFriend.id });
                            setFriendSearchQuery('');
                            setNewFriendPhone('');
                            setSearchResults([]);
                            showSnackbar('Friend added successfully', 'success');
                          } catch (err) {
                            showSnackbar('Failed to add friend', 'error');
                          }
                        }}
                      >
                        Add "{friendSearchQuery}" as New Friend
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newRequest.category}
                  label="Category"
                  onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                >
                  {DEFAULT_CATEGORIES.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Item Name"
                value={newRequest.itemName}
                onChange={(e) => setNewRequest({ ...newRequest, itemName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={newRequest.quantity}
                onChange={(e) => setNewRequest({ ...newRequest, quantity: e.target.value })}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newRequest.priority}
                  label="Priority"
                  onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowRequestDialog(false);
            setFriendSearchQuery('');
            setSearchResults([]);
            setNewFriendPhone('');
            setPrePopulatedFriend(null);
          }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddRequest}
            disabled={!newRequest.friendId || !newRequest.itemName}
          >
            Add Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Spot Friend Dialog */}
      <Dialog open={showFriendSearch} onClose={handleCloseSpotDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Spot a Friend</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Friend Name"
            value={friendSearchQuery}
            onChange={(e) => {
              setFriendSearchQuery(e.target.value);
              searchFriends(e.target.value);
            }}
            placeholder="Start typing to search..."
            sx={{ mt: 2, mb: 2 }}
          />

          {searchLoading && (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Found {searchResults.length} existing friend{searchResults.length !== 1 ? 's' : ''}:
              </Typography>
              <List>
                {searchResults.map((friend) => (
                  <ListItem
                    key={friend.id}
                    button
                    onClick={() => handleSpotExistingFriend(friend)}
                    sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}
                  >
                    <ListItemText
                      primary={friend.name}
                      secondary={
                        <>
                          {friend.nickname && `"${friend.nickname}" • `}
                          {friend.phone || 'No phone'}
                          {friend.locationName && ` • Last seen: ${friend.locationName}`}
                        </>
                      }
                    />
                    <Button variant="contained" size="small">
                      SPOT HERE
                    </Button>
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}

          {!searchLoading && friendSearchQuery.trim().length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                {searchResults.length > 0 ? 'Or add as new friend:' : 'Add as new friend:'}
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                This will create a new friend named "{friendSearchQuery}" and spot them at this location.
              </Alert>
              <TextField
                fullWidth
                label="Phone Number (optional)"
                value={newFriendPhone}
                onChange={(e) => setNewFriendPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSpotDialog}>Cancel</Button>
          {friendSearchQuery.trim().length > 0 && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSpotNewFriend}
              startIcon={<PersonAddIcon />}
            >
              ADD NEW & SPOT
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Take Note Dialog */}
      <Dialog open={showNotesDialog} onClose={() => setShowNotesDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note for This Stop</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Notes about this stop..."
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            autoFocus
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotesDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowNotesDialog(false);
              showSnackbar('Note saved', 'success');
            }}
          >
            Save Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
