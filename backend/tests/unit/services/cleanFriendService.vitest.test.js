/**
 * CleanFriendService Tests - Vitest Version
 * Simple, clean tests without configuration complexity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import CleanFriendService from '../../../services/cleanFriendService.js';
import { ValidationError, NotFoundError, DatabaseError } from '../../../utils/errors.js';

describe('CleanFriendService', () => {
  let friendService;
  let mockDb;
  let mockLogger;

  beforeEach(() => {
    // Mock dependencies
    mockDb = {
      query: vi.fn()
    };
    
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn()
    };
    
    // Instantiate service with mocks
    friendService = new CleanFriendService(mockDb, mockLogger);
  });

  describe('getAll', () => {
    it('should return transformed friends with location and request count', async () => {
      // Arrange - mock database response
      const mockDbFriends = [
        {
          id: 1,
          name: 'John Doe',
          nickname: 'Johnny',
          email: 'john@example.com',
          phone: '555-0123',
          notes: 'Regular visitor',
          clothing_sizes: { shirt: 'L', pants: '32x30' },
          dietary_restrictions: 'Vegetarian',
          status: 'active',
          last_contact: new Date('2025-01-15T10:00:00Z'),
          current_location_id: 1,
          location_name: 'Downtown Park',
          request_count: '3',
          created_at: new Date('2025-01-01T00:00:00Z'),
          updated_at: new Date('2025-01-15T00:00:00Z')
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockDbFriends });

      // Act
      const result = await friendService.getAll();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        name: 'John Doe',
        nickname: 'Johnny',
        email: 'john@example.com',
        phone: '555-0123',
        notes: 'Regular visitor',
        clothingSizes: { shirt: 'L', pants: '32x30' },
        dietaryRestrictions: 'Vegetarian',
        status: 'active',
        lastContact: '2025-01-15T10:00:00.000Z',
        currentLocationId: 1,
        locationName: 'Downtown Park',
        requestCount: 3,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T00:00:00.000Z'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

      // Act & Assert
      await expect(friendService.getAll()).rejects.toThrow(DatabaseError);
    });
  });

  describe('create', () => {
    it('should create friend with valid data', async () => {
      // Arrange
      const friendData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-0456',
        status: 'active'
      };

      const mockCreatedFriend = {
        id: 2,
        name: 'Jane Smith',
        nickname: null,
        email: 'jane@example.com',
        phone: '555-0456',
        notes: null,
        clothing_sizes: null,
        dietary_restrictions: null,
        status: 'active',
        last_contact: null,
        current_location_id: null,
        created_at: new Date('2025-01-16T00:00:00Z'),
        updated_at: new Date('2025-01-16T00:00:00Z')
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockCreatedFriend] });

      // Act
      const result = await friendService.create(friendData);

      // Assert
      expect(result).toEqual({
        id: 2,
        name: 'Jane Smith',
        nickname: null,
        email: 'jane@example.com',
        phone: '555-0456',
        notes: null,
        clothingSizes: null,
        dietaryRestrictions: null,
        status: 'active',
        lastContact: null,
        currentLocationId: null,
        locationName: null,
        requestCount: 0,
        createdAt: '2025-01-16T00:00:00.000Z',
        updatedAt: '2025-01-16T00:00:00.000Z'
      });
    });

    it('should throw ValidationError for missing name', async () => {
      // Arrange
      const invalidData = { email: 'test@example.com' };

      // Act & Assert
      await expect(friendService.create(invalidData))
        .rejects.toThrow(ValidationError);
    });
  });
});