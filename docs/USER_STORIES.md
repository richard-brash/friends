# User Stories - Friends Outreach CRM V2

**Last Updated:** January 8, 2026  
**Status:** Phase 1 - Business Analysis

---

## Story Format

```
As a [persona]
I want [action/capability]
So that [business benefit]

Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2

Priority: [Must Have | Should Have | Nice to Have]
Complexity: [Low | Medium | High]
```

---

## Persona Summary

1. **Administrator (Sarah)** - System admin, manages users and core data
2. **Coordinator (Mike)** - Plans runs, manages requests, assigns teams
3. **Volunteer (Jamie)** - Executes runs in the field, records deliveries

---

# Epic 1: User Management & Authentication

## US-001: User Login
**As a** user (any role)  
**I want** to log in with email and password  
**So that** I can access the system securely

**Acceptance Criteria:**
- [ ] Email and password fields on login screen
- [ ] Password is masked
- [ ] Shows error for invalid credentials
- [ ] Redirects to home screen after successful login
- [ ] JWT token stored securely in browser
- [ ] Token expires after 24 hours

**Priority:** Must Have  
**Complexity:** Low

---

## US-002: User Registration
**As an** administrator  
**I want** to create new user accounts  
**So that** I can onboard coordinators and volunteers

**Acceptance Criteria:**
- [ ] Form has fields: name, email, role, initial password
- [ ] Email must be unique (shows error if duplicate)
- [ ] Role dropdown: Admin, Coordinator, Volunteer
- [ ] Password is automatically hashed (bcrypt)
- [ ] New user receives email with credentials (future)
- [ ] New user appears in user list immediately

**Priority:** Must Have  
**Complexity:** Low

---

## US-003: View All Users
**As an** administrator  
**I want** to see a list of all system users  
**So that** I can manage access and roles

**Acceptance Criteria:**
- [ ] Table shows: name, email, role, created date
- [ ] Can sort by any column
- [ ] Can filter by role
- [ ] Shows active user count
- [ ] Mobile-responsive view

**Priority:** Must Have  
**Complexity:** Low

---

## US-004: Edit User Role
**As an** administrator  
**I want** to change a user's role  
**So that** I can promote volunteers to coordinators or demote users

**Acceptance Criteria:**
- [ ] Click edit button on user row
- [ ] Dropdown to change role
- [ ] Confirmation dialog before saving
- [ ] Cannot change own role (prevent lock-out)
- [ ] Role change takes effect immediately
- [ ] Audit log records who changed what

**Priority:** Should Have  
**Complexity:** Medium

---

## US-005: Deactivate User
**As an** administrator  
**I want** to deactivate a user account  
**So that** former volunteers/coordinators cannot access the system

**Acceptance Criteria:**
- [ ] "Deactivate" button on user row
- [ ] Confirmation dialog
- [ ] User can no longer log in
- [ ] Historical data (runs, deliveries) remains intact
- [ ] Can reactivate later if needed
- [ ] Shows inactive users in separate tab/filter

**Priority:** Should Have  
**Complexity:** Low

---

# Epic 2: Friend Management

## US-006: Add New Friend
**As a** coordinator or volunteer  
**I want** to add a new friend to the system  
**So that** I can track their service requests

**Acceptance Criteria:**
- [ ] Form with fields: name (required), alias, phone, notes
- [ ] Status defaults to "active"
- [ ] Can save with just name
- [ ] Shows success message after save
- [ ] Friend appears in friends list immediately
- [ ] Validates phone format if provided

**Priority:** Must Have  
**Complexity:** Low

---

## US-007: View Friend Details
**As a** coordinator or volunteer  
**I want** to view a friend's full profile  
**So that** I can see their history and current requests

**Acceptance Criteria:**
- [ ] Shows all friend attributes (name, alias, phone, notes, status)
- [ ] Shows list of all requests (past and current)
- [ ] Shows delivery history (which runs, when, where)
- [ ] Shows last seen location and date
- [ ] Can edit any field inline
- [ ] Mobile-friendly view

