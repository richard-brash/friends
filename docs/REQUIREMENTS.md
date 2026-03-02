# Requirements - Friends Outreach CRM V2

**Last Updated:** January 9, 2026  
**Status:** Phase 1 - Business Analysis

---

## Problem Statement

**Current State:**
Faith-based non-profit delivers meals to homeless community on fixed routes (Mon/Wed/Fri). Friends make special requests (clothing, hygiene items, etc.) which are tracked on a physical whiteboard. Process is error-prone: illegible handwriting, lost requests, no status visibility, no history, no accountability.

**Desired State:**
Digital system to track special requests from intake through fulfillment, with mobile-first field execution, coordinator planning tools, and request lifecycle management. System must be simple, reliable, and maintainable by small team with limited budget.

**Success Metric:**
Zero lost requests, full request lifecycle visibility, field workers can operate efficiently on mobile devices.

---

## Functional Requirements

### FR-1: Authentication & User Management

**FR-1.1:** Users log in with email/password OR mobile phone number/password  
**FR-1.2:** JWT-based authentication, 24-hour token expiration  
**FR-1.3:** User accounts have permissions (attribute-based, not role-based)  
**FR-1.4:** MVP: If user has account, they have full access (fine-grained permissions deferred to Phase 2)  
**FR-1.5:** User accounts are independent of Friend records  
**FR-1.6:** Password reset/account recovery deferred to Phase 2

---

### FR-2: Friend Management

**FR-2.1:** Friend has: first name, last name, alias (at least ONE required), phone (optional), email (optional), status (active/inactive)  
**FR-2.2:** Friends can be added via Field Execution context (quick add: name only)  
**FR-2.3:** Friends can be added via Request Fulfillment context  
**FR-2.4:** Generic Friend CRUD screen exists for edge cases  
**FR-2.5:** Friend search by name (first/last), alias, phone, email (fuzzy matching)  
**FR-2.6:** Friend location history: Track all locations with timestamps  
**FR-2.7:** Display last 5 locations by default, option to view all  
**FR-2.8:** Demographic data collection deferred to Phase 2  
**FR-2.9:** Friends as users (self-service request tracking) deferred to Phase 2

---

### FR-3: Location Management

**FR-3.1:** Location has: name (required), address (optional), route (required), stop sequence, notes  
**FR-3.2:** Locations belong to exactly one route  
**FR-3.3:** Locations can be reordered within route (drag-drop or up/down buttons)  
**FR-3.4:** Locations can be added/removed from routes  
**FR-3.5:** Removing location with pending requests shows warning  
**FR-3.6:** Location history shows which friends have been spotted there

---

### FR-4: Route Management

**FR-4.1:** Route has: name (required, unique), description (optional)  
**FR-4.2:** Route contains ordered list of locations (stop sequence)  
**FR-4.3:** Routes can be created/edited/archived  
**FR-4.4:** Archived routes remain in historical data, not shown in active lists  
**FR-4.5:** Route configuration is rare (admin-level activity)

---

### FR-5: Run Management (Planning Context)

**FR-5.1:** Run has: date (required), route (required), name (auto-generated), meal count, weekly items (type + count), notes, status  
**FR-5.2:** Run name format: "{Route Name} {Day} {YYYY-MM-DD}" (e.g., "Downtown Monday 2026-01-13")  
**FR-5.3:** Run status: planned → in_progress → completed → cancelled  
**FR-5.4:** Runs can be scheduled for any date (future or same-day), flexible schedule  
**FR-5.5:** Weekly items are configurable (type + count), not locked to specific days  
**FR-5.6:** Team members assigned via searchable list, first added = team lead  
**FR-5.7:** Team members notified when scheduled (in-app notification + email/text)  
**FR-5.8:** Manual integration with SignUpGenius (coordinator adds signups manually)  
**FR-5.9:** Volunteer availability tracking deferred to Phase 2  
**FR-5.10:** Run details editable before start, locked after start  
**FR-5.11:** Completed runs show summary: stops, meals delivered, weekly items, requests delivered, friends served

---

### FR-6: Run Execution (Field Context)

