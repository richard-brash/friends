# Component Library - Friends Outreach CRM V2

**Last Updated:** January 9, 2026  
**Status:** Phase 2 - Architecture Design

---

## Design Principles

1. **Mobile-First** - Design for smallest screen, enhance for larger
2. **Reusable Components** - One component, many contexts
3. **Accessible** - WCAG 2.1 AA compliance minimum
4. **Consistent** - Predictable patterns across app
5. **Touch-Friendly** - 44px minimum touch targets

---

## Design System

### Color Palette

**Primary Colors:**
```
primary-main: #1976d2 (Material-UI blue)
primary-light: #42a5f5
primary-dark: #1565c0
```

**Status Colors:**
```
success: #4caf50 (green)
warning: #ff9800 (orange)
error: #f44336 (red)
info: #2196f3 (blue)
```

**Status-Specific:**
```
status-pending: #ff9800 (orange)
status-ready: #2196f3 (blue)
status-taken: #9c27b0 (purple)
status-delivered: #4caf50 (green)
status-cancelled: #757575 (grey)
```

**Neutral Colors:**
```
background: #fafafa
surface: #ffffff
text-primary: rgba(0, 0, 0, 0.87)
text-secondary: rgba(0, 0, 0, 0.6)
text-disabled: rgba(0, 0, 0, 0.38)
divider: rgba(0, 0, 0, 0.12)
```

---

### Typography

**Font Family:**
- Primary: "Roboto", sans-serif
- Monospace: "Roboto Mono", monospace

**Type Scale:**
```
h1: 32px / 400 / 1.2 (Page titles)
h2: 24px / 400 / 1.3 (Section headers)
h3: 20px / 500 / 1.4 (Card titles)
h4: 18px / 500 / 1.5 (Subsections)
body1: 16px / 400 / 1.5 (Primary text)
body2: 14px / 400 / 1.43 (Secondary text)
caption: 12px / 400 / 1.33 (Helper text)
button: 14px / 500 / 1.75 / uppercase
```

---

### Spacing Scale

**Base Unit:** 8px

```
spacing-0: 0
spacing-1: 4px
spacing-2: 8px
spacing-3: 12px
spacing-4: 16px
spacing-5: 20px
spacing-6: 24px
spacing-8: 32px
spacing-10: 40px
spacing-12: 48px
```

**Usage:**
- Padding within components: 16px (spacing-4)
- Margin between components: 16px (spacing-4)
- Section spacing: 24px (spacing-6)
- Page margins: 16px mobile, 24px desktop

---

### Breakpoints

```
xs: 0px (mobile)
sm: 600px (tablet)
md: 960px (desktop)
lg: 1280px (large desktop)
xl: 1920px (extra large)
```

**Container Max Width:**
- xs-sm: 100% (full width)
- md: 960px
- lg: 1280px
- xl: 1440px

---

### Elevation (Shadows)

```
elevation-0: none (flat)
elevation-1: 0 1px 3px rgba(0,0,0,0.12) (cards)
elevation-2: 0 2px 6px rgba(0,0,0,0.16) (raised cards)
elevation-3: 0 4px 12px rgba(0,0,0,0.16) (dialogs)
elevation-4: 0 8px 24px rgba(0,0,0,0.16) (drawers)
```

---

## Core Components

### 1. AppBar

**Purpose:** Top navigation bar with title and actions

**Variants:**
- Desktop: Tabs for navigation
- Mobile: Simple bar (navigation in bottom nav)

**Props:**
```typescript
interface AppBarProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  actions?: ReactNode; // Icon buttons for actions
  tabs?: Array<{label: string, value: string}>; // Desktop only
  activeTab?: string;
  onTabChange?: (value: string) => void;
}
```

**Mobile Example:**
```jsx
<AppBar 
  title="Active Run" 
  showBackButton 
  onBackClick={handleBack}
/>
```

**Desktop Example:**
```jsx
<AppBar 
  title="Friends Outreach"
  tabs={[
    {label: "Runs", value: "runs"},
    {label: "Requests", value: "requests"},
    {label: "Friends", value: "friends"}
  ]}
  activeTab="runs"
  onTabChange={handleTabChange}
/>
```

---

### 2. BottomNavigation

**Purpose:** Primary navigation for mobile devices

**Props:**
```typescript
interface BottomNavigationProps {
  value: string; // Current active route
  onChange: (value: string) => void;
  items: Array<{
    label: string;
    value: string;
    icon: ReactNode;
    badge?: number; // Notification count
  }>;
}
```

