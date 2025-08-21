import React, { useState } from "react";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import IconButton from '@mui/material/IconButton';

export default function AddRouteForm({ onAdd }) {
  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
      setIsOpen(false); // Close form after adding
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
            <AddIcon /> Add New Route
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
                <Grid item xs={12} sm={8} md={9}>
                  <TextField
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="New route name"
                    label="Route Name"
                    variant="outlined"
                    size="small"
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    sx={{ height: 40 }}
                    fullWidth
                  >
                    Add Route
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