**Priority:** Must Have  
**Complexity:** Medium

---

## US-008: Search Friends
**As a** coordinator or volunteer  
**I want** to search for friends by name, alias, or phone  
**So that** I can quickly find someone in the system

**Acceptance Criteria:**
- [ ] Search bar at top of friends list
- [ ] Searches name, alias, phone fields
- [ ] Results update as I type (debounced)
- [ ] Shows "no results" message if not found
- [ ] Can clear search to show all
- [ ] Highlights matching text in results

**Priority:** Must Have  
**Complexity:** Low

---

## US-009: Mark Friend as Inactive
**As a** coordinator  
**I want** to mark a friend as inactive  
**So that** they don't appear in active lists if they're no longer engaged

**Acceptance Criteria:**
- [ ] Status toggle on friend detail page
- [ ] Confirmation dialog
- [ ] Inactive friends hidden from default views
- [ ] Can filter to show inactive friends
- [ ] Can reactivate later
- [ ] Pending requests remain but flagged

**Priority:** Should Have  
**Complexity:** Low

---

## US-010: Spot Friend in Field (Quick Add)
**As a** volunteer executing a run  
**I want** to quickly add a new friend I meet in the field  
**So that** I can record their delivery without stopping the run

**Acceptance Criteria:**
- [ ] "Quick Add Friend" button on active run screen
- [ ] Minimal form: name only (required)
- [ ] Saves and immediately associates with current location
- [ ] Can add more details later
- [ ] Shows in delivery options immediately
- [ ] Works offline (queued for sync)

**Priority:** Must Have  
**Complexity:** Medium

---

# Epic 3: Location Management

## US-011: Add New Location
**As a** coordinator or administrator  
**I want** to add a new service location  
**So that** it can be included in routes

**Acceptance Criteria:**
- [ ] Form with fields: name (required), address, route (required), notes
- [ ] Route dropdown shows all available routes
- [ ] Address format validated
- [ ] Location appears in route's location list
- [ ] Can set stop order (sequence on route)
- [ ] Shows on map if address provided (future)

**Priority:** Must Have  
**Complexity:** Low

---

## US-012: View Location Details
**As a** coordinator or volunteer  
**I want** to view a location's details  
**So that** I can see which friends have requests there and delivery history

**Acceptance Criteria:**
- [ ] Shows location attributes (name, address, route, notes)
- [ ] Shows all pending requests at this location
- [ ] Shows delivery history (which runs, when, how many meals)
- [ ] Shows which friends have been seen here
- [ ] Can edit location details
- [ ] Shows stop sequence on route

**Priority:** Must Have  
**Complexity:** Medium

---

## US-013: Reorder Locations on Route
**As a** coordinator  
**I want** to change the order of stops on a route  
**So that** runs follow the most efficient path

**Acceptance Criteria:**
- [ ] Drag-and-drop interface on route detail page
- [ ] Shows current sequence numbers
- [ ] Updates stop order immediately
- [ ] Affects future runs only (not historical)
- [ ] Can undo recent changes
- [ ] Mobile-friendly alternative (up/down buttons)

**Priority:** Should Have  
**Complexity:** Medium

---

## US-014: Remove Location from Route
**As a** coordinator or administrator  
**I want** to remove a location from a route  
**So that** we no longer service locations that have closed

**Acceptance Criteria:**
- [ ] "Remove from Route" button on location detail
- [ ] Confirmation dialog warns about pending requests
- [ ] Cannot remove if active requests exist (must resolve first)
- [ ] Historical data remains intact
- [ ] Can add back to same or different route later
- [ ] Updates stop sequence for remaining locations

**Priority:** Should Have  
**Complexity:** Medium

---

# Epic 4: Route Management

## US-015: Create New Route
**As an** administrator or coordinator  
**I want** to create a new service route  
**So that** we can expand to new areas

**Acceptance Criteria:**
- [ ] Form with fields: name (required), description
- [ ] Name must be unique
- [ ] Route appears in routes list immediately
- [ ] Starts with zero locations (can add later)
- [ ] Can assign volunteers to route (future)

