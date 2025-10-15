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
  useTheme
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
  Flag,
  PersonAdd,
  Start,
  Stop,
  LocalShipping,
  ThumbDown,
  Handshake,
  AddLocation
} from '@mui/icons-material';
import { format } from 'date-fns';
import ManageTeamDialog from './ManageTeamDialog';
import TakeRequestDialog from './TakeRequestDialog';
import axios from 'axios';
import { API_BASE } from '../../config/api.js';
import { useAuth } from '../../contexts/AuthContext';

export default function RunOverview({ runId, onEdit, onBack }) {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [run, setRun] = useState(null);
  const [route, setRoute] = useState(null);
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
  const [showAddLocationDialog, setShowAddLocationDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deliveryOutcome, setDeliveryOutcome] = useState('delivered'); // 'delivered' or 'not_available'
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // New location form state
  const [newLocationForm, setNewLocationForm] = useState({
    description: '',
    address: '',
    notes: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    if (runId) {
      fetchRunDetails();
    }
  }, [runId]);

  const fetchRunDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch run data and related information
      const [runRes, routesRes, locationsRes, requestsRes, friendsRes] = await Promise.all([
        axios.get(`${API_BASE}/runs/${runId}`),
        axios.get(`${API_BASE}/routes`),
        axios.get(`${API_BASE}/locations`),
        axios.get(`${API_BASE}/requests`),
        axios.get(`${API_BASE}/friends`)
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

      if (runData.run) {
        setRun(runData.run);
        const routeInfo = routesData.routes?.find(r => r.id.toString() === runData.run.routeId.toString());
        setRoute(routeInfo);
        
        // Store all locations for lookups
        const allLocations = locationsData.locations || [];
        setAllLocations(allLocations);
        
        // Filter locations to only include those on this route
        // IMPORTANT: Maintain the original route order for currentLocationIndex to work correctly
        const routeLocationIds = routeInfo?.locationIds || [];
        const routeLocations = routeLocationIds
          .map(locationId => allLocations.find(loc => loc.id.toString() === locationId.toString()))
          .filter(Boolean); // Remove any undefined locations
        

        
        setLocations(routeLocations);
        
        setUsers(usersData.users || []);
        setRequests(requestsData.requests || []);
        setFriends(friendsData.friends || []);
      } else {
        setError('Run not found');
      }
    } catch (err) {
      setError('Failed to load run details: ' + err.message);
    } finally {
      setLoading(false);
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
    const user = users.find(u => u.id.toString() === id.toString());
    return user || { id, name: `User ${id}`, email: '' }; // Fallback for volunteers
  };
  const lead = getUserById(run?.leadId);
  const coordinator = getUserById(run?.coordinatorId);
  const assignedUsers = run?.assignedUserIds?.map(getUserById).filter(Boolean) || [];

  const nextLocationIndex = run?.currentLocationIndex || 0;
  const nextLocation = locations[nextLocationIndex];
  const completedLocations = locations.slice(0, nextLocationIndex);
  const upcomingLocations = locations.slice(nextLocationIndex + 1);

  const handleLocationNavigation = async (direction) => {
    const newIndex = direction === 'next' ? nextLocationIndex + 1 : nextLocationIndex - 1;
    if (newIndex < 0 || newIndex >= locations.length) return;

    try {
      await axios.put(`${API_BASE}/runs/${runId}`, {
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

      const response = await axios.put(`${API_BASE}/runs/${runId}`, updates);
      
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

  const handleAddLocation = async () => {
    if (!newLocationForm.description.trim()) {
      setError('Location description is required');
      return;
    }

    try {
      // 1. Create the new location
      const locationResponse = await axios.post(`${API_BASE}/locations`, {
        ...newLocationForm,
        routeId: run?.routeId
      });

      const createdLocation = locationResponse.data.location;
      
      // 2. Add location to the current route's locationIds array
      if (run?.routeId && route) {
        const updatedLocationIds = [...(route.locationIds || []), createdLocation.id];
        
        await axios.put(`${API_BASE}/routes/${run.routeId}`, {
          ...route,
          locationIds: updatedLocationIds
        });
      }
      
      // 3. Close dialog and refresh data
      setShowAddLocationDialog(false);
      setNewLocationForm({
        description: '',
        address: '',
        notes: '',
        latitude: '',
        longitude: ''
      });
      
      // Refresh run details to show the new location
      await fetchRunDetails();
      
    } catch (err) {
      setError('Failed to add location: ' + err.message);
    }
  };

  const handleDeliveryClick = (request, outcome) => {
    setSelectedRequest(request);
    setDeliveryOutcome(outcome);
    setDeliveryNotes('');
    setShowDeliveryDialog(true);
  };

  const handleDeliveryConfirm = async () => {
    if (!selectedRequest) return;
    
    try {
      if (deliveryOutcome === 'delivered') {
        // Mark as delivered
        await axios.put(`${API_BASE}/requests/${selectedRequest.id}`, {
          status: 'delivered'
        });

        // Create delivery attempt record
        await axios.post(`${API_BASE}/requests/${selectedRequest.id}/delivery-attempts`, {
          attemptDate: new Date().toISOString().split('T')[0],
          outcome: 'delivered',
          notes: deliveryNotes || 'Successfully delivered during run',
          deliveredBy: run?.leadId || 'Unknown'
        });
      } else {
        // Increment delivery attempts count and keep status as ready_for_delivery
        const newAttemptCount = (selectedRequest.deliveryAttempts || 0) + 1;
        await axios.put(`${API_BASE}/requests/${selectedRequest.id}`, { 
          deliveryAttempts: newAttemptCount,
          status: 'ready_for_delivery' // Keep it ready for next attempt
        });

        // Create failed delivery attempt
        await axios.post(`${API_BASE}/requests/${selectedRequest.id}/delivery-attempts`, {
          attemptDate: new Date().toISOString().split('T')[0],
          outcome: 'not_available',
          notes: deliveryNotes || 'Person not available during run',
          deliveredBy: run?.leadId || 'Unknown'
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
          const response = await axios.get(`${API_BASE}/requests/${request.id}/delivery-attempts`);
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

  // Get route location IDs for filtering
  const routeLocationIds = route?.locationIds || [];

  // Get ready for delivery requests (only for locations on this route)
  // Handle both string and number locationIds in route data
  const readyForDeliveryRequests = requests.filter(r => 
    r.status === 'ready_for_delivery' && 
    r.friendId && 
    (routeLocationIds.includes(r.locationId?.toString()) || 
     routeLocationIds.includes(Number(r.locationId)))
  );
  


  // Get requests for current location
  const currentLocationRequests = nextLocation 
    ? requests.filter(r => r.locationId === nextLocation.id && r.status !== 'delivered' && r.friendId)
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
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        justifyContent: 'space-between', 
        mb: 3,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
            {route?.name || 'Run Overview'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={getStatusIcon(run.status)}
              label={run.status?.toUpperCase()}
              color={getStatusColor(run.status)}
              variant="filled"
            />
            <Typography variant="body2" color="text.secondary">
              Scheduled: {format(new Date(run.scheduledDate), 'PPp')}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onBack} variant="outlined">
            Back to Runs
          </Button>
          {run.status === 'scheduled' && (
            <Button 
              onClick={() => setShowManageTeam(true)} 
              variant="outlined" 
              startIcon={<PersonAdd />}
            >
              Manage Team
            </Button>
          )}
          {/* Only show Edit Run button for admins and coordinators */}
          {user?.role && ['admin', 'coordinator'].includes(user.role) && (
            <Button onClick={() => onEdit(run.id)} variant="contained" startIcon={<Edit />}>
              Edit Run
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Run Details and Requests */}
        <Grid item xs={12} md={6}>
          {/* Ready for Delivery Requests */}
          {readyForDeliveryRequests.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RestaurantMenu /> Ready for Delivery ({readyForDeliveryRequests.length})
                </Typography>
                
                <List dense>
                  {readyForDeliveryRequests.map((request) => {
                    const friend = getFriendById(request.friendId);
                    const location = getLocationById(request.locationId);
                    if (!friend && !request.friendId) return null; // Skip if no friend data
                    
                    return (
                      <ListItem 
                        key={request.id}
                        sx={{ 
                          bgcolor: 'success.50',
                          borderRadius: 1,
                          mb: 1,
                          border: '1px solid',
                          borderColor: 'success.200'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <CheckCircle />
                          </Avatar>
                        </ListItemAvatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {request.itemRequested} (x{request.quantity || 1})
                          </Typography>
                          <Typography variant="caption" display="block">
                            for {friend?.name || 'Unknown Friend'}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {request.itemCategory || 'Unknown Category'}
                            {request.itemCategory === 'clothing' && request.clothingGender && request.clothingSize && 
                              ` • ${request.clothingGender} • Size ${request.clothingSize}`
                            }
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Chip 
                              size="small" 
                              icon={<LocationOn />} 
                              label={location?.description || 'Unknown Location'} 
                              variant="outlined"
                            />
                            {request.urgency && request.urgency !== 'medium' && (
                              <Chip 
                                size="small" 
                                label={request.urgency?.toUpperCase() || 'MEDIUM'} 
                                color={request.urgency === 'high' ? 'error' : 'default'}
                                variant="outlined"
                              />
                            )}
                            {/* Show delivery attempt count if > 0 */}
                            <DeliveryAttemptChipWithTooltip request={request} />
                            {/* Delivery Action Buttons for Active Runs */}
                            {(run.status === 'in_progress' || run.status === 'scheduled') && (
                              <Box sx={{ 
                                display: 'flex', 
                                gap: isMobile ? 1 : 0.5, 
                                ml: 'auto',
                                flexDirection: isMobile ? 'column' : 'row',
                                width: isMobile ? '100%' : 'auto'
                              }}>
                                <Button
                                  size={isMobile ? "medium" : "small"}
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircle />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeliveryClick(request, 'delivered');
                                  }}
                                  sx={{ 
                                    minWidth: isMobile ? 120 : 'auto', 
                                    px: isMobile ? 2 : 1,
                                    py: isMobile ? 1.5 : undefined,
                                    fontSize: isMobile ? '1rem' : undefined
                                  }}
                                >
                                  Delivered
                                </Button>
                                <Button
                                  size={isMobile ? "medium" : "small"}
                                  variant="outlined"
                                  color="warning"
                                  startIcon={<ThumbDown />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeliveryClick(request, 'not_available');
                                  }}
                                  sx={{ 
                                    minWidth: isMobile ? 120 : 'auto', 
                                    px: isMobile ? 2 : 1,
                                    py: isMobile ? 1.5 : undefined,
                                    fontSize: isMobile ? '1rem' : undefined
                                  }}
                                >
                                  Not Available
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Run Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RestaurantMenu /> Run Details
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RestaurantMenu color="primary" />
                  <Typography>
                    <strong>{run.mealsCount}</strong> meals prepared
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule color="primary" />
                  <Typography>
                    <strong>{route?.estimatedDuration || 'Unknown'}</strong> minutes estimated
                  </Typography>
                </Box>

                {/* Take Request Button - Prominent */}
                {(run.status === 'scheduled' || run.status === 'in_progress') && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      startIcon={<PersonAdd />}
                      onClick={() => setShowTakeRequest(true)}
                      sx={{ 
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        boxShadow: 2,
                        '&:hover': {
                          boxShadow: 4
                        }
                      }}
                    >
                      Take Request from Friend
                    </Button>
                  </Box>
                )}

                {/* Status Controls */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Run Status Controls:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {run.status === 'scheduled' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<Start />}
                        onClick={() => handleStatusChange('in_progress')}
                      >
                        Start Run
                      </Button>
                    )}
                    {run.status === 'in_progress' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleStatusChange('completed')}
                      >
                        Complete Run
                      </Button>
                    )}
                    {(run.status === 'scheduled' || run.status === 'in_progress') && (
                      <Button
                        size="small"
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
                
                {run.coordinatorNotes && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Coordinator Notes:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">
                        {run.coordinatorNotes}
                      </Typography>
                    </Paper>
                  </Box>
                )}
                
                {run.leadNotes && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Lead Notes:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'blue.50' }}>
                      <Typography variant="body2">
                        {run.leadNotes}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Team Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group /> Team Members
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar><Flag /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={lead?.name || 'No Lead Assigned'}
                    secondary="Run Lead"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemAvatar>
                    <Avatar><Person /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={coordinator?.name || 'Unknown'}
                    secondary="Coordinator"
                  />
                </ListItem>
                
                <Divider />
                
                {assignedUsers.map((user, index) => (
                  <ListItem key={user?.id || index}>
                    <ListItemAvatar>
                      <Avatar>{user?.name?.[0] || '?'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user?.name || 'Unknown User'}
                      secondary={user?.role || 'Team Member'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Location Navigation */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn /> Route Progress
                </Typography>
                
                {/* Location Navigation Controls */}
                {run.status === 'in_progress' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<NavigateBefore />}
                      onClick={() => handleLocationNavigation('previous')}
                      disabled={nextLocationIndex <= 0}
                    >
                      Previous
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={<NavigateNext />}
                      onClick={() => handleLocationNavigation('next')}
                      disabled={nextLocationIndex >= locations.length}
                    >
                      Next
                    </Button>
                  </Box>
                )}
              </Box>
              
              {/* Current Location - Emphasized */}
              {nextLocation && run.status !== 'completed' && (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    mb: 3, 
                    bgcolor: 'primary.50', 
                    border: '2px solid',
                    borderColor: 'primary.main',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="subtitle1" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <NavigateNext /> Current Location ({nextLocationIndex + 1} of {locations.length})
                  </Typography>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {nextLocation.description}
                  </Typography>
                  {nextLocation.notes && (
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {nextLocation.notes}
                    </Typography>
                  )}
                  {nextLocation.address && (
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <LocationOn color="primary" />
                      {nextLocation.address}
                    </Typography>
                  )}
                </Paper>
              )}

              {/* Current Location Requests */}
              {currentLocationRequests.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'warning.50' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person /> Requests at This Location ({currentLocationRequests.length})
                  </Typography>
                  
                  <List dense>
                    {currentLocationRequests.map((request) => {
                      const friend = getFriendById(request.friendId);
                      if (!friend && !request.friendId) return null; // Skip if no friend data
                      
                      return (
                        <ListItem 
                          key={request.id}
                          sx={{ 
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            mb: 1,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: request.urgency === 'high' ? 'error.main' : 
                                      request.urgency === 'low' ? 'info.main' : 'warning.main'
                            }}>
                              <RestaurantMenu />
                            </Avatar>
                          </ListItemAvatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {request.itemRequested} (x{request.quantity || 1})
                            </Typography>
                            <Typography variant="caption" display="block">
                              for {friend?.name || 'Unknown Friend'}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {request.itemCategory || 'Unknown Category'}
                              {request.itemCategory === 'clothing' && request.clothingGender && request.clothingSize && 
                                ` • ${request.clothingGender} • Size ${request.clothingSize}`
                              }
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                              <Chip 
                                size="small" 
                                label={request.status?.replace('_', ' ')?.toUpperCase() || 'PENDING'} 
                                color={request.status === 'ready_for_delivery' ? 'success' : 'default'}
                                variant="outlined"
                              />
                              {request.urgency && request.urgency !== 'medium' && (
                                <Chip 
                                  size="small" 
                                  label={request.urgency?.toUpperCase() || 'MEDIUM'} 
                                  color={request.urgency === 'high' ? 'error' : 'info'}
                                  variant="outlined"
                                />
                              )}
                              {/* Show delivery attempt count if > 0 */}
                              <DeliveryAttemptChipWithTooltip request={request} />
                              {/* Delivery Action Buttons - Only for ready_for_delivery status during active runs */}
                              {request.status === 'ready_for_delivery' && (run.status === 'in_progress' || run.status === 'scheduled') && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: isMobile ? 1 : 0.5, 
                                  ml: 'auto',
                                  flexDirection: isMobile ? 'column' : 'row',
                                  width: isMobile ? '100%' : 'auto'
                                }}>
                                  <Button
                                    size={isMobile ? "medium" : "small"}
                                    variant="contained"
                                    color="success"
                                    startIcon={<Handshake />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeliveryClick(request, 'delivered');
                                    }}
                                    sx={{ 
                                      minWidth: isMobile ? 120 : 'auto', 
                                      px: isMobile ? 2 : 1,
                                      py: isMobile ? 1.5 : undefined,
                                      fontSize: isMobile ? '1rem' : '0.75rem'
                                    }}
                                  >
                                    Delivered
                                  </Button>
                                  <Button
                                    size={isMobile ? "medium" : "small"}
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<ThumbDown />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeliveryClick(request, 'not_available');
                                    }}
                                    sx={{ 
                                      minWidth: isMobile ? 120 : 'auto', 
                                      px: isMobile ? 2 : 1,
                                      py: isMobile ? 1.5 : undefined,
                                      fontSize: isMobile ? '1rem' : '0.75rem'
                                    }}
                                  >
                                    Not Available
                                  </Button>
                                </Box>
                              )}
                            </Box>
                            {request.specialInstructions && (
                              <Typography variant="caption" display="block" sx={{ fontStyle: 'italic' }}>
                                {request.specialInstructions}
                              </Typography>
                            )}
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                </Paper>
              )}
              
              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Overall Progress: {nextLocationIndex} of {locations.length} locations
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={locations.length > 0 ? (nextLocationIndex / locations.length) * 100 : 0}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                
                {/* Add Location Button */}
                {(run.status === 'scheduled' || run.status === 'in_progress') && (
                  <Button
                    variant="outlined"
                    startIcon={<AddLocation />}
                    onClick={() => setShowAddLocationDialog(true)}
                    sx={{ mt: 2 }}
                    size="small"
                  >
                    Add Location to Route
                  </Button>
                )}
              </Box>

              {/* All Locations List */}
              <Typography variant="subtitle1" gutterBottom>
                All Locations:
              </Typography>
              <List dense>
                {locations.map((location, index) => {
                  const isCompleted = index < nextLocationIndex;
                  const isCurrent = index === nextLocationIndex;
                  const isUpcoming = index > nextLocationIndex;
                  
                  return (
                    <ListItem 
                      key={location?.id || index}
                      sx={{ 
                        opacity: isUpcoming ? 0.7 : 1,
                        bgcolor: isCurrent ? 'action.selected' : 'transparent',
                        borderRadius: 1,
                        mb: 0.5
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          size="small"
                          sx={{ 
                            bgcolor: isCompleted ? 'success.main' : isCurrent ? 'primary.main' : 'grey.300',
                            width: 32, 
                            height: 32 
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle sx={{ fontSize: 16 }} />
                          ) : (
                            <Typography variant="caption">{index + 1}</Typography>
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                fontWeight: isCurrent ? 'bold' : 'normal'
                              }}
                            >
                              {location?.description || `Location ${index + 1}`}
                            </Typography>
                            {isCurrent && (
                              <Chip size="small" label="CURRENT" color="primary" />
                            )}
                          </Box>
                        }
                        secondary={location?.notes}
                      />
                    </ListItem>
                  );
                })}
              </List>
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

      {/* Add Location Dialog */}
      <Dialog open={showAddLocationDialog} onClose={() => setShowAddLocationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddLocation color="primary" />
            Add New Location to Route
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Alert severity="info">
              Adding a new location to route "<strong>{route?.name}</strong>". This location will be available for future runs on this route.
            </Alert>
            
            <TextField
              label="Location Description *"
              value={newLocationForm.description}
              onChange={(e) => setNewLocationForm({ ...newLocationForm, description: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Central Park East Entrance, Downtown Library Steps..."
              helperText="A clear, descriptive name for this location"
            />
            
            <TextField
              label="Address"
              value={newLocationForm.address}
              onChange={(e) => setNewLocationForm({ ...newLocationForm, address: e.target.value })}
              fullWidth
              placeholder="Street address or nearby landmark"
              helperText="Physical address or recognizable landmark"
            />
            
            <TextField
              label="Location Notes"
              value={newLocationForm.notes}
              onChange={(e) => setNewLocationForm({ ...newLocationForm, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Additional details: accessibility, best approach, safety notes, typical gathering times..."
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Latitude (Optional)"
                value={newLocationForm.latitude}
                onChange={(e) => setNewLocationForm({ ...newLocationForm, latitude: e.target.value })}
                fullWidth
                placeholder="e.g., 40.7829"
                helperText="GPS coordinates if available"
              />
              <TextField
                label="Longitude (Optional)"
                value={newLocationForm.longitude}
                onChange={(e) => setNewLocationForm({ ...newLocationForm, longitude: e.target.value })}
                fullWidth
                placeholder="e.g., -73.9654"
                helperText="GPS coordinates if available"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowAddLocationDialog(false);
            setNewLocationForm({
              description: '',
              address: '',
              notes: '',
              latitude: '',
              longitude: ''
            });
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddLocation}
            variant="contained"
            disabled={!newLocationForm.description.trim()}
            startIcon={<AddLocation />}
          >
            Add Location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}