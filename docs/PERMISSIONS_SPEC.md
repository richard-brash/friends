# Permissions Specification - Friends Outreach CRM V2

**Last Updated:** January 9, 2026  
**Status:** Phase 1 - Business Analysis

---

## Overview

This document defines who can do what in the system. For MVP, permissions are intentionally simple to accelerate development. Fine-grained Attribute-Based Access Control (ABAC) is deferred to Phase 2.

---

## MVP Permissions Model (Phase 1)

### Simple Rule: Authenticated = Full Access

**If user has account → User can access all features**

**Rationale:**
- Small team (5-10 concurrent users)
- High trust environment (faith-based organization, volunteers)
- Faster MVP delivery (no complex permission system to build/test)
- Real permission needs will emerge through usage

**Implementation:**
- Authentication: JWT-based, email OR phone + password
- Authorization: Single check - `isAuthenticated()`
- No role field, no permission tables, no ABAC rules

**What this means:**
- All authenticated users can:
  - View all friends, locations, routes, runs, requests
  - Create/edit/delete any entity
  - Schedule runs and assign team members
  - Execute runs (if scheduled or not)
  - Manage request lifecycle
  - Mark runs complete
  - View all data

**What's NOT included in MVP:**
- Role-based restrictions (Admin, Coordinator, Volunteer)
- Context-based restrictions ("can only edit runs I'm scheduled for")
- Field-level restrictions ("can see friend name but not phone")
- Action-level restrictions ("can view but not edit")

---

## Screen-Level Access (MVP)

### All Authenticated Users Can Access:

**Field Execution Context:**
- ✅ My Runs (shows all runs where user is team member)
- ✅ Run Preparation
- ✅ Active Run
- ✅ Run Complete

**Run Planning Context:**
- ✅ Routes List
- ✅ Route Detail
- ✅ Runs List
- ✅ Run Detail
- ✅ Create/Edit Run

**Request Fulfillment Context:**
- ✅ Requests List
- ✅ Request Detail
- ✅ Create Request

**Generic CRUD:**
- ✅ Friends List
- ✅ Friend Detail
- ✅ Locations List
- ✅ Location Detail

**No screens are restricted in MVP.**

---

## Feature-Level Access (MVP)

### What Everyone Can Do:

**Friend Management:**
- ✅ View all friends
- ✅ Create friends
- ✅ Edit friends
- ✅ Mark friends active/inactive
- ✅ View friend location history
- ✅ Spot friends (update location)

**Location & Route Management:**
- ✅ View all locations and routes
- ✅ Create locations
- ✅ Edit locations
- ✅ Reorder locations on routes
- ✅ Create routes (rare)
- ✅ Edit routes (rare)

