import express from 'express';
import routeService from '../services/routeService.js';
import { authenticateToken, authorizeRoles } from '../src/middleware/auth.js';
const router = express.Router();

// Get all routes - accessible to all authenticated users
router.get('/', authenticateToken, async (req, res) => {
	try {
		const routes = await routeService.getAllRoutes();
		res.json({ routes });
	} catch (error) {
		console.error('Error fetching routes:', error);
		res.status(500).json({ error: 'Failed to fetch routes' });
	}
});

// Add a route - coordinators and admins only
router.post('/', authenticateToken, authorizeRoles('admin', 'coordinator'), async (req, res) => {
	try {
		const { name, locationIds } = req.body;
		if (!name) return res.status(400).json({ error: 'Name required' });
		const route = await routeService.createRoute({ name, locationIds: locationIds || [] });
		res.status(201).json({ route });
	} catch (error) {
		console.error('Error creating route:', error);
		res.status(500).json({ error: 'Failed to create route' });
	}
});

// Update a route (PATCH or PUT) - coordinators and admins only
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'coordinator'), async (req, res) => {
	try {
		const { id } = req.params;
		const { name, locationIds } = req.body;
		const route = await routeService.updateRoute(Number(id), { name, locationIds });
		if (!route) return res.status(404).json({ error: 'Route not found' });
		res.json({ route });
	} catch (error) {
		console.error('Error updating route:', error);
		res.status(500).json({ error: 'Failed to update route' });
	}
});
router.put('/:id', authenticateToken, authorizeRoles('admin', 'coordinator'), async (req, res) => {
	try {
		const { id } = req.params;
		const { name, locationIds } = req.body;
		const route = await routeService.updateRoute(Number(id), { name, locationIds });
		if (!route) return res.status(404).json({ error: 'Route not found' });
		res.json({ route });
	} catch (error) {
		console.error('Error updating route:', error);
		res.status(500).json({ error: 'Failed to update route' });
	}
});

// Delete a route - admins only
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
	try {
		await routeService.deleteRoute(Number(req.params.id));
		res.sendStatus(204);
	} catch (error) {
		console.error('Error deleting route:', error);
		res.status(500).json({ error: 'Failed to delete route' });
	}
});

export default router;
