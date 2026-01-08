/**
 * Schema-First Sample Data
 * 
 * This data matches the database schema EXACTLY - every field name and type.
 * Generated to match schema.sql precisely.
 */

// Users - matches users table schema exactly
export const users = [
  {
    username: 'admin',
    email: 'admin@friendsoutreach.org', 
    password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
    role: 'admin',
    name: 'Admin User',
    phone: '555-0101'
  },
  {
    username: 'coordinator1',
    email: 'john@friendsoutreach.org',
    password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'  
    role: 'coordinator',
    name: 'John Coordinator',
    phone: '555-0102'
  },
  {
    username: 'volunteer1', 
    email: 'sarah@friendsoutreach.org',
    password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
    role: 'volunteer',
    name: 'Sarah Volunteer', 
    phone: '555-0103'
  }
];

// Routes - matches routes table schema exactly
export const routes = [
  {
    name: 'AACo Route',
    description: 'Anne Arundel County outreach route covering Glen Burnie area businesses and key locations',
    color: '#1976d2'
  },
  {
    name: 'Baltimore City Route', 
    description: 'Baltimore City downtown and harbor area outreach route',
    color: '#388e3c'
  },
  {
    name: 'Baltimore County Route',
    description: 'Baltimore County suburban communities outreach route', 
    color: '#f57c00'
  }
];

// Locations - matches locations table schema exactly
export const locations = [
  // AACo Route (route_id: 1)
  { route_id: 1, name: 'Glen Burnie Plaza', address: '123 Glen Burnie Rd, Glen Burnie, MD', order_in_route: 1 },
  { route_id: 1, name: 'Marley Station Mall', address: '7900 Ritchie Hwy, Glen Burnie, MD', order_in_route: 2 },
  { route_id: 1, name: 'Cromwell Bridge', address: 'Cromwell Bridge Rd, Glen Burnie, MD', order_in_route: 3 },
  { route_id: 1, name: 'Arundel Mills', address: '7000 Arundel Mills Cir, Hanover, MD', order_in_route: 4 },
  { route_id: 1, name: 'BWI Airport', address: '7050 Friendship Rd, Baltimore, MD', order_in_route: 5 },
  
  // Baltimore City Route (route_id: 2)  
  { route_id: 2, name: 'Inner Harbor', address: '401 E Pratt St, Baltimore, MD', order_in_route: 1 },
  { route_id: 2, name: 'Federal Hill Park', address: '300 Warren Ave, Baltimore, MD', order_in_route: 2 },
  { route_id: 2, name: 'Fells Point', address: '1724 Thames St, Baltimore, MD', order_in_route: 3 },
  { route_id: 2, name: 'Canton Waterfront', address: '2400 Boston St, Baltimore, MD', order_in_route: 4 },
  { route_id: 2, name: 'Patterson Park', address: '200 S Patterson Park Ave, Baltimore, MD', order_in_route: 5 },
  
  // Baltimore County Route (route_id: 3)
  { route_id: 3, name: 'Towson Town Center', address: '825 Dulaney Valley Rd, Towson, MD', order_in_route: 1 },
  { route_id: 3, name: 'Hunt Valley Mall', address: '118 Shawan Rd, Cockeysville, MD', order_in_route: 2 },
  { route_id: 3, name: 'White Marsh Mall', address: '8200 Perry Hall Blvd, Nottingham, MD', order_in_route: 3 },
  { route_id: 3, name: 'Owings Mills Mall', address: '10300 Mill Run Cir, Owings Mills, MD', order_in_route: 4 },
  { route_id: 3, name: 'Catonsville Plaza', address: '6 Mellor Ave, Catonsville, MD', order_in_route: 5 }
];

