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
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import IconButton from '@mui/material/IconButton';

export default function AddFriendForm({ onAdd, locations, routes }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filter locations by selected route
  const filteredLocations = selectedRouteId 
    ? locations.filter(loc => loc.routeId === Number(selectedRouteId))
    : locations.filter(loc => !loc.routeId); // Show unassigned locations when no route selected

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      const friendData = { 
        name: name.trim(), 
        phone: phone.trim(), 
        email: email.trim(), 
        notes: notes.trim() 
      };

      // If location is selected, pass it for initial history
      const initialLocationId = selectedLocationId ? Number(selectedLocationId) : null;
      
      onAdd(friendData, initialLocationId);
      
      // Reset form
      setName(""); 
      setPhone(""); 
      setEmail(""); 
      setNotes("");
      setSelectedRouteId("");
      setSelectedLocationId("");
      setIsOpen(false);
    }
  };

  // Reset location when route changes
  const handleRouteChange = (routeId) => {
    setSelectedRouteId(routeId);
    setSelectedLocationId(""); // Clear location selection
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
            <PersonAddIcon /> Add New Friend
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
          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            {/* Basic Info Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr', gap: 16, marginBottom: 16 }}>
              <TextField
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Friend's name"
                label="Name"
                variant="outlined"
                size="small"
                required
              />
              <TextField
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Phone number"
                label="Phone"
                variant="outlined"
                size="small"
              />
              <TextField
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                label="Email"
                variant="outlined"
                size="small"
                type="email"
              />
              <Button 
                type="submit" 
                variant="contained" 
                startIcon={<PersonAddIcon />}
                style={{ height: 40 }}
              >
                Add
              </Button>
            </div>
            
            {/* Location Selection Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <FormControl size="small">
                <InputLabel>Route (Optional)</InputLabel>
                <Select
                  value={selectedRouteId}
                  onChange={e => handleRouteChange(e.target.value)}
                  label="Route (Optional)"
                >
                  <MenuItem value="">No Route / Unassigned</MenuItem>
                  {routes.map(route => (
                    <MenuItem key={route.id} value={route.id}>
                      {route.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small">
                <InputLabel>Initial Location (Optional)</InputLabel>
                <Select
                  value={selectedLocationId}
                  onChange={e => setSelectedLocationId(e.target.value)}
                  label="Initial Location (Optional)"
                  disabled={!selectedRouteId && locations.filter(loc => !loc.routeId).length === 0}
                >
                  <MenuItem value="">No Location</MenuItem>
                  {filteredLocations.map(location => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            {/* Notes Row */}
            <TextField
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes about this friend..."
              label="Notes"
              variant="outlined"
              size="small"
              multiline
              rows={2}
              fullWidth
            />
          </form>
        )}
      </CardContent>
    </Card>
  );
}
