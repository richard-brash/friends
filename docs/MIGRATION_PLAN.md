# Incremental Migration Plan

## Overview

This document outlines the strategy for migrating from the current inconsistent codebase to the new clean architecture while maintaining a working application throughout the process.

## Migration Strategy: Parallel Implementation

Instead of replacing services in-place, we'll create new clean services alongside the old ones, gradually migrate routes and frontend components, then remove old code.

## Phase 1: Core Infrastructure (Foundation)

### Step 1.1: Deploy Clean Error Handling ✅
- [x] Error classes created (`utils/errors.js`)
- [x] Error handler middleware pattern defined

### Step 1.2: Deploy Permission System
- [ ] Add permission tables to database schema
- [ ] Create PermissionService (using TDD)
- [ ] Create permission middleware
- [ ] Update existing auth routes to include permission endpoints

**Priority**: High - Needed for all subsequent routes
**Risk**: Low - Additive changes only
**Effort**: 2-3 hours

### Step 1.3: Add Request Logging & Monitoring
- [ ] Add structured logging middleware
- [ ] Add request ID tracking
- [ ] Add performance monitoring

**Priority**: Medium - Helpful for debugging migration issues
**Risk**: Low - Non-breaking
**Effort**: 1 hour

## Phase 2: Entity Migration (One-by-One)

### Migration Order (Based on Dependencies)

1. **Runs** (High Priority - Fixes immediate user issue)
2. **Friends** (Medium dependencies)
3. **Locations** (Low dependencies)
4. **Routes** (Medium dependencies - depends on locations)
5. **Requests** (High dependencies - depends on friends, locations, runs)
6. **Users** (Special case - handle last due to auth complexity)

### Step 2.1: Migrate Runs Service ⭐ **START HERE**

**Why First**: 
- Fixes the immediate "Invalid time value" error
- Demonstrates full migration pattern
- Relatively independent entity

**Implementation Steps**:

#### A. Backend Migration
- [x] CleanRunService created and tested
- [ ] Create `/api/v2/runs` routes using CleanRunService
- [ ] Add integration tests for new routes
- [ ] Deploy alongside existing `/api/runs` routes

#### B. Frontend Migration
- [ ] Create new `api/runsV2.js` client
- [ ] Update `RunsList` component to use new API
- [ ] Test that "Invalid time value" error is resolved
- [ ] Verify all run functionality works

#### C. Cleanup
- [ ] Monitor new endpoints for 1-2 days
- [ ] Deprecate old `/api/runs` routes
- [ ] Remove old RunService
- [ ] Update API client to point to new routes

**Success Criteria**:
- ✅ No "Invalid time value" errors
- ✅ All run CRUD operations work
- ✅ Date formatting is consistent
- ✅ All tests pass

**Effort**: 4-6 hours
**Risk**: Medium - Touches user-visible functionality

### Step 2.2: Migrate Friends Service

**Implementation Steps**:
- [ ] Create CleanFriendService with TDD
- [ ] Create `/api/v2/friends` routes
- [ ] Update frontend to use new API
- [ ] Test relationship with locations
- [ ] Cleanup old service

**Dependencies**: Locations (can be done in parallel)
**Effort**: 3-4 hours
**Risk**: Medium

### Step 2.3: Migrate Locations Service

**Implementation Steps**:
- [ ] Create CleanLocationService with TDD  
- [ ] Create `/api/v2/locations` routes
- [ ] Update frontend components
- [ ] Test route-location relationships
- [ ] Cleanup old service

**Dependencies**: None (independent)
**Effort**: 2-3 hours
**Risk**: Low

### Step 2.4: Migrate Routes Service

**Implementation Steps**:
- [ ] Create CleanRouteService with TDD
- [ ] Handle route-location junction table properly
- [ ] Create `/api/v2/routes` routes  
- [ ] Update frontend components
- [ ] Test with runs and locations
- [ ] Cleanup old service

**Dependencies**: Locations
**Effort**: 3-4 hours
**Risk**: Medium - Complex relationships

### Step 2.5: Migrate Requests Service

**Implementation Steps**:
- [ ] Create CleanRequestService with TDD
- [ ] Handle complex relationships (friends, locations, runs)
- [ ] Create `/api/v2/requests` routes
- [ ] Update frontend components
- [ ] Test delivery workflow end-to-end
- [ ] Cleanup old service

**Dependencies**: Friends, Locations, Runs
**Effort**: 4-5 hours  
**Risk**: High - Most complex relationships

### Step 2.6: Migrate Users Service (Special Case)

**Implementation Steps**:
- [ ] Create CleanUserService with TDD
- [ ] Integrate with permission system
- [ ] Careful migration of auth routes
- [ ] Update admin interface
- [ ] Extensive testing of authentication flows
- [ ] Cleanup old service

**Dependencies**: Permission system
**Effort**: 3-4 hours
**Risk**: High - Critical system component

