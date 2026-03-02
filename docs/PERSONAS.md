# Personas - Friends Outreach CRM V2

**Last Updated:** January 8, 2026  
**Status:** Phase 1 - Business Analysis (In Progress)

---

## What Are "Personas" in This Context?

**Personas = Contextual workflows and specialized dashboards**, not user types or roles.

Each persona represents:
- A specific **activity context** (field work, planning, fulfillment)
- A **specialized screen/workflow** optimized for that task
- A **set of features** relevant to that context

**Key Principles:**
- Permissions determine who can access which contexts (attribute-based)
- Same person can operate in multiple contexts (e.g., volunteer who also coordinates)
- Most data entry happens in **specialized, context-aware screens** (not generic CRUD forms)
- Generic CRUD screens exist but are for edge cases, not primary workflows

---

## Organization Context

**Who:** Faith-based non-profit serving homeless community  
**What:** Deliver meals on set routes to specific locations (Mon/Wed/Fri typical, but flexible)  
**Routes:** Currently 3 routes, subject to change  
**Locations:** 6-24 stops per route  
**Volunteers:** 20-30 active users  
**Friends:** Hundreds (service recipients, called "friends" by organization)

**Core Problem Being Solved:**
Today, special requests are tracked on a whiteboard (handwritten). Process is:
1. Field worker takes request, writes on whiteboard
2. Someone pulls item from inventory when available
3. Item is marked "ready" on whiteboard
4. Field worker loads and delivers on next run
5. Result is recorded on whiteboard (or forgotten)

**Pain:** Illegible handwriting, lost requests, no history, no accountability, unclear status

---

## Persona 1: Field Execution Context

**Who:** Any user scheduled as team member on a delivery run  
**Device:** Mobile (personal phone)  
**Environment:** In vehicle, moving between stops, bright sunlight, gloves on, spotty connectivity  
**Frequency:** 2-3 times per week, 2-4 hours per run  
**Tech Comfort:** Low to Medium

---

### Primary Goal
Execute delivery run efficiently, serve friends, capture new requests without breaking workflow

### Key Context
- One-handed operation often needed (holding food/supplies)
- Must work offline (connectivity unreliable in field)
- Quick interactions (friends waiting, time-sensitive)
- Context is known (current location, current run, current team)
- Data should be pre-filled where possible

---

### Pre-Run: Preparation Workflow

**Scenario:** User has run scheduled, needs to prepare before departure

1. **Check Schedule**
   - Opens app, sees "Downtown Monday 2026-01-08" in "My Runs"
   - Taps to view details

