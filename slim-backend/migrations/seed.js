// Seed Data - Friends Outreach CRM V2
// Populates database with real route/location data and sample users/friends

import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedUsers(client) {
  console.log('\n👥 Seeding users...');
  
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const { rows } = await client.query(`
    INSERT INTO users (email, name, password_hash, is_active)
    VALUES 
      ('admin@friendsoutreach.org', 'Admin User', $1, true),
      ('coordinator@friendsoutreach.org', 'Sarah Johnson', $1, true),
      ('volunteer1@friendsoutreach.org', 'Mike Chen', $1, true),
      ('volunteer2@friendsoutreach.org', 'Emma Davis', $1, true)
    RETURNING id, name
  `, [passwordHash]);
  
  console.log(`✅ Created ${rows.length} users`);
  return rows;
}

async function seedRoutes(client) {
  console.log('\n🗺️  Seeding routes...');
  
  const { rows } = await client.query(`
    INSERT INTO routes (name, description, is_active)
    VALUES 
      ('B1', 'Downtown Baltimore - Inner Harbor Area', true),
      ('B2', 'West Baltimore - MLK Boulevard Circuit', true),
      ('AACo', 'Anne Arundel County - Glen Burnie Area', true)
    RETURNING id, name
  `);
  
  console.log(`✅ Created ${rows.length} routes`);
  return rows;
}

async function seedLocations(client, routes) {
  console.log('\n📍 Seeding locations...');
  
  const b1 = routes.find(r => r.name === 'B1');
  const b2 = routes.find(r => r.name === 'B2');
  const aaco = routes.find(r => r.name === 'AACo');
  
  const locations = [
    // B1 Route (4 locations)
    { route_id: b1.id, name: 'O Lot', route_order: 1, address: 'Near M&T Bank Stadium', city: 'Baltimore', state: 'MD' },
    { route_id: b1.id, name: 'Grace and Hope Mission', route_order: 2, address: 'Gay Street', city: 'Baltimore', state: 'MD' },
    { route_id: b1.id, name: 'City Hall Park', route_order: 3, address: 'City Hall Plaza', city: 'Baltimore', state: 'MD' },
    { route_id: b1.id, name: 'Fallsway Underpass', route_order: 4, address: 'Fallsway', city: 'Baltimore', state: 'MD' },
    
    // B2 Route (14 locations)
    { route_id: b2.id, name: 'Holocaust Memorial', route_order: 1, address: 'Gay St & Lombard St', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'CFG Bank Arena', route_order: 2, address: '201 W Baltimore St', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'University of Maryland', route_order: 3, address: 'Green Street', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'MLK & Lombard', route_order: 4, address: 'MLK Blvd & Lombard St', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'MLK & Mulberry', route_order: 5, address: 'MLK Blvd & Mulberry St', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'MLK & Franklin', route_order: 6, address: 'MLK Blvd & Franklin St', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'Chase & Preston', route_order: 7, address: 'Chase St & Preston St', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'BSO Park', route_order: 8, address: 'Near Symphony Center', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'MLK & Howard', route_order: 9, address: 'MLK Blvd & Howard St', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'MLK & Washington Blvd', route_order: 10, address: 'MLK Blvd & Washington Blvd', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'Washington & West Cross', route_order: 11, address: 'Washington Blvd & West Cross St', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'B&O Railroad Museum', route_order: 12, address: 'Mt Clare Shopping Center', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'MLK & West Pratt', route_order: 13, address: 'MLK Blvd & West Pratt St', city: 'Baltimore', state: 'MD' },
    { route_id: b2.id, name: 'Holocaust Memorial (Return)', route_order: 14, address: 'Gay St & Lombard St', city: 'Baltimore', state: 'MD' },
    
    // AACo Route (13 locations)
    { route_id: aaco.id, name: 'Brusters', route_order: 1, address: 'Aqua Heart Road', city: 'Glen Burnie', state: 'MD' },
    { route_id: aaco.id, name: 'Mikes Inland Sunset', route_order: 2, address: 'Greenway Road', city: 'Glen Burnie', state: 'MD' },
    { route_id: aaco.id, name: 'Glen Burnie Library', route_order: 3, address: '1010 EastWay', city: 'Glen Burnie', state: 'MD' },
    { route_id: aaco.id, name: 'Behind La Fontaine Blue', route_order: 4, address: 'Along bike path area', city: 'Glen Burnie', state: 'MD' },
    { route_id: aaco.id, name: 'Carol Fuel', route_order: 5, address: 'B&A Blvd', city: 'Glen Burnie', state: 'MD' },
    { route_id: aaco.id, name: 'Dunkin Donuts', route_order: 6, address: 'BNA Blvd', city: 'Glen Burnie', state: 'MD' },
    { route_id: aaco.id, name: 'Maisel Brothers', route_order: 7, address: 'Near 8th Ave', city: 'Glen Burnie', state: 'MD' },
    { route_id: aaco.id, name: 'Crane & Ritchie Highway', route_order: 8, address: 'Crane St & Ritchie Hwy', city: 'Glen Burnie', state: 'MD' },
    { route_id: aaco.id, name: 'Ollies (Behind Target)', route_order: 9, address: 'Near trailers behind Target', city: 'Glen Burnie', state: 'MD' },
    { route_id: aaco.id, name: 'Golden Corral', route_order: 10, address: 'Ordnance Road', city: 'Glen Burnie', state: 'MD' },
    { route_id: aaco.id, name: 'Roses Brooklyn Park', route_order: 11, address: 'Brooklyn Park', city: 'Brooklyn Park', state: 'MD' },
    { route_id: aaco.id, name: 'Village Liquors', route_order: 12, address: 'Church Street', city: 'Brooklyn Park', state: 'MD' },
    { route_id: aaco.id, name: 'Royal Farms', route_order: 13, address: 'Patapsco & Potee', city: 'Brooklyn Park', state: 'MD' },
  ];
  
  const values = locations.map((loc, i) => {
    const offset = i * 6;
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
  }).join(', ');
  
  const params = locations.flatMap(loc => [
    loc.route_id, loc.name, loc.route_order, loc.address, loc.city, loc.state
  ]);
  
  const { rows } = await client.query(`
    INSERT INTO locations (route_id, name, route_order, address, city, state)
    VALUES ${values}
    RETURNING id, name
  `, params);
  
  console.log(`✅ Created ${rows.length} locations across 3 routes`);
  return rows;
}

