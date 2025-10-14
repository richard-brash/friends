import express from 'express';
import { getAllLocations, addLocation, updateLocation, deleteLocation } from '../models/location.js';
import { routes } from '../models/route.js';
import { authenticateToken, authorizeRoles } from '../src/middleware/auth.js';
const router = express.Router();

// Get all locations - accessible to all authenticated users
// Return locations with routeId and routeName if present
router.get('/', authenticateToken, (req, res) => {
	res.json({ locations: getAllLocations(routes) });
});

// Add a location - coordinators and admins only
router.post('/', authenticateToken, authorizeRoles('admin', 'coordinator'), (req, res) => {
	const { description, notes, routeId, address, latitude, longitude } = req.body;
	if (!description) return res.status(400).json({ error: 'Description required' });
	const location = addLocation(description, notes, routeId, routes, address, latitude, longitude);
	res.status(201).json({ location });
});

// Update a location - coordinators and admins only
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'coordinator'), (req, res) => {
	const { id } = req.params;
	const { description, notes, routeId, address, latitude, longitude } = req.body;
	const loc = updateLocation(Number(id), description, notes, routeId, routes, address, latitude, longitude);
	if (!loc) return res.status(404).json({ error: 'Location not found' });
	res.json({ location: loc });
});

// Delete a location - admins only
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
	deleteLocation(Number(req.params.id), routes);
	res.sendStatus(204);
});

export default router;
