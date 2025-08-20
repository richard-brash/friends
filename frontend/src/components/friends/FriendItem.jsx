import React, { useState } from "react";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HistoryIcon from '@mui/icons-material/History';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

export default function FriendItem({ friend, locations, routes, onEditFriend, onDeleteFriend, onAddLocationHistory }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(true); // For collapsing friend card
  const [editData, setEditData] = useState({
    name: friend.name,
    phone: friend.phone || "",
    email: friend.email || "",
    notes: friend.notes || ""
  });
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newRouteId, setNewRouteId] = useState("");
  const [newLocationId, setNewLocationId] = useState("");
  const [newLocationNotes, setNewLocationNotes] = useState("");
  const [newLocationDate, setNewLocationDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter locations by selected route
  const filteredLocations = newRouteId 
    ? locations.filter(loc => loc.routeId === Number(newRouteId))
    : locations.filter(loc => !loc.routeId);

  const handleSave = () => {
    onEditFriend(friend.id, editData);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: friend.name,
      phone: friend.phone || "",
      email: friend.email || "",
      notes: friend.notes || ""
    });
    setEditing(false);
  };

  const handleAddLocation = (e) => {
    e.preventDefault();
    if (newLocationId) {
      onAddLocationHistory(friend.id, Number(newLocationId), newLocationNotes, newLocationDate + 'T12:00:00.000Z');
      setNewRouteId("");
      setNewLocationId("");
      setNewLocationNotes("");
      setNewLocationDate(new Date().toISOString().split('T')[0]);
      setShowAddLocation(false);
    }
  };

  // Reset location when route changes
  const handleRouteChange = (routeId) => {
    setNewRouteId(routeId);
    setNewLocationId(""); // Clear location selection
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardContent>
        {/* Friend Header */}
        <Box style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <Box style={{ flex: 1 }}>
            {editing ? (
              <Box style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: 16, marginBottom: 16 }}>
                <TextField
                  value={editData.name}
                  onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  label="Name"
                  size="small"
                  required
                />
                <TextField
                  value={editData.phone}
                  onChange={e => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                  label="Phone"
                  size="small"
                />
                <TextField
                  value={editData.email}
                  onChange={e => setEditData(prev => ({ ...prev, email: e.target.value }))}
                  label="Email"
                  size="small"
                  type="email"
                />
              </Box>
            ) : (
              <>
                <Typography 
                  variant="h6" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? '▼' : '▶'} <PersonIcon /> {friend.name}
                </Typography>
                <Box style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  {friend.phone && (
                    <Typography variant="body2" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#666' }}>
                      <PhoneIcon fontSize="small" /> {friend.phone}
                    </Typography>
                  )}
                  {friend.email && (
                    <Typography variant="body2" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#666' }}>
                      <EmailIcon fontSize="small" /> {friend.email}
                    </Typography>
                  )}
                </Box>
              </>
            )}

            {/* Last Known Location */}
            {/* Removed - now shown in accordion header instead */}
          </Box>

          {/* Action Buttons */}
          <Box style={{ display: 'flex', gap: 8 }}>
            {editing ? (
              <>
                <IconButton onClick={handleSave} color="primary" size="small">
                  <SaveIcon />
                </IconButton>
                <IconButton onClick={handleCancel} size="small">
                  <CancelIcon />
                </IconButton>
              </>
            ) : (
              <>
                <IconButton onClick={() => setEditing(true)} size="small">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => onDeleteFriend(friend.id)} color="error" size="small">
                  <DeleteIcon />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Notes and Location History - only show when expanded */}
        {expanded && (
          <>
            {/* Notes */}
            {editing ? (
              <TextField
                value={editData.notes}
                onChange={e => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                label="Notes"
                multiline
                rows={2}
                fullWidth
                size="small"
              />
            ) : (
              friend.notes && (
                <Typography variant="body2" style={{ marginBottom: 16, color: '#666', fontStyle: 'italic' }}>
                  {friend.notes}
                </Typography>
              )
            )}

            {/* Location History - Always show this section */}
            <Accordion style={{ marginTop: 16 }}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                style={{ backgroundColor: '#e3f2fd', borderRadius: '4px 4px 0 0' }}
              >
                <Typography style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1976d2', fontWeight: 500 }}>
                  <LocationOnIcon /> 
                  {friend.locationHistory && friend.locationHistory.length > 0 
                    ? `Last seen: ${friend.locationHistory[0]?.locationName} (${formatDate(friend.locationHistory[0]?.dateRecorded)})`
                    : 'No recent location'
                  }
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {friend.locationHistory && friend.locationHistory.length > 0 ? (
                    friend.locationHistory
                      .sort((a, b) => new Date(b.dateRecorded) - new Date(a.dateRecorded))
                      .map((entry, index) => (
                        <Box 
                          key={entry.id || index} 
                          style={{ 
                            padding: 12, 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 4, 
                            marginBottom: 8,
                            backgroundColor: index === 0 ? '#e3f2fd' : 'white'
                          }}
                        >
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Typography variant="body2" style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                              <LocationOnIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              {entry.locationName} - {formatDate(entry.dateRecorded)}
                            </Typography>
                            {index === 0 && <Chip label="Most Recent" size="small" />}
                          </Box>
                          {entry.notes && (
                            <Typography variant="body2" style={{ color: '#666', marginTop: 4 }}>
                              {entry.notes}
                            </Typography>
                          )}
                        </Box>
                      ))
                  ) : (
                    <Typography variant="body2" style={{ color: '#666', fontStyle: 'italic', marginBottom: 16 }}>
                      No location history yet. Add the first location below.
                    </Typography>
                  )}
                
                  {/* Add Location History */}
                  {showAddLocation && (
                    <Box style={{ marginTop: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                      <Typography variant="subtitle2" style={{ marginBottom: 12 }}>
                        Add Location History
                      </Typography>
                      <form onSubmit={handleAddLocation}>
                        <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                          <FormControl size="small">
                            <InputLabel>Route</InputLabel>
                            <Select
                              value={newRouteId}
                              onChange={e => handleRouteChange(e.target.value)}
                              label="Route"
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
                            <InputLabel>Location</InputLabel>
                            <Select
                              value={newLocationId}
                              onChange={e => setNewLocationId(e.target.value)}
                              label="Location"
                              required
                              disabled={!newRouteId && filteredLocations.length === 0}
                            >
                              <MenuItem value="">Select Location</MenuItem>
                              {filteredLocations.map(location => (
                                <MenuItem key={location.id} value={location.id}>
                                  {location.description}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                        <Box style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
                          <TextField
                            value={newLocationNotes}
                            onChange={e => setNewLocationNotes(e.target.value)}
                            label="Notes"
                            size="small"
                          />
                          <TextField
                            value={newLocationDate}
                            onChange={e => setNewLocationDate(e.target.value)}
                            label="Date"
                            type="date"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                          <Button type="submit" variant="contained" size="small">
                            Add
                          </Button>
                        </Box>
                      </form>
                      <Button 
                        onClick={() => setShowAddLocation(false)} 
                        size="small" 
                        style={{ marginTop: 8 }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}

                  {/* Add Location Button */}
                  {!showAddLocation && (
                    <Button
                      onClick={() => setShowAddLocation(true)}
                      startIcon={<AddLocationIcon />}
                      variant="outlined"
                      size="small"
                      style={{ marginTop: 12 }}
                    >
                      Add Location History
                    </Button>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </>
        )}

      </CardContent>
    </Card>
  );
}
