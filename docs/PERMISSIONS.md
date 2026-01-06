# Permission-Based Authorization System

## Overview

Replace simple role-based access control with granular permission system that allows fine-grained control over what users can access and modify.

## Permission Model

### Resources (What)
- `users` - User management
- `friends` - Friend profiles and data
- `locations` - Delivery locations
- `routes` - Delivery routes
- `runs` - Scheduled delivery runs
- `requests` - Delivery requests
- `reports` - Analytics and reporting

### Actions (How)
- `read` - View/list data
- `write` - Create/update data  
- `delete` - Remove data
- `manage` - Full control (implies read/write/delete)

### Permission Format
`{resource}:{action}` (e.g., `friends:read`, `users:manage`, `requests:write`)

## Default Role Permissions

### Admin
```javascript
const ADMIN_PERMISSIONS = [
  'users:manage',      // Full user management
  'friends:manage',    // Full friend management
  'locations:manage',  // Full location management
  'routes:manage',     // Full route management
  'runs:manage',       // Full run management
  'requests:manage',   // Full request management
  'reports:read'       // View all reports
];
```

### Coordinator
```javascript
const COORDINATOR_PERMISSIONS = [
  'users:read',        // View user names/details for assignment
  'friends:manage',    // Full friend management
  'locations:manage',  // Full location management
  'routes:manage',     // Full route management
  'runs:manage',       // Full run management
  'requests:manage',   // Full request management
  'reports:read'       // View delivery reports
];
```

### Volunteer
```javascript
const VOLUNTEER_PERMISSIONS = [
  'users:read',        // View user names for team info
  'friends:read',      // View friend names for deliveries
  'locations:read',    // View delivery locations
  'routes:read',       // View assigned routes
  'runs:read',         // View assigned runs
  'requests:write'     // Update delivery status only
];
```

## Database Schema

### Permissions Table
```sql
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource, action)
);

-- Seed basic permissions
INSERT INTO permissions (resource, action, description) VALUES
('users', 'read', 'View user profiles and names'),
('users', 'write', 'Create and update user accounts'),
('users', 'delete', 'Remove user accounts'),
('users', 'manage', 'Full user management'),
('friends', 'read', 'View friend profiles'),
('friends', 'write', 'Create and update friend profiles'),
('friends', 'delete', 'Remove friend profiles'),
('friends', 'manage', 'Full friend management'),
('locations', 'read', 'View location details'),
('locations', 'write', 'Create and update locations'),
('locations', 'delete', 'Remove locations'),
('locations', 'manage', 'Full location management'),
('routes', 'read', 'View route details'),
('routes', 'write', 'Create and update routes'),
('routes', 'delete', 'Remove routes'),
('routes', 'manage', 'Full route management'),
('runs', 'read', 'View run details'),
('runs', 'write', 'Create and update runs'),
('runs', 'delete', 'Cancel/remove runs'),
('runs', 'manage', 'Full run management'),
('requests', 'read', 'View delivery requests'),
('requests', 'write', 'Update delivery status'),
('requests', 'delete', 'Cancel delivery requests'),
('requests', 'manage', 'Full request management'),
('reports', 'read', 'View analytics and reports');
```

### User Permissions Table
```sql
-- Junction table for custom user permissions (beyond role defaults)
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by INTEGER REFERENCES users(id), -- Who granted this permission
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission_id)
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);
```

### Role Permissions Table
```sql
-- Default permissions for each role
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'coordinator', 'volunteer')),
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role);
```

## Service Layer Implementation

### Permission Service
```javascript
class PermissionService {
  constructor(database) {
    this.db = database;
  }

  // Get all permissions for a user (role + custom)
  async getUserPermissions(userId) {
    const result = await this.db.query(`
      SELECT DISTINCT p.resource, p.action
      FROM permissions p
      JOIN (
        -- Role-based permissions
        SELECT rp.permission_id 
        FROM role_permissions rp
        JOIN users u ON u.role = rp.role
        WHERE u.id = $1
        
        UNION
        
        -- Custom user permissions
        SELECT up.permission_id
        FROM user_permissions up
        WHERE up.user_id = $1
      ) user_perms ON p.id = user_perms.permission_id
    `, [userId]);

    return result.rows.map(row => `${row.resource}:${row.action}`);
  }

  // Check if user has specific permission
  async hasPermission(userId, resource, action) {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(`${resource}:${action}`) || 
           permissions.includes(`${resource}:manage`);
  }

  // Grant custom permission to user
  async grantPermission(userId, resource, action, grantedBy) {
    const permissionResult = await this.db.query(
      'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
      [resource, action]
    );

    if (permissionResult.rows.length === 0) {
      throw new Error(`Permission ${resource}:${action} does not exist`);
    }

    await this.db.query(`
      INSERT INTO user_permissions (user_id, permission_id, granted_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, permission_id) DO NOTHING
    `, [userId, permissionResult.rows[0].id, grantedBy]);
  }

  // Revoke custom permission from user
  async revokePermission(userId, resource, action) {
    await this.db.query(`
      DELETE FROM user_permissions up
      USING permissions p
      WHERE up.permission_id = p.id
        AND up.user_id = $1
        AND p.resource = $2
        AND p.action = $3
    `, [userId, resource, action]);
  }
}
```