**FR-6.1:** Pre-run preparation screen shows checklist: meal count, weekly items, special request items ready  
**FR-6.2:** Check off items as loaded, special requests change status to "taken"  
**FR-6.3:** Start Run button initiates run (status: planned → in_progress)  
**FR-6.4:** Stop-by-stop navigation: Show current stop, progress (Stop X of Y)  
**FR-6.5:** Each stop shows: location name, expected friends (last seen here), special requests for location  
**FR-6.6:** Meal counter: +/- buttons, persists per location  
**FR-6.7:** Weekly items counter: Aggregate count (not itemized)  
**FR-6.8:** Deliver special request: Mark delivered, can note alternate recipient  
**FR-6.9:** Spot friend: Update friend's location history with current location + timestamp  
**FR-6.10:** Quick add friend: Name only, location pre-filled  
**FR-6.11:** Take new request: Friend (searchable), location (pre-filled), item (free text), notes  
**FR-6.12:** Navigate forward (Next Stop) and backward (Previous Stop)  
**FR-6.13:** Complete Run: Shows summary, changes status to completed  
**FR-6.14:** All field operations work online (offline capability deferred to Phase 2)

---

### FR-7: Request Management (Fulfillment Context)

**FR-7.1:** Request has: friend (required), location (required), item description (required), notes, status, history  
**FR-7.2:** Request status: pending → ready_for_delivery → taken → delivered OR cancelled  
**FR-7.3:** Status transitions tracked with timestamp and user  
**FR-7.4:** Requests filtered by status, location, route, date range  
**FR-7.5:** Pending requests viewable grouped by route for staging  
**FR-7.6:** Mark request ready for delivery (item pulled from inventory)  
**FR-7.7:** Add notes about item pulled (size, condition, specifics)  
**FR-7.8:** Cancel request with reason (unfulfillable, no longer needed, etc.)  
**FR-7.9:** Request-to-run association implicit via Location → Route → Run (no direct FK)  
**FR-7.10:** Delivered requests show: who delivered, when, where, to whom (if different from requester)  
**FR-7.11:** Undelivered requests visible for follow-up (attempt count tracking future enhancement)

---

### FR-8: Permissions & Access Control

**FR-8.1:** MVP: Binary permissions - user has account = full access to all features  
**FR-8.2:** Fine-grained ABAC (Attribute-Based Access Control) deferred to Phase 2  
**FR-8.3:** Context-based permissions (e.g., "can only edit runs I'm scheduled for") deferred to Phase 2  
**FR-8.4:** All authenticated users can view all friend data (privacy by permissions)  
**FR-8.5:** User management (create/deactivate users) deferred to Phase 2 (initial users created manually)

---

### FR-9: Notifications & Communication

**FR-9.1:** Users notified when scheduled on run (in-app + email/text)  
**FR-9.2:** Real-time messaging between users deferred to Phase 2  
**FR-9.3:** Friends tracking run progress deferred to Phase 2

---

### FR-10: Reporting & Analytics

**FR-10.1:** Completed run summary: stops, meals, friends served, requests delivered  
**FR-10.2:** Advanced reporting (monthly totals, trends, friend engagement) deferred to Phase 2

---

## Non-Functional Requirements

### NFR-1: Performance

**NFR-1.1:** System supports 5-10 concurrent users initially, scalable to 50+  
**NFR-1.2:** Friend database up to 1000 records without performance degradation  
**NFR-1.3:** Page load time < 2 seconds on 4G mobile connection  
**NFR-1.4:** API response time < 500ms for standard operations  
**NFR-1.5:** Mobile-optimized screens load and render in < 1 second

---

### NFR-2: Usability

**NFR-2.1:** Mobile-first design for Field Execution context  
**NFR-2.2:** Touch targets minimum 44px for gloved operation  
**NFR-2.3:** High contrast UI for outdoor/sunlight readability  
**NFR-2.4:** Minimal typing required (pre-filled data, dropdowns, autocomplete)  
**NFR-2.5:** One-handed operation possible for critical field actions  
**NFR-2.6:** Desktop-optimized for Run Planning and Request Fulfillment contexts  
**NFR-2.7:** No user training required (intuitive UI)