**Example:**
```jsx
<BottomNavigation
  value="runs"
  onChange={handleNavigate}
  items={[
    {label: "Runs", value: "runs", icon: <DirectionsRunIcon />},
    {label: "Requests", value: "requests", icon: <InboxIcon />, badge: 5},
    {label: "Friends", value: "friends", icon: <PeopleIcon />},
    {label: "More", value: "more", icon: <MoreHorizIcon />}
  ]}
/>
```

**Behavior:**
- Fixed to bottom of viewport
- Height: 56px
- Active item highlighted with primary color
- Labels hidden on xs screens (icons only)

---

### 3. StatusBadge

**Purpose:** Display status with color coding

**Props:**
```typescript
interface StatusBadgeProps {
  status: 'pending' | 'ready_for_delivery' | 'taken' | 'delivered' | 'cancelled' |
          'planned' | 'prepared' | 'in_progress' | 'completed' |
          'active' | 'inactive';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}
```

**Example:**
```jsx
<StatusBadge status="ready_for_delivery" size="small" />
// Renders: [BLUE CHIP] Ready for Delivery

<StatusBadge status="delivered" size="medium" showIcon />
// Renders: [GREEN CHIP WITH CHECKMARK ICON] Delivered
```

**Color Mapping:**
- pending → orange
- ready_for_delivery → blue
- taken → purple
- delivered → green
- cancelled → grey
- planned → blue
- in_progress → purple
- completed → green

---

### 4. CounterControl

**Purpose:** Increment/decrement numeric values (meals, items)

**Props:**
```typescript
interface CounterControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number; // Default: 0
  max?: number;
  step?: number; // Default: 1
  label?: string;
  disabled?: boolean;
}
```

**Example:**
```jsx
<CounterControl
  value={mealCount}
  onChange={setMealCount}
  min={0}
  label="Meals Delivered"
/>
```

**Design:**
- Large +/- buttons (44px × 44px minimum)
- Value displayed between buttons
- Disabled state for min/max boundaries
- Touch-friendly spacing

**Layout:**
```
[−]  5 Meals  [+]
```

---

### 5. EntityCard

**Purpose:** Display entity summary in lists

**Variants:**
- FriendCard
- RequestCard
- LocationCard
- RunCard

**Base Props:**
```typescript
interface EntityCardProps {
  onClick?: () => void;
  selected?: boolean;
  actions?: ReactNode; // Action buttons
  elevation?: 0 | 1 | 2; // Default: 1
}
```

#### FriendCard

**Props:**
```typescript
interface FriendCardProps extends EntityCardProps {
  friend: {
    id: number;
    firstName?: string;
    lastName?: string;
    alias?: string;
    status: string;
    lastSeenAt?: {
      locationName: string;
      spottedAt: string;
    };
  };
}
```

**Example:**
```jsx
<FriendCard
  friend={{
    id: 1,
    firstName: "John",
    lastName: "Smith",
    alias: "Johnny",
    status: "active",
    lastSeenAt: {
      locationName: "Park & Lexington",
      spottedAt: "2026-01-08T14:00:00Z"
    }
  }}
  onClick={() => navigate(`/friends/1`)}
/>
```

**Layout:**
```
┌───────────────────────────┐
│ John Smith (Johnny)       │
│ Status: [ACTIVE BADGE]    │
│ Last seen: Park & Lex...  │
│ Jan 8, 2:00 PM            │
└───────────────────────────┘
```

#### RequestCard

**Props:**
```typescript
interface RequestCardProps extends EntityCardProps {
  request: {
    id: number;
    friendName: string;
    locationName: string;
    itemDescription: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: string;
    createdAt: string;
  };
}
```

**Layout:**
```
┌───────────────────────────┐
│ Winter coat size L        │
│ For: Maria Garcia         │
│ Location: Park & Lexington│
│ [HIGH PRIORITY] [READY]   │
└───────────────────────────┘
```

#### RunCard

**Props:**
```typescript
interface RunCardProps extends EntityCardProps {
  run: {
    id: number;
    name: string;
    routeName: string;
    scheduledDate: string;
    status: string;
    teamSize: number;
    mealCount?: number;
  };
}
```

**Layout:**
```
┌───────────────────────────┐
│ Downtown Monday 2026-01-13│
│ Route: Downtown           │
│ Team: 3 members           │
│ Meals: 25                 │
│ [IN PROGRESS]             │
└───────────────────────────┘
```

