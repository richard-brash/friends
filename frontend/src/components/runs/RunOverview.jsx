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
  LinearProgress
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
  Stop
} from '@mui/icons-material';
import { format } from 'date-fns';
import ManageTeamDialog from './ManageTeamDialog';

const API_BASE = 'http://localhost:4000/api';

export default function RunOverview({ runId, onEdit, onBack }) {
  const [run, setRun] = useState(null);
  const [route, setRoute] = useState(null);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showManageTeam, setShowManageTeam] = useState(false);

  useEffect(() => {
    if (runId) {
      fetchRunDetails();
    }
  }, [runId]);

  const fetchRunDetails = async () => {
    try {
      setLoading(true);
      const [runRes, routesRes, locationsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/runs/${runId}`),
        fetch(`${API_BASE}/routes`),
        fetch(`${API_BASE}/locations`),
        fetch(`${API_BASE}/users`)
      ]);

      const runData = await runRes.json();
      const routesData = await routesRes.json();
      const locationsData = await locationsRes.json();
      const usersData = await usersRes.json();

      if (runData.run) {
        setRun(runData.run);
        const routeInfo = routesData.routes?.find(r => r.id.toString() === runData.run.routeId.toString());
        setRoute(routeInfo);
        
        // Get locations for this route in correct order
        if (routeInfo && routeInfo.locationIds) {
          const routeLocations = routeInfo.locationIds.map(id => 
            locationsData.locations?.find(l => l.id.toString() === id.toString())
          ).filter(Boolean);
          setLocations(routeLocations);
        }
        
        setUsers(usersData.users || []);
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

  const getUserById = (id) => users.find(u => u.id.toString() === id.toString());
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
      await fetch(`${API_BASE}/runs/${runId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentLocationIndex: newIndex })
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

      const response = await fetch(`${API_BASE}/runs/${runId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('Status update successful');
      await fetchRunDetails();
    } catch (err) {
      console.error('Status update error:', err);
      setError('Failed to update status: ' + err.message);
    }
  };

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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {route?.name || 'Run Overview'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
          <Button onClick={() => onEdit(run.id)} variant="contained" startIcon={<Edit />}>
            Edit Run
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Team and Run Details */}
        <Grid item xs={12} md={6}>
          {/* Team Information */}
          <Card sx={{ mb: 3 }}>
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

          {/* Run Details */}
          <Card>
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
    </Box>
  );
}