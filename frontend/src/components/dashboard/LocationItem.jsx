import React, { useState, useEffect } from "react";
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';

export default function LocationItem({ location, route, routes, onEditLocation, onDeleteLocation, onMoveLocation, onReorderLocations, locations }) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(location.description);
  const [notes, setNotes] = useState(location.notes || "");
  const [moveTo, setMoveTo] = useState(location.routeId || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Update local state when location prop changes
  useEffect(() => {
    setDesc(location.description);
    setNotes(location.notes || "");
    setMoveTo(location.routeId || "");
  }, [location.description, location.notes, location.routeId]);
  const idx = locations.findIndex(l => l.id === location.id);
  const canMoveUp = idx > 0;
  const canMoveDown = idx < locations.length - 1;

  const handleSave = () => {
    if (desc.trim() && (desc !== location.description || notes !== (location.notes || ""))) {
      onEditLocation(location.id, { description: desc.trim(), notes });
    }
    setEditing(false);
  };

  // Disassociate from route (move to No Route) instead of delete
  const handleDisassociate = () => {
    setConfirmDelete(false);
    if (route) {
      onEditLocation(location.id, { routeId: null });
    } else {
      onDeleteLocation(location.id);
    }
  };

  return (
    <li style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
      {editing ? (
        <>
          <input value={desc} onChange={e => setDesc(e.target.value)} style={{ flex: 1 }} />
          <input value={notes} onChange={e => setNotes(e.target.value)} style={{ flex: 2 }} />
          <IconButton onClick={handleSave} color="primary" size="small"><DoneIcon /></IconButton>
          <IconButton onClick={() => { setEditing(false); setDesc(location.description); setNotes(location.notes || ""); }} size="small"><DoneIcon style={{ transform: 'rotate(180deg)' }} /></IconButton>
        </>
      ) : (
        <>
          <span style={{ flex: 1 }}>{location.description}</span>
          <span style={{ flex: 2, color: '#888' }}>{location.notes}</span>
          <IconButton onClick={() => setEditing(true)} size="small"><EditIcon /></IconButton>
          {confirmDelete ? (
            <>
              <span>Are you sure?</span>
              <IconButton onClick={handleDisassociate} color="error" size="small"><DeleteIcon /></IconButton>
              <IconButton onClick={() => setConfirmDelete(false)} size="small"><DoneIcon /></IconButton>
            </>
          ) : (
            <IconButton onClick={() => setConfirmDelete(true)} color="error" size="small"><DeleteIcon /></IconButton>
          )}
        </>
      )}
      {/* Move to another route */}
      <select value={moveTo} onChange={e => { setMoveTo(e.target.value); onMoveLocation(location.id, e.target.value); }}>
        <option key="no-route-option" value="">No Route</option>
        {routes && routes.map(r => (
          <option key={`route-option-${r.id}`} value={r.id}>{r.name}</option>
        ))}
      </select>
      {/* Reorder up/down - only show when location is part of a route */}
      {route && (
        <>
          <button onClick={() => {
            if (canMoveUp) {
              const newOrder = [...locations];
              [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
              onReorderLocations(route.id, newOrder.map(l => l.id));
            }
          }} disabled={!canMoveUp}>↑</button>
          <button onClick={() => {
            if (canMoveDown) {
              const newOrder = [...locations];
              [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
              onReorderLocations(route.id, newOrder.map(l => l.id));
            }
          }} disabled={!canMoveDown}>↓</button>
        </>
      )}
    </li>
  );
}