---

### 6. EntitySelector

**Purpose:** Search and select entity (friend, location, user)

**Variants:**
- FriendSelector
- LocationSelector
- UserSelector

**Base Props:**
```typescript
interface EntitySelectorProps<T> {
  value: T | null;
  onChange: (value: T | null) => void;
  options: T[];
  getOptionLabel: (option: T) => string;
  loading?: boolean;
  error?: string;
  placeholder?: string;
  required?: boolean;
  allowCreate?: boolean; // Quick add new entity
  onCreateNew?: () => void;
}
```

**Example - FriendSelector:**
```jsx
<FriendSelector
  value={selectedFriend}
  onChange={setSelectedFriend}
  options={friends}
  getOptionLabel={(f) => `${f.firstName} ${f.lastName} (${f.alias})`}
  placeholder="Search friends..."
  allowCreate
  onCreateNew={() => setShowCreateDialog(true)}
/>
```

**Features:**
- Autocomplete with search
- Keyboard navigation
- "Create New" option if allowCreate=true
- Mobile-friendly dropdown

---

### 7. FormField

**Purpose:** Consistent form input wrapper with label and error

**Props:**
```typescript
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: ReactNode; // Input component
  fullWidth?: boolean; // Default: true
}
```

**Example:**
```jsx
<FormField 
  label="Email" 
  required 
  error={errors.email}
  helperText="Use email or phone"
>
  <TextField
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    type="email"
  />
</FormField>
```

**Layout:**
```
Label *
┌─────────────────┐
│ Input here      │
└─────────────────┘
Helper text or error
```

---

### 8. LoadingState

**Purpose:** Display loading indicators

**Variants:**
- Spinner (circular progress)
- Skeleton (placeholder)
- LinearProgress (top of page)

**Props:**
```typescript
interface LoadingStateProps {
  variant: 'spinner' | 'skeleton' | 'linear';
  text?: string; // Message shown with spinner
  count?: number; // Number of skeleton items
}
```

**Example - Spinner:**
```jsx
<LoadingState variant="spinner" text="Loading run details..." />
```

**Example - Skeleton:**
```jsx
<LoadingState variant="skeleton" count={3} />
// Renders 3 skeleton cards
```

---

### 9. EmptyState

**Purpose:** Display when no data available

**Props:**
```typescript
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Example:**
```jsx
<EmptyState
  icon={<InboxIcon />}
  title="No requests"
  message="All requests have been delivered"
  action={{
    label: "Create Request",
    onClick: () => navigate('/requests/new')
  }}
/>
```

---

### 10. ConfirmDialog

**Purpose:** Confirm destructive or important actions

**Props:**
```typescript
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string; // Default: "Confirm"
  cancelLabel?: string; // Default: "Cancel"
  onConfirm: () => void;
  severity?: 'info' | 'warning' | 'error'; // Default: 'warning'
}
```

**Example:**
```jsx
<ConfirmDialog
  open={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Start Run?"
  message="This will begin the run and move you to the first stop. Continue?"
  confirmLabel="Start Run"
  onConfirm={handleStartRun}
  severity="info"
/>
```

---

### 11. ActionButton

**Purpose:** Primary action buttons with consistent styling

**Props:**
```typescript
interface ActionButtonProps {
  variant: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'error';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick: () => void;
  children: ReactNode;
}
```

**Example:**
```jsx
<ActionButton
  variant="contained"
  color="primary"
  size="large"
  fullWidth
  startIcon={<PlayArrowIcon />}
  onClick={handleStart}
  loading={isStarting}
>
  Start Run
</ActionButton>
```

**Touch Target:**
- Minimum height: 44px
- Horizontal padding: 16px
- Full width on mobile for primary actions

---

### 12. NavigationButtons

**Purpose:** Previous/Next navigation for field execution

**Props:**
```typescript
interface NavigationButtonsProps {
  onPrevious?: () => void; // Undefined = disabled
  onNext?: () => void; // Undefined = disabled
  currentStep: number;
  totalSteps: number;
  loading?: boolean;
}
```

**Example:**
```jsx
<NavigationButtons
  onPrevious={handlePrevious}
  onNext={handleNext}
  currentStep={3}
  totalSteps={8}
  loading={isAdvancing}
/>
```

**Layout:**
```
┌──────────┐  Stop 3 of 8  ┌──────────┐
│ Previous │               │   Next   │
└──────────┘               └──────────┘
```

---

### 13. ChecklistItem

**Purpose:** Interactive checklist with check/uncheck

**Props:**
```typescript
interface ChecklistItemProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}
```

**Example:**
```jsx
<ChecklistItem
  checked={itemLoaded}
  onChange={setItemLoaded}
  label="Winter coat size L"
  sublabel="For: Maria Garcia"