// Friends - matches friends table schema exactly  
export const friends = [
  // AACo Route friends
  { location_id: 1, name: 'Mike Johnson', nickname: 'Big Mike', notes: 'Prefers warm meals', clothing_sizes: '{"shirt":"XL","pants":"38x32","shoes":"12"}', dietary_restrictions: 'No shellfish' },
  { location_id: 1, name: 'Sarah Chen', nickname: 'Doc', notes: 'Former nurse, very helpful', clothing_sizes: '{"shirt":"M","pants":"32x30","shoes":"8"}', dietary_restrictions: 'Vegetarian' },
  { location_id: 2, name: 'Robert Davis', nickname: 'Bobby D', notes: 'Usually near the food court', clothing_sizes: '{"shirt":"L","pants":"34x34","shoes":"10"}', dietary_restrictions: null },
  { location_id: 2, name: 'Maria Rodriguez', nickname: 'Mari', notes: 'Speaks Spanish and English', clothing_sizes: '{"shirt":"S","pants":"28x30","shoes":"7"}', dietary_restrictions: 'Diabetic - no sugar' },
  { location_id: 3, name: 'James Wilson', nickname: 'Jimmy', notes: 'Veteran, very respectful', clothing_sizes: '{"shirt":"M","pants":"32x32","shoes":"9"}', dietary_restrictions: null },
  
  // Baltimore City friends  
  { location_id: 6, name: 'Anthony Brown', nickname: 'Tony', notes: 'Artist, draws portraits', clothing_sizes: '{"shirt":"L","pants":"36x30","shoes":"11"}', dietary_restrictions: null },
  { location_id: 6, name: 'Linda Taylor', nickname: 'Lin', notes: 'Has two dogs', clothing_sizes: '{"shirt":"M","pants":"30x28","shoes":"8"}', dietary_restrictions: 'Lactose intolerant' },
  { location_id: 7, name: 'David Kim', nickname: 'Dave', notes: 'Tech background, helpful with phones', clothing_sizes: '{"shirt":"L","pants":"34x32","shoes":"10"}', dietary_restrictions: null },
  { location_id: 8, name: 'Patricia Johnson', nickname: 'Patty', notes: 'Grandmother of three', clothing_sizes: '{"shirt":"XL","pants":"36x28","shoes":"9"}', dietary_restrictions: 'Heart healthy diet' },
  { location_id: 9, name: 'Carlos Martinez', nickname: 'Carlos', notes: 'Musician, plays guitar', clothing_sizes: '{"shirt":"M","pants":"32x34","shoes":"9"}', dietary_restrictions: null },
  
  // Baltimore County friends
  { location_id: 11, name: 'Jennifer Adams', nickname: 'Jen', notes: 'Former teacher', clothing_sizes: '{"shirt":"M","pants":"32x30","shoes":"8"}', dietary_restrictions: 'Gluten-free' },
  { location_id: 12, name: 'Michael Thompson', nickname: 'Mikey T', notes: 'Construction worker, injured on job', clothing_sizes: '{"shirt":"XXL","pants":"40x32","shoes":"13"}', dietary_restrictions: null },
  { location_id: 13, name: 'Lisa Wang', nickname: 'Lisa', notes: 'Very organized, helps others', clothing_sizes: '{"shirt":"S","pants":"28x32","shoes":"7"}', dietary_restrictions: 'Vegan' },
  { location_id: 14, name: 'Thomas Green', nickname: 'Tom', notes: 'Quiet but grateful', clothing_sizes: '{"shirt":"L","pants":"34x30","shoes":"10"}', dietary_restrictions: null },
  { location_id: 15, name: 'Amanda Foster', nickname: 'Amy', notes: 'Single mother of two', clothing_sizes: '{"shirt":"M","pants":"30x32","shoes":"8"}', dietary_restrictions: null }
];

// Runs - matches runs table schema exactly
export const runs = [
  {
    route_id: 1,
    name: 'AACo Weekend Run',
    scheduled_date: '2024-10-26', 
    start_time: '09:00:00',
    end_time: '12:00:00',
    status: 'scheduled',
    notes: 'Focus on winter clothing distribution',
    created_by: 1
  },
  {
    route_id: 2, 
    name: 'Baltimore City Morning Run',
    scheduled_date: '2024-10-27',
    start_time: '08:30:00', 
    end_time: '11:30:00',
    status: 'scheduled',
    notes: 'Hot meal distribution planned',
    created_by: 2
  },
  {
    route_id: 3,
    name: 'Baltimore County Evening Run', 
    scheduled_date: '2024-10-28',
    start_time: '17:00:00',
    end_time: '20:00:00', 
    status: 'scheduled',
    notes: 'After-work volunteer availability',
    created_by: 1
  },
  {
    route_id: 1,
    name: 'AACo Emergency Run',
    scheduled_date: '2024-10-25',
    start_time: '14:00:00',
    end_time: '16:00:00',
    status: 'completed', 
    notes: 'Emergency response to cold weather',
    created_by: 2
  },
  {
    route_id: 2,
    name: 'City Center Run',
    scheduled_date: '2024-10-24', 
    start_time: '10:00:00',
    end_time: '13:00:00',
    status: 'completed',
    notes: 'Successful distribution, good turnout',
    created_by: 1
  }
];

// Requests - matches requests table schema exactly
export const requests = [
  { friend_id: 1, category: 'clothing', item_name: 'Winter Coat', description: 'Large winter coat, preferably dark color', priority: 'high', status: 'pending' },
  { friend_id: 1, category: 'clothing', item_name: 'Work Boots', description: 'Size 12 steel toe boots for construction work', priority: 'medium', status: 'pending' },
  { friend_id: 2, category: 'non-clothing', item_name: 'Diabetes Supplies', description: 'Blood glucose test strips and lancets', priority: 'high', status: 'ready_for_delivery', run_id: 1 },
  { friend_id: 3, category: 'clothing', item_name: 'Warm Socks', description: 'Thick wool socks, size large', priority: 'medium', status: 'delivered', run_id: 5, delivered_by: 1 },
  { friend_id: 4, category: 'non-clothing', item_name: 'Spanish Bible', description: 'Spanish language Bible, any version', priority: 'low', status: 'pending' },
  { friend_id: 5, category: 'clothing', item_name: 'Dress Shirt', description: 'White dress shirt for job interviews, medium', priority: 'high', status: 'ready_for_delivery', run_id: 1 },
  { friend_id: 6, category: 'non-clothing', item_name: 'Art Supplies', description: 'Drawing pencils and sketch pad', priority: 'low', status: 'pending' },
  { friend_id: 7, category: 'clothing', item_name: 'Dog Sweaters', description: 'Two small dog sweaters for winter', priority: 'medium', status: 'pending' },
  { friend_id: 8, category: 'non-clothing', item_name: 'Phone Charger', description: 'USB-C phone charger cable', priority: 'medium', status: 'delivered', run_id: 5, delivered_by: 3 },
  { friend_id: 9, category: 'clothing', item_name: 'Reading Glasses', description: '+2.0 reading glasses for close work', priority: 'medium', status: 'ready_for_delivery', run_id: 2 }
];