**Priority:** Must Have  
**Complexity:** Low

---

## US-016: View Route Details
**As a** coordinator or volunteer  
**I want** to view a route's details  
**So that** I can see all locations and plan runs

**Acceptance Criteria:**
- [ ] Shows route name and description
- [ ] Shows all locations in stop order
- [ ] Shows request counts per location
- [ ] Shows upcoming and recent runs for this route
- [ ] Can create new run from this screen
- [ ] Map view of route (future)

**Priority:** Must Have  
**Complexity:** Medium

---

## US-017: View All Routes
**As a** coordinator or volunteer  
**I want** to see a list of all routes  
**So that** I can choose which one to plan or execute

**Acceptance Criteria:**
- [ ] Table shows: route name, location count, pending requests, last run date
- [ ] Can sort by any column
- [ ] Click route to view details
- [ ] Shows "Create Route" button (if permitted)
- [ ] Mobile-responsive cards

**Priority:** Must Have  
**Complexity:** Low

---

# Epic 5: Request Management

## US-018: Create New Request
**As a** coordinator or volunteer  
**I want** to create a service request for a friend  
**So that** their need is tracked and scheduled

**Acceptance Criteria:**
- [ ] Form with fields: friend (required), location (required), type, notes, due_by (optional)
- [ ] Friend searchable dropdown (or create new)
- [ ] Location filtered by route (can select route first)
- [ ] Type dropdown: meal, hygiene_kit, clothing, other
- [ ] Due_by date picker (optional)
- [ ] Status auto-set to "pending"
- [ ] Shows success message
- [ ] Request appears in pending list

**Priority:** Must Have  
**Complexity:** Medium

---

## US-019: View Request Details
**As a** coordinator or volunteer  
**I want** to view a request's details  
**So that** I can see its current status and history

**Acceptance Criteria:**
- [ ] Shows all request attributes (friend, location, type, notes, status, dates)
- [ ] Shows status history timeline (who changed what, when)
- [ ] Shows which run delivered it (if completed)
- [ ] Can edit request if not completed
- [ ] Can change status with reason
- [ ] Shows requester (who created request)

**Priority:** Must Have  
**Complexity:** Medium

---

## US-020: Filter Requests by Status
**As a** coordinator  
**I want** to filter requests by status  
**So that** I can focus on ready-for-delivery requests when planning runs

**Acceptance Criteria:**
- [ ] Status filter dropdown: All, Pending, Ready for Delivery, Assigned to Run, Completed, Cancelled
- [ ] Updates list immediately
- [ ] Shows count per status
- [ ] Can combine with other filters (location, route, friend)
- [ ] Filter state persists across sessions

**Priority:** Must Have  
**Complexity:** Low

---

## US-021: Mark Request as Ready for Delivery
**As a** coordinator  
**I want** to mark a pending request as ready  
**So that** it can be included in the next run

**Acceptance Criteria:**
- [ ] "Mark Ready" button on pending requests
- [ ] Optional note for status change
- [ ] Status changes to "ready_for_delivery"
- [ ] Records who/when in status history
- [ ] Request appears in run planning filters
- [ ] Can bulk-select multiple requests

**Priority:** Must Have  
**Complexity:** Low

---

## US-022: Assign Requests to Run
**As a** coordinator  
**I want** to assign ready requests to a specific run  
**So that** volunteers know what to deliver

**Acceptance Criteria:**
- [ ] Select requests from ready list
- [ ] Choose run from dropdown (same route only)
- [ ] Bulk assign action
- [ ] Status changes to "assigned_to_run"
- [ ] Requests appear in run preparation view
- [ ] Can unassign if run not started

**Priority:** Must Have  
**Complexity:** Medium

---

## US-023: Cancel Request
**As a** coordinator  
**I want** to cancel a request  
**So that** it's no longer tracked if the friend's need is resolved elsewhere

