# API Specification - Friends Outreach CRM V2

**Last Updated:** January 9, 2026  
**Status:** Phase 2 - Architecture Design

---

## Design Principles

1. **RESTful Conventions** - Standard HTTP methods, resource-oriented URLs
2. **Consistent Responses** - Predictable structure for success and errors
3. **Authentication Required** - JWT token on all endpoints except login
4. **Validation First** - Input validated before processing
5. **Paginated Lists** - Default 50 items per page, max 200

---

## Base Configuration

**Base URL:** `/api`  
**API Version:** `v2`  
**Authentication:** Bearer token (JWT)  
**Content-Type:** `application/json`  
**Character Encoding:** UTF-8

---

## Authentication

### POST /api/auth/login

**Purpose:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "identifier": "string",  // email or phone
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,  // 24 hours in seconds
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": "+15555551234",
    "name": "Jane Doe",
    "isActive": true
  }
}
```

**Errors:**
- `400 Bad Request` - Missing identifier or password
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account inactive

---

### POST /api/auth/logout

**Purpose:** Invalidate current session (client-side token disposal)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (204 No Content)**

---

### GET /api/auth/me

**Purpose:** Get current authenticated user details

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "phone": "+15555551234",
  "name": "Jane Doe",
  "isActive": true,
  "createdAt": "2026-01-01T10:00:00Z",
  "updatedAt": "2026-01-08T14:30:00Z"
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired token

---

## Users

### GET /api/v2/users

**Purpose:** List all users (for team assignment, activity tracking)

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50, max: 200)
- `isActive` (boolean) - Filter by active status
- `search` (string) - Search by name, email, phone

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "email": "jane@example.com",
      "phone": "+15555551234",
      "name": "Jane Doe",
      "isActive": true,
      "createdAt": "2026-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### GET /api/v2/users/:id

**Purpose:** Get single user details

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "jane@example.com",
  "phone": "+15555551234",
  "name": "Jane Doe",
  "isActive": true,
  "createdAt": "2026-01-01T10:00:00Z",
  "updatedAt": "2026-01-08T14:30:00Z"
}
```

**Errors:**
- `404 Not Found` - User does not exist

---

### POST /api/v2/users

**Purpose:** Create new user account

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "phone": "+15555559999",  // optional
  "password": "securepassword123",
  "name": "New User"
}
```

**Validation:**
- Email OR phone required (can have both)
- Email must be unique
- Phone must be E.164 format
- Password min 8 characters
- Name required, 1-100 characters

**Response (201 Created):**
```json
{
  "id": 9,
  "email": "newuser@example.com",
  "phone": "+15555559999",
  "name": "New User",
  "isActive": true,
  "createdAt": "2026-01-09T15:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Validation failed
- `409 Conflict` - Email or phone already exists

---

### PATCH /api/v2/users/:id

**Purpose:** Update user (name, email, phone, active status)

**Request Body (all fields optional):**
```json
{
  "email": "updated@example.com",
  "phone": "+15555558888",
  "name": "Updated Name",
  "isActive": false
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "updated@example.com",
  "phone": "+15555558888",
  "name": "Updated Name",
  "isActive": false,
  "updatedAt": "2026-01-09T15:30:00Z"
}
```

**Errors:**
- `400 Bad Request` - Validation failed
- `404 Not Found` - User does not exist
- `409 Conflict` - Email or phone already in use

---

### DELETE /api/v2/users/:id

**Purpose:** Soft delete user (set isActive = false)

**Response (204 No Content)**

**Errors:**
- `404 Not Found` - User does not exist

---

## Friends

### GET /api/v2/friends

**Purpose:** List all friends with filtering and search

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50, max: 200)
- `status` (enum) - Filter by status: active, inactive, moved, deceased
- `search` (string) - Full-text search across first_name, last_name, alias
- `locationId` (number) - Friends last seen at location

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Smith",
      "alias": "Johnny",
      "phone": "+15555550001",
      "email": "john@example.com",
      "status": "active",
      "lastSeenAt": {
        "locationId": 5,
        "locationName": "Park & Lexington",
        "spottedAt": "2026-01-08T14:00:00Z"
      },
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "totalPages": 5
  }
}
```

---

### GET /api/v2/friends/:id

**Purpose:** Get friend details with location history

**Response (200 OK):**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Smith",
  "alias": "Johnny",
  "phone": "+15555550001",
  "email": "john@example.com",
  "notes": "Prefers vegetarian meals",
  "status": "active",
  "locationHistory": [
    {
      "id": 101,
      "locationId": 5,
      "locationName": "Park & Lexington",
      "spottedBy": "Jane Doe",
      "spottedAt": "2026-01-08T14:00:00Z",
      "notes": "Looking healthy"
    },
    {
      "id": 98,
      "locationId": 3,
      "locationName": "Downtown Shelter",
      "spottedBy": "Mike Johnson",
      "spottedAt": "2026-01-06T13:30:00Z"
    }
  ],
  "requestHistory": [
    {
      "id": 42,
      "itemDescription": "Winter coat size L",
      "status": "delivered",
      "deliveredAt": "2026-01-08T14:05:00Z"
    }
  ],
  "createdAt": "2025-12-01T10:00:00Z",
  "updatedAt": "2026-01-08T14:00:00Z"
}
```

