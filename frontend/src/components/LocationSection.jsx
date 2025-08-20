import React, { useState } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, IconButton, ListItemText, Select, MenuItem, Accordion, AccordionSummary, AccordionDetails, Badge } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import Tooltip from '@mui/material/Tooltip';

export default function LocationSection({ locations, routes, refreshAll, setError, showToast }) {
  const [newDesc, setNewDesc] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newRouteId, setNewRouteId] = useState("");
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingDesc, setEditingDesc] = useState("");
  const [editingNotes, setEditingNotes] = useState("");
  const [editingRouteId, setEditingRouteId] = useState("");
  const [error, setLocalError] = useState("");
  const [expanded, setExpanded] = useState('noroute');

    // Save edits to a location (now inside component)
    const handleSave = (loc, overrideRouteId) => {
      setLocalError("");
      const patchBody = {
        description: editingDesc,
        notes: editingNotes
      };
      const routeIdToUse = overrideRouteId !== undefined ? overrideRouteId : editingRouteId;
      if (routeIdToUse) {
        patchBody.routeId = routeIdToUse;
      } else {
        patchBody.routeId = null;
      }
      fetch(`/api/locations/${loc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody)
      })
        .then(res => res.json())
        .then(data => {
          if (data.location) {
            setEditingId(null);
            setEditingDesc("");
            setEditingNotes("");
            setEditingRouteId("");
            refreshAll();
            if (showToast) showToast('Location updated');
          } else {
            setLocalError(data.error || 'Error saving location');
          }
        })
        .catch(() => setLocalError('Error saving location'));
    };

    // Edit a location
    const handleEdit = (loc) => {
      setEditingId(loc.id);
      setEditingDesc(loc.description);
      setEditingNotes(loc.notes);
      setEditingRouteId(loc.routeId || "");
    };
    // Delete a location
    const handleDelete = (id) => {
      fetch(`/api/locations/${id}`, { method: 'DELETE' })
        .then(() => {
          refreshAll();
          if (showToast) showToast('Location deleted');
        });
    };
    const handleAdd = async e => {
      e.preventDefault();
      setError("");
      setLocalError("");
      let routeId = newRouteId;
      let finalRouteId = routeId;
      if (showAddRoute && newRouteName) {
        // Create new route first
        const res = await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newRouteName, locationIds: [] })
        });
        const data = await res.json();
        if (data.route) {
          finalRouteId = data.route.id;
        } else {
          setError(data.error || 'Error creating route');
          setLocalError(data.error || 'Error creating route');
          return;
        }
      }
      fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDesc, notes: newNotes, routeId: finalRouteId || undefined })
      })
        .then(res => res.json())
        .then(data => {
          if (data.location) {
            setNewDesc("");
            setNewNotes("");
            setNewRouteId("");
            setShowAddRoute(false);
            setNewRouteName("");
            refreshAll();
            if (showToast) showToast('Location added');
          } else {
            setError(data.error || 'Error adding location');
            setLocalError(data.error || 'Error adding location');
          }
        })
        .catch(() => { setError('Error adding location'); setLocalError('Error adding location'); });
    };

    // Group locations by routeId
    const locationsByRoute = {};
    locations.forEach(loc => {
      const key = loc.routeId || 'noroute';
      if (!locationsByRoute[key]) locationsByRoute[key] = [];
      locationsByRoute[key].push(loc);
    });

    // Prepare route order: no route first, then by route order
    const routeOrder = ['noroute', ...routes.map(r => r.id)];

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Locations</Typography>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <TextField size="small" value={newDesc} onChange={e => setNewDesc(e.target.value)} label="New location" sx={{ flex: 1 }} required />
          <TextField size="small" value={newNotes} onChange={e => setNewNotes(e.target.value)} label="Notes" sx={{ flex: 2 }} />
          <Select
            size="small"
            value={showAddRoute ? '__new__' : (newRouteId || '')}
            onChange={e => {
              if (e.target.value === '__new__') {
                setShowAddRoute(true);
                setNewRouteId("");
              } else {
                setShowAddRoute(false);
                setNewRouteId(e.target.value);
              }
            }}
            displayEmpty
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">No route</MenuItem>
            {routes.map(r => (
              <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
            ))}
            <MenuItem value="__new__">Add new route...</MenuItem>
          </Select>
          {showAddRoute && (
            <TextField size="small" value={newRouteName} onChange={e => setNewRouteName(e.target.value)} label="New route name" sx={{ flex: 1 }} required />
          )}
          <Button type="submit" variant="contained">Add</Button>
        </form>
        {routeOrder.map(routeId => {
          const locs = locationsByRoute[routeId] || [];
          if (locs.length === 0) return null;
          const route = routeId === 'noroute' ? null : routes.find(r => r.id === routeId);
          const label = route ? route.name : 'No Route';
          return (
            <Accordion key={routeId} expanded={expanded === routeId} onChange={(_, isExp) => setExpanded(isExp ? routeId : false)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ flex: 1 }}>{label}</Typography>
                {expanded !== routeId && (
                  <Badge color="primary" badgeContent={locs.length} sx={{ ml: 2 }} />
                )}
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {locs.map(loc => {
                    return (
                      <ListItem key={loc.id} sx={{ borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}
                        secondaryAction={
                          editingId === loc.id ? null : (
                            <Box>
                              <IconButton size="small" onClick={() => handleEdit(loc)}><EditIcon fontSize="small" /></IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDelete(loc.id)}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                          )
                        }
                      >
                        {editingId === loc.id ? (
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                              <TextField size="small" value={editingDesc} onChange={e => setEditingDesc(e.target.value)} label="Description" sx={{ flex: 1 }} autoFocus />
                              <TextField size="small" value={editingNotes} onChange={e => setEditingNotes(e.target.value)} label="Notes" sx={{ flex: 2 }} />
                              <Select
                                size="small"
                                value={editingRouteId || ''}
                                onChange={e => {
                                  const newRouteId = e.target.value;
                                  setEditingRouteId(newRouteId);
                                  // Autosave route change with correct value
                                  handleSave(loc, newRouteId);
                                }}
                                displayEmpty
                                sx={{ minWidth: 180 }}
                              >
                                <MenuItem value="">No route</MenuItem>
                                {routes.map(r => (
                                  <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                                ))}
                              </Select>
                              <Tooltip title="Done editing" arrow>
                                <IconButton size="small" onClick={() => { handleSave(loc); setEditingId(null); }}>
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle1">{loc.description}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary" component="span">{loc.notes}</Typography>
                            </Box>
                          </Box>
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}
        <Box>
          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </Box>
    );
}



import React, { useState } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, IconButton, ListItemText, Select, MenuItem, Accordion, AccordionSummary, AccordionDetails, Badge } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import Tooltip from '@mui/material/Tooltip';

export default function LocationSection({ locations, routes, refreshAll, setError, showToast }) {
  const [newDesc, setNewDesc] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newRouteId, setNewRouteId] = useState("");
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingDesc, setEditingDesc] = useState("");
  const [editingNotes, setEditingNotes] = useState("");
  const [editingRouteId, setEditingRouteId] = useState("");
  const [error, setLocalError] = useState("");
  const [expanded, setExpanded] = useState('noroute');

    // Save edits to a location (now inside component)
    const handleSave = (loc, overrideRouteId) => {
      setLocalError("");
      const patchBody = {
        description: editingDesc,
        notes: editingNotes
      };
      const routeIdToUse = overrideRouteId !== undefined ? overrideRouteId : editingRouteId;
      if (routeIdToUse) {
        patchBody.routeId = routeIdToUse;
      } else {
        patchBody.routeId = null;
      }
      fetch(`/api/locations/${loc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody)
      })
        .then(res => res.json())
        .then(data => {
          if (data.location) {
            setEditingId(null);
            setEditingDesc("");
            setEditingNotes("");
            setEditingRouteId("");
            refreshAll();
            if (showToast) showToast('Location updated');
          } else {
            setLocalError(data.error || 'Error saving location');
          }
        })
        .catch(() => setLocalError('Error saving location'));
    };

    // Edit a location
    const handleEdit = (loc) => {
      setEditingId(loc.id);
      setEditingDesc(loc.description);
      setEditingNotes(loc.notes);
      setEditingRouteId(loc.routeId || "");
    };
    // Delete a location
    const handleDelete = (id) => {
      fetch(`/api/locations/${id}`, { method: 'DELETE' })
        .then(() => {
          refreshAll();
          if (showToast) showToast('Location deleted');
        });
    };
    const handleAdd = async e => {
      e.preventDefault();
      setError("");
      setLocalError("");
      let routeId = newRouteId;
      let finalRouteId = routeId;
      if (showAddRoute && newRouteName) {
        // Create new route first
        const res = await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newRouteName, locationIds: [] })
        });
        const data = await res.json();
        if (data.route) {
          finalRouteId = data.route.id;
        } else {
          setError(data.error || 'Error creating route');
          setLocalError(data.error || 'Error creating route');
          return;
        }
      }
      fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDesc, notes: newNotes, routeId: finalRouteId || undefined })
      })
        .then(res => res.json())
        .then(data => {
          if (data.location) {
            setNewDesc("");
            setNewNotes("");
            setNewRouteId("");
            setShowAddRoute(false);
            setNewRouteName("");
            refreshAll();
            if (showToast) showToast('Location added');
          } else {
            setError(data.error || 'Error adding location');
            setLocalError(data.error || 'Error adding location');
          }
        })
        .catch(() => { setError('Error adding location'); setLocalError('Error adding location'); });
    };

    // Group locations by routeId
    const locationsByRoute = {};
    locations.forEach(loc => {
      const key = loc.routeId || 'noroute';
      if (!locationsByRoute[key]) locationsByRoute[key] = [];
      locationsByRoute[key].push(loc);
    });

    // Prepare route order: no route first, then by route order
    const routeOrder = ['noroute', ...routes.map(r => r.id)];

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Locations</Typography>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <TextField size="small" value={newDesc} onChange={e => setNewDesc(e.target.value)} label="New location" sx={{ flex: 1 }} required />
          <TextField size="small" value={newNotes} onChange={e => setNewNotes(e.target.value)} label="Notes" sx={{ flex: 2 }} />
          <Select
            size="small"
            value={showAddRoute ? '__new__' : (newRouteId || '')}
            onChange={e => {
              if (e.target.value === '__new__') {
                setShowAddRoute(true);
                setNewRouteId("");
              } else {
                setShowAddRoute(false);
                setNewRouteId(e.target.value);
              }
            }}
            displayEmpty
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">No route</MenuItem>
            {routes.map(r => (
              <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
            ))}
            <MenuItem value="__new__">Add new route...</MenuItem>
          </Select>
          {showAddRoute && (
            <TextField size="small" value={newRouteName} onChange={e => setNewRouteName(e.target.value)} label="New route name" sx={{ flex: 1 }} required />
          )}
          <Button type="submit" variant="contained">Add</Button>
        </form>
        {routeOrder.map(routeId => {
          const locs = locationsByRoute[routeId] || [];
          if (locs.length === 0) return null;
          const route = routeId === 'noroute' ? null : routes.find(r => r.id === routeId);
          const label = route ? route.name : 'No Route';
          return (
            <Accordion key={routeId} expanded={expanded === routeId} onChange={(_, isExp) => setExpanded(isExp ? routeId : false)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ flex: 1 }}>{label}</Typography>
                {expanded !== routeId && (
                  <Badge color="primary" badgeContent={locs.length} sx={{ ml: 2 }} />
                )}
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {locs.map(loc => {
                    return (
                      <ListItem key={loc.id} sx={{ borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}
                        secondaryAction={
                          editingId === loc.id ? null : (
                            <Box>
                              <IconButton size="small" onClick={() => handleEdit(loc)}><EditIcon fontSize="small" /></IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDelete(loc.id)}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                          )
                        }
                      >
                        {editingId === loc.id ? (
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                              <TextField size="small" value={editingDesc} onChange={e => setEditingDesc(e.target.value)} label="Description" sx={{ flex: 1 }} autoFocus />
                              <TextField size="small" value={editingNotes} onChange={e => setEditingNotes(e.target.value)} label="Notes" sx={{ flex: 2 }} />
                              <Select
                                size="small"
                                value={editingRouteId || ''}
                                onChange={e => {
                                  const newRouteId = e.target.value;
                                  setEditingRouteId(newRouteId);
                                  // Autosave route change with correct value
                                  handleSave(loc, newRouteId);
                                }}
                                displayEmpty
                                sx={{ minWidth: 180 }}
                              >
                                <MenuItem value="">No route</MenuItem>
                                {routes.map(r => (
                                  <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                                ))}
                              </Select>
                              <Tooltip title="Done editing" arrow>
                                <IconButton size="small" onClick={() => { handleSave(loc); setEditingId(null); }}>
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle1">{loc.description}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary" component="span">{loc.notes}</Typography>
                            </Box>
                          </Box>
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}
        <Box>
          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </Box>
    );
}
