import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, addDays, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  Tooltip,
  useMediaQuery,
  Container,
  Chip
} from '@mui/material';
import { alpha, useTheme, styled } from '@mui/material/styles';
import {
  ChevronLeft,
  ChevronRight,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Today as TodayIcon,
  Info as InfoIcon,
  Done as DoneIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import BookingDetailsDialog from '../components/BookingDetailsDialog';
import NewBookingDialog from '../components/NewBookingDialog';
import { useAuth } from '../context/AuthContext';

// סטיילינג לתאים בלוח השנה
const StyledDay = styled(Paper)(({ theme, isToday, isCurrentMonth, isSelected, hasBooking, isBlocked }) => ({
  height: '100px',
  overflow: 'hidden',
  padding: theme.spacing(1),
  color: !isCurrentMonth ? theme.palette.text.disabled : theme.palette.text.primary,
  backgroundColor: isSelected
    ? theme.palette.primary.light
    : isToday
    ? theme.palette.action.selected
    : isBlocked
    ? theme.palette.error.light
    : hasBooking
    ? theme.palette.warning.light
    : 'inherit',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  position: 'relative',
}));

// קומפוננטה להצגת הזמנה בתוך תא
const BookingChip = styled(Chip)(({ theme, status }) => ({
  margin: '2px 0',
  backgroundColor: 
    status === 'confirmed' ? theme.palette.success.main :
    status === 'pending' ? theme.palette.warning.main :
    status === 'canceled' ? theme.palette.error.main :
    theme.palette.info.main,
  color: '#fff',
  fontSize: '0.7rem',
  height: '20px',
  width: '100%',
  '& .MuiChip-label': {
    padding: '0 4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }
}));

// קומפוננטה משנית - תצוגת חדר בלוח
const RoomCell = ({ room }) => {
  return (
    <Box
      sx={{
        position: 'sticky',
        left: 0,
        minWidth: '120px',
        height: '100%',
        backgroundColor: 'background.paper',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxShadow: '2px 0 6px rgba(0,0,0,0.1)',
        zIndex: 10
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold">
        {room.internalName || `חדר ${room.roomNumber}`}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {room.maxGuests} אורחים | {room.basePrice} ₪
      </Typography>
    </Box>
  );
};

// קומפוננטה משנית - תצוגת הזמנה בתא
const BookingCellContent = ({ booking, onOpenDetails }) => {
  // קביעת צבע רקע לפי סטטוס תשלום
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return { background: '#d0f0c0', border: '#43a047' }; // ירוק
      case 'partial':
        return { background: '#fff9c4', border: '#fbc02d' }; // צהוב
      case 'unpaid':
        return { background: '#ffccbc', border: '#e64a19' }; // כתום
      default:
        return { background: '#e1f5fe', border: '#0288d1' }; // כחול
    }
  };
  
  const statusColor = getStatusColor(booking.paymentStatus);
  
  return (
    <Box 
      onClick={() => onOpenDetails(booking)}
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: statusColor.background,
        border: `2px solid ${statusColor.border}`,
        borderRadius: '4px',
        p: 0.5,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)'
        },
        transition: 'all 0.2s ease'
      }}
    >
      <Typography variant="caption" fontWeight="bold" noWrap>
        {booking.guest.firstName} {booking.guest.lastName}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        {booking.nights} לילות | {booking.totalPrice} ₪
      </Typography>
    </Box>
  );
};

// קומפוננטה משנית - תצוגת יום בלוח
const DayCell = ({ day, currentMonth, selectedDate, bookings, onSelectDate, onBookingClick }) => {
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isToday = isSameDay(day, new Date());
  const isSelected = selectedDate && isSameDay(day, selectedDate);
  
  // סינון הזמנות הרלוונטיות לתאריך הנוכחי
  const relevantBookings = bookings.filter(booking => {
    const bookingStart = new Date(booking.checkIn);
    const bookingEnd = new Date(booking.checkOut);
    return day >= bookingStart && day < bookingEnd;
  });
  
  const hasBooking = relevantBookings.length > 0;
  
  const handleClick = () => {
    onSelectDate(day);
  };

  const handleBookingClick = (e, booking) => {
    e.stopPropagation();
    onBookingClick(booking);
  };

  return (
    <StyledDay
      elevation={1}
      isToday={isToday}
      isCurrentMonth={isCurrentMonth}
      isSelected={isSelected}
      hasBooking={hasBooking}
      onClick={handleClick}
    >
      <Typography variant="caption" sx={{ position: 'absolute', top: 2, right: 5 }}>
        {format(day, 'd')}
      </Typography>
      
      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {relevantBookings.map(booking => (
          <BookingChip
            key={booking._id}
            label={`${booking.room?.roomNumber || 'חדר'} - ${booking.guest?.name || 'אורח'}`}
            status={booking.status}
            onClick={(e) => handleBookingClick(e, booking)}
            size="small"
          />
        ))}
      </Box>
    </StyledDay>
  );
};

