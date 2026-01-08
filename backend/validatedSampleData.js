// VALIDATED SAMPLE DATA - Matches schema.sql exactly
// All relationships verified, all foreign keys valid
// Timeline: Recent past (completed runs) to near future (scheduled runs)

// =============================================================================
// USERS - Core system users with different roles
// =============================================================================
const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@friendsoutreach.org',
    password: 'password', // Will be hashed during seeding
    name: 'Admin User',
    phone: '410-555-0001',
    role: 'admin'
  },
  {
    username: 'coordinator',
    email: 'coordinator@friendsoutreach.org',
    password: 'password',
    name: 'Sarah Johnson',
    phone: '410-555-0002',
    role: 'coordinator'
  },
  {
    username: 'volunteer',
    email: 'volunteer@friendsoutreach.org',
    password: 'password',
    name: 'Mike Chen',
    phone: '410-555-0003',
    role: 'volunteer'
  },
  {
    username: 'volunteer2',
    email: 'volunteer2@friendsoutreach.org',
    password: 'password',
    name: 'Emily Rodriguez',
    phone: '410-555-0004',
    role: 'volunteer'
  }
];

// =============================================================================
// ROUTES - Three main outreach routes
// =============================================================================
const sampleRoutes = [
  {
    name: 'Anne Arundel County',
    description: 'North and central Anne Arundel County including Glen Burnie and Severna Park areas',
    color: '#1976d2'
  },
  {
    name: 'Baltimore City East',
    description: 'East Baltimore including Patterson Park, Canton, and Highlandtown neighborhoods',
    color: '#388e3c'
  },
  {
    name: 'Baltimore City West',
    description: 'West Baltimore including West Baltimore, Sandtown-Winchester, and Edmondson Village',
    color: '#f57c00'
  }
];

// =============================================================================
// LOCATIONS - 30 locations across 3 routes with proper route_order
// =============================================================================
const sampleLocations = [
  // ===== ANNE ARUNDEL COUNTY ROUTE (route_id: 1) =====
  { name: 'Glen Burnie Plaza', address: '100 Crain Hwy N, Glen Burnie, MD 21061', route_id: 1, route_order: 1 },
  { name: 'Marley Station', address: '7900 Ritchie Hwy, Glen Burnie, MD 21061', route_id: 1, route_order: 2 },
  { name: 'Sawmill Creek Park', address: 'Ritchie Hwy & Jumpers Hole Rd, Severna Park, MD 21146', route_id: 1, route_order: 3 },
  { name: 'B&A Trail - Earleigh Heights', address: 'B&A Trail near Earleigh Heights Rd, Severna Park, MD 21146', route_id: 1, route_order: 4 },
  { name: 'Severna Park Shopping Center', address: '567 Ritchie Hwy, Severna Park, MD 21146', route_id: 1, route_order: 5 },
  { name: 'Pasadena Shopping Center', address: '8226 Ritchie Hwy, Pasadena, MD 21122', route_id: 1, route_order: 6 },
  { name: 'Lake Waterford Park', address: '300 Radio Rd, Pasadena, MD 21122', route_id: 1, route_order: 7 },
  { name: 'Harundale Plaza', address: '408 Mountain Rd, Pasadena, MD 21122', route_id: 1, route_order: 8 },
  { name: 'BWI Trail - Dorsey Rd', address: 'BWI Trail near Dorsey Rd, Glen Burnie, MD 21061', route_id: 1, route_order: 9 },
  { name: 'Ferndale Library', address: '1420 Towne Centre Blvd, Ferndale, MD 21061', route_id: 1, route_order: 10 },
  
  // ===== BALTIMORE CITY EAST ROUTE (route_id: 2) =====
  { name: 'Patterson Park - Main Pavilion', address: '27 S Patterson Park Ave, Baltimore, MD 21231', route_id: 2, route_order: 1 },
  { name: 'Canton Waterfront Park', address: '3001 Boston St, Baltimore, MD 21224', route_id: 2, route_order: 2 },
  { name: 'Eastern Avenue - Highlandtown', address: 'Eastern Ave & S Conkling St, Baltimore, MD 21224', route_id: 2, route_order: 3 },
  { name: 'Kresson Park', address: '3800 Foster Ave, Baltimore, MD 21224', route_id: 2, route_order: 4 },
  { name: 'Johns Hopkins Hospital - Broadway', address: '733 N Broadway, Baltimore, MD 21205', route_id: 2, route_order: 5 },
  { name: 'Monument Street - McElderry Park', address: 'Monument St & N Chester St, Baltimore, MD 21205', route_id: 2, route_order: 6 },
  { name: 'Clifton Park', address: '2701 St Lo Dr, Baltimore, MD 21213', route_id: 2, route_order: 7 },
  { name: 'Belair Road - Hamilton', address: 'Belair Rd & Glenmore Ave, Baltimore, MD 21206', route_id: 2, route_order: 8 },
  { name: 'Lauraville Community Center', address: '4800 Harford Rd, Baltimore, MD 21214', route_id: 2, route_order: 9 },
  { name: 'Herring Run Park', address: 'Harford Rd & Parkside Dr, Baltimore, MD 21214', route_id: 2, route_order: 10 },
  
  // ===== BALTIMORE CITY WEST ROUTE (route_id: 3) =====
  { name: 'Lexington Market', address: '400 W Lexington St, Baltimore, MD 21201', route_id: 3, route_order: 1 },
  { name: 'Poppleton - MLK Blvd', address: 'Martin Luther King Jr Blvd & Carey St, Baltimore, MD 21223', route_id: 3, route_order: 2 },
  { name: 'Hollins Market', address: '26 S Arlington Ave, Baltimore, MD 21223', route_id: 3, route_order: 3 },
  { name: 'Franklin Square Park', address: 'Calhoun St & Carey St, Baltimore, MD 21223', route_id: 3, route_order: 4 },
  { name: 'Edmondson Village Shopping Center', address: '4501 Edmondson Ave, Baltimore, MD 21229', route_id: 3, route_order: 5 },
  { name: 'Gwynns Falls Trail - Edmondson', address: 'Gwynns Falls Trail near Edmondson Ave, Baltimore, MD 21229', route_id: 3, route_order: 6 },
  { name: 'Leakin Park', address: '4921 Windsor Mill Rd, Baltimore, MD 21207', route_id: 3, route_order: 7 },
  { name: 'West Baltimore MARC Station', address: '2800 W Baltimore St, Baltimore, MD 21223', route_id: 3, route_order: 8 },
  { name: 'Sandtown-Winchester Community', address: 'Pennsylvania Ave & Lafayette Ave, Baltimore, MD 21217', route_id: 3, route_order: 9 },
  { name: 'Druid Hill Park - Main Entrance', address: '2600 Madison Ave, Baltimore, MD 21217', route_id: 3, route_order: 10 }
];

