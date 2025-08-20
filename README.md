# Friends Outreach CRM

A full-stack CRM application for managing outreach routes and locations.

## Features

- **Route Management**: Create, edit, and delete outreach routes
- **Location Management**: Add locations with descriptions and notes
- **Dynamic Assignment**: Move locations between routes with drag-and-drop interface
- **Real-time Updates**: Optimistic UI updates for instant feedback
- **Persistent State**: Route sections stay open during operations
- **Clean UI**: Material UI components with inline confirmations

## Tech Stack

### Backend
- Node.js with Express
- RESTful API endpoints
- In-memory data storage
- CORS enabled for development

### Frontend
- React with Vite
- Material UI components
- Optimistic updates for smooth UX
- Modular component architecture

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   node index.js
   ```
   Server runs on http://localhost:3000

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on http://localhost:5173

## API Endpoints

### Routes
- `GET /api/routes` - Get all routes
- `POST /api/routes` - Create new route
- `PATCH /api/routes/:id` - Update route
- `DELETE /api/routes/:id` - Delete route

### Locations
- `GET /api/locations` - Get all locations
- `POST /api/locations` - Create new location
- `PATCH /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

## Development Notes

- **Optimistic Updates**: All CRUD operations use optimistic updates for instant UI feedback
- **Error Handling**: Failed operations rollback to previous state
- **State Management**: React useState with prop drilling for simplicity
- **Component Architecture**: Modular components with clear separation of concerns
- **UI Persistence**: Route sections maintain open/closed state during operations

## Recent Improvements

- ✅ Eliminated `refreshAll()` calls causing component remounting
- ✅ Implemented optimistic updates for all CRUD operations
- ✅ Separated route editing and expansion state
- ✅ Added proper React keys to eliminate warnings
- ✅ Implemented inline confirmations without popup alerts
- ✅ Fixed server response format handling

## Future Enhancements

- [ ] Add database persistence
- [ ] Implement user authentication
- [ ] Add drag-and-drop reordering
- [ ] Export/import functionality
- [ ] Mobile responsive design
- [ ] Unit and integration tests
