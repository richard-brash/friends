
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, IconButton, Select, MenuItem, Accordion, AccordionSummary, AccordionDetails, Badge } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import Tooltip from '@mui/material/Tooltip';

export default function RouteLocationDashboard({ locations, routes, refreshAll, setError, showToast }) {
	// ...existing code...
	// Group locations by routeId
	// ...existing code...
	// Always include all routes, even if no locations
	const routeOrder = [...routes.map(r => r.id.toString()), 'noroute'];
	// Add Route handler (restored)
	const handleAddRoute = async (e) => {
		e.preventDefault();
		if (!newRouteName.trim()) return;
		try {
			const res = await fetch('/api/routes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newRouteName })
			});
			if (!res.ok) throw new Error('Failed to add route');
			setNewRouteName("");
			showToast('Route added');
			refreshAll();
		} catch (err) {
			setLocalError(err.message);
		}
	};
	// Route add/edit state
	const [newRouteName, setNewRouteName] = useState("");
	const [editingRouteName, setEditingRouteName] = useState("");
	// Location add/edit state
	const [newDesc, setNewDesc] = useState("");
	const [newNotes, setNewNotes] = useState("");
	const [newRouteId, setNewRouteId] = useState("");
	const [editingLocId, setEditingLocId] = useState(null);
	const [editingDesc, setEditingDesc] = useState("");
	const [editingNotes, setEditingNotes] = useState("");
	const [editingLocRouteId, setEditingLocRouteId] = useState("");
	// Track which route is open/editing (same state)
	const [expanded, setExpanded] = useState(null);
	const [error, setLocalError] = useState("");

	const locationsByRoute = {};
	locations.forEach(loc => {
		const key = loc.routeId || 'noroute';
		if (!locationsByRoute[key]) locationsByRoute[key] = [];
		locationsByRoute[key].push(loc);
	});
			// ...existing code...
	// ...existing code...

	const handleDeleteRoute = async (routeId) => {
		if (!window.confirm('Delete this route?')) return;
		try {
			const res = await fetch(`/api/routes/${routeId}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Failed to delete route');
			showToast('Route deleted');
			refreshAll();
		} catch (err) {
			setLocalError(err.message);
		}
	};

	// --- LOCATION HANDLERS ---
	const handleAddLocation = async (e) => {
		e.preventDefault();
		if (!newDesc.trim()) return;
		try {
			const res = await fetch('/api/locations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ description: newDesc, notes: newNotes, routeId: newRouteId || null })
			});
			if (!res.ok) throw new Error('Failed to add location');
			setNewDesc("");
			setNewNotes("");
			setNewRouteId("");
			showToast('Location added');
			refreshAll();
		} catch (err) {
			setLocalError(err.message);
		}
	};

	const handleEditLoc = (loc) => {
		setEditingLocId(loc.id);
		setEditingDesc(loc.description);
		setEditingNotes(loc.notes);
		setEditingLocRouteId(loc.routeId || '');
	};

	const handleSaveLoc = async (loc, newRouteIdOverride) => {
		try {
			const res = await fetch(`/api/locations/${loc.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					description: editingDesc,
					notes: editingNotes,
					routeId: newRouteIdOverride !== undefined ? newRouteIdOverride : editingLocRouteId || null
				})
			});
			if (!res.ok) throw new Error('Failed to update location');
			setEditingLocId(null);
			setEditingDesc("");
			setEditingNotes("");
			setEditingLocRouteId("");
			showToast('Location updated');
			refreshAll();
		} catch (err) {
			setLocalError(err.message);
		}
	};

	const handleDeleteLoc = async (locId) => {
		if (!window.confirm('Delete this location?')) return;
		try {
			const res = await fetch(`/api/locations/${locId}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Failed to delete location');
			showToast('Location deleted');
			refreshAll();
		} catch (err) {
			setLocalError(err.message);
		}
	};

	return (
		<Box>
			<Typography variant="h6" sx={{ mb: 2 }}>Routes & Locations</Typography>
			{/* Add Route */}
			<form onSubmit={handleAddRoute} style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
				<TextField size="small" value={newRouteName} onChange={e => setNewRouteName(e.target.value)} label="New route name" sx={{ flex: 1 }} required />
				<Button type="submit" variant="contained">Add Route</Button>
			</form>
			{/* Add Location */}
			<form onSubmit={handleAddLocation} style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
				<TextField size="small" value={newDesc} onChange={e => setNewDesc(e.target.value)} label="New location" sx={{ flex: 1 }} required />
				<TextField size="small" value={newNotes} onChange={e => setNewNotes(e.target.value)} label="Notes" sx={{ flex: 2 }} />
				<Select
					size="small"
					value={newRouteId || ''}
					onChange={e => setNewRouteId(e.target.value)}
					displayEmpty
					sx={{ minWidth: 180 }}
				>
					<MenuItem value="">No route</MenuItem>
					{routes.map(r => (
						<MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
					))}
				</Select>
				<Button type="submit" variant="contained">Add Location</Button>
			</form>
			{/* List routes and locations */}
			{routeOrder.map(routeId => {
				// Always show all routes, even if no locations
				const locs = locationsByRoute[routeId] || [];
				const route = routeId === 'noroute' ? null : routes.find(r => r.id.toString() === routeId);
				// Hide 'No Route' if there are no unassigned locations
				if (routeId === 'noroute' && locs.length === 0) return null;
				const label = route ? route.name : 'No Route';
				const isEditingRoute = route && expanded === routeId;
				return (
					<Accordion key={routeId} expanded={expanded === routeId}
						onChange={(_, isExp) => {
							setExpanded(isExp ? routeId : null);
							if (route && isExp) {
								setEditingRouteName(route.name);
							} else if (route && !isExp) {
								// Save and exit edit mode
								handleSaveRoute(route);
							}
						}}
					>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							{route && isEditingRoute ? (
								<Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1 }}>
									<TextField size="small" value={editingRouteName} onChange={e => setEditingRouteName(e.target.value)} label="Route name" sx={{ flex: 1 }} autoFocus />
								</Box>
							) : (
								<>
									<Typography sx={{ flex: 1 }}>{label}</Typography>
									{route && (
										<Tooltip title="Delete route" arrow>
											<IconButton size="small" color="error" onClick={e => { e.stopPropagation(); handleDeleteRoute(route.id); }}><DeleteIcon fontSize="small" /></IconButton>
										</Tooltip>
									)}
								</>
							)}
							{expanded !== routeId && (
								<Badge color="primary" badgeContent={locs.length} sx={{ ml: 2 }} />
							)}
						</AccordionSummary>
						<AccordionDetails>
							{route && isEditingRoute && (
								<>
									<List>
										{(routeOrders[routeId] || []).length === 0 ? (
											<ListItem>
												<Typography variant="body2" color="text.secondary">No locations in this route.</Typography>
											</ListItem>
																														) : (
																																					(
																																						(routeOrders[routeId] && routeOrders[routeId].length > 0
																																							? routeOrders[routeId]
																																							: (locationsByRoute[routeId] || []).map(l => l.id)
																																						)
																																					).map((locId, idx) => {
																																						const loc = locations.find(l => l.id === locId);
																																						if (!loc) return null;
																																						return (
																																							<ListItem key={loc.id} sx={{ borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}
																																								secondaryAction={
																																									editingLocId === loc.id ? null : (
																																										<Box>
																																											<Tooltip title="Move up" arrow>
																																												<span>
																																													<IconButton
																																														size="small"
																																														disabled={idx === 0}
																																														onClick={() => {
																																															moveLoc(routeId, idx, idx - 1);
																																															setTimeout(() => saveOrder(routeId), 0);
																																														}}
																																													>
																																														<ExpandMoreIcon style={{ transform: 'rotate(-90deg)' }} fontSize="small" />
																																													</IconButton>
																																												</span>
																																											</Tooltip>
																																											<Tooltip title="Move down" arrow>
																																												<span>
																																													<IconButton
																																														size="small"
																																														disabled={idx === ((routeOrders[routeId] && routeOrders[routeId].length > 0 ? routeOrders[routeId].length : (locationsByRoute[routeId] || []).length) - 1)}
																																														onClick={() => {
																																															moveLoc(routeId, idx, idx + 1);
																																															setTimeout(() => saveOrder(routeId), 0);
																																														}}
																																													>
																																														<ExpandMoreIcon style={{ transform: 'rotate(90deg)' }} fontSize="small" />
																																													</IconButton>
																																												</span>
																																											</Tooltip>
																																											<Tooltip title="Edit location" arrow>
																																												<IconButton size="small" onClick={() => handleEditLoc(loc)}><EditIcon fontSize="small" /></IconButton>
																																											</Tooltip>
																																											<Tooltip title="Delete location" arrow>
																																												<IconButton size="small" color="error" onClick={() => handleDeleteLoc(loc.id)}><DeleteIcon fontSize="small" /></IconButton>
																																											</Tooltip>
																																										</Box>
																																									)
																																								}
																																							>
																																								{editingLocId === loc.id ? (
																																									<Box sx={{ width: '100%' }}>
																																										<Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
																																											<TextField size="small" value={editingDesc} onChange={e => setEditingDesc(e.target.value)} label="Description" sx={{ flex: 1 }} autoFocus />
																																											<TextField size="small" value={editingNotes} onChange={e => setEditingNotes(e.target.value)} label="Notes" sx={{ flex: 2 }} />
																																											<Select
																																												size="small"
																																												value={editingLocRouteId || ''}
																																												onChange={e => {
																																													setEditingLocRouteId(e.target.value);
																																													handleSaveLoc(loc, e.target.value);
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
																																												<IconButton size="small" onClick={() => handleSaveLoc(loc)}>
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
																																					})
																																				)}
									</List>
									{/* Add location to route */}
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
										<Select
											size="small"
											value={''}
											displayEmpty
											onChange={e => { addLocToRoute(routeId, e.target.value); }}
											sx={{ minWidth: 200 }}
										>
											<MenuItem value="" disabled>Add existing location...</MenuItem>
											{locations.filter(l => !(routeOrders[routeId] || []).includes(l.id) && l.routeId !== routeId).map(loc => (
												<MenuItem key={loc.id} value={loc.id}>{loc.description}</MenuItem>
											))}
										</Select>
									</Box>
								</>
							)}
							{/* Read-only view for collapsed or non-editing */}
							{(!route || !isEditingRoute) && (
								<List>
									{locs.length === 0 && route ? (
										<ListItem>
											<Typography variant="body2" color="text.secondary">No locations in this route.</Typography>
										</ListItem>
									) : locs.map(loc => (
										<ListItem key={loc.id} sx={{ borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
											<Box sx={{ width: '100%' }}>
												<Typography variant="subtitle1">{loc.description}</Typography>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Typography variant="body2" color="text.secondary" component="span">{loc.notes}</Typography>
												</Box>
											</Box>
										</ListItem>
									))}
								</List>
							)}
						</AccordionDetails>
					</Accordion>
				);
			})}
			<Box>
				{error && <Typography color="error">{error}</Typography>}
			</Box>
		</Box>
	);
// ...existing code...
	// --- ROUTE ORDER STATE & HELPERS ---
	// routeOrders: { [routeId]: [locId, ...] }
	const [routeOrders, setRouteOrders] = useState({});

	// Sync routeOrders with locations/routes
	useEffect(() => {
		const newOrders = {};
		routes.forEach(route => {
			const locs = locations.filter(l => l.routeId === route.id).map(l => l.id);
			newOrders[route.id] = locs;
		});
		// Also handle unassigned locations
		const noroute = locations.filter(l => !l.routeId).map(l => l.id);
		newOrders['noroute'] = noroute;
		setRouteOrders(newOrders);
	}, [locations, routes]);

	// Move a location up/down in a route
	const moveLoc = (routeId, fromIdx, toIdx) => {
		setRouteOrders(prev => {
			const arr = [...(prev[routeId] || [])];
			if (toIdx < 0 || toIdx >= arr.length) return prev;
			const [moved] = arr.splice(fromIdx, 1);
			arr.splice(toIdx, 0, moved);
			return { ...prev, [routeId]: arr };
		});
	};

	// Save new order to backend
	const saveOrder = async (routeId) => {
		const route = routes.find(r => r.id === routeId);
		if (!route) return;
		try {
			const res = await fetch(`/api/routes/${routeId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: route.name, locationIds: routeOrders[routeId] })
			});
			if (!res.ok) throw new Error('Failed to save order');
			showToast('Order saved');
			refreshAll();
		} catch (err) {
			setLocalError(err.message);
		}
	};

	// Add an existing location to a route
	const addLocToRoute = async (routeId, locId) => {
		try {
			const loc = locations.find(l => l.id === locId);
			if (!loc) return;
			const res = await fetch(`/api/locations/${locId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...loc, routeId })
			});
			if (!res.ok) throw new Error('Failed to add location to route');
			showToast('Location added to route');
			refreshAll();
		} catch (err) {
			setLocalError(err.message);
		}
	};
}