async function seedFriends(client, locations) {
  console.log('\n🤝 Seeding friends...');
  
  const friends = [
    { first_name: 'John', last_name: 'Smith', status: 'active', notes: 'Regular at City Hall Park' },
    { first_name: 'Maria', alias: 'Red', status: 'active', notes: 'Usually at MLK & Lombard' },
    { first_name: 'James', last_name: 'Wilson', phone: '+14105551234', status: 'active' },
    { alias: 'Smokey', status: 'active', notes: 'Prefers Holocaust Memorial stop' },
    { first_name: 'Sarah', last_name: 'Johnson', status: 'active', notes: 'Glen Burnie Library area' },
    { first_name: 'David', alias: 'Doc', status: 'active', notes: 'Medical background, very helpful' },
    { first_name: 'Lisa', last_name: 'Brown', phone: '+14105555678', status: 'active' },
    { alias: 'Chef', status: 'active', notes: 'Always near CFG Bank Arena' },
    { first_name: 'Robert', last_name: 'Davis', status: 'active' },
    { first_name: 'Michelle', last_name: 'Garcia', status: 'active', notes: 'Brooklyn Park regular' },
    { alias: 'Tiny', status: 'active', notes: 'Actually quite tall' },
    { first_name: 'William', last_name: 'Martinez', status: 'active' },
    { first_name: 'Jennifer', alias: 'Jen', status: 'active' },
    { alias: 'Bear', status: 'active', notes: 'Friendly but keeps to himself' },
    { first_name: 'Charles', last_name: 'Anderson', status: 'active' },
  ];
  
  // Insert friends one by one since they have varying nullable fields
  const insertedFriends = [];
  for (const friend of friends) {
    const { rows } = await client.query(`
      INSERT INTO friends (first_name, last_name, alias, phone, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, last_name, alias
    `, [
      friend.first_name || null,
      friend.last_name || null,
      friend.alias || null,
      friend.phone || null,
      friend.status,
      friend.notes || null
    ]);
    insertedFriends.push(rows[0]);
  }
  
  console.log(`✅ Created ${insertedFriends.length} friends`);
  return insertedFriends;
}