## Middleware Implementation

### Permission Middleware
```javascript
import PermissionService from '../services/permissionService.js';

const permissionService = new PermissionService(database);

// Middleware to check permissions
export const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      const hasPermission = await permissionService.hasPermission(
        req.user.id, 
        resource, 
        action
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Permission denied: ${resource}:${action}`,
            required: `${resource}:${action}`,
            user: req.user.email
          }
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: 'Failed to verify permissions'
        }
      });
    }
  };
};

// Helper for multiple permissions (any of them)
export const requireAnyPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' }
        });
      }

      for (const perm of permissions) {
        const [resource, action] = perm.split(':');
        const hasPermission = await permissionService.hasPermission(
          req.user.id, resource, action
        );
        if (hasPermission) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Permission denied: requires one of ${permissions.join(', ')}`,
          required: permissions,
          user: req.user.email
        }
      });
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: 'Failed to verify permissions'
        }
      });
    }
  };
};
```

## Route Protection Examples

```javascript
import { requirePermission, requireAnyPermission } from '../middleware/permissions.js';

// Friends routes
router.get('/friends', requirePermission('friends', 'read'), getFriends);
router.post('/friends', requirePermission('friends', 'write'), createFriend);
router.delete('/friends/:id', requirePermission('friends', 'delete'), deleteFriend);

// Users routes (volunteers can read names, only admins can manage)
router.get('/users', requirePermission('users', 'read'), getUsers);
router.post('/users', requirePermission('users', 'write'), createUser);
router.delete('/users/:id', requirePermission('users', 'delete'), deleteUser);

// Requests (volunteers can update status, coordinators can manage)
router.get('/requests', requirePermission('requests', 'read'), getRequests);
router.patch('/requests/:id/status', requireAnyPermission('requests:write', 'requests:manage'), updateRequestStatus);
router.post('/requests', requirePermission('requests', 'write'), createRequest);
router.delete('/requests/:id', requirePermission('requests', 'delete'), deleteRequest);
```

## Frontend Integration

### Permission Hook
```javascript
// hooks/usePermissions.js
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../config/api';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPermissions();
    }
  }, [user]);

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/auth/permissions');
      setPermissions(response.data.permissions);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (resource, action) => {
    return permissions.includes(`${resource}:${action}`) || 
           permissions.includes(`${resource}:manage`);
  };

  return { permissions, hasPermission, loading };
};
```

### Permission-Aware Components
```jsx
import { usePermissions } from '../hooks/usePermissions';

const UserManagementButton = () => {
  const { hasPermission } = usePermissions();

  if (!hasPermission('users', 'write')) {
    return null; // Hide component if no permission
  }

  return <Button onClick={openUserManagement}>Manage Users</Button>;
};

const FriendsList = () => {
  const { hasPermission } = usePermissions();

  return (
    <div>
      {friends.map(friend => (
        <div key={friend.id}>
          <span>{friend.name}</span>
          {hasPermission('friends', 'write') && (
            <Button onClick={() => editFriend(friend.id)}>Edit</Button>
          )}
          {hasPermission('friends', 'delete') && (
            <Button onClick={() => deleteFriend(friend.id)}>Delete</Button>
          )}
        </div>
      ))}
    </div>
  );
};
```

## Benefits

1. **Granular Control**: Exact permissions per resource and action
2. **Flexible Assignment**: Custom permissions beyond role defaults
3. **Clear Audit Trail**: Track who granted permissions and when
4. **Easy Extension**: Add new resources/actions without code changes
5. **Frontend Integration**: Components automatically hide/show based on permissions
6. **API Security**: Every endpoint protected with specific permission requirements

## Migration Strategy

1. Add permission tables to database
2. Seed with default role permissions
3. Create permission service and middleware
4. Update one route at a time from role-based to permission-based
5. Update frontend components to use permission hooks
6. Remove old role-based middleware