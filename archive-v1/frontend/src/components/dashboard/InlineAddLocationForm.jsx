import React, { useState } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import AddLocationIcon from '@mui/icons-material/AddLocation';

export default function InlineAddLocationForm({ onAdd, routeId, routeName }) {
  const [desc, setDesc] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (desc.trim()) {
      onAdd({ 
        name: desc.trim(),              // Map description to name
        address: null,                  // No address field in this simple form
        type: 'Service Location',       // Default type for locations added via routes
        notes: notes.trim() || null,    // Notes if provided
        coordinates: null,              // No coordinates in this simple form
        routeId: routeId || null        // Route assignment
      });
      setDesc(""); 
      setNotes("");
    }
  };

  const buttonText = routeName ? `Add Location to ${routeName}` : 'Add Location';

  return (
    <Box 
      sx={{ 
        mt: 1.5, 
        p: 1.5, 
        backgroundColor: '#fafafa', 
        border: '1px dashed #ccc',
        borderRadius: 1
      }}
    >
      <form onSubmit={handleSubmit}>
        <Grid container spacing={1.5} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Location description"
              label="Description"
              variant="outlined"
              size="small"
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes"
              label="Notes"
              variant="outlined"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button 
              type="submit" 
              variant="contained" 
              size="small"
              startIcon={<AddLocationIcon />}
              fullWidth
            >
              {buttonText}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