**Errors:**
- `404 Not Found` - Friend does not exist

---

### POST /api/v2/friends

**Purpose:** Create new friend

**Request Body:**
```json
{
  "firstName": "Maria",
  "lastName": "Garcia",
  "alias": "Mari",  // optional
  "phone": "+15555550050",  // optional
  "email": "maria@example.com",  // optional
  "notes": "Diabetic, needs sugar-free options",  // optional
  "status": "active"  // optional, default: active
}
```

**Validation:**
- At least one of: firstName, lastName, alias (required)
- Phone must be E.164 format if provided
- Email must be valid format if provided

**Response (201 Created):**
```json
{
  "id": 235,
  "firstName": "Maria",
  "lastName": "Garcia",
  "alias": "Mari",
  "phone": "+15555550050",
  "email": "maria@example.com",
  "notes": "Diabetic, needs sugar-free options",
  "status": "active",
  "createdAt": "2026-01-09T15:45:00Z"
}
```

**Errors:**
- `400 Bad Request` - Validation failed (no name fields provided)

---

### PATCH /api/v2/friends/:id

**Purpose:** Update friend details

**Request Body (all fields optional):**
```json
{
  "firstName": "Maria",
  "lastName": "Garcia-Lopez",
  "alias": "Mari",
  "phone": "+15555550051",
  "email": "maria.new@example.com",
  "notes": "Updated dietary restrictions",
  "status": "inactive"
}
```

**Response (200 OK):**
```json
{
  "id": 235,
  "firstName": "Maria",
  "lastName": "Garcia-Lopez",
  "alias": "Mari",
  "phone": "+15555550051",
  "email": "maria.new@example.com",
  "notes": "Updated dietary restrictions",
  "status": "inactive",
  "updatedAt": "2026-01-09T16:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Validation failed
- `404 Not Found` - Friend does not exist

---

### DELETE /api/v2/friends/:id

**Purpose:** Soft delete friend (set status = inactive)

**Response (204 No Content)**

**Errors:**
- `404 Not Found` - Friend does not exist

---

### POST /api/v2/friends/:id/spot

**Purpose:** Record friend sighting at location (updates location history)

**Request Body:**
```json
{
  "locationId": 5,
  "spottedAt": "2026-01-09T14:30:00Z",  // optional, defaults to now
  "notes": "With service dog"  // optional
}
```

**Response (201 Created):**
```json
{
  "id": 102,
  "friendId": 1,
  "locationId": 5,
  "spottedBy": "Jane Doe",
  "spottedAt": "2026-01-09T14:30:00Z",
  "notes": "With service dog",
  "createdAt": "2026-01-09T14:31:00Z"
}
```

**Errors:**
- `404 Not Found` - Friend or location does not exist

---

## Routes

### GET /api/v2/routes

**Purpose:** List all routes with location count

**Query Parameters:**
- `isActive` (boolean) - Filter by active status

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Downtown",
      "description": "City center and shelters",
      "isActive": true,
      "locationCount": 8,
      "createdAt": "2025-11-01T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Westside",
      "description": "West district parks",
      "isActive": true,
      "locationCount": 6,
      "createdAt": "2025-11-01T10:05:00Z"
    }
  ]
}
```

