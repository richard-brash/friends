# Screen Inventory - Friends Outreach CRM V2

**Last Updated:** January 9, 2026  
**Status:** Phase 1 - Business Analysis

---

## Purpose

This document catalogs every screen in the application, including:
- Screen name and purpose
- Which persona context it belongs to
- Data displayed and actions available
- Navigation paths
- Related requirements and user stories

---

## Navigation Structure

```
App Shell (Authenticated)
├── Field Execution Context (Mobile-First)
│   ├── My Runs (list)
│   ├── Run Preparation (pre-run checklist)
│   ├── Active Run (stop-by-stop execution)
│   └── Run Complete (summary)
│
├── Run Planning Context (Desktop)
│   ├── Routes (list)
│   ├── Route Detail
│   ├── Runs (list)
│   ├── Run Detail
│   └── Create/Edit Run
│
├── Request Fulfillment Context (Any Device)
│   ├── Requests (list/filter)
│   ├── Request Detail
│   └── Create Request
│
└── Generic CRUD (Rare Use)
    ├── Friends (list)
    ├── Friend Detail
    ├── Locations (list)
    └── Location Detail
```

---

## Screen Catalog

### AUTH-01: Login Screen

**Purpose:** Authenticate users to access system  
**Context:** Pre-authentication  
**Device:** Any  
**Route:** `/login`

**Data Displayed:**
- Login form (email OR phone number, password)
- "Forgot password" link (disabled for MVP)
- Error messages (invalid credentials)

**Actions:**
- Submit login → authenticate → redirect to home
- Toggle between email and phone login

**Requirements:** FR-1.1, FR-1.2  
**User Stories:** US-001  
**Navigation:** Entry point → Home after auth

---

## Field Execution Context (Mobile-First)

### FIELD-01: My Runs (List)

**Purpose:** View runs user is scheduled for  
**Context:** Field Execution  
**Device:** Mobile (optimized), Desktop (available)  
**Route:** `/my-runs` or `/` (home for field workers)

**Data Displayed:**
- List of runs where user is team member
- Each run shows:
  - Run name (auto-generated)
  - Date
  - Route name
  - Status (planned, in_progress, completed)
  - Team lead indicator (if user is lead)
- Upcoming runs first, then recent completed
- Empty state: "No upcoming runs scheduled"

**Actions:**
- Tap run → navigate to Run Preparation (if planned) or Active Run (if in_progress) or Run Complete (if completed)
- Pull to refresh

**Requirements:** FR-5.1, FR-5.6  
**User Stories:** US-026  
**Navigation:** Home for field workers

---

### FIELD-02: Run Preparation Screen

**Purpose:** Pre-run checklist before departure  
**Context:** Field Execution  
**Device:** Mobile (primary)  
**Route:** `/runs/:id/prepare`

**Data Displayed:**
- Run name, date, route
- Team members list (lead indicated)
- Checklist items:
  - ☐ Meals: {count} loaded
  - ☐ Weekly items: {type}: {count} loaded (multiple types if configured)
  - ☐ Special requests ready:
    - Friend name: Item description - Location name
    - (list all ready_for_delivery requests on this route)

**Actions:**
- Check off meals loaded
- Check off weekly items loaded
- Check off each special request item loaded
  - On check → request status changes to "taken"
- "Start Run" button (enabled when ready)
  - Confirmation dialog
  - Run status: planned → in_progress
  - Navigate to Active Run screen (first stop)

**Requirements:** FR-6.1, FR-6.2, FR-6.3  
**User Stories:** US-030, US-031  
**Navigation:** From My Runs → Active Run (after start)

---

### FIELD-03: Active Run Screen (Stop-by-Stop)

**Purpose:** Execute delivery at current stop  
**Context:** Field Execution  
**Device:** Mobile (primary)  
**Route:** `/runs/:id/active` or `/runs/:id/stop/:stopNumber`

**Data Displayed:**
- **Header:**
  - Location name
  - Progress: "Stop {current} of {total}"
  - Navigation buttons: ← Previous | Next →
  
- **Expected Friends Section:**
  - List of friends with last known location = current location
  - Each friend shows: Name (alias if available)
  - Tap to expand actions
  
