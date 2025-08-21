// Sample data for Friends CRM
// This provides realistic demo data for users to explore the application

export const sampleUsers = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    phone: '555-0101',
    role: 'Team Lead',
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: '2', 
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    phone: '555-0102',
    role: 'Outreach Coordinator',
    createdAt: new Date('2024-02-01').toISOString()
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
    userId: '1',
    date: new Date('2024-03-15').toISOString(),
    duration: 125,
    notes: 'Great response at Central Perk, met 3 new people. Tech Hub was busy.',
    contactsMade: 3,
    createdAt: new Date('2024-03-15').toISOString()
  },
  {
    id: '2',
    routeId: '2', 
    userId: '2',
    date: new Date('2024-03-12').toISOString(),
    duration: 95,
    notes: 'Good turnout at campus lunch hour. Emma very helpful with introductions.',
    contactsMade: 5,
    createdAt: new Date('2024-03-12').toISOString()
  },
  {
    id: '3',
    routeId: '3',
    userId: '1',
    date: new Date('2024-03-10').toISOString(),
    duration: 160,
    notes: 'Peaceful morning at the park. David introduced me to his running group.',
    contactsMade: 2,
    createdAt: new Date('2024-03-10').toISOString()
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
