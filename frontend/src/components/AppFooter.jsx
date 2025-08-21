import React from 'react';
import { Box, Typography } from '@mui/material';

function Footer() {
  return (
    <Box 
      component="footer" 
      sx={{ 
        mt: 4, 
        py: 2, 
        px: 2, 
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        textAlign: 'center'
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} BrashTEK. All rights reserved.
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Friends CRM v0.1.2
      </Typography>
    </Box>
  );
}

export default Footer;