---

### NFR-3: Reliability

**NFR-3.1:** 99% uptime during operational hours (Mon/Wed/Fri mornings)  
**NFR-3.2:** Graceful error handling with user-friendly messages  
**NFR-3.3:** Data integrity constraints enforced at database level  
**NFR-3.4:** Automatic database backups (daily minimum)  
**NFR-3.5:** Recovery plan for data loss (restore from backup within 1 hour)

---

### NFR-4: Security

**NFR-4.1:** HIPAA-compliant data handling (demographic data is sensitive)  
**NFR-4.2:** Passwords hashed with bcrypt (minimum 10 rounds)  
**NFR-4.3:** HTTPS only (no plaintext communication)  
**NFR-4.4:** JWT tokens with secure signing, 24-hour expiration  
**NFR-4.5:** SQL injection prevention (parameterized queries)  
**NFR-4.6:** XSS prevention (sanitized inputs)  
**NFR-4.7:** CSRF protection (token-based)  
**NFR-4.8:** Audit logging for sensitive operations (deferred to Phase 2)  
**NFR-4.9:** Data encryption at rest (database-level encryption)

---

### NFR-5: Maintainability

**NFR-5.1:** Clean Architecture pattern (separation of concerns)  
**NFR-5.2:** Test coverage minimum 70% for business logic  
**NFR-5.3:** API documentation (OpenAPI/Swagger)  
**NFR-5.4:** Code comments for complex logic  
**NFR-5.5:** Consistent naming conventions  
**NFR-5.6:** Error logging with structured format (JSON)  
**NFR-5.7:** Version control (Git) with meaningful commit messages  
**NFR-5.8:** No code duplication (DRY principle)

---

### NFR-6: Scalability

**NFR-6.1:** Database design supports 10x growth (10,000 friends, 1,000 runs/year)  
**NFR-6.2:** Horizontal scaling possible (stateless API)  
**NFR-6.3:** Database connection pooling  
**NFR-6.4:** Pagination for large lists (friends, requests, runs)

---

### NFR-7: Portability

**NFR-7.1:** Cross-browser support: Chrome, Firefox, Safari, Edge (last 2 versions)  
**NFR-7.2:** Mobile browser support: iOS Safari, Android Chrome  
**NFR-7.3:** Responsive design: 320px (mobile) to 1920px (desktop)  
**NFR-7.4:** No platform-specific dependencies (runs on Railway, Vercel, or self-hosted)

---

## Technical Constraints

### TC-1: Technology Stack

**Backend:**
- Node.js + Express (or equivalent stable framework)
- PostgreSQL database
- RESTful API architecture
- JWT authentication

**Frontend:**
- React + Vite (or equivalent modern framework)
- Material-UI or similar component library
- Mobile-first responsive design
- Progressive Web App (PWA) optional for Phase 2

**Hosting:**
- Railway (preferred for simple deploy/manage)
- Free tier + small paid tier budget
- PostgreSQL managed database

**Development:**
- Git version control
- npm package management
- Environment-based configuration (.env files)

---

### TC-2: Data Model Constraints

**TC-2.1:** Friend requires at least one of: first name, last name, alias  
**TC-2.2:** Request must have friend_id (FK), location_id (FK)  
**TC-2.3:** Location must have route_id (FK)  
**TC-2.4:** Run must have route_id (FK), no direct request_id FK  
**TC-2.5:** Request-to-Run association implicit via Location → Route  
**TC-2.6:** Status fields use ENUM types for data integrity  
**TC-2.7:** All entities have created_at, updated_at timestamps  
**TC-2.8:** Soft deletes preferred (status: active/inactive vs hard delete)

---

### TC-3: Business Rules (Validation)

**TC-3.1:** Cannot delete route with active runs  
**TC-3.2:** Cannot delete location with pending requests (warning, can override)  
**TC-3.3:** Cannot edit run details after status = in_progress  
**TC-3.4:** Request status transitions must be valid (pending → ready → taken → delivered)  
**TC-3.5:** Run name must be unique per route per date  
**TC-3.6:** Location stop sequence must be unique within route  
**TC-3.7:** Team lead is first user added to run (automatic)

