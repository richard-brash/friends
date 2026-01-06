// Clean Sample data for Friends CRM
// Proper relationships: Friend → Location → Route ← Run
// All data relationships are logically consistent

export const sampleUsers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@friendsoutreach.org',
    phone: '555-0101',
    password: 'password', // Will be hashed during population
    role: 'admin',
    permissions: ['all_permissions'],
    active: true,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 2, 
    name: 'John Coordinator',
    email: 'john@friendsoutreach.org',
    phone: '555-0102',
    password: 'password', // Will be hashed during population
    role: 'coordinator',
    permissions: ['coordinate_runs', 'lead_runs', 'assign_users', 'manage_routes'],
    active: true,
    createdAt: new Date('2024-02-01')
  },
  {
    id: 3,
    name: 'Sarah Volunteer',
    email: 'sarah@friendsoutreach.org', 
    phone: '555-0103',
    password: 'password', // Will be hashed during population
    role: 'volunteer',
    permissions: ['participate_runs', 'view_assignments', 'field_operations'],
    active: true,
    createdAt: new Date('2024-02-10')
  }
];

// Keep existing locations - these are real locations and routes
export const sampleLocations = [
  // AACo Route Locations (Route 1)
  {
    id: '1',
    name: 'Brusters',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Business',
    notes: 'Ice cream shop, regular stop on AACo route',
    routeId: 1,
    routeOrder: 1,
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '2', 
    name: 'Mike\'s Sunset',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Business',
    notes: 'Local establishment on AACo route',
    routeId: 1,
    routeOrder: 2,
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '3',
    name: 'Behind LaFontaine Bleu',
    address: 'Glen Burnie, Anne Arundel County', 
    type: 'Residential Area',
    notes: 'Behind apartment complex, check for friends',
    routeId: 1,
    routeOrder: 3,
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '4',
    name: 'Caroll Fuels',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Gas Station',
    notes: 'Gas station stop on AACo route',
    routeId: 1,
    routeOrder: 4,
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '5',
    name: 'Dunkin Donuts (AACo)',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Restaurant',
    notes: 'Coffee shop stop, good for morning connections',
    routeId: 1,
    routeOrder: 5,
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '6',
    name: 'Annette\'s Location',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Personal',
    notes: 'Annette\'s regular location',
    routeId: 1,
    routeOrder: 6,
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '7',
    name: 'Maisel Bros',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Business',
    notes: 'Industrial area stop on AACo route',
    routeId: 1,
    routeOrder: 7,

    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '8',
    name: 'Ollie\'s',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Store',
    notes: 'David\'s regular location at the store',
    routeId: 1,
    routeOrder: 8,

    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '9',
    name: 'New Hampshire Avenue',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Street Area',
    notes: 'Regular stops along New Hampshire Avenue',
    routeId: 1,
    routeOrder: 9,

    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '10',
    name: 'Ritchie Highway Area',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Highway Area',
    notes: 'Stops along Ritchie Highway corridor',
    routeId: 1,
    routeOrder: 10,

    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '11',
    name: 'Glen Burnie Plaza',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Shopping Center',
    notes: 'Shopping plaza with multiple friend connections',
    routeId: 1,
    routeOrder: 11,

    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '12',
    name: 'Marley Station Area',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Shopping Area',
    notes: 'Near Marley Station mall, good foot traffic',
    routeId: 1,
    routeOrder: 12,

    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '13',
    name: 'Village Liquors/Church St (Danielle)',
    address: 'Church St, Anne Arundel County',
    type: 'Business',
    notes: 'Danielle\'s regular location near Village Liquors',
    routeId: 1,
    routeOrder: 13,

    createdAt: new Date('2024-01-20').toISOString()
  },

  // Baltimore City 1 Locations (Route 2)
  {
    id: '14',
    name: 'O Lot',
    address: 'Baltimore City',
    type: 'Parking Area',
    notes: 'Starting point for Baltimore City 1 route',
    routeId: 2,
    routeOrder: 1,

    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '15',
    name: 'Grace & Hope Mission',
    address: 'Gay St, Baltimore City',
    type: 'Service Organization',
    notes: 'On Gay St on way to City Hall Park',
    routeId: 2,
    routeOrder: 2,

    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '16',
    name: 'City Hall Park',
    address: 'Baltimore City',
    type: 'Public Space',
    notes: 'Central park area, good gathering spot',
    routeId: 2,
    routeOrder: 3,

    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '17',
    name: 'Fallsway Underpass',
    address: 'Fallsway, Baltimore City',
    type: 'Underpass',
    notes: 'Check underpass area for friends seeking shelter',
    routeId: 2,
    routeOrder: 4,

    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '18',
    name: 'HC4H',
    address: 'Baltimore City',
    type: 'Service Organization',
    notes: 'Healthcare for the Homeless location',
    routeId: 2,
    routeOrder: 5,

    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '19',
    name: 'St. Vincent',
    address: 'Baltimore City',
    type: 'Service Organization',
    notes: 'St. Vincent de Paul services',
    routeId: 2,
    routeOrder: 6,

    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '20',
    name: 'Downtown Coffee District',
    address: 'Baltimore City',
    type: 'Commercial Area',
    notes: 'Coffee shops and business district area',
    routeId: 2,
    routeOrder: 7,

    createdAt: new Date('2024-01-22').toISOString()
  },

  // Baltimore City 2 Locations (Route 3)
  {
    id: '21',
    name: 'HUM (Starting Point)',
    address: 'Baltimore City',
    type: 'Service Organization',
    notes: 'Health Care for Urban Minorities - route starting point',
    routeId: 3,
    routeOrder: 1,

    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '22',
    name: 'Presstman St Academy',
    address: 'Presstman St, Baltimore City',
    type: 'School Area',
    notes: 'School area with community connections',
    routeId: 3,
    routeOrder: 2,

    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '23',
    name: 'Gilmore/Payson (Corner Store)',
    address: 'Gilmore & Payson, Baltimore City',
    type: 'Corner Store',
    notes: 'Corner store at Gilmore and Payson intersection',
    routeId: 3,
    routeOrder: 3,

    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '24',
    name: 'University/Hospital Area',
    address: 'University area, Baltimore City',
    type: 'Medical District',
    notes: 'University and hospital district area',
    routeId: 3,
    routeOrder: 4,

    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '25',
    name: 'MLK Boulevard Area',
    address: 'MLK Boulevard, Baltimore City',
    type: 'Main Street',
    notes: 'Martin Luther King Jr. Boulevard corridor',
    routeId: 3,
    routeOrder: 5,

    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '26',
    name: 'Chase/Howard St Area',
    address: 'Chase & Howard St, Baltimore City',
    type: 'Intersection',
    notes: 'Chase and Howard Street intersection area',
    routeId: 3,
    routeOrder: 6,

    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '27',
    name: 'The Jungle (MLK)',
    address: 'MLK area, Baltimore City',
    type: 'Encampment',
    notes: 'Encampment area along MLK - approach with care',
    routeId: 3,
    routeOrder: 7,

    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '28',
    name: 'Pigtown Area',
    address: 'Pigtown, Baltimore City',
    type: 'Neighborhood',
    notes: 'Pigtown neighborhood connections',
    routeId: 3,
    routeOrder: 8,

    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '29',
    name: 'B&O Railroad Museum (Mt Clare)',
    address: 'W Cross St, Baltimore City',
    type: 'Museum Area',
    notes: 'B&O Railroad Museum and Mt Clare area',
    routeId: 3,
    routeOrder: 9,

    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '30',
    name: 'Pratt/MLK Intersection',
    address: 'Pratt St & MLK Blvd, Baltimore City',
    type: 'Intersection',
    notes: 'Major intersection with good visibility',
    routeId: 3,
    routeOrder: 10,

    createdAt: new Date('2024-01-25').toISOString()
  }
];

