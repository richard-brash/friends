import React, { useState } from "react";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import IconButton from '@mui/material/IconButton';

export default function AddLocationForm({ onAdd, routes }) {
  const [desc, setDesc] = useState("");
  const [notes, setNotes] = useState("");
  const [routeId, setRouteId] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (desc.trim()) {
      let parsedRouteId = routeId === "" ? null : Number(routeId);
      onAdd({ description: desc.trim(), notes: notes.trim(), routeId: parsedRouteId });
      setDesc(""); 
      setNotes(""); 
      setRouteId("");
      // Don't close form - keep it open for adding more locations
      // setIsOpen(false); // Removed this line
    }
  };

  return (
    <Card style={{ marginBottom: 24, backgroundColor: '#f8f9fa', border: '2px dashed #dee2e6' }}>
      <CardContent style={{ paddingBottom: isOpen ? 16 : 8 }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: isOpen ? 'default' : 'pointer'
          }}
          onClick={() => !isOpen && setIsOpen(true)}
        >
          <Typography variant="h6" style={{ color: '#495057', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AddLocationIcon /> Add New Location
          </Typography>
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }} 
            size="small"
            style={{ color: '#495057' }}
          >
            {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </div>
        
        {isOpen && (
          <Box sx={{ mt: 2 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="Description"
                    label="Description"
                    variant="outlined"
                    size="small"
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
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
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Route</InputLabel>
                    <Select
                      value={routeId}
                      onChange={e => setRouteId(e.target.value)}
                      label="Route"
                    >
                      <MenuItem value="">No Route</MenuItem>
                      {routes.map(r => (
                        <MenuItem key={`add-form-route-${r.id}`} value={r.id}>
                          {r.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    startIcon={<AddLocationIcon />}
                    sx={{ height: 40 }}
                    fullWidth
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