// קומפוננטה משנית - כותרות תאריכים
const DayHeaders = ({ dates }) => {
  return (
    <Box sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
      {/* תא ריק עבור טור החדרים */}
      <Box sx={{ minWidth: '120px', height: '60px', p: 1 }} />
      
      {/* כותרות תאריכים */}
      {dates.map(date => (
        <Box 
          key={date.toString()}
          sx={{
            minWidth: '100px',
            height: '60px',
            p: 1,
            textAlign: 'center',
            fontWeight: isToday(date) ? 'bold' : 'normal',
            borderBottom: isToday(date) ? '2px solid blue' : 'none',
            backgroundColor: isToday(date) ? 'rgba(0, 0, 255, 0.05)' : 'transparent'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {format(date, 'EEE', { locale: he })}
          </Typography>
          <Typography variant="body2">
            {format(date, 'd/M', { locale: he })}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// קומפוננטה ראשית - דף ניהול הזמנות
const BookingCalendarNew = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // סטייט לשמירת נתונים
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const { logout } = useAuth();
  
  // יצירת מערך של ימים להצגה בלוח השנה
  useEffect(() => {
    const days = [];
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    setCalendarDays(days);
  }, [currentMonth]);
  
  // טעינת הזמנות וחדרים
  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, [currentMonth]);
  
  // פונקציה לטעינת הזמנות
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings`, {
        params: { startDate, endDate }
      });
      
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('שגיאה בטעינת הזמנות:', error);
      toast.error('שגיאה בטעינת הזמנות');
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה לטעינת חדרים
  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
      if (response.data.success) {
        setRooms(response.data.data);
      }
    } catch (error) {
      console.error('שגיאה בטעינת חדרים:', error);
    }
  };
  
  // מעבר לחודש הבא
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // מעבר לחודש הקודם
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // בחירת תאריך
  const handleDateSelect = (day) => {
    setSelectedDate(day);
  };
  
  // פתיחת דיאלוג פרטי הזמנה
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setBookingDetailsOpen(true);
  };
  
  // סגירת דיאלוג פרטי הזמנה
  const handleCloseBookingDetails = () => {
    setBookingDetailsOpen(false);
    setSelectedBooking(null);
  };
  
  // פתיחת דיאלוג הזמנה חדשה
  const handleOpenNewBooking = () => {
    setNewBookingOpen(true);
  };
  
  // סגירת דיאלוג הזמנה חדשה
  const handleCloseNewBooking = () => {
    setNewBookingOpen(false);
  };
  
  // עדכון לאחר יצירת הזמנה חדשה
  const handleBookingCreated = () => {
    fetchBookings();
  };
  
  // עדכון לאחר שינוי הזמנה
  const handleBookingChanged = () => {
    fetchBookings();
  };
  
  // שמות ימי השבוע
  const weekDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">לוח הזמנות</Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={prevMonth}>
              <KeyboardArrowRightIcon />
            </IconButton>
            
            <Typography variant="h6" sx={{ mx: 2 }}>
              {format(currentMonth, 'MMMM yyyy', { locale: he })}
            </Typography>
            
            <IconButton onClick={nextMonth}>
              <KeyboardArrowLeftIcon />
            </IconButton>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenNewBooking}
          >
            הזמנה חדשה
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={1} sx={{ mb: 1 }}>
              {weekDays.map((day, index) => (
                <Grid item xs key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      backgroundColor: 'primary.main',
                      color: 'white',
                    }}
                  >
                    <Typography variant="subtitle2">{day}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={1}>
              {calendarDays.map((day, index) => (
                <Grid item xs key={index}>
                  <DayCell
                    day={day}
                    currentMonth={currentMonth}
                    selectedDate={selectedDate}
                    bookings={bookings}
                    onSelectDate={handleDateSelect}
                    onBookingClick={handleBookingClick}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Paper>

      {/* דיאלוג פרטי הזמנה */}
      <BookingDetailsDialog
        open={bookingDetailsOpen}
        booking={selectedBooking}
        onClose={handleCloseBookingDetails}
        onBookingChange={handleBookingChanged}
      />

      {/* דיאלוג הזמנה חדשה */}
      <NewBookingDialog
        open={newBookingOpen}
        onClose={handleCloseNewBooking}
        onBookingCreated={handleBookingCreated}
        selectedRoom={null}
        selectedDates={selectedDate ? { start: selectedDate, end: addDays(selectedDate, 1) } : null}
      />
    </Box>
  );
};

export default BookingCalendarNew; 