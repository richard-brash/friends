// Friends Routes
// Friends CRUD endpoints

import express from 'express';
import pool from '../database.js';
import FriendRepository from '../repositories/FriendRepository.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();
const friendRepo = new FriendRepository(pool);

/**
 * GET /api/friends
 * Get all friends with optional filtering
 * Query params: status, search, limit, offset
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { 
    status = 'active', 
    search, 
    limit = 50, 
    offset = 0 
  } = req.query;

  let friends;

  if (search) {
    // Search by name
    friends = await friendRepo.search(search, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } else if (status === 'active') {
    // Get active friends
    friends = await friendRepo.getAllActive({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } else {
    // Get all with status filter
    friends = await friendRepo.getAll({
      where: status ? 'status = $1' : '',
      params: status ? [status] : [],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }

  // Get total count for pagination
  const countWhere = status ? 'status = $1' : '';
  const countParams = status ? [status] : [];
  const totalCount = await friendRepo.count(countWhere, countParams);

  res.json({
    data: friends.map(f => ({
      id: f.id,
      firstName: f.first_name,
      lastName: f.last_name,
      alias: f.alias,
      phone: f.phone,
      email: f.email,
      notes: f.notes,
      status: f.status,
      displayName: FriendRepository.getDisplayName(f),
      createdAt: f.created_at,
      updatedAt: f.updated_at
    })),
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: totalCount
    }
  });
}));

/**
 * GET /api/friends/:id
 * Get single friend by ID with location history
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const friend = await friendRepo.getById(parseInt(id));
  
  if (!friend) {
    throw new NotFoundError('Friend', id);
  }

  // Get location history
  const locationHistory = await friendRepo.getLocationHistory(parseInt(id), 10);

  res.json({
    id: friend.id,
    firstName: friend.first_name,
    lastName: friend.last_name,
    alias: friend.alias,
    phone: friend.phone,
    email: friend.email,
    notes: friend.notes,
    status: friend.status,
    displayName: FriendRepository.getDisplayName(friend),
    createdAt: friend.created_at,
    updatedAt: friend.updated_at,
    locationHistory: locationHistory.map(lh => ({
      id: lh.id,
      locationId: lh.location_id,
      locationName: lh.location_name,
      address: lh.address,
      city: lh.city,
      state: lh.state,
      routeName: lh.route_name,
      spottedAt: lh.spotted_at,
      spottedBy: lh.spotted_by,
      spottedByName: lh.spotted_by_name,
      notes: lh.notes
    }))
  });
}));

/**
 * POST /api/friends
 * Create a new friend
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { firstName, lastName, alias, phone, email, notes } = req.body;

  // Validation: at least one name field required
  if (!firstName && !lastName && !alias) {
    throw new ValidationError('At least one of firstName, lastName, or alias is required');
  }

  const friend = await friendRepo.create({
    first_name: firstName || null,
    last_name: lastName || null,
    alias: alias || null,
    phone: phone || null,
    email: email || null,
    notes: notes || null,
    status: 'active'
  });

  res.status(201).json({
    id: friend.id,
    firstName: friend.first_name,
    lastName: friend.last_name,
    alias: friend.alias,
    phone: friend.phone,
    email: friend.email,
    notes: friend.notes,
    status: friend.status,
    displayName: FriendRepository.getDisplayName(friend),
    createdAt: friend.created_at,
    updatedAt: friend.updated_at
  });
}));

/**
 * PUT /api/friends/:id
 * Update a friend
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, alias, phone, email, notes, status } = req.body;

  // Check if friend exists
  const existing = await friendRepo.getById(parseInt(id));
  if (!existing) {
    throw new NotFoundError('Friend', id);
  }

  // Build update data (only include provided fields)
  const updateData = {};
  if (firstName !== undefined) updateData.first_name = firstName;
  if (lastName !== undefined) updateData.last_name = lastName;
  if (alias !== undefined) updateData.alias = alias;
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (notes !== undefined) updateData.notes = notes;
  if (status !== undefined) updateData.status = status;

  const friend = await friendRepo.update(parseInt(id), updateData);

  res.json({
    id: friend.id,
    firstName: friend.first_name,
    lastName: friend.last_name,
    alias: friend.alias,
    phone: friend.phone,
    email: friend.email,
    notes: friend.notes,
    status: friend.status,
    displayName: FriendRepository.getDisplayName(friend),
    createdAt: friend.created_at,
    updatedAt: friend.updated_at
  });
}));

/**
 * DELETE /api/friends/:id
 * Soft delete a friend (set status to 'inactive')
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const friend = await friendRepo.softDelete(parseInt(id));
  
  if (!friend) {
    throw new NotFoundError('Friend', id);
  }

  res.json({
    message: 'Friend deactivated successfully',
    id: friend.id,
    status: friend.status
  });
}));

/**
 * POST /api/friends/:id/sightings
 * Record a friend sighting at a location
 */
router.post('/:id/sightings', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { locationId, spottedAt, notes } = req.body;

  if (!locationId) {
    throw new ValidationError('locationId is required');
  }

  // Check if friend exists
  const friend = await friendRepo.getById(parseInt(id));
  if (!friend) {
    throw new NotFoundError('Friend', id);
  }

  const sighting = await friendRepo.recordSighting({
    friendId: parseInt(id),
    locationId: parseInt(locationId),
    spottedBy: req.user.id,
    spottedAt: spottedAt || new Date(),
    notes: notes || null
  });

  res.status(201).json({
    id: sighting.id,
    friendId: sighting.friend_id,
    locationId: sighting.location_id,
    spottedBy: sighting.spotted_by,
    spottedAt: sighting.spotted_at,
    notes: sighting.notes,
    createdAt: sighting.created_at
  });
}));

/**
 * GET /api/friends/:id/requests
 * Get friend's active requests
 */
router.get('/:id/requests', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const friendWithRequests = await friendRepo.getWithRequests(parseInt(id));
  
  if (!friendWithRequests) {
    throw new NotFoundError('Friend', id);
  }

  res.json({
    friend: {
      id: friendWithRequests.id,
      displayName: FriendRepository.getDisplayName(friendWithRequests)
    },
    requests: friendWithRequests.requests.map(r => ({
      id: r.id,
      itemDescription: r.item_description,
      quantity: r.quantity,
      priority: r.priority,
      status: r.status,
      locationName: r.location_name,
      routeName: r.route_name,
      notes: r.notes,
      createdAt: r.created_at
    }))
  });
}));

export default router;
