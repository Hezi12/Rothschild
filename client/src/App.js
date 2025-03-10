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
import CalendarLinksPage from './pages/CalendarLinksPage';
import IcalEditorPage from './pages/IcalEditorPage';
import SearchResultsPage from './pages/SearchResultsPage';
import InstallationGuidePage from './pages/InstallationGuidePage';
import CancellationRequestPage from './pages/CancellationRequestPage';
import CancellationRedirectPage from './pages/CancellationRedirectPage';
import GalleryManagementPage from './pages/GalleryManagementPage';
import BookingCalendarNew from './pages/BookingCalendarNew';

// רכיבים
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

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
          <Route path="/" element={<Layout />}>
            {/* נתיבים ציבוריים */}
            <Route index element={<HomePage />} />
            <Route path="room/:id" element={<RoomPage />} />
            <Route path="search-results" element={<SearchResultsPage />} />
            <Route path="booking" element={<BookingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="installation-guide" element={<InstallationGuidePage />} />
            <Route path="/cancel-booking/:id" element={<CancellationRequestPage />} />
            <Route path="cancel-booking/:id" element={<CancellationRequestPage />} />
            <Route path="cancel-redirect/:id" element={<CancellationRedirectPage />} />
            
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
            <Route path="dashboard/bookings-new" element={
              <ProtectedRoute>
                <BookingCalendarNew />
              </ProtectedRoute>
            } />
            <Route path="dashboard/rooms" element={
              <ProtectedRoute>
                <RoomsListPage />
              </ProtectedRoute>
            } />
            <Route path="dashboard/gallery" element={
              <ProtectedRoute>
                <GalleryManagementPage />
              </ProtectedRoute>
            } />
            <Route path="dashboard/calendar-links" element={
              <ProtectedRoute>
                <CalendarLinksPage />
              </ProtectedRoute>
            } />
            <Route path="dashboard/ical-editor" element={
              <ProtectedRoute>
                <IcalEditorPage />
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