---

### GET /api/v2/routes/:id

**Purpose:** Get route details with ordered locations

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Downtown",
  "description": "City center and shelters",
  "isActive": true,
  "locations": [
    {
      "id": 1,
      "name": "City Hall Plaza",
      "address": "100 Main St",
      "routeOrder": 1,
      "pendingRequestCount": 2
    },
    {
      "id": 2,
      "name": "Park & Lexington",
      "address": "Park Ave & Lexington St",
      "routeOrder": 2,
      "pendingRequestCount": 5
    }
  ],
  "createdAt": "2025-11-01T10:00:00Z",
  "updatedAt": "2026-01-05T11:00:00Z"
}
```

**Errors:**
- `404 Not Found` - Route does not exist

---

### POST /api/v2/routes

**Purpose:** Create new route

**Request Body:**
```json
{
  "name": "Eastside",
  "description": "East district coverage",  // optional
  "isActive": true  // optional, default: true
}
```

**Validation:**
- Name required, 1-100 characters, must be unique

**Response (201 Created):**
```json
{
  "id": 4,
  "name": "Eastside",
  "description": "East district coverage",
  "isActive": true,
  "createdAt": "2026-01-09T16:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Validation failed
- `409 Conflict` - Route name already exists

---

### PATCH /api/v2/routes/:id

**Purpose:** Update route details

**Request Body (all fields optional):**
```json
{
  "name": "Downtown Core",
  "description": "Updated description",
  "isActive": false
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Downtown Core",
  "description": "Updated description",
  "isActive": false,
  "updatedAt": "2026-01-09T16:15:00Z"
}
```

**Errors:**
- `400 Bad Request` - Validation failed
- `404 Not Found` - Route does not exist
- `409 Conflict` - Route name already in use

---

### DELETE /api/v2/routes/:id

**Purpose:** Soft delete route (set isActive = false)

**Response (204 No Content)**

**Errors:**
- `404 Not Found` - Route does not exist
- `409 Conflict` - Route has active runs

---

## Locations

### GET /api/v2/locations

**Purpose:** List locations with filtering

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `routeId` (number) - Filter by route
- `search` (string) - Search by name or address

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "City Hall Plaza",
      "address": "100 Main St",
      "city": "Baltimore",
      "state": "MD",
      "zipCode": "21201",
      "routeId": 1,
      "routeName": "Downtown",
      "routeOrder": 1,
      "pendingRequestCount": 2,
      "createdAt": "2025-11-01T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 24,
    "totalPages": 1
  }
}
```

---

### GET /api/v2/locations/:id

**Purpose:** Get location details with expected friends

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "City Hall Plaza",
  "address": "100 Main St",
  "city": "Baltimore",
  "state": "MD",
  "zipCode": "21201",
  "coordinates": {
    "lat": 39.2904,
    "lng": -76.6122
  },
  "routeId": 1,
  "routeName": "Downtown",
  "routeOrder": 1,
  "notes": "Wheelchair accessible",
  "expectedFriends": [
    {
      "friendId": 12,
      "friendName": "John Smith",
      "lastSeenAt": "2026-01-08T14:00:00Z"
    }
  ],
  "pendingRequests": [
    {
      "id": 42,
      "friendName": "Maria Garcia",
      "itemDescription": "Winter coat size L",
      "status": "ready_for_delivery"
    }
  ],
  "createdAt": "2025-11-01T10:30:00Z",
  "updatedAt": "2026-01-05T12:00:00Z"
}
```

**Errors:**
- `404 Not Found` - Location does not exist

---

### POST /api/v2/locations

**Purpose:** Create new location

**Request Body:**
```json
{
  "name": "Library Plaza",
  "address": "500 Oak Street",  // optional
  "city": "Baltimore",  // optional
  "state": "MD",  // optional
  "zipCode": "21202",  // optional
  "coordinates": {  // optional
    "lat": 39.2950,
    "lng": -76.6100
  },
  "routeId": 1,
  "routeOrder": 9,
  "notes": "Near bus stop"  // optional
}
```