**Acceptance Criteria:**
- [ ] "Cancel" button on request detail
- [ ] Required reason field
- [ ] Confirmation dialog
- [ ] Status changes to "cancelled"
- [ ] Records who/when in status history
- [ ] Cannot cancel if already completed
- [ ] Removed from active run lists

**Priority:** Should Have  
**Complexity:** Low

---

# Epic 6: Run Planning

## US-024: Create New Run
**As a** coordinator  
**I want** to create a new run for a specific route  
**So that** I can schedule service delivery

**Acceptance Criteria:**
- [ ] Select route (required)
- [ ] Select date (required, can be future)
- [ ] Name auto-generated: "{route_name} {day_of_week} {YYYY-MM-DD}"
- [ ] Optional: expected meal count, notes
- [ ] Run appears in runs list with status "planned"
- [ ] Can assign team immediately or later

**Priority:** Must Have  
**Complexity:** Low

---

## US-025: Assign Team to Run
**As a** coordinator  
**I want** to assign volunteers to a run  
**So that** they know their schedule and responsibilities

**Acceptance Criteria:**
- [ ] "Manage Team" dialog on run detail
- [ ] Searchable list of available volunteers
- [ ] Can add multiple team members
- [ ] First member added = team lead (auto)
- [ ] Shows current team members
- [ ] Can remove team members before run starts
- [ ] Team members notified (future - email/SMS)

**Priority:** Must Have  
**Complexity:** Medium

---

## US-026: View Run Overview
**As a** coordinator or volunteer  
**I want** to view a run's overview  
**So that** I can see status, team, and assigned requests

**Acceptance Criteria:**
- [ ] Shows run name, date, route, status
- [ ] Shows team members with lead indicator
- [ ] Shows assigned requests grouped by location
- [ ] Shows meal count (planned vs actual)
- [ ] Shows progress if run is active
- [ ] Can navigate to run preparation or active run screen

**Priority:** Must Have  
**Complexity:** Medium

---

## US-027: View All Runs (List)
**As a** coordinator or volunteer  
**I want** to see all runs (past and upcoming)  
**So that** I can track schedule and history

**Acceptance Criteria:**
- [ ] Table shows: run name, date, route, status, team lead, meal count
- [ ] Can filter by status: planned, in_progress, completed
- [ ] Can filter by date range
- [ ] Can filter by route
- [ ] Default sort: upcoming first, then recent
- [ ] Mobile-responsive cards

**Priority:** Must Have  
**Complexity:** Low

---

## US-028: Edit Run Details (Before Start)
**As a** coordinator  
**I want** to edit run details before it starts  
**So that** I can adjust date, team, or notes

**Acceptance Criteria:**
- [ ] Can edit date, meal count, notes
- [ ] Cannot edit route (create new run instead)
- [ ] Cannot edit if run already started
- [ ] Shows warning if assigned requests exist
- [ ] Records who/when in run history

**Priority:** Should Have  
**Complexity:** Low

---

## US-029: Cancel Run
**As a** coordinator  
**I want** to cancel a planned run  
**So that** it's removed from schedule if no longer happening

**Acceptance Criteria:**
- [ ] "Cancel Run" button on run detail
- [ ] Required reason field
- [ ] Confirmation dialog
- [ ] Status changes to "cancelled"
- [ ] Assigned requests return to "ready_for_delivery" status
- [ ] Team members notified (future)
- [ ] Cannot cancel completed runs

**Priority:** Should Have  
**Complexity:** Medium

---

# Epic 7: Run Execution (Field Operations)

## US-030: Prepare Run (Pre-Departure)
**As a** volunteer  
**I want** to see a preparation checklist  
**So that** I'm ready before starting the run

**Acceptance Criteria:**
- [ ] Shows loading checklist: meals packed, team present, supplies loaded
- [ ] Shows expected meal count
- [ ] Shows first location/stop
- [ ] Shows all team members
- [ ] Shows weather/notes
- [ ] "Start Run" button enabled when ready
- [ ] Works offline

**Priority:** Must Have  
**Complexity:** Medium

---

