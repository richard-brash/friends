import express from 'express';
import locationService from '../services/locationService.js';
import { authenticateToken, authorizeRoles } from '../src/middleware/auth.js';

const router = express.Router();

// Get all locations - accessible to all authenticated users
// Return locations with routeId and routeName if present
router.get('/', authenticateToken, async (req, res) => {
	try {
		const locations = await locationService.getAllLocations();
		res.json({ locations });
	} catch (error) {
		console.error('Error fetching locations:', error);
		res.status(500).json({ error: 'Failed to fetch locations' });
	}
});

// Add a location - volunteers can add during field work
router.post('/', authenticateToken, authorizeRoles('admin', 'coordinator', 'volunteer'), (req, res) => {
	const { description, notes, routeId, address, latitude, longitude } = req.body;
	if (!description) return res.status(400).json({ error: 'Description required' });
	const location = addLocation(description, notes, routeId, routes, address, latitude, longitude);
	res.status(201).json({ location });
});

// Update a location - volunteers can update during field work
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'coordinator', 'volunteer'), (req, res) => {
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
