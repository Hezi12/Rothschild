import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  IconButton, 
  Button, 
  alpha, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import { 
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Today as TodayIcon,
  Dashboard as DashboardIcon,
  BarChart as BarChartIcon,
  Public as PublicIcon,
  CreditCard as CreditCardIcon,
  Add as AddIcon,
  Search as SearchIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

// פונקציות שרות
import { calculateVisibleDays } from './utils/dateUtils';
import { formatPrice } from './utils/priceUtils';
import { formatBookingStatus, formatPaymentMethod } from './utils/bookingUtils';

// רכיבי UI
import MinimalSidebar from './components/MinimalSidebar';
import SidebarButton from './components/SidebarButton';
import CalendarGrid from './components/CalendarGrid';

// הוקים מותאמים אישית
import useFetchData from './hooks/useFetchData';
import useCalendarView from './hooks/useCalendarView';
import useBookingManager from './hooks/useBookingManager';

// דיאלוגים
import SearchDialog from './dialogs/SearchDialog';
import BookingDialog from './dialogs/BookingDialog';

// ייצוא הדיאלוגים והרכיבים למקרה שצריך להשתמש בהם במקום אחר
export { BookingDialog, SearchDialog };
export { CalendarGrid, MinimalSidebar, SidebarButton };
export { useFetchData, useCalendarView, useBookingManager };

// רכיב ראשי
const BookingsManager = () => {
  const theme = useTheme();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // רספונסיביות
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // קונטקסט
  const { isAdmin } = React.useContext(AuthContext);
  
  // הוקים מותאמים
  const { 
    rooms, 
    bookings, 
    loading, 
    error 
  } = useFetchData();
  
  const { 
    currentWeekStartDate, 
    daysInView, 
    goToPreviousWeek, 
    goToNextWeek, 
    goToToday,
    jumpToDate 
  } = useCalendarView();
  
  const { 
    selectedBooking,
    bookingDialogOpen,
    searchDialogOpen,
    setBookingDialogOpen,
    setSearchDialogOpen,
    handleAddBooking,
    handleEditBooking,
    handleSaveBooking,
    handleDeleteBooking,
    handleOpenSearchDialog,
    getPaymentMethodLabel
  } = useBookingManager();
  
  // רנדור הממשק
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* סרגל צדדי */}
      <MinimalSidebar>
        <SidebarButton title="דשבורד" placement="right" isActive={currentPath === '/dashboard'}>
          <IconButton component={RouterLink} to="/dashboard">
            <DashboardIcon sx={{ fontSize: '1.5rem', color: '#3f51b5' }} />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="דוחות הכנסה" placement="right" isActive={currentPath === '/dashboard/income-report'}>
          <IconButton component={RouterLink} to="/dashboard/income-report">
            <BarChartIcon sx={{ fontSize: '1.5rem', color: '#4caf50' }} />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="אתר הבית" placement="right" isActive={currentPath === '/'}>
          <IconButton component={RouterLink} to="/">
            <PublicIcon sx={{ fontSize: '1.5rem', color: '#1976d2' }} />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="Booking.com" placement="right">
          <IconButton 
            onClick={() => window.open('https://account.booking.com/sign-in', '_blank')}
          >
            <Box 
              sx={{ 
                width: 28, 
                height: 28, 
                fontSize: '1.2rem', 
                bgcolor: '#0896ff', 
                fontWeight: 'bold',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              B
            </Box>
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="CreditGuard" placement="right">
          <IconButton 
            onClick={() => window.open('https://console.creditguard.co.il/html/login.html', '_blank')}
          >
            <CreditCardIcon sx={{ fontSize: '1.5rem', color: '#F27935' }} />
          </IconButton>
        </SidebarButton>
      </MinimalSidebar>
      
      <Box sx={{ 
        p: 3,
        maxWidth: '1600px', // מגדיר רוחב מקסימלי למכל
        mx: 'auto'
      }}>
        {/* בר ניווט בין תאריכים - שורה יחידה המשלבת הכל */}
        <Paper sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2, 
          p: 1,
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: alpha(theme.palette.primary.light, 0.05),
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              px: 0.5
            }}
          >
            <IconButton 
              onClick={goToPreviousWeek} 
              size="small" 
              disableRipple
              sx={{ 
                p: 0.5,
                color: theme.palette.text.secondary
              }}
            >
              <NavigateNextIcon fontSize="small" />
            </IconButton>
            
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 'medium', 
                mx: 1, 
                color: theme.palette.text.primary,
                fontSize: '0.95rem'
              }}
            >
              {daysInView.length > 0 && 
                `${format(daysInView[0], 'dd/MM')} - ${format(daysInView[daysInView.length - 1], 'dd/MM')}`
              }
            </Typography>
            
            <IconButton 
              onClick={goToNextWeek} 
              size="small"
              disableRipple 
              sx={{ 
                p: 0.5,
                color: theme.palette.text.secondary
              }}
            >
              <NavigateBeforeIcon fontSize="small" />
            </IconButton>
            
            <IconButton 
              onClick={goToToday}
              size="small"
              disableRipple
              sx={{ 
                p: 0.5,
                color: theme.palette.primary.main
              }}
            >
              <TodayIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              onClick={handleOpenSearchDialog}
              size="small"
              sx={{ 
                bgcolor: alpha(theme.palette.info.main, 0.1),
                borderRadius: '8px',
                color: theme.palette.info.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.info.main, 0.2),
                }
              }}
              startIcon={<SearchIcon fontSize="small" />}
            >
              חיפוש
            </Button>
            
            <Button
              onClick={() => handleAddBooking()}
              size="small" 
              color="primary"
              variant="contained"
              sx={{ 
                borderRadius: '8px',
              }}
              startIcon={<AddIcon fontSize="small" />}
            >
              הזמנה חדשה
            </Button>
          </Box>
        </Paper>
        
        {/* לוח השנה */}
        {loading ? (
          <Typography variant="body1">טוען נתונים...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <CalendarGrid
            days={daysInView}
            rooms={rooms}
            bookings={bookings}
            onCellClick={handleAddBooking}
            onBookingClick={handleEditBooking}
          />
        )}
      </Box>
      
      {/* דיאלוגים */}
      {bookingDialogOpen && (
        <BookingDialog
          open={bookingDialogOpen}
          onClose={() => setBookingDialogOpen(false)}
          selectedBooking={selectedBooking}
          onSave={handleSaveBooking}
          onDelete={handleDeleteBooking}
          rooms={rooms}
          formatPrice={formatPrice}
          formatBookingStatus={formatBookingStatus}
          formatPaymentMethod={formatPaymentMethod}
          getPaymentMethodLabel={getPaymentMethodLabel}
        />
      )}
      
      <SearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onViewBooking={handleEditBooking}
        onJumpToDate={jumpToDate}
        getPaymentMethodLabel={getPaymentMethodLabel}
      />
    </LocalizationProvider>
  );
};

// הרכבת הרכיב הסופי
const BookingsManagerWithProvider = () => {
  return (
    <BookingsManager />
  );
};

export default BookingsManagerWithProvider; 