/>
```

**Layout:**
```
☑ Winter coat size L
  For: Maria Garcia
```

---

### 14. SummaryCard

**Purpose:** Display summary statistics

**Props:**
```typescript
interface SummaryCardProps {
  title: string;
  items: Array<{
    label: string;
    value: string | number;
    icon?: ReactNode;
  }>;
}
```

**Example:**
```jsx
<SummaryCard
  title="Run Summary"
  items={[
    {label: "Stops Completed", value: 8, icon: <LocationOnIcon />},
    {label: "Meals Delivered", value: 22, icon: <RestaurantIcon />},
    {label: "Friends Served", value: 18, icon: <PeopleIcon />}
  ]}
/>
```

---

### 15. Timeline

**Purpose:** Display chronological history (request status, friend location)

**Props:**
```typescript
interface TimelineProps {
  items: Array<{
    id: number;
    timestamp: string;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    color?: string;
  }>;
}
```

**Example - Request History:**
```jsx
<Timeline
  items={[
    {
      id: 1,
      timestamp: "2026-01-05T10:00:00Z",
      title: "Request created",
      subtitle: "By: Sarah Johnson",
      icon: <AddIcon />,
      color: "orange"
    },
    {
      id: 2,
      timestamp: "2026-01-07T14:00:00Z",
      title: "Item pulled",
      subtitle: "By: Linda Martinez",
      icon: <CheckCircleIcon />,
      color: "blue"
    }
  ]}
/>
```

**Layout:**
```
○ Request created           Jan 5, 10:00 AM
│ By: Sarah Johnson
│
○ Item pulled               Jan 7, 2:00 PM
│ By: Linda Martinez
│
● Delivered                 Jan 8, 2:05 PM
  By: Sarah Johnson
