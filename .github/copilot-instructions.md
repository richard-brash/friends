# Copilot Instructions

This file tracks the setup and progress for the Friends Outreach CRM project. Follow the checklist below for systematic project setup and customization.

## Phase 1: Initial Setup ✅
- [x] Create backend and frontend directories
- [x] Scaffold backend (Node.js/Express, modular, REST API for User, Friend, Location, Route, Run, Request)
- [x] Scaffold frontend (React/Vite, Material UI, modular components)
- [x] Add README.md
- [x] Complete initial setup and verify

## Phase 2: Core Functionality ✅
- [x] Fix data relationships (Request→Location→Route)
- [x] Implement route filtering through locations
- [x] Add comprehensive Run Management system
- [x] Add sample data functionality

## Phase 3: Mobile-First MVP ✅
- [x] Mobile-responsive navigation (desktop tabs + mobile bottom nav)
- [x] Mobile-optimized Run Overview (touch-friendly delivery buttons)
- [x] Responsive design system with Material-UI breakpoints
- [ ] Complete Request Management mobile optimization (deferred - needs simpler approach)

## Phase 4: Authentication & Deployment ✅
- [x] Implement user authentication system
- [x] Add role-based access control (Admin, Coordinator, Volunteer)
- [x] Prepare for MVP deployment to real users
- [x] Migrate Requests Service to Clean Architecture (V2 API)
- [ ] Add production environment configuration

## Phase 5: Runs V2 Rebuild ✅ (Backend Complete)
- [x] Schema updates (meal_count, remove role, lead via created_at ASC)
- [x] RunRepository with auto-name generation
- [x] CleanRunService with validation
- [x] V2 API routes (all tested - 31/31 tests passing!)
- [x] Integration testing (complete workflow verified)
- [x] Sample data with 6 runs and proper team structure

## Phase 6: Frontend Runs Integration ✅ (COMPLETE - Ready for Testing!)
- [x] CreateRunForm updated with V2 API
- [x] ManageTeamDialog complete rewrite (add/remove pattern, V2 endpoints)
- [x] RunOverview updates (auto-names, meal count, team display)
- [x] RunsList updates (auto-names, meal count)
- [ ] End-to-end user testing (ready to start!)

## Phase 7: Production Deployment (Next Priority)
- [ ] Set up production database and environment variables
- [ ] Configure deployment pipeline (Docker/Railway/Vercel)
- [ ] Add environment-specific configurations
- [ ] Implement proper logging and monitoring
- [ ] User acceptance testing with real data

## Phase 8: Field Execution Mode ✅ (COMPLETE - Ready for Testing!)
- [x] Schema updates (current_location_id, current_stop_number, run_stop_deliveries table)
- [x] Run Execution Service with navigation and tracking
- [x] Execution API endpoints (preparation, execution context, start/advance/previous, delivery tracking, friend spotting, polling)
- [x] Offline sync queue with IndexedDB
- [x] RunPreparationScreen component (loading checklist)
- [x] ActiveRunScreen component (stop-by-stop navigation, meal tracking, friend spotting, request delivery)
- [x] Polling for multi-user real-time updates (20s interval)
- [x] Integration with RunOverview ("Prepare Run" and "Continue Run" buttons)

## Current Status
- **Backend: All services migrated to Clean Architecture (V2 API) + Field Execution ✅**
- **Runs V2 Rebuild: Complete and tested (31/31 tests passing) ✅**
- **Frontend Runs Integration: COMPLETE - Ready for Testing! ✅**
- **Field Execution Mode: COMPLETE - Ready for Testing! ✅**
- Requests, Friends, Locations, Routes, and Runs all use Clean Architecture pattern
- JWT-based authentication with role-based permissions (Admin/Coordinator/Volunteer)
- Complete status history system for request lifecycle tracking
- Mobile-responsive design optimized for field use
- Auto-generated run names: "{route_name} {day_of_week} {YYYY-MM-DD}"
- Team lead identification via timestamp (first member = lead)
- Meal count tracking with validation
- **NEW: Field execution with offline-first capabilities, stop-by-stop navigation, meal tracking, friend spotting**
- All frontend components updated: ManageTeamDialog, RunOverview, RunsList, CreateRunForm
- Active run polling (20s) for multi-device coordination

**Ready for field testing! Features:**
- Pre-run preparation screen with loading checklist
- Active run screen with stop-by-stop navigation
- Meal counter per location with notes
- Friend spotting (expected + quick-add new)
- Request delivery tracking
- Offline queue with automatic retry
- Multi-device real-time updates via polling

Update this file as you complete each step.
