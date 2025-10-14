// Sample data for Friends CRM
// This provides realistic demo data for users to explore the application

export const sampleUsers = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    phone: '555-0101',
    role: 'Team Lead',
    permissions: ['coordinate_runs', 'lead_runs', 'assign_users', 'view_reports'],
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: '2', 
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    phone: '555-0102',
    role: 'Outreach Coordinator',
    permissions: ['coordinate_runs', 'lead_runs', 'assign_users', 'manage_routes'],
    createdAt: new Date('2024-02-01').toISOString()
  },
  {
    id: '3',
    name: 'Mike Torres',
    email: 'mike.t@example.com', 
    phone: '555-0103',
    role: 'Volunteer',
    permissions: ['participate_runs', 'view_assignments'],
    createdAt: new Date('2024-02-10').toISOString()
  },
  {
    id: '4',
    name: 'Jessica Park',
    email: 'jessica.p@example.com',
    phone: '555-0104', 
    role: 'Team Member',
    permissions: ['lead_runs', 'participate_runs', 'view_assignments'],
    createdAt: new Date('2024-02-15').toISOString()
  }
];

export const sampleLocations = [
  // AACo Route Locations
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
    notes: 'Local business on AACo route',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '8',
    name: 'Ollie\'s (David)',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Store',
    notes: 'David\'s location at Ollie\'s store',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '9',
    name: 'Chesapeake/Ordnance Rd',
    address: 'Chesapeake & Ordnance Rd, Anne Arundel County',
    type: 'Intersection',
    notes: 'Key intersection stop on AACo route',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '10',
    name: 'Golden Corral',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Restaurant',
    notes: 'Buffet restaurant, check parking area',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '11',
    name: 'Roses',
    address: 'Glen Burnie, Anne Arundel County',
    type: 'Store',
    notes: 'Discount store on AACo route',
    routeId: '1',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '12',
    name: 'Royal Farms (Potee St.)',
    address: 'Potee St, Anne Arundel County',
    type: 'Convenience Store',
    notes: 'Gas station and convenience store',
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

  // Baltimore City 1 Locations
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
    type: 'Church/Service',
    notes: 'St. Vincent de Paul services',
    routeId: '2',
    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '20',
    name: 'Shot Tower',
    address: 'Baltimore City',
    type: 'Landmark',
    notes: 'Historic Shot Tower area',
    routeId: '2',
    createdAt: new Date('2024-01-22').toISOString()
  },

  // Baltimore City 2 Locations
  {
    id: '21',
    name: 'The HUM',
    address: 'Baltimore City',
    type: 'Service Organization',
    notes: 'Starting point for Baltimore City 2 route',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '22',
    name: 'Holocaust Park',
    address: 'Lombard St, Baltimore City',
    type: 'Memorial Park',
    notes: 'Stop at Holocaust memorial park',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '23',
    name: 'CFG Location',
    address: 'Baltimore City',
    type: 'Service Area',
    notes: 'Check for friends at CFG',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '24',
    name: 'Green St (University)',
    address: 'Green St, Baltimore City',
    type: 'University Area',
    notes: 'Near university, look for friends',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '25',
    name: 'MLK Boulevard Area',
    address: 'Martin Luther King Jr Blvd, Baltimore City',
    type: 'Main Street',
    notes: 'Look for Glen, Alex, Shawn, Wayne, Krystal along MLK',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '26',
    name: 'Chase/Howard St',
    address: 'Chase St & Howard St, Baltimore City',
    type: 'Intersection',
    notes: 'Look for Brian, Fish, Ray in this area',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '27',
    name: 'The Jungle',
    address: 'MLK Boulevard, Baltimore City',
    type: 'Encampment Area',
    notes: 'Look for signs of life, Liam, John, Joe, Reece',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '28',
    name: 'Pigtown Area',
    address: 'Washington Blvd, Baltimore City',
    type: 'Neighborhood',
    notes: 'Pigtown neighborhood outreach area',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '29',
    name: 'B&O Railroad Museum (Mt Clare)',
    address: 'W Cross St, Baltimore City',
    type: 'Museum Area',
    notes: 'Look for Peanut, Miranda & Mike, Lisa',
    routeId: '3',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '30',
    name: 'Pratt/MLK Intersection',
    address: 'Pratt St & MLK Blvd, Baltimore City',
    type: 'Intersection',
    notes: 'Look for Avery at this intersection',
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
    description: 'Comprehensive Baltimore route starting at HUM, covering MLK corridor, Pigtown, and multiple neighborhoods with specific friend locations',
    locationIds: ['21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
    estimatedDuration: 300,
    createdAt: new Date('2024-02-10').toISOString()
  }
];