**Validation:**
- Name required, 1-100 characters
- routeId required, must exist
- routeOrder required, positive integer, must be unique within route
- Coordinates: lat (-90 to 90), lng (-180 to 180) if provided

**Response (201 Created):**
```json
{
  "id": 25,
  "name": "Library Plaza",
  "address": "500 Oak Street",
  "city": "Baltimore",
  "state": "MD",
  "zipCode": "21202",
  "coordinates": {
    "lat": 39.2950,
    "lng": -76.6100
  },
  "routeId": 1,
  "routeOrder": 9,
  "notes": "Near bus stop",
  "createdAt": "2026-01-09T16:30:00Z"
}
```

**Errors:**
- `400 Bad Request` - Validation failed
- `404 Not Found` - Route does not exist
- `409 Conflict` - routeOrder already used in route

---

### PATCH /api/v2/locations/:id

**Purpose:** Update location details

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "address": "501 Oak Street",
  "routeOrder": 10,
  "notes": "Updated notes"
}
```

**Response (200 OK):**
```json
{
  "id": 25,
  "name": "Updated Name",
  "address": "501 Oak Street",
  "routeOrder": 10,
  "notes": "Updated notes",
  "updatedAt": "2026-01-09T16:45:00Z"
}
```

**Errors:**
- `400 Bad Request` - Validation failed
- `404 Not Found` - Location does not exist
- `409 Conflict` - routeOrder already used

---

### DELETE /api/v2/locations/:id

**Purpose:** Delete location (warns if pending requests)

**Response (204 No Content)**

**Errors:**
- `404 Not Found` - Location does not exist
- `409 Conflict` - Location has pending requests (warning, still allows deletion)

---

### POST /api/v2/locations/reorder

**Purpose:** Bulk reorder locations within a route

**Request Body:**
```json
{
  "routeId": 1,
  "locations": [
    {"id": 1, "routeOrder": 1},
    {"id": 3, "routeOrder": 2},
    {"id": 2, "routeOrder": 3}
  ]
}
```

**Response (200 OK):**
```json
{
  "message": "Locations reordered successfully",
  "updated": 3
}
```

**Errors:**
- `400 Bad Request` - Duplicate routeOrder or missing location
- `404 Not Found` - Route or location does not exist

---

## Runs

### GET /api/v2/runs

**Purpose:** List runs with filtering

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `routeId` (number) - Filter by route
- `status` (enum) - Filter by: planned, prepared, in_progress, completed, cancelled
- `dateFrom` (date) - Filter runs on or after date
- `dateTo` (date) - Filter runs on or before date
- `userId` (number) - Runs where user is team member

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "routeId": 1,
      "routeName": "Downtown",
      "name": "Downtown Monday 2026-01-13",
      "scheduledDate": "2026-01-13",
      "status": "planned",
      "mealCount": 25,
      "teamSize": 3,
      "createdAt": "2026-01-08T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "totalPages": 1
  }
}
```

---

### GET /api/v2/runs/:id

**Purpose:** Get run details with team and progress

**Response (200 OK):**
```json
{
  "id": 1,
  "routeId": 1,
  "routeName": "Downtown",
  "name": "Downtown Monday 2026-01-13",
  "scheduledDate": "2026-01-13",
  "status": "in_progress",
  "currentLocation": {
    "id": 3,
    "name": "Park & Lexington",
    "routeOrder": 3
  },
  "mealCount": 25,
  "notes": "Cold weather, bring extra blankets",
  "team": [
    {
      "userId": 2,
      "name": "Sarah Johnson",
      "addedAt": "2026-01-08T10:05:00Z"
    },
    {
      "userId": 5,
      "name": "Mike Davis",
      "addedAt": "2026-01-08T10:10:00Z"
    }
  ],
  "progress": {
    "totalStops": 8,
    "completedStops": 2,
    "currentStopNumber": 3,
    "mealsDelivered": 12,
    "friendsServed": 8
  },
  "createdAt": "2026-01-08T10:00:00Z",
  "updatedAt": "2026-01-13T14:30:00Z"
}
```

