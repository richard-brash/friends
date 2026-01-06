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
  Snackbar
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
  Flag as FlagIcon
} from '@mui/icons-material';
import { API_BASE } from '../../config/api';
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
  const [mealsDelivered, setMealsDelivered] = useState(0);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [lastSync, setLastSync] = useState(new Date().toISOString());

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
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/v2/execution/${id}/execution`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch execution context');
      }

      const result = await response.json();
      setData(result.data);
      
      // Set initial meals delivered for current stop
      const currentStop = getCurrentStop(result.data);
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
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_BASE}/v2/execution/${id}/changes?since=${lastSync}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) return;

      const result = await response.json();
      const changes = result.data;

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
    try {
      await syncQueue.queueAction({
        type: 'ADVANCE_STOP',
        payload: { runId: parseInt(id) }
      });

      showSnackbar('Moving to next stop...', 'info');
      
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
  const currentStop = stops[currentStopIndex];
  const isFirstStop = currentStopIndex === 0;
  const isLastStop = currentStopIndex === stops.length - 1;

  if (!currentStop) {
    return (
      <Box p={3}>
        <Alert severity="warning">No current stop found</Alert>
      </Box>
    );
  }

  const pendingRequests = currentStop.requests.filter(r => r.status !== 'delivered' && r.status !== 'cancelled');
  const deliveredRequests = currentStop.requests.filter(r => r.status === 'delivered');

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
          <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
            <IconButton
              onClick={() => setMealsDelivered(Math.max(0, mealsDelivered - 1))}
              size="large"
              color="primary"
            >
              <Remove />
            </IconButton>
            <Typography variant="h3" sx={{ mx: 3 }}>
              {mealsDelivered}
            </Typography>
            <IconButton
              onClick={() => setMealsDelivered(mealsDelivered + 1)}
              size="large"
              color="primary"
            >
              <AddIcon />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Notes about this stop..."
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Button
            fullWidth
            variant="outlined"
            onClick={handleRecordDelivery}
            sx={{ mt: 2 }}
          >
            Save Delivery Count
          </Button>
        </CardContent>
      </Card>

      {/* Friends Expected */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Friends Expected ({currentStop.expectedFriends.length})
            </Typography>
            <Button
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={() => setShowFriendSearch(true)}
            >
              Spot Someone New
            </Button>
          </Box>

          {currentStop.expectedFriends.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No friends recently seen here
            </Typography>
          ) : (
            <List>
              {currentStop.expectedFriends.map((friend, index) => (
                <Box key={friend.id}>
                  <ListItem
                    secondaryAction={
                      friend.spotted ? (
                        <Chip icon={<CheckCircleIcon />} label="SPOTTED" color="success" size="small" />
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleSpotFriend(friend)}
                        >
                          SPOT
                        </Button>
                      )
                    }
                  >
                    <ListItemText
                      primary={friend.name}
                      secondary={`Last seen: ${new Date(friend.lastSeen).toLocaleDateString()}`}
                    />
                  </ListItem>
                  {index < currentStop.expectedFriends.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Delivery Requests */}
      {currentStop.requests.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Deliveries ({pendingRequests.length} pending)
            </Typography>

            {pendingRequests.length === 0 ? (
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
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <Box display="flex" gap={2}>
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
          disabled={isLastStop}
          endIcon={<ArrowForwardIcon />}
          fullWidth
        >
          NEXT STOP
        </Button>
      </Box>

      {isLastStop && (
        <Typography variant="caption" display="block" textAlign="center" mt={2} color="text.secondary">
          This is the last stop on the route
        </Typography>
      )}

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