```

---

## Composite Components

### RunPreparationScreen

**Purpose:** Full screen for run preparation checklist

**Composition:**
- AppBar (title: "Prepare Run")
- SummaryCard (meal count, weekly items)
- ChecklistItem (for each special request)
- ActionButton (Start Run)

**Props:**
```typescript
interface RunPreparationScreenProps {
  run: {
    id: number;
    name: string;
    mealCount: number;
  };
  weeklyItems: Array<{type: string, count: number}>;
  specialRequests: Array<Request>;
  onCheckRequest: (requestId: number, checked: boolean) => void;
  onStartRun: () => void;
  loading?: boolean;
}
```

---

### ActiveRunScreen

**Purpose:** Full screen for active run execution

**Composition:**
- AppBar (title: run name, back button)
- CounterControl (meals delivered)
- CounterControl (weekly items)
- List of expected friends with spot buttons
- List of special requests with deliver buttons
- NavigationButtons (Previous/Next)

**Props:**
```typescript
interface ActiveRunScreenProps {
  run: Run;
  currentStop: Location;
  mealsDelivered: number;
  onMealsChange: (count: number) => void;
  expectedFriends: Array<Friend>;
  onSpotFriend: (friendId: number) => void;
  specialRequests: Array<Request>;
  onDeliverRequest: (requestId: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
}
```

---

### RequestDetailSheet

**Purpose:** Bottom sheet with request details and actions

**Composition:**
- Timeline (status history)
- ActionButton (status transition buttons)

**Props:**
```typescript
interface RequestDetailSheetProps {
  open: boolean;
  onClose: () => void;
  request: Request;
  onStatusChange: (status: string) => void;
}
```

---

## Layout Patterns

### 1. List + Detail (Master-Detail)

**Desktop:** Split view (list left, detail right)  
**Mobile:** Stack (list → detail on separate screen)

**Example - Runs:**
```
Desktop:                    Mobile:
┌─────────┬────────────┐   Screen 1:    Screen 2:
│ Run     │ Run Detail │   ┌────────┐   ┌────────┐
│ List    │            │   │ Run    │   │ Run    │
│         │            │   │ List   │→  │ Detail │
│         │            │   │        │   │        │
└─────────┴────────────┘   └────────┘   └────────┘
```

---

### 2. Form Dialog

**Desktop:** Modal dialog (centered)  
**Mobile:** Full screen

**Example - Create Request:**
```
Desktop:                    Mobile:
┌──────────────────────┐   ┌────────────┐
│ ╔════════════════╗   │   │ [← Back]   │
│ ║ Create Request ║   │   │ Title      │
│ ║ [Form Fields]  ║   │   │ [Form]     │
│ ║ [Cancel][Save] ║   │   │            │
│ ╚════════════════╝   │   │ [Save]     │
└──────────────────────┘   └────────────┘
```

---

### 3. Bottom Sheet (Mobile Only)

**Purpose:** Quick actions without leaving context

**Example - Friend Actions:**
```
┌──────────────┐
│ Active Run   │
│ [Stop 3/8]   │
│              │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← Sheet pulls up
│ John Smith   │
│ [Spot]       │
│ [New Request]│
└──────────────┘
```

---

## Responsive Behavior

### Breakpoint Strategy

**Mobile (xs-sm):**
- Bottom navigation
- Full-width cards
- Stack layout
- Single column forms
- Full-screen dialogs

**Desktop (md+):**
- Tab navigation in AppBar
- Grid layout (2-3 columns)
- Multi-column forms
- Modal dialogs
- Split views

### Example - Runs List

**Mobile:**
```jsx
<Stack spacing={2}>
  {runs.map(run => (
    <RunCard key={run.id} run={run} />
  ))}
</Stack>
```

**Desktop:**
```jsx
<Grid container spacing={3}>
  {runs.map(run => (
    <Grid item xs={12} md={6} lg={4} key={run.id}>
      <RunCard run={run} />
    </Grid>
  ))}
</Grid>
```

---

## Accessibility

### Requirements

1. **Keyboard Navigation**
   - Tab order logical
   - Focus indicators visible
   - Skip links for main content

2. **Screen Readers**
   - Semantic HTML (nav, main, article)
   - ARIA labels for icons
   - Status announcements

3. **Color Contrast**
   - Minimum 4.5:1 for body text
   - Minimum 3:1 for large text
   - Don't rely on color alone

4. **Touch Targets**
   - Minimum 44×44px
   - Spacing between targets ≥8px

5. **Forms**
   - Labels associated with inputs
   - Error messages linked (aria-describedby)
   - Required fields marked

---

## Animation & Transitions

**Durations:**
```
fast: 150ms (hover effects)
normal: 250ms (transitions)
slow: 350ms (page transitions)
```

**Easing:**
```
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1) (default)
ease-out: cubic-bezier(0, 0, 0.2, 1) (enter)
ease-in: cubic-bezier(0.4, 0, 1, 1) (exit)
```

**Examples:**
- Button hover: background-color 150ms ease-in-out
- Dialog open: opacity 250ms, transform 250ms ease-out
- Page transition: fade 250ms ease-in-out

---

## Component Composition Examples

### Example 1: Request List Screen

```jsx
<Box>
  <AppBar title="Requests" />
  
  <Stack spacing={2} sx={{p: 2}}>
    <FormField label="Filter by status">
      <Select value={filter} onChange={setFilter}>
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="pending">Pending</MenuItem>
        <MenuItem value="ready">Ready</MenuItem>
      </Select>
    </FormField>
    
    {loading ? (
      <LoadingState variant="skeleton" count={5} />
    ) : requests.length === 0 ? (
      <EmptyState
        icon={<InboxIcon />}
        title="No requests"
        message="No requests match your filter"
      />
    ) : (
      requests.map(request => (
        <RequestCard 
          key={request.id} 
          request={request}
          onClick={() => setSelectedRequest(request)}
        />
      ))
    )}
  </Stack>
  
  <BottomNavigation value="requests" onChange={navigate} />