export const sampleFriends = [
  // AACo Route Friends
  {
    id: '1',
    name: 'Annette',
    email: null,
    phone: null,
    locationId: '6',
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
    locationId: '8',
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
    locationId: '13',
    notes: 'Regular near Village Liquors on Church St. Very social and connected to community.',
    lastContact: new Date('2024-10-13').toISOString(),
    status: 'active',
    createdAt: new Date('2024-02-08').toISOString()
  },

  // Baltimore City Route Friends
  {
    id: '4',
    name: 'Calvin',
    email: null,
    phone: null,
    locationId: '24',
    notes: 'Look for Calvin on left after light on Green St near university.',
    lastContact: new Date('2024-10-10').toISOString(),
    status: 'active',
    createdAt: new Date('2024-02-12').toISOString()
  },
  {
    id: '5',
    name: 'Ms. Vernice',
    email: null,
    phone: null,
    locationId: '24',
    notes: 'Usually on right at ER entrance. Very kind and well-known in the area.',
    lastContact: new Date('2024-10-09').toISOString(),
    status: 'active',
    createdAt: new Date('2024-02-15').toISOString()
  },
  {
    id: '6',
    name: 'Glen',
    email: null,
    phone: null,
    locationId: '25',
    notes: 'One of the MLK Boulevard regulars. Look for him along with Alex, Shawn, Wayne, and Krystal.',
    lastContact: new Date('2024-10-08').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-01').toISOString()
  },
  {
    id: '7',
    name: 'Alex',
    email: null,
    phone: null,
    locationId: '25',
    notes: 'MLK Boulevard area friend. Part of the regular group.',
    lastContact: new Date('2024-10-08').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-01').toISOString()
  },
  {
    id: '8',
    name: 'Shawn',
    email: null,
    phone: null,
    locationId: '25',
    notes: 'MLK Boulevard regular. Friendly and outgoing.',
    lastContact: new Date('2024-10-07').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-02').toISOString()
  },
  {
    id: '9',
    name: 'Wayne',
    email: null,
    phone: null,
    locationId: '25',
    notes: 'MLK Boulevard area friend. Reliable presence in the community.',
    lastContact: new Date('2024-10-08').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-02').toISOString()
  },
  {
    id: '10',
    name: 'Krystal',
    email: null,
    phone: null,
    locationId: '25',
    notes: 'MLK Boulevard regular. Part of the core group.',
    lastContact: new Date('2024-10-06').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-03').toISOString()
  },
  {
    id: '11',
    name: 'Brian',
    email: null,
    phone: null,
    locationId: '26',
    notes: 'Chase/Howard St area friend. Look for him with Fish and Ray.',
    lastContact: new Date('2024-10-05').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-05').toISOString()
  },
  {
    id: '12',
    name: 'Fish',
    email: null,
    phone: null,
    locationId: '26',
    notes: 'Chase/Howard St area. Part of Brian and Ray\'s group.',
    lastContact: new Date('2024-10-05').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-05').toISOString()
  },
  {
    id: '13',
    name: 'Ray',
    email: null,
    phone: null,
    locationId: '26',
    notes: 'Chase/Howard St area friend. Usually with Brian and Fish.',
    lastContact: new Date('2024-10-04').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-06').toISOString()
  },
  {
    id: '14',
    name: 'Liam',
    email: null,
    phone: null,
    locationId: '27',
    notes: 'The Jungle area on MLK. Check for signs of life.',
    lastContact: new Date('2024-10-03').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-10').toISOString()
  },
  {
    id: '15',
    name: 'John',
    email: null,
    phone: null,
    locationId: '27',
    notes: 'The Jungle area friend. Part of the encampment community.',
    lastContact: new Date('2024-10-03').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-10').toISOString()
  },
  {
    id: '16',
    name: 'Joe',
    email: null,
    phone: null,
    locationId: '27',
    notes: 'The Jungle area friend. Regular in the community.',
    lastContact: new Date('2024-10-02').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-11').toISOString()
  },
  {
    id: '17',
    name: 'Reece',
    email: null,
    phone: null,
    locationId: '27',
    notes: 'The Jungle area friend. Look for signs of life.',
    lastContact: new Date('2024-10-02').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-11').toISOString()
  },
  {
    id: '18',
    name: 'Peanut',
    email: null,
    phone: null,
    locationId: '29',
    notes: 'B&O Railroad Museum area. Look for him with Miranda, Mike, and Lisa.',
    lastContact: new Date('2024-10-01').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-15').toISOString()
  },
  {
    id: '19',
    name: 'Miranda',
    email: null,
    phone: null,
    locationId: '29',
    notes: 'B&O Railroad Museum area with Peanut, Mike, and Lisa.',
    lastContact: new Date('2024-10-01').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-15').toISOString()
  },
  {
    id: '20',
    name: 'Mike (Mt Clare)',
    email: null,
    phone: null,
    locationId: '29',
    notes: 'B&O Railroad Museum area friend. Part of the Mt Clare group.',
    lastContact: new Date('2024-09-30').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-16').toISOString()
  },
  {
    id: '21',
    name: 'Lisa (Mt Clare)',
    email: null,
    phone: null,
    locationId: '29',
    notes: 'B&O Railroad Museum area. Part of the Mt Clare community.',
    lastContact: new Date('2024-09-30').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-16').toISOString()
  },
  {
    id: '22',
    name: 'Avery',
    email: null,
    phone: null,
    locationId: '30',
    notes: 'Pratt/MLK intersection regular. Usually at this busy intersection.',
    lastContact: new Date('2024-09-28').toISOString(),
    status: 'active',
    createdAt: new Date('2024-03-20').toISOString()
  }
];

