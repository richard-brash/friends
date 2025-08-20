import React, { useState } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import AddLocationIcon from '@mui/icons-material/AddLocation';

export default function InlineAddLocationForm({ onAdd, routeId, routeName }) {
  const [desc, setDesc] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (desc.trim()) {
      onAdd({ 
        description: desc.trim(), 
        notes: notes.trim(), 
        routeId: routeId || null 
      });
      setDesc(""); 
      setNotes("");
    }
  };

  const buttonText = routeName ? `Add Location to ${routeName}` : 'Add Location';

  return (
    <Box 
      style={{ 
        marginTop: 12, 
        padding: 12, 
        backgroundColor: '#fafafa', 
        border: '1px dashed #ccc',
        borderRadius: 8 
      }}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: 12, alignItems: 'flex-end' }}>
          <TextField
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Location description"
            label="Description"
            variant="outlined"
            size="small"
            required
          />
          <TextField
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes"
            label="Notes"
            variant="outlined"
            size="small"
          />
          <Button 
            type="submit" 
            variant="contained" 
            size="small"
            startIcon={<AddLocationIcon />}
          >
            {buttonText}
          </Button>
        </div>
      </form>
    </Box>
  );
}
