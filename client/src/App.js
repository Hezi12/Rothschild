import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { rtlCache, theme } from './theme';
import { CacheProvider } from '@emotion/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

// Pages
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import RoomPage from './pages/RoomPage';
import RoomsListPage from './pages/RoomsListPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookingsCalendarPage from './pages/BookingsCalendarPage';
import IcalEditorPage from './pages/IcalEditorPage';
import CalendarLinksPage from './pages/CalendarLinksPage';
import ManageBookingPage from './pages/ManageBookingPage';
import SearchResultsPage from './pages/SearchResultsPage';
import FindBookingPage from './pages/FindBookingPage';
import CancelBookingPage from './pages/CancelBookingPage';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
          <CssBaseline />
          <Router>
            <Routes>
              {/* ניתובים ציבוריים */}
              <Route path="/" element={<HomePage />} />
              <Route path="/room/:id" element={<RoomPage />} />
              <Route path="/booking/:roomId?" element={<BookingPage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/manage-booking/:id" element={<ManageBookingPage />} />
              <Route path="/find-booking" element={<FindBookingPage />} />
              <Route path="/cancel-booking" element={<CancelBookingPage />} />

              {/* ניתובים מוגנים */}
              <Route path="/admin" element={<ProtectedRoute Component={DashboardPage} />} />
              <Route path="/admin/rooms" element={<ProtectedRoute Component={RoomsListPage} />} />
              <Route path="/admin/bookings" element={<ProtectedRoute Component={BookingsCalendarPage} />} />
              <Route path="/admin/ical-editor" element={<ProtectedRoute Component={IcalEditorPage} />} />
              <Route path="/admin/calendar-links" element={<ProtectedRoute Component={CalendarLinksPage} />} />
            </Routes>
          </Router>
          <ToastContainer 
            position="bottom-right"
            rtl={true}
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </LocalizationProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App; 