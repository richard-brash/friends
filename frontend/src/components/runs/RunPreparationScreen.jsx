import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Checkbox,
  Chip,
  Paper
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Restaurant as RestaurantIcon,
  LocalDining as LocalDiningIcon,
  Assignment as AssignmentIcon,
  PlayArrow as PlayArrowIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../../config/api';
import syncQueue from '../../utils/offlineSync';

export default function RunPreparationScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [checklist, setChecklist] = useState({
    meals: false,
    utensils: false,
    requests: false
  });
  const [loadedRequests, setLoadedRequests] = useState(new Set());
  const [loadingRequestId, setLoadingRequestId] = useState(null);

  useEffect(() => {
    fetchPreparationData();
    initializeOfflineSync();
  }, [id]);

  const initializeOfflineSync = async () => {
    try {
      await syncQueue.init();
    } catch (error) {
      console.error('Failed to initialize offline sync:', error);
    }
  };

  const fetchPreparationData = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_BASE}/v2/execution/${id}/preparation`);
      setData(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistToggle = (item) => {
    setChecklist(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const handleToggleRequestLoaded = async (requestId) => {
    try {
      setLoadingRequestId(requestId);
      
      // Mark as taken (loaded onto vehicle)
      await axios.post(`${API_BASE}/v2/requests/${requestId}/status-history`, {
        status: 'taken',
        notes: 'Loaded onto vehicle'
      });

      // Update local state
      setLoadedRequests(prev => {
        const newSet = new Set(prev);
        newSet.add(requestId);
        return newSet;
      });

      // Check if all requests are now loaded
      if (data && loadedRequests.size + 1 >= data.requests.length) {
        setChecklist(prev => ({ ...prev, requests: true }));
      }
    } catch (err) {
      console.error('Error marking request as loaded:', err);
      setError('Failed to mark request as loaded');
    } finally {
      setLoadingRequestId(null);
    }
  };

  const handleStartRun = async () => {
    try {
      setStarting(true);

      // Start the run (wait for completion)
      await axios.post(`${API_BASE}/v2/execution/${id}/start`);

      // Navigate to active run screen
      navigate(`/runs/${id}/active`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setStarting(false);
    }
  };

  const allChecked = Object.values(checklist).every(v => v);

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

  const { run, requests, supplies, totalStops } = data;

  return (
    <Box p={{ xs: 2, sm: 3 }} maxWidth="md" mx="auto">
      {/* Header */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/runs')}
          sx={{ mb: 2 }}
        >
          Back to Runs
        </Button>
        <Typography variant="h4" gutterBottom>
          Loading Preparation
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {run.name}
        </Typography>
        <Box mt={1}>
          <Chip label={`${totalStops} Stops`} sx={{ mr: 1 }} />
          <Chip label={new Date(run.scheduledDate).toLocaleDateString()} />
        </Box>
      </Box>

      {/* Loading Checklist - Combined */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Loading Checklist
          </Typography>
          
          {/* Meals Section */}
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
            Meals
          </Typography>
          <List>
            <ListItem
              button
              onClick={() => handleChecklistToggle('meals')}
              sx={{
                bgcolor: checklist.meals ? 'action.selected' : 'transparent',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={checklist.meals}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemIcon>
                <RestaurantIcon />
              </ListItemIcon>
              <ListItemText
                primary={`${supplies.meals} Meals`}
                secondary="Hot meals ready for delivery"
              />
            </ListItem>

            <ListItem
              button
              onClick={() => handleChecklistToggle('utensils')}
              sx={{
                bgcolor: checklist.utensils ? 'action.selected' : 'transparent',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={checklist.utensils}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemIcon>
                <LocalDiningIcon />
              </ListItemIcon>
              <ListItemText
                primary={`${supplies.utensils} Utensil Sets`}
                secondary="Forks, napkins (1 per meal)"
              />
            </ListItem>
          </List>

          {/* Special Requests Section */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Special Requests
            </Typography>
            {requests.length > 0 && (
              <Chip 
                label={`${loadedRequests.size}/${requests.length} loaded`} 
                size="small"
                color={loadedRequests.size === requests.length ? 'success' : 'default'}
              />
            )}
          </Box>
          {requests.length === 0 ? (
            <Alert severity="info" sx={{ mb: 1 }}>
              No special requests for this run.
            </Alert>
          ) : (
            <List>
              {requests.map((request, index) => (
                <Box key={request.id}>
                  <ListItem
                    button
                    onClick={() => !loadedRequests.has(request.id) && handleToggleRequestLoaded(request.id)}
                    disabled={loadedRequests.has(request.id) || loadingRequestId === request.id}
                    sx={{
                      bgcolor: loadedRequests.has(request.id) ? 'action.selected' : 'transparent',
                      borderRadius: 1,
                      mb: index < requests.length - 1 ? 1 : 0
                    }}
                  >
                    <ListItemIcon>
                      {loadingRequestId === request.id ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Checkbox
                          edge="start"
                          checked={loadedRequests.has(request.id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      )}
                    </ListItemIcon>
                    <ListItemIcon>
                      <AssignmentIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${request.itemName} for ${request.friendName}`}
                      secondary={`${request.category} • ${request.locationName} • Priority: ${request.priority}`}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {run.notes && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light' }}>
          <Typography variant="subtitle2" gutterBottom>
            Run Notes:
          </Typography>
          <Typography variant="body2">
            {run.notes}
          </Typography>
        </Paper>
      )}

      {/* Info Alert */}
      {!allChecked && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Check off each item as you load it into the vehicle. Once everything is loaded, tap "Start Run" to begin delivery.
        </Alert>
      )}

      {/* Start Button */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleStartRun}
        disabled={!allChecked || starting}
        startIcon={starting ? <CircularProgress size={20} /> : <PlayArrowIcon />}
        sx={{ py: 2 }}
      >
        {starting ? 'Starting Run...' : 'Start Run'}
      </Button>

      {!allChecked && (
        <Typography variant="caption" display="block" textAlign="center" mt={2} color="text.secondary">
          Complete all checklist items to start the run
        </Typography>
      )}
    </Box>
  );
}
