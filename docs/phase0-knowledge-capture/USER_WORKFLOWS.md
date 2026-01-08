# User Workflows - Real-World Usage Patterns

## Core User Personas

### 1. Administrator (Sarah)
- **Role:** System admin, manages users and core data
- **Technical skill:** High
- **Frequency:** Daily, 1-2 hours
- **Primary tasks:** User management, route configuration, data cleanup

### 2. Coordinator (Mike)
- **Role:** Plans and schedules runs, assigns teams
- **Technical skill:** Medium
- **Frequency:** Daily, 2-3 hours
- **Primary tasks:** Run planning, request management, team coordination

### 3. Volunteer (Field Worker - Jamie)
- **Role:** Executes runs in the field
- **Technical skill:** Low-Medium
- **Frequency:** 2-3 times per week, 2-4 hours per run
- **Primary tasks:** Field execution, delivery recording, friend interaction

---

## Workflow 1: Run Planning (Coordinator)

**Goal:** Create and prepare a run for upcoming service delivery

**Frequency:** 2-3 times per week

**Steps:**

1. **Review Route and Requests**
   - Navigate to Routes screen
   - Select route (e.g., "Baltimore City West")
   - View locations on route
   - Filter requests by status: "ready_for_delivery"
   - Identify how many requests need servicing

2. **Create Run**
   - Click "Create Run" on route screen
   - Select date (usually 1-3 days ahead)
   - System auto-generates name: "Baltimore City West Wednesday 2026-01-08"
   - Set expected meal count (estimate)
   - Add notes (weather warnings, special considerations)

3. **Assign Team**
   - Click "Manage Team" on run
   - Add 2-4 team members from available volunteers
   - First added = team lead (auto)
   - Verify team members have notifications enabled

4. **Verify Requests**
   - Review requests on this route
   - Confirm priorities (urgent first)
   - Add notes for team (special instructions)
   - Mark requests as "taken" (assigned to this run)

5. **Final Check**
   - Verify date, time, team, requests
   - Run status: "Planned"
   - Notify team via system or external (SMS/email)

**Pain Points in V1:**
- Had to manually track which requests belonged to which run
- No preparation checklist
- Team assignment was separate step, easy to forget

**Needed for V2:**
- Guided wizard for run creation
- Auto-suggest team based on availability
- Bulk request assignment
- Automated notifications

---

## Workflow 2: Run Execution (Field Worker)

**Goal:** Execute planned run, deliver services, record outcomes

**Frequency:** 2-3 times per week

**Steps:**

### Phase A: Preparation (Before Leaving)

1. **Access Run**
   - Open app on mobile device
   - Navigate to "My Runs" (filter: assigned to me)
   - Select today's run
   - Run status: "Planned" → click "Prepare Run"

2. **Preparation Checklist**
   - Load meals (quantity matches estimate)
   - Load supplies (cups, napkins, etc.)
   - Check vehicle (gas, safety equipment)
   - Review route (10 stops on Baltimore City West)
   - Review requests (8 friends expecting items)
   - Check weather conditions
   - Mark "Preparation Complete"
   - Run status: "Planned" → "Prepared"

### Phase B: Field Execution (On Route)

3. **Start Run**
   - Click "Start Run" when leaving
   - Run status: "Prepared" → "In Progress"
   - Navigate to first stop

4. **At Each Stop (Repeat for 10 locations)**
   - **Arrive at location**
     - App shows: Location name, address
     - Requests at this stop (friends expecting items)
     - Expected friends (from requests)
   
   - **Spot Friends**
     - Mark expected friends as "present" when seen
     - Quick-add new friends not in system
     - Note no-shows
   
   - **Record Deliveries**
     - Enter number of meals delivered at this stop
     - Add notes (observations, friend feedback)
     - Mark requests as "delivered" for present friends
   
   - **Advance to Next Stop**
     - Click "Next Stop"
     - App updates current location
     - Offline queue syncs when connectivity available

5. **Complete Run**
   - After final stop, click "Complete Run"
   - Review summary:
     - Total stops visited: 10
     - Total meals delivered: 45
     - Requests fulfilled: 8
     - New friends added: 2
   - Add final notes
   - Run status: "In Progress" → "Completed"

### Phase C: Post-Run (After Returning)

6. **Debrief**
   - Ensure all data synced (check offline queue)
   - Review any issues/notes with coordinator
   - Vehicle cleanup

