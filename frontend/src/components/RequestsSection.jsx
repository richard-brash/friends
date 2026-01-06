import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  Tooltip,
  Menu,
  Badge
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Search,
  FilterList,
  Add,
  Edit,
  Delete,
  LocalShipping,
  CheckCircle,
  Schedule,
  Warning,
  AccessTime,
  Person,
  LocationOn,
  RestaurantMenu,
  MoreVert,
  Refresh,
  Assignment,
  Category,
  Male,
  Female,
  Straighten
} from '@mui/icons-material';
import { format } from 'date-fns';

const API_BASE = '/api';

export default function RequestsSection() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  // Tab state
  const [currentTab, setCurrentTab] = useState(0);
  
  // Filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  
  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusChangeNotes, setStatusChangeNotes] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, friendsRes, usersRes, locationsRes, routesRes] = await Promise.all([
        axios.get(`${API_BASE}/v2/requests`),
        axios.get(`${API_BASE}/v2/friends`),
        axios.get(`${API_BASE}/users`),
        axios.get(`${API_BASE}/v2/locations`),
        axios.get(`${API_BASE}/v2/routes`)
      ]);

      const requestsData = requestsRes.data;
      const friendsData = friendsRes.data;
      const usersData = usersRes.data;
      const locationsData = locationsRes.data;
      const routesData = routesRes.data;

  setRequests(requestsData.requests || []);
  setFriends(friendsData.data || []);
  setUsers(usersData.users || []);
  setLocations(locationsData.data || []);
  setRoutes(routesData.data || []);

      // DEBUG LOGGING - REMOVE WHEN FIXED
      console.log('DEBUG: requests', requestsData);
      console.log('DEBUG: friends', friendsData);
      console.log('DEBUG: locations', locationsData);
      console.log('DEBUG: routes', routesData);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delivery Attempt History Component
  const DeliveryAttemptHistory = ({ requestId }) => {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchAttempts = async () => {
        try {
          const response = await axios.get(`${API_BASE}/v2/requests/${requestId}/delivery-attempts`);
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
    }, [requestId]);

    if (loading) {
      return <Typography variant="body2" color="text.secondary">Loading delivery history...</Typography>;
    }

    if (attempts.length === 0) {
      return <Typography variant="body2" color="text.secondary">No delivery attempts recorded.</Typography>;
    }

    return (
      <List dense>
        {attempts.map((attempt) => {
          const isDelivered = attempt.status === 'delivered';
          const attemptDate = attempt.created_at || attempt.attempt_date;
          
          return (
            <ListItem key={attempt.id} divider>
              <ListItemAvatar>
                <Avatar sx={{ 
                  bgcolor: isDelivered ? 'success.main' : 'warning.main',
                  width: 32, 
                  height: 32 
                }}>
                  {isDelivered ? <CheckCircle /> : <AccessTime />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {attemptDate ? format(new Date(attemptDate), 'PPp') : 'Unknown date'}
                    </Typography>
                    <Chip 
                      label={isDelivered ? 'Delivered' : 'Not Available'}
                      size="small"
                      color={isDelivered ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={attempt.notes || 'No notes provided'}
                secondaryTypographyProps={{ component: 'div' }}
              />
            </ListItem>
          );
        })}
      </List>
    );
  };

  // Delivery Attempt Badge Component with Tooltip
  const DeliveryAttemptBadge = ({ requestId }) => {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchAttempts = async () => {
        try {
          const response = await axios.get(`${API_BASE}/v2/requests/${requestId}/delivery-attempts`);
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
    }, [requestId]);

    if (loading) {
      return (
        <Badge badgeContent="..." color="default" variant="standard">
          <LocalShipping />
        </Badge>
      );
    }

    const attemptCount = attempts.length;
    
    if (attemptCount === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          No attempts
        </Typography>
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
          Delivery History ({attemptCount} attempt{attemptCount !== 1 ? 's' : ''})
        </Typography>
        {attempts.map((attempt, index) => {
          const isDelivered = attempt.status === 'delivered';
          const attemptDate = attempt.created_at || attempt.attempt_date;
          
          return (
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
                    backgroundColor: isDelivered ? '#4caf50' : '#ff9800',
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
                  {attemptDate ? format(new Date(attemptDate), 'MMM dd, yyyy h:mm a') : 'Unknown date'}
                </Typography>
              </Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isDelivered ? '#81c784' : '#ffb74d',
                  fontWeight: 'medium',
                  fontSize: '0.7rem'
                }}
              >
                {isDelivered ? 'Delivered Successfully' : 'Delivery Attempted'}
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
          );
        })}
      </Box>
    );

    return (
      <Tooltip title={tooltipContent} placement="left" arrow>
        <Badge 
          badgeContent={attemptCount} 
          color={attempts.some(a => a.status === 'delivered') ? 'success' : 'warning'}
          variant="standard"
          sx={{ cursor: 'pointer' }}
        >
          <LocalShipping 
            fontSize="small" 
            color={attempts.some(a => a.status === 'delivered') ? 'success' : 'action'}
          />
        </Badge>
      </Tooltip>
    );
  };

  // Helper functions
  // Helper to get friend/location/user from a request, supporting both snake_case and camelCase
  const getRequestFriend = (request) => getFriendById(request.friend_id ?? request.friendId);
  const getRequestLocation = (request) => getLocationById(request.location_id ?? request.locationId);
  const getRequestTakenByUser = (request) => getUserById(request.taken_by_user_id ?? request.takenByUserId);
  // Always coerce both sides to string for robust lookup (like Friend Management)
  const getFriendById = (id) => {
    if (!id) return undefined;
    return friends.find(f => f && f.id != null && f.id.toString() === id.toString());
  };
  const getUserById = (id) => {
    if (!id) return undefined;
    return users.find(u => u && u.id != null && u.id.toString() === id.toString());
  };
  const getLocationById = (id) => {
    if (!id) return undefined;
    return locations.find(l => l && l.id != null && l.id.toString() === id.toString());
  };
  const getRouteById = (id) => {
    if (!id) return undefined;
    return routes.find(r => r && r.id != null && r.id.toString() === id.toString());
  };

  // For locations, routeId is camelCase in API response
  const getLocationRouteId = (location) => location?.routeId ?? location?.route_id;
  
  // Get delivery attempt count - backend now provides this as deliveryAttemptCount
  const getDeliveryAttemptCount = (request) => {
    return request?.deliveryAttemptCount || request?.delivery_attempt_count || 0;
  };

  // Status and priority helpers
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'taken': return 'primary';
      case 'ready_for_delivery': return 'success';
      case 'delivered': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category) => {
    return category === 'clothing' ? <Straighten /> : <Category />;
  };

  const getGenderIcon = (gender) => {
    switch (gender) {
      case 'male': return <Male />;
      case 'female': return <Female />;
      default: return null;
    }
  };

  // Filtering logic
  const filteredRequests = requests.filter(request => {
    const friend = getRequestFriend(request);
    const location = getRequestLocation(request);
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      request.item_name?.toLowerCase().includes(searchLower) ||
      request.item_details?.toLowerCase().includes(searchLower) ||
      friend?.name?.toLowerCase().includes(searchLower) ||
      location?.description?.toLowerCase().includes(searchLower);
    // Status filter
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    // Category filter
    const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter;
    // Route filter (through location relationship: Request → Location → Route)
  const matchesRoute = routeFilter === 'all' || (location && getLocationRouteId(location)?.toString() === routeFilter.toString());
    return matchesSearch && matchesStatus && matchesCategory && matchesRoute;
  });

  // Tab filtering
  const getTabRequests = (tabIndex) => {
    switch (tabIndex) {
      case 0: return filteredRequests; // All
      case 1: return filteredRequests.filter(r => r.status === 'taken'); // Taken
      case 2: return filteredRequests.filter(r => r.status === 'pending'); // Pending
      case 3: return filteredRequests.filter(r => r.status === 'ready_for_delivery'); // Ready for Delivery
      case 4: return filteredRequests.filter(r => r.status === 'delivered'); // Delivered
      case 5: return filteredRequests.filter(r => r.status === 'cancelled'); // Cancelled
      default: return filteredRequests;
    }
  };

  const tabRequests = getTabRequests(currentTab);

  // Statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    ready: requests.filter(r => r.status === 'ready_for_delivery').length,
    delivered: requests.filter(r => r.status === 'delivered').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
    clothing: requests.filter(r => r.itemCategory === 'clothing').length,
    nonClothing: requests.filter(r => r.itemCategory === 'non-clothing').length
  };

  const handleStatusUpdate = async (requestId, newStatus, notes = '') => {
    if (!user || !user.id) {
      alert('No current user found. Please log in again.');
      return;
    }
    
    try {
      // Add status history entry (this will also update the request status unless it's delivery_attempt_failed)
      await axios.post(`${API_BASE}/v2/requests/${requestId}/status-history`, {
        status: newStatus,
        notes: notes,
        user_id: user.id
      });
      
      await fetchData();
      setAnchorEl(null);
      setShowStatusDialog(false);
      setStatusChangeNotes('');
      setPendingStatus(null);
    } catch (err) {
      setError('Failed to update request status: ' + err.message);
    }
  };

  const handleStatusMenuClick = (status) => {
    setPendingStatus(status);
    setShowStatusDialog(true);
    setAnchorEl(null);
  };

  // Status Change Dialog
  const StatusChangeDialog = () => (
    <Dialog open={showStatusDialog} onClose={() => setShowStatusDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {pendingStatus === 'delivery_attempt_failed' 
          ? 'Record Failed Delivery Attempt' 
          : 'Update Request Status'}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {pendingStatus === 'delivery_attempt_failed' 
            ? 'Record that you attempted delivery but were unsuccessful. The request will stay as "Ready for Delivery".'
            : `Change status to: ${pendingStatus?.replace(/_/g, ' ')?.toUpperCase()}`}
        </Typography>
        <TextField
          label="Notes (Optional)"
          fullWidth
          multiline
          minRows={3}
          value={statusChangeNotes}
          onChange={e => setStatusChangeNotes(e.target.value)}
          placeholder="Add any relevant details..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { setShowStatusDialog(false); setStatusChangeNotes(''); setPendingStatus(null); }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => handleStatusUpdate(selectedRequest?.id, pendingStatus, statusChangeNotes)}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };

  // Complete Status History Component
  const StatusHistoryViewer = ({ requestId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchHistory = async () => {
        try {
          const response = await axios.get(`${API_BASE}/v2/requests/${requestId}/status-history`);
          const data = response.data;
          setHistory(data.statusHistory || []);
        } catch (error) {
          console.error('Error fetching status history:', error);
          setHistory([]);
        } finally {
          setLoading(false);
        }
      };

      fetchHistory();
    }, [requestId]);

    if (loading) {
      return <Typography variant="body2" color="text.secondary">Loading history...</Typography>;
    }

    if (history.length === 0) {
      return <Typography variant="body2" color="text.secondary">No status changes recorded.</Typography>;
    }

    const getStatusLabel = (status) => {
      switch (status) {
        case 'pending': return 'Pending';
        case 'taken': return 'Taken';
        case 'ready_for_delivery': return 'Ready for Delivery';
        case 'delivered': return 'Delivered';
        case 'delivery_attempt_failed': return 'Delivery Attempt Failed';
        case 'cancelled': return 'Cancelled';
        default: return status;
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'delivered': return <CheckCircle />;
        case 'delivery_attempt_failed': return <Warning />;
        case 'cancelled': return <Delete />;
        default: return <Schedule />;
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'delivered': return 'success.main';
        case 'delivery_attempt_failed': return 'warning.main';
        case 'cancelled': return 'error.main';
        case 'ready_for_delivery': return 'success.light';
        case 'taken': return 'primary.main';
        default: return 'grey.500';
      }
    };

    return (
      <List dense>
        {history.map((entry) => {
          const entryDate = entry.created_at;
          const isDeliveryAttempt = entry.status === 'delivered' || entry.status === 'delivery_attempt_failed';
          
          return (
            <ListItem key={entry.id} divider sx={{ bgcolor: isDeliveryAttempt ? 'action.hover' : 'transparent' }}>
              <ListItemAvatar>
                <Avatar sx={{ 
                  bgcolor: getStatusColor(entry.status),
                  width: 36, 
                  height: 36 
                }}>
                  {getStatusIcon(entry.status)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={getStatusLabel(entry.status)}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {entryDate ? format(new Date(entryDate), 'MMM dd, yyyy h:mm a') : 'Unknown date'}
                    </Typography>
                    {isDeliveryAttempt && (
                      <Chip 
                        label="Delivery Attempt" 
                        size="small" 
                        color="info" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={entry.notes || 'No notes provided'}
              />
            </ListItem>
          );
        })}
      </List>
    );
  };

  const RequestDetailsDialog = () => {
    if (!selectedRequest) return null;
    
    // Lookup for the user who took the request
    const takenByUser = getUserById(selectedRequest.taken_by || selectedRequest.takenBy);
    // Support both snake_case and camelCase for IDs
    const friend = getFriendById(selectedRequest.friend_id ?? selectedRequest.friendId);
    const location = getLocationById(selectedRequest.location_id ?? selectedRequest.locationId);
    const route = location ? getRouteById(location.route_id ?? location.routeId) : null;
    const takenBy = getUserById(selectedRequest.taken_by_user_id ?? selectedRequest.takenByUserId);
    
    return (
      <Dialog open={showRequestDetails} onClose={() => setShowRequestDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment color="primary" />
            Request Details (Read-Only)
          </Box>
        </DialogTitle>
        <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Request Information</Typography>
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>{getCategoryIcon(selectedRequest.category)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={selectedRequest.item_name}
                  secondary={`${selectedRequest.category} • Quantity: ${selectedRequest.quantity}`}
                />
              </ListItem>
              {selectedRequest.item_details && (
                <ListItem>
                  <ListItemText
                    primary="Item Details"
                    secondary={selectedRequest.item_details}
                  />
                </ListItem>
              )}
              {selectedRequest.category === 'clothing' && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>{getGenderIcon(selectedRequest.clothing_gender)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${selectedRequest.clothing_gender} • Size: ${selectedRequest.clothing_size}`}
                    secondary="Gender & Size"
                  />
                </ListItem>
              )}
              <ListItem>
                <ListItemText
                  primary="Current Status"
                  secondary={
                    <Chip 
                      label={selectedRequest.status?.replace(/_/g, ' ')?.toUpperCase()}
                      color={getStatusColor(selectedRequest.status)}
                      sx={{ mt: 1 }}
                    />
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Context & People</Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar><Person /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={friend?.name || 'Unknown Friend'}
                    secondary="Requested by"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar><LocationOn /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={location?.name || location?.description || 'Unknown Location'}
                    secondary={route ? `Location • Route: ${route.name}` : 'Location'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar><Person /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={takenByUser?.name || 'Unknown User'}
                    secondary="Taken By"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Request Date"
                    secondary={format(new Date(selectedRequest.created_at), 'PPp')}
                  />
                </ListItem>
              </List>
            </Grid>
            {selectedRequest.special_instructions && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Special Instructions</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">{selectedRequest.special_instructions}</Typography>
                </Paper>
              </Grid>
            )}
            {/* Complete Status History */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccessTime color="primary" />
                <Typography variant="h6">
                  Complete Request History
                </Typography>
              </Box>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <StatusHistoryViewer requestId={selectedRequest.id} />
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRequestDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) return <Box sx={{ p: 3 }}><Typography>Loading requests...</Typography></Box>;
  if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Requests Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={fetchData}
        >
          Refresh
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{stats.total}</Typography>
              <Typography variant="body2">Total Requests</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
              <Typography variant="body2">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">{stats.ready}</Typography>
              <Typography variant="body2">Ready for Delivery</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">{stats.delivered}</Typography>
              <Typography variant="body2">Delivered</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">{stats.cancelled}</Typography>
              <Typography variant="body2">Cancelled</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Filters & Search</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="taken">Taken</MenuItem>
                  <MenuItem value="ready_for_delivery">Ready for Delivery</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="clothing">Clothing</MenuItem>
                  <MenuItem value="non-clothing">Non-Clothing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Route</InputLabel>
                <Select value={routeFilter} label="Route" onChange={(e) => setRouteFilter(e.target.value)}>
                  <MenuItem value="all">All Routes</MenuItem>
                  {routes.map(route => (
                    <MenuItem key={route.id} value={route.id}>
                      {route.name}
                      {route.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All (${filteredRequests.length})`} />
          <Tab label={`Taken (${filteredRequests.filter(r => r.status === 'taken').length})`} />
          <Tab label={`Pending (${filteredRequests.filter(r => r.status === 'pending').length})`} />
          <Tab label={`Ready (${filteredRequests.filter(r => r.status === 'ready_for_delivery').length})`} />
          <Tab label={`Delivered (${filteredRequests.filter(r => r.status === 'delivered').length})`} />
          <Tab label={`Cancelled (${filteredRequests.filter(r => r.status === 'cancelled').length})`} />
        </Tabs>
        
        {/* Requests Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item & Category</TableCell>
                <TableCell>Friend</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Delivery Attempts</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tabRequests.map((request) => {
                const friend = getRequestFriend(request);
                const location = getRequestLocation(request);
                const route = location ? getRouteById(getLocationRouteId(location)) : null;
                return (
                  <TableRow 
                    key={request.id} 
                    hover 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRequestClick(request)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar size="small" sx={{ bgcolor: request.category === 'clothing' ? 'primary.main' : 'secondary.main' }}>
                          {getCategoryIcon(request.category)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {request.item_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.category}
                            {request.category === 'clothing' && request.clothing_gender && 
                              ` • ${request.clothing_gender} • ${request.clothing_size}`
                            }
                            {request.quantity > 1 && ` • Qty: ${request.quantity}`}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{friend?.name || 'Unknown'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{location?.name || location?.description || 'Unknown'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {route ? route.name : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status?.replace('_', ' ')?.toUpperCase()} 
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <DeliveryAttemptBadge requestId={request.id} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(request.created_at), 'MM/dd/yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(request);
                          setAnchorEl(e.currentTarget);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleStatusMenuClick('pending')}>
          Mark as Pending
        </MenuItem>
        <MenuItem onClick={() => handleStatusMenuClick('taken')}>
          Mark as Taken
        </MenuItem>
        <MenuItem onClick={() => handleStatusMenuClick('ready_for_delivery')}>
          Mark Ready for Delivery
        </MenuItem>
        <MenuItem onClick={() => handleStatusMenuClick('delivered')}>
          Mark as Delivered
        </MenuItem>
        <MenuItem onClick={() => handleStatusMenuClick('delivery_attempt_failed')}>
          Delivery Unsuccessful
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleStatusMenuClick('cancelled')}>
          Cancel Request
        </MenuItem>
      </Menu>

      {/* Request Details Dialog */}
      <RequestDetailsDialog />
      
      {/* Status Change Dialog */}
      <StatusChangeDialog />
    </Box>
  );
}