- **Special Requests Section:**
  - List of "taken" requests for this location
  - Each request shows: Friend name, item description
  - Tap to mark delivered
  
- **Meal Counter:**
  - Large number display
  - Large +/- buttons (44px minimum)
  - Current count for this location
  
- **Weekly Items Counter:**
  - Count display
  - +/- buttons
  - Label: "Weekly items distributed"
  
- **Notes Section:**
  - Free text field
  - "Add note about this stop"

**Actions:**
- **Spot Friend:**
  - Tap friend from expected list
  - Options: Record meal delivery, Update location
  - Location updated with current stop + timestamp
  
- **Quick Add Friend:**
  - "+" button
  - Modal: Name field (required), location pre-filled
  - Save → friend created, location history updated
  
- **Deliver Special Request:**
  - Tap request
  - Modal: Confirm delivery, note alternate recipient if needed
  - Request status: taken → delivered
  - Delivered_at timestamp, delivered_by user_id recorded
  
- **Take New Request:**
  - "New Request" button
  - Modal:
    - Friend: searchable dropdown (or create new)
    - Location: pre-filled (current stop)
    - Item: free text
    - Notes: free text
  - Save → request created with status "pending"
  
- **Increment/Decrement Counters:**
  - Tap +/- for meals
  - Tap +/- for weekly items
  - Counts saved per location
  
- **Navigate:**
  - "Next Stop" → advance to next location
  - "Previous Stop" → go back to previous location (if needed)
  - Cannot advance if required actions incomplete (optional validation)
  
- **Complete Run:**
  - After last stop, "Complete Run" button appears
  - Navigate to Run Complete screen

**Requirements:** FR-6.4 through FR-6.12  
**User Stories:** US-032 through US-036  
**Navigation:** Previous/Next within run → Run Complete at end

---

### FIELD-04: Run Complete Screen (Summary)

**Purpose:** Review run results and confirm completion  
**Context:** Field Execution  
**Device:** Mobile (primary)  
**Route:** `/runs/:id/complete`

**Data Displayed:**
- Run name, date
- **Summary Stats:**
  - Total stops completed: {count}
  - Meals delivered: {count}
  - Weekly items distributed: {count}
  - Special requests delivered: {count}
  - Friends served: {unique count}
  
- **Stop-by-Stop Breakdown:**
  - Location name
  - Meals: {count}
  - Weekly items: {count}
  - Requests delivered: {count}
  - Notes (if any)

**Actions:**
- "Confirm Completion" button
  - Run status: in_progress → completed
  - Completed_at timestamp recorded
  - Return to My Runs
  
- "Back to Run" (if need to make corrections)
  - Return to Active Run screen

**Requirements:** FR-6.13  
**User Stories:** US-037  
**Navigation:** Completes run → My Runs

---

## Run Planning Context (Desktop)

### PLAN-01: Routes (List)

**Purpose:** View all routes for planning  
**Context:** Run Planning  
**Device:** Desktop/Tablet (primary)  
**Route:** `/routes`

**Data Displayed:**
- Table/card list of routes:
  - Route name
  - Number of locations
  - Number of pending requests (on this route)
  - Last run date
  - Next scheduled run date
- Sort by: name, location count, last run date
- Empty state: "No routes configured. Create your first route."

**Actions:**
- Click route → navigate to Route Detail
- "Create Route" button → Create Route modal (MVP: admin only)
- Filter/search by name

**Requirements:** FR-4.1, FR-4.2  
**User Stories:** US-017  
**Navigation:** Nav menu → Route Detail

---

### PLAN-02: Route Detail

**Purpose:** View route details and create runs  
**Context:** Run Planning  
**Device:** Desktop/Tablet (primary)  
**Route:** `/routes/:id`

**Data Displayed:**
- **Route Info:**
  - Name, description
  - "Edit Route" button (rare, admin-level)
  
- **Locations Section:**
  - Ordered list of locations (stop sequence)
  - Each location shows: Stop #, Name, Pending request count
  - Drag-to-reorder (or up/down buttons)
  - "Add Location" button
  