**Pain Points in V1:**
- Preparation checklist didn't exist
- Couldn't navigate backward (if wrong stop marked)
- Meal count defaulted to 0, easy to forget
- Friend spotting was clunky
- Offline sync sometimes failed silently
- No summary at end

**Needed for V2:**
- Forced preparation checklist
- Backward navigation
- Null default for meal count (must explicitly enter)
- Better friend spotting UX
- Clear offline sync status
- Auto-generated summary report

---

## Workflow 3: Request Management (Coordinator)

**Goal:** Manage incoming service requests from friends

**Frequency:** Daily

**Steps:**

1. **Receive Request**
   - Phone call, in-person at location, or referral
   - Friend needs item (e.g., warm coat, shoes, food)

2. **Create Request in System**
   - Navigate to Requests screen
   - Click "New Request"
   - **Select Friend:**
     - Search by name
     - If new: "Add New Friend" → quick form
   - **Request Details:**
     - Item description: "Winter coat, size L"
     - Quantity: 1
     - Priority: "High" (urgent need)
     - Preferred location: "Mondawmin Metro"
   - **Notes:** Any special instructions
   - Status: Auto-set to "Pending"

3. **Triage and Planning**
   - Review all "Pending" requests
   - Change status to "Ready for Delivery" when item acquired
   - Assign location (where friend will be)
   - Prioritize (urgent requests first)

4. **Assign to Run**
   - When creating run, requests at route locations auto-show
   - Coordinator verifies which to include
   - Status: "Ready for Delivery" → "Taken"

5. **Track Delivery**
   - Field team executes run
   - Status: "Taken" → "Delivered" (or note if friend no-show)
   - Coordinator reviews completed runs
   - Follow up on no-shows (reschedule)

6. **Close Request**
   - Status: "Delivered" → request considered fulfilled
   - History shows: Created → Ready → Taken → Delivered (with timestamps, users)

**Pain Points in V1:**
- No way to bulk-assign requests to run
- Status changes sometimes didn't trigger history record
- Friend lookup was slow
- Couldn't filter by location and status simultaneously

**Needed for V2:**
- Bulk actions (select multiple, change status)
- Fast friend search (autocomplete)
- Advanced filters (location + status + priority)
- Automated notifications on status change

---

## Workflow 4: Route Configuration (Administrator)

**Goal:** Set up and maintain routes (sequences of locations)

**Frequency:** Monthly (new routes) or as-needed (updates)

**Steps:**

1. **Create Route**
   - Navigate to Routes screen
   - Click "New Route"
   - Enter name: "Baltimore City West"
   - Description: "Western neighborhoods, Mondawmin to Edmonson Village"
   - Mark as "Active"

2. **Add Locations to Route**
   - Click "Manage Locations" on route
   - **For each location:**
     - Search existing or create new
     - Location details: name, address, coordinates
     - Set route order (1-10)
     - Add notes (parking, safety considerations)

3. **Order Locations**
   - Drag-and-drop to reorder
   - Verify sequence makes sense (efficient path)
   - Consider traffic patterns, time of day

4. **Test Route**
   - Drive route physically
   - Verify addresses, parking
   - Time the route (estimate duration)
   - Update notes with findings

5. **Activate Route**
   - Mark as "Active" → shows up in run planning
   - Notify coordinators of new route availability

**Pain Points in V1:**
- No drag-and-drop reordering
- Had to manually set route_order numbers
- Couldn't preview route on map
- No way to duplicate similar route

**Needed for V2:**
- Drag-and-drop location ordering
- Map preview with route visualization
- "Clone Route" feature
- Bulk location import (CSV)

---

## Workflow 5: Friend Management (Coordinator/Field Worker)

**Goal:** Maintain accurate friend records and interaction history

**Frequency:** Daily (updates), weekly (bulk review)

**Steps:**

1. **Add New Friend**
   - **In Office:**
     - Navigate to Friends screen
     - Click "Add Friend"
     - Full form: name, alias, phone, notes, status
   
   - **In Field (Quick Add):**
     - During run execution
     - Spot unknown person
     - Quick form: name only (minimum)
     - Can update later with more details

2. **Update Friend Info**
   - Search for friend by name
   - Click to view profile
   - Edit fields (phone number changed, new alias)
   - Add notes (observations from field)

3. **Review Friend History**
   - View friend profile
   - See all requests (past and current)
   - See delivery history (which runs, when)
   - Identify patterns (regular at Mondawmin Metro)