// =============================================================================
// FRIENDS - 20 friends distributed across all routes
// =============================================================================
const sampleFriends = [
  // Anne Arundel County friends
  { name: 'James Wilson', nickname: 'Jimmy', notes: 'Usually near Glen Burnie Plaza. Likes breakfast sandwiches. DOB: 3/15/75, Male' },
  { name: 'Maria Garcia', nickname: null, notes: 'Often at Marley Station. Has a service dog named Buddy. DOB: 7/22/82, Female' },
  { name: 'Robert Johnson', nickname: 'Bobby', notes: 'Moves between Sawmill Creek and B&A Trail. Veteran. DOB: 11/8/68, Male' },
  { name: 'Lisa Chen', nickname: null, notes: 'Severna Park area. Recently connected with housing services. DOB: 5/30/90, Female' },
  { name: 'David Martinez', nickname: 'Dave', notes: 'Pasadena Shopping Center regular. Looking for work. DOB: 9/14/78, Male' },
  
  // Baltimore City East friends
  { name: 'Jennifer Brown', nickname: 'Jen', notes: 'Patterson Park area. Has medical needs - diabetes. DOB: 2/18/85, Female' },
  { name: 'Michael Taylor', nickname: 'Mike', notes: 'Canton Waterfront. Friendly and talkative. DOB: 6/25/72, Male' },
  { name: 'Sarah Anderson', nickname: null, notes: 'Highlandtown area. Recently lost housing. DOB: 12/3/88, Female' },
  { name: 'Christopher Lee', nickname: 'Chris', notes: 'Near Johns Hopkins. Dealing with mental health challenges. DOB: 8/19/65, Male' },
  { name: 'Amanda White', nickname: 'Mandy', notes: 'Clifton Park area. Young mother with two kids. DOB: 4/7/93, Female' },
  
  // Baltimore City West friends
  { name: 'Thomas Harris', nickname: 'Tom', notes: 'Lexington Market regular. Former construction worker. DOB: 10/12/70, Male' },
  { name: 'Patricia Clark', nickname: 'Patty', notes: 'Poppleton area. Working with social worker. DOB: 1/28/81, Female' },
  { name: 'Daniel Lewis', nickname: 'Danny', notes: 'Hollins Market. Veteran with PTSD. DOB: 7/9/76, Male' },
  { name: 'Karen Walker', nickname: null, notes: 'Franklin Square Park. Recently in shelter. DOB: 3/21/83, Female' },
  { name: 'Richard Hall', nickname: 'Rick', notes: 'Edmondson Village area. Has bicycle, very mobile. DOB: 11/15/69, Male' },
  { name: 'Susan Allen', nickname: 'Sue', notes: 'Gwynns Falls Trail. Dealing with addiction recovery. DOB: 5/2/87, Female' },
  { name: 'Jason Young', nickname: 'Jay', notes: 'Leakin Park area. Young adult, recently aged out of foster care. DOB: 9/27/91, Male' },
  { name: 'Michelle King', nickname: 'Shelly', notes: 'West Baltimore MARC area. Looking for job training. DOB: 2/14/79, Female' },
  { name: 'Kevin Wright', nickname: null, notes: 'Sandtown-Winchester. Long-term homeless, knows area well. DOB: 8/6/74, Male' },
  { name: 'Angela Scott', nickname: 'Angie', notes: 'Druid Hill Park. Artistic, sells paintings. DOB: 6/18/86, Female' }
];

