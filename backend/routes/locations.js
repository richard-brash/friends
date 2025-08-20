import express from 'express';
import { getAllLocations, addLocation, updateLocation, deleteLocation } from '../models/location.js';
import { routes } from '../models/route.js';
const router = express.Router();

// Get all locations
// Return locations with routeId and routeName if present
router.get('/', (req, res) => {
	res.json({ locations: getAllLocations(routes) });
});


// Add a location
router.post('/', (req, res) => {
	const { description, notes, routeId } = req.body;
	if (!description) return res.status(400).json({ error: 'Description required' });
	const location = addLocation(description, notes, routeId, routes);
	res.status(201).json({ location });
});

// Update a location
router.patch('/:id', (req, res) => {
	const { id } = req.params;
	const { description, notes, routeId } = req.body;
	const loc = updateLocation(Number(id), description, notes, routeId, routes);
	if (!loc) return res.status(404).json({ error: 'Location not found' });
	res.json({ location: loc });
});

// Delete a location
router.delete('/:id', (req, res) => {
	deleteLocation(Number(req.params.id), routes);
	res.sendStatus(204);
});

export default router;
