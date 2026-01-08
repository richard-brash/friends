import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';

const API_BASE = '/api';

export default function DeveloperTools() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'success', 'error', 'info'

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const loadSampleData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        showMessage(
          `Sample data loaded: ${Object.entries(result.data)
            .map(([key, count]) => `${count} ${key}`)
            .join(', ')}`, 
          'success'
        );
        // Refresh the page to show new data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const error = await response.json();
        showMessage(`Failed to load sample data: ${error.error}`, 'error');
      }
    } catch (error) {
      showMessage(`Error loading sample data: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetDatabase = async () => {
    if (!window.confirm('Are you sure you want to reset the entire database? This will delete ALL data and reload sample data. This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        showMessage('Database reset and reseeded successfully!', 'success');
        // Refresh the page to show new data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const error = await response.json();
        showMessage(`Failed to reset database: ${error.error}`, 'error');
      }
    } catch (error) {
      showMessage(`Error resetting database: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/health`);
      const result = await response.json();
      
      if (response.ok) {
        showMessage(
          `Database Status: ${result.database} | Environment: ${result.environment} | Time: ${result.timestamp}`, 
          result.database === 'connected' ? 'success' : 'error'
        );
      } else {
        showMessage('Failed to check database health', 'error');
      }
    } catch (error) {
      showMessage(`Error checking database: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 2, bgcolor: 'grey.50', border: '1px dashed grey.300' }}>
      <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
        🔧 Developer Tools
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        These tools help you quickly test the application with sample data or reset to a clean state.
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="contained"
          onClick={loadSampleData}
          disabled={loading}
          color="primary"
          size="small"
        >
          {loading ? 'Loading...' : '🌱 Seed Database'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={resetDatabase}
          disabled={loading}
          color="warning"
          size="small"
        >
          � Reset Database
        </Button>

        <Button
          variant="outlined"
          onClick={checkDatabaseHealth}
          disabled={loading}
          color="info"
          size="small"
        >
          🏥 Health Check
        </Button>

        {loading && (
          <CircularProgress size={20} />
        )}
      </Box>

      {message && (
        <Alert severity={messageType} sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        💡 <strong>Seed Database:</strong> Adds sample data to current database<br />
        🔄 <strong>Reset Database:</strong> Completely wipes and recreates all tables with fresh sample data<br />
        🏥 <strong>Health Check:</strong> Tests database connectivity and shows system status
      </Typography>
    </Paper>
  );
}
