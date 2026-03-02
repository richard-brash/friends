import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { requestsAPI } from '../api/client';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await requestsAPI.getAll();
      const requestsData = Array.isArray(response.data.data) ? response.data.data : [];
      setRequests(requestsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'ready_for_delivery': return 'info';
      case 'taken': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Requests
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Request
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {requests.map((request) => (
          <Grid item xs={12} sm={6} md={4} key={request.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    {request.friendName}
                  </Typography>
                  <Chip
                    label={getStatusLabel(request.status)}
                    size="small"
                    color={getStatusColor(request.status)}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {request.itemDescription}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  📍 {request.locationName}
                </Typography>
                {request.notes && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                    {request.notes}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {requests.length === 0 && !error && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No requests yet
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }}>
            Create Your First Request
          </Button>
        </Box>
      )}
    </Container>
  );
}
