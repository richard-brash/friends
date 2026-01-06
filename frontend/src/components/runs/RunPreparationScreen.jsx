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
import { API_BASE_URL } from '../config/api';
import syncQueue from '../utils/offlineSync';

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
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/v2/execution/${id}/preparation`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preparation data');
      }

      const result = await response.json();
      setData(result.data);
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

  const handleStartRun = async () => {
    try {
      setStarting(true);

      // Queue the action (will sync immediately if online, or queue if offline)
      await syncQueue.queueAction({
        type: 'START_RUN',
        payload: { runId: parseInt(id) }
      });

      // Navigate to active run screen
      navigate(`/runs/${id}/active`);
    } catch (err) {
      setError(err.message);
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

      {/* Checklist */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Loading Checklist
          </Typography>
          <List>
            {/* Meals */}
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

            {/* Utensils */}
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
                secondary={`Forks, napkins (1 per meal)`}
              />
            </ListItem>

            {/* Requests */}
            <ListItem
              button
              onClick={() => handleChecklistToggle('requests')}
              sx={{
                bgcolor: checklist.requests ? 'action.selected' : 'transparent',
                borderRadius: 1
              }}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={checklist.requests}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemIcon>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText
                primary={`${supplies.requests} Delivery Requests`}
                secondary="Special items for friends"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Requests List */}
      {requests.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Requests to Deliver
              </Typography>
              <Chip label={`${requests.length} items`} size="small" />
            </Box>
            <List dense>
              {requests.map((request, index) => (
                <Box key={request.id}>
                  <ListItem>
                    <ListItemText
                      primary={`${request.itemName} for ${request.friendName}`}
                      secondary={`${request.category} • ${request.locationName} • Priority: ${request.priority}`}
                    />
                  </ListItem>
                  {index < requests.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

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