## US-031: Start Run
**As a** volunteer (team lead)  
**I want** to start the run  
**So that** I can begin stop-by-stop navigation

**Acceptance Criteria:**
- [ ] "Start Run" button on preparation screen
- [ ] Confirmation dialog
- [ ] Status changes to "in_progress"
- [ ] Navigates to first stop (location)
- [ ] Records start time and user
- [ ] Works offline (queued for sync)

**Priority:** Must Have  
**Complexity:** Low

---

## US-032: Navigate Stop-by-Stop
**As a** volunteer executing a run  
**I want** to see one location at a time  
**So that** I stay focused and don't miss stops

**Acceptance Criteria:**
- [ ] Shows current stop: location name, address, stop number
- [ ] Shows progress: "Stop 3 of 8"
- [ ] Shows expected friends/requests at this location
- [ ] "Next Stop" button advances to next location
- [ ] "Previous Stop" button goes back (if needed)
- [ ] Disables "Next" until deliveries recorded
- [ ] Works offline

**Priority:** Must Have  
**Complexity:** Medium

---

## US-033: Record Meal Delivery
**As a** volunteer at a location  
**I want** to record how many meals delivered  
**So that** we track actual vs expected counts

**Acceptance Criteria:**
- [ ] Meal counter: +/- buttons, large touch targets
- [ ] Shows current count
- [ ] Can add notes per location
- [ ] Auto-saves as I increment/decrement
- [ ] Works offline (queued for sync)
- [ ] Cannot be negative

**Priority:** Must Have  
**Complexity:** Low

---

## US-034: Spot Expected Friend
**As a** volunteer at a location  
**I want** to mark that I saw an expected friend  
**So that** their request is fulfilled

**Acceptance Criteria:**
- [ ] Shows list of expected friends at this location (from assigned requests)
- [ ] Checkbox or button to mark "spotted"
- [ ] Auto-changes request status to "delivered"
- [ ] Records delivery time, location, volunteer
- [ ] Can add notes about interaction
- [ ] Works offline (queued for sync)

**Priority:** Must Have  
**Complexity:** Medium

---

## US-035: Spot Unexpected Friend (Quick Add)
**As a** volunteer at a location  
**I want** to record delivering to someone not on the list  
**So that** we track all deliveries accurately

**Acceptance Criteria:**
- [ ] "Add Friend" button at location screen
- [ ] Quick form: name (required only)
- [ ] Auto-creates friend + delivery record
- [ ] Associates with current location
- [ ] Works offline (queued for sync)
- [ ] Can add more details later

**Priority:** Must Have  
**Complexity:** Medium

---

## US-036: Mark Request as Delivered in Field
**As a** volunteer  
**I want** to mark requests as delivered  
**So that** coordinators know which needs were met

**Acceptance Criteria:**
- [ ] Shows assigned requests at current location
- [ ] "Delivered" checkbox or button per request
- [ ] Status changes to "delivered"
- [ ] Records delivery time, location, volunteer
- [ ] Increments meal count automatically
- [ ] Works offline (queued for sync)

**Priority:** Must Have  
**Complexity:** Medium

---

## US-037: Complete Run
**As a** volunteer (team lead)  
**I want** to mark the run as complete  
**So that** the system knows we finished

**Acceptance Criteria:**
- [ ] "Complete Run" button after last stop
- [ ] Summary screen: total stops, meals delivered, friends served
- [ ] Confirmation dialog
- [ ] Status changes to "completed"
- [ ] Records end time
- [ ] Syncs offline data before completing (if online)
- [ ] Cannot complete if undelivered assigned requests exist (warns)

**Priority:** Must Have  
**Complexity:** Medium

---

## US-038: Handle Offline Operations
**As a** volunteer in the field  
**I want** the app to work without internet  
**So that** I can record deliveries in areas with poor connectivity

**Acceptance Criteria:**
- [ ] All run execution screens work offline
- [ ] Changes queued in IndexedDB
- [ ] Shows offline indicator in UI
- [ ] Auto-syncs when connection restored
- [ ] Shows sync status per action
- [ ] Conflicts resolved (server wins, with local backup)

