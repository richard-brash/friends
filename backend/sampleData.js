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
  {
    id: '1',
    name: 'Downtown Coffee District',
    address: '123 Main St, Downtown',
    type: 'Business District',
    notes: 'High foot traffic area with multiple coffee shops and young professionals',
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '2',
    name: 'University Campus',
    address: '456 College Ave',
    type: 'Educational',
    notes: 'Large student population, best visited during lunch hours',
    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: '3',
    name: 'Riverside Park',
    address: '789 River Rd',
    type: 'Recreation',
    notes: 'Popular jogging and walking area, especially on weekends',
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '4',
    name: 'Tech Hub Co-working',
    address: '321 Innovation Blvd',
    type: 'Business',
    notes: 'Startup community, networking events on Thursdays',
    createdAt: new Date('2024-02-01').toISOString()
  }
];

export const sampleRoutes = [
  {
    id: '1',
    name: 'Downtown Morning Route',
    description: 'Coffee shop circuit for early risers and professionals',
    locationIds: ['1', '4'],
    estimatedDuration: 120,
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: '2',
    name: 'Campus Lunch Circuit',
    description: 'University outreach during peak student hours',
    locationIds: ['2'],
    estimatedDuration: 90,
    createdAt: new Date('2024-02-05').toISOString()
  },
  {
    id: '3',
    name: 'Weekend Park & Community',
    description: 'Relaxed weekend outreach in recreational areas',
    locationIds: ['3'],
    estimatedDuration: 180,
    createdAt: new Date('2024-02-10').toISOString()
  }
];

export const sampleFriends = [
  {
    id: '1',
    name: 'Mike Rodriguez',
    email: 'mike.r@email.com',
    phone: '555-0201',
    locationId: '1',
    notes: 'Regular at Central Perk, interested in community events. Works in marketing.',
    lastContact: new Date('2024-03-15').toISOString(),
    status: 'active',
    createdAt: new Date('2024-02-01').toISOString()
  },
  {
    id: '2',
    name: 'Emma Thompson',
    email: 'emma.t@email.com',
    phone: '555-0202',
    locationId: '2',
    notes: 'Graduate student in sociology, very engaged in social causes.',
    lastContact: new Date('2024-03-10').toISOString(),
    status: 'active',
    createdAt: new Date('2024-02-05').toISOString()
  },
  {
    id: '3',
    name: 'David Kim',
    email: 'david.kim@email.com',
    phone: '555-0203',
    locationId: '3',
    notes: 'Daily jogger, interested in health and wellness initiatives.',
    lastContact: new Date('2024-03-12').toISOString(),
    status: 'active',
    createdAt: new Date('2024-02-08').toISOString()
  },
  {
    id: '4',
    name: 'Lisa Garcia',
    email: 'lisa.garcia@email.com',
    phone: '555-0204',
    locationId: '4',
    notes: 'Startup founder, looking for networking opportunities.',
    lastContact: new Date('2024-03-08').toISOString(),
    status: 'active',
    createdAt: new Date('2024-02-12').toISOString()
  },
  {
    id: '5',
    name: 'James Wilson',
    email: 'j.wilson@email.com',
    phone: '555-0205',
    locationId: '1',
    notes: 'Coffee enthusiast, works remotely. Interested in tech meetups.',
    lastContact: new Date('2024-02-28').toISOString(),
    status: 'inactive',
    createdAt: new Date('2024-01-15').toISOString()
  }
];

export const sampleRuns = [
  {
    id: '1',
    routeId: '1',
    leadId: '1', // Lead user
    coordinatorId: '2', // Coordinator who created the run
    assignedUserIds: ['1', '3'], // Team members assigned to this run
    scheduledDate: new Date('2024-03-20T09:00:00').toISOString(), // Upcoming run
    mealsCount: 25,
    coordinatorNotes: 'Focus on business professionals during morning rush. Bring extra flyers.',
    status: 'scheduled', // scheduled, in_progress, completed, cancelled
    currentLocationIndex: 0, // For tracking progress through route
    // Post-run data (null for scheduled runs)
    actualDuration: null,
    leadNotes: null,
    contactsMade: null,
    completedAt: null,
    createdAt: new Date('2024-03-15').toISOString()
  },
  {
    id: '2',
    routeId: '2', 
    leadId: '4',
    coordinatorId: '2',
    assignedUserIds: ['4', '3'],
    scheduledDate: new Date('2024-03-18T12:00:00').toISOString(), // Upcoming run
    mealsCount: 15,
    coordinatorNotes: 'University lunch hour outreach. Connect with student groups.',
    status: 'scheduled',
    currentLocationIndex: 0,
    actualDuration: null,
    leadNotes: null,
    contactsMade: null,
    completedAt: null,
    createdAt: new Date('2024-03-12').toISOString()
  },
  {
    id: '3',
    routeId: '3',
    leadId: '1',
    coordinatorId: '1', // Alex coordinated his own run
    assignedUserIds: ['1', '4'],
    scheduledDate: new Date('2024-03-10T10:00:00').toISOString(),
    mealsCount: 20,
    coordinatorNotes: 'Weekend park outreach. Family-friendly approach.',
    status: 'completed',
    currentLocationIndex: 1, // Completed all locations
    // Post-run data
    actualDuration: 160,
    leadNotes: 'Great response from families. David introduced us to his running group.',
    contactsMade: 2,
    completedAt: new Date('2024-03-10T13:00:00').toISOString(),
    createdAt: new Date('2024-03-08').toISOString()
  },
  {
    id: '4',
    routeId: '1',
    leadId: '4',
    coordinatorId: '2',
    assignedUserIds: ['4', '1'],
    scheduledDate: new Date('2024-03-22T09:30:00').toISOString(), // Future run
    mealsCount: 30,
    coordinatorNotes: 'Follow-up run to downtown area. Build on previous connections.',
    status: 'scheduled',
    currentLocationIndex: 0,
    actualDuration: null,
    leadNotes: null,
    contactsMade: null,
    completedAt: null,
    createdAt: new Date('2024-03-16').toISOString()
  },
  {
    id: '5',
    routeId: '2',
    leadId: '1',
    coordinatorId: '2',
    assignedUserIds: ['1', '3', '4'],
    scheduledDate: new Date('2025-10-13T14:00:00').toISOString(), // Today - in progress
    mealsCount: 20,
    coordinatorNotes: 'Active run happening now. Test the location navigation!',
    status: 'in_progress',
    currentLocationIndex: 0, // Currently at first location
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
    friendId: '2',
    type: 'event_invitation',
    description: 'Emma interested in attending our monthly community meeting',
    status: 'pending',
    priority: 'medium',
    createdAt: new Date('2024-03-10').toISOString(),
    dueDate: new Date('2024-03-25').toISOString()
  },
  {
    id: '2',
    friendId: '4',
    type: 'collaboration',
    description: 'Lisa wants to explore partnership opportunities for startup events',
    status: 'in_progress',
    priority: 'high',
    createdAt: new Date('2024-03-08').toISOString(),
    dueDate: new Date('2024-03-20').toISOString()
  },
  {
    id: '3',
    friendId: '1',
    type: 'follow_up',
    description: 'Follow up with Mike about his interest in volunteering',
    status: 'completed',
    priority: 'low',
    createdAt: new Date('2024-02-15').toISOString(),
    dueDate: new Date('2024-03-01').toISOString()
  }
];