---

## MVP Scope Definition

### Must Have (MVP - Week 1-4)

**Core Entities:**
- ✅ Users (authentication only)
- ✅ Friends (CRUD with location history)
- ✅ Locations (CRUD, route association)
- ✅ Routes (CRUD, location ordering)
- ✅ Runs (CRUD, team assignment, status management)
- ✅ Requests (full lifecycle: pending → delivered)

**Persona Screens:**
- ✅ Field Execution (pre-run prep, stop-by-stop, completion)
- ✅ Run Planning (create runs, assign team, view schedule)
- ✅ Request Fulfillment (view pending, mark ready, cancel)

**Critical Features:**
- ✅ Mobile-responsive field execution
- ✅ Request status tracking with history
- ✅ Friend location history (spotting)
- ✅ Run auto-naming
- ✅ Team notifications (email/text)

---

### Should Have (Phase 2 - Week 5-8)

- Offline capability (IndexedDB sync)
- Fine-grained permissions (ABAC)
- User management UI (create/deactivate users)
- Password reset/recovery
- Volunteer availability tracking
- Friend demographics collection
- Attempt count tracking for requests
- Advanced reporting/analytics

---

### Nice to Have (Phase 3+)

- Friends as users (self-service request tracking)
- Real-time messaging
- SignUpGenius integration
- Map view of routes
- Mobile app (native iOS/Android)
- Push notifications
- Photo attachments for requests
- Inventory management system

---

## Success Criteria (MVP)

### User Acceptance

1. Field worker can execute full run on mobile device without errors
2. Coordinator can schedule run and assign team in < 5 minutes
3. Request fulfillment worker can process 10 pending requests in < 10 minutes
4. Zero requests lost or forgotten (100% tracked)
5. Field workers prefer app over whiteboard (qualitative feedback)

### Technical Acceptance

1. All MVP functional requirements implemented
2. 70%+ test coverage for business logic
3. No critical bugs in production
4. API response times < 500ms
5. Mobile page load < 2 seconds on 4G
6. Successful deployment to Railway

### Business Acceptance

1. Organization uses app for 1 week without reverting to whiteboard
2. All runs tracked digitally
3. Request lifecycle visible end-to-end
4. No data loss or corruption
5. Team expresses satisfaction with ease of use

---

## Assumptions

1. All users have smartphones or tablets (no feature phone support)
2. Users have basic tech literacy (can use smartphone apps)
3. Internet connectivity available at warehouse/office
4. Internet connectivity available in field (offline deferred)
5. Organization has email/SMS infrastructure for notifications
6. PostgreSQL database available on Railway or equivalent
7. Friend data is sensitive but not medical records (HIPAA-level caution, not full compliance)
8. Initial user accounts created manually (no self-registration)

---

## Dependencies

1. Railway hosting account (free tier initially)
2. PostgreSQL database (Railway managed)
3. Email service (SendGrid, Mailgun, or similar - free tier)
4. SMS service (Twilio or similar - optional, low volume)
5. Domain name (optional, can use Railway subdomain)

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Field connectivity unreliable | High | Medium | Defer offline to Phase 2, test in field early |
| Mobile UI too complex | High | Low | User testing with actual volunteers |
| Performance degradation | Medium | Low | Load testing, pagination, indexing |
| Budget overrun (hosting) | Medium | Medium | Monitor usage, Railway free tier first |
| HIPAA compliance gaps | High | Low | Security audit before demographic data |
| Users resist change | High | Low | Involve users in design, gradual rollout |
| Data loss | High | Low | Daily backups, test restore process |

---

## Next Steps

1. ✅ Requirements defined
2. ⏳ Validate USER_STORIES.md against requirements
3. ⏳ Create SCREEN_INVENTORY.md (map features to screens)
4. ⏳ Create PERMISSIONS_SPEC.md (simple MVP permissions)
5. ⏳ Create SUCCESS_CRITERIA.md (detailed acceptance tests)
6. ⏳ Architecture design (Phase 2)