4. **Manage Friend Status**
   - Mark as "Inactive" if no longer engaging
   - Reactivate if they return
   - Status history tracks changes

**Pain Points in V1:**
- Quick-add in field didn't work reliably
- Friend search was slow
- No consolidated history view
- Couldn't see which runs a friend was on

**Needed for V2:**
- Fast friend search (autocomplete, fuzzy matching)
- Consolidated activity feed per friend
- Better quick-add UX in field
- Duplicate detection (same name, similar phone)

---

## Workflow 6: Permissions Management (Administrator)

**Goal:** Grant fine-grained permissions to users

**Frequency:** Weekly (new users), monthly (adjustments)

**Requirements (Not Built in V1):**

1. **Default Role Permissions**
   - **Admin:** Full access to everything
   - **Coordinator:** Create/edit runs, routes, requests, friends, locations
   - **Volunteer:** Execute assigned runs, view limited data

2. **Fine-Grained Overrides**
   - Grant volunteer permission to create requests (not just execute)
   - Grant coordinator permission to manage users (usually admin-only)
   - Restrict coordinator to specific routes only

3. **Context-Aware Permissions**
   - "Can edit runs on routes I coordinate"
   - "Can view requests at locations I've visited"
   - "Can manage team members I recruited"

4. **Audit Permissions**
   - View who has access to what
   - Track permission changes over time
   - Alert on suspicious permission escalation

**Why This Wasn't Built:**
- Didn't realize complexity until planning fine-grained access
- Role-based was simple placeholder
- Real-world needs don't fit strict roles

**Needed for V2:**
- Permission service with ABAC (Attribute-Based Access Control)
- UI to manage permissions per user
- Permission templates (common grant bundles)
- Audit log of permission changes

---

## Cross-Cutting Workflows

### Offline Operation (Field Worker)

**Scenario:** Lose cell signal mid-run

**System Behavior:**
1. User continues entering data (meals, friends, notes)
2. Operations queue in IndexedDB
3. UI shows "Offline - X operations pending"
4. When connectivity returns:
   - Queue processes automatically
   - UI updates to "Synced"
   - Conflicts handled (last-write-wins or manual resolution)

**V1 Implementation:**
- Basic offline queue worked
- URL issues caused some ops to fail
- No conflict resolution
- Silent failures sometimes

**V2 Needs:**
- Robust conflict resolution
- Clear user feedback on sync status
- Manual retry for failed operations
- Optimistic UI updates

---

### Multi-Device Coordination (Multiple Field Workers)

**Scenario:** Two volunteers on same run, different devices

**System Behavior:**
1. Both workers logged in, viewing same run
2. Worker A advances to stop 3
3. Worker B's device polls, sees update, refreshes UI
4. Both now see stop 3 as current
5. Meal counts and deliveries aggregate

**V1 Implementation:**
- Polling every 20 seconds
- Simple refresh on changes detected
- No real-time updates

**V2 Needs:**
- WebSocket for real-time updates (faster than polling)
- Operational transform for concurrent edits
- Lock mechanism for critical operations
- Better visual feedback on multi-user activity

---

## Summary: Critical Workflows for V2

### Must-Have (MVP)
1. **Run Planning** - Coordinator creates, assigns team, verifies requests
2. **Run Execution** - Field worker navigates stops, records deliveries
3. **Request Management** - Coordinator tracks lifecycle from creation to delivery
4. **Friend Management** - Quick-add in field, full edit in office

### Should-Have (Post-MVP)
5. **Route Configuration** - Admin sets up efficient routes
6. **Permissions Management** - Fine-grained access control

### Nice-to-Have (Future)
7. **Reporting/Analytics** - Trends, metrics, outcomes
8. **Notifications** - SMS/email alerts on key events
9. **Inventory Management** - Track items available for requests
10. **Donor Management** - Track contributions, generate reports

---

## Workflow Dependencies

```
Route Configuration (Admin)
    ↓
Run Planning (Coordinator)
    ↓
Team Assignment (Coordinator)
    ↓
Run Preparation (Field Worker)
    ↓
Run Execution (Field Worker)
    ↓
Delivery Recording (Field Worker)
    ↓
Status Updates (System)
    ↓
Completion Review (Coordinator)
```

**Key Insight:** Field execution is the culmination of all other workflows. If execution fails, everything upstream is wasted effort. V2 must optimize for field reliability above all else.
