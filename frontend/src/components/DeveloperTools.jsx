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

const API_BASE = 'http://localhost:4000/api';

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

  const clearAllData = async () => {
    if (!window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/seed`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        showMessage('All data cleared successfully', 'success');
        // Refresh the page to show empty state
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const error = await response.json();
        showMessage(`Failed to clear data: ${error.error}`, 'error');
      }
    } catch (error) {
      showMessage(`Error clearing data: ${error.message}`, 'error');
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
          {loading ? 'Loading...' : '🔄 Load Sample Data'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={clearAllData}
          disabled={loading}
          color="warning"
          size="small"
        >
          🗑️ Clear All Data
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
        💡 Sample data includes realistic friends, locations, routes, runs, and requests for demonstration purposes.
      </Typography>
    </Paper>
  );
}