2. **Review Prep Checklist**
   - Sees: "25 meals, 10 weekend bags, 5 special requests ready"
   - Special requests list shows:
     - Pete: Boots (size 11) - Location: Park & Lexington
     - Maria: Winter coat (women's M) - Location: MLK & Monument
     - ...
   - Checks off items as loaded into vehicle:
     - ✅ 25 meals loaded
     - ✅ 10 weekend bags loaded
     - ✅ Pete's boots loaded → status changes to "taken"
     - ✅ Maria's coat loaded → status changes to "taken"

3. **Note Team Members**
   - View Upcoming Run**
   - App shows "My Runs" (runs user is scheduled for)
   - Tap run to see preparation screen

2. **Preparation Checklist**
   - Shows what to load:
     - Number of meals (e.g., "25 meals")
     - Weekly items with counts (e.g., "10 weekend bags")
     - Special request items ready for delivery (e.g., "Pete: Boots size 11 - Park & Lexington")
   
3. **Check Off Items as Loaded**
   - Check meals loaded
   - Check weekly items loaded
   - Check each special request item loaded
   - When special request checked → status changes from "ready_for_delivery" to "taken"

4. **See Team Members**
   - View who's on the team
   - First person listed = team lead (first added to run)

5. **Start Run**
   - Tap "Start Run" button when ready
   - Run status changes to "in_progress"
   - Navigate to first stop very grateful"
   
   - Carlos is: Stop-by-Stop Execution

**Scenario:** User arrives at a location during active ru
   
   - See Current Stop**
   - Location name, stop number (e.g., "Stop 1 of 8: Park & Lexington")
   - Progress indicator
   - Expected friends (last known location = this location, regardless of request status)

2. **Record Meal Deliveries**
   - Large +/- buttons to increment meal count
   - Count persists per location
   - Can add notes about conditions

3. **Record Weekly Item Distribution**
   - Count of weekly items given out (aggregate, not itemized)
   - Example: "4 weekend bags distributed"

4. **Deliver Special Request Items**
   - See list of request items ready for this location
   - Tap request to mark delivered
   - Request status changes to "delivered"
   - Can note if delivered to different friend (e.g., "Pete absent, gave to Joe")

5. **Spot Friends**
   - See expected friends (last seen here)
   - Tap friend to update their location history
   - Adds current location + timestamp to friend's history

6. **Quick Add Friend**
   - Unknown person? Tap "Add Friend"
   - Name field only (required)
   - Location pre-filled (current stop)
   - Friend created and associated with current location

7. **Take New Request**
   - Friend asks for item
   - Tap "New Request"
   - Friend field (searchable, or pre-filled if in friend context)
   - Location pre-filled (current stop)
   - Item description (free text: "Sleeping bag, warm rating")
   - Notes (optional)
   - Submit → Request status: "pending"

8. **Navigate to Next Stop**
   - "Next Stop" button advances
   - "Previous Stop" button if needed (goes back)
   - Cannot advance until deliveries recorded (optional validation)
- SpPost-Run: Completion

1. **Finish Last Stop**
   - After recording deliveries at final location
   - "Complete Run" button available

2. **Run Summary**
   - Shows totals:
     - Stops completed
     - Meals delivered
     - Weekly items distributed
     - Special requests delivered
     - Friends served (unique count)
   
3. **Confirm Completion**
   - Tap "Complete Run"
   - Run status changes to "completed"
   - Syncs any offline data (if connectivity restored)

---

### Special Scenarios

**Delivery Flexibility:**
- Request item for Pete, but Pete is not present
- Joe is here and needs the item
- Mark request as delivered, note "Delivered to Joe instead - Pete absent"
- Real-world flexibility supported

**Spotting Friends:**
- Maria usually at location A
- Today she's at location B
- Spot her at location B → updates her last known location
- Helps track transient population movement

**Offline Operations:**
- No connectivity at stop
- All actions queued locally (IndexedDB)
- Offline indicator shows pending sync count
- Auto-syncs when connection restored
- Server wins on conflicts (with local backup)
**SyPain Points (Today with Whiteboard)

- Illegible handwriting → can't read request details later
- Don't know which item is for which friend
- Don't know where friends have moved
- Forget to write location → can't deliver
- No visibility if someone else already delivered
- Lost requests (erased, forgotten, board full)

---

### Technical Requirements

**Must Have:**
- **Offline-first:** All features work without connectivity, sync when available
- **Large touch targets:** Minimum 44px for gloved operation
- **Minimal typing:** Pre-filled data, dropdowns, autocomplete
- **High contrast:** Readable in bright sunlight
- **Fast loading:** No waiting between screens
- **One-handed friendly:** Critical actions accessible with thumb
- **Context-aware:** Pre-fill location, run, friend when known

**Information Display:**
- Current stop and progress (Stop X of Y)
- Expected friends at this location
- Special request items for this location
- Meal/item counts (current totals)
- Next stop preview

**Actions:**
- Increment/decrement counters (meals, weekly items)
- Mark request delivered
- Spot friend (update location history)
- Take new request (minimal form)
- Quick add friend (name only)
- Navigate stop-to-stop
- Add notes per location:** Daily, 1-3 hours for planning and coordination  
**Tech Comfort:** Medium to High

---

### Background & Context

Mike works part-time for the organization as operations coordinator. His job is to ensure runs are properly planned, volunteers are scheduled, and nothing falls through the cracks. He needs to see the "big picture" across all routes and runs.

He's also a field volunteer 1-2 times per month, so he understands the field challenges.
Planning Context

**Who:** User with permission to schedule runs and assign volunteers  
**Device:** Desktop or tablet  
**Environment:** Office, stable internet  
**Frequency:** As needed (typically day before runs)  
**Tech Comfort:** Medium to High

---

### Primary Goal
Schedule runs, assign volunteers, plan meal counts and weekly items
- 90%+ of assigned requests actually delivered
- Zero runs cancelled due to lack of volunteers

---

### Weekly Planning Workflow
Core Workflows

#### 1. Schedule a Run

**Scenario:** Need to create Monday's run
   - Save

3. **Assign Team**
   - Click "Manage Team" on Monday's run
   - Add volunteers:
     - Sarah (first added = team lead)
     - Jamie
     - Mike (himself, if needed)
   - Each gets notification: "You're scheduled for Downtown Monday 2026-01-13"

4. **Review Special Requests**
   - Opens Monday run details
   - Sees list of "ready for delivery" requests at Downtown locations
   - All 7 requests on Downtown route automatically associated
   - Notes which ones need warehouse to pull items

5. Navigate to Route (e.g., Downtown Route)
2. Click "Create Run"
3. Select date (can be today or future)
4. Name auto-generated: "{Route Name} {Day} {YYYY-MM-DD}"
   - Example: "Downtown Monday 2026-01-13"
5. Enter expected meal count (based on field worker feedback/history)
6. Enter weekly items and counts (e.g., "25 weekend bags")
7. Add notes if needed (weather, special conditions)
8. Save → Run created with status "planned"

#### 2. Assign Team Members

1. Open run details
2. Click "Manage Team"
3. Search and add volunteers
4. First person added = team lead (automatic)
5. Can add 1-6 people typical (flexible)
6. Save → Volunteers notified (in-app + email/text notification)

**Volunteer Selection:**
- **Standing volunteers:** Committed to this route weekly (unless out of town)
- **SignUpGenius signups:** Manually add from external signup
- **Find stand-ins:** Message other leaders if standing volunteer unavailable

#### 3. Plan Meal Counts

**Inputs:**
- Field worker feedback: "We had 5 extra meals" or "Ran out at stop 6"
- Historical data: Meal counts per location (future capability)
- Current forecast based on experience

**Decision:** Set expected meal count when creating run

#### 4. View Upcoming/Past Runs

- Filter by status: planned, in_progress, completed
- Filter by route
- Filter by date range
- See: Run name, date, route, team lead, meal count, statu
### Current Pain Points

**Today:**
- Text groups for each run (new group each time, "pain in the ass")
- Manual tracking of volunteer availability (memory/notes)
- No visibility into completed run results
- Can't see meal trends or forecast accurately
- Manual coordination to find stand-ins

---

### Communication Needs

**Notifications:**
- Volunteers notified when scheduled (automated preferred)
- In-app notification + email/text option

**Coordination:**
- Need to message other leaders to find stand-ins
- Group communication with scheduled team (future enhancement)
- Not urgent/real-time - async messaging fine

---

### Volunteer Management

**Tracking Availability:**
- Today: Memory or informal notes
- Desired: Volunteers could mark "out of town Jan 15-20" in app
- Standing volunteers assumed available unless noted otherwise

**SignUpGenius:**
- External signup tool (not part of this app)
- Coordinator manually adds these volunteers to run
- Future: Integration possible, but not MVP

---

### Planning Data Needs

**Meal Planning:**
- Historical average per route
- Field worker feedback (notes from completed runs)
- Future: Meal count per location (forecast capability)

**Weekly Items:**
- Friday: Weekend bags (1:1 with meals typically)
- Mon/Wed: Hygiene, clothing, varies
- Sometimes special items (backpacks, blankets)
- Not locked into rigid schedule - flexible configuration

---

### Technical Requirements

**Must Have:**
- Create/edit runs (date, route, meals, weekly items)
- Assign team members (search, add, remove, reorder)
- Auto-generate run names
- Send notifications to team
- View upcoming and past runs
- Desktop/tablet optimized (not mobile-primary)

**Information Display:**
- List of runs (filtered, sorted)
- Run details (team, date, route, meal plan)
- Volunteer list (searchable, availability indicated)
- Completed run summaries

**Actions:**
- Create run
- Add/remove team members
- Edit run details (before start only)
- Cancel run
- View completed run dataved)

