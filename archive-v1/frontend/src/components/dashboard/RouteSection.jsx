import React, { useState, useRef, useEffect } from "react";
import LocationList from "./LocationList";
import InlineAddLocationForm from "./InlineAddLocationForm";
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';

export default function RouteSection({ route, locations, routes, onEditRoute, onDeleteRoute, ...handlers }) {
  const isNoRoute = !route;
  const [editing, setEditing] = useState(false); // Only for editing the route name
  const [expanded, setExpanded] = useState(true); // For showing/hiding section content
  const [name, setName] = useState(route ? route.name : "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef(null);

  // Keep name in sync with route prop
  useEffect(() => {
    setName(route ? route.name : "");
  }, [route]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  // Show location count in header
  const locationCount = locations ? locations.length : 0;

  const handleEdit = () => setEditing(true);
  const handleDone = () => {
    if (route && name.trim() && name !== route.name) {
      onEditRoute(route.id, name.trim());
    }
    setEditing(false);
  };

  // Pass through handlers without modification
  const childHandlers = handlers;

  return (
    <Card sx={{ mb: 2, border: editing ? '2px solid #1976d2' : '1px solid #ccc', boxShadow: editing ? 4 : 1 }}>
      <CardHeader
        title={isNoRoute ? (
          <Typography variant="h6">No Route ({locationCount})</Typography>
        ) : editing ? (
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleDone}
            onKeyDown={e => { if (e.key === 'Enter') handleDone(); }}
            style={{ fontSize: '1.1em', flex: 1, marginRight: 8 }}
          />
        ) : (
          <Typography 
            variant="h6" 
            onClick={() => setExpanded(!expanded)}
            sx={{ cursor: 'pointer', userSelect: 'none' }}
          >
            {expanded ? '▼' : '▶'} {route.name} ({locationCount})
          </Typography>
        )}
        action={isNoRoute ? null : editing ? (
          <>
            <IconButton onClick={handleDone} color="primary" size="small"><DoneIcon /></IconButton>
            {confirmDelete ? (
              <>
                <span style={{ marginLeft: 8 }}>Are you sure?</span>
                <IconButton onClick={() => { setConfirmDelete(false); onDeleteRoute(route.id, locations); }} color="error" size="small"><DeleteIcon /></IconButton>
                <IconButton onClick={() => setConfirmDelete(false)} size="small"><DoneIcon /></IconButton>
              </>
            ) : (
              <IconButton onClick={() => setConfirmDelete(true)} color="error" size="small"><DeleteIcon /></IconButton>
            )}
          </>
        ) : (
          <>
            <IconButton onClick={handleEdit} size="small"><EditIcon /></IconButton>
            {confirmDelete ? (
              <>
                <span style={{ marginLeft: 8 }}>Are you sure?</span>
                <IconButton onClick={() => { setConfirmDelete(false); onDeleteRoute(route.id, locations); }} color="error" size="small"><DeleteIcon /></IconButton>
                <IconButton onClick={() => setConfirmDelete(false)} size="small"><DoneIcon /></IconButton>
              </>
            ) : (
              <IconButton onClick={() => setConfirmDelete(true)} color="error" size="small"><DeleteIcon /></IconButton>
            )}
          </>
        )}
        sx={{ alignItems: 'center', pb: 0 }}
      />
      {expanded && (
        <CardContent sx={{ pt: 1 }}>
          <LocationList
            locations={
              route
                ? [...locations]
                    .filter(l => l.routeId === route.id)
                    .sort((a, b) => (a.routeOrder ?? 0) - (b.routeOrder ?? 0))
                : locations.filter(l => !l.routeId)
            }
            route={route}
            routes={routes}
            {...childHandlers}
          />
          
          {/* Inline Add Location Form - only show for actual routes, not "No Route" */}
          {!isNoRoute && (
            <InlineAddLocationForm 
              onAdd={childHandlers.onAddLocation}
              routeId={route ? route.id : null}
              routeName={route ? route.name : null}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}