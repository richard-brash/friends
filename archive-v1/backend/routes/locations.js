import express from 'express';
import locationService from '../services/locationService.js';
import routeService from '../services/routeService.js';
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
router.post('/', authenticateToken, authorizeRoles('admin', 'coordinator', 'volunteer'), async (req, res) => {
	try {
		const { description, notes, routeId, address, latitude, longitude } = req.body;
		if (!description) return res.status(400).json({ error: 'Description required' });
		const location = await locationService.createLocation({ description, notes, routeId, address, latitude, longitude });
		res.status(201).json({ location });
	} catch (error) {
		console.error('Error creating location:', error);
		res.status(500).json({ error: 'Failed to create location' });
	}
});

// Update a location - volunteers can update during field work
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'coordinator', 'volunteer'), async (req, res) => {
	try {
		const { id } = req.params;
		const { description, notes, routeId, address, latitude, longitude } = req.body;
		const location = await locationService.updateLocation(Number(id), { description, notes, routeId, address, latitude, longitude });
		if (!location) return res.status(404).json({ error: 'Location not found' });
		res.json({ location });
	} catch (error) {
		console.error('Error updating location:', error);
		res.status(500).json({ error: 'Failed to update location' });
	}
});

// Delete a location - admins only
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
	try {
		await locationService.deleteLocation(Number(req.params.id));
		res.sendStatus(204);
	} catch (error) {
		console.error('Error deleting location:', error);
		res.status(500).json({ error: 'Failed to delete location' });
	}
});

export default router;
