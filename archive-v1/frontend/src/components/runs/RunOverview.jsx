import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Grid,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Badge,
  useMediaQuery,
  useTheme,
  Collapse,
  Select,
  MenuItem
} from '@mui/material';
import {
  Person,
  LocationOn,
  Schedule,
  RestaurantMenu,
  PlayArrow,
  CheckCircle,
  Cancel,
  Edit,
  Group,
  NavigateNext,
  NavigateBefore,
  ExpandMore,
  ExpandLess,
  Flag,
  PersonAdd,
  Start,
  Stop,
  LocalShipping,
  ThumbDown,
  Handshake,
  AddLocation,
  ArrowBack,
  Close,
  CalendarToday,
  Delete
} from '@mui/icons-material';
import { format } from 'date-fns';
import ManageTeamDialog from './ManageTeamDialog';
import TakeRequestDialog from './TakeRequestDialog';
import LocationsList from '../locations/LocationsList';
import axios from 'axios';
import { API_BASE } from '../../config/api.js';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';

export default function RunOverview({ runId, onEdit, onBack }) {
  const { user } = useAuth();
  const permissions = usePermissions();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [run, setRun] = useState(null);
  const [route, setRoute] = useState(null);
  const [routes, setRoutes] = useState([]); // All routes for moving locations
  const [locations, setLocations] = useState([]); // Route's locations only
  const [allLocations, setAllLocations] = useState([]); // All locations for lookups
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showManageTeam, setShowManageTeam] = useState(false);
  const [showTakeRequest, setShowTakeRequest] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deliveryOutcome, setDeliveryOutcome] = useState('delivered'); // 'delivered' or 'not_available'
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [teamExpanded, setTeamExpanded] = useState(false); // Collapsible team section
  const [editingRun, setEditingRun] = useState(false); // Inline run editing mode
  const [editForm, setEditForm] = useState({ mealCount: 0, notes: '', scheduledDate: '' });
  const [editingTeam, setEditingTeam] = useState(false); // Inline team editing mode
  const [newTeamMember, setNewTeamMember] = useState(''); // Selected user ID for adding

  useEffect(() => {
    if (runId) {
      fetchRunDetails();
    }
  }, [runId]);

  const fetchRunDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch run data and related information (include team members with query param)
      const [runRes, routesRes, locationsRes, requestsRes, friendsRes] = await Promise.all([
        axios.get(`${API_BASE}/v2/runs/${runId}?includeTeam=true`),
        axios.get(`${API_BASE}/v2/routes`),
        axios.get(`${API_BASE}/v2/locations`),
        axios.get(`${API_BASE}/v2/requests`),
        axios.get(`${API_BASE}/v2/friends`)
      ]);

      const runData = runRes.data;
      const routesData = routesRes.data;
      const locationsData = locationsRes.data;
      const requestsData = requestsRes.data;
      const friendsData = friendsRes.data;

      // Try to fetch users (only available to admins/coordinators)
      let usersData = { users: [] };
      try {
        const usersRes = await axios.get(`${API_BASE}/users`);
        usersData = usersRes.data;
      } catch (userErr) {
        console.log('Cannot fetch users (insufficient permissions)');
      }

      // V2 API returns data directly with team members included (via ?includeTeam=true)
      const run = runData.data || runData.run;
      const routes = routesData.data || routesData.routes;
      const locations = locationsData.data || locationsData.locations;
      const requests = requestsData.data || requestsData.requests;
      const friends = friendsData.data || friendsData.friends;
      
      if (run) {
        // Team members are already included in the run object from ?includeTeam=true
        setRun(run);
        const routeInfo = routes?.find(r => r.id.toString() === run.routeId.toString());
        setRoute(routeInfo);
        setRoutes(routes); // Store all routes for location management
        
        // Store all locations for lookups
        setAllLocations(locations);
        
        // Filter locations to only include those assigned to this route
        // Locations have a route_id foreign key pointing to their route
        // IMPORTANT: Order by route_order for proper sequence during runs
        const routeLocations = locations
          .filter(loc => loc.routeId?.toString() === run.routeId.toString())
          .sort((a, b) => (a.routeOrder || 0) - (b.routeOrder || 0));
        
        setLocations(routeLocations);
        
        setUsers(usersData.users || []);
        setRequests(requests);
        setFriends(friends);
      } else {
        setError('Run not found');
      }
    } catch (err) {
      setError('Failed to load run details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lightweight refresh for just locations (no page reset/scroll)
  const refreshLocations = async () => {
    try {
      const locationsRes = await axios.get(`${API_BASE}/v2/locations`);
      const locationsData = locationsRes.data;
      const locations = locationsData.data || locationsData.locations;
      
      // Filter and sort for this route only
      if (run) {
        const routeLocations = locations
          .filter(loc => loc.routeId?.toString() === run.routeId.toString())
          .sort((a, b) => (a.routeOrder || 0) - (b.routeOrder || 0));
        
        setLocations(routeLocations);
      }
    } catch (err) {
      console.error('Failed to refresh locations:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Schedule />;
      case 'in_progress': return <PlayArrow />;
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      default: return <Schedule />;
    }
  };

  const getUserById = (id) => {
    if (!id) return null;
    const user = users.find(u => u.id.toString() === id.toString());
    return user || { id, name: `User ${id}`, email: '' }; // Fallback for volunteers
  };
  
  // Run schema has created_by and team members, not leadId/coordinatorId/assignedUserIds
  const createdBy = getUserById(run?.createdBy);
  const teamMembers = run?.team || [];
  
  // For backward compatibility, treat createdBy as the lead/coordinator
  const lead = createdBy;
  const coordinator = createdBy;
  const assignedUsers = teamMembers.map(member => getUserById(member.userId)).filter(Boolean) || [];

  const nextLocationIndex = run?.currentLocationIndex || 0;
  const nextLocation = locations[nextLocationIndex];
  const completedLocations = locations.slice(0, nextLocationIndex);
  const upcomingLocations = locations.slice(nextLocationIndex + 1);

  const handleLocationNavigation = async (direction) => {
    const newIndex = direction === 'next' ? nextLocationIndex + 1 : nextLocationIndex - 1;
    if (newIndex < 0 || newIndex >= locations.length) return;

    try {
      await axios.put(`${API_BASE}/v2/runs/${runId}`, {
        currentLocationIndex: newIndex
      });
      await fetchRunDetails();
    } catch (err) {
      setError('Failed to update location: ' + err.message);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      console.log('Updating run status to:', newStatus);
      const updates = { status: newStatus };
      
      if (newStatus === 'completed') {
        updates.completedAt = new Date().toISOString();
        updates.currentLocationIndex = locations.length;
      } else if (newStatus === 'in_progress') {
        updates.currentLocationIndex = 0;
      }

      const response = await axios.put(`${API_BASE}/v2/runs/${runId}`, updates);
      
      console.log('Status update successful');
      await fetchRunDetails();
    } catch (err) {
      console.error('Status update error:', err);
      setError('Failed to update status: ' + err.message);
    }
  };

  const handleRequestTaken = (request, friend) => {
    // Could show a success message or refresh data here
    console.log('Request taken successfully:', request, 'for friend:', friend);
    // Refresh the data to show the new request
    fetchRunDetails();
  };

  const handleDeliveryClick = (request, outcome) => {
    setSelectedRequest(request);
    setDeliveryOutcome(outcome);
    setDeliveryNotes('');
    setShowDeliveryDialog(true);
  };

  const handleEditRun = () => {
    // Convert ISO date to YYYY-MM-DD format for date input
    const dateOnly = run.scheduledDate ? run.scheduledDate.split('T')[0] : '';
    setEditForm({
      mealCount: run.mealCount || 0,
      notes: run.notes || '',
      scheduledDate: dateOnly
    });
    setEditingRun(true);
  };

  const handleSaveRunEdit = async () => {
    try {
      // Parse meal count as integer before sending
      const updateData = {
        ...editForm,
        mealCount: parseInt(editForm.mealCount) || 0
      };
      await axios.put(`${API_BASE}/v2/runs/${runId}`, updateData);
      await fetchRunDetails();
      setEditingRun(false);
    } catch (err) {
      setError('Failed to update run: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingRun(false);
    setEditForm({ mealCount: 0, notes: '', scheduledDate: '' });
  };

  // Team Management Functions
  const refreshTeamMembers = async () => {
    try {
      const runRes = await axios.get(`${API_BASE}/v2/runs/${runId}?includeTeam=true`);
      // V2 API wraps response in { success: true, data: {...} }
      const runData = runRes.data.data || runRes.data;
      setRun(prevRun => ({
        ...prevRun,
        team: runData.team || []
      }));
    } catch (err) {
      setError('Failed to refresh team members: ' + err.message);
    }
  };

  const handleAddTeamMember = async (userId) => {
    if (!userId) return;
    
    try {
      await axios.post(`${API_BASE}/v2/runs/${runId}/team-members`, {
        userId: parseInt(userId)
      });
      setNewTeamMember('');
      await refreshTeamMembers(); // Use lightweight refresh instead of fetchRunDetails
    } catch (err) {
      setError('Failed to add team member: ' + err.message);
    }
  };

  const handleRemoveTeamMember = async (userId) => {
    try {
      await axios.delete(`${API_BASE}/v2/runs/${runId}/team-members/${userId}`);
      await refreshTeamMembers(); // Use lightweight refresh instead of fetchRunDetails
    } catch (err) {
      setError('Failed to remove team member: ' + err.message);
    }
  };

  const handleToggleTeamEdit = () => {
    setEditingTeam(!editingTeam);
    setNewTeamMember('');
  };

  const handleDeliveryConfirm = async () => {
    if (!selectedRequest) return;
    
    try {
      if (deliveryOutcome === 'delivered') {
        // Add status history entry with 'delivered' status
        // This will automatically update the request status to 'delivered'
        await axios.post(`${API_BASE}/v2/requests/${selectedRequest.id}/status-history`, {
          status: 'delivered',
          notes: deliveryNotes || 'Successfully delivered during run',
          user_id: user?.id
        });
      } else {
        // Add status history entry with 'delivery_attempt_failed' status
        // This logs the attempt but keeps request as 'ready_for_delivery'
        await axios.post(`${API_BASE}/v2/requests/${selectedRequest.id}/status-history`, {
          status: 'delivery_attempt_failed',
          notes: deliveryNotes || 'Person not available during run',
          user_id: user?.id
        });
      }
      
      // Close dialog and refresh data
      setShowDeliveryDialog(false);
      setSelectedRequest(null);
      setDeliveryNotes('');
      await fetchRunDetails();
    } catch (err) {
      console.error('Failed to update delivery status:', err);
      setError('Failed to update delivery status: ' + err.message);
    }
  };

  // Helper functions for request data
  const getFriendById = (id) => {
    if (!id) return null;
    return friends.find(f => f?.id?.toString() === id.toString());
  };
  const getLocationById = (id) => {
    if (!id) return null;
    // Use allLocations for lookups to display location names for any request
    return allLocations.find(l => l?.id?.toString() === id.toString());
  };

  // Delivery Attempt Chip with Tooltip Component
  const DeliveryAttemptChipWithTooltip = ({ request }) => {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchAttempts = async () => {
        try {
          const response = await axios.get(`${API_BASE}/v2/requests/${request.id}/delivery-attempts`);
          const data = response.data;
          setAttempts(data.deliveryAttempts || []);
        } catch (error) {
          console.error('Error fetching delivery attempts:', error);
          setAttempts([]);
        } finally {
          setLoading(false);
        }
      };

      fetchAttempts();
    }, [request.id]);

    if (request.deliveryAttempts === 0 || !request.deliveryAttempts) {
      return null;
    }

    if (loading) {
      return (
        <Chip 
          size="small" 
          label="Loading..."
          color="default"
          variant="outlined"
        />
      );
    }

    const tooltipContent = (
      <Box sx={{ maxWidth: 320, p: 1 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 1.5, 
            color: 'common.white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            pb: 0.5
          }}
        >
          Delivery History ({attempts.length} attempt{attempts.length !== 1 ? 's' : ''})
        </Typography>
        {attempts.map((attempt, index) => (
          <Box 
            key={attempt.id} 
            sx={{ 
              mb: index < attempts.length - 1 ? 1.5 : 0,
              p: 1,
              borderRadius: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: attempt.outcome === 'delivered' ? '#4caf50' : '#ff9800',
                  mr: 1,
                  flexShrink: 0
                }}
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'medium',
                  color: 'common.white',
                  fontSize: '0.75rem'
                }}
              >
                {format(new Date(attempt.attemptDate), 'MMM dd, yyyy h:mm a')}
              </Typography>
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: attempt.outcome === 'delivered' ? '#81c784' : '#ffb74d',
                fontWeight: 'medium',
                fontSize: '0.7rem'
              }}
            >
              {attempt.outcome === 'delivered' ? 'Delivered Successfully' : 'Delivery Attempted'}
            </Typography>
            {attempt.notes && (
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontStyle: 'italic',
                  mt: 0.5,
                  fontSize: '0.65rem'
                }}
              >
                "{attempt.notes}"
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    );

    return (
      <Tooltip title={tooltipContent} placement="top" arrow>
        <Chip 
          size="small" 
          label={`${request.deliveryAttempts} attempt${request.deliveryAttempts > 1 ? 's' : ''}`}
          color="warning"
          variant="outlined"
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>
    );
  };

  // Get route location IDs for filtering (from the filtered locations array)
  const routeLocationIds = locations.map(loc => loc.id);

  // Get ready for delivery requests (only for locations on this route)
  // Handle both string and number locationIds in route data
  // Support both snake_case (friend_id, location_id) and camelCase (friendId, locationId)
  const readyForDeliveryRequests = requests.filter(r => {
    const friendId = r.friendId || r.friend_id;
    const locationId = r.locationId || r.location_id;
    
    return (r.status === 'ready_for_delivery' || r.status === 'taken') && 
      friendId && 
      (routeLocationIds.includes(locationId?.toString()) || 
       routeLocationIds.includes(Number(locationId)));
  });
  


  // Get requests for current location
  // Support both snake_case and camelCase field names
  const currentLocationRequests = nextLocation 
    ? requests.filter(r => {
        const friendId = r.friendId || r.friend_id;
        const locationId = r.locationId || r.location_id;
        return locationId === nextLocation.id && r.status !== 'delivered' && friendId;
      })
    : [];

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading run details...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={onBack} sx={{ mt: 2 }}>Back to Runs</Button>
      </Box>
    );
  }

  if (!run) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Run not found</Alert>
        <Button onClick={onBack} sx={{ mt: 2 }}>Back to Runs</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Header - Route Name and Back Button */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 3
      }}>
        <Typography variant={isMobile ? "h5" : "h4"}>
          {route?.name || 'Run Overview'}
        </Typography>
        <Tooltip title="Back to Runs">
          <IconButton onClick={onBack} size="large">
            <ArrowBack />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Run Details, Status, Requests, Team */}
        <Grid item xs={12} md={6}>
          {/* Run Details Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Run Details</Typography>
                {!editingRun && run.status !== 'completed' && (
                  <Tooltip title="Edit run details">
                    <IconButton onClick={handleEditRun} size="small">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              
              {editingRun ? (
                // Edit Form
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Run Date"
                    type="date"
                    value={editForm.scheduledDate}
                    onChange={(e) => setEditForm({ ...editForm, scheduledDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label="Meal Count"
                    value={editForm.mealCount}
                    onChange={(e) => setEditForm({ ...editForm, mealCount: e.target.value })}
                    placeholder="0"
                    fullWidth
                  />
                  <TextField
                    label="Notes"
                    multiline
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    fullWidth
                  />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button onClick={handleCancelEdit} variant="outlined">Cancel</Button>
                    <Button onClick={handleSaveRunEdit} variant="contained">Save</Button>
                  </Box>
                </Box>
              ) : (
                // Display Mode
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday color="primary" fontSize="small" />
                    <Typography>
                      <strong>Date:</strong> {format(new Date(run.scheduledDate), 'PPP')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RestaurantMenu color="primary" fontSize="small" />
                    <Typography>
                      <strong>Meals:</strong> {run.mealCount || 0}
                    </Typography>
                  </Box>
                  {run.notes && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Notes:</Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2">{run.notes}</Typography>
                      </Paper>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Run Status and Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Run Status</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Chip
                  icon={getStatusIcon(run.status)}
                  label={run.status?.toUpperCase()}
                  color={getStatusColor(run.status)}
                  variant="filled"
                  sx={{ alignSelf: 'flex-start' }}
                />
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {run.status === 'scheduled' && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrow />}
                      onClick={() => navigate(`/runs/${runId}/prepare`)}
                    >
                      Prepare Run
                    </Button>
                  )}
                  {run.status === 'in_progress' && (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<LocalShipping />}
                        onClick={() => navigate(`/runs/${runId}/active`)}
                      >
                        Continue Run
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleStatusChange('completed')}
                      >
                        Complete Run
                      </Button>
                    </>
                  )}
                  {(run.status === 'scheduled' || run.status === 'in_progress') && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => handleStatusChange('cancelled')}
                    >
                      Cancel Run
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Ready for Delivery Requests */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RestaurantMenu /> Ready Requests ({readyForDeliveryRequests.length})
              </Typography>
              
              {readyForDeliveryRequests.length > 0 ? (
                <List dense>
                  {readyForDeliveryRequests.map((request) => {
                    // Support both snake_case and camelCase field names
                    const friendId = request.friendId || request.friend_id;
                    const locationId = request.locationId || request.location_id;
                    const itemRequested = request.itemRequested || request.item_name;
                    const urgency = request.urgency || request.priority;
                    
                    const friend = getFriendById(friendId);
                    const location = getLocationById(locationId);
                    if (!friend && !friendId) return null;
                    
                    return (
                      <ListItem 
                        key={request.id}
                        sx={{ 
                          bgcolor: 'success.50',
                          borderRadius: 1,
                          mb: 1,
                          border: '1px solid',
                          borderColor: 'success.main'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <RestaurantMenu />
                          </Avatar>
                        </ListItemAvatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {itemRequested} (x{request.quantity || 1})
                          </Typography>
                          <Typography variant="caption" display="block">
                            for {friend?.name || 'Unknown Friend'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip 
                              size="small" 
                              icon={<LocationOn />} 
                              label={location?.description || location?.name || 'Unknown Location'} 
                              variant="outlined"
                            />
                            {urgency && urgency !== 'medium' && (
                              <Chip 
                                size="small" 
                                label={urgency?.toUpperCase()} 
                                color={urgency === 'high' ? 'error' : 'default'}
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography color="text.secondary">
                    No requests ready for delivery
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Group /> Team Members
                </Typography>
                {(permissions.canManageTeams || user?.role === 'admin' || user?.role === 'coordinator') && (
                  <Tooltip title={editingTeam ? "Done editing" : "Edit team"}>
                    <IconButton 
                      onClick={handleToggleTeamEdit} 
                      color={editingTeam ? "primary" : "default"}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              
              {/* Add Team Member Form (when in edit mode) */}
              {editingTeam && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Add Team Member
                  </Typography>
                  <Select
                    value={newTeamMember}
                    onChange={(e) => {
                      setNewTeamMember(e.target.value);
                      handleAddTeamMember(e.target.value);
                    }}
                    displayEmpty
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="" disabled>
                      Select user to add...
                    </MenuItem>
                    {users
                      .filter(u => !run.team?.some(m => m.userId === u.id))
                      .map(u => (
                        <MenuItem key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </MenuItem>
                      ))
                    }
                  </Select>
                </Box>
              )}
              
              {run.team && run.team.length > 0 ? (
                <List>
                  {run.team.map((member, index) => {
                    const memberName = member.name || member.userName || member.user_name || `User ${member.userId || member.user_id}`;
                    const memberRole = member.role || member.userRole || member.user_role || 'Team Member';
                    
                    return (
                      <ListItem 
                        key={member.userId || member.user_id || index}
                        sx={{
                          bgcolor: 'transparent',
                          borderRadius: 1,
                          mb: 0.5
                        }}
                        secondaryAction={
                          editingTeam && (
                            <Tooltip title="Remove from team">
                              <IconButton 
                                edge="end" 
                                onClick={() => handleRemoveTeamMember(member.userId || member.user_id)}
                                color="error"
                                size="small"
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'grey.500' }}>
                            {memberName?.[0] || '?'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={memberName}
                          secondary={memberRole}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography color="text.secondary">
                    No team members assigned yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Locations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn /> Route Locations ({locations.length})
              </Typography>
              
              <LocationsList
                locations={locations}
                routeId={run?.routeId}
                routeName={route?.name}
                editable={run?.status !== 'completed'}
                onLocationsChanged={refreshLocations}
                allRoutes={routes}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Manage Team Dialog */}
      <ManageTeamDialog
        open={showManageTeam}
        onClose={() => setShowManageTeam(false)}
        run={run}
        onTeamUpdated={fetchRunDetails}
      />

      {/* Take Request Dialog */}
      <TakeRequestDialog
        open={showTakeRequest}
        onClose={() => setShowTakeRequest(false)}
        run={run}
        route={route}
        currentLocation={nextLocation}
        onRequestTaken={handleRequestTaken}
      />

      {/* Delivery Confirmation Dialog */}
      <Dialog open={showDeliveryDialog} onClose={() => setShowDeliveryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {deliveryOutcome === 'delivered' ? <CheckCircle color="success" /> : <ThumbDown color="warning" />}
            {deliveryOutcome === 'delivered' ? 'Confirm Delivery' : 'Record Delivery Attempt'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {selectedRequest.itemRequested} (x{selectedRequest.quantity || 1})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                for {getFriendById(selectedRequest.friendId)?.name || 'Unknown Friend'}
              </Typography>
              {selectedRequest.itemCategory === 'clothing' && selectedRequest.clothingGender && selectedRequest.clothingSize && (
                <Typography variant="caption" display="block" color="text.secondary">
                  {selectedRequest.clothingGender} • Size {selectedRequest.clothingSize}
                </Typography>
              )}
            </Box>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label={deliveryOutcome === 'delivered' ? 'Delivery Notes (Optional)' : 'Why was delivery unsuccessful?'}
            placeholder={deliveryOutcome === 'delivered' 
              ? 'Any additional notes about the delivery...'
              : 'e.g., Person not at location, refused delivery, will try again later...'
            }
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
          
          <Alert severity={deliveryOutcome === 'delivered' ? 'success' : 'info'} sx={{ mt: 2 }}>
            {deliveryOutcome === 'delivered' 
              ? 'This will mark the request as successfully delivered and update the friend\'s record.'
              : 'This will record an unsuccessful delivery attempt. The request will remain active for future delivery.'
            }
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeliveryDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeliveryConfirm}
            variant="contained"
            color={deliveryOutcome === 'delivered' ? 'success' : 'warning'}
            startIcon={deliveryOutcome === 'delivered' ? <CheckCircle /> : <ThumbDown />}
          >
            {deliveryOutcome === 'delivered' ? 'Confirm Delivery' : 'Record Attempt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}