export const sampleRuns = [
  {
    id: '1',
    routeId: '2', // Baltimore City 1
    leadId: '1', // Lead user
    coordinatorId: '2', // Coordinator who created the run
    assignedUserIds: ['1', '3'], // Team members assigned to this run
    scheduledDate: new Date('2024-10-20T09:00:00').toISOString(), // Upcoming run
    mealsCount: 30,
    coordinatorNotes: 'Baltimore City 1 route. Focus on service organization connections. Check HC4H and St. Vincent.',
    status: 'scheduled', // scheduled, in_progress, completed, cancelled
    currentLocationIndex: 0, // For tracking progress through route
    // Post-run data (null for scheduled runs)
    actualDuration: null,
    leadNotes: null,
    contactsMade: null,
    completedAt: null,
    createdAt: new Date('2024-10-12').toISOString()
  },
  {
    id: '2',
    routeId: '1', // AACo Route
    leadId: '4',
    coordinatorId: '2',
    assignedUserIds: ['4', '3'],
    scheduledDate: new Date('2024-10-18T11:00:00').toISOString(), // Upcoming run
    mealsCount: 35,
    coordinatorNotes: 'Anne Arundel County route. Check in with Annette, David, and Danielle at their regular spots.',
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
    routeId: '3',
    leadId: '1',
    coordinatorId: '1', // Alex coordinated his own run
    assignedUserIds: ['1', '4'],
    scheduledDate: new Date('2024-10-12T10:00:00').toISOString(),
    mealsCount: 45,
    coordinatorNotes: 'Baltimore City 2 comprehensive route. Check MLK corridor and Pigtown areas.',
    status: 'completed',
    currentLocationIndex: 10, // Completed all locations
    // Post-run data
    actualDuration: 280,
    leadNotes: 'Excellent connections with MLK regulars. Found Liam and John at The Jungle. Peanut group doing well at B&O area.',
    contactsMade: 12,
    completedAt: new Date('2024-10-12T14:40:00').toISOString(),
    createdAt: new Date('2024-10-08').toISOString()
  },
  {
    id: '4',
    routeId: '1', // AACo Route
    leadId: '4',
    coordinatorId: '2',
    assignedUserIds: ['4', '1'],
    scheduledDate: new Date('2024-10-22T09:30:00').toISOString(), // Future run
    mealsCount: 32,
    coordinatorNotes: 'Follow-up AACo run. Focus on Danielle and David connections.',
    status: 'scheduled',
    currentLocationIndex: 0,
    actualDuration: null,
    leadNotes: null,
    contactsMade: null,
    completedAt: null,
    createdAt: new Date('2024-10-13').toISOString()
  },
  {
    id: '5',
    routeId: '3', // Baltimore City 2 - Today's In-Progress Run
    leadId: '1',
    coordinatorId: '2',
    assignedUserIds: ['1', '3', '4'],
    scheduledDate: new Date('2025-10-14T14:00:00').toISOString(), // Today - in progress
    mealsCount: 40,
    coordinatorNotes: 'Active Baltimore City 2 run! Focus on MLK corridor and Pigtown connections.',
    status: 'in_progress',
    currentLocationIndex: 4, // Currently partway through the comprehensive route
    actualDuration: null,
    leadNotes: null,
    contactsMade: null,
    completedAt: null,
    createdAt: new Date('2025-10-12').toISOString()
  }
];

