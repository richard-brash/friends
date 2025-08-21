import React from 'react';
import { CssBaseline, AppBar, Toolbar, Typography, Tabs, Tab, Box, Paper } from '@mui/material';
import FriendSection from './components/FriendSection';
import UserSection from './components/UserSection';
import OutreachDashboard from './components/OutreachDashboard';
import RouteLocationDashboard from './components/RouteLocationDashboard';
import RunSection from './components/RunSection';
import RequestSection from './components/RequestSection';
import DeveloperTools from './components/DeveloperTools';
import AppFooter from './components/AppFooter';


const sections = [
  { label: 'Friends', Component: FriendSection },
  { label: 'Users', Component: UserSection },
  { label: 'Outreach Dashboard', Component: OutreachDashboard },
  { label: 'Runs', Component: RunSection },
  { label: 'Requests', Component: RequestSection },
];

export default function App() {
  const [tab, setTab] = React.useState(0);
  const Section = sections[tab].Component;
  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Friends Outreach CRM
          </Typography>
        </Toolbar>
      </AppBar>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 2, bgcolor: 'background.paper' }}>
        {sections.map(s => <Tab key={s.label} label={s.label} />)}
      </Tabs>
      <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
        <Paper sx={{ p: 2 }} elevation={2}>
          <Section RouteLocationDashboard={RouteLocationDashboard} />
        </Paper>
        <DeveloperTools />
      </Box>
      <AppFooter />
    </Box>
  );
}
