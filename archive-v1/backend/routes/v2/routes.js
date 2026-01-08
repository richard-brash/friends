/**
 * V2 Routes API - Clean Architecture Implementation
 * Follows established patterns from V2 Runs and Friends APIs
 * Provides RESTful endpoints with proper error handling
 */

import express from 'express';
import CleanRouteService from '../../services/cleanRouteService.js';
import { query } from '../../database.js';
import { authenticateToken, authorizeRoles } from '../../src/middleware/auth.js';
import { ValidationError, NotFoundError, DatabaseError } from '../../utils/errors.js';

const router = express.Router();

// Initialize service with database connection
const routeService = new CleanRouteService({ query });

/**
 * GET /api/v2/routes
 * Get all routes with location and friend counts
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const routes = await routeService.getAll();
    res.json({
      success: true,
      data: routes,
      count: routes.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/routes/:id
 * Get route by ID with detailed location information
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid route ID'
      });
    }

    const route = await routeService.getById(routeId);
    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/routes
 * Create new route
 * Requires: admin or coordinator role
 */
router.post('/', authenticateToken, authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    const routeData = {
      name: name?.trim(),
      description: description?.trim() || null,
      color: color || '#1976d2'
    };

    const route = await routeService.create(routeData);
    res.status(201).json({
      success: true,
      data: route,
      message: 'Route created successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v2/routes/:id
 * Update route
 * Requires: admin or coordinator role
 */
router.put('/:id', authenticateToken, authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid route ID'
      });
    }

    const { name, description, color } = req.body;

    const routeData = {
      name: name?.trim(),
      description: description?.trim() || null,
      color: color || '#1976d2'
    };

    const route = await routeService.update(routeId, routeData);
    res.json({
      success: true,
      data: route,
      message: 'Route updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v2/routes/:id
 * Delete route (only if no locations assigned)
 * Requires: admin role
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid route ID'
      });
    }

    const route = await routeService.delete(routeId);
    res.json({
      success: true,
      data: route,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/routes/:id/locations
 * Add location to route
 * Requires: admin or coordinator role
 */
router.post('/:id/locations', authenticateToken, authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid route ID'
      });
    }

    const { locationId, orderInRoute } = req.body;

    if (!locationId || isNaN(parseInt(locationId))) {
      return res.status(400).json({
        success: false,
        error: 'Valid location ID is required'
      });
    }

    const result = await routeService.addLocation(
      routeId, 
      parseInt(locationId), 
      orderInRoute ? parseInt(orderInRoute) : null
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Location added to route successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v2/routes/:id/locations/:locationId
 * Remove location from route
 * Requires: admin or coordinator role
 */
router.delete('/:id/locations/:locationId', authenticateToken, authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { id, locationId } = req.params;
    const routeId = parseInt(id);
    const locId = parseInt(locationId);

    if (isNaN(routeId) || isNaN(locId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid route ID or location ID'
      });
    }

    const result = await routeService.removeLocation(routeId, locId);
    res.json({
      success: true,
      data: result,
      message: 'Location removed from route successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v2/routes/:id/locations/reorder
 * Reorder locations in route
 * Requires: admin or coordinator role
 */
router.put('/:id/locations/reorder', authenticateToken, authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid route ID'
      });
    }

    const { locationOrders } = req.body;

    if (!Array.isArray(locationOrders)) {
      return res.status(400).json({
        success: false,
        error: 'locationOrders must be an array of {locationId, orderInRoute} objects'
      });
    }

    // Validate each order entry
    for (const order of locationOrders) {
      if (!order.locationId || !order.orderInRoute || 
          isNaN(parseInt(order.locationId)) || isNaN(parseInt(order.orderInRoute))) {
        return res.status(400).json({
          success: false,
          error: 'Each locationOrder must have valid locationId and orderInRoute'
        });
      }
    }

    const result = await routeService.reorderLocations(routeId, locationOrders);
    res.json({
      success: true,
      data: result,
      message: 'Location order updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;