## Phase 3: Frontend Architecture Cleanup

### Step 3.1: Consolidate API Clients
- [ ] Remove all `v2` API clients
- [ ] Update all API calls to use clean endpoints
- [ ] Standardize error handling across components
- [ ] Add loading states and error boundaries

### Step 3.2: Component Refactoring
- [ ] Standardize data transformation in components
- [ ] Add proper TypeScript/PropTypes definitions
- [ ] Implement consistent loading and error states
- [ ] Add proper accessibility features

## Phase 4: Performance & Production Readiness

### Step 4.1: Database Optimization
- [ ] Add missing indexes based on new query patterns
- [ ] Optimize complex queries (runs with joins)
- [ ] Add query performance monitoring
- [ ] Consider read replicas for reporting

### Step 4.2: Caching Strategy
- [ ] Add Redis for session management
- [ ] Cache frequently accessed data (routes, locations)
- [ ] Implement proper cache invalidation
- [ ] Add CDN for static assets

### Step 4.3: Production Deployment
- [ ] Environment-specific configurations
- [ ] Database migration scripts
- [ ] Health check endpoints
- [ ] Monitoring and alerting setup
- [ ] Backup and recovery procedures

## Risk Mitigation Strategies

### 1. Feature Flags
Use environment variables to control which API version is used:

```javascript
// config/features.js
export const FEATURES = {
  USE_CLEAN_RUNS_API: process.env.USE_CLEAN_RUNS_API === 'true',
  USE_CLEAN_FRIENDS_API: process.env.USE_CLEAN_FRIENDS_API === 'true',
  // ... other features
};

// In component
const runsApi = FEATURES.USE_CLEAN_RUNS_API ? runsV2Api : runsApi;
```

### 2. Gradual Rollout
- Deploy new endpoints but don't use them initially
- Test new endpoints with automated tests
- Enable for admin users first
- Gradually enable for all users
- Monitor error rates and performance

### 3. Rollback Plan
- Keep old endpoints functional during migration
- Quick environment variable change to rollback
- Database rollback scripts if schema changes needed
- Clear rollback criteria and triggers

### 4. Testing Strategy
- Unit tests for all new services (already established)
- Integration tests for new API endpoints
- End-to-end tests for critical user workflows
- Performance tests for complex queries
- Load testing for production scenarios

## Migration Timeline

### Week 1: Foundation & Runs
- Day 1-2: Permission system implementation
- Day 3-5: Runs service migration (backend + frontend)
- Day 6-7: Testing and bug fixes

### Week 2: Core Entities  
- Day 1-2: Friends service migration
- Day 3-4: Locations service migration
- Day 5-7: Routes service migration

### Week 3: Complex Features
- Day 1-3: Requests service migration  
- Day 4-5: Users service migration
- Day 6-7: Integration testing

### Week 4: Polish & Production
- Day 1-2: Frontend architecture cleanup
- Day 3-4: Performance optimization
- Day 5-7: Production deployment preparation

## Success Metrics

### Technical Metrics
- [ ] Zero "Invalid time value" errors
- [ ] All API responses follow consistent format
- [ ] 95%+ test coverage on new services
- [ ] API response times < 200ms (95th percentile)
- [ ] Zero data consistency issues

### User Experience Metrics  
- [ ] No user-reported bugs during migration
- [ ] All existing functionality preserved
- [ ] Improved page load times
- [ ] Consistent date/time formatting across app
- [ ] Mobile experience maintains quality

### Code Quality Metrics
- [ ] All new code follows architectural principles
- [ ] Clear separation of concerns
- [ ] Comprehensive error handling
- [ ] Consistent logging and monitoring
- [ ] Documentation updated

## Communication Plan

### Team Updates
- Daily standup updates on migration progress
- Weekly demo of migrated features
- Document any issues or blockers immediately
- Celebrate milestones and wins

### User Communication
- No communication needed for backend migrations (invisible to users)
- Brief maintenance windows for major database changes
- Release notes highlighting improvements (not technical details)

## Rollback Triggers

**Immediate Rollback If**:
- Error rate increases > 5% for any endpoint
- User-reported data loss or corruption
- Authentication/authorization failures
- Critical user workflow broken

**Planned Rollback If**:
- Performance degradation > 20%
- Unusual system behavior
- Multiple bug reports for same feature
- Team consensus that migration is problematic

## Next Actions

**Immediate (This Session)**:
1. Start with Runs migration - create new API routes
2. Test new routes with integration tests
3. Update frontend to use new API
4. Verify "Invalid time value" error is fixed

**This Week**:
1. Complete Runs migration
2. Begin Permission system implementation
3. Plan Friends service migration

**This Month**:
1. Complete all entity migrations
2. Frontend architecture cleanup
3. Production deployment preparation

This migration plan ensures we maintain a working application while systematically improving the architecture and fixing the fundamental issues identified in our audit.