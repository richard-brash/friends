import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

const API_BASE = '/api';

export default function CreateRunForm({ onRunCreated, onCancel }) {
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    routeId: '',
    scheduledDate: new Date(),
    startTime: '',
    endTime: '',
    mealCount: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [routesRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE}/v2/routes`),
        axios.get(`${API_BASE}/users`)
      ]);
      
      const routesData = routesRes.data;
      const usersData = usersRes.data;
      
      setRoutes(routesData.data || routesData.routes || []);
      setUsers(usersData.users || []);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.routeId) {
      setError('Please select a route');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Format the date as YYYY-MM-DD
      const scheduledDate = formData.scheduledDate instanceof Date 
        ? formData.scheduledDate.toISOString().split('T')[0]
        : formData.scheduledDate;

      const response = await axios.post(`${API_BASE}/v2/runs`, {
        routeId: parseInt(formData.routeId),
        scheduledDate: scheduledDate,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        mealCount: formData.mealCount ? parseInt(formData.mealCount) : 0,
        notes: formData.notes || null
      });

      // V2 API returns { success: true, data: run }
      const newRun = response.data.data || response.data;
      onRunCreated(newRun);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError('Failed to create run: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectedRoute = routes.find(r => r.id.toString() === formData.routeId);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Schedule New Run
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          Run name will be auto-generated as: <strong>{`"{route_name} {day_of_week} {YYYY-MM-DD}"`}</strong>
        </Alert>

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
              <DateTimePicker
                label="Scheduled Date *"
                value={formData.scheduledDate}
                onChange={(newValue) => setFormData({...formData, scheduledDate: newValue})}
                renderInput={(params) => <TextField {...params} fullWidth required />}
                minDateTime={new Date()}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                InputLabelProps={{ shrink: true }}
                helperText="Optional"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                InputLabelProps={{ shrink: true }}
                helperText="Optional"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Number of Meals"
                value={formData.mealCount}
                onChange={(e) => setFormData({...formData, mealCount: e.target.value})}
                placeholder="0"
                helperText="Total meals to deliver"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