**Errors:**
- `404 Not Found` - Run does not exist

---

### POST /api/v2/runs

**Purpose:** Create new run

**Request Body:**
```json
{
  "routeId": 1,
  "scheduledDate": "2026-01-20",
  "mealCount": 30,  // optional, can set during preparation
  "notes": "Cold weather forecast"  // optional
}
```

**Validation:**
- routeId required, must exist
- scheduledDate required, cannot be more than 1 year in past
- mealCount must be positive if provided

**Response (201 Created):**
```json
{
  "id": 13,
  "routeId": 1,
  "routeName": "Downtown",
  "name": "Downtown Monday 2026-01-20",  // auto-generated
  "scheduledDate": "2026-01-20",
  "status": "planned",
  "mealCount": 30,
  "notes": "Cold weather forecast",
  "createdAt": "2026-01-09T17:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Validation failed
- `404 Not Found` - Route does not exist

---

### PATCH /api/v2/runs/:id

**Purpose:** Update run details (only if status = planned)

**Request Body (all fields optional):**
```json
{
  "scheduledDate": "2026-01-21",
  "mealCount": 35,
  "notes": "Updated notes"
}
```

**Response (200 OK):**
```json
{
  "id": 13,
  "scheduledDate": "2026-01-21",
  "mealCount": 35,
  "notes": "Updated notes",
  "updatedAt": "2026-01-09T17:15:00Z"
}
```

**Errors:**
- `400 Bad Request` - Validation failed or run not in planned status
- `404 Not Found` - Run does not exist

---

### DELETE /api/v2/runs/:id

**Purpose:** Cancel run (set status = cancelled)

**Response (204 No Content)**

**Errors:**
- `404 Not Found` - Run does not exist
- `409 Conflict` - Run already in_progress or completed

---

### POST /api/v2/runs/:id/team

**Purpose:** Add user to run team

**Request Body:**
```json
{
  "userId": 5
}
```

**Response (200 OK):**
```json
{
  "message": "Team member added",
  "team": [
    {
      "userId": 2,
      "name": "Sarah Johnson",
      "addedAt": "2026-01-08T10:05:00Z"
    },
    {
      "userId": 5,
      "name": "Mike Davis",
      "addedAt": "2026-01-09T17:30:00Z"
    }
  ]
}
```

**Errors:**
- `400 Bad Request` - User already on team
- `404 Not Found` - Run or user does not exist

---

### DELETE /api/v2/runs/:id/team/:userId

**Purpose:** Remove user from run team

**Response (200 OK):**
```json
{
  "message": "Team member removed",
  "team": [
    {
      "userId": 2,
      "name": "Sarah Johnson",
      "addedAt": "2026-01-08T10:05:00Z"
    }
  ]
}
```

**Errors:**
- `404 Not Found` - Run or user does not exist or not on team

---

## Run Execution (Field Operations)

### GET /api/v2/runs/:id/preparation

**Purpose:** Get preparation checklist for run

**Response (200 OK):**
```json
{
  "runId": 1,
  "runName": "Downtown Monday 2026-01-13",
  "mealCount": 25,
  "weeklyItems": [
    {"type": "weekend_bags", "count": 25},
    {"type": "blankets", "count": 10}
  ],
  "specialRequests": [
    {
      "id": 42,
      "friendName": "Maria Garcia",
      "locationName": "Park & Lexington",
      "itemDescription": "Winter coat size L",
      "priority": "high",
      "status": "ready_for_delivery"
    },
    {
      "id": 45,
      "friendName": "John Smith",
      "locationName": "City Hall Plaza",
      "itemDescription": "Boots size 11",
      "priority": "medium",
      "status": "ready_for_delivery"
    }
  ]
}
```

**Errors:**
- `404 Not Found` - Run does not exist

---

### POST /api/v2/runs/:id/start

**Purpose:** Start run execution (status: planned → in_progress)

**Request Body:**
```json
{
  "mealCount": 25  // required if not set during creation
}
```

**Response (200 OK):**
```json
{
  "runId": 1,
  "status": "in_progress",
  "currentLocation": {
    "id": 1,
    "name": "City Hall Plaza",
    "routeOrder": 1
  },
  "startedAt": "2026-01-13T10:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Run not in planned status or mealCount missing
- `404 Not Found` - Run does not exist

---

### GET /api/v2/runs/:id/execution

**Purpose:** Get current execution context (active run screen)

**Response (200 OK):**
```json
{
  "runId": 1,
  "runName": "Downtown Monday 2026-01-13",
  "status": "in_progress",
  "currentStop": {
    "locationId": 3,
    "locationName": "Park & Lexington",
    "routeOrder": 3,
    "totalStops": 8,
    "mealsDelivered": 5,
    "weeklyItems": [
      {"type": "weekend_bags", "count": 4},
      {"type": "blankets", "count": 2}
    ],
    "notes": "Busy today"
  },
  "expectedFriends": [
    {
      "friendId": 12,
      "friendName": "John Smith",
      "lastSeenAt": "2026-01-08T14:00:00Z"
    },
    {
      "friendId": 18,
      "friendName": "Carlos Martinez",
      "lastSeenAt": "2026-01-06T13:00:00Z"
    }
  ],
  "specialRequests": [
    {
      "requestId": 42,
      "friendName": "Maria Garcia",
      "itemDescription": "Winter coat size L",
      "status": "taken"
    }
  ],
  "navigation": {
    "canGoPrevious": true,
    "canGoNext": true,
    "previousLocationId": 2,
    "nextLocationId": 4
  }
}
```

**Errors:**
- `404 Not Found` - Run does not exist
- `400 Bad Request` - Run not in_progress

---

### POST /api/v2/runs/:id/advance

**Purpose:** Move to next location

**Response (200 OK):**
```json
{
  "runId": 1,
  "currentLocation": {
    "id": 4,
    "name": "Downtown Shelter",
    "routeOrder": 4
  },
  "message": "Advanced to stop 4 of 8"
}
```

**Errors:**
- `400 Bad Request` - Already at last stop
- `404 Not Found` - Run does not exist

---

### POST /api/v2/runs/:id/previous

**Purpose:** Go back to previous location (correction)

**Response (200 OK):**
```json
{
  "runId": 1,
  "currentLocation": {
    "id": 2,
    "name": "Main Street Park",
    "routeOrder": 2
  },
  "message": "Returned to stop 2 of 8"
}
```

**Errors:**
- `400 Bad Request` - Already at first stop
- `404 Not Found` - Run does not exist

---

### POST /api/v2/runs/:id/delivery

**Purpose:** Record delivery at current location (meals, weekly items, notes)

**Request Body:**
```json
{
  "mealsDelivered": 5,
  "weeklyItems": [
    {"type": "weekend_bags", "count": 4},
    {"type": "blankets", "count": 2}
  ],
  "notes": "Very busy today, lots of people"
}
```

**Response (200 OK):**
```json
{
  "id": 15,
  "runId": 1,
  "locationId": 3,
  "mealsDelivered": 5,
  "weeklyItems": [
    {"type": "weekend_bags", "count": 4},
    {"type": "blankets", "count": 2}
  ],
  "notes": "Very busy today, lots of people",
  "deliveredBy": "Jane Doe",
  "deliveredAt": "2026-01-13T14:30:00Z"
}
```

**Errors:**
- `400 Bad Request` - Run not in_progress or not at current location
- `404 Not Found` - Run does not exist

---

### POST /api/v2/runs/:id/complete

**Purpose:** Complete run (status: in_progress → completed)

**Response (200 OK):**
```json
{
  "runId": 1,
  "status": "completed",
  "summary": {
    "stopsCompleted": 8,
    "mealsDelivered": 22,
    "weeklyItemsDistributed": {
      "weekend_bags": 20,
      "blankets": 8
    },
    "specialRequestsDelivered": 3,
    "friendsServed": 18
  },
  "completedAt": "2026-01-13T16:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Run not in_progress
- `404 Not Found` - Run does not exist

---

## Requests

### GET /api/v2/requests

**Purpose:** List requests with filtering

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `status` (enum) - Filter by: pending, ready_for_delivery, taken, delivered, cancelled
- `friendId` (number) - Filter by friend
- `locationId` (number) - Filter by location
- `routeId` (number) - Filter by route (via location)
- `priority` (enum) - Filter by: low, medium, high, urgent

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 42,
      "friendId": 15,
      "friendName": "Maria Garcia",
      "locationId": 3,
      "locationName": "Park & Lexington",
      "routeName": "Downtown",
      "itemDescription": "Winter coat size L",
      "quantity": 1,
      "priority": "high",
      "status": "ready_for_delivery",
      "createdAt": "2026-01-05T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 43,
    "totalPages": 1
  }
}
```

---

### GET /api/v2/requests/:id

**Purpose:** Get request details with full history

**Response (200 OK):**
```json
{
  "id": 42,
  "friendId": 15,
  "friendName": "Maria Garcia",
  "locationId": 3,
  "locationName": "Park & Lexington",
  "routeId": 1,
  "routeName": "Downtown",
  "itemDescription": "Winter coat size L",
  "quantity": 1,
  "priority": "high",
  "status": "delivered",
  "notes": "Delivered in good condition",
  "history": [
    {
      "id": 101,
      "fromStatus": null,
      "toStatus": "pending",
      "userId": 2,
      "userName": "Sarah Johnson",
      "notes": "Requested during Monday run",
      "createdAt": "2026-01-05T10:00:00Z"
    },
    {
      "id": 102,
      "fromStatus": "pending",
      "toStatus": "ready_for_delivery",
      "userId": 3,
      "userName": "Linda Martinez",
      "notes": "Pulled from warehouse",
      "createdAt": "2026-01-07T14:00:00Z"
    },
    {
      "id": 103,
      "fromStatus": "ready_for_delivery",
      "toStatus": "taken",
      "userId": 2,
      "userName": "Sarah Johnson",
      "notes": "Loaded on Wednesday run",
      "createdAt": "2026-01-08T09:30:00Z"
    },
    {
      "id": 104,
      "fromStatus": "taken",
      "toStatus": "delivered",
      "userId": 2,
      "userName": "Sarah Johnson",
      "notes": "Delivered at Park & Lexington",
      "createdAt": "2026-01-08T14:05:00Z"
    }
  ],
  "createdAt": "2026-01-05T10:00:00Z",
  "updatedAt": "2026-01-08T14:05:00Z"
}
```

**Errors:**
- `404 Not Found` - Request does not exist

---

### POST /api/v2/requests

**Purpose:** Create new request

**Request Body:**
```json
{
  "friendId": 15,
  "locationId": 3,
  "itemDescription": "Sleeping bag",
  "quantity": 1,  // optional, default: 1
  "priority": "medium",  // optional, default: medium
  "notes": "Winter-rated preferred"  // optional
}
```

**Validation:**
- friendId required, must exist
- locationId required, must exist
- itemDescription required, 1-255 characters
- quantity must be positive integer
- priority: low, medium, high, urgent

**Response (201 Created):**
```json
{
  "id": 50,
  "friendId": 15,
  "friendName": "Maria Garcia",
  "locationId": 3,
  "locationName": "Park & Lexington",
  "itemDescription": "Sleeping bag",
  "quantity": 1,
  "priority": "medium",
  "status": "pending",
  "notes": "Winter-rated preferred",
  "createdAt": "2026-01-09T18:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Validation failed
- `404 Not Found` - Friend or location does not exist

---

### PATCH /api/v2/requests/:id/status

**Purpose:** Change request status (with history tracking)

**Request Body:**
```json
{
  "status": "ready_for_delivery",
  "notes": "Item pulled from warehouse, ready to go"
}
```

**Valid Transitions:**
- pending → ready_for_delivery, cancelled
- ready_for_delivery → taken, cancelled
- taken → delivered, cancelled

**Response (200 OK):**
```json
{
  "id": 50,
  "status": "ready_for_delivery",
  "updatedAt": "2026-01-09T18:15:00Z",
  "historyEntry": {
    "id": 105,
    "fromStatus": "pending",
    "toStatus": "ready_for_delivery",
    "userId": 3,
    "userName": "Linda Martinez",
    "notes": "Item pulled from warehouse, ready to go",
    "createdAt": "2026-01-09T18:15:00Z"
  }
}
```

**Errors:**
- `400 Bad Request` - Invalid status transition
- `404 Not Found` - Request does not exist

---

### PATCH /api/v2/requests/:id

**Purpose:** Update request details (item, quantity, priority)

**Request Body (all fields optional):**
```json
{
  "itemDescription": "Winter sleeping bag -20F",
  "quantity": 2,
  "priority": "high",
  "notes": "Updated: needs 2 bags"
}
```

**Response (200 OK):**
```json
{
  "id": 50,
  "itemDescription": "Winter sleeping bag -20F",
  "quantity": 2,
  "priority": "high",
  "notes": "Updated: needs 2 bags",
  "updatedAt": "2026-01-09T18:30:00Z"
}
```

**Errors:**
- `400 Bad Request` - Validation failed
- `404 Not Found` - Request does not exist

---

### DELETE /api/v2/requests/:id

**Purpose:** Cancel request (sets status = cancelled)

**Request Body:**
```json
{
  "reason": "Item no longer needed"  // required
}
```

**Response (200 OK):**
```json
{
  "id": 50,
  "status": "cancelled",
  "updatedAt": "2026-01-09T18:45:00Z"
}
```

**Errors:**
- `400 Bad Request` - Reason required
- `404 Not Found` - Request does not exist

---

## Error Response Format

All error responses follow consistent structure:

**4xx Client Errors:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

**5xx Server Errors:**
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "requestId": "req_abc123xyz"
  }
}
```

---

## Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 400 | INVALID_STATUS_TRANSITION | Status change not allowed |
| 401 | UNAUTHORIZED | Authentication required or token invalid |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Resource conflict (duplicate, constraint violation) |
| 422 | UNPROCESSABLE_ENTITY | Valid syntax but semantic error |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_SERVER_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Temporary unavailability |

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` (number, default: 1) - Page number (1-indexed)
- `limit` (number, default: 50, max: 200) - Items per page

**Response Structure:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## Rate Limiting

**MVP:** No rate limiting enforced  
**Phase 2:** 
- Authenticated: 1000 requests/hour
- Anonymous (login): 10 requests/minute

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1641038400
```

---

## API Versioning

**Strategy:** URL-based versioning (`/api/v2/...`)

**Version History:**
- v2 (current): Clean Architecture rebuild, stable API
- v1 (deprecated): Legacy API, removed in V2

**Breaking Changes:**
- Major version bump (v2 → v3)
- Minimum 6 months deprecation notice
- Backward compatibility maintained within major version

---

## Next Steps

1. ✅ API specification complete
2. ⏳ Generate OpenAPI/Swagger spec
3. ⏳ Design component library (shared UI)
4. ⏳ Define testing strategy
5. ⏳ Create API client library (frontend)

---

## Appendix: Example Workflows

### Workflow 1: Complete Run Execution
```
1. GET /api/v2/runs/:id/preparation → Load checklist
2. PATCH /api/v2/requests/:id/status → Mark requests "taken"
3. POST /api/v2/runs/:id/start → Start run
4. GET /api/v2/runs/:id/execution → Get current stop
5. POST /api/v2/runs/:id/delivery → Record delivery
6. POST /api/v2/friends/:id/spot → Spot friends
7. POST /api/v2/requests → Take new requests
8. POST /api/v2/runs/:id/advance → Move to next stop
9. (Repeat steps 4-8 for each stop)
10. POST /api/v2/runs/:id/complete → Finish run
```

### Workflow 2: Request Lifecycle
```
1. POST /api/v2/requests → Create request (status: pending)
2. PATCH /api/v2/requests/:id/status → Mark ready_for_delivery
3. GET /api/v2/runs/:id/preparation → Appears in checklist
4. PATCH /api/v2/requests/:id/status → Mark taken (loading)
5. GET /api/v2/runs/:id/execution → Shows in special requests
6. PATCH /api/v2/requests/:id/status → Mark delivered
7. GET /api/v2/requests/:id → View full history
```