**Run Management:**
- ✅ View all runs
- ✅ Create runs
- ✅ Assign team members to any run
- ✅ Edit run details (if planned status)
- ✅ Start any run (not just runs they're on)
- ✅ Execute any run
- ✅ Complete any run
- ✅ Cancel runs

**Request Management:**
- ✅ View all requests
- ✅ Create requests
- ✅ Mark requests ready for delivery
- ✅ Mark requests delivered
- ✅ Cancel requests

**User Management:**
- ⚠️ Deferred - No UI for user management in MVP
- Users created manually (direct database or admin script)
- Password reset via manual process

---

## Data Visibility (MVP)

### Everyone Sees Everything

**Friend Data:**
- ✅ Name, alias, phone, email, status
- ✅ Location history (all locations)
- ✅ Request history (all requests)
- ✅ Delivery history

**Request Data:**
- ✅ All requests regardless of status
- ✅ Full request details
- ✅ Status history (who changed what, when)

**Run Data:**
- ✅ All runs (past, present, future)
- ✅ All team members on all runs
- ✅ Run statistics and summaries

**User Data:**
- ✅ Names of all users (for team assignment)
- ❌ Email/phone of other users (not needed for MVP)
- ❌ Passwords (never visible)

**No data is hidden based on context or relationship.**

---

## Business Rules (Not Permissions)

These are validation rules, not permission restrictions:

### Run Lifecycle Rules:
- ✅ Can edit run details ONLY if status = "planned"
- ✅ Cannot edit run after status = "in_progress" or "completed"
- ✅ Can start run if status = "planned"
- ✅ Can complete run if status = "in_progress"
- ❌ Cannot un-complete a run

**Enforcement:** Backend validation, not permission check

### Request Lifecycle Rules:
- ✅ Can mark "ready" if status = "pending"
- ✅ Can mark "taken" if status = "ready_for_delivery"
- ✅ Can mark "delivered" if status = "taken"
- ✅ Can cancel any non-delivered request
- ❌ Cannot modify delivered requests

**Enforcement:** Backend validation, not permission check

### Data Integrity Rules:
- ✅ Friend requires at least one of: first name, last name, alias
- ✅ Request requires friend + location
- ✅ Run requires route + date
- ✅ Location requires route

**Enforcement:** Database constraints + backend validation

---

## Authentication Flow (MVP)

### Login Process:

1. User visits `/login`
2. Enters email OR phone number + password
3. Backend validates credentials:
   - Looks up user by email or phone
   - Compares bcrypt hash
4. If valid:
   - Generate JWT token (24-hour expiration)
   - Include in token: `user_id`, `name`, `email` (or phone)
   - Return token to client
5. Client stores token (localStorage or httpOnly cookie)
6. All API requests include token in Authorization header

### Authorization Check:

```
Every protected API endpoint:
1. Extract JWT from Authorization header
2. Verify JWT signature
3. Check expiration
4. If valid → allow request
5. If invalid → return 401 Unauthorized

No additional permission checks in MVP
```

### Token Structure:

```json
{
  "user_id": 123,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "iat": 1704747600,
  "exp": 1704834000
}
```

**No role or permissions array in token.**

---

## Phase 2: Fine-Grained Permissions (Future)

### Planned ABAC Model

When permission needs emerge, implement Attribute-Based Access Control:

**User Attributes:**
- Role: admin, coordinator, volunteer
- Team membership: which runs user is on
- Special flags: can_manage_users, can_edit_routes

**Resource Attributes:**
- Run status: planned, in_progress, completed
- Request status: pending, ready, taken, delivered
- Ownership: created_by user

**Context Attributes:**
- Time: is_scheduled (user on this run)
- Relationship: is_team_member, is_team_lead

**Action Attributes:**
- CRUD operations: create, read, update, delete
- Lifecycle transitions: start_run, complete_run, mark_delivered

### Example Phase 2 Rules:

**Run Editing:**
- Admin: Can edit any run, any status
- Coordinator: Can edit runs with status = "planned"
- Volunteer: Can edit runs where they're team member AND status = "planned"

**Run Execution:**
- Anyone: Can view any run
- Scheduled team: Can start/execute/complete run if on team
- Coordinator/Admin: Can start/execute any run (override)

**Request Management:**
- Admin/Coordinator: Full CRUD
- Volunteer: Can create, can view all, can mark delivered (only during active run)

**User Management:**
- Admin: Full CRUD on users
- Coordinator: Can create volunteers, cannot edit admins
- Volunteer: View only

**Friend Data:**
- Admin/Coordinator: Full CRUD
- Volunteer: View all, edit during run (quick add, spot)
- Friend (as user): View own data only

### Implementation Approach (Phase 2):

1. Add `role` field to users table
2. Create `permissions` table with ABAC rules
3. Create `user_permissions` junction table
4. Implement permission middleware: `requirePermission(resource, action, context)`
5. Update all routes to check permissions
6. Update UI to hide unauthorized actions
7. Add permission management UI (admin only)

---

## Security Considerations (MVP)

### What We're Protecting:

**Friend Data:**
- Sensitive: Names, aliases (street names), phone, email, location history
- Risk: Homeless population, potential safety issues if data leaked
- Mitigation: Authentication required, HTTPS, no public endpoints

**Request Data:**
- Sensitive: What friends need, where they are
- Risk: Privacy violation, potential exploitation
- Mitigation: Authentication required, no public access

**Run Data:**
- Low sensitivity: Routes, schedules, team assignments
- Risk: Minimal (public knowledge which locations served)
- Mitigation: Authentication for consistency

### What We're NOT Protecting (MVP):

- ❌ Field-level data hiding (all authenticated users see all fields)
- ❌ Row-level security (all authenticated users see all records)
- ❌ Audit logging (who viewed what)
- ❌ Data export restrictions
- ❌ IP-based access control
- ❌ Two-factor authentication

**Rationale:** Small trusted team, low risk tolerance, MVP speed priority

### Phase 2 Security Enhancements:

- Audit logging (who did what, when)
- Row-level security (limit data by relationship)
- Data export restrictions (admin only)
- Password complexity requirements
- Account lockout after failed attempts
- Session management (force logout, view active sessions)

---

## API Authorization Patterns (MVP)

### Backend Middleware:

```javascript
// MVP: Simple auth check
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user to request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply to all protected routes
app.use('/api/*', requireAuth);
```

**No additional permission checks in MVP.**

### Phase 2: Permission Middleware:

```javascript
// Future: Fine-grained permission check
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    const { user } = req;
    const hasPermission = await checkPermission(user, resource, action);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Example usage
app.put('/api/runs/:id', requirePermission('run', 'update'), updateRun);
```

---

## Frontend Permission Handling (MVP)

### UI Rendering:

```jsx
// MVP: All features visible to authenticated users
function RunDetailScreen() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div>
      {/* All actions visible to all users */}
      <button onClick={editRun}>Edit Run</button>
      <button onClick={cancelRun}>Cancel Run</button>
      <button onClick={startRun}>Start Run</button>
    </div>
  );
}
```

**No conditional rendering based on permissions in MVP.**

### Phase 2: Permission-Aware UI:

```jsx
// Future: Hide/disable based on permissions
function RunDetailScreen() {
  const { user, hasPermission } = useAuth();
  const canEdit = hasPermission('run', 'update', { runId });
  
  return (
    <div>
      {canEdit && <button onClick={editRun}>Edit Run</button>}
      {hasPermission('run', 'cancel') && (
        <button onClick={cancelRun}>Cancel Run</button>
      )}
    </div>
  );
}
```

---

## User Management (MVP)

### Creating Users (Manual Process):

**Option 1: Direct Database Insert**
```sql
INSERT INTO users (email, password_hash, name, created_at)
VALUES (
  'volunteer@example.com',
  -- Generate hash: bcrypt.hash('password', 10)
  '$2b$10$...',
  'Jane Doe',
  NOW()
);
```

**Option 2: Admin Script**
```bash
npm run create-user -- --email volunteer@example.com --name "Jane Doe" --password "temp123"
```

**Option 3: Seed Script**
```javascript
// seed-users.js
const users = [
  { email: 'admin@example.com', name: 'Admin User' },
  { email: 'coordinator@example.com', name: 'Mike Coordinator' },
  // ... more users
];

for (const user of users) {
  await createUser(user.email, user.name, defaultPassword);
}
```

### Deactivating Users:

**Option 1: Set inactive flag**
```sql
UPDATE users SET status = 'inactive' WHERE id = 123;
```

**Option 2: Delete user (not recommended)**
- Breaks historical data (created_by references)
- Use soft delete instead

### Password Reset (MVP):

**Manual process:**
1. User requests password reset (email/phone)
2. Admin generates new password
3. Admin updates database directly
4. Admin communicates new password to user (secure channel)

**Phase 2: Self-service password reset**

---

## Summary

### MVP Permissions (Phase 1):
- ✅ Authentication: Email OR phone + password
- ✅ Authorization: Binary (authenticated = full access)
- ✅ No roles, no ABAC, no restrictions
- ✅ Everyone sees everything, everyone can do everything
- ✅ Manual user management (no UI)

### Phase 2 Permissions (Future):
- ⏳ Roles: Admin, Coordinator, Volunteer
- ⏳ Fine-grained ABAC (resource + action + context)
- ⏳ Context-based restrictions (can only edit own runs)
- ⏳ Audit logging
- ⏳ User management UI

### Rationale for Simple MVP:
- Small trusted team (5-10 users)
- High-trust environment (volunteers, faith-based)
- Permission needs unclear (will emerge through usage)
- Faster MVP delivery (weeks, not months)
- Can retrofit permissions in Phase 2 without breaking data model

---

## Next Steps

1. ✅ Permissions model defined (simple MVP)
2. ⏳ Create SUCCESS_CRITERIA.md (final Phase 1 deliverable)
3. ⏳ Review all Phase 1 documents for consistency
4. ⏳ Begin Phase 2: Architecture Design
