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

const API_BASE = 'http://localhost:4000/api';

export default function RequestsSection() {
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [deliveryAttempts, setDeliveryAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab state
  const [currentTab, setCurrentTab] = useState(0);
  
  // Filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  
  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, friendsRes, usersRes, locationsRes, routesRes] = await Promise.all([
        fetch(`${API_BASE}/requests?include=deliveryAttempts`),
        fetch(`${API_BASE}/friends`),
        fetch(`${API_BASE}/users`),
        fetch(`${API_BASE}/locations`),
        fetch(`${API_BASE}/routes`)
      ]);
      
      const requestsData = await requestsRes.json();
      const friendsData = await friendsRes.json();
      const usersData = await usersRes.json();
      const locationsData = await locationsRes.json();
      const routesData = await routesRes.json();
      
      setRequests(requestsData.requests || []);
      setFriends(friendsData.friends || []);
      setUsers(usersData.users || []);
      setLocations(locationsData.locations || []);
      setRoutes(routesData.routes || []);
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
          const response = await fetch(`${API_BASE}/requests/${requestId}/delivery-attempts`);
          if (!response.ok) throw new Error('Failed to fetch delivery attempts');
          const data = await response.json();
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
        {attempts.map((attempt) => (
          <ListItem key={attempt.id} divider>
            <ListItemAvatar>
              <Avatar sx={{ 
                bgcolor: attempt.outcome === 'delivered' ? 'success.main' : 'warning.main',
                width: 32, 
                height: 32 
              }}>
                {attempt.outcome === 'delivered' ? <CheckCircle /> : <AccessTime />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {format(new Date(attempt.attemptDate), 'PPp')}
                  </Typography>
                  <Chip 
                    label={attempt.outcome === 'delivered' ? 'Delivered' : 'Not Available'}
                    size="small"
                    color={attempt.outcome === 'delivered' ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              }
              secondary={attempt.notes || 'No notes provided'}
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
        ))}
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
          const response = await fetch(`${API_BASE}/requests/${requestId}/delivery-attempts`);
          if (!response.ok) throw new Error('Failed to fetch delivery attempts');
          const data = await response.json();
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
      <Tooltip title={tooltipContent} placement="left" arrow>
        <Badge 
          badgeContent={attemptCount} 
          color={attempts.some(a => a.outcome === 'delivered') ? 'success' : 'warning'}
          variant="standard"
          sx={{ cursor: 'pointer' }}
        >
          <LocalShipping 
            fontSize="small" 
            color={attempts.some(a => a.outcome === 'delivered') ? 'success' : 'action'}
          />
        </Badge>
      </Tooltip>
    );
  };

  // Helper functions
  const getFriendById = (id) => friends.find(f => f?.id?.toString() === id?.toString());
  const getUserById = (id) => users.find(u => u?.id?.toString() === id?.toString());
  const getLocationById = (id) => locations.find(l => l?.id?.toString() === id?.toString());
  
  // Get delivery attempt count - handle both array and number formats
  const getDeliveryAttemptCount = (deliveryAttempts) => {
    if (Array.isArray(deliveryAttempts)) {
      return deliveryAttempts.length;
    }
    return typeof deliveryAttempts === 'number' ? deliveryAttempts : 0;
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
    const friend = getFriendById(request.friendId);
    const location = getLocationById(request.locationId);
    
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      request.itemRequested?.toLowerCase().includes(searchLower) ||
      request.itemDetails?.toLowerCase().includes(searchLower) ||
      friend?.name?.toLowerCase().includes(searchLower) ||
      location?.description?.toLowerCase().includes(searchLower);
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || request.itemCategory === categoryFilter;
    
    // Urgency filter
    const matchesUrgency = urgencyFilter === 'all' || request.urgency === urgencyFilter;
    
    // Route filter (through location relationship: Request → Location → Route)
    const matchesRoute = routeFilter === 'all' || (location && location.routeId?.toString() === routeFilter.toString());
    
    return matchesSearch && matchesStatus && matchesCategory && matchesUrgency && matchesRoute;
  });

  // Tab filtering
  const getTabRequests = (tabIndex) => {
    switch (tabIndex) {
      case 0: return filteredRequests; // All
      case 1: return filteredRequests.filter(r => r.status === 'pending'); // Pending
      case 2: return filteredRequests.filter(r => r.status === 'taken'); // Taken
      case 3: return filteredRequests.filter(r => r.status === 'ready_for_delivery'); // Ready for Delivery
      case 4: return filteredRequests.filter(r => r.status === 'delivered'); // Delivered
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
    clothing: requests.filter(r => r.itemCategory === 'clothing').length,
    nonClothing: requests.filter(r => r.itemCategory === 'non-clothing').length
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await fetch(`${API_BASE}/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      await fetchData();
      setAnchorEl(null);
    } catch (err) {
      setError('Failed to update request status: ' + err.message);
    }
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };

  const RequestDetailsDialog = () => {
    if (!selectedRequest) return null;
    
    const friend = getFriendById(selectedRequest.friendId);
    const location = getLocationById(selectedRequest.locationId);
    const takenBy = getUserById(selectedRequest.takenByUserId);
    
    return (
      <Dialog open={showRequestDetails} onClose={() => setShowRequestDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment color="primary" />
            Request Details
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Request Information</Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>{getCategoryIcon(selectedRequest.itemCategory)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={selectedRequest.itemRequested}
                    secondary={`${selectedRequest.itemCategory} • Quantity: ${selectedRequest.quantity}`}
                  />
                </ListItem>
                {selectedRequest.itemDetails && (
                  <ListItem>
                    <ListItemText
                      primary="Item Details"
                      secondary={selectedRequest.itemDetails}
                    />
                  </ListItem>
                )}
                {selectedRequest.itemCategory === 'clothing' && (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>{getGenderIcon(selectedRequest.clothingGender)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${selectedRequest.clothingGender} • Size: ${selectedRequest.clothingSize}`}
                      secondary="Gender & Size"
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText
                    primary="Status & Priority"
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          label={selectedRequest.status?.replace('_', ' ')?.toUpperCase()} 
                          color={getStatusColor(selectedRequest.status)}
                          size="small"
                        />
                        <Chip 
                          label={selectedRequest.urgency?.toUpperCase()} 
                          color={getUrgencyColor(selectedRequest.urgency)}
                          size="small"
                        />
                      </Box>
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
                    primary={location?.description || 'Unknown Location'}
                    secondary="Location"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar><Assignment /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={takenBy?.name || 'Unknown User'}
                    secondary="Taken by"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Request Date"
                    secondary={format(new Date(selectedRequest.dateRequested || selectedRequest.createdAt), 'PPp')}
                  />
                </ListItem>
              </List>
            </Grid>
            
            {selectedRequest.specialInstructions && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Special Instructions</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">{selectedRequest.specialInstructions}</Typography>
                </Paper>
              </Grid>
            )}
            
            {/* Delivery Attempt History */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccessTime color="primary" />
                <Typography variant="h6">
                  Delivery Attempt Log
                </Typography>
                {(() => {
                  const attemptCount = getDeliveryAttemptCount(selectedRequest.deliveryAttempts);
                  return (
                    <Chip 
                      label={`${attemptCount} attempt${attemptCount !== 1 ? 's' : ''}`}
                      size="small"
                      color={attemptCount > 0 ? 'primary' : 'default'}
                    />
                  );
                })()}
              </Box>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <DeliveryAttemptHistory requestId={selectedRequest.id} />
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRequestDetails(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowRequestDetails(false);
              setShowDeliveryDialog(true);
            }}
            disabled={selectedRequest.status === 'delivered'}
          >
            Record Delivery
          </Button>
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
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{stats.total}</Typography>
              <Typography variant="body2">Total Requests</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
              <Typography variant="body2">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">{stats.ready}</Typography>
              <Typography variant="body2">Ready for Delivery</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">{stats.delivered}</Typography>
              <Typography variant="body2">Delivered</Typography>
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
            <Grid item xs={6} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Urgency</InputLabel>
                <Select value={urgencyFilter} label="Urgency" onChange={(e) => setUrgencyFilter(e.target.value)}>
                  <MenuItem value="all">All Urgencies</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
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
          <Tab label={`Pending (${filteredRequests.filter(r => r.status === 'pending').length})`} />
          <Tab label={`Taken (${filteredRequests.filter(r => r.status === 'taken').length})`} />
          <Tab label={`Ready (${filteredRequests.filter(r => r.status === 'ready_for_delivery').length})`} />
          <Tab label={`Delivered (${filteredRequests.filter(r => r.status === 'delivered').length})`} />
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
                <TableCell>Priority</TableCell>
                <TableCell align="center">Delivery Attempts</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tabRequests.map((request) => {
                const friend = getFriendById(request.friendId);
                const location = getLocationById(request.locationId);
                
                return (
                  <TableRow 
                    key={request.id} 
                    hover 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRequestClick(request)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar size="small" sx={{ bgcolor: request.itemCategory === 'clothing' ? 'primary.main' : 'secondary.main' }}>
                          {getCategoryIcon(request.itemCategory)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {request.itemRequested}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.itemCategory}
                            {request.itemCategory === 'clothing' && request.clothingGender && 
                              ` • ${request.clothingGender} • ${request.clothingSize}`
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
                      <Typography variant="body2">{location?.description || 'Unknown'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status?.replace('_', ' ')?.toUpperCase()} 
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.urgency?.toUpperCase()} 
                        color={getUrgencyColor(request.urgency)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <DeliveryAttemptBadge requestId={request.id} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(request.dateRequested || request.createdAt), 'MM/dd/yyyy')}
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
        <MenuItem onClick={() => handleStatusUpdate(selectedRequest?.id, 'ready_for_delivery')}>
          Mark Ready for Delivery
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate(selectedRequest?.id, 'delivered')}>
          Mark as Delivered
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate(selectedRequest?.id, 'cancelled')}>
          Cancel Request
        </MenuItem>
      </Menu>

      {/* Request Details Dialog */}
      <RequestDetailsDialog />
    </Box>
  );
}