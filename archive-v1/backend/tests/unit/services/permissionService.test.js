import { describe, it, expect, beforeEach, vi } from 'vitest';

// We'll create this service using TDD - write the test first!
import PermissionService from '../../../services/permissionService.js';

describe('PermissionService', () => {
  let permissionService;
  let mockDb;

  beforeEach(() => {
    // Mock database dependency
    mockDb = {
      query: jest.fn()
    };
    permissionService = new PermissionService(mockDb);
  });

  describe('getUserPermissions', () => {
    it('should return array of permission strings for user', async () => {
      // Arrange
      const userId = 1;
      const mockDbResponse = {
        rows: [
          { resource: 'friends', action: 'read' },
          { resource: 'friends', action: 'write' },
          { resource: 'users', action: 'read' },
          { resource: 'runs', action: 'manage' }
        ]
      };
      mockDb.query.mockResolvedValueOnce(mockDbResponse);

      // Act
      const permissions = await permissionService.getUserPermissions(userId);

      // Assert
      expect(permissions).toEqual([
        'friends:read',
        'friends:write', 
        'users:read',
        'runs:manage'
      ]);
      
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT p.resource, p.action'),
        [userId]
      );
    });

    it('should handle user with no permissions', async () => {
      // Arrange
      const userId = 999;
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Act
      const permissions = await permissionService.getUserPermissions(userId);

      // Assert
      expect(permissions).toEqual([]);
    });

    it('should include both role-based and custom permissions', async () => {
      // Arrange - the query should use UNION to combine role and custom permissions
      const userId = 1;
      mockDb.query.mockResolvedValueOnce({
        rows: [
          { resource: 'friends', action: 'read' }, // from role
          { resource: 'reports', action: 'read' }  // custom permission
        ]
      });

      // Act
      const permissions = await permissionService.getUserPermissions(userId);

      // Assert
      expect(permissions).toContain('friends:read');
      expect(permissions).toContain('reports:read');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UNION'), // Verify UNION query structure
        [userId]
      );
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has exact permission', async () => {
      // Arrange
      const userId = 1;
      const getUserPermissionsSpy = jest.spyOn(permissionService, 'getUserPermissions');
      getUserPermissionsSpy.mockResolvedValueOnce([
        'friends:read',
        'friends:write',
        'users:read'
      ]);

      // Act
      const result = await permissionService.hasPermission(userId, 'friends', 'read');

      // Assert
      expect(result).toBe(true);
      expect(getUserPermissionsSpy).toHaveBeenCalledWith(userId);
    });

    it('should return true when user has manage permission for resource', async () => {
      // Arrange
      const userId = 1;
      const getUserPermissionsSpy = jest.spyOn(permissionService, 'getUserPermissions');
      getUserPermissionsSpy.mockResolvedValueOnce([
        'friends:manage',
        'users:read'
      ]);

      // Act
      const result = await permissionService.hasPermission(userId, 'friends', 'write');

      // Assert
      expect(result).toBe(true); // manage implies all actions
    });

    it('should return false when user lacks permission', async () => {
      // Arrange
      const userId = 1;
      const getUserPermissionsSpy = jest.spyOn(permissionService, 'getUserPermissions');
      getUserPermissionsSpy.mockResolvedValueOnce([
        'users:read'
      ]);

      // Act
      const result = await permissionService.hasPermission(userId, 'friends', 'write');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('grantPermission', () => {
    it('should grant permission to user successfully', async () => {
      // Arrange
      const userId = 1;
      const resource = 'friends';
      const action = 'write';
      const grantedBy = 2;
      
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // permission lookup
        .mockResolvedValueOnce({ rows: [] }); // grant permission

      // Act
      await permissionService.grantPermission(userId, resource, action, grantedBy);

      // Assert
      expect(mockDb.query).toHaveBeenCalledTimes(2);
      
      // Verify permission lookup
      expect(mockDb.query).toHaveBeenNthCalledWith(1,
        'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
        [resource, action]
      );
      
      // Verify permission grant
      expect(mockDb.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO user_permissions'),
        [userId, 5, grantedBy]
      );
    });

    it('should throw error when permission does not exist', async () => {
      // Arrange
      const userId = 1;
      const resource = 'invalid';
      const action = 'nonexistent';
      const grantedBy = 2;
      
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // no permission found

      // Act & Assert
      await expect(
        permissionService.grantPermission(userId, resource, action, grantedBy)
      ).rejects.toThrow('Permission invalid:nonexistent does not exist');
    });

    it('should handle duplicate permission grants gracefully', async () => {
      // Arrange - ON CONFLICT DO NOTHING should prevent errors
      const userId = 1;
      const resource = 'friends';
      const action = 'read';
      const grantedBy = 2;
      
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 3 }] })
        .mockResolvedValueOnce({ rows: [] });

      // Act - should not throw even if permission already exists
      await expect(
        permissionService.grantPermission(userId, resource, action, grantedBy)
      ).resolves.toBeUndefined();
    });
  });

  describe('revokePermission', () => {
    it('should revoke custom permission from user', async () => {
      // Arrange
      const userId = 1;
      const resource = 'friends';
      const action = 'write';
      
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await permissionService.revokePermission(userId, resource, action);

      // Assert
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM user_permissions'),
        [userId, resource, action]
      );
    });

    it('should handle revoking non-existent permission gracefully', async () => {
      // Arrange
      const userId = 1;
      const resource = 'nonexistent';
      const action = 'action';
      
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Act & Assert - should not throw
      await expect(
        permissionService.revokePermission(userId, resource, action)
      ).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockDb.query.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(
        permissionService.getUserPermissions(1)
      ).rejects.toThrow('Database connection failed');
    });
  });
});