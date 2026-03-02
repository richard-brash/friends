import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, PlayArrow as StartIcon } from '@mui/icons-material';
import { runsAPI } from '../api/client';

export default function Runs() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const response = await runsAPI.getAll();
      // Backend returns { data: [...], pagination: {...} }
      const runsData = Array.isArray(response.data.data) ? response.data.data : [];
      setRuns(runsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load runs');
      setRuns([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planned': return 'default';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
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
          Runs
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Create Run
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {runs.map((run) => (
          <Grid item xs={12} sm={6} md={4} key={run.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Typography variant="h6" component="h2">
                    {run.name}
                  </Typography>
                  <Chip label={run.status} size="small" color={getStatusColor(run.status)} />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {run.routeName}
                </Typography>
                <Typography variant="body2">
                  {formatDate(run.scheduledDate)}
                </Typography>
                {run.mealCount > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    🍽️ {run.mealCount} meals
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                {run.status === 'planned' && (
                  <Button size="small" startIcon={<StartIcon />}>
                    Prepare
                  </Button>
                )}
                {run.status === 'in_progress' && (
                  <Button size="small" variant="contained" startIcon={<StartIcon />}>
                    Continue
                  </Button>
                )}
                <Button size="small">View</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {runs.length === 0 && !error && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No runs yet
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }}>
            Create Your First Run
          </Button>
        </Box>
      )}
    </Container>
  );
}