// =============================================================================
// FRIEND LOCATION HISTORY - Shows friend movements across locations
// =============================================================================
// NOTE: This represents historical spotting data. Most recent entry = current location
const sampleFriendLocationHistory = [
  // James Wilson (friend_id: 1) - Glen Burnie area
  { friend_id: 1, location_id: 1, date_recorded: '2024-12-01 08:30:00' },
  { friend_id: 1, location_id: 2, date_recorded: '2024-12-10 09:15:00' },
  { friend_id: 1, location_id: 1, date_recorded: '2024-12-20 08:45:00' }, // Current
  
  // Maria Garcia (friend_id: 2) - Marley Station regular
  { friend_id: 2, location_id: 2, date_recorded: '2024-12-05 10:00:00' },
  { friend_id: 2, location_id: 2, date_recorded: '2024-12-15 10:30:00' }, // Current
  
  // Robert Johnson (friend_id: 3) - Moves between locations
  { friend_id: 3, location_id: 3, date_recorded: '2024-12-01 07:00:00' },
  { friend_id: 3, location_id: 4, date_recorded: '2024-12-08 07:30:00' },
  { friend_id: 3, location_id: 3, date_recorded: '2024-12-18 07:15:00' }, // Current
  
  // Lisa Chen (friend_id: 4) - Severna Park
  { friend_id: 4, location_id: 5, date_recorded: '2024-12-10 09:00:00' },
  { friend_id: 4, location_id: 5, date_recorded: '2024-12-19 09:30:00' }, // Current
  
  // David Martinez (friend_id: 5) - Pasadena area
  { friend_id: 5, location_id: 6, date_recorded: '2024-12-05 11:00:00' },
  { friend_id: 5, location_id: 7, date_recorded: '2024-12-12 10:45:00' },
  { friend_id: 5, location_id: 6, date_recorded: '2024-12-20 11:15:00' }, // Current
  
  // Jennifer Brown (friend_id: 6) - Patterson Park
  { friend_id: 6, location_id: 11, date_recorded: '2024-12-03 08:00:00' },
  { friend_id: 6, location_id: 11, date_recorded: '2024-12-17 08:30:00' }, // Current
  
  // Michael Taylor (friend_id: 7) - Canton
  { friend_id: 7, location_id: 12, date_recorded: '2024-12-07 09:30:00' },
  { friend_id: 7, location_id: 12, date_recorded: '2024-12-21 09:45:00' }, // Current
  
  // Sarah Anderson (friend_id: 8) - Highlandtown
  { friend_id: 8, location_id: 13, date_recorded: '2024-12-02 10:00:00' },
  { friend_id: 8, location_id: 14, date_recorded: '2024-12-09 10:15:00' },
  { friend_id: 8, location_id: 13, date_recorded: '2024-12-19 10:30:00' }, // Current
  
  // Christopher Lee (friend_id: 9) - Johns Hopkins area
  { friend_id: 9, location_id: 15, date_recorded: '2024-12-04 11:00:00' },
  { friend_id: 9, location_id: 15, date_recorded: '2024-12-18 11:30:00' }, // Current
  
  // Amanda White (friend_id: 10) - Clifton Park
  { friend_id: 10, location_id: 17, date_recorded: '2024-12-06 08:45:00' },
  { friend_id: 10, location_id: 17, date_recorded: '2024-12-20 09:00:00' }, // Current
  
  // Thomas Harris (friend_id: 11) - Lexington Market
  { friend_id: 11, location_id: 21, date_recorded: '2024-12-01 07:30:00' },
  { friend_id: 11, location_id: 21, date_recorded: '2024-12-15 07:45:00' }, // Current
  
  // Patricia Clark (friend_id: 12) - Poppleton
  { friend_id: 12, location_id: 22, date_recorded: '2024-12-05 09:00:00' },
  { friend_id: 12, location_id: 22, date_recorded: '2024-12-19 09:15:00' }, // Current
  
  // Daniel Lewis (friend_id: 13) - Hollins Market
  { friend_id: 13, location_id: 23, date_recorded: '2024-12-03 10:30:00' },
  { friend_id: 13, location_id: 23, date_recorded: '2024-12-17 10:45:00' }, // Current
  
  // Karen Walker (friend_id: 14) - Franklin Square
  { friend_id: 14, location_id: 24, date_recorded: '2024-12-08 08:00:00' },
  { friend_id: 14, location_id: 24, date_recorded: '2024-12-20 08:15:00' }, // Current
  
  // Richard Hall (friend_id: 15) - Mobile across Edmondson area
  { friend_id: 15, location_id: 25, date_recorded: '2024-12-02 11:00:00' },
  { friend_id: 15, location_id: 26, date_recorded: '2024-12-10 11:30:00' },
  { friend_id: 15, location_id: 25, date_recorded: '2024-12-21 11:15:00' }, // Current
  
  // Susan Allen (friend_id: 16) - Gwynns Falls Trail
  { friend_id: 16, location_id: 26, date_recorded: '2024-12-04 09:30:00' },
  { friend_id: 16, location_id: 26, date_recorded: '2024-12-18 09:45:00' }, // Current
  
  // Jason Young (friend_id: 17) - Leakin Park
  { friend_id: 17, location_id: 27, date_recorded: '2024-12-06 07:00:00' },
  { friend_id: 17, location_id: 27, date_recorded: '2024-12-20 07:15:00' }, // Current
  
  // Michelle King (friend_id: 18) - West Baltimore MARC
  { friend_id: 18, location_id: 28, date_recorded: '2024-12-09 10:00:00' },
  { friend_id: 18, location_id: 28, date_recorded: '2024-12-19 10:15:00' }, // Current
  
  // Kevin Wright (friend_id: 19) - Sandtown-Winchester
  { friend_id: 19, location_id: 29, date_recorded: '2024-12-01 08:30:00' },
  { friend_id: 19, location_id: 29, date_recorded: '2024-12-15 08:45:00' }, // Current
  
  // Angela Scott (friend_id: 20) - Druid Hill Park
  { friend_id: 20, location_id: 30, date_recorded: '2024-12-07 09:00:00' },
  { friend_id: 20, location_id: 30, date_recorded: '2024-12-21 09:15:00' } // Current
];

