// Locations Routes
// Locations CRUD endpoints

import express from 'express';
import pool from '../database.js';
import LocationRepository from '../repositories/LocationRepository.js';
import RouteRepository from '../repositories/RouteRepository.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();
const locationRepo = new LocationRepository(pool);
const routeRepo = new RouteRepository(pool);

/**
 * GET /api/locations
 * Get all locations (optionally filtered by route)
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { routeId } = req.query;

  let locations;
  if (routeId) {
    locations = await locationRepo.getByRoute(parseInt(routeId));
  } else {
    locations = await locationRepo.getAll({
      orderBy: 'route_id, route_order ASC'
    });
  }

  res.json({
    data: locations.map(l => ({
      id: l.id,
      name: l.name,
      address: l.address,
      city: l.city,
      state: l.state,
      zipCode: l.zip_code,
      coordinates: l.coordinates,
      routeId: l.route_id,
      routeOrder: l.route_order,
      notes: l.notes,
      createdAt: l.created_at,
      updatedAt: l.updated_at
    }))
  });
}));

/**
 * GET /api/locations/:id
 * Get single location with route info
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const location = await locationRepo.getWithRoute(parseInt(id));
  
  if (!location) {
    throw new NotFoundError('Location', id);
  }

  res.json({
    id: location.id,
    name: location.name,
    address: location.address,
    city: location.city,
    state: location.state,
    zipCode: location.zip_code,
    coordinates: location.coordinates,
    routeId: location.route_id,
    routeOrder: location.route_order,
    notes: location.notes,
    createdAt: location.created_at,
    updatedAt: location.updated_at,
    route: {
      id: location.route_id,
      name: location.route_name,
      description: location.route_description
    }
  });
}));

/**
 * GET /api/locations/:id/expected-friends
 * Get friends expected at this location
 */
router.get('/:id/expected-friends', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { daysAgo = 30 } = req.query;

  const location = await locationRepo.getById(parseInt(id));
  if (!location) {
    throw new NotFoundError('Location', id);
  }

  const friends = await locationRepo.getExpectedFriends(
    parseInt(id), 
    parseInt(daysAgo)
  );

  res.json({
    location: {
      id: location.id,
      name: location.name
    },
    friends: friends.map(f => ({
      id: f.id,
      firstName: f.first_name,
      lastName: f.last_name,
      alias: f.alias,
      phone: f.phone,
      status: f.status,
      lastSeen: f.last_seen,
      sightingCount: parseInt(f.sighting_count)
    }))
  });
}));

/**
 * GET /api/locations/:id/requests
 * Get pending requests at this location
 */
router.get('/:id/requests', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const location = await locationRepo.getById(parseInt(id));
  if (!location) {
    throw new NotFoundError('Location', id);
  }

  const requests = await locationRepo.getPendingRequests(parseInt(id));

  res.json({
    location: {
      id: location.id,
      name: location.name
    },
    requests: requests.map(r => ({
      id: r.id,
      friendId: r.friend_id,
      friendName: [r.first_name, r.last_name, r.alias].filter(Boolean).join(' '),
      itemDescription: r.item_description,
      quantity: r.quantity,
      priority: r.priority,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at
    }))
  });
}));

/**
 * POST /api/locations
 * Create a new location
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { 
    name, 
    address, 
    city, 
    state, 
    zipCode, 
    coordinates, 
    routeId, 
    routeOrder,
    notes 
  } = req.body;

  if (!name || name.trim().length === 0) {
    throw new ValidationError('Location name is required');
  }

  if (!routeId) {
    throw new ValidationError('Route ID is required');
  }

  // Verify route exists
  const route = await routeRepo.getById(parseInt(routeId));
  if (!route) {
    throw new NotFoundError('Route', routeId);
  }

  // If no route_order specified, get next available
  let finalRouteOrder = routeOrder;
  if (!finalRouteOrder) {
    finalRouteOrder = await locationRepo.getNextRouteOrder(parseInt(routeId));
  }

  const location = await locationRepo.create({
    name: name.trim(),
    address: address || null,
    city: city || null,
    state: state || null,
    zip_code: zipCode || null,
    coordinates: coordinates || null,
    route_id: parseInt(routeId),
    route_order: parseInt(finalRouteOrder),
    notes: notes || null
  });

  res.status(201).json({
    id: location.id,
    name: location.name,
    address: location.address,
    city: location.city,
    state: location.state,
    zipCode: location.zip_code,
    coordinates: location.coordinates,
    routeId: location.route_id,
    routeOrder: location.route_order,
    notes: location.notes,
    createdAt: location.created_at,
    updatedAt: location.updated_at
  });
}));

/**
 * PUT /api/locations/:id
 * Update a location
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    address, 
    city, 
    state, 
    zipCode, 
    coordinates,
    routeOrder,
    notes 
  } = req.body;

  const existing = await locationRepo.getById(parseInt(id));
  if (!existing) {
    throw new NotFoundError('Location', id);
  }

  // Build update data
  const updateData = {};
  if (name !== undefined) {
    if (name.trim().length === 0) {
      throw new ValidationError('Location name cannot be empty');
    }
    updateData.name = name.trim();
  }
  if (address !== undefined) updateData.address = address;
  if (city !== undefined) updateData.city = city;
  if (state !== undefined) updateData.state = state;
  if (zipCode !== undefined) updateData.zip_code = zipCode;
  if (coordinates !== undefined) updateData.coordinates = coordinates;
  if (routeOrder !== undefined) updateData.route_order = parseInt(routeOrder);
  if (notes !== undefined) updateData.notes = notes;

  const location = await locationRepo.update(parseInt(id), updateData);

  res.json({
    id: location.id,
    name: location.name,
    address: location.address,
    city: location.city,
    state: location.state,
    zipCode: location.zip_code,
    coordinates: location.coordinates,
    routeId: location.route_id,
    routeOrder: location.route_order,
    notes: location.notes,
    createdAt: location.created_at,
    updatedAt: location.updated_at
  });
}));

/**
 * DELETE /api/locations/:id
 * Hard delete a location (CASCADE will remove dependent records)
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await locationRepo.delete(parseInt(id));
  
  if (!deleted) {
    throw new NotFoundError('Location', id);
  }

  res.json({
    message: 'Location deleted successfully',
    id: parseInt(id)
  });
}));

/**
 * POST /api/locations/reorder
 * Reorder locations on a route
 */
router.post('/reorder', authenticate, asyncHandler(async (req, res) => {
  const { routeId, locations } = req.body;

  if (!routeId) {
    throw new ValidationError('Route ID is required');
  }

  if (!Array.isArray(locations) || locations.length === 0) {
    throw new ValidationError('Locations array is required');
  }

  // Verify route exists
  const route = await routeRepo.getById(parseInt(routeId));
  if (!route) {
    throw new NotFoundError('Route', routeId);
  }

  await locationRepo.reorderLocations(parseInt(routeId), locations);

  res.json({
    message: 'Locations reordered successfully',
    routeId: parseInt(routeId)
  });
}));

export default router;
