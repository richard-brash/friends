// Inline note editing for locations in route editing
import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, IconButton, ListItemText, MenuItem, Select } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import Tooltip from '@mui/material/Tooltip';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

function InlineAddLocation({ onAdd }) {
  const [desc, setDesc] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc, notes })
    });
    const data = await res.json();
    setLoading(false);
    if (data.location) {
      setDesc("");
      setNotes("");
      onAdd(data.location);
    } else {
      setError(data.error || 'Error adding location');
    }
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <TextField size="small" value={desc} onChange={e => setDesc(e.target.value)} label="New location" required sx={{ width: 120 }} />
      <TextField size="small" value={notes} onChange={e => setNotes(e.target.value)} label="Notes" sx={{ width: 160 }} />
      <Button type="submit" size="small" variant="outlined" disabled={loading}>Add</Button>
      {error && <Typography color="error" variant="caption">{error}</Typography>}
    </form>
  );
}

export default function RouteSection({ locations, routes, refreshAll, setError, showToast }) {
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteValue, setEditingNoteValue] = useState("");
  const [noteEditLoading, setNoteEditLoading] = useState(false);
  // locations and routes are now passed as props from parent
  const [newName, setNewName] = useState("");
  const [newLocationIds, setNewLocationIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingLocationIds, setEditingLocationIds] = useState([]);

  // fetching handled by parent

  const handleAdd = e => {
    e.preventDefault();
    setError("");
    fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, locationIds: newLocationIds })
    })
      .then(res => res.json())
      .then(data => {
        if (data.route) {
          setNewName("");
          setNewLocationIds([]);
          refreshAll();
          if (showToast) showToast('Route added');
        } else {
          setError(data.error || 'Error adding route');
        }
      })
      .catch(() => setError('Error adding route'));
  };

  const handleEdit = (route) => {
    setEditingId(route.id);
    setEditingName(route.name);
    setEditingLocationIds(route.locationIds);
  };

  // Keep editingLocationIds in sync with backend if locations/routes change while editing
  useEffect(() => {
    if (editingId) {
      const route = routes.find(r => r.id === editingId);
      if (route) {
        setEditingLocationIds(route.locationIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, routes]);
  const handleSave = (route) => {
    fetch(`/api/routes/${route.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName, locationIds: editingLocationIds })
    })
      .then(res => res.json())
      .then(data => {
        setEditingId(null);
        setEditingName("");
        setEditingLocationIds([]);
        refreshAll();
        if (showToast) showToast('Route updated');
      });
  };
  const handleDelete = (id) => {
    fetch(`/api/routes/${id}`, { method: 'DELETE' })
      .then(() => {
        refreshAll();
        if (showToast) showToast('Route deleted');
      });
  };

  // Reorder locations in a route
  const moveLocation = (arr, from, to) => {
    const copy = [...arr];
    const val = copy.splice(from, 1)[0];
    copy.splice(to, 0, val);
    return copy;
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Routes</Typography>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <TextField size="small" value={newName} onChange={e => setNewName(e.target.value)} label="New route name" sx={{ flex: 1 }} required />
        <Button type="submit" variant="contained">Add</Button>
      </form>
      <List>
        {routes.map(route => (
          <ListItem key={route.id} sx={{ borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
            {editingId === route.id ? (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={() => {
                      // Autosave route name only
                      fetch(`/api/routes/${route.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: editingName })
                      })
                        .then(() => {
                          refreshAll();
                          if (showToast) showToast('Route name updated');
                        });
                    }}
                    label="Route name"
                    sx={{ flex: 1 }}
                    autoFocus
                  />
                  <Tooltip title="Done editing" arrow>
                    <IconButton size="small" onClick={() => setEditingId(null)}><CheckIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="subtitle2">Locations (reorder, add, or remove):</Typography>
                <List sx={{ pl: 2 }}>
                  {editingLocationIds.map((id, idx) => {
                    const loc = locations.find(l => l.id === id);
                    if (!loc) return null;
                    return (
                      <ListItem key={id} sx={{ pl: 0 }}
                        secondaryAction={
                          <Box>
                            <IconButton size="small" disabled={idx === 0} onClick={() => {
                              const newIds = moveLocation(editingLocationIds, idx, idx - 1);
                              setEditingLocationIds(newIds);
                              fetch(`/api/routes/${route.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: editingName, locationIds: newIds })
                              })
                                .then(() => {
                                  refreshAll();
                                  if (showToast) showToast('Route updated');
                                });
                            }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                            <IconButton size="small" disabled={idx === editingLocationIds.length - 1} onClick={() => {
                              const newIds = moveLocation(editingLocationIds, idx, idx + 1);
                              setEditingLocationIds(newIds);
                              fetch(`/api/routes/${route.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: editingName, locationIds: newIds })
                              })
                                .then(() => {
                                  refreshAll();
                                  if (showToast) showToast('Route updated');
                                });
                            }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => {
                              const newIds = editingLocationIds.filter(lid => lid !== id);
                              setEditingLocationIds(newIds);
                              fetch(`/api/routes/${route.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: editingName, locationIds: newIds })
                              })
                                .then(() => {
                                  refreshAll();
                                  if (showToast) showToast('Route updated');
                                });
                            }}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={loc.description}
                          secondary={
                            editingNoteId === id ? (
                              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                  size="small"
                                  value={editingNoteValue}
                                  onChange={e => setEditingNoteValue(e.target.value)}
                                  label="Notes"
                                  sx={{ minWidth: 120 }}
                                  multiline
                                  maxRows={3}
                                />
                                <IconButton size="small" color="primary" disabled={noteEditLoading}
                                  onClick={async () => {
                                    setNoteEditLoading(true);
                                    await fetch(`/api/locations/${id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ notes: editingNoteValue })
                                    });
                                    setNoteEditLoading(false);
                                    setEditingNoteId(null);
                                    setEditingNoteValue("");
                                    refreshAll();
                                  }}
                                >
                                  <SaveIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => { setEditingNoteId(null); setEditingNoteValue(""); }}>
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ) : (
                              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                <span>{loc.notes}</span>
                                <IconButton size="small" onClick={() => { setEditingNoteId(id); setEditingNoteValue(loc.notes || ""); }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                  <Select
                    value={''}
                    displayEmpty
                    onChange={e => {
                      const id = e.target.value;
                      if (id && !editingLocationIds.includes(id)) setEditingLocationIds([...editingLocationIds, id]);
                    }}
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value="" disabled>Add existing location...</MenuItem>
                    {locations
                      .filter(l => !editingLocationIds.includes(l.id) && !l.routeId)
                      .map(loc => (
                        <MenuItem key={loc.id} value={loc.id}>{loc.description}</MenuItem>
                      ))}
                  </Select>
                  {/* Inline add new location */}
                  <InlineAddLocation onAdd={async loc => {
                    setEditingLocationIds(ids => {
                      const newIds = [...ids, loc.id];
                      fetch(`/api/routes/${route.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: editingName, locationIds: newIds })
                      })
                        .then(() => {
                          refreshAll();
                          if (showToast) showToast('Location added to route');
                        });
                      return newIds;
                    });
                  }} />
                </Box>
              </Box>
            ) : (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ flex: 1 }}>{route.name}</Typography>
                  <Tooltip title="Edit route" arrow>
                    <IconButton size="small" onClick={() => handleEdit(route)}><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <IconButton size="small" color="error" onClick={() => handleDelete(route.id)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
                <List sx={{ pl: 2 }}>
                  {route.locationIds.map(id => {
                    const loc = locations.find(l => l.id === id);
                    return loc ? (
                      <ListItem key={id} sx={{ pl: 0 }}>
                        <ListItemText primary={loc.description} secondary={loc.notes} />
                      </ListItem>
                    ) : null;
                  })}
                </List>
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

// Inline note editing for locations in route editing
import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, IconButton, ListItemText, MenuItem, Select } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import Tooltip from '@mui/material/Tooltip';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

function InlineAddLocation({ onAdd }) {
  const [desc, setDesc] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc, notes })
    });
    const data = await res.json();
    setLoading(false);
    if (data.location) {
      setDesc("");
      setNotes("");
      onAdd(data.location);
    } else {
      setError(data.error || 'Error adding location');
    }
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <TextField size="small" value={desc} onChange={e => setDesc(e.target.value)} label="New location" required sx={{ width: 120 }} />
      <TextField size="small" value={notes} onChange={e => setNotes(e.target.value)} label="Notes" sx={{ width: 160 }} />
      <Button type="submit" size="small" variant="outlined" disabled={loading}>Add</Button>
      {error && <Typography color="error" variant="caption">{error}</Typography>}
    </form>
  );
}

export default function RouteSection({ locations, routes, refreshAll, setError, showToast }) {
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteValue, setEditingNoteValue] = useState("");
  const [noteEditLoading, setNoteEditLoading] = useState(false);
  // locations and routes are now passed as props from parent
  const [newName, setNewName] = useState("");
  const [newLocationIds, setNewLocationIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingLocationIds, setEditingLocationIds] = useState([]);

  // fetching handled by parent

  const handleAdd = e => {
    e.preventDefault();
    setError("");
    fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, locationIds: newLocationIds })
    })
      .then(res => res.json())
      .then(data => {
        if (data.route) {
          setNewName("");
          setNewLocationIds([]);
          refreshAll();
          if (showToast) showToast('Route added');
        } else {
          setError(data.error || 'Error adding route');
        }
      })
      .catch(() => setError('Error adding route'));
  };

  const handleEdit = (route) => {
    setEditingId(route.id);
    setEditingName(route.name);
    setEditingLocationIds(route.locationIds);
  };

  // Keep editingLocationIds in sync with backend if locations/routes change while editing
  useEffect(() => {
    if (editingId) {
      const route = routes.find(r => r.id === editingId);
      if (route) {
        setEditingLocationIds(route.locationIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, routes]);
  const handleSave = (route) => {
    fetch(`/api/routes/${route.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName, locationIds: editingLocationIds })
    })
      .then(res => res.json())
      .then(data => {
        setEditingId(null);
        setEditingName("");
        setEditingLocationIds([]);
        refreshAll();
        if (showToast) showToast('Route updated');
      });
  };
  const handleDelete = (id) => {
    fetch(`/api/routes/${id}`, { method: 'DELETE' })
      .then(() => {
        refreshAll();
        if (showToast) showToast('Route deleted');
      });
  };

  // Reorder locations in a route
  const moveLocation = (arr, from, to) => {
    const copy = [...arr];
    const val = copy.splice(from, 1)[0];
    copy.splice(to, 0, val);
    return copy;
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Routes</Typography>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <TextField size="small" value={newName} onChange={e => setNewName(e.target.value)} label="New route name" sx={{ flex: 1 }} required />
        <Button type="submit" variant="contained">Add</Button>
      </form>
      <List>
        {routes.map(route => (
          <ListItem key={route.id} sx={{ borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
            {editingId === route.id ? (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={() => {
                      // Autosave route name only
                      fetch(`/api/routes/${route.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: editingName })
                      })
                        .then(() => {
                          refreshAll();
                          if (showToast) showToast('Route name updated');
                        });
                    }}
                    label="Route name"
                    sx={{ flex: 1 }}
                    autoFocus
                  />
                  <Tooltip title="Done editing" arrow>
                    <IconButton size="small" onClick={() => setEditingId(null)}><CheckIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="subtitle2">Locations (reorder, add, or remove):</Typography>
                <List sx={{ pl: 2 }}>
                  {editingLocationIds.map((id, idx) => {
                    const loc = locations.find(l => l.id === id);
                    if (!loc) return null;
                    return (
                      <ListItem key={id} sx={{ pl: 0 }}
                        secondaryAction={
                          <Box>
                            <IconButton size="small" disabled={idx === 0} onClick={() => {
                              const newIds = moveLocation(editingLocationIds, idx, idx - 1);
                              setEditingLocationIds(newIds);
                              fetch(`/api/routes/${route.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: editingName, locationIds: newIds })
                              })
                                .then(() => {
                                  refreshAll();
                                  if (showToast) showToast('Route updated');
                                });
                            }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                            <IconButton size="small" disabled={idx === editingLocationIds.length - 1} onClick={() => {
                              const newIds = moveLocation(editingLocationIds, idx, idx + 1);
                              setEditingLocationIds(newIds);
                              fetch(`/api/routes/${route.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: editingName, locationIds: newIds })
                              })
                                .then(() => {
                                  refreshAll();
                                  if (showToast) showToast('Route updated');
                                });
                            }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => {
                              const newIds = editingLocationIds.filter(lid => lid !== id);
                              setEditingLocationIds(newIds);
                              fetch(`/api/routes/${route.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: editingName, locationIds: newIds })
                              })
                                .then(() => {
                                  refreshAll();
                                  if (showToast) showToast('Route updated');
                                });
                            }}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={loc.description}
                          secondary={
                            editingNoteId === id ? (
                              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                  size="small"
                                  value={editingNoteValue}
                                  onChange={e => setEditingNoteValue(e.target.value)}
                                  label="Notes"
                                  sx={{ minWidth: 120 }}
                                  multiline
                                  maxRows={3}
                                />
                                <IconButton size="small" color="primary" disabled={noteEditLoading}
                                  onClick={async () => {
                                    setNoteEditLoading(true);
                                    await fetch(`/api/locations/${id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ notes: editingNoteValue })
                                    });
                                    setNoteEditLoading(false);
                                    setEditingNoteId(null);
                                    setEditingNoteValue("");
                                    refreshAll();
                                  }}
                                >
                                  <SaveIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => { setEditingNoteId(null); setEditingNoteValue(""); }}>
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ) : (
                              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                <span>{loc.notes}</span>
                                <IconButton size="small" onClick={() => { setEditingNoteId(id); setEditingNoteValue(loc.notes || ""); }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                  <Select
                    value={''}
                    displayEmpty
                    onChange={e => {
                      const id = e.target.value;
                      if (id && !editingLocationIds.includes(id)) setEditingLocationIds([...editingLocationIds, id]);
                    }}
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value="" disabled>Add existing location...</MenuItem>
                    {locations
                      .filter(l => !editingLocationIds.includes(l.id) && !l.routeId)
                      .map(loc => (
                        <MenuItem key={loc.id} value={loc.id}>{loc.description}</MenuItem>
                      ))}
                  </Select>
                  {/* Inline add new location */}
                  <InlineAddLocation onAdd={async loc => {
                    setEditingLocationIds(ids => {
                      const newIds = [...ids, loc.id];
                      fetch(`/api/routes/${route.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: editingName, locationIds: newIds })
                      })
                        .then(() => {
                          refreshAll();
                          if (showToast) showToast('Location added to route');
                        });
                      return newIds;
                    });
                  }} />
                </Box>
              </Box>
            ) : (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ flex: 1 }}>{route.name}</Typography>
                  <Tooltip title="Edit route" arrow>
                    <IconButton size="small" onClick={() => handleEdit(route)}><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <IconButton size="small" color="error" onClick={() => handleDelete(route.id)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
                <List sx={{ pl: 2 }}>
                  {route.locationIds.map(id => {
                    const loc = locations.find(l => l.id === id);
                    return loc ? (
                      <ListItem key={id} sx={{ pl: 0 }}>
                        <ListItemText primary={loc.description} secondary={loc.notes} />
                      </ListItem>
                    ) : null;
                  })}
                </List>
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