export const sampleRequests = [
  {
    id: '1',
    friendId: '2', // Emma Thompson
    runId: '3', // Completed weekend park run
    locationId: '3', // Riverside Park
    requestDate: new Date('2024-03-10T11:30:00').toISOString(),
    itemCategory: 'clothing', // 'clothing' or 'non-clothing'
    itemRequested: 'Winter jacket',
    itemDetails: 'Heavy winter coat, waterproof preferred',
    clothingSize: 'M',
    clothingGender: 'female',
    quantity: 1,
    urgency: 'high',
    status: 'delivered',
    specialInstructions: 'Prefers darker colors if available',
    takenByUserId: '1', // Alex Johnson
    createdAt: new Date('2024-03-10T11:30:00').toISOString(),
    updatedAt: new Date('2024-03-15T10:00:00').toISOString()
  },
  {
    id: '2',
    friendId: '4', // Lisa Garcia
    runId: '5', // Today's in-progress run
    locationId: '2', // University Campus
    requestDate: new Date('2025-10-13T14:15:00').toISOString(),
    itemCategory: 'clothing',
    itemRequested: 'Professional interview attire',
    itemDetails: 'Blouse and dress pants for job interview',
    clothingSize: 'S',
    clothingGender: 'female',
    quantity: 1,
    urgency: 'high',
    status: 'ready_for_delivery',
    specialInstructions: 'Has job interview next week, needs professional clothing - conservative colors preferred',
    deliveryAttempts: 1, // Has had one unsuccessful attempt
    takenByUserId: '1', // Alex Johnson
    createdAt: new Date('2025-10-13T14:15:00').toISOString(),
    updatedAt: new Date('2025-10-13T14:15:00').toISOString()
  },
  {
    id: '3',
    friendId: '6', // Glen (MLK Boulevard regular)
    runId: '1', // Scheduled Baltimore City 1 run
    locationId: '25', // MLK Boulevard Area
    requestDate: new Date('2024-10-15T09:45:00').toISOString(),
    itemCategory: 'non-clothing',
    itemRequested: 'Sleeping bag',
    itemDetails: 'Warm sleeping bag for cold weather, temperature rating -10°C preferred',
    clothingSize: null,
    clothingGender: null,
    quantity: 1,
    urgency: 'medium',
    status: 'pending',
    specialInstructions: 'Glen is one of the MLK Boulevard regulars. Winters are getting harsh.',
    deliveryAttempts: 0,
    takenByUserId: '2', // Sarah Chen
    createdAt: new Date('2024-10-14T16:20:00').toISOString(),
    updatedAt: new Date('2024-10-15T09:45:00').toISOString()
  },
  {
    id: '4',
    friendId: '2', // David (at Ollie's)
    runId: '5', // Today's in-progress run
    locationId: '8', // Ollie's (David's location)
    requestDate: new Date('2025-10-13T14:45:00').toISOString(),
    itemCategory: 'clothing',
    itemRequested: 'Work boots',
    itemDetails: 'Steel toe boots for construction job starting soon',
    clothingSize: '10',
    clothingGender: 'male',
    quantity: 1,
    urgency: 'medium',
    status: 'ready_for_delivery',
    specialInstructions: 'Training for marathon, current shoes worn out - needs good arch support',
    deliveryAttempts: 0,
    takenByUserId: '3', // Mike Torres
    createdAt: new Date('2025-10-13T14:45:00').toISOString(),
    updatedAt: new Date('2025-10-13T14:45:00').toISOString()
  },
  {
    id: '5',
    friendId: '1', // Mike Rodriguez
    runId: '2', // Campus lunch run
    locationId: '2', // University Campus
    requestDate: new Date('2025-10-13T12:30:00').toISOString(),
    itemCategory: 'clothing',
    itemRequested: 'Thermal underwear',
    itemDetails: 'Long sleeve thermal shirt and thermal pants',
    clothingSize: 'L',
    clothingGender: 'male',
    quantity: 2,
    urgency: 'high',
    status: 'taken',
    specialInstructions: 'Getting very cold at night, needs base layers for warmth',
    deliveryAttempts: 0,
    takenByUserId: '1', // Alex Johnson
    createdAt: new Date('2025-10-13T12:30:00').toISOString(),
    updatedAt: new Date('2025-10-13T12:30:00').toISOString()
  },
  {
    id: '6',
    friendId: '2', // Emma Thompson
    runId: '4', // Weekend park run
    locationId: '3', // Riverside Park
    requestDate: new Date('2025-10-12T16:00:00').toISOString(),
    itemCategory: 'non-clothing',
    itemRequested: 'Personal hygiene kit',
    itemDetails: 'Toothbrush, toothpaste, shampoo, soap, and feminine hygiene products',
    clothingSize: null,
    clothingGender: null,
    quantity: 1,
    urgency: 'low',
    status: 'ready_for_delivery',
    specialInstructions: 'Travel-size items preferred, sensitive skin',
    deliveryAttempts: 2, // Has had two unsuccessful attempts
    takenByUserId: '2', // Sarah Chen
    createdAt: new Date('2025-10-12T16:00:00').toISOString(),
    updatedAt: new Date('2025-10-13T08:00:00').toISOString()
  },
  {
    id: '7',
    friendId: '3', // David Kim
    runId: '1', // Scheduled downtown run
    locationId: '1', // Downtown Coffee District
    requestDate: new Date('2025-10-13T10:00:00').toISOString(),
    itemCategory: 'clothing',
    itemRequested: 'Work boots',
    itemDetails: 'Steel toe boots for construction work',
    clothingSize: '10',
    clothingGender: 'male',
    quantity: 1,
    urgency: 'medium',
    status: 'taken',
    specialInstructions: 'Starting new job next week, safety boots required',
    deliveryAttempts: 0,
    takenByUserId: '3', // Mike Torres
    createdAt: new Date('2025-10-13T10:00:00').toISOString(),
    updatedAt: new Date('2025-10-13T10:00:00').toISOString()
  },
  {
    id: '8',
    friendId: '2', // Emma Thompson
    runId: '5', // Today's in-progress run
    locationId: '3', // Riverside Park
    requestDate: new Date('2025-10-12T11:30:00').toISOString(),
    itemCategory: 'non-clothing', 
    itemRequested: 'Bus pass',
    itemDetails: 'Monthly transit pass for job hunting',
    clothingSize: null,
    clothingGender: null,
    quantity: 1,
    urgency: 'high',
    status: 'delivered',
    specialInstructions: 'Needs to get to job interviews across the city',
    deliveryAttempts: 1,
    takenByUserId: '1', // Alex Johnson
    createdAt: new Date('2025-10-12T11:30:00').toISOString(),
    updatedAt: new Date('2025-10-13T15:30:00').toISOString()
  },
  {
    id: '9',
    friendId: '4', // Lisa Garcia
    runId: '4', // Weekend park run
    locationId: '2', // University Campus
    requestDate: new Date('2025-10-11T14:00:00').toISOString(),
    itemCategory: 'clothing',
    itemRequested: 'Winter coat',
    itemDetails: 'Heavy winter coat for cold weather',
    clothingSize: 'S',
    clothingGender: 'female',
    quantity: 1,
    urgency: 'high',
    status: 'delivered',
    specialInstructions: 'Lost previous coat, temperatures dropping fast',
    deliveryAttempts: 2,
    takenByUserId: '2', // Sarah Chen
    createdAt: new Date('2025-10-11T14:00:00').toISOString(),
    updatedAt: new Date('2025-10-12T16:45:00').toISOString()
  }
];

