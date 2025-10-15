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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import FriendSection from './components/FriendSection';
import OutreachDashboard from './components/OutreachDashboard';
import RunSection from './components/RunSection';
import RequestsSection from './components/RequestsSection';
import AppFooter from './components/AppFooter';
import UserProfile from './components/auth/UserProfile';
import SettingsPage from './components/SettingsPage';


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

// Main authenticated app component
function AuthenticatedApp() {
  const [tab, setTab] = React.useState(0);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();

  const sections = getSectionsForUser(user);
  const Section = sections[tab]?.Component;

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
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
    <Box sx={{ 
      bgcolor: '#f5f5f5', 
      minHeight: '100vh',
      paddingBottom: isMobile ? '80px' : '0' // Space for bottom nav on mobile
    }}>
      <CssBaseline />
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
            <MenuItem onClick={() => setTab(sections.findIndex(s => s.label === 'Profile'))}>
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
      
      {/* Desktop Navigation */}
      {!isMobile && (
        <Tabs 
          value={tab} 
          onChange={handleTabChange} 
          centered 
          sx={{ mb: 2, bgcolor: 'background.paper' }}
        >
          {sections.map((s, index) => (
            <Tab 
              key={s.label} 
              label={s.label} 
              icon={<s.icon />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      )}
      
      <Box sx={{ 
        maxWidth: isMobile ? '100%' : 1000, 
        mx: 'auto', 
        p: isMobile ? 1 : 2 
      }}>
        <Paper sx={{ p: isMobile ? 1 : 2 }} elevation={2}>
          {Section && (
            <RoleProtectedSection 
              Component={Section} 
              requiredRoles={sections[tab]?.requiredRoles}
            />
          )}
        </Paper>
      </Box>
      
      {!isMobile && <AppFooter />}
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          value={tab}
          onChange={handleTabChange}
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
    </Box>
  );
}

// Root App component with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AuthenticatedApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}
