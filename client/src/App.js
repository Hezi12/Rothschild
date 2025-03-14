import React, { useEffect } from 'react';
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
import BookingCalendarNew from './pages/BookingCalendarNew';
import BookingsNewPage from './pages/BookingsNewPage';

// רכיבים
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// יצירת קאש RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// יצירת ערכת נושא מותאמת אישית עם תמיכה בנגישות
const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#1976d2',
      light: '#4791db',
      dark: '#115293',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057',
      light: '#f73378',
      dark: '#ab003c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000de',
      secondary: '#0000008a',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Rubik, Arial, sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 'bold',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.875rem',
        },
      },
    },
  },
});

function App() {
  useEffect(() => {
    // הוספת תכונות נגישות
    document.documentElement.lang = 'he';
    
    // הוספת תמיכה בקורא מסך
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.setAttribute('role', 'main');
      rootElement.setAttribute('aria-label', 'מלונית רוטשילד 79');
    }
  }, []);

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
            <Route path="/cancel-booking/:id" element={<CancellationRequestPage />} />
            <Route path="cancel-booking/:id" element={<CancellationRequestPage />} />
            <Route path="cancel-redirect/:id" element={<CancellationRedirectPage />} />
            
            {/* נתיבים מוגנים (רק למנהלים) */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/bookings-calendar" element={<ProtectedRoute><BookingCalendarNew /></ProtectedRoute>} />
            <Route path="/dashboard/bookings-new" element={<ProtectedRoute><BookingsNewPage /></ProtectedRoute>} />
            
            {/* Add other protected routes */}
            <Route path="/dashboard/rooms" element={
              <ProtectedRoute>
                <RoomsListPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/calendar-links" element={
              <ProtectedRoute>
                <CalendarLinksPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/gallery" element={
              <ProtectedRoute>
                <GalleryManagementPage />
              </ProtectedRoute>
            } />
            
            {/* הנתיב השגיאה (404) */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App; 