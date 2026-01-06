/**
 * CleanFriendService Integration Tests
 * Tests real database operations to catch issues that mocks miss
 * Note: Currently uses main database - TODO: Set up dedicated test database
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { query } from '../../database.js';
import CleanFriendService from '../../services/cleanFriendService.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';

// Skip integration tests if we don't have database access
// TODO: Set up proper test database isolation
describe.skip('CleanFriendService Integration Tests', () => {
  let friendService;
  let testFriendIds = [];

  beforeEach(async () => {
    friendService = new CleanFriendService({ query });
    testFriendIds = [];
  });

  afterEach(async () => {
    // Cleanup: Remove test friends
    for (const id of testFriendIds) {
      try {
        await query('DELETE FROM friends WHERE id = $1', [id]);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Real Database Operations', () => {
    it('should create and retrieve a friend with real database', async () => {
      // Create friend
      const friendData = {
        name: 'Integration Test Friend',
        nickname: 'TestFriend',
        email: 'test@integration.com',
        phone: '555-0123',
        status: 'active'
      };

      const createdFriend = await friendService.create(friendData);
      testFriendIds.push(createdFriend.id);

      expect(createdFriend).toMatchObject({
        name: friendData.name,
        nickname: friendData.nickname,
        email: friendData.email,
        phone: friendData.phone,
        status: friendData.status
      });
      expect(createdFriend.id).toBeDefined();
      expect(createdFriend.createdAt).toBeDefined();

      // Retrieve friend
      const retrievedFriend = await friendService.getById(createdFriend.id);
      expect(retrievedFriend).toMatchObject(createdFriend);
    });

    it('should handle database constraints and validations', async () => {
      // Test invalid email constraint (if database has email validation)
      const invalidFriend = {
        name: 'Test Friend',
        email: 'not-an-email' // Invalid email format
      };

      // This might throw database constraint error or validation error
      await expect(friendService.create(invalidFriend))
        .rejects.toThrow();
    });

    it('should filter friends correctly with real data', async () => {
      // Create test friends
      const friend1 = await friendService.create({
        name: 'Active Friend',
        status: 'active'
      });
      testFriendIds.push(friend1.id);

      const friend2 = await friendService.create({
        name: 'Inactive Friend', 
        status: 'inactive'
      });
      testFriendIds.push(friend2.id);

      // Test status filtering
      const activeFriends = await friendService.getAll({ status: 'active' });
      const activeTestFriend = activeFriends.find(f => f.id === friend1.id);
      expect(activeTestFriend).toBeDefined();

      const inactiveFriends = await friendService.getAll({ status: 'inactive' });
      const inactiveTestFriend = inactiveFriends.find(f => f.id === friend2.id);
      expect(inactiveTestFriend).toBeDefined();
    });

    it('should properly handle database transactions', async () => {
      // Create friend
      const friend = await friendService.create({
        name: 'Transaction Test Friend'
      });
      testFriendIds.push(friend.id);

      // Update friend
      const updatedFriend = await friendService.update(friend.id, {
        nickname: 'Updated Nickname'
      });

      expect(updatedFriend.nickname).toBe('Updated Nickname');
      expect(updatedFriend.updatedAt).not.toBe(friend.updatedAt);
    });
  });
});