export const sampleDeliveryAttempts = [
  {
    id: '1',
    requestId: '1', // Emma's winter jacket
    attemptDate: new Date('2024-03-15T10:00:00').toISOString(),
    runId: '4', // Follow-up downtown run
    locationId: '3', // Riverside Park - her usual location
    userId: '4', // Jessica Park
    outcome: 'delivered',
    notes: 'Found Emma at her usual morning walk spot. Very grateful for the jacket.',
    createdAt: new Date('2024-03-15T10:00:00').toISOString()
  },
  {
    id: '2',
    requestId: '2', // Lisa's interview attire - unsuccessful attempt
    attemptDate: new Date('2025-10-13T11:00:00').toISOString(),
    runId: '5', // Today's in-progress run
    locationId: '2', // University Campus
    userId: '1', // Alex Johnson
    outcome: 'not_found',
    notes: 'Checked usual study areas in library and student center. Will try again later.',
    createdAt: new Date('2025-10-13T11:00:00').toISOString()
  },
  {
    id: '3',
    requestId: '6', // Emma's hygiene kit - first unsuccessful attempt
    attemptDate: new Date('2025-10-12T17:00:00').toISOString(),
    runId: '4', // Weekend park run
    locationId: '3', // Riverside Park
    userId: '2', // Sarah Chen
    outcome: 'not_available',
    notes: 'Emma was at the park but in a meeting with social services. Did not want to interrupt.',
    createdAt: new Date('2025-10-12T17:00:00').toISOString()
  },
  {
    id: '4',
    requestId: '6', // Emma's hygiene kit - second unsuccessful attempt
    attemptDate: new Date('2025-10-13T08:30:00').toISOString(),
    runId: '5', // Today's in-progress run
    locationId: '3', // Riverside Park
    userId: '2', // Sarah Chen
    outcome: 'not_found',
    notes: 'Checked both her usual morning and evening spots along the river. May need to try different time.',
    createdAt: new Date('2025-10-13T08:30:00').toISOString()
  },
  {
    id: '5',
    requestId: '8', // Emma's bus pass - successful delivery
    attemptDate: new Date('2025-10-13T15:30:00').toISOString(),
    runId: '5', // Today's in-progress run
    locationId: '3', // Riverside Park
    userId: '1', // Alex Johnson
    outcome: 'delivered',
    notes: 'Found Emma at her afternoon spot by the river. She was very excited about the bus pass for job interviews.',
    createdAt: new Date('2025-10-13T15:30:00').toISOString()
  },
  {
    id: '6',
    requestId: '9', // Lisa's winter coat - first unsuccessful attempt
    attemptDate: new Date('2025-10-12T14:30:00').toISOString(),
    runId: '4', // Weekend park run
    locationId: '2', // University Campus
    userId: '2', // Sarah Chen
    outcome: 'not_found',
    notes: 'Checked library and usual study areas. Campus security said she may have left for the day.',
    createdAt: new Date('2025-10-12T14:30:00').toISOString()
  },
  {
    id: '7',
    requestId: '9', // Lisa's winter coat - successful delivery
    attemptDate: new Date('2025-10-12T16:45:00').toISOString(),
    runId: '4', // Weekend park run
    locationId: '2', // University Campus
    userId: '2', // Sarah Chen
    outcome: 'delivered',
    notes: 'Found Lisa at the campus coffee shop. She was very grateful for the warm coat as temperatures were dropping.',
    createdAt: new Date('2025-10-12T16:45:00').toISOString()
  }
];
