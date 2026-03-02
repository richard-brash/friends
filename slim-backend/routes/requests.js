// Requests Routes
// Requests CRUD endpoints with status lifecycle management

import express from 'express';
import pool from '../database.js';
import RequestRepository from '../repositories/RequestRepository.js';
import FriendRepository from '../repositories/FriendRepository.js';
import LocationRepository from '../repositories/LocationRepository.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();
const requestRepo = new RequestRepository(pool);
const friendRepo = new FriendRepository(pool);
const locationRepo = new LocationRepository(pool);

/**
 * GET /api/requests
 * Get all requests with filtering
 * Query params: status, routeId, limit, offset
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status, routeId, limit = 50, offset = 0 } = req.query;

  const requests = await requestRepo.getAllWithDetails({
    status,
    routeId: routeId ? parseInt(routeId) : undefined,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  // Get total count for pagination
  let countWhere = '';
  const countParams = [];
  if (status) {
    countWhere = 'status = $1';
    countParams.push(status);
  }
  const totalCount = await requestRepo.count(countWhere, countParams);

  res.json({
    data: requests.map(r => ({
      id: r.id,
      friendId: r.friend_id,
      friendName: [r.first_name, r.last_name, r.alias].filter(Boolean).join(' ') || 'Unknown',
      friendPhone: r.friend_phone,
      locationId: r.location_id,
      locationName: r.location_name,
      routeId: r.route_id,
      routeName: r.route_name,
      itemDescription: r.item_description,
      quantity: r.quantity,
      priority: r.priority,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    })),
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: totalCount
    }
  });
}));

/**
 * GET /api/requests/:id
 * Get single request with full details and status history
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const request = await requestRepo.getByIdWithDetails(parseInt(id));
  
  if (!request) {
    throw new NotFoundError('Request', id);
  }

  // Get status history
  const history = await requestRepo.getStatusHistory(parseInt(id));

  res.json({
    id: request.id,
    friendId: request.friend_id,
    friendName: [request.first_name, request.last_name, request.alias].filter(Boolean).join(' ') || 'Unknown',
    friendPhone: request.friend_phone,
    friendEmail: request.friend_email,
    locationId: request.location_id,
    locationName: request.location_name,
    locationAddress: request.location_address,
    locationCity: request.location_city,
    routeId: request.route_id,
    routeName: request.route_name,
    itemDescription: request.item_description,
    quantity: request.quantity,
    priority: request.priority,
    status: request.status,
    notes: request.notes,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
    statusHistory: history.map(h => ({
      id: h.id,
      fromStatus: h.from_status,
      toStatus: h.to_status,
      userId: h.user_id,
      userName: h.user_name,
      userEmail: h.user_email,
      notes: h.notes,
      createdAt: h.created_at
    }))
  });
}));

/**
 * GET /api/requests/route/:routeId
 * Get all requests for a specific route
 */
router.get('/route/:routeId', authenticate, asyncHandler(async (req, res) => {
  const { routeId } = req.params;
  const { status } = req.query;

  const requests = await requestRepo.getByRoute(
    parseInt(routeId),
    status || null
  );

  res.json({
    routeId: parseInt(routeId),
    data: requests.map(r => ({
      id: r.id,
      friendId: r.friend_id,
      friendName: [r.first_name, r.last_name, r.alias].filter(Boolean).join(' ') || 'Unknown',
      locationId: r.location_id,
      locationName: r.location_name,
      routeOrder: r.route_order,
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
 * POST /api/requests
 * Create a new request (with status history tracking)
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { 
    friendId, 
    locationId, 
    itemDescription, 
    quantity, 
    priority,
    notes 
  } = req.body;

  // Validation
  if (!friendId) {
    throw new ValidationError('Friend ID is required');
  }
  if (!locationId) {
    throw new ValidationError('Location ID is required');
  }
  if (!itemDescription || itemDescription.trim().length === 0) {
    throw new ValidationError('Item description is required');
  }

  // Verify friend exists
  const friend = await friendRepo.getById(parseInt(friendId));
  if (!friend) {
    throw new NotFoundError('Friend', friendId);
  }

  // Verify location exists
  const location = await locationRepo.getById(parseInt(locationId));
  if (!location) {
    throw new NotFoundError('Location', locationId);
  }

  // Create request with history
  const request = await requestRepo.createWithHistory({
    friend_id: parseInt(friendId),
    location_id: parseInt(locationId),
    item_description: itemDescription.trim(),
    quantity: quantity ? parseInt(quantity) : 1,
    priority: priority || 'medium',
    notes: notes || null
  }, req.user.id);

  res.status(201).json({
    id: request.id,
    friendId: request.friend_id,
    locationId: request.location_id,
    itemDescription: request.item_description,
    quantity: request.quantity,
    priority: request.priority,
    status: request.status,
    notes: request.notes,
    createdAt: request.created_at,
    updatedAt: request.updated_at
  });
}));

/**
 * PUT /api/requests/:id
 * Update request details (not status - use PATCH for status changes)
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { itemDescription, quantity, priority, notes } = req.body;

  const existing = await requestRepo.getById(parseInt(id));
  if (!existing) {
    throw new NotFoundError('Request', id);
  }

  // Build update data (exclude status - use PATCH for status changes)
  const updateData = {};
  if (itemDescription !== undefined) {
    if (itemDescription.trim().length === 0) {
      throw new ValidationError('Item description cannot be empty');
    }
    updateData.item_description = itemDescription.trim();
  }
  if (quantity !== undefined) updateData.quantity = parseInt(quantity);
  if (priority !== undefined) updateData.priority = priority;
  if (notes !== undefined) updateData.notes = notes;

  const request = await requestRepo.update(parseInt(id), updateData);

  res.json({
    id: request.id,
    friendId: request.friend_id,
    locationId: request.location_id,
    itemDescription: request.item_description,
    quantity: request.quantity,
    priority: request.priority,
    status: request.status,
    notes: request.notes,
    createdAt: request.created_at,
    updatedAt: request.updated_at
  });
}));

/**
 * PATCH /api/requests/:id/status
 * Update request status (with history tracking)
 */
router.patch('/:id/status', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    throw new ValidationError('Status is required');
  }

  const validStatuses = ['pending', 'ready_for_delivery', 'taken', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const existing = await requestRepo.getById(parseInt(id));
  if (!existing) {
    throw new NotFoundError('Request', id);
  }

  // Update status with history tracking
  const request = await requestRepo.updateStatus(
    parseInt(id),
    status,
    req.user.id,
    notes || null
  );

  res.json({
    id: request.id,
    status: request.status,
    updatedAt: request.updated_at,
    message: `Status updated to ${status}`
  });
}));

/**
 * DELETE /api/requests/:id
 * Cancel a request (sets status to 'cancelled' with history)
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const existing = await requestRepo.getById(parseInt(id));
  if (!existing) {
    throw new NotFoundError('Request', id);
  }

  // Cancel request with history
  const request = await requestRepo.updateStatus(
    parseInt(id),
    'cancelled',
    req.user.id,
    notes || 'Request cancelled'
  );

  res.json({
    message: 'Request cancelled successfully',
    id: request.id,
    status: request.status
  });
}));

export default router;
