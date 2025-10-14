import express from 'express';
import { getAllRoutes, addRoute, updateRoute, deleteRoute } from '../models/route.js';
import { authenticateToken, authorizeRoles } from '../src/middleware/auth.js';
const router = express.Router();

// Get all routes - accessible to all authenticated users
router.get('/', authenticateToken, (req, res) => {
	res.json({ routes: getAllRoutes() });
});

// Add a route - coordinators and admins only
router.post('/', authenticateToken, authorizeRoles('admin', 'coordinator'), (req, res) => {
	const { name, locationIds } = req.body;
	if (!name) return res.status(400).json({ error: 'Name required' });
	const route = addRoute(name, locationIds || []);
	res.status(201).json({ route });
});

// Update a route (PATCH or PUT) - coordinators and admins only
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'coordinator'), (req, res) => {
	const { id } = req.params;
	const { name, locationIds } = req.body;
	const route = updateRoute(Number(id), name, locationIds);
	if (!route) return res.status(404).json({ error: 'Route not found' });
	res.json({ route });
});
router.put('/:id', authenticateToken, authorizeRoles('admin', 'coordinator'), (req, res) => {
	const { id } = req.params;
	const { name, locationIds } = req.body;
	const route = updateRoute(Number(id), name, locationIds);
	if (!route) return res.status(404).json({ error: 'Route not found' });
	res.json({ route });
});

// Delete a route - admins only
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
	deleteRoute(Number(req.params.id));
	res.sendStatus(204);
});

export default router;
