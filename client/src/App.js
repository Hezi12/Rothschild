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
import RoomsListPage from './pages/RoomsListPage';
import NotFoundPage from './pages/NotFoundPage';
import CalendarLinksPage from './pages/CalendarLinksPage';
import SearchResultsPage from './pages/SearchResultsPage';
import CancellationRequestPage from './pages/CancellationRequestPage';
import CancellationRedirectPage from './pages/CancellationRedirectPage';
import GalleryManagementPage from './pages/GalleryManagementPage';
import BookingListView from './pages/BookingListView';
import BookingsNewPage from './pages/BookingsNewPage';
import SimpleBookingList from './pages/SimpleBookingList';

// רכיבים
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AccessibilityWidget from './components/Accessibility/AccessibilityWidget';
import AccessibilityStatement from './components/Accessibility/AccessibilityStatement';

// קונטקסטים
import { BookingProvider } from './context/BookingContext';

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
        <BookingProvider>
          <AccessibilityWidget />
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* נתיבים ציבוריים */}
              <Route index element={<HomePage />} />
              <Route path="room/:id" element={<RoomPage />} />
              <Route path="search-results" element={<SearchResultsPage />} />
              <Route path="booking" element={<BookingPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="/cancel-booking/:id" element={<CancellationRequestPage />} />
              <Route path="cancel-booking/:id" element={<CancellationRequestPage />} />
              <Route path="cancel-redirect/:id" element={<CancellationRedirectPage />} />
              <Route path="accessibility-statement" element={<AccessibilityStatement />} />
              
              {/* נתיבים מוגנים (רק למנהלים) */}
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/bookings-calendar" element={<ProtectedRoute><BookingListView /></ProtectedRoute>} />
              <Route path="/dashboard/bookings-new" element={<ProtectedRoute><BookingsNewPage /></ProtectedRoute>} />
              <Route path="/dashboard/simple-bookings" element={<ProtectedRoute><SimpleBookingList /></ProtectedRoute>} />
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
              
              {/* דף 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BookingProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;
