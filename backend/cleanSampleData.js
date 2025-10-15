// Clean Sample data for Friends CRM
// Proper relationships: Friend → Location → Route ← Run
// All data relationships are logically consistent

export const sampleUsers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@friendsoutreach.org',
    phone: '555-0101',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
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
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
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
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
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
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '2', 
    name: 'Mike\'s Sunset',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Business',
    notes: 'Local establishment on AACo route',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '3',
    name: 'Behind LaFontaine Bleu',
    address: 'Glen Burnie, Anne Arundel County', 
    type: 'Residential Area',
    notes: 'Behind apartment complex, check for friends',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '4',
    name: 'Caroll Fuels',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Gas Station',
    notes: 'Gas station stop on AACo route',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '5',
    name: 'Dunkin Donuts (AACo)',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Restaurant',
    notes: 'Coffee shop stop, good for morning connections',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '6',
    name: 'Annette\'s Location',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Personal',
    notes: 'Annette\'s regular location',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '7',
    name: 'Maisel Bros',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Business',
    notes: 'Industrial area stop on AACo route',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '8',
    name: 'Ollie\'s',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Store',
    notes: 'David\'s regular location at the store',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '9',
    name: 'New Hampshire Avenue',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Street Area',
    notes: 'Regular stops along New Hampshire Avenue',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '10',
    name: 'Ritchie Highway Area',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Highway Area',
    notes: 'Stops along Ritchie Highway corridor',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '11',
    name: 'Glen Burnie Plaza',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Shopping Center',
    notes: 'Shopping plaza with multiple friend connections',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '12',
    name: 'Marley Station Area',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Shopping Area',
    notes: 'Near Marley Station mall, good foot traffic',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '13',
    name: 'Village Liquors/Church St (Danielle)',
    address: 'Church St, Anne Arundel County',
    type: 'Business',
    notes: 'Danielle\'s regular location near Village Liquors',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },

  // Baltimore City 1 Locations (Route 2)
  {
    id: '14',
    name: 'O Lot',
    address: 'Baltimore City',
    type: 'Parking Area',
    notes: 'Starting point for Baltimore City 1 route',
    routeId: '2',
    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '15',
    name: 'Grace & Hope Mission',
    address: 'Gay St, Baltimore City',
    type: 'Service Organization',
    notes: 'On Gay St on way to City Hall Park',
    routeId: '2',
    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '16',
    name: 'City Hall Park',
    address: 'Baltimore City',
    type: 'Public Space',
    notes: 'Central park area, good gathering spot',
    routeId: '2',
    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '17',
    name: 'Fallsway Underpass',
    address: 'Fallsway, Baltimore City',
    type: 'Underpass',
    notes: 'Check underpass area for friends seeking shelter',
    routeId: '2',
    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '18',
    name: 'HC4H',
    address: 'Baltimore City',
    type: 'Service Organization',
    notes: 'Healthcare for the Homeless location',
    routeId: '2',
    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '19',
    name: 'St. Vincent',
    address: 'Baltimore City',
    type: 'Service Organization',
    notes: 'St. Vincent de Paul services',
    routeId: '2',
    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '20',
    name: 'Downtown Coffee District',
    address: 'Baltimore City',
    type: 'Commercial Area',
    notes: 'Coffee shops and business district area',
    routeId: '2',
    createdAt: new Date('2024-01-22').toISOString()
  },

  // Baltimore City 2 Locations (Route 3)
  {
    id: '21',
    name: 'HUM (Starting Point)',
    address: 'Baltimore City',
    type: 'Service Organization',
    notes: 'Health Care for Urban Minorities - route starting point',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '22',
    name: 'Presstman St Academy',
    address: 'Presstman St, Baltimore City',
    type: 'School Area',
    notes: 'School area with community connections',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '23',
    name: 'Gilmore/Payson (Corner Store)',
    address: 'Gilmore & Payson, Baltimore City',
    type: 'Corner Store',
    notes: 'Corner store at Gilmore and Payson intersection',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '24',
    name: 'University/Hospital Area',
    address: 'University area, Baltimore City',
    type: 'Medical District',
    notes: 'University and hospital district area',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '25',
    name: 'MLK Boulevard Area',
    address: 'MLK Boulevard, Baltimore City',
    type: 'Main Street',
    notes: 'Martin Luther King Jr. Boulevard corridor',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '26',
    name: 'Chase/Howard St Area',
    address: 'Chase & Howard St, Baltimore City',
    type: 'Intersection',
    notes: 'Chase and Howard Street intersection area',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '27',
    name: 'The Jungle (MLK)',
    address: 'MLK area, Baltimore City',
    type: 'Encampment',
    notes: 'Encampment area along MLK - approach with care',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '28',
    name: 'Pigtown Area',
    address: 'Pigtown, Baltimore City',
    type: 'Neighborhood',
    notes: 'Pigtown neighborhood connections',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '29',
    name: 'B&O Railroad Museum (Mt Clare)',
    address: 'W Cross St, Baltimore City',
    type: 'Museum Area',
    notes: 'B&O Railroad Museum and Mt Clare area',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '30',
    name: 'Pratt/MLK Intersection',
    address: 'Pratt St & MLK Blvd, Baltimore City',
    type: 'Intersection',
    notes: 'Major intersection with good visibility',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  }
];