// =============================================================================
// RUNS - 6 runs showing different states
// =============================================================================
const sampleRuns = [
  // Completed run - Anne Arundel County
  {
    route_id: 1,
    name: 'Anne Arundel County Sunday 2024-12-15',
    scheduled_date: '2024-12-15',
    meal_count: 45,
    status: 'completed',
    notes: 'Great weather, good turnout. Distributed 45 meals successfully.',
    created_at: '2024-12-10 10:00:00',
    updated_at: '2024-12-15 14:30:00',
    created_by: 2
  },
  // Completed run - Baltimore City East
  {
    route_id: 2,
    name: 'Baltimore City East Wednesday 2024-12-18',
    scheduled_date: '2024-12-18',
    meal_count: 38,
    status: 'completed',
    notes: 'Cold day but connected several friends with winter coat program.',
    created_at: '2024-12-12 09:00:00',
    updated_at: '2024-12-18 15:00:00',
    created_by: 2
  },
  // In progress - Baltimore City West (currently running)
  {
    route_id: 3,
    name: 'Baltimore City West Sunday 2024-12-22',
    scheduled_date: '2024-12-22',
    meal_count: 50,
    status: 'in_progress',
    notes: 'Sunday evening run in progress.',
    current_stop_number: 5,
    created_at: '2024-12-18 11:00:00',
    updated_at: '2024-12-22 17:00:00',
    created_by: 2
  },
  // Scheduled - Anne Arundel County (future)
  {
    route_id: 1,
    name: 'Anne Arundel County Sunday 2024-12-29',
    scheduled_date: '2024-12-29',
    meal_count: 50,
    status: 'scheduled',
    notes: 'Post-Christmas run. Preparing extra supplies.',
    created_at: '2024-12-22 10:00:00',
    updated_at: '2024-12-22 10:00:00',
    created_by: 2
  },
  // Scheduled - Baltimore City East (future)
  {
    route_id: 2,
    name: 'Baltimore City East Thursday 2025-01-02',
    scheduled_date: '2025-01-02',
    meal_count: 40,
    status: 'scheduled',
    notes: 'New Year run.',
    created_at: '2024-12-22 10:30:00',
    updated_at: '2024-12-22 10:30:00',
    created_by: 2
  },
  // Scheduled - Baltimore City West (future)
  {
    route_id: 3,
    name: 'Baltimore City West Sunday 2025-01-05',
    scheduled_date: '2025-01-05',
    meal_count: 45,
    status: 'scheduled',
    notes: null,
    created_at: '2024-12-22 11:00:00',
    updated_at: '2024-12-22 11:00:00',
    created_by: 2
  }
];

