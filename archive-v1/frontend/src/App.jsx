import React from 'react';
import { 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Tabs,
  Tab,
  Box, 
  Paper, 
  BottomNavigation, 
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip
} from '@mui/material';
import { 
  People, 
  DirectionsRun, 
  Assignment, 
  Route, 
  AccountCircle,
  Settings,
  Logout
} from '@mui/icons-material';
import { BrowserRouter as Router, Routes, Route as RouterRoute, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import FriendSection from './components/FriendSection';
import OutreachDashboard from './components/OutreachDashboard';
import RunSection from './components/RunSection';
import RequestsSection from './components/RequestsSection';
import AppFooter from './components/AppFooter';
import UserProfile from './components/auth/UserProfile';
import SettingsPage from './components/SettingsPage';
import RunPreparationScreen from './components/runs/RunPreparationScreen';
import ActiveRunScreen from './components/runs/ActiveRunScreen';


// Component wrapper for role-based sections
const RoleProtectedSection = ({ Component, requiredRoles, ...props }) => {
  if (requiredRoles) {
    return (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  }
  return <Component {...props} />;
};

const getSectionsForUser = (user) => {
  const baseSections = [
    { label: 'Runs', Component: RunSection, icon: DirectionsRun },
  ];

  // Add sections based on user role
  if (user?.role === 'admin' || user?.role === 'coordinator') {
    baseSections.push(
      { label: 'Routes', Component: OutreachDashboard, icon: Route, requiredRoles: ['admin', 'coordinator'] },
      { label: 'Requests', Component: RequestsSection, icon: Assignment, requiredRoles: ['admin', 'coordinator'] },
      { label: 'Friends', Component: FriendSection, icon: People, requiredRoles: ['admin', 'coordinator'] }
    );
  }

  // Add Settings for admins and coordinators
  if (user?.role === 'admin' || user?.role === 'coordinator') {
    baseSections.push(
      { label: 'Settings', Component: SettingsPage, icon: Settings, requiredRoles: ['admin', 'coordinator'] }
    );
  }

  // Add profile section for all authenticated users
  baseSections.push(
    { label: 'Profile', Component: UserProfile, icon: AccountCircle }
  );

  return baseSections;
};

// Get sections for mobile bottom navigation (excludes Profile since it's accessible from top menu)
const getMobileSectionsForUser = (user) => {
  const baseSections = [
    { label: 'Runs', Component: RunSection, icon: DirectionsRun },
  ];

  // Add sections based on user role
  if (user?.role === 'admin' || user?.role === 'coordinator') {
    baseSections.push(
      { label: 'Routes', Component: OutreachDashboard, icon: Route, requiredRoles: ['admin', 'coordinator'] },
      { label: 'Requests', Component: RequestsSection, icon: Assignment, requiredRoles: ['admin', 'coordinator'] },
      { label: 'Friends', Component: FriendSection, icon: People, requiredRoles: ['admin', 'coordinator'] }
    );
  }

  // Add Settings for admins and coordinators
  if (user?.role === 'admin' || user?.role === 'coordinator') {
    baseSections.push(
      { label: 'Settings', Component: SettingsPage, icon: Settings, requiredRoles: ['admin', 'coordinator'] }
    );
  }

  // Profile is excluded from mobile nav since it's accessible from top user menu

  return baseSections;
};

// Navigation component that works with React Router
function AppNavigation() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const allSections = getSectionsForUser(user);
  const mobileSections = getMobileSectionsForUser(user);
  
  // Use appropriate sections based on screen size
  const sections = isMobile ? mobileSections : allSections;

  // Get current route path and find matching section
  const getCurrentSectionIndex = () => {
    const currentPath = location.pathname;
    if (currentPath === '/' || currentPath === '/runs') return 0;
    if (currentPath === '/routes') return sections.findIndex(s => s.label === 'Routes');
    if (currentPath === '/requests') return sections.findIndex(s => s.label === 'Requests');
    if (currentPath === '/friends') return sections.findIndex(s => s.label === 'Friends');
    if (currentPath === '/settings') return sections.findIndex(s => s.label === 'Settings');
    if (currentPath === '/profile') return allSections.findIndex(s => s.label === 'Profile');
    return 0;
  };

  const handleNavigation = (sectionLabel) => {
    switch (sectionLabel) {
      case 'Runs': navigate('/runs'); break;
      case 'Routes': navigate('/routes'); break;
      case 'Requests': navigate('/requests'); break;
      case 'Friends': navigate('/friends'); break;
      case 'Settings': navigate('/settings'); break;
      case 'Profile': navigate('/profile'); break;
      default: navigate('/runs');
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'coordinator': return 'primary';
      case 'volunteer': return 'success';
      default: return 'default';
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Friends Outreach CRM
          </Typography>
          
          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<AccountCircle />}
              label={user?.name}
              color={getRoleColor(user?.role)}
              sx={{ color: 'white', fontWeight: 'bold' }}
            />
            <IconButton
              size="large"
              edge="end"
              aria-label="account menu"
              aria-controls="user-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
          
          {/* User Menu Dropdown */}
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
          >
            <MenuItem onClick={() => { handleNavigation('Profile'); handleMenuClose(); }}>
              <Settings sx={{ mr: 2 }} />
              Profile & Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 2 }} />
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Desktop Navigation Tabs */}
      {!isMobile && (
        <Tabs 
          value={getCurrentSectionIndex()} 
          onChange={(event, newValue) => {
            const section = sections[newValue];
            if (section) handleNavigation(section.label);
          }}
          centered 
          sx={{ mb: 2, bgcolor: 'background.paper' }}
        >
          {sections.map((section, index) => (
            <Tab 
              key={section.label} 
              label={section.label} 
              icon={<section.icon />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      )}
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          value={getCurrentSectionIndex()}
          onChange={(event, newValue) => {
            const section = sections[newValue];
            if (section) handleNavigation(section.label);
          }}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          {sections.map((section, index) => (
            <BottomNavigationAction
              key={section.label}
              label={section.label}
              icon={<section.icon />}
              value={index}
            />
          ))}
        </BottomNavigation>
      )}
    </>
  );
}

