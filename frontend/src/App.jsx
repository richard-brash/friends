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
  useTheme
} from '@mui/material';
import { 
  People, 
  DirectionsRun, 
  Assignment, 
  Dashboard, 
  SupervisedUserCircle 
} from '@mui/icons-material';
import FriendSection from './components/FriendSection';
import UserSection from './components/UserSection';
import OutreachDashboard from './components/OutreachDashboard';
import RouteLocationDashboard from './components/RouteLocationDashboard';
import RunSection from './components/RunSection';
import RequestsSection from './components/RequestsSection';
import DeveloperTools from './components/DeveloperTools';
import AppFooter from './components/AppFooter';


const sections = [
  { label: 'Friends', Component: FriendSection, icon: People },
  { label: 'Users', Component: UserSection, icon: SupervisedUserCircle },
  { label: 'Dashboard', Component: OutreachDashboard, icon: Dashboard },
  { label: 'Runs', Component: RunSection, icon: DirectionsRun },
  { label: 'Requests', Component: RequestsSection, icon: Assignment },
];

export default function App() {
  const [tab, setTab] = React.useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const Section = sections[tab].Component;

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
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
          <Section RouteLocationDashboard={RouteLocationDashboard} />
        </Paper>
        {!isMobile && <DeveloperTools />}
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