// =============================================================================
// RUN TEAM MEMBERS - Team assignments for each run
// =============================================================================
// NOTE: First member (earliest created_at) is automatically the team lead
const sampleRunTeamMembers = [
  // Run 1 team (completed) - user_id 2 (coordinator) is lead
  { run_id: 1, user_id: 2, created_at: '2024-12-10 10:05:00' }, // Lead (coordinator)
  { run_id: 1, user_id: 3, created_at: '2024-12-10 10:10:00' }, // volunteer
  { run_id: 1, user_id: 4, created_at: '2024-12-10 10:15:00' }, // volunteer2
  
  // Run 2 team (completed) - user_id 3 (volunteer) is lead
  { run_id: 2, user_id: 3, created_at: '2024-12-12 09:05:00' }, // Lead (volunteer)
  { run_id: 2, user_id: 4, created_at: '2024-12-12 09:10:00' }, // volunteer2
  
  // Run 3 team (in_progress) - user_id 2 (coordinator) is lead
  { run_id: 3, user_id: 2, created_at: '2024-12-18 11:05:00' }, // Lead (coordinator)
  { run_id: 3, user_id: 3, created_at: '2024-12-18 11:10:00' }, // volunteer
  { run_id: 3, user_id: 4, created_at: '2024-12-18 11:15:00' }, // volunteer2
  
  // Run 4 team (scheduled) - user_id 2 (coordinator) is lead
  { run_id: 4, user_id: 2, created_at: '2024-12-22 10:05:00' }, // Lead (coordinator)
  { run_id: 4, user_id: 3, created_at: '2024-12-22 10:10:00' }, // volunteer
  
  // Run 5 team (scheduled) - user_id 4 (volunteer2) is lead
  { run_id: 5, user_id: 4, created_at: '2024-12-22 10:35:00' }, // Lead (volunteer2)
  { run_id: 5, user_id: 3, created_at: '2024-12-22 10:40:00' }, // volunteer
  
  // Run 6 team (scheduled) - user_id 2 (coordinator) is lead
  { run_id: 6, user_id: 2, created_at: '2024-12-22 11:05:00' }, // Lead (coordinator)
  { run_id: 6, user_id: 3, created_at: '2024-12-22 11:10:00' }, // volunteer
  { run_id: 6, user_id: 4, created_at: '2024-12-22 11:15:00' }  // volunteer2
];

