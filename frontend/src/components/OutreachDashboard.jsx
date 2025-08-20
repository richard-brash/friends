import React, { useState } from 'react';
import { Box, Typography, Snackbar, Alert } from '@mui/material';
import DashboardContainer from './dashboard';

export default function OutreachDashboard() {
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Outreach Dashboard</Typography>
      <DashboardContainer setError={setError} showToast={showToast} />
      {error && <Typography color="error">{error}</Typography>}
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast(t => ({ ...t, open: false }))} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
