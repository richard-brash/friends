# Frontend Runs Integration - Implementation Guide

## Overview
Update the frontend to work with the new Runs V2 API that implements auto-generated names, meal count tracking, and timestamp-based team lead identification.

## Backend V2 API Summary

### Key Changes
1. **Auto-Generated Run Names**: Format `"{route_name} {day_of_week} {YYYY-MM-DD}"` (e.g., "AACo Friday 2025-10-24")
2. **No Role Field**: Removed `role` from `run_team_members` table
3. **Team Lead Logic**: First team member added (lowest `created_at`) = run lead
4. **Meal Count**: Added `meal_count` INTEGER field to runs table
5. **V2 API Endpoints**: All endpoints return `{ success: true, data: {...} }` format

### V2 API Endpoints (All Tested ✅)

**POST /api/v2/runs** - Create run
- Body: `{ routeId, scheduledDate, startTime?, endTime?, mealCount?, notes? }`
- Returns: Run with auto-generated name
- Name field is ignored if provided

**GET /api/v2/runs** - List all runs
- Returns: Array of runs with `mealCount` field

**GET /api/v2/runs/:id?includeTeam=true** - Get run details
- Query param: `includeTeam=true` to include team members
- Returns: Run with optional `team` array (ordered by `created_at` ASC)

**PUT /api/v2/runs/:id** - Update run
- Body: `{ mealCount?, status?, notes?, ...  }`
- Name field is ignored (read-only)

**DELETE /api/v2/runs/:id** - Delete run

**GET /api/v2/runs/:id/team-members** - Get team members
- Returns: Array ordered by `created_at` ASC (first = lead)
- Each member: `{ id, runId, userId, userName, userEmail, userPhone, createdAt }`

**POST /api/v2/runs/:id/team-members** - Add team member
- Body: `{ userId }` (NO role parameter)
- Returns: Team member with user details

**DELETE /api/v2/runs/:id/team-members/:userId** - Remove team member

## Frontend Components to Update

### 1. CreateRunForm.jsx ✅ (Partially Complete)

**Changes Made:**
- Removed `leadId` field (no longer needed)
- Removed `mealsCount` → renamed to `mealCount`
- Removed `coordinatorNotes` → renamed to `notes`
- Added `startTime` and `endTime` fields
- Updated to use V2 API endpoint
- Added info alert about auto-generated name

**Still Need:**
- Test form submission
- Verify auto-generated name appears after creation

### 2. ManageTeamDialog.jsx ❌ (Needs Complete Rewrite)