**Priority:** Must Have  
**Complexity:** High

---

## US-039: See Real-Time Updates (Multi-Device)
**As a** volunteer on a multi-person team  
**I want** to see updates from other team members  
**So that** we don't duplicate deliveries

**Acceptance Criteria:**
- [ ] Polls server every 20 seconds during active run
- [ ] Updates delivered requests across devices
- [ ] Updates meal counts across devices
- [ ] Shows who delivered what (team member name)
- [ ] Minimal battery impact
- [ ] Graceful degradation if offline

**Priority:** Should Have  
**Complexity:** Medium

---

# Epic 8: Reporting & Analytics

## US-040: View Run Statistics
**As a** coordinator or administrator  
**I want** to see aggregate statistics about runs  
**So that** I can report impact to stakeholders

**Acceptance Criteria:**
- [ ] Total runs completed (date range filter)
- [ ] Total meals delivered
- [ ] Total friends served
- [ ] Average meals per run
- [ ] Breakdown by route
- [ ] Breakdown by date (daily, weekly, monthly)
- [ ] Export to CSV

**Priority:** Should Have  
**Complexity:** Medium

---

## US-041: View Friend Engagement History
**As a** coordinator  
**I want** to see when a friend was last served  
**So that** I can prioritize re-engagement

**Acceptance Criteria:**
- [ ] Shows last delivery date per friend
- [ ] Shows delivery frequency
- [ ] Shows which locations they frequent
- [ ] Filter by date range
- [ ] Sort by last seen (oldest first)
- [ ] Flags friends not seen in 30+ days

**Priority:** Should Have  
**Complexity:** Medium

---

## US-042: View Location Activity
**As a** coordinator  
**I want** to see delivery counts per location  
**So that** I can identify high-traffic stops

**Acceptance Criteria:**
- [ ] Table: location name, route, total deliveries, last delivery date
- [ ] Filter by date range
- [ ] Sort by delivery count
- [ ] Flags locations with no recent activity
- [ ] Shows trend (increasing/decreasing)

**Priority:** Nice to Have  
**Complexity:** Low

---

# Epic 9: Permissions & Access Control

## US-043: Enforce Role-Based Permissions
**As an** administrator  
**I want** permissions enforced based on roles  
**So that** users can only access appropriate features

**Acceptance Criteria:**
- [ ] Admins can do everything
- [ ] Coordinators can manage requests, runs, friends, locations
- [ ] Volunteers can view runs, execute runs, record deliveries
- [ ] Volunteers cannot create/edit routes, users, or cancel runs
- [ ] UI hides unauthorized actions (buttons, menu items)
- [ ] API returns 403 for unauthorized actions
- [ ] Permissions checked on every request

**Priority:** Must Have  
**Complexity:** High

---

## US-044: Restrict Run Editing After Start
**As the** system  
**I want** to prevent editing runs after they start  
**So that** historical data remains accurate

**Acceptance Criteria:**
- [ ] Cannot edit team, date, or route after "Start Run"
- [ ] Can still add notes during execution
- [ ] Can add deliveries during execution
- [ ] Shows "Run in progress" warning if edit attempted
- [ ] Coordinators can override with special permission (future)

**Priority:** Must Have  
**Complexity:** Low

---

## US-045: Audit Trail for Critical Actions
**As an** administrator  
**I want** to see who changed critical data  
**So that** I can troubleshoot issues and ensure accountability

**Acceptance Criteria:**
- [ ] Logs all user creates/updates/deletes
- [ ] Logs all request status changes
- [ ] Logs all run status changes
- [ ] Logs all deliveries
- [ ] Shows user, timestamp, before/after values
- [ ] Searchable by entity, user, date
- [ ] Cannot be edited or deleted

**Priority:** Should Have  
**Complexity:** High

---

# Epic 10: Data Quality & Validation

## US-046: Prevent Duplicate Friends
**As a** coordinator  
**I want** to be warned when adding a friend with similar name  
**So that** we don't create duplicates