// Main authenticated app component with routes
function AuthenticatedApp() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ 
      bgcolor: '#f5f5f5', 
      minHeight: '100vh',
      paddingBottom: isMobile ? '80px' : '0' // Space for bottom nav on mobile
    }}>
      <CssBaseline />
      <AppNavigation />
      
      <Box sx={{ 
        maxWidth: isMobile ? '100%' : 1000, 
        mx: 'auto', 
        p: isMobile ? 1 : 2 
      }}>
        <Paper sx={{ p: isMobile ? 1 : 2 }} elevation={2}>
          <Routes>
            <RouterRoute path="/" element={<Navigate to="/runs" replace />} />
            <RouterRoute path="/runs" element={
              <RoleProtectedSection Component={RunSection} />
            } />
            <RouterRoute path="/runs/:id/prepare" element={
              <RoleProtectedSection Component={RunPreparationScreen} />
            } />
            <RouterRoute path="/runs/:id/active" element={
              <RoleProtectedSection Component={ActiveRunScreen} />
            } />
            <RouterRoute path="/routes" element={
              <RoleProtectedSection Component={OutreachDashboard} requiredRoles={['admin', 'coordinator']} />
            } />
            <RouterRoute path="/requests" element={
              <RoleProtectedSection Component={RequestsSection} requiredRoles={['admin', 'coordinator']} />
            } />
            <RouterRoute path="/friends" element={
              <RoleProtectedSection Component={FriendSection} requiredRoles={['admin', 'coordinator']} />
            } />
            <RouterRoute path="/settings" element={
              <RoleProtectedSection Component={SettingsPage} requiredRoles={['admin', 'coordinator']} />
            } />
            <RouterRoute path="/profile" element={
              <RoleProtectedSection Component={UserProfile} />
            } />
          </Routes>
        </Paper>
      </Box>
      
      {!isMobile && <AppFooter />}
    </Box>
  );
}

// Root App component with Router and AuthProvider
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ProtectedRoute>
          <AuthenticatedApp />
        </ProtectedRoute>
      </AuthProvider>
    </Router>
  );
}