**Current Issues:**
- Uses old API `/api/runs/:id` instead of V2
- Expects `runId` prop but RunOverview passes `run` object
- Uses checkbox selection pattern instead of add/remove buttons
- Tries to manage `assignedUserIds` array (doesn't exist in V2)
- Has lead selection logic based on `leadId` (doesn't exist in V2)

**Required Changes:**
```jsx
// OLD signature
export default function ManageTeamDialog({ open, onClose, runId, onTeamUpdated })

// NEW signature
export default function ManageTeamDialog({ open, onClose, run, onTeamUpdated })
```

**New Implementation Pattern:**
1. Fetch current team via `GET /api/v2/runs/${run.id}/team-members`
2. Display team members with lead indicator on first member
3. Show available users (not already on team)
4. Add member: `POST /api/v2/runs/${run.id}/team-members` with `{ userId }`
5. Remove member: `DELETE /api/v2/runs/${run.id}/team-members/${userId}`
6. No role selection - lead is automatic (first member)

**UI Pattern:**
- **Current Team section** - List with delete buttons, first member has "Lead" chip
- **Add Members section** - List of available users with add buttons
- Remove "Save" button - changes are immediate via API calls

### 3. RunOverview.jsx ❌ (Needs Updates)

**Current Issues:**
- Displays run name as route name, doesn't show auto-generated run name
- No meal count display
- Uses old `mealsCount` field name
- Team display logic expects `leadId`, `coordinatorId`, `assignedUserIds`
- Doesn't show lead indicator properly

**Required Changes:**

**Display Auto-Generated Name:**
```jsx
// OLD
<Typography variant="h4">{route?.name || 'Run Overview'}</Typography>

// NEW
<Typography variant="h4">{run?.name || 'Run Overview'}</Typography>
<Typography variant="body2" color="text.secondary">
  Route: {route?.name}
</Typography>
```

**Display Meal Count:**
```jsx
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <RestaurantMenu color="primary" />
  <Typography>
    <strong>{run.mealCount || 0}</strong> meals prepared
  </Typography>
</Box>
```

**Update Meal Count:**
```jsx
const handleMealCountUpdate = async (newCount) => {
  await axios.put(`${API_BASE}/v2/runs/${runId}`, {
    mealCount: parseInt(newCount)
  });
  await fetchRunDetails();
};
```

**Team Display Logic:**
```jsx
// OLD - uses team structure from V2 API included via ?includeTeam=true
const teamMembers = run?.team || [];
const lead = teamMembers[0]; // First member is lead

// Display
<ListItem>
  <Avatar><Flag /></Avatar>
  <ListItemText
    primary={lead?.userName || 'No Lead Assigned'}
    secondary="Run Lead (First Team Member)"
  />
</ListItem>

{teamMembers.map((member, index) => {
  const isLead = index === 0;
  return (
    <ListItem key={member.id}>
      <Avatar>{member.userName?.[0] || '?'}</Avatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {member.userName}
            {isLead && <Chip label="Lead" size="small" color="primary" />}
          </Box>
        }
        secondary={member.userEmail}
      />
    </ListItem>
  );
})}
```

**ManageTeamDialog Call:**
```jsx
// OLD
<ManageTeamDialog
  open={showManageTeam}
  onClose={() => setShowManageTeam(false)}
  runId={runId}  // ❌ Wrong prop
  onTeamUpdated={fetchRunDetails}
/>

// NEW
<ManageTeamDialog
  open={showManageTeam}
  onClose={() => setShowManageTeam(false)}
  run={run}  // ✅ Pass run object
  onTeamUpdated={fetchRunDetails}
/>
```

### 4. RunsList.jsx ❌ (Needs Updates)

**Current Issues:**
- Doesn't display auto-generated run names
- Doesn't show meal count in cards/list
- May use old field names

**Required Changes:**

**Display Run Name:**
```jsx
// Show the auto-generated name, not just route name
<Typography variant="h6">{run.name}</Typography>
<Typography variant="body2" color="text.secondary">
  Route: {route?.name}
</Typography>
```

**Display Meal Count:**
```jsx
<Chip
  icon={<RestaurantMenu />}
  label={`${run.mealCount || 0} meals`}
  size="small"
/>
```

## Testing Checklist

### 1. Create Run Flow
- [ ] Open Create Run form
- [ ] Fill in: Route, Date, Times, Meal Count (50), Notes
- [ ] Submit form
- [ ] Verify run is created with auto-generated name: "AACo Saturday 2025-10-25"
- [ ] Verify name is NOT editable

### 2. Team Management Flow
- [ ] Open run details
- [ ] Click "Manage Team"
- [ ] Add first member (John)
- [ ] Verify John shows as "Lead"
- [ ] Add second member (Sarah)
- [ ] Verify Sarah shows as regular member
- [ ] Remove Sarah
- [ ] Verify she's removed
- [ ] Add Sarah again
- [ ] Verify John is still lead (based on created_at timestamp)

### 3. Run Details Display
- [ ] Verify auto-generated name displays at top
- [ ] Verify meal count displays correctly
- [ ] Verify team list shows lead indicator on first member
- [ ] Update meal count to 60
- [ ] Verify update works and name stays the same

### 4. Runs List Display
- [ ] Verify all runs show auto-generated names
- [ ] Verify meal counts display in cards/list
- [ ] Verify runs sorted correctly

## Implementation Order

1. ✅ CreateRunForm - Basic structure updated
2. ⏳ ManageTeamDialog - Complete rewrite needed
3. ⏳ RunOverview - Update display logic and API calls
4. ⏳ RunsList - Update display fields
5. ⏳ End-to-end testing

## Sample Code: Complete ManageTeamDialog.jsx

See the new implementation in `/frontend-runs-integration/ManageTeamDialog.jsx` (to be created).

Key differences:
- Props: `{ run }` instead of `{ runId }`
- No checkbox selection - use Add/Delete buttons
- Immediate API calls (no Save button)
- Lead indicator on first team member
- Info alert explaining lead logic

## Notes

- All backend API endpoints are tested and working ✅
- Backend returns proper V2 response format
- Team members are properly ordered by `created_at` ASC
- Run names are truly auto-generated and read-only
- Meal count validation (≥ 0) is working
- Integration tests all passing (31/31)

## Next Steps

1. Finish updating ManageTeamDialog
2. Update RunOverview display logic
3. Update RunsList display
4. Test complete workflow
5. Fix any bugs found
6. Mark Phase 9 complete!