- **Runs Section:**
  - List of recent and upcoming runs for this route
  - Each run shows: Name, Date, Status, Team lead
  - "Create Run" button (primary action)
  
- **Requests Section:**
  - Pending requests on this route
  - Grouped by location
  - Filter by status

**Actions:**
- Edit route (name, description)
- Reorder locations
- Add/remove locations
- Create run → navigate to Create Run screen
- View run details

**Requirements:** FR-4.3, FR-5.3  
**User Stories:** US-016  
**Navigation:** From Routes list

---

### PLAN-03: Runs (List)

**Purpose:** View all runs (all routes, all users)  
**Context:** Run Planning  
**Device:** Desktop/Tablet (primary)  
**Route:** `/runs`

**Data Displayed:**
- Table/card list of runs:
  - Run name
  - Date
  - Route name
  - Status (planned, in_progress, completed, cancelled)
  - Team lead name
  - Meal count (planned)
  - Actions (View, Edit, Cancel)
  
- **Filters:**
  - Status: All | Planned | In Progress | Completed | Cancelled
  - Route: All | {route names}
  - Date range: From/To date pickers
  - Team member: All | {user names}
  
- **Sort:**
  - Date (default: upcoming first, then recent)
  - Route name
  - Status

- **Empty state:** "No runs scheduled. Create your first run."

**Actions:**
- Click run → navigate to Run Detail
- "Create Run" button → Create Run screen
- Filter/sort runs
- Quick actions: Edit (if planned), Cancel, View

**Requirements:** FR-5.1, FR-5.10  
**User Stories:** US-027  
**Navigation:** Nav menu → Run Detail

---

### PLAN-04: Run Detail

**Purpose:** View run details, manage team  
**Context:** Run Planning  
**Device:** Desktop/Tablet (primary)  
**Route:** `/runs/:id`

**Data Displayed:**
- **Run Info:**
  - Name (auto-generated)
  - Date
  - Route name (link to route)
  - Status badge
  - Meal count (planned)
  - Weekly items (type + count)
  - Notes
  - Created by, created at
  
- **Team Section:**
  - List of team members
  - Team lead indicated (first member)
  - "Manage Team" button
  
- **Special Requests Section:**
  - Requests with status "ready_for_delivery" or "taken" on this route
  - Grouped by location
  - Each request shows: Friend name, item, status
  
- **Run Progress (if in_progress or completed):**
  - Current stop (if in_progress)
  - Stops completed
  - Meals delivered so far
  - Requests delivered
  
- **Summary (if completed):**
  - All statistics from Run Complete screen
  - Stop-by-stop breakdown

**Actions:**
- **Edit Run** (if status = planned):
  - Modify date, meal count, weekly items, notes
  - Cannot edit route (would require new run)
  
- **Manage Team:**
  - Modal with searchable user list
  - Add users to team
  - Remove users from team
  - Reorder (first = lead)
  - Save → notifications sent
  
- **Cancel Run:**
  - Confirmation dialog with reason
  - Run status → cancelled
  - Assigned requests return to "ready_for_delivery"
  
- **View Route** (link to route detail)
- **View Request** (link to request detail)

**Requirements:** FR-5.6, FR-5.7, FR-5.10  
**User Stories:** US-026, US-028, US-029  
**Navigation:** From Runs list or Route detail

---

### PLAN-05: Create/Edit Run

**Purpose:** Create new run or edit planned run  
**Context:** Run Planning  
**Device:** Desktop/Tablet (primary)  
**Route:** `/runs/new` or `/runs/:id/edit`

**Data Displayed:**
- Form fields:
  - Route (dropdown, required) - disabled if editing
  - Date (date picker, required)
  - Name (read-only, auto-generated preview)
  - Expected meal count (number input)
  - Weekly items:
    - Type (text input)
    - Count (number input)
    - "Add item" button for multiple types
  - Notes (textarea, optional)
  
- Preview: "Run name will be: {Route Name} {Day} {YYYY-MM-DD}"

**Actions:**
- Select route → preview name updates
- Select date → preview name updates
- Add/remove weekly item types
- Save → creates run with status "planned"
- Navigate to Run Detail (new run) or back to Run Detail (edited run)
- Cancel → discard changes

