import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import {
  DirectionsRun as RunsIcon,
  People as FriendsIcon,
  Assignment as RequestsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navItems = [
    { label: 'Runs', value: '/runs', icon: <RunsIcon /> },
    { label: 'Friends', value: '/friends', icon: <FriendsIcon /> },
    { label: 'Requests', value: '/requests', icon: <RequestsIcon /> },
  ];

  const currentPath = '/' + location.pathname.split('/')[1];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top AppBar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Friends Outreach
          </Typography>

          {!isMobile && (
            <Tabs
              value={currentPath}
              textColor="inherit"
              indicatorColor="secondary"
              sx={{ flexGrow: 1, ml: 4 }}
            >
              {navItems.map((item) => (
                <Tab
                  key={item.value}
                  label={item.label}
                  value={item.value}
                  onClick={() => navigate(item.value)}
                />
              ))}
            </Tabs>
          )}

          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.name || user?.email}
          </Typography>
          <IconButton color="inherit" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          pb: isMobile ? 8 : 0, // Space for bottom nav on mobile
        }}
      >
        <Outlet />
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          value={currentPath}
          onChange={(event, newValue) => navigate(newValue)}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
}