async function seedFriendLocationHistory(client, friends, locations, users) {
  console.log('\n📍 Seeding friend location history...');
  
  // Create realistic sighting history across all routes
  const sightings = [
    // B1 Route sightings
    { friend_id: friends[0].id, location_id: locations[2].id, user_id: users[2].id, days_ago: 2, notes: 'Regular spot' }, // John at City Hall Park
    { friend_id: friends[2].id, location_id: locations[0].id, user_id: users[2].id, days_ago: 3, notes: 'Friendly conversation' }, // James at O Lot
    { friend_id: friends[8].id, location_id: locations[3].id, user_id: users[3].id, days_ago: 1, notes: 'New to area' }, // Robert at Fallsway
    
    // B2 Route sightings
    { friend_id: friends[1].id, location_id: locations[7].id, user_id: users[2].id, days_ago: 1, notes: 'Usually here evenings' }, // Maria at MLK & Lombard
    { friend_id: friends[3].id, location_id: locations[4].id, user_id: users[2].id, days_ago: 2, notes: 'Prefers this spot' }, // Smokey at Holocaust Memorial
    { friend_id: friends[7].id, location_id: locations[5].id, user_id: users[3].id, days_ago: 4, notes: 'Helping others' }, // Chef at CFG Bank Arena
    { friend_id: friends[10].id, location_id: locations[8].id, user_id: users[2].id, days_ago: 3, notes: 'Quiet but friendly' }, // Tiny at MLK & Mulberry
    { friend_id: friends[13].id, location_id: locations[12].id, user_id: users[3].id, days_ago: 5, notes: 'Keeps to himself' }, // Bear at BSO Park
    { friend_id: friends[1].id, location_id: locations[9].id, user_id: users[2].id, days_ago: 7, notes: 'Has moved around' }, // Maria's older sighting
    
    // AACo Route sightings
    { friend_id: friends[4].id, location_id: locations[20].id, user_id: users[2].id, days_ago: 1, notes: 'Uses library services' }, // Sarah at Glen Burnie Library
    { friend_id: friends[6].id, location_id: locations[18].id, user_id: users[3].id, days_ago: 2, notes: 'Morning regular' }, // Lisa at Brusters
    { friend_id: friends[9].id, location_id: locations[29].id, user_id: users[2].id, days_ago: 3, notes: 'Brooklyn Park area' }, // Michelle at Roses
    { friend_id: friends[11].id, location_id: locations[25].id, user_id: users[3].id, days_ago: 4, notes: 'Usually here afternoons' }, // William at Crane & Ritchie
    { friend_id: friends[12].id, location_id: locations[22].id, user_id: users[2].id, days_ago: 2, notes: 'Friendly, talkative' }, // Jennifer at Carol Fuel
    { friend_id: friends[14].id, location_id: locations[30].id, user_id: users[3].id, days_ago: 1, notes: 'Needs warm clothes' }, // Charles at Village Liquors
  ];
  
  for (const sighting of sightings) {
    const spottedAt = new Date();
    spottedAt.setDate(spottedAt.getDate() - sighting.days_ago);
    
    await client.query(`
      INSERT INTO friend_location_history (friend_id, location_id, spotted_by, spotted_at, notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [sighting.friend_id, sighting.location_id, sighting.user_id, spottedAt, sighting.notes]);
  }
  
  console.log(`✅ Created ${sightings.length} friend location sightings`);
}

async function seedRequests(client, friends, locations, users) {
  console.log('\n📦 Seeding requests...');
  
  // Sample requests distributed across all 3 routes with various statuses
  const requests = [
    // B1 Route requests
    {
      friend_id: friends[0].id,
      location_id: locations[2].id, // City Hall Park
      item_description: 'Winter coat size L',
      priority: 'high',
      status: 'pending',
      notes: 'Urgent - cold weather coming'
    },
    {
      friend_id: friends[2].id,
      location_id: locations[0].id, // O Lot
      item_description: 'Sleeping bag',
      priority: 'high',
      status: 'ready_for_delivery',
      notes: 'Item pulled from warehouse'
    },
    
    // B2 Route requests
    {
      friend_id: friends[1].id,
      location_id: locations[7].id, // MLK & Lombard
      item_description: 'Work boots size 9',
      priority: 'medium',
      status: 'ready_for_delivery',
      notes: 'Has job interview next week'
    },
    {
      friend_id: friends[7].id,
      location_id: locations[5].id, // CFG Bank Arena
      item_description: 'Backpack',
      priority: 'medium',
      status: 'pending',
      notes: 'Current one is torn'
    },
    {
      friend_id: friends[10].id,
      location_id: locations[8].id, // MLK & Mulberry
      item_description: 'Hygiene kit',
      priority: 'medium',
      status: 'ready_for_delivery',
      notes: 'Regular request'
    },
    {
      friend_id: friends[3].id,
      location_id: locations[4].id, // Holocaust Memorial
      item_description: 'Blanket',
      priority: 'high',
      status: 'pending',
      notes: 'Sleeping outside'
    },
    
    // AACo Route requests
    {
      friend_id: friends[4].id,
      location_id: locations[20].id, // Glen Burnie Library
      item_description: 'Reading glasses',
      priority: 'low',
      status: 'pending',
      notes: 'Lost previous pair'
    },
    {
      friend_id: friends[6].id,
      location_id: locations[18].id, // Brusters
      item_description: 'Raincoat size M',
      priority: 'medium',
      status: 'ready_for_delivery',
      notes: 'Item ready'
    },
    {
      friend_id: friends[9].id,
      location_id: locations[29].id, // Roses Brooklyn Park
      item_description: 'Thermal socks (3 pairs)',
      priority: 'medium',
      status: 'pending',
      notes: 'Winter essential'
    },
    {
      friend_id: friends[12].id,
      location_id: locations[22].id, // Carol Fuel
      item_description: 'First aid supplies',
      priority: 'urgent',
      status: 'pending',
      notes: 'Minor injury needs attention'
    },
  ];
  
  for (const req of requests) {
    await client.query(`
      INSERT INTO requests (friend_id, location_id, item_description, priority, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [req.friend_id, req.location_id, req.item_description, req.priority, req.status, req.notes]);
  }
  
  console.log(`✅ Created ${requests.length} requests across all routes`);
}

async function seedRuns(client, routes, users) {
  console.log('\n🏃 Seeding runs...');
  
  const b1 = routes.find(r => r.name === 'B1');
  const b2 = routes.find(r => r.name === 'B2');
  const aaco = routes.find(r => r.name === 'AACo');
  
  const admin = users.find(u => u.name === 'Admin User');
  const coordinator = users.find(u => u.name === 'Sarah Johnson');
  const volunteer1 = users.find(u => u.name === 'Mike Chen');
  const volunteer2 = users.find(u => u.name === 'Emma Davis');
  
  // Get dates for realistic scheduling
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  // Helper to generate run name like backend does
  const generateRunName = (route, scheduledDate) => {
    const date = new Date(scheduledDate);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    const dateStr = scheduledDate; // Already in YYYY-MM-DD format
    return `${route.name} ${dayOfWeek} ${dateStr}`;
  };
  
  const runs = [
    // Completed runs (past)
    {
      route_id: b2.id,
      scheduled_date: lastWeek.toISOString().split('T')[0],
      status: 'completed',
      meal_count: 47,
      notes: 'Great turnout, met several new folks',
      team: [coordinator.id, volunteer1.id]
    },
    {
      route_id: aaco.id,
      scheduled_date: yesterday.toISOString().split('T')[0],
      status: 'completed',
      meal_count: 32,
      notes: 'Distributed winter gear at several stops',
      team: [volunteer2.id, volunteer1.id]
    },
    
    // Planned runs (upcoming)
    {
      route_id: b1.id,
      scheduled_date: tomorrow.toISOString().split('T')[0],
      status: 'planned',
      meal_count: null,
      notes: 'First run of the week - prep meals tonight',
      team: [coordinator.id, volunteer2.id]
    },
    {
      route_id: b2.id,
      scheduled_date: today.toISOString().split('T')[0],
      status: 'planned',
      meal_count: null,
      notes: 'Saturday route - expect higher turnout',
      team: [admin.id, volunteer1.id, volunteer2.id]
    },
    {
      route_id: aaco.id,
      scheduled_date: nextWeek.toISOString().split('T')[0],
      status: 'planned',
      meal_count: null,
      notes: 'County route - bring extra supplies',
      team: [coordinator.id]
    },
    {
      route_id: b1.id,
      scheduled_date: today.toISOString().split('T')[0],
      status: 'planned',
      meal_count: null,
      notes: 'Evening route',
      team: [admin.id, volunteer1.id]
    }
  ];
  
  const createdRuns = [];
  for (const run of runs) {
    const { team, ...runData } = run;
    
    // Get route info for name generation
    const route = routes.find(r => r.id === runData.route_id);
    const runName = generateRunName(route, runData.scheduled_date);
    
    // Insert run
    const { rows } = await client.query(`
      INSERT INTO runs (route_id, name, scheduled_date, status, meal_count, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      runData.route_id,
      runName,
      runData.scheduled_date,
      runData.status,
      runData.meal_count,
      runData.notes
    ]);
    
    const runId = rows[0].id;
    createdRuns.push({ id: runId, ...run });
    
    // Add team members (first member is the lead - earliest created_at)
    for (let i = 0; i < team.length; i++) {
      await client.query(`
        INSERT INTO run_team_members (run_id, user_id)
        VALUES ($1, $2)
      `, [runId, team[i]]);
      
      // Small delay to ensure created_at ordering for lead determination
      if (i < team.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
}
  
  console.log(`✅ Created ${createdRuns.length} runs`);
  console.log(`   • Completed: ${runs.filter(r => r.status === 'completed').length}`);
  console.log(`   • Planned: ${runs.filter(r => r.status === 'planned').length}`);
  console.log(`   • In Progress: ${runs.filter(r => r.status === 'in_progress').length}`);
}

async function main() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting seed process...');
    console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1] || 'unknown'}`);
    
    await client.query('BEGIN');
    
    const users = await seedUsers(client);
    const routes = await seedRoutes(client);
    const locations = await seedLocations(client, routes);
    const friends = await seedFriends(client, locations);
    await seedFriendLocationHistory(client, friends, locations, users);
    await seedRequests(client, friends, locations, users);
    await seedRuns(client, routes, users);
    
    await client.query('COMMIT');
    
    console.log('\n✨ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • 4 users (password: password123)`);
    console.log(`   • 3 routes (B1: 4 stops, B2: 14 stops, AACo: 13 stops)`);
    console.log(`   • 31 locations total`);
    console.log(`   • 15 friends`);
    console.log(`   • 16 friend location sightings across all routes`);
    console.log(`   • 10 requests (B1: 2, B2: 4, AACo: 4)`);
    console.log(`   • 6 runs (2 completed, 3 planned, 1 in-progress)`);
    console.log('\n🔐 Login credentials:');
    console.log(`   admin@friendsoutreach.org / password123`);
    console.log(`   coordinator@friendsoutreach.org / password123`);
    console.log(`   volunteer1@friendsoutreach.org / password123\n`);
    
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n💥 Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