export const sampleRoutes = [
  {
    id: '1',
    name: 'AACo Route',
    description: 'Anne Arundel County outreach route covering Glen Burnie area businesses and key locations',
    locationIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
    estimatedDuration: 240,
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '2', 
    name: 'Baltimore City 1',
    description: 'Downtown Baltimore route focusing on service organizations and key gathering areas',
    locationIds: ['14', '15', '16', '17', '18', '19', '20'],
    estimatedDuration: 180,
    createdAt: new Date('2024-02-05').toISOString()
  },
  {
    id: '3',
    name: 'Baltimore City 2',
    description: 'Comprehensive Baltimore route starting at HUM, covering MLK corridor, Pigtown, and multiple neighborhoods',
    locationIds: ['21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
    estimatedDuration: 300,
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
    createdAt: new Date('2024-03-20').toISOString()
  }
];

// Sample runs with proper route assignments
export const sampleRuns = [
  {
    id: '1',
    routeId: '2', // Baltimore City 1
    leadId: '1', // Admin User leading
    coordinatorId: '2', // John Coordinator created the run
    assignedUserIds: ['1', '3'], // Admin User and Sarah Volunteer
    scheduledDate: new Date('2024-10-20T09:00:00').toISOString(), // Upcoming run
    mealsCount: 30,
    coordinatorNotes: 'Baltimore City 1 route. Focus on service organization connections.',
    status: 'scheduled',
    currentLocationIndex: 0,
    actualDuration: null,
    leadNotes: null,
    contactsMade: null,
    completedAt: null,
    createdAt: new Date('2024-10-12').toISOString()
  },
  {
    id: '2',
    routeId: '1', // AACo Route
    leadId: '3', // Sarah Volunteer leading
    coordinatorId: '2', // John Coordinator coordinating
    assignedUserIds: ['3', '2'], // Sarah Volunteer and John Coordinator
    scheduledDate: new Date('2024-10-18T11:00:00').toISOString(), // Upcoming run
    mealsCount: 35,
    coordinatorNotes: 'Anne Arundel County route. Check with Annette, David, and Danielle.',
    status: 'scheduled',
    currentLocationIndex: 0,
    actualDuration: null,
    leadNotes: null,
    contactsMade: null,
    completedAt: null,
    createdAt: new Date('2024-10-10').toISOString()
  },
  {
    id: '3',
    routeId: '3', // Baltimore City 2 - Completed Run
    leadId: '1', // Admin User led this run
    coordinatorId: '2', // John Coordinator coordinated
    assignedUserIds: ['1', '2'], // Admin User and John Coordinator
    scheduledDate: new Date('2024-10-10T14:00:00').toISOString(), // Past completed run
    mealsCount: 40,
    coordinatorNotes: 'Successful Baltimore City 2 run. Great turnout at MLK area.',
    status: 'completed',
    currentLocationIndex: 10, // Completed all locations
    actualDuration: 285, // Slightly under estimated time
    leadNotes: 'Excellent engagement at University area and MLK corridor. Calvin and Glen were very appreciative.',
    contactsMade: 18,
    completedAt: new Date('2024-10-10T18:45:00').toISOString(),
    createdAt: new Date('2024-10-08').toISOString()
  },
  {
    id: '4',
    routeId: '1', // AACo Route - Another completed run
    leadId: '2', // John Coordinator leading
    coordinatorId: '2', // John Coordinator also coordinated
    assignedUserIds: ['2', '1'], // John Coordinator and Admin User
    scheduledDate: new Date('2024-10-05T09:30:00').toISOString(), // Past run
    mealsCount: 32,
    coordinatorNotes: 'Follow-up AACo run. Focus on Danielle and David connections.',
    status: 'completed',
    currentLocationIndex: 13, // Completed all locations
    actualDuration: 245,
    leadNotes: 'Good connections made. David at Ollie\'s was particularly grateful for the winter items.',
    contactsMade: 12,
    completedAt: new Date('2024-10-05T13:35:00').toISOString(),
    createdAt: new Date('2024-10-03').toISOString()
  },
  {
    id: '5',
    routeId: '3', // Baltimore City 2 - Today's In-Progress Run
    leadId: '1', // Admin User leading
    coordinatorId: '2', // John Coordinator coordinating
    assignedUserIds: ['1', '3'], // Admin User and Sarah Volunteer
    scheduledDate: new Date('2025-10-15T14:00:00').toISOString(), // Today - in progress
    mealsCount: 40,
    coordinatorNotes: 'Active Baltimore City 2 run! Focus on MLK corridor and University area connections.',
    status: 'in_progress',
    currentLocationIndex: 4, // Currently at MLK Boulevard Area (location 25)
    actualDuration: null,
    leadNotes: null,
    contactsMade: null,
    completedAt: null,
    createdAt: new Date('2025-10-14').toISOString()
  }
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
    createdAt: new Date('2024-10-15T10:00:00').toISOString()
  },
  {
    id: '2',
    requestId: '2', // Danielle's interview attire - unsuccessful attempt
    attemptDate: new Date('2025-10-14T11:00:00').toISOString(),
    locationId: '13', // Village Liquors/Church St
    userId: '2', // John Coordinator
    outcome: 'not_found',
    notes: 'Checked around Village Liquors and Church St area. Will try again later.',
    createdAt: new Date('2025-10-14T11:00:00').toISOString()
  },
  {
    id: '3',
    requestId: '6', // Calvin's hygiene kit - unsuccessful attempt
    attemptDate: new Date('2025-10-12T17:00:00').toISOString(),
    locationId: '24', // University/Hospital Area
    userId: '1', // Admin User
    outcome: 'not_available',
    notes: 'Calvin was at university area but in a meeting. Did not want to interrupt.',
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
    createdAt: new Date('2025-10-13T15:30:00').toISOString()
  },
  {
    id: '5',
    requestId: '9', // Avery's winter coat - first unsuccessful attempt
    attemptDate: new Date('2025-10-12T14:30:00').toISOString(),
    locationId: '30', // Pratt/MLK Intersection
    userId: '3', // Sarah Volunteer
    outcome: 'not_found',
    notes: 'Checked Pratt/MLK intersection. Avery may have left for the day.',
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
    createdAt: new Date('2025-10-12T16:45:00').toISOString()
  }
];