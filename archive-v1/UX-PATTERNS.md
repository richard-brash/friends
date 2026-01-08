# UX Patterns - User Feedback & Confirmations

## Overview
This document defines consistent patterns for user feedback and confirmations across the Friends Outreach CRM application.

## 1. Confirmations (Destructive Actions)

### When to Use
- Deleting records (runs, routes, locations, friends, requests)
- Cancelling runs
- Removing team members
- Any action that cannot be easily undone

### Implementation
Use the **ConfirmDialog** component (`components/common/ConfirmDialog.jsx`)

```jsx
import ConfirmDialog from '../common/ConfirmDialog';

const [confirmOpen, setConfirmOpen] = useState(false);

<ConfirmDialog
  open={confirmOpen}
  title="Delete Run?"
  message="This action cannot be undone. Are you sure you want to delete this run?"
  confirmText="Delete"
  confirmColor="error"
  onConfirm={handleDelete}
  onCancel={() => setConfirmOpen(false)}
/>
```

### Props
- `open` (boolean) - Dialog visibility
- `title` (string) - Dialog title
- `message` (string) - Confirmation message
- `confirmText` (string) - Confirm button text (default: "Confirm")
- `cancelText` (string) - Cancel button text (default: "Cancel")
- `confirmColor` (string) - MUI color for confirm button ("error", "primary", "warning")
- `onConfirm` (function) - Called when user confirms
- `onCancel` (function) - Called when user cancels

### Best Practices
- Use clear, specific titles: "Delete Run?" not "Are you sure?"
- Explain consequences: "This action cannot be undone"
- Use appropriate button colors:
  - `error` - for deletions
  - `warning` - for potentially problematic actions
  - `primary` - for neutral confirmations
- Keep messages concise but informative

---

## 2. Success/Error Feedback

### When to Use
- After successful operations (create, update, delete)
- After failed operations
- To provide status updates
- To acknowledge user actions

### Implementation
Use **Snackbar** with **Alert** component

```jsx
import { Snackbar, Alert } from '@mui/material';

const [snackbar, setSnackbar] = useState({ 
  open: false, 
  message: '', 
  severity: 'success' 
});

// Show success
setSnackbar({ 
  open: true, 
  message: 'Run created successfully', 
  severity: 'success' 
});

// Show error
setSnackbar({ 
  open: true, 
  message: 'Failed to delete run', 
  severity: 'error' 
});

<Snackbar
  open={snackbar.open}
  autoHideDuration={4000}
  onClose={() => setSnackbar({ ...snackbar, open: false })}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert 
    onClose={() => setSnackbar({ ...snackbar, open: false })} 
    severity={snackbar.severity}
    sx={{ width: '100%' }}
  >
    {snackbar.message}
  </Alert>
</Snackbar>
```

### Severity Levels
- `success` (green) - Successful operations
- `error` (red) - Failed operations, errors
- `warning` (orange) - Warnings, potential issues
- `info` (blue) - Informational messages

### Best Practices
- Keep messages short and action-oriented
- Use past tense: "Run created" not "Creating run"
- Auto-dismiss after 4 seconds (adjustable)
- Position at bottom-center for consistency
- Include close button for manual dismissal

---

## 3. Inline Feedback

### When to Use
- Form validation errors
- Field-level feedback
- Real-time status updates

### Implementation
Use **TextField** `error` and `helperText` props

```jsx
<TextField
  label="Email"
  value={email}
  error={emailError}
  helperText={emailError ? "Invalid email format" : ""}
  onChange={handleEmailChange}
/>
```

---

## 4. Loading States

### When to Use
- During data fetching
- During async operations
- While waiting for server responses

### Implementation

**Full Page Loading:**
```jsx
if (loading) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography>Loading...</Typography>
      <LinearProgress sx={{ mt: 2 }} />
    </Box>
  );
}
```

**Button Loading:**
```jsx
<Button 
  variant="contained" 
  disabled={loading}
  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
>
  {loading ? 'Saving...' : 'Save'}
</Button>
```

---

## 5. Empty States

### When to Use
- No data to display
- Empty lists/tables
- After filters return no results

### Implementation
```jsx
{items.length === 0 && (
  <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
    <Typography variant="h6" color="text.secondary" gutterBottom>
      No runs scheduled
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Schedule your first outreach run to get started
    </Typography>
    <Button variant="contained" startIcon={<Add />} onClick={onCreate}>
      Schedule New Run
    </Button>
  </Box>
)}
```

---

## 6. Migration Checklist

### Components to Update
- [ ] RunsList - ✅ DONE
- [ ] RunOverview - Use ConfirmDialog for team member removal
- [ ] LocationsList - Use ConfirmDialog for location removal
- [ ] RouteSection - Use ConfirmDialog for route/location deletion
- [ ] RequestsSection - Use Snackbar for feedback
- [ ] FriendSection - Use ConfirmDialog for deletions
- [ ] CreateRunForm - Use Snackbar for success/error

### Pattern Checklist
- [ ] Replace all `window.confirm()` calls with ConfirmDialog
- [ ] Replace all inline "Are you sure?" UI with ConfirmDialog
- [ ] Add Snackbar to all forms for success/error feedback
- [ ] Standardize loading states
- [ ] Improve empty states with helpful CTAs

---

## 7. Examples in Codebase

**ConfirmDialog Usage:**
- `frontend/src/components/runs/RunsList.jsx` - Delete run confirmation

**Snackbar Usage:**
- `frontend/src/components/runs/RunsList.jsx` - Delete success/error feedback
- `frontend/src/components/OutreachDashboard.jsx` - Route management feedback

---

## Future Enhancements

1. **Global Snackbar Context**
   - Create SnackbarContext for app-wide toast notifications
   - Avoid prop drilling snackbar handlers

2. **Undo Actions**
   - Add undo capability to Snackbar for reversible actions
   - "Run deleted. UNDO"

3. **Progress Indicators**
   - Show upload progress for file operations
   - Multi-step form progress indicators

4. **Optimistic Updates**
   - Update UI immediately, rollback on error
   - Better perceived performance