**Requirements:** FR-5.1, FR-5.2, FR-5.4, FR-5.5  
**User Stories:** US-024  
**Navigation:** From Route detail or Runs list → Run Detail after save

---

## Request Fulfillment Context

### REQUEST-01: Requests (List/Filter)

**Purpose:** View and manage all requests  
**Context:** Request Fulfillment  
**Device:** Any (desktop/tablet preferred)  
**Route:** `/requests`

**Data Displayed:**
- Table/card list of requests:
  - Friend name (link to friend)
  - Item description
  - Location name (link to location)
  - Route name
  - Status badge (pending, ready, taken, delivered, cancelled)
  - Created date
  - Actions (View, Mark Ready, Cancel)
  
- **Filters:**
  - Status: All | Pending | Ready | Taken | Delivered | Cancelled
  - Route: All | {route names}
  - Location: All | {location names}
  - Friend: Search by name
  - Date range: Created from/to
  
- **Group by:** (toggle)
  - Status (default)
  - Route (for staging)
  - Location
  
- **Sort:**
  - Created date (oldest first = priority)
  - Friend name
  - Location

**Actions:**
- Click request → navigate to Request Detail
- "New Request" button → Create Request screen
- Quick actions:
  - Mark Ready (if pending)
  - Cancel (if not delivered)
- Bulk select → bulk mark ready (future enhancement)
- Export filtered list (future enhancement)

**Requirements:** FR-7.3, FR-7.4, FR-7.5  
**User Stories:** US-020  
**Navigation:** Nav menu → Request Detail

---

### REQUEST-02: Request Detail

**Purpose:** View request details and history, manage lifecycle  
**Context:** Request Fulfillment  
**Device:** Any  
**Route:** `/requests/:id`

**Data Displayed:**
- **Request Info:**
  - Friend name (link to friend)
  - Location name (link to location)
  - Route name (computed from location)
  - Item description
  - Notes
  - Current status badge
  - Created by, created at
  
- **Status History:**
  - Timeline of all status changes
  - Each entry shows: Status, User, Timestamp, Notes
  - Visual timeline (vertical)
  
- **Delivery Info (if delivered):**
  - Delivered at (timestamp)
  - Delivered by (user name)
  - Delivered to (friend name, if different from requester)
  - Run name (which run delivered it)
  - Location (where delivered)
  - Notes about delivery
  
- **Actions Available (based on status):**
  - If pending: "Mark Ready for Delivery", "Cancel"
  - If ready: "Cancel", "Return to Pending"
  - If taken: View only (wait for delivery)
  - If delivered: View only
  - If cancelled: View only

**Actions:**
- **Mark Ready for Delivery:**
  - Modal: Add notes about item pulled
  - Status: pending → ready_for_delivery
  - Timestamp + user recorded
  
- **Cancel Request:**
  - Modal: Reason required (dropdown + notes)
  - Reasons: "Item unavailable", "Friend no longer needs", "Unable to fulfill", "Other"
  - Status → cancelled
  - Timestamp + user recorded
  
- **Return to Pending:**
  - If item turns out to be wrong/unavailable after marking ready
  - Status: ready_for_delivery → pending
  - Add note explaining
  
- **Edit Request (if pending or ready):**
  - Modify item description, notes
  - Cannot change friend or location (would be new request)
  
- View linked records (friend, location, run)

**Requirements:** FR-7.1, FR-7.3, FR-7.6, FR-7.7, FR-7.8  
**User Stories:** US-019, US-021, US-023  
**Navigation:** From Requests list

---

### REQUEST-03: Create Request

**Purpose:** Create new request (rare - mostly done in field)  
**Context:** Request Fulfillment (or Field Execution)  
**Device:** Any  
**Route:** `/requests/new`

**Data Displayed:**
- Form fields:
  - Friend (searchable dropdown, required)
    - "Create new friend" link (inline quick add)
  - Location (searchable dropdown, required)
    - Filtered by route if context known
  - Item description (textarea, required)
  - Notes (textarea, optional)
  
- Context-aware pre-filling:
  - If accessed from Field Execution: location pre-filled
  - If accessed from Friend detail: friend pre-filled
  - If accessed from Location detail: location pre-filled

