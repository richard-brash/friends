import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const API_BASE = 'http://localhost:4000/api';

export default function CreateRunForm({ onRunCreated, onCancel }) {
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    routeId: '',
    leadId: '',
    scheduledDate: new Date(),
    mealsCount: '',
    coordinatorNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [routesRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/routes`),
        fetch(`${API_BASE}/users`)
      ]);
      
      const routesData = await routesRes.json();
      const usersData = await usersRes.json();
      
      setRoutes(routesData.routes || []);
      setUsers(usersData.users || []);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.routeId || !formData.leadId || !formData.mealsCount) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          coordinatorId: '2', // TODO: Get from current user context
          assignedUserIds: [formData.leadId], // Lead is initially assigned
          mealsCount: parseInt(formData.mealsCount),
          scheduledDate: formData.scheduledDate.toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        onRunCreated(result);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to create run');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedRoute = routes.find(r => r.id.toString() === formData.routeId);
  const eligibleLeads = users.filter(u => 
    u.permissions && (u.permissions.includes('lead_runs') || u.permissions.includes('coordinate_runs'))
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Schedule New Run
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Route</InputLabel>
                <Select
                  value={formData.routeId}
                  onChange={(e) => setFormData({...formData, routeId: e.target.value})}
                  label="Select Route"
                >
                  {routes.map(route => (
                    <MenuItem key={route.id} value={route.id}>
                      {route.name} ({route.locationIds?.length || 0} locations)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Assign Lead</InputLabel>
                <Select
                  value={formData.leadId}
                  onChange={(e) => setFormData({...formData, leadId: e.target.value})}
                  label="Assign Lead"
                >
                  {eligibleLeads.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Scheduled Date & Time *"
                value={formData.scheduledDate}
                onChange={(newValue) => setFormData({...formData, scheduledDate: newValue})}
                renderInput={(params) => <TextField {...params} fullWidth required />}
                minDateTime={new Date()}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number of Meals"
                type="number"
                required
                value={formData.mealsCount}
                onChange={(e) => setFormData({...formData, mealsCount: e.target.value})}
                inputProps={{ min: 1, max: 200 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Coordinator Notes"
                multiline
                rows={3}
                value={formData.coordinatorNotes}
                onChange={(e) => setFormData({...formData, coordinatorNotes: e.target.value})}
                placeholder="Instructions for the team, special considerations, goals for this run..."
              />
            </Grid>

            {selectedRoute && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Route Preview: {selectedRoute.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRoute.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Estimated Duration: {selectedRoute.estimatedDuration} minutes
                    </Typography>
                    <Typography variant="body2">
                      Locations: {selectedRoute.locationIds?.length || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Schedule Run'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </LocalizationProvider>
  );
}