**Information Needed:**
- How many requests are pending fulfillment?
- Which runs need more volunteers?
- Are there requests stuck in limbo?
- Which friends haven't been seen recently?
- What's our monthly impact (meals, friends, requests)?

** Persona 3: Request Fulfillment Context

**Who:** User with permission to manage requests and pull items  
**Device:** Desktop, tablet, or mobile  
**Environment:** Warehouse or office  
**Frequency:** Ad hoc (whenever available to pull items)  
**Tech Comfort:** Low to Medium

---

### Primary Goal
Pull requested items from inventory, mark ready for delivery, manage request lifecycle
   - In app: Opens request, changes status to "ready for delivery"
   - Notes: "Blue sleeping bag, -20°F rating"

3. **Handle Issues**
   - Request: "Maria - Winter coat (women's 3XL)"
   - Checks inventory: No 3XL women's coats available
   - In app: Cannot mark "ready for delivery"
   - Instead: Messages coordinator: "No 3XL women's coat, suggest cancel?"
   - Coordinator cancels request with reason

4. **Stage for Loading**
   - All Downtown Route items placed in "Downtown bin"
   - All Westside Route items placed in "Westside bin"
   - Field workers know where to find items when loading

---

### Frustrations & Pain Points

**Today (with whiteboard):**
- "Can't read handwriting, don't know what item to pull"
- "Don't know if item was already delivered or still needed"
- "Pulled item but it sat for 2 weeks, friend never got it"
- "No space to note 'we don't have this' so request just sits"

**System Requirements to Avoid:**
- No clear list of what needs to be pulled
- Can't mark status (ready vs pending)
- No way to flag issues/blockers
- No visibility into whether item was delivered

---

### Key Needs Summary