**Actions:**
- Search and select friend (or create new)
- Search and select location
- Enter item description
- Add notes
- Save → request created with status "pending"
- Navigate to Request Detail (new request) or back to context

**Requirements:** FR-7.1, FR-7.2  
**User Stories:** US-018  
**Navigation:** From Requests list, Field Execution context, Friend detail, Location detail

---

## Generic CRUD Screens (Rare Use)

### CRUD-01: Friends (List)

**Purpose:** View all friends, search, manage (edge cases)  
**Context:** Generic CRUD  
**Device:** Any  
**Route:** `/friends`

**Data Displayed:**
- Table/card list of friends:
  - Name (first, last, alias - whatever is populated)
  - Phone (if available)
  - Email (if available)
  - Status (active/inactive)
  - Last seen (location + date)
  - Pending requests count
  - Actions (View, Edit)
  
- **Search:**
  - Text input searches: first name, last name, alias, phone, email
  - Fuzzy matching
  
- **Filters:**
  - Status: All | Active | Inactive
  - Last seen: Past 7 days | Past 30 days | More than 30 days ago | Never
  
- **Sort:**
  - Name (default)
  - Last seen (recent first)
  - Created date

**Actions:**
- Click friend → navigate to Friend Detail
- "Add Friend" button → Create Friend screen (generic form)
- Quick actions: Edit, Mark Inactive
- Search/filter friends

**Requirements:** FR-2.5  
**User Stories:** US-008  
**Navigation:** Nav menu → Friend Detail

---

### CRUD-02: Friend Detail

**Purpose:** View friend details, location history, request history  
**Context:** Generic CRUD (also accessible from other contexts)  
**Device:** Any  
**Route:** `/friends/:id`

**Data Displayed:**
- **Friend Info:**
  - First name, last name, alias
  - Phone, email
  - Status (active/inactive toggle)
  - Created date
  - "Edit" button
  
- **Location History:**
  - Last 5 locations by default (most recent first)
  - Each entry: Location name, Date/time spotted
  - "View all locations" expands full history
  
- **Request History:**
  - All requests for this friend
  - Grouped by status: Pending, Ready, Taken, Delivered, Cancelled
  - Each request: Item, Location, Status, Created date
  - Click request → Request Detail
  
- **Delivery History:**
  - All deliveries (meals, weekly items, special requests)
  - Each delivery: Date, Location, Run name, Items delivered
  - Summary stats: Total meals received, Total requests fulfilled

**Actions:**
- Edit friend (name, alias, phone, email)
- Toggle status (active ↔ inactive)
- View location history (expand/collapse)
- Create new request for this friend (button)
  - Opens Create Request with friend pre-filled
- View request details
- View location details

**Requirements:** FR-2.1, FR-2.6, FR-2.7  
**User Stories:** US-007, US-009  
**Navigation:** From Friends list, Request detail, Field Execution context

---

### CRUD-03: Locations (List)

**Purpose:** View all locations (rare - mostly managed via Route detail)  
**Context:** Generic CRUD  
**Device:** Any  
**Route:** `/locations`

**Data Displayed:**
- Table/card list of locations:
  - Name
  - Address (if available)
  - Route name
  - Stop sequence number
  - Pending requests count
  - Last served (date of last run at this location)
  - Actions (View, Edit)
  
- **Filters:**
  - Route: All | {route names}
  - Has pending requests: Yes | No
  
- **Sort:**
  - Route, then stop sequence (default)
  - Name
  - Last served

**Actions:**
- Click location → navigate to Location Detail
- "Add Location" button → Create Location form (requires route selection)
- Quick actions: Edit, Move to different route

**Requirements:** FR-3.1, FR-3.2  
**Navigation:** Nav menu → Location Detail

---

### CRUD-04: Location Detail

**Purpose:** View location details, request activity, delivery history  
**Context:** Generic CRUD (also accessible from other contexts)  
**Device:** Any  
**Route:** `/locations/:id`

**Data Displayed:**
- **Location Info:**
  - Name
  - Address (if available)
  - Route name (link to route)
  - Stop sequence number
  - Notes
  - "Edit" button
  
