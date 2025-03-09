import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import CssBaseline from '@mui/material/CssBaseline';

// דפים
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookingsCalendarPage from './pages/BookingsCalendarPage';
import RoomsListPage from './pages/RoomsListPage';
import NotFoundPage from './pages/NotFoundPage';

// רכיבים
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ICalExport from './components/ICalExport';

// יצירת קאש RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// יצירת ערכת נושא מותאמת אישית
const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Rubik, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 'bold',
        },
      },
    },
  },
});

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/ical/room-:roomNumber.ics" element={<ICalExport />} />
          
          <Route path="/" element={<Layout />}>
            {/* נתיבים ציבוריים */}
            <Route index element={<HomePage />} />
            <Route path="room/:id" element={<RoomPage />} />
            <Route path="booking" element={<BookingPage />} />
            <Route path="login" element={<LoginPage />} />
            
            {/* נתיבים מוגנים (רק למנהלים) */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="dashboard/bookings" element={
              <ProtectedRoute>
                <BookingsCalendarPage />
              </ProtectedRoute>
            } />
            <Route path="dashboard/rooms" element={
              <ProtectedRoute>
                <RoomsListPage />
              </ProtectedRoute>
            } />
            
            {/* דף 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App; 