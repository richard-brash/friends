# Friends Outreach CRM - User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Core Objects & Concepts](#core-objects--concepts)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Page-by-Page Guide](#page-by-page-guide)
5. [Common Workflows](#common-workflows)
6. [Terminology](#terminology)
7. [FAQ](#faq)

## Getting Started

### What is Friends Outreach CRM?
Friends Outreach CRM is a mobile-first application designed to help outreach organizations manage their street outreach operations. It tracks locations, routes, volunteers, friends (clients), and delivery requests in a coordinated system.

### First Login
1. Navigate to your deployed application URL
2. Use your assigned credentials to log in
3. Your role (Admin, Coordinator, or Volunteer) determines what features you can access

---

## Core Objects & Concepts

### 🗺️ **Locations**
Physical places where outreach happens (street corners, parks, shelters, etc.)
- **Purpose**: Define specific spots where friends are found
- **Contains**: Address/description, notes, GPS coordinates (future)
- **Used in**: Routes, friend assignments, delivery tracking

### 🛤️ **Routes** 
Organized sequences of locations for systematic outreach
- **Purpose**: Plan efficient paths through multiple locations
- **Contains**: Name, ordered list of locations, estimated duration
- **Used in**: Run planning, team assignments

### 👥 **Friends**
Individuals receiving outreach services (clients/beneficiaries)
- **Purpose**: Track people served, their needs, and contact history
- **Contains**: Name, preferred location, contact info, notes, status
- **Used in**: Request targeting, location planning, service history

### 📋 **Requests**
Specific items or services needed by friends
- **Purpose**: Track what needs to be delivered to whom
- **Contains**: Friend, item needed, priority, status, special instructions
- **Used in**: Run planning, delivery tracking, outcome reporting

### 🏃 **Runs**
Outreach events where teams visit routes to deliver services
- **Purpose**: Organize and track outreach activities
- **Contains**: Route, assigned team, date/time, status, progress
- **Used in**: Team coordination, delivery tracking, reporting

---

## User Roles & Permissions

### 👑 **Admin**
**Full access to all features**
- Manage users (create, edit, delete)
- Configure system settings
- Access developer tools
- Full CRUD on all objects
- View all reports and analytics

### 🎯 **Coordinator** 
**Manages outreach operations**
- Plan routes and locations
- Create and assign runs
- Manage requests and friends
- View team reports
- Cannot manage users or system settings

### 🙋 **Volunteer**
**Participates in outreach**
- View assigned runs
- Update delivery status
- Mark requests as completed/not found
- View friends at locations
- Cannot create/edit routes or assign runs

---

## Page-by-Page Guide

### 🏃 **Runs Page** (All Users)
**Purpose**: Central hub for outreach activities

**What You See:**
- List of all runs (past, current, upcoming)
- Run status indicators (Planned, In Progress, Completed)
- Assigned team members
- Route information

**Actions by Role:**
- **Volunteers**: View assigned runs, update delivery status
- **Coordinators**: Create runs, assign teams, manage all runs
- **Admins**: Full access to all run management

**Key Features:**
- Mobile-optimized delivery buttons for field use
- Real-time progress tracking
- Team management interface

### 🛤️ **Routes Page** (Coordinators & Admins)
**Purpose**: Plan and manage outreach routes

**What You See:**
- List of all routes with location counts
- Expandable route details showing ordered locations
- Drag-and-drop location reordering

**Key Actions:**
- Create new routes
- Add/remove/reorder locations within routes
- Edit route names and descriptions
- Delete routes (with safety checks)

**Best Practices:**
- Plan routes geographically for efficiency
- Include 3-8 locations per route for manageable runs
- Name routes descriptively (e.g., "Downtown Core", "Riverside Park")

### 📋 **Requests Page** (Coordinators & Admins)
**Purpose**: Manage service requests and deliveries

**What You See:**
- Filterable list of all requests
- Status tracking (Pending, Assigned, Delivered, etc.)
- Priority indicators
- Friend and location associations

**Key Actions:**
- Create new requests for friends
- Assign requests to runs
- Track delivery outcomes
- Update request status and notes

**Workflow:**
1. Request comes in (phone, in-person, etc.)
2. Create request in system
3. Assign to appropriate run based on friend's location
4. Track delivery during run
5. Mark as completed with outcome notes

### 👥 **Friends Page** (Coordinators & Admins)
**Purpose**: Manage relationships with service recipients

**What You See:**
- Directory of all friends
- Location assignments and history
- Contact information and notes
- Service request history

**Key Actions:**
- Add new friends to system
- Update contact information and notes
- Assign friends to preferred locations
- Track service history and outcomes

**Important Notes:**
- Respect privacy - only collect necessary information
- Keep notes professional and service-focused
- Update location preferences as people move

### ⚙️ **Settings Page** (Role-Based Access)

#### **Request Settings Tab** (All Roles)
- Configure request statuses, priorities, and categories
- Customize system labels for your organization

#### **User Management Tab** (Admins Only)
- Create, edit, and manage user accounts
- Assign roles and permissions
- Deactivate accounts when needed

#### **Developer Tools Tab** (Admins Only)
- Database management utilities
- Sample data loading for testing
- System diagnostics

### 👤 **Profile Page** (All Users)
**Purpose**: Manage personal account settings

**Available Actions:**
- View account information and role
- Change password
- Sign out of system

---

## Common Workflows

### 📱 **Daily Run Workflow** (Volunteers)
1. **Login** and check assigned runs for the day
2. **Navigate to Run** from Runs page
3. **Start Run** when beginning outreach
4. **Visit Each Location** in order
5. **Update Delivery Status** for each request:
   - ✅ **Delivered**: Successfully gave item to friend
   - ❌ **Not Found**: Friend not at usual location
   - 🔄 **Attempted**: Tried but couldn't complete
6. **Complete Run** when finished with route

### 📋 **Request Management Workflow** (Coordinators)
1. **Receive Request** (phone, email, in-person)
2. **Create Request** in system:
   - Select friend or create new friend
   - Specify item needed and priority
   - Add special instructions
3. **Assign to Run**:
   - Find run covering friend's location
   - Add request to run's delivery list
4. **Track Progress** during run execution
5. **Review Outcomes** after run completion

### 🗺️ **Route Planning Workflow** (Coordinators)
1. **Assess Coverage Areas** where friends are located
2. **Create New Route**:
   - Name descriptively
   - Add locations in logical order
   - Estimate duration
3. **Test Route** with volunteer feedback
4. **Refine** based on efficiency and safety
5. **Use for Regular Runs**

---

## Terminology

| Term | Definition | Example |
|------|------------|---------|
| **Friend** | Person receiving outreach services | John, who needs winter clothing |
| **Location** | Specific place where outreach happens | "5th & Main intersection" |
| **Route** | Planned path through multiple locations | "Downtown Core Route" |
| **Run** | Specific outreach event on a date | "Monday Morning Downtown Run" |
| **Request** | Item or service needed by a friend | "Warm coat for John, size Large" |
| **Delivery** | Attempt to fulfill a request during a run | "Delivered coat to John at 2pm" |
| **Assignment** | Connecting volunteers to runs | "Sarah assigned to Downtown Route" |
| **Status** | Current state of request or run | "Pending", "In Progress", "Completed" |

---

## FAQ

### **Q: Can I access the system offline?**
A: The system requires internet connection for real-time updates. Mobile data or WiFi hotspots work well for field use.

### **Q: What if I can't find a friend at their usual location?**
A: Mark the request as "Not Found" and add notes about when/where you checked. Try alternate locations if known.

### **Q: How do I handle urgent requests?**
A: Set priority to "High" or "Urgent" when creating the request. Coordinators can assign these to immediate runs.

### **Q: Can I see requests for friends I've helped before?**
A: Yes! Friend profiles show service history including past requests and deliveries.

### **Q: What if the system is slow or not working?**
A: Document activities on paper as backup, then enter into system when connectivity is restored.

### **Q: How do I request new features or report bugs?**
A: Use the GitHub Issues system (link in app) or contact your system administrator.

---

## Support & Feedback

- **Bug Reports**: [GitHub Issues](https://github.com/richard-brash/friends/issues/new?template=bug_report.md)
- **Feature Requests**: [GitHub Issues](https://github.com/richard-brash/friends/issues/new?template=feature_request.md)
- **Questions**: Contact your system administrator
- **Training**: Request additional training sessions as needed

---

*Last Updated: October 2025*