**Must Have:**
- Clear list of pending requests
- Group by route for staging
- Mark status as "ready for delivery"
- Add notes about item pulled
- Flag requests that can't be fulfilled
- See which items were delivered (closed loop)

**Information Needed:**
- What items need to be pulled?
- For which route/location?
- Are there enough in inventory?
- Was this item delivered or returned?

**Actions Needed:**
- View pending requests
- MaCore Workflows

#### 1. View Pending Requests

**Scenario:** User arrives to pull itemsonsible for the system's configuration, user management, and ensuring data quality. She also volunteers in field work 1-2 times per month to stay connected with operations.

---

### Goals & Motivations

**Primary Goals:**
- Onboard new volunteers as users
- Configure routes as service areas expand/contract
- Ensure data quality (no duplicates, accurate locations)
- Manage permissions (who can do what)
- Provide leadership with impact reports

**Success Metrics:**
- All active volunteers have working accounts
- Routes accurately reflect current service areas
- NOpen request list
2. Filter by status: "pending"
3. See all unfulfilled requests
4. Group by route for easier staging (Downtown, Westside, etc.)

#### 2. Pull Items from Inventory

1. Select request (e.g., "Pete - Sleeping bag (warm) - Park & Lexington")
2. Go to physical inventory, find item
3. Check item quality/condition
4. Add physical label to item: "Pete - Park & Lexington - Downtown Route"
5. Stage item in route-specific area
Request Lifecycle Management

**Full Lifecycle (permissions allowing):**

1. **pending** → Item not yet pulled
2. **ready_for_delivery** → Item pulled and staged
3. **taken** → Field worker loaded item on vehicle
4. **delivered** → Friend received item
5. **cancelled** → Request unfulfillable or no longer needed

**This persona typically handles:**
- pending → ready_for_delivery (pull items)
- ready_for_delivery → cancelled (can't fulfill)
- pending → pending (add notes, attempt to find item)

**Other transitions:**
- ready_for_delivery → taken (field worker does this during prep)
- taken → delivered (field worker does this in field)
- any → cancelled (may require coordinator permission)

---

### Current Pain Points

**Today (whiteboard):**
- Illegible handwriting → don't know what to pull
- Don't know if item already pulled by someone else
- Don't know if item was delivered or sitting for weeks
- No way to note "we don't have this size"
- Items sit on whiteboard indefinitely
- No accountability

---

### Technical Requirements

**Must Have:**
- View pending requests list
- Filter/group by route
- Change request status (pending → ready_for_delivery)
- Add notes toSystem Configuration (Admin Context)

**Who:** User with elevated permissions for system configuration  
**Device:** Desktop  
**Environment:** Office  
**Frequency:** Varies (setup: frequent; maintenance: sporadic)  
**Tech Comfort:** High

---

### Scope

**Note:** Most data entry (friends, locations, requests) happens in **specialized context screens** (field execution, request fulfillment), NOT generic CRUD forms.

Admin context is for:
- User management (permissions, accounts)
- Route configuration (structure, not daily use)
- System settings
- Data quality maintenance (edge cases, cleanup)

---

### Key Activities

**User Management:**
- Create new user accounts
- Assign/adjust permissions
- Deactivate former users
- View user activity (audit logs, future)

**Route Configuration:**
- Create new routes (rare - service area changes)
- Add/remove/reorder locations on routes (occasional)
- Update addresses (as needed)

**Data Quality:**
- Merge duplicate friend records (edge case)
- Clean up orphaned/invalid data (occasional)
- Audit data integrity (periodic)

**Reporting:**
- Generate impact reports (future capability)
- Export data for funders/board (future)
- Analyze trends (future)

---

### Technical Requirements

**Must Have:**
- User CRUD operations
- Permission management interface
- Route/location CRUD operations
- Basic data quality tools

**Nice to Have (Future):**
- Merge duplicate records
- Audit logs
- Reporting dashboard
- Data export tools

---

## Summary: Context-Based Personas

| Persona Context | Primary Device | Who Uses It | Frequency |
|-----------------|----------------|-------------|-----------|
| Field Execution | Mobile | Anyone on a run | Per run (2-3x/week) |
| Run Planning | Desktop/Tablet | Schedulers | As needed (pre-run) |
| Request Fulfillment | Desktop/Tablet/Mobile | Item pullers | Ad hoc (whenever) |
| System Configuration | Desktop | Admins | Setup + maintenance |

---

### Key Design Principles

1. **Context-aware data entry:** Pre-fill known values (current location, current run, current user)
2. **Specialized workflows over generic CRUD:** Optimized screens for each context
3. **Permission-based access:** Users see contexts they have permissions for
4. **Mobile-first for field:** Offline, large targets, minimal typing
5. **Desktop-optimized for planning:** Full view, filters, bulk operations