</Box>
```

---

### Example 2: Active Run Screen (Field Execution)

```jsx
<Box>
  <AppBar 
    title={run.name} 
    showBackButton 
    onBackClick={handleExit}
  />
  
  <Container sx={{py: 3}}>
    <Typography variant="h6" gutterBottom>
      Stop {currentStop.routeOrder} of {totalStops}: {currentStop.name}
    </Typography>
    
    <CounterControl
      value={mealsDelivered}
      onChange={setMealsDelivered}
      label="Meals Delivered"
    />
    
    <Divider sx={{my: 3}} />
    
    <Typography variant="h6" gutterBottom>
      Expected Friends
    </Typography>
    <Stack spacing={1}>
      {expectedFriends.map(friend => (
        <FriendCard
          key={friend.id}
          friend={friend}
          actions={
            <ActionButton
              variant="outlined"
              size="small"
              onClick={() => handleSpot(friend.id)}
            >
              Spot
            </ActionButton>
          }
        />
      ))}
    </Stack>
    
    <Divider sx={{my: 3}} />
    
    <Typography variant="h6" gutterBottom>
      Special Requests
    </Typography>
    <Stack spacing={1}>
      {specialRequests.map(request => (
        <RequestCard
          key={request.id}
          request={request}
          actions={
            <ActionButton
              variant="contained"
              color="success"
              size="small"
              onClick={() => handleDeliver(request.id)}
            >
              Delivered
            </ActionButton>
          }
        />
      ))}
    </Stack>
  </Container>
  
  <Box sx={{position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, bgcolor: 'background.paper'}}>
    <NavigationButtons
      onPrevious={canGoPrevious ? handlePrevious : undefined}
      onNext={canGoNext ? handleNext : undefined}
      currentStep={currentStop.routeOrder}
      totalSteps={totalStops}
    />
  </Box>
</Box>
```

---

## Implementation Guidelines

### Component File Structure

```
src/
  components/
    shared/
      AppBar/
        AppBar.tsx
        AppBar.test.tsx
        AppBar.stories.tsx
        index.ts
      StatusBadge/
        StatusBadge.tsx
        StatusBadge.test.tsx
        index.ts
    composite/
      RunPreparationScreen/
        RunPreparationScreen.tsx
        RunPreparationScreen.test.tsx
        index.ts
    forms/
      CreateRequestForm/
        CreateRequestForm.tsx
        CreateRequestForm.test.tsx
        index.ts
```

---

### Naming Conventions

**Components:**
- PascalCase: `StatusBadge`, `FriendCard`
- Descriptive: `ActiveRunScreen` not `RunScreen2`
- Suffix with type: `FriendCard`, `RequestDialog`

**Props:**
- camelCase: `onStatusChange`, `selectedFriend`
- Boolean prefix: `isLoading`, `hasError`, `showIcon`
- Handler prefix: `handleClick`, `onSubmit`

---

### Testing Strategy

**Unit Tests:**
- Render without crashing
- Props passed correctly
- Event handlers called
- Conditional rendering

**Example:**
```typescript
describe('StatusBadge', () => {
  it('renders pending status correctly', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
  
  it('applies correct color for status', () => {
    const {container} = render(<StatusBadge status="delivered" />);
    expect(container.firstChild).toHaveClass('status-delivered');
  });
});
```

---

### Performance Optimization

1. **Memoization**
   - Use `React.memo` for expensive components
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for event handlers passed to children

2. **Code Splitting**
   - Lazy load screens: `const RunScreen = lazy(() => import('./RunScreen'))`
   - Lazy load dialogs and modals

3. **Virtualization**
   - Use react-window for long lists (>100 items)
   - Friends list, requests list

4. **Image Optimization**
   - Lazy load images below fold
   - Use responsive images (srcset)
   - Compress and optimize

---

## Next Steps

1. ✅ Component library design complete
2. ⏳ Create Storybook for component showcase
3. ⏳ Build design system tokens (CSS variables)
4. ⏳ Implement shared components
5. ⏳ Create component documentation site

---

## Appendix: Material-UI Component Mapping

**Material-UI Components Used:**

| Our Component | Material-UI Base |
|---------------|------------------|
| AppBar | AppBar, Toolbar, Tabs |
| BottomNavigation | BottomNavigation, BottomNavigationAction |
| StatusBadge | Chip |
| CounterControl | IconButton, Typography |
| EntityCard | Card, CardContent, CardActions |
| EntitySelector | Autocomplete, TextField |
| FormField | FormControl, FormLabel, FormHelperText |
| LoadingState | CircularProgress, Skeleton, LinearProgress |
| EmptyState | Box, Typography, Button |
| ConfirmDialog | Dialog, DialogTitle, DialogContent, DialogActions |
| ActionButton | Button |
| ChecklistItem | Checkbox, ListItem, ListItemText |
| Timeline | Timeline, TimelineItem, TimelineSeparator |

**Additional MUI Components:**
- Container, Box, Stack, Grid (layout)
- Typography (text)
- Divider (separator)
- IconButton (icon actions)
- TextField, Select, MenuItem (inputs)
- Snackbar, Alert (notifications)