export const sampleRoutes = [
  {
    id: '1',
    name: 'AACo',
    description: 'Anne Arundel County outreach route covering Glen Burnie area businesses and key locations',
    locationIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
    estimatedDuration: 240,
    routeId: 1,
    routeOrder: 1,
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '2', 
    name: 'Baltimore City 1',
    description: 'Downtown Baltimore route focusing on service organizations and key gathering areas',
    locationIds: ['14', '15', '16', '17', '18', '19', '20'],
    estimatedDuration: 180,
    routeId: 1,
    routeOrder: 2,
    createdAt: new Date('2024-02-05').toISOString()
  },
  {
    id: '3',
    name: 'Baltimore City 2',
    description: 'Comprehensive Baltimore route starting at HUM, covering MLK corridor, Pigtown, and multiple neighborhoods',
    locationIds: ['21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
    estimatedDuration: 300,
    routeId: 1,
    routeOrder: 3,
    createdAt: new Date('2024-02-10').toISOString()
  }
];

// Friends with proper location assignments and location history
export const sampleFriends = [
  // AACo Route Friends (Route 1)
  {
    id: '1',
    name: 'Annette',
    email: null,
    phone: null,
    locationId: '6', // Annette's Location
    notes: 'Regular at her location near Church St area. Friendly and appreciative of outreach.',
    lastContact: new Date('2024-10-12').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 1,
    createdAt: new Date('2024-02-01').toISOString()
  },
  {
    id: '2',
    name: 'David',
    email: null,
    phone: null,
    locationId: '8', // Ollie's
    notes: 'Usually found at Ollie\'s store. Quiet but appreciative of check-ins.',
    lastContact: new Date('2024-10-11').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 2,
    createdAt: new Date('2024-02-05').toISOString()
  },
  {
    id: '3',
    name: 'Danielle',
    email: null,
    phone: null,
    locationId: '13', // Village Liquors/Church St
    notes: 'Regular near Village Liquors on Church St. Very social and connected to community.',
    lastContact: new Date('2024-10-13').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 3,
    createdAt: new Date('2024-02-08').toISOString()
  },
  {
    id: '4',
    name: 'Marcus',
    email: null,
    phone: null,
    locationId: '1', // Brusters
    notes: 'Often seen near Brusters ice cream shop. Enjoys conversation about local sports.',
    lastContact: new Date('2024-10-10').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 4,
    createdAt: new Date('2024-03-01').toISOString()
  },
  {
    id: '5',
    name: 'Jennifer',
    email: null,
    phone: null,
    locationId: '11', // Glen Burnie Plaza
    notes: 'Frequents the plaza area. Has been looking for housing assistance.',
    lastContact: new Date('2024-10-09').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 5,
    createdAt: new Date('2024-03-05').toISOString()
  },

  // Baltimore City 1 Friends (Route 2)
  {
    id: '6',
    name: 'Michael',
    email: null,
    phone: null,
    locationId: '16', // City Hall Park
    notes: 'Regular at City Hall Park. Very knowledgeable about city services.',
    lastContact: new Date('2024-10-08').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 6,
    createdAt: new Date('2024-02-12').toISOString()
  },
  {
    id: '7',
    name: 'Sarah J.',
    email: null,
    phone: null,
    locationId: '18', // HC4H
    notes: 'Often at HC4H for services. Has diabetes management needs.',
    lastContact: new Date('2024-10-07').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 7,
    createdAt: new Date('2024-02-15').toISOString()
  },
  {
    id: '8',
    name: 'Robert',
    email: null,
    phone: null,
    locationId: '17', // Fallsway Underpass
    notes: 'Stays near the underpass. Veteran with PTSD, approach gently.',
    lastContact: new Date('2024-10-06').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 8,
    createdAt: new Date('2024-03-01').toISOString()
  },
  {
    id: '9',
    name: 'Lisa M.',
    email: null,
    phone: null,
    locationId: '20', // Downtown Coffee District
    notes: 'Works odd jobs in the coffee district. Very resourceful.',
    lastContact: new Date('2024-10-05').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 9,
    createdAt: new Date('2024-03-10').toISOString()
  },

  // Baltimore City 2 Friends (Route 3)
  {
    id: '10',
    name: 'Calvin',
    email: null,
    phone: null,
    locationId: '24', // University/Hospital Area
    notes: 'University area regular. Former student, very intelligent.',
    lastContact: new Date('2024-10-04').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 10,
    createdAt: new Date('2024-02-20').toISOString()
  },
  {
    id: '11',
    name: 'Glen',
    email: null,
    phone: null,
    locationId: '25', // MLK Boulevard Area
    notes: 'MLK Boulevard regular. Part of the community network there.',
    lastContact: new Date('2024-10-03').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 11,
    createdAt: new Date('2024-03-01').toISOString()
  },
  {
    id: '12',
    name: 'Vernice',
    email: null,
    phone: null,
    locationId: '24', // University/Hospital Area
    notes: 'Often near hospital entrance. Kind and well-known in the area.',
    lastContact: new Date('2024-10-02').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 12,
    createdAt: new Date('2024-03-05').toISOString()
  },
  {
    id: '13',
    name: 'Brian',
    email: null,
    phone: null,
    locationId: '26', // Chase/Howard St Area
    notes: 'Chase/Howard intersection regular. Part of a small group there.',
    lastContact: new Date('2024-10-01').toISOString(),
    status: 'active',
    routeId: 1,
    routeOrder: 13,
    createdAt: new Date('2024-03-10').toISOString()
  },
  {
    id: '14',
    name: 'Peanut',
    email: null,
    phone: null,
    locationId: '29', // B&O Railroad Museum
    notes: 'B&O Museum area. Friendly and always has interesting stories.',
    lastContact: new Date('2024-09-30').toISOString(),
    status: 'active',
    routeId: 2,
    routeOrder: 1,
    createdAt: new Date('2024-03-15').toISOString()
  },
  {
    id: '15',
    name: 'Avery',
    email: null,
    phone: null,
    locationId: '30', // Pratt/MLK Intersection
    notes: 'Pratt/MLK intersection regular. Good visibility for outreach.',
    lastContact: new Date('2024-09-28').toISOString(),
    status: 'active',
    routeId: 2,
    routeOrder: 2,
    createdAt: new Date('2024-03-20').toISOString()
  }
];

// Friend location history (tracking where friends have been found over time)
export const sampleFriendLocationHistory = [
  // Annette's location history
  { id: '1', friendId: '1', locationId: '6', dateRecorded: new Date('2024-02-01T10:00:00').toISOString(), notes: 'First contact at her regular spot', recordedBy: '2' },
  { id: '2', friendId: '1', locationId: '6', dateRecorded: new Date('2024-03-15T11:30:00').toISOString(), notes: 'Still at same location, doing well', recordedBy: '3' },
  { id: '3', friendId: '1', locationId: '6', dateRecorded: new Date('2024-10-12T09:45:00').toISOString(), notes: 'Regular check-in, appreciative as always', recordedBy: '2' },

  // David's location history (sometimes moves between Ollie's and other stops)
  { id: '4', friendId: '2', locationId: '8', dateRecorded: new Date('2024-02-05T14:00:00').toISOString(), notes: 'Found at Ollie\'s, quiet but receptive', recordedBy: '1' },
  { id: '5', friendId: '2', locationId: '7', dateRecorded: new Date('2024-03-20T16:30:00').toISOString(), notes: 'Temporarily at Maisel Bros area', recordedBy: '3' },
  { id: '6', friendId: '2', locationId: '8', dateRecorded: new Date('2024-10-11T13:15:00').toISOString(), notes: 'Back at Ollie\'s, his preferred spot', recordedBy: '2' },

  // Danielle's location history
  { id: '7', friendId: '3', locationId: '13', dateRecorded: new Date('2024-02-08T15:45:00').toISOString(), notes: 'Very social, knows many people in the area', recordedBy: '1' },
  { id: '8', friendId: '3', locationId: '13', dateRecorded: new Date('2024-10-13T12:20:00').toISOString(), notes: 'Still in Village Liquors area, community connector', recordedBy: '3' },

  // Marcus's location history
  { id: '9', friendId: '4', locationId: '1', dateRecorded: new Date('2024-03-01T11:00:00').toISOString(), notes: 'Enjoys sports conversation, regular at Brusters', recordedBy: '2' },
  { id: '10', friendId: '4', locationId: '1', dateRecorded: new Date('2024-10-10T10:30:00').toISOString(), notes: 'Still at Brusters, talked about Ravens season', recordedBy: '1' },

  // Jennifer's location history
  { id: '11', friendId: '5', locationId: '11', dateRecorded: new Date('2024-02-15T13:30:00').toISOString(), notes: 'Looking for housing assistance, plaza area regular', recordedBy: '3' },
  { id: '12', friendId: '5', locationId: '11', dateRecorded: new Date('2024-10-09T14:45:00').toISOString(), notes: 'Still at plaza, housing search ongoing', recordedBy: '2' },

  // Michael's location history (Baltimore City)
  { id: '13', friendId: '6', locationId: '16', dateRecorded: new Date('2024-02-12T10:15:00').toISOString(), notes: 'City Hall Park regular, friendly and outgoing', recordedBy: '1' },
  { id: '14', friendId: '6', locationId: '16', dateRecorded: new Date('2024-10-08T11:30:00').toISOString(), notes: 'Still at park, good health, positive attitude', recordedBy: '3' },

  // Sarah J's location history
  { id: '15', friendId: '7', locationId: '18', dateRecorded: new Date('2024-02-18T09:00:00').toISOString(), notes: 'Connected with HC4H services, very appreciative', recordedBy: '2' },
  { id: '16', friendId: '7', locationId: '18', dateRecorded: new Date('2024-10-07T08:45:00').toISOString(), notes: 'Regular at HC4H, helping others navigate services', recordedBy: '1' },

  // Robert's location history (ID 8)
  { id: '17', friendId: '8', locationId: '3', dateRecorded: new Date('2024-02-20T14:30:00').toISOString(), notes: 'First contact at Metro Centre, reserved but friendly', recordedBy: '1' },
  { id: '18', friendId: '8', locationId: '3', dateRecorded: new Date('2024-10-06T15:15:00').toISOString(), notes: 'Regular at Metro Centre, warming up to outreach team', recordedBy: '2' },

  // Lisa M.'s location history (ID 9)
  { id: '19', friendId: '9', locationId: '4', dateRecorded: new Date('2024-02-22T12:00:00').toISOString(), notes: 'Found at Glen Burnie Plaza, looking for work opportunities', recordedBy: '3' },

  // Calvin's location history (ID 10)
  { id: '20', friendId: '10', locationId: '5', dateRecorded: new Date('2024-02-25T10:45:00').toISOString(), notes: 'Regular at Community Center, participates in programs', recordedBy: '2' },

  // Glen's location history (ID 11)
  { id: '21', friendId: '11', locationId: '9', dateRecorded: new Date('2024-03-01T13:20:00').toISOString(), notes: 'Found at Crofton area, new to the community', recordedBy: '1' },

  // Vernice's location history (ID 12)
  { id: '22', friendId: '12', locationId: '10', dateRecorded: new Date('2024-03-05T11:10:00').toISOString(), notes: 'Regular at Arundel Mills area, very social', recordedBy: '3' },

  // Brian's location history (ID 13)
  { id: '23', friendId: '13', locationId: '12', dateRecorded: new Date('2024-03-08T16:00:00').toISOString(), notes: 'Found at Linthicum Heights, quiet but appreciative', recordedBy: '2' },

  // Peanut's location history (ID 14)
  { id: '24', friendId: '14', locationId: '15', dateRecorded: new Date('2024-03-10T14:45:00').toISOString(), notes: 'Regular at Hanover area, well-known in community', recordedBy: '1' },

  // Avery's location history (ID 15)
  { id: '25', friendId: '15', locationId: '17', dateRecorded: new Date('2024-03-12T09:30:00').toISOString(), notes: 'Found at MLK area, connected with local services', recordedBy: '3' }
];

// Sample runs with proper route assignments
export const sampleRuns = [
  {
    id: 1,
    route_id: 1, // AACo Route
    name: 'AACo Friday 2025-10-24', // Auto-generated format
    scheduled_date: '2025-10-24',
    start_time: '09:00:00',
    end_time: null,
    meal_count: 35,
    status: 'scheduled',
    notes: 'Regular Friday run for Anne Arundel County route. Check with Annette, David, and Danielle.',
    created_by: 2, // John Coordinator
    created_at: new Date('2025-10-17T10:00:00').toISOString()
  },
  {
    id: 2,
    route_id: 2, // Baltimore City 1
    name: 'Baltimore City 1 Monday 2025-10-20', 
    scheduled_date: '2025-10-20',
    start_time: '10:00:00',
    end_time: null,
    meal_count: 40,
    status: 'scheduled',
    notes: 'Baltimore City 1 route. Focus on service organization connections.',
    created_by: 2, // John Coordinator
    created_at: new Date('2025-10-15T14:00:00').toISOString()
  },
  {
    id: 3,
    route_id: 3, // Baltimore City 2
    name: 'Baltimore City 2 Wednesday 2025-10-22',
    scheduled_date: '2025-10-22',
    start_time: '14:00:00',
    end_time: null,
    meal_count: 45,
    status: 'scheduled',
    notes: 'Afternoon run through MLK corridor and University area.',
    created_by: 1, // Admin User
    created_at: new Date('2025-10-16T09:00:00').toISOString()
  },
  {
    id: 4,
    route_id: 2, // Baltimore City 1
    name: 'Baltimore City 1 Wednesday 2025-10-15',
    scheduled_date: '2025-10-15',
    start_time: '10:00:00',
    end_time: '13:30:00',
    meal_count: 38,
    status: 'in_progress',
    notes: 'Currently running! Great turnout so far at Grace & Hope.',
    created_by: 2, // John Coordinator
    created_at: new Date('2025-10-14T16:00:00').toISOString()
  },
  {
    id: 5,
    route_id: 1, // AACo Route
    name: 'AACo Friday 2025-10-10',
    scheduled_date: '2025-10-10',
    start_time: '09:00:00',
    end_time: '13:15:00',
    meal_count: 32,
    status: 'completed',
    notes: 'Completed AACo run. David at Ollie\'s was particularly grateful for the winter items.',
    created_by: 2, // John Coordinator
    created_at: new Date('2025-10-08T11:00:00').toISOString()
  },
  {
    id: 6,
    route_id: 3, // Baltimore City 2
    name: 'Baltimore City 2 Monday 2025-10-06',
    scheduled_date: '2025-10-06',
    start_time: '14:00:00',
    end_time: '18:30:00',
    meal_count: 42,
    status: 'completed',
    notes: 'Excellent engagement at University area and MLK corridor. Calvin and Glen were very appreciative.',
    created_by: 1, // Admin User
    created_at: new Date('2025-10-04T13:00:00').toISOString()
  }
];

// Team members for runs - First added is the lead
export const sampleRunTeamMembers = [
  // Run 1 (AACo Friday 2025-10-24) - Scheduled
  { run_id: 1, user_id: 2, created_at: new Date('2025-10-17T10:01:00').toISOString() }, // John is lead (first)
  { run_id: 1, user_id: 3, created_at: new Date('2025-10-17T10:02:00').toISOString() }, // Sarah
  { run_id: 1, user_id: 1, created_at: new Date('2025-10-17T10:03:00').toISOString() }, // Admin
  
  // Run 2 (Baltimore City 1 Monday 2025-10-20) - Scheduled
  { run_id: 2, user_id: 1, created_at: new Date('2025-10-15T14:01:00').toISOString() }, // Admin is lead (first)
  { run_id: 2, user_id: 3, created_at: new Date('2025-10-15T14:02:00').toISOString() }, // Sarah
  
  // Run 3 (Baltimore City 2 Wednesday 2025-10-22) - Scheduled
  { run_id: 3, user_id: 3, created_at: new Date('2025-10-16T09:01:00').toISOString() }, // Sarah is lead (first)
  { run_id: 3, user_id: 2, created_at: new Date('2025-10-16T09:02:00').toISOString() }, // John
  
  // Run 4 (Baltimore City 1 Wednesday 2025-10-15) - In Progress
  { run_id: 4, user_id: 1, created_at: new Date('2025-10-14T16:01:00').toISOString() }, // Admin is lead (first)
  { run_id: 4, user_id: 2, created_at: new Date('2025-10-14T16:02:00').toISOString() }, // John
  
  // Run 5 (AACo Friday 2025-10-10) - Completed
  { run_id: 5, user_id: 2, created_at: new Date('2025-10-08T11:01:00').toISOString() }, // John is lead (first)
  { run_id: 5, user_id: 1, created_at: new Date('2025-10-08T11:02:00').toISOString() }, // Admin
  
  // Run 6 (Baltimore City 2 Monday 2025-10-06) - Completed
  { run_id: 6, user_id: 1, created_at: new Date('2025-10-04T13:01:00').toISOString() }, // Admin is lead (first)
  { run_id: 6, user_id: 3, created_at: new Date('2025-10-04T13:02:00').toISOString() }  // Sarah
];

// Requests that properly match friends at their actual locations
export const sampleRequests = [
  // AACo Route Requests (Route 1)
  {
    id: '1',
    friendId: '2', // David at Ollie's (location 8)
    locationId: '8', // Ollie's - matches David's location
    requestDate: new Date('2024-10-12T11:30:00').toISOString(),
    itemCategory: 'clothing',
    itemRequested: 'Winter jacket',
    itemDetails: 'Heavy winter coat, waterproof preferred',
    clothingSize: 'L',
    clothingGender: 'male',
    quantity: 1,
    urgency: 'high',
    status: 'delivered',
    specialInstructions: 'David prefers darker colors if available',
    takenByUserId: '1', // Admin User
    routeId: 1,
    routeOrder: 1,
    createdAt: new Date('2024-10-12T11:30:00').toISOString(),
    updatedAt: new Date('2024-10-15T10:00:00').toISOString()
  },
  {
    id: '2',
    friendId: '3', // Danielle at Village Liquors (location 13)
    locationId: '13', // Village Liquors/Church St - matches Danielle's location
    requestDate: new Date('2025-10-14T14:15:00').toISOString(),
    itemCategory: 'clothing',
    itemRequested: 'Professional interview attire',
    itemDetails: 'Blouse and dress pants for job interview',
    clothingSize: 'M',
    clothingGender: 'female',
    quantity: 1,
    urgency: 'high',
    status: 'ready_for_delivery',
    specialInstructions: 'Has job interview next week, needs professional clothing - conservative colors preferred',
    deliveryAttempts: 1,
    takenByUserId: '2', // John Coordinator
    routeId: 1,
    routeOrder: 2,
    createdAt: new Date('2025-10-14T14:15:00').toISOString(),
    updatedAt: new Date('2025-10-14T14:15:00').toISOString()
  },
  {
    id: '3',
    friendId: '5', // Jennifer at Glen Burnie Plaza (location 11)
    locationId: '11', // Glen Burnie Plaza - matches Jennifer's location
    requestDate: new Date('2025-10-13T09:45:00').toISOString(),
    itemCategory: 'non-clothing',
    itemRequested: 'Sleeping bag',
    itemDetails: 'Warm sleeping bag for cold weather, temperature rating -10°C preferred',
    clothingSize: null,
    clothingGender: null,
    quantity: 1,
    urgency: 'medium',
    status: 'pending',
    specialInstructions: 'Jennifer has been sleeping rough, winters are getting harsh.',
    deliveryAttempts: 0,
    takenByUserId: '3', // Sarah Volunteer
    routeId: 1,
    routeOrder: 3,
    createdAt: new Date('2025-10-13T16:20:00').toISOString(),
    updatedAt: new Date('2025-10-13T09:45:00').toISOString()
  },

  // Baltimore City 1 Requests (Route 2)
  {
    id: '4',
    friendId: '7', // Sarah J. at HC4H (location 18)
    locationId: '18', // HC4H - matches Sarah's location
    requestDate: new Date('2025-10-14T14:45:00').toISOString(),
    itemCategory: 'non-clothing',
    itemRequested: 'Diabetic supplies',
    itemDetails: 'Blood glucose test strips and lancets for diabetes management',
    clothingSize: null,
    clothingGender: null,
    quantity: 1,
    urgency: 'high',
    status: 'ready_for_delivery',
    specialInstructions: 'Sarah has diabetes and needs to monitor blood sugar regularly',
    deliveryAttempts: 0,
    takenByUserId: '1', // Admin User
    routeId: 1,
    routeOrder: 4,
    createdAt: new Date('2025-10-14T14:45:00').toISOString(),
    updatedAt: new Date('2025-10-14T14:45:00').toISOString()
  },
  {
    id: '5',
    friendId: '6', // Michael at City Hall Park (location 16)
    locationId: '16', // City Hall Park - matches Michael's location
    requestDate: new Date('2025-10-13T12:30:00').toISOString(),
    itemCategory: 'clothing',
    itemRequested: 'Thermal underwear',
    itemDetails: 'Long sleeve thermal shirt and thermal pants',
    clothingSize: 'XL',
    clothingGender: 'male',
    quantity: 2,
    urgency: 'medium',
    status: 'taken',
    specialInstructions: 'Michael spends long hours outside, needs base layers for warmth',
    deliveryAttempts: 0,
    takenByUserId: '3', // Sarah Volunteer
    routeId: 1,
    routeOrder: 5,
    createdAt: new Date('2025-10-13T12:30:00').toISOString(),
    updatedAt: new Date('2025-10-13T12:30:00').toISOString()
  },

  // Baltimore City 2 Requests (Route 3)
  {
    id: '6',
    friendId: '10', // Calvin at University/Hospital Area (location 24)
    locationId: '24', // University/Hospital Area - matches Calvin's location
    requestDate: new Date('2025-10-12T16:00:00').toISOString(),
    itemCategory: 'non-clothing',
    itemRequested: 'Personal hygiene kit',
    itemDetails: 'Toothbrush, toothpaste, shampoo, soap, and deodorant',
    clothingSize: null,
    clothingGender: null,
    quantity: 1,
    urgency: 'low',
    status: 'ready_for_delivery',
    specialInstructions: 'Calvin is very particular about hygiene - travel-size items preferred',
    deliveryAttempts: 1,
    takenByUserId: '1', // Admin User
    routeId: 1,
    routeOrder: 6,
    createdAt: new Date('2025-10-12T16:00:00').toISOString(),
    updatedAt: new Date('2025-10-13T08:00:00').toISOString()
  },
  {
    id: '7',
    friendId: '11', // Glen at MLK Boulevard Area (location 25)
    locationId: '25', // MLK Boulevard Area - matches Glen's location
    requestDate: new Date('2025-10-13T10:00:00').toISOString(),
    itemCategory: 'clothing',
    itemRequested: 'Work boots',
    itemDetails: 'Steel toe boots for construction work',
    clothingSize: '10',
    clothingGender: 'male',
    quantity: 1,
    urgency: 'medium',
    status: 'taken',
    specialInstructions: 'Glen got a construction job opportunity, needs safety boots',
    deliveryAttempts: 0,
    takenByUserId: '2', // John Coordinator
    routeId: 1,
    routeOrder: 7,
    createdAt: new Date('2025-10-13T10:00:00').toISOString(),
    updatedAt: new Date('2025-10-13T10:00:00').toISOString()
  },
  {
    id: '8',
    friendId: '14', // Peanut at B&O Railroad Museum (location 29)
    locationId: '29', // B&O Railroad Museum - matches Peanut's location
    requestDate: new Date('2025-10-12T11:30:00').toISOString(),
    itemCategory: 'non-clothing', 
    itemRequested: 'Bus pass',
    itemDetails: 'Monthly transit pass for getting to medical appointments',
    clothingSize: null,
    clothingGender: null,
    quantity: 1,
    urgency: 'high',
    status: 'delivered',
    specialInstructions: 'Peanut has regular medical appointments downtown',
    deliveryAttempts: 1,
    takenByUserId: '1', // Admin User
    routeId: 1,
    routeOrder: 8,
    createdAt: new Date('2025-10-12T11:30:00').toISOString(),
    updatedAt: new Date('2025-10-13T15:30:00').toISOString()
  },
  {
    id: '9',
    friendId: '15', // Avery at Pratt/MLK Intersection (location 30)
    locationId: '30', // Pratt/MLK Intersection - matches Avery's location
    requestDate: new Date('2025-10-11T14:00:00').toISOString(),
    itemCategory: 'clothing',
    itemRequested: 'Winter coat',
    itemDetails: 'Heavy winter coat for cold weather',
    clothingSize: 'L',
    clothingGender: 'male',
    quantity: 1,
    urgency: 'high',
    status: 'delivered',
    specialInstructions: 'Avery is exposed to weather at the intersection, needs warm coat',
    deliveryAttempts: 2,
    takenByUserId: '3', // Sarah Volunteer
    routeId: 1,
    routeOrder: 9,
    createdAt: new Date('2025-10-11T14:00:00').toISOString(),
    updatedAt: new Date('2025-10-12T16:45:00').toISOString()
  }
];

// Clean delivery attempts that match the corrected requests
export const sampleDeliveryAttempts = [
  {
    id: '1',
    requestId: '1', // David's winter jacket
    attemptDate: new Date('2024-10-15T10:00:00').toISOString(),
    locationId: '8', // Ollie's - David's location
    userId: '1', // Admin User
    outcome: 'delivered',
    notes: 'Found David at Ollie\'s as usual. Very grateful for the jacket.',
    routeId: 1,
    routeOrder: 1,
    createdAt: new Date('2024-10-15T10:00:00').toISOString()
  },
  {
    id: '2',
    requestId: '2', // Danielle's interview attire - unsuccessful attempt
    attemptDate: new Date('2025-10-14T11:00:00').toISOString(),
    locationId: '13', // Village Liquors/Church St
    userId: '2', // John Coordinator
  outcome: 'not_delivered',
    notes: 'Checked around Village Liquors and Church St area. Will try again later.',
    routeId: 1,
    routeOrder: 2,
    createdAt: new Date('2025-10-14T11:00:00').toISOString()
  },
  {
    id: '3',
    requestId: '6', // Calvin's hygiene kit - unsuccessful attempt
    attemptDate: new Date('2025-10-12T17:00:00').toISOString(),
    locationId: '24', // University/Hospital Area
    userId: '1', // Admin User
  outcome: 'not_delivered',
    notes: 'Calvin was at university area but in a meeting. Did not want to interrupt.',
    routeId: 1,
    routeOrder: 3,
    createdAt: new Date('2025-10-12T17:00:00').toISOString()
  },
  {
    id: '4',
    requestId: '8', // Peanut's bus pass - successful delivery
    attemptDate: new Date('2025-10-13T15:30:00').toISOString(),
    locationId: '29', // B&O Railroad Museum
    userId: '1', // Admin User
    outcome: 'delivered',
    notes: 'Found Peanut near the museum. He was very excited about the bus pass for his appointments.',
    routeId: 1,
    routeOrder: 4,
    createdAt: new Date('2025-10-13T15:30:00').toISOString()
  },
  {
    id: '5',
    requestId: '9', // Avery's winter coat - first unsuccessful attempt
    attemptDate: new Date('2025-10-12T14:30:00').toISOString(),
    locationId: '30', // Pratt/MLK Intersection
    userId: '3', // Sarah Volunteer
  outcome: 'not_delivered',
    notes: 'Checked Pratt/MLK intersection. Avery may have left for the day.',
    routeId: 1,
    routeOrder: 5,
    createdAt: new Date('2025-10-12T14:30:00').toISOString()
  },
  {
    id: '6',
    requestId: '9', // Avery's winter coat - successful delivery
    attemptDate: new Date('2025-10-12T16:45:00').toISOString(),
    locationId: '30', // Pratt/MLK Intersection
    userId: '3', // Sarah Volunteer
    outcome: 'delivered',
    notes: 'Found Avery at the intersection during evening. He was very grateful for the warm coat.',
    routeId: 1,
    routeOrder: 6,
    createdAt: new Date('2025-10-12T16:45:00').toISOString()
  }
];