- **Pending Requests:**
  - All pending/ready requests for this location
  - Each request: Friend name, Item, Status
  - Click request → Request Detail
  
- **Friends Spotted Here:**
  - Friends with last known location = this location
  - Each friend: Name, Last seen date
  - Click friend → Friend Detail
  
- **Delivery History:**
  - Runs that stopped here
  - Each run: Date, Run name, Meals delivered, Requests fulfilled
  - Summary stats: Total runs, Total meals delivered

**Actions:**
- Edit location (name, address, notes)
- Change route (warning if pending requests exist)
- Change stop sequence (up/down)
- Create new request at this location (button)
  - Opens Create Request with location pre-filled
- View request details
- View friend details

**Requirements:** FR-3.1, FR-3.6  
**User Stories:** US-012  
**Navigation:** From Locations list, Route detail, Request detail

---

## Screen Count Summary

| Context | Screens | Primary Device |
|---------|---------|----------------|
| Authentication | 1 | Any |
| Field Execution | 4 | Mobile |
| Run Planning | 5 | Desktop |
| Request Fulfillment | 3 | Any |
| Generic CRUD | 4 | Any |
| **Total** | **17** | **Mixed** |

---

## Navigation Matrix

| From Screen | To Screen | Trigger |
|-------------|-----------|---------|
| Login | My Runs (field worker home) | Successful auth |
| My Runs | Run Preparation | Tap planned run |
| My Runs | Active Run | Tap in_progress run |
| My Runs | Run Complete | Tap completed run |
| Run Preparation | Active Run | Start Run button |
| Active Run | Active Run | Next/Previous Stop |
| Active Run | Run Complete | Complete Run button |
| Active Run | Friend Detail | Tap friend |
| Active Run | Request Detail | Tap request |
| Active Run | Create Request | New Request button |
| Run Complete | My Runs | Confirm Completion |
| Routes List | Route Detail | Click route |
| Route Detail | Create Run | Create Run button |
| Route Detail | Run Detail | Click run |
| Runs List | Run Detail | Click run |
| Run Detail | Route Detail | Click route name |
| Run Detail | Request Detail | Click request |
| Run Detail | Create/Edit Run | Edit Run button |
| Requests List | Request Detail | Click request |
| Request Detail | Friend Detail | Click friend name |
| Request Detail | Location Detail | Click location name |
| Friends List | Friend Detail | Click friend |
| Friend Detail | Request Detail | Click request |
| Friend Detail | Create Request | New Request button |
| Locations List | Location Detail | Click location |
| Location Detail | Route Detail | Click route name |
| Location Detail | Request Detail | Click request |

---

## Component Reuse

### Shared Components

1. **Friend Selector**
   - Searchable dropdown
   - Used in: Create Request, Active Run (spot friend)
   - Props: onSelect, preselectedId, allowCreate

2. **Location Selector**
   - Searchable dropdown, filterable by route
   - Used in: Create Request, Create Location
   - Props: onSelect, routeFilter, preselectedId

3. **Request Status Badge**
   - Color-coded status indicator
   - Used in: Requests List, Request Detail, Run Detail
   - Props: status

4. **Run Status Badge**
   - Color-coded status indicator
   - Used in: Runs List, Run Detail, My Runs
   - Props: status

5. **Counter Control**
   - Large +/- buttons with number display
   - Used in: Active Run (meals, weekly items)
   - Props: value, onChange, label, min, max

6. **Team Member List**
   - Display team with lead indicator
   - Used in: Run Detail, Run Preparation, My Runs
   - Props: teamMembers, showActions

7. **Status History Timeline**
   - Vertical timeline of status changes
   - Used in: Request Detail
   - Props: history

8. **Notes Display/Edit**
   - Textarea with formatting
   - Used in: Multiple screens
   - Props: value, onChange, readOnly

---

## Next Steps

1. ✅ Screen inventory complete
2. ⏳ Validate screens against requirements and user stories
3. ⏳ Create wireframes for key screens (optional)
4. ⏳ Define component library structure
5. ⏳ Create PERMISSIONS_SPEC.md (screen-level permissions)
6. ⏳ Create SUCCESS_CRITERIA.md