// =============================================================================
// REQUESTS - 15 requests showing complete lifecycle
// =============================================================================
// Schema: category, item_name, description, quantity, priority, status
const sampleRequests = [
  // ===== DELIVERED REQUESTS (from completed runs) =====
  // Run 1 (Anne Arundel) - 3 delivered requests
  {
    friend_id: 1, // James Wilson
    location_id: 1, // Glen Burnie Plaza
    run_id: 1,
    category: 'non-clothing',
    item_name: 'Hot meal',
    description: 'Hot meal with water',
    quantity: 1,
    priority: 'high',
    status: 'delivered',
    notes: 'James was grateful, asked about job resources',
    created_at: '2024-12-15 10:00:00',
    updated_at: '2024-12-15 11:30:00'
  },
  {
    friend_id: 2, // Maria Garcia
    location_id: 2, // Marley Station
    run_id: 1,
    category: 'clothing',
    item_name: 'Winter coat',
    description: 'Winter coat (size L) with gloves',
    quantity: 1,
    priority: 'high',
    status: 'delivered',
    notes: 'Buddy the dog got treats too',
    created_at: '2024-12-15 10:15:00',
    updated_at: '2024-12-15 12:00:00'
  },
  {
    friend_id: 3, // Robert Johnson
    location_id: 3, // Sawmill Creek
    run_id: 1,
    category: 'non-clothing',
    item_name: 'Hot meal',
    description: 'Hot meal with coffee',
    quantity: 1,
    priority: 'medium',
    status: 'delivered',
    notes: 'Discussed veteran services',
    created_at: '2024-12-15 10:30:00',
    updated_at: '2024-12-15 12:30:00'
  },
  
  // Run 2 (Baltimore City East) - 2 delivered requests
  {
    friend_id: 6, // Jennifer Brown
    location_id: 11, // Patterson Park
    run_id: 2,
    category: 'non-clothing',
    item_name: 'Diabetes supplies',
    description: 'Diabetes supplies including glucose meter',
    quantity: 1,
    priority: 'high',
    status: 'delivered',
    notes: 'Connected with health clinic for follow-up',
    created_at: '2024-12-18 09:00:00',
    updated_at: '2024-12-18 10:30:00'
  },
  {
    friend_id: 7, // Michael Taylor
    location_id: 12, // Canton Waterfront
    run_id: 2,
    category: 'non-clothing',
    item_name: 'Hot meal',
    description: 'Hot meal with soup',
    quantity: 1,
    priority: 'medium',
    status: 'delivered',
    notes: 'Mike shared stories about his sailing days',
    created_at: '2024-12-18 09:15:00',
    updated_at: '2024-12-18 11:00:00'
  },
  
  // ===== IN-PROGRESS REQUESTS (Run 3 - currently executing) =====
  {
    friend_id: 11, // Thomas Harris
    location_id: 21, // Lexington Market
    run_id: 3,
    category: 'non-clothing',
    item_name: 'Hot meal',
    description: 'Hot meal with bread',
    quantity: 1,
    priority: 'high',
    status: 'ready_for_delivery',
    notes: 'Tom mentioned back pain, may need medical referral',
    created_at: '2024-12-22 16:00:00',
    updated_at: '2024-12-22 16:45:00'
  },
  {
    friend_id: 12, // Patricia Clark
    location_id: 22, // Poppleton
    run_id: 3,
    category: 'non-clothing',
    item_name: 'Hygiene kit',
    description: 'Hygiene kit with toiletries',
    quantity: 1,
    priority: 'medium',
    status: 'ready_for_delivery',
    notes: 'Patty working with social worker on housing',
    created_at: '2024-12-22 16:15:00',
    updated_at: '2024-12-22 16:50:00'
  },
  {
    friend_id: 13, // Daniel Lewis
    location_id: 23, // Hollins Market
    run_id: 3,
    category: 'non-clothing',
    item_name: 'Hot meal',
    description: 'Hot meal with coffee',
    quantity: 1,
    priority: 'high',
    status: 'taken',
    notes: 'Danny having tough week, offered to connect with VA counselor',
    created_at: '2024-12-22 16:30:00',
    updated_at: '2024-12-22 16:35:00'
  },
  
  // ===== PENDING REQUESTS (not yet assigned to runs) =====
  {
    friend_id: 4, // Lisa Chen
    location_id: 5, // Severna Park Shopping Center
    run_id: null,
    category: 'clothing',
    item_name: 'Work clothes',
    description: 'Work clothes for job interview',
    quantity: 1,
    priority: 'high',
    status: 'pending',
    notes: 'Lisa has interview next week!',
    created_at: '2024-12-22 14:00:00',
    updated_at: '2024-12-22 14:00:00'
  },
  {
    friend_id: 5, // David Martinez
    location_id: 6, // Pasadena Shopping Center
    run_id: null,
    category: 'non-clothing',
    item_name: 'Bus pass',
    description: 'Bus pass for job search',
    quantity: 1,
    priority: 'medium',
    status: 'pending',
    notes: 'Dave actively looking for construction work',
    created_at: '2024-12-22 15:00:00',
    updated_at: '2024-12-22 15:00:00'
  },
  {
    friend_id: 8, // Sarah Anderson
    location_id: 13, // Highlandtown
    run_id: null,
    category: 'non-clothing',
    item_name: 'Meal and groceries',
    description: 'Meal with groceries',
    quantity: 1,
    priority: 'high',
    status: 'pending',
    notes: 'Recently lost housing, needs immediate support',
    created_at: '2024-12-22 13:00:00',
    updated_at: '2024-12-22 13:00:00'
  },
  {
    friend_id: 15, // Richard Hall
    location_id: 25, // Edmondson Village
    run_id: null,
    category: 'non-clothing',
    item_name: 'Bike repair kit',
    description: 'Bike repair kit with tools',
    quantity: 1,
    priority: 'low',
    status: 'pending',
    notes: 'Rick needs tools to maintain his bicycle',
    created_at: '2024-12-22 12:00:00',
    updated_at: '2024-12-22 12:00:00'
  },
  {
    friend_id: 16, // Susan Allen
    location_id: 26, // Gwynns Falls Trail
    run_id: null,
    category: 'non-clothing',
    item_name: 'Addiction recovery resources',
    description: 'Addiction recovery program information and resources',
    quantity: 1,
    priority: 'high',
    status: 'pending',
    notes: 'Sue expressed interest in treatment program',
    created_at: '2024-12-22 11:00:00',
    updated_at: '2024-12-22 11:00:00'
  },
  {
    friend_id: 20, // Angela Scott
    location_id: 30, // Druid Hill Park
    run_id: null,
    category: 'non-clothing',
    item_name: 'Art supplies',
    description: 'Art supplies for painting',
    quantity: 1,
    priority: 'low',
    status: 'pending',
    notes: 'Angie sells paintings, needs materials',
    created_at: '2024-12-22 10:00:00',
    updated_at: '2024-12-22 10:00:00'
  }
];