**Acceptance Criteria:**
- [ ] Searches existing friends as I type name
- [ ] Shows "similar friends" warning
- [ ] Can proceed anyway if confirmed different person
- [ ] Uses fuzzy matching (Levenshtein distance)
- [ ] Also checks alias field

**Priority:** Should Have  
**Complexity:** Medium

---

## US-047: Require Location on Requests
**As the** system  
**I want** to enforce that every request has a location  
**So that** runs know where to deliver

**Acceptance Criteria:**
- [ ] Location field is required on request form
- [ ] Database constraint enforces not-null
- [ ] Cannot submit form without location
- [ ] Error message is clear
- [ ] Can create location inline if not found

**Priority:** Must Have  
**Complexity:** Low

---

## US-048: Validate Request Workflow
**As the** system  
**I want** to enforce valid status transitions  
**So that** requests follow proper lifecycle

**Acceptance Criteria:**
- [ ] Can transition: pending → ready_for_delivery → assigned_to_run → delivered
- [ ] Can transition: any → cancelled
- [ ] Cannot go: delivered → assigned_to_run (backwards)
- [ ] Shows error with valid next states
- [ ] Status history records all transitions

**Priority:** Should Have  
**Complexity:** Medium

---

## US-049: Prevent Over-Assignment of Requests
**As the** system  
**I want** to prevent assigning a request to multiple runs  
**So that** we don't duplicate deliveries

**Acceptance Criteria:**
- [ ] Request can be assigned to at most one active run
- [ ] Shows error if already assigned
- [ ] Can reassign if original run cancelled
- [ ] Can create new request for same friend/location if needed

**Priority:** Must Have  
**Complexity:** Low

---

# Epic 11: Mobile Experience

## US-050: Mobile-First Navigation
**As a** volunteer using mobile  
**I want** bottom navigation and large touch targets  
**So that** I can use the app in the field easily

**Acceptance Criteria:**
- [ ] Bottom nav on mobile (<600px): Runs, Friends, Requests
- [ ] Top tabs on desktop (≥600px)
- [ ] Touch targets ≥44px
- [ ] No horizontal scrolling
- [ ] Swipe gestures for navigation (future)

**Priority:** Must Have  
**Complexity:** Low

---

## US-051: Optimized Run Execution for Mobile
**As a** volunteer  
**I want** a mobile-optimized active run screen  
**So that** I can operate one-handed in the field

**Acceptance Criteria:**
- [ ] Large +/- buttons for meal counter
- [ ] One stop per screen
- [ ] Minimal scrolling
- [ ] High-contrast colors
- [ ] Works in bright sunlight (no dark backgrounds)
- [ ] Portrait orientation optimized

**Priority:** Must Have  
**Complexity:** Medium

---

## US-052: Offline Indicator
**As a** volunteer  
**I want** to see when I'm offline  
**So that** I know data isn't syncing yet

**Acceptance Criteria:**
- [ ] Persistent offline badge/banner when disconnected
- [ ] Shows pending sync count
- [ ] Changes to green checkmark when synced
- [ ] Tapping badge shows sync queue details

**Priority:** Should Have  
**Complexity:** Low

---

# Summary Statistics

**Total User Stories:** 52  
**Must Have:** 37 (71%)  
**Should Have:** 13 (25%)  
**Nice to Have:** 2 (4%)

**By Persona:**
- Administrator: 5 stories
- Coordinator: 28 stories
- Volunteer: 19 stories
- System (all roles): 8 stories

**By Complexity:**
- Low: 26 stories (50%)
- Medium: 21 stories (40%)
- High: 5 stories (10%)

---

## Next Steps

1. ✅ User stories defined
2. ⏳ Create SCREEN_INVENTORY.md (map stories to screens)
3. ⏳ Create REQUIREMENTS.md (extract technical requirements)
4. ⏳ Create PERMISSIONS_SPEC.md (define ABAC rules)
5. ⏳ Create SUCCESS_CRITERIA.md (MVP scope)
