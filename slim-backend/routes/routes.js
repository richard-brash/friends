// Routes Routes
// Routes CRUD endpoints

import express from 'express';
import pool from '../database.js';
import RouteRepository from '../repositories/RouteRepository.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();
const routeRepo = new RouteRepository(pool);

/**
 * GET /api/routes
 * Get all routes with location count
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const routes = await routeRepo.getAllWithLocationCount();

  res.json({
    data: routes.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isActive: r.is_active,
      locationCount: parseInt(r.location_count),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }))
  });
}));

/**
 * GET /api/routes/:id
 * Get single route with all locations
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const route = await routeRepo.getWithLocations(parseInt(id));
  
  if (!route) {
    throw new NotFoundError('Route', id);
  }

  res.json({
    id: route.id,
    name: route.name,
    description: route.description,
    isActive: route.is_active,
    createdAt: route.created_at,
    updatedAt: route.updated_at,
    locations: route.locations.map(l => ({
      id: l.id,
      name: l.name,
      address: l.address,
      city: l.city,
      state: l.state,
      zipCode: l.zip_code,
      coordinates: l.coordinates,
      routeOrder: l.route_order,
      notes: l.notes
    }))
  });
}));

/**
 * POST /api/routes
 * Create a new route
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim().length === 0) {
    throw new ValidationError('Route name is required');
  }

  // Check if route name already exists
  const existing = await routeRepo.getByName(name.trim());
  if (existing) {
    throw new ValidationError('Route with this name already exists');
  }

  const route = await routeRepo.create({
    name: name.trim(),
    description: description || null,
    is_active: true
  });

  res.status(201).json({
    id: route.id,
    name: route.name,
    description: route.description,
    isActive: route.is_active,
    createdAt: route.created_at,
    updatedAt: route.updated_at
  });
}));

/**
 * PUT /api/routes/:id
 * Update a route
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  const existing = await routeRepo.getById(parseInt(id));
  if (!existing) {
    throw new NotFoundError('Route', id);
  }

  // Build update data
  const updateData = {};
  if (name !== undefined) {
    if (name.trim().length === 0) {
      throw new ValidationError('Route name cannot be empty');
    }
    // Check if new name conflicts with another route
    const nameConflict = await routeRepo.getByName(name.trim());
    if (nameConflict && nameConflict.id !== parseInt(id)) {
      throw new ValidationError('Route with this name already exists');
    }
    updateData.name = name.trim();
  }
  if (description !== undefined) updateData.description = description;
  if (isActive !== undefined) updateData.is_active = isActive;

  const route = await routeRepo.update(parseInt(id), updateData);

  res.json({
    id: route.id,
    name: route.name,
    description: route.description,
    isActive: route.is_active,
    createdAt: route.created_at,
    updatedAt: route.updated_at
  });
}));

/**
 * DELETE /api/routes/:id
 * Soft delete a route
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const route = await routeRepo.softDelete(parseInt(id));
  
  if (!route) {
    throw new NotFoundError('Route', id);
  }

  res.json({
    message: 'Route deactivated successfully',
    id: route.id,
    isActive: route.is_active
  });
}));

export default router;