// =============================================================================
// REQUEST STATUS HISTORY - Audit trail for all request status changes
// =============================================================================
// NOTE: user_id is REQUIRED per schema - represents who made the status change
const sampleRequestStatusHistory = [
  // Request 1 (James Wilson) - delivered
  { request_id: 1, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-15 10:00:00' },
  { request_id: 1, status: 'taken', notes: 'Assigned to Run 1', user_id: 2, created_at: '2024-12-15 10:05:00' },
  { request_id: 1, status: 'ready_for_delivery', notes: 'Meal prepared', user_id: 3, created_at: '2024-12-15 11:00:00' },
  { request_id: 1, status: 'delivered', notes: 'Successfully delivered', user_id: 3, created_at: '2024-12-15 11:30:00' },
  
  // Request 2 (Maria Garcia) - delivered
  { request_id: 2, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-15 10:15:00' },
  { request_id: 2, status: 'taken', notes: 'Assigned to Run 1', user_id: 2, created_at: '2024-12-15 10:20:00' },
  { request_id: 2, status: 'ready_for_delivery', notes: 'Winter coat found in donations', user_id: 4, created_at: '2024-12-15 11:30:00' },
  { request_id: 2, status: 'delivered', notes: 'Delivered with dog treats', user_id: 4, created_at: '2024-12-15 12:00:00' },
  
  // Request 3 (Robert Johnson) - delivered
  { request_id: 3, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-15 10:30:00' },
  { request_id: 3, status: 'taken', notes: 'Assigned to Run 1', user_id: 2, created_at: '2024-12-15 10:35:00' },
  { request_id: 3, status: 'ready_for_delivery', notes: 'Hot coffee added', user_id: 3, created_at: '2024-12-15 12:00:00' },
  { request_id: 3, status: 'delivered', notes: 'Good conversation about VA services', user_id: 3, created_at: '2024-12-15 12:30:00' },
  
  // Request 4 (Jennifer Brown) - delivered
  { request_id: 4, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-18 09:00:00' },
  { request_id: 4, status: 'taken', notes: 'Assigned to Run 2', user_id: 2, created_at: '2024-12-18 09:05:00' },
  { request_id: 4, status: 'ready_for_delivery', notes: 'Medical supplies obtained from donation', user_id: 3, created_at: '2024-12-18 10:00:00' },
  { request_id: 4, status: 'delivered', notes: 'Connected with clinic for follow-up', user_id: 3, created_at: '2024-12-18 10:30:00' },
  
  // Request 5 (Michael Taylor) - delivered
  { request_id: 5, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-18 09:15:00' },
  { request_id: 5, status: 'taken', notes: 'Assigned to Run 2', user_id: 2, created_at: '2024-12-18 09:20:00' },
  { request_id: 5, status: 'ready_for_delivery', notes: 'Extra soup added', user_id: 4, created_at: '2024-12-18 10:30:00' },
  { request_id: 5, status: 'delivered', notes: 'Great conversation', user_id: 4, created_at: '2024-12-18 11:00:00' },
  
  // Request 6 (Thomas Harris) - ready_for_delivery
  { request_id: 6, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-22 16:00:00' },
  { request_id: 6, status: 'taken', notes: 'Assigned to Run 3', user_id: 2, created_at: '2024-12-22 16:05:00' },
  { request_id: 6, status: 'ready_for_delivery', notes: 'At location, ready to deliver', user_id: 3, created_at: '2024-12-22 16:45:00' },
  
  // Request 7 (Patricia Clark) - ready_for_delivery
  { request_id: 7, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-22 16:15:00' },
  { request_id: 7, status: 'taken', notes: 'Assigned to Run 3', user_id: 2, created_at: '2024-12-22 16:20:00' },
  { request_id: 7, status: 'ready_for_delivery', notes: 'At location', user_id: 4, created_at: '2024-12-22 16:50:00' },
  
  // Request 8 (Daniel Lewis) - taken
  { request_id: 8, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-22 16:30:00' },
  { request_id: 8, status: 'taken', notes: 'Assigned to Run 3', user_id: 2, created_at: '2024-12-22 16:35:00' },
  
  // Requests 9-15 (pending) - only initial status
  { request_id: 9, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-22 14:00:00' },
  { request_id: 10, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-22 15:00:00' },
  { request_id: 11, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-22 13:00:00' },
  { request_id: 12, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-22 12:00:00' },
  { request_id: 13, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-22 11:00:00' },
  { request_id: 14, status: 'pending', notes: null, user_id: 2, created_at: '2024-12-22 10:00:00' }
];

// =============================================================================
// RUN STOP DELIVERIES - Tracks deliveries at each location during run
// =============================================================================
// NOTE: Only for completed/in-progress runs
// Schema: run_id, location_id, meals_delivered, visited_at, notes, recorded_by, created_at
const sampleRunStopDeliveries = [
  // Run 1 (completed) - Anne Arundel County
  { run_id: 1, location_id: 1, meals_delivered: 8, visited_at: '2024-12-15 10:30:00', notes: 'Good start, many regulars', recorded_by: 2, created_at: '2024-12-15 10:30:00' },
  { run_id: 1, location_id: 2, meals_delivered: 12, visited_at: '2024-12-15 11:00:00', notes: 'Busy location, long conversations', recorded_by: 2, created_at: '2024-12-15 11:00:00' },
  { run_id: 1, location_id: 3, meals_delivered: 6, visited_at: '2024-12-15 11:45:00', notes: 'Few people today', recorded_by: 2, created_at: '2024-12-15 11:45:00' },
  { run_id: 1, location_id: 4, meals_delivered: 5, visited_at: '2024-12-15 12:15:00', notes: null, recorded_by: 2, created_at: '2024-12-15 12:15:00' },
  { run_id: 1, location_id: 5, meals_delivered: 7, visited_at: '2024-12-15 12:45:00', notes: null, recorded_by: 2, created_at: '2024-12-15 12:45:00' },
  { run_id: 1, location_id: 6, meals_delivered: 7, visited_at: '2024-12-15 13:15:00', notes: 'Several new faces', recorded_by: 2, created_at: '2024-12-15 13:15:00' },
  
  // Run 2 (completed) - Baltimore City East
  { run_id: 2, location_id: 11, meals_delivered: 9, visited_at: '2024-12-18 09:30:00', notes: 'Cold day, extra hot coffee appreciated', recorded_by: 3, created_at: '2024-12-18 09:30:00' },
  { run_id: 2, location_id: 12, meals_delivered: 8, visited_at: '2024-12-18 10:15:00', notes: null, recorded_by: 3, created_at: '2024-12-18 10:15:00' },
  { run_id: 2, location_id: 13, meals_delivered: 6, visited_at: '2024-12-18 11:00:00', notes: 'Distributed winter coats', recorded_by: 3, created_at: '2024-12-18 11:00:00' },
  { run_id: 2, location_id: 14, meals_delivered: 5, visited_at: '2024-12-18 11:45:00', notes: null, recorded_by: 3, created_at: '2024-12-18 11:45:00' },
  { run_id: 2, location_id: 15, meals_delivered: 10, visited_at: '2024-12-18 12:30:00', notes: 'Hospital area, many people', recorded_by: 3, created_at: '2024-12-18 12:30:00' },
  
  // Run 3 (in_progress) - Baltimore City West (up to current stop 5)
  { run_id: 3, location_id: 21, meals_delivered: 12, visited_at: '2024-12-22 16:30:00', notes: 'Lexington Market very busy', recorded_by: 4, created_at: '2024-12-22 16:30:00' },
  { run_id: 3, location_id: 22, meals_delivered: 9, visited_at: '2024-12-22 16:50:00', notes: 'Good connections made', recorded_by: 4, created_at: '2024-12-22 16:50:00' },
  { run_id: 3, location_id: 23, meals_delivered: 7, visited_at: '2024-12-22 17:10:00', notes: null, recorded_by: 4, created_at: '2024-12-22 17:10:00' },
  { run_id: 3, location_id: 24, meals_delivered: 8, visited_at: '2024-12-22 17:30:00', notes: 'Several families', recorded_by: 4, created_at: '2024-12-22 17:30:00' },
  { run_id: 3, location_id: 25, meals_delivered: 10, visited_at: '2024-12-22 17:50:00', notes: 'Currently at this location', recorded_by: 4, created_at: '2024-12-22 17:50:00' }
];

// =============================================================================
// EXPORTS
// =============================================================================
export {
  sampleUsers,
  sampleRoutes,
  sampleLocations,
  sampleFriends,
  sampleFriendLocationHistory,
  sampleRuns,
  sampleRunTeamMembers,
  sampleRequests,
  sampleRequestStatusHistory,
  sampleRunStopDeliveries
};
