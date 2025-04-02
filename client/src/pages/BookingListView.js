import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { format, addDays, addMonths, subMonths, isSameDay, getDay, differenceInDays, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  Avatar,
  styled,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  // אייקונים בשימוש 
  Add as AddIcon,
  Today as TodayIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarMonth as CalendarMonthIcon,
  Hotel as HotelIcon,
  Person as PersonIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Circle as CircleIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
  WhatsApp as WhatsAppIcon,
  MonetizationOn as MonetizationOnIcon,
  Assessment as AssessmentIcon,
  // אייקונים חדשים לסרגל הצדדי
  Dashboard as DashboardIcon,
  ListAlt as ListAltIcon,
  Collections as CollectionsIcon,
  Home as HomeIcon,
  Groups as GroupsIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { BookingContext } from '../context/BookingContext';
import { toast } from 'react-toastify';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { InputAdornment } from '@mui/material';
import { DraggableBookingCell, DroppableBookingCell, handleBookingDrop } from '../features/drag-and-drop/DraggableBooking.js';
import DragHint from '../features/drag-and-drop/DragHint.js';
import { Link as RouterLink } from 'react-router-dom';
import BookingDialog from '../components/BookingDialog';

// קומפוננטות מותאמות אישית עם styled
const StyledTableCell = styled(TableCell)(({ theme, isWeekend, isToday }) => ({
  padding: theme.spacing(0.5), // הוקטן עוד יותר
  minWidth: '95px', // הוקטן מ-100px ל-95px
  background: isToday 
    ? alpha(theme.palette.primary.light, 0.12)
    : isWeekend 
      ? alpha(theme.palette.warning.light, 0.05)
      : alpha(theme.palette.background.paper, 0.6),
  fontWeight: isToday ? 'bold' : 'normal',
  borderBottom: isToday 
    ? `2px solid ${theme.palette.primary.main}` 
    : `1px solid ${alpha(theme.palette.divider, 0.7)}`,
  position: 'sticky',
  top: 0,
  zIndex: 1,
}));

const StyledRoomCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  position: 'sticky',
  left: 0,
  backgroundColor: theme.palette.background.default,
  zIndex: 10,
  boxShadow: '3px 0 10px rgba(0,0,0,0.15)',
  minWidth: '65px', // הוקטן מ-70px
  maxWidth: '90px', // הוקטן מ-100px
  padding: theme.spacing(0.65), // הוקטן מ-0.75
  paddingRight: theme.spacing(0.65), // הוקטן מ-0.75
  paddingLeft: theme.spacing(1.25) // הוקטן מ-1.5
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  textTransform: 'none',
  padding: theme.spacing(1, 2),
  transition: 'all 0.3s',
  boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 10px rgba(0,0,0,0.15)',
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'confirmed': return theme.palette.success;
      case 'pending': return theme.palette.warning;
      case 'canceled': return theme.palette.error;
      case 'completed': return theme.palette.info;
      default: return theme.palette.grey;
    }
  };
  
  const statusColor = getStatusColor();
  
  return {
    fontWeight: 'bold',
    backgroundColor: 'transparent',
    color: statusColor.dark,
    border: 'none',
    '& .MuiChip-label': {
      padding: '0',
      fontSize: '0.7rem'
    }
  };
});

// סגנון להבהוב של האייקון בכותרות הטבלה
const BlinkingDot = styled(CircleIcon)(({ theme }) => ({
  '@keyframes blink': {
    '0%': { opacity: 0.3 },
    '50%': { opacity: 1 },
    '100%': { opacity: 0.3 },
  },
  animation: 'blink 2s infinite',
}));

// הוספת קומפוננטת עמודה עם הדגשת יום
const HighlightedColumn = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  pointerEvents: 'none',
  boxShadow: 'none', // מסיר את המסגרת הכפולה
  backgroundColor: alpha('#ff9800', 0.05), // מוסיף רקע כתום עדין יותר
  zIndex: 0,
  borderRadius: '4px'
}));

// קומפוננטה חדשה - סרגל צדדי מינימליסטי
const MinimalSidebar = styled(Box)(({ theme }) => ({
  position: 'fixed',
  left: 0, // סרגל בצד שמאל
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
  padding: '10px 0',
  backgroundColor: '#ffffff',
  boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
  borderRadius: '0 8px 8px 0', // עיגול בהתאם לצד שמאל
  zIndex: 100,
  gap: '5px',
  width: '60px' // רוחב קבוע וצר
}));

const SidebarButton = styled(Tooltip)(({ theme, isActive }) => ({
  '& .MuiButtonBase-root': {
    padding: '12px',
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05)
    },
    transition: 'all 0.3s ease',
    borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent', // גבול בצד שמאל
    borderRight: 'none'
  }
}));

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */

const BookingListView = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // האם המכשיר טאבלט (מסך בינוני)
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // שיעור המע"מ
  const vatRate = 17;
  
  // גישה ל-Context
  const { isAdmin } = useContext(AuthContext);
  // הוספת שימוש בקונטקסט הזמנות
  const { 
    bookings: contextBookings, 
    fetchBookings: contextFetchBookings, 
    updateBooking, 
    updatePaymentStatus, 
    deleteBooking,
    createBooking: contextCreateBooking
  } = useContext(BookingContext);
  
  // סטייטים להודעות
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // סטייטים זמניים לעדכון תשלום
  const [tempPaymentStatus, setTempPaymentStatus] = useState(null);
  const [tempPaymentMethod, setTempPaymentMethod] = useState(null);
  
  // סטייטים
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysInView, setDaysInView] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [priceDialog, setPriceDialog] = useState({
    open: false,
    roomId: null,
    date: null,
    price: 0
  });
  const [bookingDialog, setBookingDialog] = useState({
    open: false,
    bookingId: null,
    bookingData: null,
    loading: false
  });
  
  // סטייט חדש עבור דיאלוג יצירת הזמנה חדשה
  const [newBookingDialog, setNewBookingDialog] = useState({
    open: false,
    loading: false,
    formData: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      checkIn: null,
      checkOut: null,
      roomId: '',
      totalPrice: 0,
      pricePerNight: 0,
      pricePerNightNoVat: 0,
      nights: 0,
      isTourist: false,
      creditCard: {
        cardNumber: '',
        cardExpiry: '',
        cardCvc: '',
        cardHolder: ''
      }
    }
  });
  
  // טווח ימים להצגה
  const daysToShow = isMobile ? 3 : isTablet ? 7 : 14;

  // יצירת טווח ימים להצגה
  useEffect(() => {
    const days = [];
    const today = new Date();
    
    // מתחיל מיומיים לפני היום הנוכחי
    for (let i = -2; i < daysToShow - 2; i++) {
      days.push(addDays(today, i));
    }
    
    setDaysInView(days);
  }, [daysToShow, isMobile, isTablet]);
  
  // משתנה סטייט למחירים דינמיים
  const [dynamicPrices, setDynamicPrices] = useState([]);
  
  const currentPath = location.pathname;
  
  // פונקציה לטעינת מחירים דינמיים
  const fetchDynamicPrices = async (startDate, endDate) => {
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(addDays(endDate, 7), 'yyyy-MM-dd'); // נוסיף שבוע נוסף לטווח שאנחנו מציגים
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/dynamic-prices`, {
        params: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        },
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.prices) {
        setDynamicPrices(response.data.prices);
        console.log('נטענו מחירים דינמיים:', response.data.prices.length);
      }
    } catch (error) {
      // שגיאת 404 מעידה שהנתיב לא קיים, לא נציג הודעה כדי לא להבהיל את המשתמש
      if (error.response && error.response.status === 404) {
        console.log('נתיב המחירים הדינמיים אינו זמין, המערכת תשתמש במחירים הרגילים');
        // אתחול מערך ריק כדי שהקוד ידע להשתמש במחירים רגילים
        setDynamicPrices([]);
      } else {
        // שגיאות אחרות - רישום לקונסול בלבד, ללא הודעה למשתמש
        console.error('שגיאה בטעינת מחירים דינמיים:', error);
      }
    }
  };
  
  // פונקציה לקבלת מחיר לחדר ספציפי ביום ספציפי
  const getPriceForRoomAndDate = (roomId, date) => {
    const formattedDate = format(new Date(date), 'yyyy-MM-dd');
    
    // חיפוש מחיר דינמי למועד ספציפי
    const dynamicPrice = dynamicPrices.find(
      dp => dp.roomId === roomId && dp.date === formattedDate
    );
    
    if (dynamicPrice) {
      return dynamicPrice.price;
    }
    
    // אם אין מחיר דינמי, השתמש במחירי החדר הרגילים
    const room = rooms.find(r => r._id === roomId);
    if (!room) return 0;
    
    const dayOfWeek = getDay(new Date(date));
    
    // בדוק אם יש מחירים מיוחדים במפת specialPrices
    if (room.specialPrices) {
      try {
        // יום שישי (5)
        if (dayOfWeek === 5) {
          // אם specialPrices הוא אובייקט JSON
          if (typeof room.specialPrices === 'object' && room.specialPrices.friday) {
            return room.specialPrices.friday;
          }
          // אם specialPrices הוא Map
          else if (room.specialPrices.get && room.specialPrices.get('friday')) {
            return room.specialPrices.get('friday');
          }
        }
        // יום שבת (6)
        else if (dayOfWeek === 6) {
          // אם specialPrices הוא אובייקט JSON
          if (typeof room.specialPrices === 'object' && room.specialPrices.saturday) {
            return room.specialPrices.saturday;
          }
          // אם specialPrices הוא Map
          else if (room.specialPrices.get && room.specialPrices.get('saturday')) {
            return room.specialPrices.get('saturday');
          }
        }
      } catch (error) {
        console.log('שגיאה בגישה למחירים מיוחדים:', error);
      }
    }
    
    // מחיר רגיל אם אין מחיר מיוחד
    return room.basePrice;
  };
  
  // טעינת חדרים
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        // מיון החדרים לפי מספר החדר
        const sortedRooms = [...response.data.data].sort((a, b) => a.roomNumber - b.roomNumber);
        setRooms(sortedRooms);
      }
    } catch (error) {
      console.error('שגיאה בטעינת החדרים:', error);
      setError('אירעה שגיאה בטעינת החדרים');
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה לטעינת הזמנות מהקונטקסט במקום מקומית
  const fetchBookingsData = useCallback(async (month = currentMonth) => {
    try {
      setLoading(true);
      
      // יצירת טווח תאריכים לחודש הנבחר
      const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      // נוסיף עוד ימים בהתאם למספר הימים לתצוגה
      const extendedLastDay = addDays(lastDay, 14);
      
      // קריאה לקונטקסט במקום API ישירות
      await contextFetchBookings({
        startDate: format(firstDay, 'yyyy-MM-dd'),
        endDate: format(extendedLastDay, 'yyyy-MM-dd')
      });
      
      // עדכון רשימת הימים לתצוגה
      const days = [];
      const startDay = new Date(month);
      // מתחיל מיומיים לפני היום שנבחר
      startDay.setDate(startDay.getDate() - 2);
      for (let i = 0; i < daysToShow; i++) {
        days.push(addDays(startDay, i));
      }
      setDaysInView(days);
    } catch (error) {
      console.error('שגיאה בטעינת הזמנות:', error);
      setError('שגיאה בטעינת ההזמנות');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, isMobile, isTablet, daysToShow, contextFetchBookings]);
  
  // פונקציה לקבלת הזמנות לחדר ספציפי ביום ספציפי
  const getBookingsForRoomAndDate = (roomId, date) => {
    if (!bookings || !roomId || !date) return [];
    
    // מסנן הזמנות שבוטלו
    const activeBookings = bookings.filter(booking => 
      booking.paymentStatus !== 'canceled' && booking.status !== 'canceled'
    );
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // מצא את כל ההזמנות לחדר ספציפי בתאריך ספציפי
    const roomBookings = activeBookings.filter(booking => {
      // בדיקת הזמנות מרובות חדרים
      if (booking.isMultiRoomBooking && booking.rooms && Array.isArray(booking.rooms)) {
        // בדוק אם החדר הנוכחי נמצא ברשימת החדרים של ההזמנה המרובה
        const isRoomIncluded = booking.rooms.some(room => 
          (typeof room === 'object' && room._id === roomId) || 
          (typeof room === 'string' && room === roomId)
        );
        
        if (!isRoomIncluded) return false;
      }
      // בדיקת הזמנות חדר בודד
      else if (booking.room) {
        const roomIdMatch = (booking.room._id === roomId || booking.room === roomId);
        if (!roomIdMatch) return false;
      } 
      // אם אין חדר בהזמנה, דלג על ההזמנה
      else {
        return false;
      }
      
      const checkIn = booking.checkIn ? new Date(booking.checkIn) : null;
      const checkOut = booking.checkOut ? new Date(booking.checkOut) : null;
      
      if (!checkIn || !checkOut) return false;
      
      const formattedCheckIn = format(checkIn, 'yyyy-MM-dd');
      const formattedCheckOut = format(checkOut, 'yyyy-MM-dd');
      
      const startDate = new Date(formattedCheckIn);
      const endDate = new Date(formattedCheckOut);
      const targetDate = new Date(formattedDate);
      
      // בדוק אם התאריך הנוכחי נמצא בטווח התאריכים של ההזמנה
      return (targetDate >= startDate && targetDate < endDate);
    });
    
    return roomBookings;
  };
  
  // פונקציה לקבלת צבע התא לפי סטטוס ההזמנה
  const getCellBgColor = (isBooked, isPast, paymentStatus, bookingInfo, booking) => {
    // בדיקה אם יש סימן קריאה בהערות
    if (isBooked && booking && booking.notes && booking.notes.includes('!')) {
      // סימן קריאה בהערות - צבע אדום בולט
      return alpha(theme.palette.error.main, 0.25);
    }
    
    // בדיקת הזמנות מבוטלות
    if (isBooked && paymentStatus === 'canceled') {
      // הזמנה בוטלה - משתמשים בצבע אפור כהה
      return alpha(theme.palette.grey[700], 0.15);
    }
    
    // חדר לא מוזמן
    if (!isBooked) {
      // חדר פנוי - צבע לבן/בהיר מאוד
      return isPast 
        ? alpha(theme.palette.grey[100], 0.3) 
        : 'rgba(255, 255, 255, 0.5)';
    }
    
    // יום צ'ק-אין (היום הראשון בשהייה) או הזמנה של יום בודד
    if (bookingInfo.isStart || bookingInfo.isSingleDay) {
      // הדגשה משמעותית של יום הצ'ק-אין בכחול כהה
      return alpha('#1565c0', 0.25); // כחול כהה במקום ירוק
    }
    
    // יום אחרון בשהייה או אמצע השהייה - אותו צבע בהיר
    if (bookingInfo.isEnd || bookingInfo.isMiddle) {
      return alpha(theme.palette.info.light, 0.07);
    }
    
    // מבוטל
    if (paymentStatus === 'canceled') {
      return alpha(theme.palette.error.light, 0.07);
    }
    
    // ממתין לתשלום
    if (paymentStatus === 'pending') {
      return alpha(theme.palette.warning.light, 0.08);
    }
    
    // שולם - צבע כחול בהיר
    if (paymentStatus === 'paid') {
      return alpha(theme.palette.primary.light, 0.08);
    }
    
    // ברירת מחדל - הזמנה רגילה - כחול בהיר
    return alpha(theme.palette.primary.light, 0.06);
  };
  
  // פונקציה לבדיקה אם הזמנה היא חלק משהייה מרובת ימים
  const isPartOfMultiDayStay = (roomBooking, roomId, date) => {
    if (!roomBooking) return { isMultiDay: false, isStart: false, isMiddle: false, isEnd: false, isSingleDay: false };
    
    const checkIn = new Date(roomBooking.checkIn);
    const checkOut = new Date(roomBooking.checkOut);
    
    // וודא שהתאריכים הם חצות כדי להשוות נכון
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);
    
    // חישוב מספר הלילות
    const nights = differenceInDays(checkOut, checkIn);
    
    // הזמנה של יום אחד
    if (nights === 1) {
      return {
        isMultiDay: false,
        isStart: false, 
        isMiddle: false,
        isEnd: false,
        isSingleDay: isSameDay(currentDate, checkIn)
      };
    }
    
    // הזמנה של מספר ימים
    if (nights > 1 && 
        currentDate >= checkIn && 
        currentDate < checkOut) {
      
      return {
        isMultiDay: true,
        isStart: isSameDay(currentDate, checkIn),
        isMiddle: !isSameDay(currentDate, checkIn) && !isSameDay(currentDate, new Date(checkOut.getTime() - 86400000)),
        isEnd: isSameDay(currentDate, new Date(checkOut.getTime() - 86400000)),
        isSingleDay: false
      };
    }
    
    return { isMultiDay: false, isStart: false, isMiddle: false, isEnd: false, isSingleDay: false };
  };
  
  // פונקציה שבודקת אם תאריך הוא היום, אתמול או מחר
  const isRelevantDate = (date) => {
    if (!date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return (
      isSameDay(targetDate, today) || 
      isSameDay(targetDate, yesterday) || 
      isSameDay(targetDate, tomorrow)
    );
  };
  
  // פונקציה לקבלת תוכן התא
  const getCellContent = (room, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const bookingsForCell = getBookingsForRoomAndDate(room._id, date);
    const isBooked = bookingsForCell && bookingsForCell.length > 0;
    const isPast = date < new Date(new Date().setHours(0,0,0,0)); // תאריך בעבר
    
    // אם יש הזמנה, נציג את פרטי ההזמנה
    if (isBooked && bookingsForCell.length > 0) {
      const booking = bookingsForCell[0]; // אנחנו מתייחסים להזמנה הראשונה במקרה של חפיפה (נדיר)
      
      // בדיקה אם זו הזמנה מרובת חדרים
      const isMultiRoomBooking = booking.isMultiRoomBooking || false;
      
      // בדיקה אם זו הזמנה שנמשכת מכמה ימים
      const { isMultiDay, isStart, isMiddle, isEnd, isSingleDay } = isPartOfMultiDayStay(booking, room._id, date);
    
      return (
        <Box 
          sx={{ 
            height: '100%',
            p: 0.5,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            // מבטל לחלוטין את הרקע של הקונטיינר - התא עצמו כבר קיבל את הרקע
            bgcolor: 'transparent',
            transition: 'all 0.2s',
            border: 'none',
            boxShadow: 'none',
            '&:hover': {
              filter: 'brightness(0.95)',
              zIndex: 1
            },
            minHeight: '60px'
          }}
          onClick={() => handleViewBooking(booking._id)}
        >
          {/* סימון להזמנה מרובת חדרים */}
          {isMultiRoomBooking && (isStart || isSingleDay) && (
            <Box sx={{ 
              position: 'absolute', 
              top: '2px', 
              right: '2px', 
              zIndex: 2,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Tooltip title="הזמנה מרובת חדרים">
                <GroupsIcon
                  sx={{ 
                    fontSize: '15px', 
                    color: '#D32F2F', // צבע אדום להבלטה
                    opacity: 0.8
                  }} 
                />
              </Tooltip>
            </Box>
          )}
        
          <Box sx={{ position: 'relative', bgcolor: 'transparent' }}>
            {isStart || !isMultiDay ? (
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 0,
                  bgcolor: 'transparent',
                  width: '100%',
                  px: 0.5
                }}
              >
                <StatusChip 
                  label={
                    booking.paymentStatus === 'paid' ? 'שולם' : 
                    booking.paymentStatus === 'partial' ? 'חלקי' : 
                    booking.paymentStatus === 'pending' ? 'ממתין' : 
                    booking.paymentStatus === 'canceled' ? 'בוטל' : 'לא שולם'
                  }
                  size="small"
                  status={booking.paymentStatus}
                />
                
                {/* אייקון וואטסאפ שמוצג רק אם התאריך רלוונטי */}
                {booking.guest?.phone && isRelevantDate(date) && (
                  <Tooltip title="שלח הודעת וואטסאפ">
                    <IconButton
                      size="small"
                      sx={{ 
                        color: '#25D366',
                        p: 0.3,
                        opacity: 0.85,
                        '&:hover': { 
                          opacity: 1,
                          bgcolor: alpha('#25D366', 0.1)
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // מונע מהאירוע להתפשט לתא כולו
                        // מנקה את מספר הטלפון מתווים שאינם ספרות
                        const cleanPhone = booking.guest.phone.replace(/\D/g, '');
                        // מסיר את ה-0 מתחילת המספר אם יש ומוסיף קידומת ישראל
                        const formattedPhone = cleanPhone.startsWith('0') ? `972${cleanPhone.substring(1)}` : cleanPhone;
                        window.open(`https://wa.me/${formattedPhone}`, '_blank');
                      }}
                    >
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ) : null}
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              pt: 0.5,
              bgcolor: 'transparent'
            }}>
              <Tooltip 
                title={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {booking.guest?.firstName || booking.guest?.name || "אורח"}
                      {booking.guest?.lastName ? ` ${booking.guest?.lastName}` : ""}
                      {isMultiRoomBooking && " (הזמנה מרובת חדרים)"}
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(booking.checkIn), 'dd/MM')} - {format(new Date(booking.checkOut), 'dd/MM')}
                    </Typography>
                    <Typography variant="body2">
                      {booking.nights} לילות - ₪{booking.pricePerNight || (booking.totalPrice && booking.nights ? Math.round(booking.totalPrice / booking.nights) : booking.totalPrice)} ללילה
                    </Typography>
                    {booking.source && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        מקור: {booking.source}
                      </Typography>
                    )}
                    {isMultiRoomBooking && booking.rooms && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'error.main' }}>
                        הזמנה של {booking.rooms.length} חדרים
                      </Typography>
                    )}
                  </Box>
                } 
                arrow
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold', 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    fontSize: '0.8rem' // גופן קטן יותר
                  }}
                >
                  {booking.guest?.firstName || booking.guest?.name || "אורח"}
                  {booking.guest?.lastName ? ` ${booking.guest?.lastName}` : ""}
                  {isMultiRoomBooking && " (מ)"}
                </Typography>
              </Tooltip>
              
              {!isMultiDay && (
                <Typography 
                  variant="caption" 
                  sx={{
                    display: 'block',
                    color: alpha(theme.palette.text.primary, 0.8),
                    fontSize: '0.65rem'
                  }}
                >
                  ₪{booking.pricePerNight || (booking.totalPrice && booking.nights ? Math.round(booking.totalPrice / booking.nights) : booking.totalPrice)}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            mt: 0.5,
            opacity: 0.7,
            bgcolor: 'transparent'
          }}>
            {/* מסרנו את כל הסימונים של החיצים */}
            {isMultiRoomBooking && (
              <Tooltip title="הזמנה מרובת חדרים">
                <GroupsIcon fontSize="small" sx={{ opacity: 0.6, mr: 0.5, fontSize: '0.7rem' }} />
              </Tooltip>
            )}
          </Box>
        </Box>
      );
    }
    
    // אם אין הזמנה, נציג תא ריק עם אפשרות להוספת הזמנה
    if (!isBooked) {
      // מחיר לתצוגה
      const price = getPriceForRoomAndDate(room._id, date);
      
      return (
        <Fade in={true} timeout={800}>
        <Box 
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 1,
            minHeight: '60px', // צמצום גובה התא
            position: 'relative',
            borderRadius: 1,
            transition: 'all 0.2s',
            opacity: isPast ? 0.6 : 1
          }}
        >
            {isPast ? (
          <Box sx={{ 
                color: alpha(theme.palette.text.secondary, 0.7),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
          }}>
                {/* אייקון הוספת הזמנה גם בתאריכים שעברו */}
                <Box 
                  sx={{
                    position: 'absolute',
                    top: -18,
                    right: -24,
                    display: 'flex',
                    gap: 0.5,
                    zIndex: 2
                  }}
                >
                  <Tooltip title="הוספת הזמנה" arrow>
                    <IconButton
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddBooking(room._id, date);
                      }}
                      sx={{ 
                        color: alpha(theme.palette.primary.main, 0.6),
                        bgcolor: alpha(theme.palette.primary.light, 0.08),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.light, 0.15),
                          color: theme.palette.primary.main,
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s',
                        height: 20,
                        width: 20,
                        p: 0.3
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.6 }}></Typography>
          </Box>
            ) : (
              <>
                <Box 
                  sx={{
                    position: 'absolute',
                    top: 3,
                    left: 3,
                    display: 'flex',
                    gap: 0.5,
                    zIndex: 2
                  }}
                >
                  <Tooltip title={`מחיר ללילה: ₪${price}`} arrow>
                    <IconButton
              size="small" 
                      onClick={(e) => {
                        e.stopPropagation(); // מניעת בועות האירוע ל-parent
                        handleUpdatePrice(room._id, date);
                      }}
              sx={{ 
                fontSize: '0.65rem',
                        color: theme.palette.success.dark,
                        bgcolor: alpha(theme.palette.success.light, 0.1),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.success.light, 0.2),
                        },
                        height: 20,
                        width: 20,
                        p: 0.5
                      }}
                    >
                      ₪
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="הוספת הזמנה" arrow>
                    <IconButton
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation(); // מניעת בועות האירוע
                        handleAddBooking(room._id, date);
                      }}
          sx={{ 
                        color: alpha(theme.palette.primary.main, 0.7),
                        bgcolor: alpha(theme.palette.primary.light, 0.1),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.light, 0.2),
                          color: theme.palette.primary.main,
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s',
                        height: 20,
                        width: 20,
                        p: 0.3
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}>
                    
          </Typography>
        </Box>
              </>
          )}
        </Box>
        </Fade>
      );
    }
    
    // יש הזמנה - נציג פרטים עליה
    if (!bookingsForCell || !bookingsForCell.length || !bookingsForCell[0]) {
      // המקרה שבו היה אמור להיות לנו הזמנה אבל משום מה המערך ריק או האיבר הראשון חסר
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          bgcolor: alpha('#f5f5f5', 0.5)
        }}>
          <Typography variant="caption" color="text.secondary">אין נתונים</Typography>
        </Box>
      );
    }
    
    const booking = bookingsForCell[0]; // במקרה שלנו, יכולה להיות רק הזמנה אחת לחדר ליום
    
    // בדיקה אם זו הזמנה שנמשכת מכמה ימים
    const { isMultiDay, isStart, isMiddle, isEnd, isSingleDay } = isPartOfMultiDayStay(booking, room._id, date);
    
      return (
        <Box 
          sx={{ 
            height: '100%',
            p: 0.5,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            // מבטל לחלוטין את הרקע של הקונטיינר - התא עצמו כבר קיבל את הרקע
            bgcolor: 'transparent',
            transition: 'all 0.2s',
            border: 'none',
            boxShadow: 'none',
            '&:hover': {
              filter: 'brightness(0.95)',
              zIndex: 1
            },
            minHeight: '60px'
          }}
          onClick={() => handleViewBooking(booking._id)}
        >
          {/* הסרנו גם את אייקון המלון */}
          {false && (isStart || isSingleDay) && (
            <Box sx={{ 
              position: 'absolute', 
              top: '2px', 
              right: '2px', 
              zIndex: 2,
              display: 'flex',
              alignItems: 'center'
            }}>
              <HotelIcon 
                sx={{ 
                  fontSize: '15px', 
                  color: '#1565c0', // שינוי צבע מירוק לכחול כהה
                  opacity: 0.8
                }} 
              />
            </Box>
          )}
        
          <Box sx={{ position: 'relative', bgcolor: 'transparent' }}>
            {isStart || !isMultiDay ? (
              <Box 
                sx={{ 
            display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 0,
                  bgcolor: 'transparent',
                  width: '100%',
                  px: 0.5
                }}
              >
                <StatusChip 
                  label={
                    booking.paymentStatus === 'paid' ? 'שולם' : 
                    booking.paymentStatus === 'partial' ? 'חלקי' : 
                    booking.paymentStatus === 'pending' ? 'ממתין' : 
                    booking.paymentStatus === 'canceled' ? 'בוטל' : 'לא שולם'
                  }
                  size="small"
                  status={booking.paymentStatus}
                />
                
                {/* אייקון וואטסאפ שמוצג רק אם התאריך רלוונטי */}
                {booking.guest?.phone && isRelevantDate(date) && (
                  <Tooltip title="שלח הודעת וואטסאפ">
                    <IconButton
                      size="small"
                      sx={{ 
                        color: '#25D366',
                        p: 0.3,
                        opacity: 0.85,
                        '&:hover': { 
                          opacity: 1,
                          bgcolor: alpha('#25D366', 0.1)
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // מונע מהאירוע להתפשט לתא כולו
                        // מנקה את מספר הטלפון מתווים שאינם ספרות
                        const cleanPhone = booking.guest.phone.replace(/\D/g, '');
                        // מסיר את ה-0 מתחילת המספר אם יש ומוסיף קידומת ישראל
                        const formattedPhone = cleanPhone.startsWith('0') ? `972${cleanPhone.substring(1)}` : cleanPhone;
                        window.open(`https://wa.me/${formattedPhone}`, '_blank');
                      }}
                    >
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ) : null}
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              pt: 0.5,
              bgcolor: 'transparent'
            }}>
              <Tooltip 
                title={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {booking.guest?.firstName} {booking.guest?.lastName}
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(booking.checkIn), 'dd/MM')} - {format(new Date(booking.checkOut), 'dd/MM')}
                    </Typography>
                    <Typography variant="body2">
                      {booking.nights} לילות - ₪{booking.pricePerNight || (booking.totalPrice && booking.nights ? Math.round(booking.totalPrice / booking.nights) : booking.totalPrice)} ללילה
                    </Typography>
                    {booking.source && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        מקור: {booking.source}
                      </Typography>
                    )}
                  </Box>
                } 
                arrow
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
            fontWeight: 'bold', 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    fontSize: '0.8rem'
                  }}
                >
                  {booking.guest?.firstName} {booking.guest?.lastName}
                </Typography>
              </Tooltip>
              
              {!isMultiDay && (
                <Typography 
                  variant="caption" 
                  sx={{
                    display: 'block',
                    color: alpha(theme.palette.text.primary, 0.8),
                    fontSize: '0.65rem'
                  }}
                >
                  ₪{booking.pricePerNight || (booking.totalPrice && booking.nights ? Math.round(booking.totalPrice / booking.nights) : booking.totalPrice)}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            mt: 0.5,
            opacity: 0.7,
            bgcolor: 'transparent'
          }}>
            {/* מסרנו את כל הסימונים של החיצים */}
          </Box>
        </Box>
      );
  };
  
  // פונקציה לפתיחת דיאלוג עדכון מחיר חדש
  const handleUpdatePrice = (roomId, date) => {
    const price = getPriceForRoomAndDate(roomId, date);
    handlePriceDialogOpen(roomId, date, price);
  };
  
  // פונקציה לפתיחת דיאלוג עריכת מחיר
  const handlePriceDialogOpen = (roomId, date, price) => {
    setPriceDialog({
      open: true,
      roomId,
      date,
      price
    });
  };
  
  // פונקציה לסגירת דיאלוג עריכת מחיר
  const handlePriceDialogClose = () => {
    setPriceDialog({
      ...priceDialog,
      open: false
    });
  };
  
  // פונקציה לשמירת מחיר חדש
  const handleSavePrice = async () => {
    try {
      // הצג אינדיקציה של טעינה
      toast.info('מעדכן את המחיר...');
      
      // שליחת המחיר החדש לשרת
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/dynamic-prices`, {
        roomId: priceDialog.roomId,
        date: format(priceDialog.date, 'yyyy-MM-dd'),
        price: priceDialog.price
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.success) {
        toast.success('המחיר עודכן בהצלחה');
        
        // עדכון רשימת המחירים הדינמיים
        setDynamicPrices(prev => {
          const existingIndex = prev.findIndex(
            dp => dp.roomId === priceDialog.roomId && dp.date === format(priceDialog.date, 'yyyy-MM-dd')
          );
          
          if (existingIndex !== -1) {
            // עדכון מחיר קיים
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              price: priceDialog.price
            };
            return updated;
          } else {
            // הוספת מחיר חדש
            return [...prev, {
              roomId: priceDialog.roomId,
              date: format(priceDialog.date, 'yyyy-MM-dd'),
              price: priceDialog.price
            }];
          }
        });
        
        handlePriceDialogClose();
      } else {
        toast.error('אירעה שגיאה בעדכון המחיר');
        handlePriceDialogClose();
      }
    } catch (error) {
      console.error('שגיאה בעדכון המחיר:', error);
      
      // בדיקה אם השגיאה היא 404 (הנתיב לא קיים)
      if (error.response && error.response.status === 404) {
        toast.error('מערכת המחירים הדינמיים אינה זמינה. פנה למנהל המערכת.');
      } else {
        toast.error('אירעה שגיאה בעדכון המחיר');
      }
      
      handlePriceDialogClose();
    }
  };
  
  // פונקציה לצפייה בהזמנה
  const handleViewBooking = (bookingId) => {
    // בדיקה אם יש פרמטר ID
    if (!bookingId) {
      toast.error('לא נמצא מזהה הזמנה');
      return;
    }
    
    console.log(`צפייה בהזמנה: ${bookingId}`);

    // פתיחת דיאלוג במקום ניווט לדף
    setBookingDialog({
      open: true,
      bookingId,
      bookingData: null,
      loading: true
    });
    
    // טעינת פרטי ההזמנה מהשרת
    fetchBookingDetails(bookingId);
  };
  
  // פונקציה לטעינת פרטי הזמנה
  const fetchBookingDetails = async (bookingId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        let bookingData = response.data.data;
        console.log('נטענו פרטי הזמנה:', bookingData);
        console.log('פרטי כרטיס אשראי:', bookingData.creditCard);
        
        // חישוב שדות מחיר חסרים
        const nights = bookingData.nights || 1;
        
        // אם חסר מחיר ללילה, נחשב אותו מהמחיר הכולל
        if (!bookingData.pricePerNight && bookingData.totalPrice) {
          bookingData.pricePerNight = Math.round((bookingData.totalPrice / nights) * 100) / 100;
        }
        
        // אם חסר מחיר ללילה ללא מע"מ, נחשב אותו
        if (!bookingData.pricePerNightNoVat && bookingData.pricePerNight) {
          bookingData.pricePerNightNoVat = Math.round((bookingData.pricePerNight / (1 + vatRate / 100)) * 100) / 100;
        }
        // אם חסר מחיר ללילה, אבל יש basePrice, נשתמש בו
        else if (!bookingData.pricePerNightNoVat && bookingData.basePrice) {
          bookingData.pricePerNightNoVat = bookingData.basePrice;
          
          // וגם נחשב את המחיר ללילה אם חסר
          if (!bookingData.pricePerNight) {
            bookingData.pricePerNight = Math.round((bookingData.pricePerNightNoVat * (1 + vatRate / 100)) * 100) / 100;
          }
        }
        
        // אם חסר מחיר כולל, נחשב אותו
        if (!bookingData.totalPrice && bookingData.pricePerNight) {
          bookingData.totalPrice = Math.round((bookingData.pricePerNight * nights) * 100) / 100;
        }
        
        setBookingDialog(prev => ({
          ...prev,
          bookingData,
          loading: false
        }));
      } else {
        toast.error('אירעה שגיאה בטעינת פרטי ההזמנה');
        closeBookingDialog();
      }
    } catch (error) {
      console.error('שגיאה בטעינת פרטי ההזמנה:', error);
      toast.error('אירעה שגיאה בטעינת פרטי ההזמנה');
      closeBookingDialog();
    }
  };
  
  // סגירת דיאלוג עריכת הזמנה
  const closeBookingDialog = () => {
    setBookingDialog({
      ...bookingDialog,
      open: false
    });
  };

  // עדכון שדה בטופס ההזמנה
  const handleBookingFormChange = (field, value) => {
    setBookingDialog(prev => {
      // יצירת עותק עמוק של נתוני ההזמנה
      const updatedBookingData = { ...prev.bookingData };
      
      // עדכון הערך המתאים
      updatedBookingData[field] = value;
      
      // חישובים מיוחדים בהתאם לסוג השדה
      if (field === 'checkIn' || field === 'checkOut') {
        // חישוב מספר לילות אם שונה אחד מתאריכי השהייה
        if (updatedBookingData.checkIn && updatedBookingData.checkOut) {
          const checkInDate = new Date(updatedBookingData.checkIn);
          const checkOutDate = new Date(updatedBookingData.checkOut);
          
          const diffTime = Math.abs(checkOutDate - checkInDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // אם יש שינוי במספר הלילות, מעדכנים מחירים
          if (diffDays !== updatedBookingData.nights) {
            updatedBookingData.nights = diffDays;
            
            // מעדכנים מחיר סופי אם יש מחיר ללילה
            if (updatedBookingData.pricePerNight) {
              updatedBookingData.totalPrice = diffDays * updatedBookingData.pricePerNight;
            }
          }
        }
      } else if (field === 'nights') {
        // אם שונה מספר הלילות, מעדכנים את תאריך היציאה
        const nights = parseInt(value) || 1;
        const checkInDate = new Date(updatedBookingData.checkIn);
        
        if (!isNaN(checkInDate)) {
          const checkOutDate = new Date(checkInDate);
          checkOutDate.setDate(checkInDate.getDate() + nights);
          updatedBookingData.checkOut = format(checkOutDate, 'yyyy-MM-dd');
        }
        
        // מעדכנים מחיר סופי אם יש מחיר ללילה
        if (updatedBookingData.pricePerNight) {
          updatedBookingData.totalPrice = nights * updatedBookingData.pricePerNight;
        }
      } else if (field === 'pricePerNight') {
        // אם שונה המחיר ליחידה, מעדכנים את המחיר ליחידה ללא מע"מ ואת המחיר הסופי
        const priceWithVat = parseFloat(value) || 0;
        updatedBookingData.pricePerNight = priceWithVat;
        
        // חישוב מחיר ללילה ללא מע"מ
        const priceNoVat = Math.round((priceWithVat / 1.18) * 100) / 100;
        updatedBookingData.pricePerNightNoVat = priceNoVat;
        updatedBookingData.basePrice = priceNoVat; // שמירת basePrice לתאימות
        
        // חישוב מחיר סופי
        const nights = updatedBookingData.nights || 1;
        updatedBookingData.totalPrice = priceWithVat * nights;
      } else if (field === 'pricePerNightNoVat') {
        // אם שונה המחיר ליחידה ללא מע"מ, מעדכנים את המחיר ליחידה ואת המחיר הסופי
        const basePrice = parseFloat(value) || 0;
        updatedBookingData.pricePerNightNoVat = basePrice;
        updatedBookingData.basePrice = basePrice; // שמירת basePrice לתאימות
        
        // חישוב מחיר ליחידה כולל מע"מ
        const priceWithVat = Math.round((basePrice * 1.18) * 100) / 100;
        updatedBookingData.pricePerNight = priceWithVat;
        
        // חישוב מחיר סופי
        const nights = updatedBookingData.nights || 1;
        updatedBookingData.totalPrice = priceWithVat * nights;
      } else if (field === 'totalPrice') {
        // אם משנים ישירות את סה"כ המחיר, מחשבים את המחיר ליחידה
        const totalPrice = parseFloat(value) || 0;
        
        // שמירת הערך המדויק כפי שהוזן על ידי המשתמש
        updatedBookingData.totalPrice = totalPrice;
        
        // שמירת המחיר המקורי כמחרוזת כדי למנוע שינויים בעת רענון
        updatedBookingData.originalTotalPrice = value.toString();
        
        const nights = updatedBookingData.nights || 1;
        
        if (!isNaN(totalPrice) && nights > 0) {
          // חישוב מחיר לילה כולל מע"מ רק לצורך תצוגה
          const priceWithVat = totalPrice / nights;
          updatedBookingData.pricePerNight = Math.round(priceWithVat * 100) / 100;
          
          // חישוב מחיר לילה ללא מע"מ לפי סטטוס תייר רק לצורך תצוגה
          const priceNoVat = updatedBookingData.isTourist ? 
            priceWithVat : // תייר - אין מע"מ
            priceWithVat / 1.18; // אזרח ישראלי - יש מע"מ
          
          updatedBookingData.pricePerNightNoVat = Math.round(priceNoVat * 100) / 100;
          updatedBookingData.basePrice = Math.round(priceNoVat * 100) / 100; // שמירת basePrice לתאימות
          
          console.log('עדכון מחירים לפי סה"כ שהוזן בדיוק:', {
            totalPriceInput: value,
            savedTotalPrice: totalPrice,
            originalSaved: updatedBookingData.originalTotalPrice,
            nights, 
            priceWithVat: updatedBookingData.pricePerNight,
            priceNoVat: updatedBookingData.pricePerNightNoVat,
            isTourist: updatedBookingData.isTourist
          });
        }
      } else if (field === 'isTourist') {
        // עדכון מחירים אם השתנה סטטוס תייר
        const isTourist = value === true || value === 'true';
        
        // מעדכנים את השדה
        updatedBookingData.isTourist = isTourist;
        
        if (isTourist) {
          // תייר - אין מע"מ
          // המחיר ללא מע"מ שווה למחיר כולל מע"מ
          if (updatedBookingData.pricePerNight) {
            updatedBookingData.pricePerNightNoVat = updatedBookingData.pricePerNight;
            updatedBookingData.basePrice = updatedBookingData.pricePerNight;
          }
        } else {
          // אזרח ישראלי - יש מע"מ
          // מחשבים מחדש את המחיר ללא מע"מ
          if (updatedBookingData.pricePerNight) {
            const priceNoVat = Math.round((updatedBookingData.pricePerNight / 1.18) * 100) / 100;
            updatedBookingData.pricePerNightNoVat = priceNoVat;
            updatedBookingData.basePrice = priceNoVat;
          }
        }
        
        // לא משנים את המחיר הכולל, רק את החלוקה בין המע"מ והבסיס
        
        console.log('עדכון מחירים בעקבות שינוי סטטוס תייר:', {
          isTourist,
          pricePerNight: updatedBookingData.pricePerNight,
          pricePerNightNoVat: updatedBookingData.pricePerNightNoVat,
          totalPrice: updatedBookingData.totalPrice
        });
      }
      
      return {
        ...prev,
        bookingData: updatedBookingData
      };
    });
  };
  
  // עדכון סטטוס תשלום מתוך דיאלוג ההזמנה
  const handleUpdatePaymentStatus = async () => {
    console.log('===== תחילת עדכון סטטוס תשלום מדיאלוג ההזמנה =====');
    
    if (!bookingDialog.bookingData?._id) {
      console.error('אין מזהה הזמנה בעת ניסיון לעדכן סטטוס תשלום');
      toast.error('שגיאה: חסר מזהה הזמנה');
      return;
    }
    
    const bookingId = bookingDialog.bookingData._id;
    let status = bookingDialog.bookingData.paymentStatus;
    const method = bookingDialog.bookingData.paymentMethod;
    
    // המרה מערכי עברית לאנגלית לפי הצורך
    if (typeof status === 'string') {
      switch(status) {
        case 'שולם':
          status = 'paid';
          break;
        case 'לא שולם':
        case 'ממתין לתשלום':
        case 'ממתין':
          status = 'pending';
          break;
        case 'שולם חלקית':
        case 'חלקי':
          status = 'partial';
          break;
        case 'מבוטל':
        case 'בוטל':
          status = 'canceled';
          break;
        // אם כבר באנגלית, להשאיר כפי שהוא
      }
    }
    
    console.log('מנסה לעדכן סטטוס תשלום להזמנה:', {
      bookingId,
      status,
      method,
      bookingData: {
        bookingNumber: bookingDialog.bookingData.bookingNumber,
        guest: bookingDialog.bookingData.guest?.firstName + ' ' + bookingDialog.bookingData.guest?.lastName,
        room: bookingDialog.bookingData.room?.roomNumber
      }
    });
    
    try {
      setLoading(true);
      
      // ודא שיש לנו ערכים תקינים
      if (!status) {
        console.error('חסר סטטוס תשלום');
        toast.error('לא ניתן לעדכן - חסר סטטוס תשלום');
        return;
      }
      
      // וידוא שיש גם אמצעי תשלום אם הסטטוס הוא 'paid'
      if (status === 'paid' && !method) {
        console.warn('מוגדר סטטוס שולם, אבל חסר אמצעי תשלום');
        toast.warning('אנא בחר אמצעי תשלום כשאתה מסמן שהתשלום הושלם');
        // עדיין ממשיך לבצע את העדכון
      }
      
      // שמירת ערך מזומן אם המשתמש עדכן לאמצעי תשלום מזומן
      const finalMethod = method || '';
      
      console.log(`שולח עדכון סטטוס תשלום לשרת: updatePaymentStatus(${bookingId}, ${status}, ${finalMethod})`);
      
      const result = await updatePaymentStatus(bookingId, status, finalMethod);
      
      console.log('תוצאת עדכון סטטוס תשלום:', result);
      
      if (result.success) {
        console.log('עדכון סטטוס תשלום הצליח');
        
        setSnackbarState({
          open: true,
          message: 'סטטוס תשלום עודכן בהצלחה',
          severity: 'success'
        });
        
        // איפוס משתני הביניים אם יש צורך
        setTempPaymentStatus(null);
        setTempPaymentMethod(null);
        
        // רענון הנתונים בדף
        console.log('מרענן נתוני הזמנות לאחר עדכון סטטוס תשלום מוצלח');
        fetchBookingsData();
      } else {
        console.error('כישלון בעדכון סטטוס תשלום:', result.error);
        
        setSnackbarState({
          open: true,
          message: `שגיאה בעדכון סטטוס תשלום: ${result.error || 'שגיאה לא ידועה'}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס תשלום:', error);
      
      setSnackbarState({
        open: true,
        message: `שגיאה בעדכון סטטוס תשלום: ${error.message || 'שגיאה לא ידועה'}`,
        severity: 'error'
      });
    } finally {
      console.log('===== סיום עדכון סטטוס תשלום מדיאלוג ההזמנה =====');
      setLoading(false);
    }
  };
  
  // מטפל בשינוי סטטוס תשלום ואמצעי תשלום בדיאלוג
  const handlePaymentChange = (field, value) => {
    // עדכון הערך במצב המקומי באופן מיידי
    handleBookingFormChange(field, value);
    
    // יצירת עותק מקומי של הנתונים המעודכנים
    let updatedData = { ...bookingDialog.bookingData };
    if (field === 'paymentMethod') {
      updatedData.paymentMethod = value;
    } else if (field === 'paymentStatus') {
      updatedData.paymentStatus = value;
    }
    
    // אם סטטוס התשלום או אמצעי התשלום השתנה, יש לעדכן גם בשרת
    if (field === 'paymentStatus' || field === 'paymentMethod') {
      setTimeout(() => {
        // קוראים לפונקציה עם פרמטרים ישירים במקום להסתמך על מצב
        handleDirectUpdatePaymentStatus(
          bookingDialog.bookingData._id,
          updatedData.paymentStatus,
          updatedData.paymentMethod
        );
      }, 300); // מתן זמן מספיק לעדכון ה-state
    }
  };
  
  // פונקציה לעדכון ישיר של סטטוס תשלום עם פרמטרים מפורשים
  const handleDirectUpdatePaymentStatus = async (bookingId, status, method) => {
    if (!bookingId) {
      toast.error('שגיאה: חסר מזהה הזמנה');
      return;
    }
    
    // המרה מערכי עברית לאנגלית לפי הצורך
    let englishStatus = status;
    if (typeof status === 'string') {
      switch(status) {
        case 'שולם':
          englishStatus = 'paid';
          break;
        case 'לא שולם':
        case 'ממתין לתשלום':
        case 'ממתין':
          englishStatus = 'pending';
          break;
        case 'שולם חלקית':
        case 'חלקי':
          englishStatus = 'partial';
          break;
        case 'מבוטל':
        case 'בוטל':
          englishStatus = 'canceled';
          break;
        // אם כבר באנגלית, להשאיר כפי שהוא
      }
    }
    
    try {
      setLoading(true);
      
      // ודא שיש לנו ערכים תקינים
      if (!englishStatus) {
        toast.error('לא ניתן לעדכן - חסר סטטוס תשלום');
        return;
      }
      
      // וידוא שיש גם אמצעי תשלום אם הסטטוס הוא 'paid'
      if (englishStatus === 'paid' && !method) {
        toast.warning('אנא בחר אמצעי תשלום כשאתה מסמן שהתשלום הושלם');
        // עדיין ממשיך לבצע את העדכון
      }
      
      const result = await updatePaymentStatus(bookingId, englishStatus, method);
      
      if (result.success) {
        setSnackbarState({
          open: true,
          message: 'סטטוס תשלום עודכן בהצלחה',
          severity: 'success'
        });
        
        // איפוס משתני הביניים אם יש צורך
        setTempPaymentStatus(null);
        setTempPaymentMethod(null);
        
        // רענון הנתונים בדף
        fetchBookingsData();
      } else {
        setSnackbarState({
          open: true,
          message: `שגיאה בעדכון סטטוס תשלום: ${result.error || 'שגיאה לא ידועה'}`,
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbarState({
        open: true,
        message: `שגיאה בעדכון סטטוס תשלום: ${error.message || 'שגיאה לא ידועה'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // עדכון פרטי הזמנה
  const handleUpdateBooking = async (updatedData) => {
    try {
      const { bookingId } = bookingDialog;
      
      // בדיקה שיש לנו bookingId תקין
      if (!bookingId) {
        console.error('bookingId חסר בעת ניסיון לעדכן הזמנה');
        toast.error('זיהוי הזמנה חסר - לא ניתן לעדכן');
        return;
      }
      
      // הכנת נתוני העדכון
      const updatedData = { ...bookingDialog.bookingData };
      
      // בדיקה אם יש מחיר מקורי שנשמר כמחרוזת
      if (updatedData.originalTotalPrice) {
        console.log('משתמש במחיר המקורי המדויק:', updatedData.originalTotalPrice);
        updatedData.totalPrice = parseFloat(updatedData.originalTotalPrice);
      }
      
      // המרת תאריכים לפורמט שהשרת מצפה לו
      if (updatedData.checkIn && !(updatedData.checkIn instanceof Date)) {
        updatedData.checkIn = new Date(updatedData.checkIn);
      }
      if (updatedData.checkOut && !(updatedData.checkOut instanceof Date)) {
        updatedData.checkOut = new Date(updatedData.checkOut);
      }
      
      // לוודא שיש לנו את כל שדות המחיר שצריך
      const bookingToUpdate = {
        ...updatedData,
        // הוספת roomId במפורש כפי שהשרת מצפה
        roomId: updatedData.room?._id || updatedData.roomId || updatedData.room,
        // שימוש במחיר המקורי אם קיים
        originalTotalPrice: updatedData.originalTotalPrice || String(updatedData.totalPrice),
        // עדכון שדות מחיר חיוניים
        totalPrice: parseFloat(updatedData.totalPrice) || 0,
        pricePerNight: parseFloat(updatedData.pricePerNight) || parseFloat(updatedData.totalPrice) / (updatedData.nights || 1),
        pricePerNightNoVat: parseFloat(updatedData.pricePerNightNoVat) || Math.round((parseFloat(updatedData.pricePerNight) / 1.18) * 100) / 100,
        // וידוא שיש basePrice לתאימות עם המודל בשרת
        basePrice: parseFloat(updatedData.pricePerNightNoVat) || Math.round((parseFloat(updatedData.pricePerNight) / 1.18) * 100) / 100
      };
      
      console.log('שולח עדכון הזמנה עם נתוני מחיר:', {
        totalPrice: bookingToUpdate.totalPrice,
        originalTotalPrice: bookingToUpdate.originalTotalPrice,
        pricePerNight: bookingToUpdate.pricePerNight,
        pricePerNightNoVat: bookingToUpdate.pricePerNightNoVat,
        basePrice: bookingToUpdate.basePrice,
        nights: bookingToUpdate.nights
      });
      
      // בדיקות תקינות נוספות
      if (!bookingToUpdate.checkIn || !bookingToUpdate.checkOut) {
        console.error('שדות תאריכים חסרים בעת ניסיון לעדכן הזמנה', {
          checkIn: bookingToUpdate.checkIn,
          checkOut: bookingToUpdate.checkOut
        });
        toast.error('שדות תאריכים חסרים - לא ניתן לעדכן');
        return;
      }
      
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`, bookingToUpdate, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        toast.success('ההזמנה עודכנה בהצלחה');
        console.log('עדכון הזמנה הושלם בהצלחה. נתונים שהתקבלו מהשרת:', response.data.data);
        
        closeBookingDialog();
        // רענון כל הנתונים מהשרת
        fetchBookingsData();
      } else {
        console.error('תשובת שרת לא תקינה:', response.data);
        toast.error(response.data.message || 'אירעה שגיאה בעדכון ההזמנה');
      }
    } catch (error) {
      console.error('שגיאה בעדכון ההזמנה:', error);
      console.error('פרטי השגיאה:', error.response?.data || error.message);
      
      // הודעת שגיאה ממוקדת יותר
      let errorMessage = 'אירעה שגיאה בעדכון ההזמנה';
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
    }
  };
  
  // פונקציה להוספת הזמנה חדשה
  const handleAddBooking = (roomId, date) => {
    // במקום ניווט, נפתח דיאלוג ליצירת הזמנה חדשה
    const todayDate = new Date();
    const isPast = date < new Date(new Date().setHours(0,0,0,0)); // בדיקה אם התאריך עבר
    
    // אם מדובר בתאריך שעבר, נציג הודעת אזהרה אבל נמשיך בתהליך
    if (isPast) {
      toast.warning('יצירת הזמנה לתאריך שעבר - שים לב למצב מיוחד זה', {
        position: "top-center",
        autoClose: 3000
      });
    }
    
    // תאריכים ברירת מחדל - אם לא סופקו
    const checkInDate = date ? format(date, 'yyyy-MM-dd') : format(todayDate, 'yyyy-MM-dd');
    const checkOutDate = date ? format(addDays(date, 1), 'yyyy-MM-dd') : format(addDays(todayDate, 1), 'yyyy-MM-dd');
    
    // אם לא סופק חדר, ננסה לקחת את החדר הראשון מהרשימה
    const defaultRoomId = roomId || (rooms.length > 0 ? rooms[0]._id : '');
    
    // מחיר ברירת מחדל - לפי החדר והתאריך
    let defaultPrice = 0;
    try {
      defaultPrice = getPriceForRoomAndDate(defaultRoomId, date || todayDate);
    } catch (error) {
      console.error('שגיאה בהשגת מחיר ברירת מחדל:', error);
      // אם נכשל, ננסה להשתמש במחיר הבסיסי של החדר
      const selectedRoom = rooms.find(r => r._id === defaultRoomId);
      defaultPrice = selectedRoom?.basePrice || 0;
    }
    
    setNewBookingDialog({
      open: true,
      roomId: defaultRoomId,
      date: date || todayDate,
      loading: false,
      formData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        checkIn: checkInDate, 
        checkOut: checkOutDate,
        roomId: defaultRoomId,
        totalPrice: defaultPrice,
        pricePerNight: defaultPrice,
        pricePerNightNoVat: Math.round((defaultPrice / (1 + vatRate / 100)) * 100) / 100,
        nights: 1,   // מספר לילות ברירת מחדל
        notes: '',
        paymentMethod: 'creditRothschild',
        paymentStatus: 'pending',
        // הוספת שדות כרטיס אשראי
        creditCard: {
          cardNumber: '',
          cardExpiry: '',
          cardCvc: '',
          cardHolder: ''
        }
      }
    });
    
    // לוג לדיבאג
    console.log(`פתיחת דיאלוג ליצירת הזמנה חדשה לחדר ${defaultRoomId} בתאריך ${checkInDate}`);
  };
  
  // פונקציה לסגירת חלון הזמנה חדשה
  const closeNewBookingDialog = () => {
    setNewBookingDialog(prev => ({ 
      ...prev, 
      open: false, 
      loading: false,
      formData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        roomId: rooms.length > 0 ? rooms[0]._id : '',
        checkIn: format(new Date(), 'yyyy-MM-dd'),
        checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        totalPrice: 0,
        priceWithoutVat: 0,
        pricePerNight: 0,
        creditCard: {
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        },
        notes: ''
      }
    }));
  };
  
  // הוספת הזמנה חדשה
  const handleOpenNewBookingDialog = () => {
    // מחשבים תאריך כניסה (היום) ותאריך יציאה (מחר)
    const checkInDate = new Date();
    const checkOutDate = addDays(checkInDate, 1);
    
    // בחירת חדר ברירת מחדל (הראשון ברשימה)
    const defaultRoomId = rooms.length > 0 ? rooms[0]._id : '';
    
    // חישוב מחיר ברירת מחדל אם נבחר חדר
    let defaultPrice = 0;
    let pricePerNight = 0;
    
    if (defaultRoomId) {
      const selectedRoom = rooms.find(r => r._id === defaultRoomId);
      defaultPrice = selectedRoom?.basePrice || 0;
      pricePerNight = defaultPrice;
    }
    
    // חישוב מחיר ללא מע"מ
    const priceWithoutVat = Math.round((defaultPrice / (1 + vatRate / 100)) * 100) / 100;
    
    setNewBookingDialog({
      open: true,
      loading: false,
      formData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        roomId: defaultRoomId,
        checkIn: format(checkInDate, 'yyyy-MM-dd'),
        checkOut: format(checkOutDate, 'yyyy-MM-dd'),
        totalPrice: defaultPrice,
        pricePerNight: pricePerNight,
        pricePerNightNoVat: Math.round((pricePerNight / (1 + vatRate / 100)) * 100) / 100,
        nights: 1,   // מספר לילות ברירת מחדל
        paymentMethod: 'creditRothschild',
        paymentStatus: 'pending',
        creditCard: {
          cardNumber: '',
          expiry: '',
          cvv: ''
        },
        notes: ''
      }
    });
  };
  
  // עדכון שדה בטופס הזמנה חדשה
  const handleNewBookingFormChange = (field, value) => {
    setNewBookingDialog(prev => {
      const updatedFormData = {
        ...prev.formData,
        [field]: value
      };
      
      // אם מדובר בשינוי בשדה תאריך או חדר, נעדכן מחיר אוטומטית
      if (['roomId', 'checkIn', 'checkOut'].includes(field)) {
        if (updatedFormData.checkIn && updatedFormData.checkOut && updatedFormData.roomId) {
          // חישוב לילות
          const checkIn = new Date(updatedFormData.checkIn);
          const checkOut = new Date(updatedFormData.checkOut);
          const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
          
          updatedFormData.nights = nights;
          
          if (nights > 0) {
            // חישוב מחיר
            const baseNightPrice = getPriceForRoomAndDate(updatedFormData.roomId, checkIn);
            
            // בדיקה אם מדובר בתייר
            const isTourist = updatedFormData.isTourist;
            
            // מחיר ללילה ללא מע"מ
            updatedFormData.pricePerNightNoVat = Math.round((baseNightPrice / (1 + vatRate / 100)) * 100) / 100;
            
            // מחיר ללילה כולל מע"מ - תלוי אם תייר
            if (isTourist) {
              updatedFormData.pricePerNight = updatedFormData.pricePerNightNoVat; // תייר - ללא מע"מ
            } else {
              updatedFormData.pricePerNight = parseFloat(baseNightPrice);
            }
            
            // סה"כ מחיר להזמנה
            updatedFormData.totalPrice = Math.round(updatedFormData.pricePerNight * nights * 100) / 100;
            
            console.log(`מחיר מעודכן: ${baseNightPrice} (${updatedFormData.pricePerNightNoVat} + ${isTourist ? 'ללא מע"מ (תייר)' : 'מע"מ'}) x ${nights} לילות = ${updatedFormData.totalPrice}`);
          }
        }
      }
      
      // אם שינו מחיר ללילה ללא מע"מ
      if (field === 'pricePerNightNoVat' && value) {
        const priceNoVat = parseFloat(value);
        const nights = updatedFormData.nights || 1;
        const isTourist = updatedFormData.isTourist;
        
        // עדכון מחיר ללילה כולל מע"מ - תלוי אם תייר
        if (isTourist) {
          updatedFormData.pricePerNight = priceNoVat; // תייר - ללא מע"מ
        } else {
          updatedFormData.pricePerNight = Math.round((priceNoVat * (1 + vatRate / 100)) * 100) / 100;
        }
        
        // עדכון סה"כ להזמנה
        updatedFormData.totalPrice = Math.round(updatedFormData.pricePerNight * nights * 100) / 100;
      }
      
      // אם שינו מחיר ללילה כולל מע"מ
      if (field === 'pricePerNight' && value) {
        const priceWithVat = parseFloat(value);
        const nights = updatedFormData.nights || 1;
        const isTourist = updatedFormData.isTourist;
        
        // עדכון מחיר ללילה ללא מע"מ - תלוי אם תייר
        if (isTourist) {
          updatedFormData.pricePerNightNoVat = priceWithVat; // תייר - זהה למחיר עם מע"מ
        } else {
          updatedFormData.pricePerNightNoVat = Math.round((priceWithVat / (1 + vatRate / 100)) * 100) / 100;
        }
        
        // עדכון סה"כ להזמנה
        updatedFormData.totalPrice = Math.round(priceWithVat * nights * 100) / 100;
      }
      
      // אם שינו את השדה isTourist
      if (field === 'isTourist') {
        const isTourist = value === true || value === 'true';
        
        const nights = updatedFormData.nights || 1;
        
        if (isTourist) {
          // תייר: מחיר ללילה כולל מע"מ = מחיר לא מע"מ (אין מע"מ)
          updatedFormData.pricePerNight = updatedFormData.pricePerNightNoVat;
        } else {
          // לא תייר: עדכון מחיר כולל מע"מ
          updatedFormData.pricePerNight = Math.round((updatedFormData.pricePerNightNoVat * (1 + vatRate / 100)) * 100) / 100;
        }
        
        // עדכון סה"כ מחיר להזמנה
        updatedFormData.totalPrice = Math.round(updatedFormData.pricePerNight * nights * 100) / 100;
        
        console.log(`סטטוס תייר עודכן ל-${isTourist ? 'כן' : 'לא'}, מחיר עודכן: ${updatedFormData.pricePerNight} x ${nights} לילות = ${updatedFormData.totalPrice}`);
      }
      
      // אם שינו סה"כ מחיר להזמנה
      if (field === 'totalPrice' && value) {
        // שמירת הערך המדויק שהמשתמש הזין
        const totalPrice = parseFloat(value) || 0;
        updatedFormData.totalPrice = totalPrice;
        
        const nights = updatedFormData.nights || 1;
        const isTourist = updatedFormData.isTourist;
        
        // חישוב מחיר ללילה רק לצורכי תצוגה, בלי לשנות את הסכום הסופי
        const pricePerNightWithVat = totalPrice / nights;
        updatedFormData.pricePerNight = Math.round(pricePerNightWithVat * 100) / 100;
        
        // חישוב מחיר ללילה ללא מע"מ - תלוי אם תייר
        const pricePerNightNoVat = isTourist ? 
          pricePerNightWithVat : 
          pricePerNightWithVat / (1 + vatRate / 100);
        
        updatedFormData.pricePerNightNoVat = Math.round(pricePerNightNoVat * 100) / 100;
        
        console.log('עדכון מחירים לפי סה"כ בהזמנה חדשה (שמירת ערך מדויק):', {
          totalPriceInput: value,
          savedTotalPrice: totalPrice,
          nights, 
          pricePerNight: updatedFormData.pricePerNight,
          pricePerNightNoVat: updatedFormData.pricePerNightNoVat,
          isTourist
        });
      }
      
      return {
        ...prev,
        formData: updatedFormData
      };
    });
  };
  
  // פונקציה לשמירת הזמנה חדשה
  const handleSaveNewBooking = async (bookingData) => {
    try {
      await contextCreateBooking(bookingData);
      setNewBookingDialog({ open: false, roomId: null, date: null });
      fetchBookingsData(); // מתקן את שם הפונקציה
    } catch (error) {
      console.error('שגיאה ביצירת הזמנה:', error);
      setError(error.response?.data?.message || 'שגיאה ביצירת ההזמנה');
    }
  };
  
  // החלפת טווח ימים הבא
  const showNextDays = () => {
    if (daysInView.length === 0) return;
    
    const newDays = daysInView.map(day => addDays(day, daysToShow));
    setDaysInView(newDays);
  };
  
  // החלפת טווח ימים הקודם
  const showPrevDays = () => {
    if (daysInView.length === 0) return;
    
    const newDays = daysInView.map(day => addDays(day, -daysToShow));
    setDaysInView(newDays);
  };
  
  // החלפה לחודש הבא
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // החלפה לחודש הקודם
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // החלפה ליום הנוכחי
  const handleToday = () => {
    const today = new Date();
    const newDays = [];
    
    // מוסיף 3 ימים לפני היום הנוכחי ואת הימים שאחרי עד להשלמת דרישת התצוגה
    for (let i = -3; i < daysToShow - 3; i++) {
      newDays.push(addDays(today, i));
    }
    
    setDaysInView(newDays);
  };
  
  // החלפת לשונית פעילה
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // פונקציית עזר לפורמט תאריך תוקף כרטיס אשראי
  const formatCreditCardExpiry = (creditCard) => {
    // בדיקה מוקדמת שהאובייקט קיים ואינו ריק לחלוטין
    if (!creditCard) return '';
    
    // בדיקה שהאובייקט אינו ריק (בעל ערכים ממשיים)
    const hasActualValues = Object.values(creditCard).some(val => val && val.toString().trim() !== '');
    if (!hasActualValues) {
      return '';  // אם כל הערכים ריקים, החזר מחרוזת ריקה ללא לוגים מיותרים
    }
    
    // לוג מפורט של נתוני כרטיס האשראי לצורך ניפוי שגיאות - רק אם יש תוכן ממשי
    console.log('מנסה לפרמט תוקף כרטיס אשראי:', creditCard);
    
    // בדיקה אם יש שדה expiry מוכן
    if (creditCard.expiry) {
      console.log('נמצא שדה expiry:', creditCard.expiry);
      return creditCard.expiry;
    }
    
    // בדיקה אם יש שדות expiryMonth ו-expiryYear
    if (creditCard.expiryMonth && creditCard.expiryYear) {
      // פורמט החודש ל-2 ספרות
      const month = String(creditCard.expiryMonth).padStart(2, '0');
      // לקיחת 2 הספרות האחרונות של השנה
      const year = String(creditCard.expiryYear).slice(-2);
      console.log(`בניית תוקף מחודש ושנה: ${month}/${year}`);
      return `${month}/${year}`;
    }
    
    // בדיקה אם יש שדה expiryDate (השדה שהופיע בלוג)
    if (creditCard.expiryDate && creditCard.expiryDate.trim() !== '') {
      console.log('נמצא שדה expiryDate:', creditCard.expiryDate);
      return creditCard.expiryDate;
    }
    
    // בדיקה אם יש שדה expirationDate
    if (creditCard.expirationDate && creditCard.expirationDate.trim() !== '') {
      console.log('נמצא שדה expirationDate:', creditCard.expirationDate);
      return creditCard.expirationDate;
    }
    
    // בדיקה אם יש שדה expiration
    if (creditCard.expiration) {
      console.log('נמצא שדה expiration:', creditCard.expiration);
      return creditCard.expiration;
    }
    
    // בדיקה אם יש שדה validUntil
    if (creditCard.validUntil) {
      console.log('נמצא שדה validUntil:', creditCard.validUntil);
      // ניסיון לפרמט את התאריך אם הוא בפורמט של תאריך ISO
      try {
        const date = new Date(creditCard.validUntil);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${month}/${year}`;
      } catch (e) {
        return creditCard.validUntil;
      }
    }
    
    // ניסיון לחפש שדות אחרים עם שמות דומים
    const possibleFields = ['exp', 'validityDate', 'expire', 'validity'];
    for (const field of possibleFields) {
      if (creditCard[field]) {
        console.log(`נמצא שדה ${field}:`, creditCard[field]);
        return creditCard[field];
      }
    }
    
    console.log('לא נמצא שדה תוקף תקף');
    // אין נתונים תקינים
    return '';
  };
  
  // פונקציית עזר להצגת נתוני כרטיס אשראי מוסתרים
  const formatCreditCardNumber = (cardNumber) => {
    if (!cardNumber || typeof cardNumber !== 'string' || cardNumber.trim() === '') return '';
    
    // הסרת רווחים קיימים וחלוקה מחדש ל-4 ספרות בכל קבוצה
    const cleaned = cardNumber.replace(/\s+/g, '');
    
    // אם אחרי הניקוי נשארנו עם מחרוזת ריקה
    if (!cleaned) return '';
    
    let formatted = '';
    
    for (let i = 0; i < cleaned.length; i += 4) {
      const chunk = cleaned.slice(i, i + 4);
      formatted += chunk + ' ';
    }
    
    return formatted.trim();
  };
  
  // האזנה לשינויים בנתוני הקונטקסט
  useEffect(() => {
    if (contextBookings && contextBookings.length > 0) {
      // המרת מחרוזות תאריך לאובייקטים
      const processedBookings = contextBookings.map(booking => ({
        ...booking,
        checkIn: booking.checkIn ? (typeof booking.checkIn === 'string' ? parseISO(booking.checkIn) : booking.checkIn) : null,
        checkOut: booking.checkOut ? (typeof booking.checkOut === 'string' ? parseISO(booking.checkOut) : booking.checkOut) : null
      }));
      setBookings(processedBookings);
    }
  }, [contextBookings]);
  
  // טעינת נתונים בטעינה ראשונית
  useEffect(() => {
    fetchRooms();
    // שימוש בפונקציה החדשה שפועלת מול הקונטקסט
    fetchBookingsData();
    
    // טעינת מחירים דינמיים
    if (daysInView.length > 0) {
      fetchDynamicPrices(daysInView[0], daysInView[daysInView.length - 1]);
    }
  }, [fetchBookingsData]);
  
  // פונקציה לטיפול בלחיצה על תא
  const handleCellClick = (roomId, date) => {
    const bookingsForCell = getBookingsForRoomAndDate(roomId, date);
    const isBooked = bookingsForCell && bookingsForCell.length > 0;
    const isPast = date < new Date(new Date().setHours(0,0,0,0)); // תאריך בעבר
    
    if (isBooked && bookingsForCell[0] && bookingsForCell[0]._id) {
      // אם יש הזמנה, פתח את דיאלוג עריכת ההזמנה
      handleViewBooking(bookingsForCell[0]._id);
    } else {
      // אם אין הזמנה, הצג אפשרות להוספת הזמנה חדשה - כולל תאריכים שעברו
      handleAddBooking(roomId, date);
    }
  };
  
  // רינדור בהתאם לטאב הפעיל
  return (
    <>
      {/* סרגל צדדי מינימליסטי */}
      <MinimalSidebar>
        <SidebarButton title="לוח מחוונים" placement="right" isActive={currentPath === '/dashboard'}>
          <IconButton 
            component={Link} 
            to="/dashboard"
            sx={{ 
              color: isActive => isActive ? '#3498db' : '#666',
              '&:hover': { color: '#2980b9' }
            }}
          >
            <DashboardIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="תצוגת הזמנות" placement="right" isActive={currentPath === '/dashboard/bookings-new'}>
          <IconButton 
            component={Link} 
            to="/dashboard/bookings-new"
            sx={{ 
              color: isActive => isActive ? '#9b59b6' : '#666',
              '&:hover': { color: '#8e44ad' }
            }}
          >
            <CalendarMonthIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="106 / Airport" placement="right" isActive={currentPath === '/dashboard/simple-bookings'}>
          <IconButton 
            component={Link} 
            to="/dashboard/simple-bookings"
            sx={{ 
              color: isActive => isActive ? '#f39c12' : '#666',
              '&:hover': { color: '#d35400' }
            }}
          >
            <HotelIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="דו״ח הכנסות" placement="right" isActive={currentPath === '/dashboard/income-report'}>
          <IconButton 
            component={Link} 
            to="/dashboard/income-report"
            sx={{ 
              color: isActive => isActive ? '#e74c3c' : '#666',
              '&:hover': { color: '#c0392b' }
            }}
          >
            <AssessmentIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>

        <Box sx={{ flexGrow: 1 }} /> {/* מרווח גמיש שידחוף את האייקון הבא לתחתית */}
        
        <SidebarButton title="אתר הבית" placement="right" isActive={currentPath === '/'}>
          <IconButton 
            component={Link} 
            to="/"
            sx={{ 
              color: isActive => isActive ? '#2ecc71' : '#666',
              '&:hover': { color: '#27ae60' }
            }}
          >
            <LanguageIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
      </MinimalSidebar>
      
      <Container 
        maxWidth={false} 
        sx={{ 
          py: 0.2, // מרווח אנכי קטן יותר
          height: '100%',
          paddingLeft: '55px', // הוקטן מ-60px ל-55px
          paddingRight: '0px', // הוקטן מ-2px ל-0px 
          width: '100%', 
          boxSizing: 'border-box'
        }}
      >
        <Paper 
        elevation={0} 
          sx={{ 
            p: 1.5, // פחות ריפוד - הוקטן מ-2
          borderRadius: 3,
          backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #f8f9fa 100%)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
            height: 'fit-content', // גובה מותאם לתוכן במקום גובה קבוע
            maxHeight: '98vh', // מעט פחות מגובה המסך המלא
            width: 'calc(100% - 6px)', // הוגדל מ-10px ל-6px
            marginLeft: '3px', // הוקטן מ-5px ל-3px
            marginRight: '3px', // הוקטן מ-5px ל-3px
            marginBottom: '10px' // מרווח תחתון זהה למרווחים בצדדים
        }}
      >
        <Box sx={{ 
            mb: 0.5, 
            pt: 0.25,  // מרווח עליון מוקטן משמעותית
          px: 1,  // מרווח אופקי
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            pb: 0.5  // מרווח תחתון מוקטן משמעותית
        }}>
            <Grid container spacing={0.5} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={4}>
              {/* הסרת הקופסה עם הכותרת והקישור בהתאם לבקשת המשתמש */}
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', md: 'flex-end' },
                  mt: { xs: 0, md: 0 }
                // הסרת המסגרת והריפוד מסביב לכפתורים
              }}>
                <ActionButton 
                  variant="outlined" 
                  startIcon={<TodayIcon />}
                  onClick={handleToday}
                  size="small"
                  color="secondary"
                  sx={{ minWidth: '80px' }}
                >
                  היום
                </ActionButton>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  borderRadius: 2,
                  px: 0.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                }}>
                  <IconButton 
                    onClick={showPrevDays}
                    size="small"
                    color="primary"
                  >
                    <NavigateNextIcon />
                  </IconButton>
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mx: 1, 
                      textAlign: 'center', 
                      fontWeight: 'bold', 
                      color: theme.palette.primary.dark
                    }}
                  >
                    {daysInView.length > 0 
                      ? `${format(daysInView[0], 'dd/MM')} - ${format(daysInView[daysInView.length - 1], 'dd/MM')}` 
                      : 'טוען...'}
                  </Typography>
                  
                  <IconButton 
                    onClick={showNextDays}
                    size="small"
                    color="primary"
                  >
                    <NavigateBeforeIcon />
                  </IconButton>
                </Box>
                
                {/* החלפת כפתור הזמנה חדשה לאייקון בלבד */}
                <IconButton
                  color="primary"
                  onClick={() => handleAddBooking(null, new Date())}
                  size="small"
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2)
                    }
                  }}
                >
                  <AddIcon />
                </IconButton>
                
                {/* הסרת האייקונים למעבר בין מצבי תצוגה */}
              </Box>
            </Grid>
          </Grid>
          
          {/* הסרנו את הקופסה עם הטאבים */}
        </Box>
        
        {viewMode === 'calendar' && (
            <>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress thickness={4} size={40} sx={{ color: theme.palette.primary.main }} />
                </Box>
              ) : error ? (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2, 
                  borderRadius: 2,
                }}
              >
                {error}
              </Alert>
            ) : (
              <Fade in={true} timeout={500}>
                <Box
                  sx={{
                    padding: 0,
                    margin: 0,
                    display: 'block',
                      ml: 0,
                      mr: 0,
                      mb: 0, // ללא מרווח תחתון נוסף
                      width: '100%'
                  }}
                >
                  <Box sx={{ 
                    borderRadius: 3, 
                    overflow: 'hidden',
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    display: 'flex',  
                    flexDirection: 'column',
                    height: 'fit-content', // יתאים את הגובה לפי התוכן בדיוק
                    mb: 0,
                    pb: 0,
                    mr: 0, // אין צורך במרווח נוסף כאן
                    borderTopRightRadius: 0, // ללא עיגול בפינה הימנית העליונה
                    borderBottomRightRadius: 0 // ללא עיגול בפינה הימנית התחתונה
                  }}>
                      {/* הוספת הרמז לגרירה */}
                      <DragHint />
                      
                    <TableContainer sx={{ 
                        height: 'fit-content',
                      boxSizing: 'border-box',
                      overflow: 'auto',
                      pb: 0,
                        pl: 0, // ללא מרווח מצד שמאל
                        pr: 0, // ללא מרווח מצד ימין
                        width: '100%',
                        maxWidth: '100%',
                        mx: 0, // ללא מרווח אופקי נוסף
                      '&::-webkit-scrollbar': {
                          width: '6px', // הוקטן מ-8px
                          height: '6px' // הוקטן מ-8px
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: alpha(theme.palette.primary.main, 0.4),
                        borderRadius: '8px',
                        border: '2px solid transparent',
                        backgroundClip: 'padding-box',
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.6)
                        }
                      },
                      '&::-webkit-scrollbar-track': {
                        background: alpha(theme.palette.background.paper, 0.8),
                        borderRadius: '8px'
                      }
                    }}>
                      <Table stickyHeader sx={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{ 
                                width: 120, 
                                backgroundColor: theme.palette.background.paper,
                                borderBottom: `2px solid ${alpha(theme.palette.divider, 0.5)}`,
                                position: 'sticky',
                                top: 0,
                                left: 0,
                                zIndex: 11,
                                boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
                                  p: 1.5,
                                  pl: 2
                              }}
                            >
                              <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <HotelIcon fontSize="small" sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                                חדרים
                              </Typography>
                            </TableCell>
                            
                            {daysInView.map((day, index) => {
                              const isToday = isSameDay(day, new Date());
                              const isFriday = getDay(day) === 5; // רק יום שישי
                              return (
                                <StyledTableCell 
                                  key={index} 
                                  align="center" 
                                  isWeekend={isFriday}
                                  isToday={isToday}
                                  sx={{ 
                                      width: '120px', // רוחב קבוע לכל עמודה
                                      minWidth: '120px', 
                                      maxWidth: '120px',
                                      ...(isToday && {
                                        border: `2px solid ${alpha('#ff9800', 0.7)}`, // מסגרת כתומה יותר בולטת
                                        backgroundColor: alpha('#ff9800', 0.05) // רקע בגוון כתום עדין לכותרת
                                      })
                                  }}
                                >
                                  {isToday && <HighlightedColumn />}
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      color: isFriday ? theme.palette.warning.dark : isToday ? '#e67e22' : theme.palette.text.primary, // צבע טקסט כתום יותר כהה ליום הנוכחי
                                      mb: 0.5
                                    }}>
                                      {isFriday 
                                        ? <CircleIcon fontSize="small" sx={{ mr: 0.5, fontSize: 6, color: theme.palette.warning.main }} />
                                        : isToday 
                                          ? <BlinkingDot fontSize="small" sx={{ mr: 0.5, fontSize: 8, color: '#e67e22' }} />
                                          : <CircleIcon fontSize="small" sx={{ mr: 0.5, fontSize: 6, color: theme.palette.grey[500] }} />
                                      }
                                      <Typography 
                                        variant="caption" 
                                        component="div" 
                                        sx={{ 
                                          fontWeight: isToday ? 700 : 600,
                                          color: isFriday 
                                            ? theme.palette.warning.dark 
                                            : isToday 
                                              ? '#e67e22' // צבע כתום כהה יותר ליום הנוכחי
                                              : theme.palette.text.primary,
                                          fontSize: isToday ? '0.9rem' : '0.8rem', // גופן גדול יותר ליום הנוכחי
                                          letterSpacing: isToday ? '0.5px' : 'normal' // ריווח אותיות רחב יותר ליום הנוכחי
                                        }}
                                      >
                                        {format(day, 'EEEE', { locale: he })}
                                      </Typography>
                                    </Box>
                                    <Typography 
                                      variant="caption" 
                                      component="div"
                                      sx={{
                                        fontWeight: isToday ? 700 : 400,
                                        padding: isToday ? '3px 8px' : '2px 4px', // ריווח גדול יותר לתאריך הנוכחי
                                        borderRadius: 10,
                                        bgcolor: isToday ? alpha('#ff9800', 0.15) : 'transparent', // רקע כתום יותר בולט
                                        fontSize: isToday ? '0.9rem' : '0.8rem', // גופן גדול יותר לתאריך הנוכחי
                                        ...(isToday && {
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)' // הוספת צל קל לתאריך הנוכחי
                                        })
                                      }}
                                    >
                                      {format(day, 'dd/MM')}
                                    </Typography>
                                  </Box>
                                </StyledTableCell>
                              );
                            })}
                          </TableRow>
                        </TableHead>
                        
                        <TableBody sx={{ minHeight: 0 }}>
                          {rooms.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={daysInView.length + 1} align="center">
                                <Box sx={{ py: 4 }}>
                                  <HotelIcon sx={{ fontSize: 40, color: alpha(theme.palette.text.secondary, 0.5), mb: 1 }} />
                                  <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
                                    אין חדרים להצגה
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ) : (
                            rooms.map(room => (
                              <TableRow 
                                key={room._id}
                                  sx={{ 
                                  '&:hover': { 
                                    bgcolor: alpha(theme.palette.primary.light, 0.04)
                                  },
                                  transition: 'background-color 0.2s',
                                    height: '60px' // גובה קבוע קטן יותר לשורה
                                }}
                              >
                                <StyledRoomCell component="th" scope="row">
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    position: 'relative',
                                    zIndex: 3,
                                    minWidth: '100px', // רוחב מינימלי לתאי החדרים
                                    py: 1, pr: 0, mr: 0 // ריווח אנכי מקורי
                                  }}>
                                    <Avatar 
                                      sx={{ 
                                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                                        color: theme.palette.primary.dark,
                                        width: 36, // גודל אווטאר מקורי
                                        height: 36, // גודל אווטאר מקורי
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem' // גופן מקורי
                                      }}
                                    >
                                      {room.roomNumber}
                                    </Avatar>
                                  </Box>
                                </StyledRoomCell>

                                {daysInView.map((day, index) => {
                                  // קבלת הזמנות לחדר ותאריך ספציפיים
                                  const bookingsForCell = getBookingsForRoomAndDate(room._id, day);
                                    const isBooked = bookingsForCell && bookingsForCell.length > 0;
                                  const isPast = day < new Date(new Date().setHours(0,0,0,0)); // תאריך בעבר
                                  const paymentStatus = isBooked ? bookingsForCell[0].paymentStatus : null;
                                  const isCurrentDay = isSameDay(day, new Date());
                                  
                                    // הנתונים שקשורים להזמנה
                                  let isMultiDay = false;
                                  let isFirstDay = false;
                                  let isLastDay = false;
                                    let isSingleDay = false;
                                    let isMiddleDay = false;
                                  
                                    // אם יש הזמנה, נחלץ את המידע על הסטטוס שלה
                                    if (isBooked && bookingsForCell.length > 0) {
                                    const multiDayInfo = isPartOfMultiDayStay(bookingsForCell[0], room._id, day);
                                    isMultiDay = multiDayInfo.isMultiDay;
                                    isFirstDay = multiDayInfo.isStart;
                                    isLastDay = multiDayInfo.isEnd;
                                      isMiddleDay = multiDayInfo.isMiddle;
                                      isSingleDay = multiDayInfo.isSingleDay;
                                  }
                                  
                                  return (
                                      isBooked ? (
                                        // תא עם הזמנה - ניתן לגרירה
                                        <DraggableBookingCell
                                      key={`${room._id}-${index}`} 
                                          booking={bookingsForCell[0]}
                                          roomId={room._id}
                                          date={day}
                                      onClick={() => handleCellClick(room._id, day)}
                                      sx={{ 
                                            cursor: 'grab',
                                            padding: '6px 4px', // ריווח מוקטן
                                        position: 'relative',
                                            bgcolor: getCellBgColor(isBooked, isPast, paymentStatus, { 
                                              isStart: isFirstDay, 
                                              isMiddle: isMiddleDay, 
                                              isEnd: isLastDay, 
                                              isMultiDay: isMultiDay,
                                              isSingleDay: isSingleDay
                                            }, isBooked ? bookingsForCell[0] : null),
                                        borderLeft: isMultiDay && !isFirstDay ? 0 : '1px solid rgba(224, 224, 224, 0.15)',
                                        borderRight: isMultiDay && !isLastDay ? 0 : '1px solid rgba(224, 224, 224, 0.15)',
                                        borderBottom: '1px solid rgba(224, 224, 224, 0.15)',
                                            // הוספת עיצוב מיוחד ליום צ'ק-אין או הזמנה של יום אחד - ללא מסגרת כהה, רק הרקע
                                            ...(isBooked && (isFirstDay || isSingleDay) && {
                                              fontWeight: 'bold',
                                            }),
                                            // עיצוב ליום צ'ק-אאוט (יום האחרון בשהייה)
                                            ...(isBooked && isLastDay && !isFirstDay && !isSingleDay && {
                                              fontWeight: 'normal',
                                            }),
                                        '&:hover': {
                                          filter: 'brightness(0.95)',
                                          zIndex: 1
                                        },
                                        transition: 'all 0.2s ease',
                                            minHeight: '60px', // גובה אחיד מוקטן
                                            maxHeight: '60px',
                                            height: '60px',
                                            width: '100px', // רוחב קבוע - הוקטן מ-120px
                                            minWidth: '95px', // הוקטן מ-100px
                                            maxWidth: '100px', // הוקטן מ-120px
                                        ...(isCurrentDay && {
                                          zIndex: 1, // רק להגדרת z-index, בלי מסגרת
                                        })
                                      }}
                                    >
                                    {isCurrentDay && <HighlightedColumn />}
                                    {getCellContent(room, day)}
                                        </DraggableBookingCell>
                                      ) : (
                                        // תא פנוי - ניתן להשמיט עליו הזמנה
                                        <DroppableBookingCell
                                          key={`${room._id}-${index}`} 
                                          roomId={room._id}
                                          date={day}
                                          isBooked={isBooked}
                                          onDrop={(item) => handleBookingDrop(item, room._id, day, fetchBookingsData)}
                                          onClick={() => handleCellClick(room._id, day)}
                                          sx={{ 
                                            cursor: 'pointer',
                                            padding: '6px 4px', // ריווח מוקטן
                                            position: 'relative',
                                            bgcolor: getCellBgColor(isBooked, isPast, paymentStatus, { 
                                              isStart: isFirstDay, 
                                              isMiddle: isMiddleDay, 
                                              isEnd: isLastDay, 
                                              isMultiDay: isMultiDay,
                                              isSingleDay: isSingleDay
                                            }, isBooked ? bookingsForCell[0] : null),
                                            borderLeft: '1px solid rgba(224, 224, 224, 0.15)',
                                            borderRight: '1px solid rgba(224, 224, 224, 0.15)',
                                            borderBottom: '1px solid rgba(224, 224, 224, 0.15)',
                                            '&:hover': {
                                              filter: 'brightness(0.95)',
                                              zIndex: 1
                                            },
                                            transition: 'all 0.2s ease',
                                            minHeight: '60px', // גובה אחיד מוקטן
                                            maxHeight: '60px',
                                            height: '60px',
                                            width: '100px', // רוחב קבוע - הוקטן מ-120px
                                            minWidth: '95px', // הוקטן מ-100px
                                            maxWidth: '100px', // הוקטן מ-120px
                                            ...(isCurrentDay && {
                                              zIndex: 1, // רק להגדרת z-index, בלי מסגרת
                                            })
                                          }}
                                        >
                                          {isCurrentDay && <HighlightedColumn />}
                                          {getCellContent(room, day)}
                                        </DroppableBookingCell>
                                      )
                                  );
                                })}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                      {/* הסרת הקופסה שחוסמת רווחים */}
                  </Box>
                </Box>
                </Fade>
                )}
              </>
            )}
            
          {/* ... existing code for other views and dialogs ... */}
          </Paper>
          
        {/* רינדור של הדיאלוגים */}
          {/* דיאלוג עדכון מחיר */}
        <Dialog 
          open={priceDialog.open} 
          onClose={handlePriceDialogClose}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              overflow: 'hidden',
              width: { xs: '95%', sm: '450px' }
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            pb: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <AttachMoneyIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              עדכון מחיר ליום
                </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ 
                mb: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HotelIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                  <Typography component="span" fontWeight="bold">
                    חדר: {rooms.find(r => r._id === priceDialog.roomId)?.internalName || 'חדר'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonthIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                  <Typography component="span" fontWeight="bold">
                תאריך: {priceDialog.date ? format(priceDialog.date, 'dd/MM/yyyy') : 'טוען...'}
              </Typography>
              </Box>
            </Typography>
            
              <TextField
                label="מחיר חדש"
                type="number"
                fullWidth
                value={priceDialog.price}
                onChange={(e) => setPriceDialog({ ...priceDialog, price: Number(e.target.value) })}
                InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: theme.palette.success.main, fontWeight: 'bold' }}>₪</Typography>
              }}
              sx={{ 
                mt: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.light
                  }
                }
              }}
              />
            </Box>
          </DialogContent>
        
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={handlePriceDialogClose} 
            color="inherit"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            ביטול
          </Button>
          <Button 
            onClick={handleSavePrice} 
            variant="contained" 
            color="primary"
            startIcon={<CheckIcon />}
            sx={{ 
              borderRadius: 2, 
              px: 3,
              backgroundImage: 'linear-gradient(135deg, #3f51b5 0%, #2196f3 100%)',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 3px 10px rgba(33, 150, 243, 0.3)'
            }}
          >
              שמירה
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* דיאלוג עריכת הזמנה - מעוצב יותר קומפקטי ומודרני */}
        <Dialog 
          open={bookingDialog.open} 
          onClose={closeBookingDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          py: 1,
          px: 2,
          minHeight: '56px'
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  הזמנה #{bookingDialog.bookingData?.bookingNumber || ''}
              </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="primary"
                  sx={{ 
                    ml: 1,
                    borderRadius: 4,
                    py: 0.2,
                    px: 1.5,
                    fontSize: '0.8rem',
                    minWidth: 0
                  }}
                >
                  ממתין
                </Button>
              </Box>
              <IconButton
                aria-label="סגור"
                onClick={closeBookingDialog}
                size="small"
                  sx={{ 
                    color: theme.palette.text.secondary,
                  p: 0.8
                  }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </DialogTitle>
          
        <DialogContent sx={{ px: 2, py: 1.5, maxHeight: '80vh' }}>
            {bookingDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
              <CircularProgress thickness={4} size={40} sx={{ color: theme.palette.primary.main }} />
              </Box>
            ) : bookingDialog.bookingData ? (
              <>
                {/* כרטיסייה עליונה - פרטים כלליים וכפתורי פעולה */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 1.5,
                  mb: 1.5
                }}>
                  {/* פרטים כלליים */}
                  <Box sx={{ 
                    display: 'flex', 
                    width: '100%',
                    gap: { xs: 3, md: 4 }, 
                  flexWrap: 'wrap', 
                    justifyContent: 'space-between'
                  }}>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>חדר</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {bookingDialog.bookingData.room && typeof bookingDialog.bookingData.room === 'object' 
                            ? bookingDialog.bookingData.room.roomNumber || ''
                            : rooms.find(r => r._id === bookingDialog.bookingData.room)?.roomNumber || ''}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>תאריכים</Typography>
                        <Typography variant="body1" sx={{ fontWeight: '500', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                          {bookingDialog.bookingData.checkIn ? format(new Date(bookingDialog.bookingData.checkIn), 'dd/MM/yy') : ''} - {bookingDialog.bookingData.checkOut ? format(new Date(bookingDialog.bookingData.checkOut), 'dd/MM/yy') : ''}
                          <Box component="span" sx={{ ml: 0.8, px: 0.8, py: 0.1, bgcolor: 'primary.50', borderRadius: 1, fontSize: '0.85rem' }}>
                            {bookingDialog.bookingData.nights == 1 ? 'לילה אחד' : `${bookingDialog.bookingData.nights || 1} לילות`}
                          </Box>
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', ml: 'auto' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>סה"כ</Typography>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 'bold', 
                          color: theme.palette.success.main,
                          fontSize: '1.1rem',
                          whiteSpace: 'nowrap'
                        }}>
                          ₪{bookingDialog.bookingData.totalPrice || 0}
                        </Typography>
                      </Box>
                    
                  <ActionButton
                      variant="outlined"
                      color="error"
                      size="small"
                          startIcon={<CloseIcon fontSize="small" />}
                          onClick={async () => {
                            try {
                              const bookingId = bookingDialog.bookingId;
                              
                              // נסיון להשתמש בנקודת קצה הייעודית לביטול
                              try {
                                const response = await axios.post(
                                  `${process.env.REACT_APP_API_URL}/bookings/${bookingId}/cancel`,
                                  {},
                                  { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }}
                                );
                                
                                if (response.data.success) {
                                  toast.success('ההזמנה בוטלה בהצלחה');
                                  closeBookingDialog();
                                  fetchBookingsData();
                                  return;
                                }
                              } catch (cancelError) {
                                console.log('ניסיון ביטול דרך נקודת קצה ייעודית נכשל, מנסה גישה אחרת', cancelError);
                              }
                              
                              // אופציה חלופית - עדכון כל ההזמנה
                              const originalData = { ...bookingDialog.bookingData };
                              const updatedData = {
                                ...originalData,
                                paymentStatus: 'canceled',
                                status: 'canceled'
                              };
                              
                              const response = await axios.put(
                                `${process.env.REACT_APP_API_URL}/bookings/${bookingId}`,
                                updatedData,
                                { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }}
                              );
                              
                              if (response.data.success) {
                                toast.success('ההזמנה בוטלה בהצלחה');
                                closeBookingDialog();
                                fetchBookingsData();
                              } else {
                                toast.error(response.data.message || 'אירעה שגיאה בביטול ההזמנה');
                              }
                            } catch (error) {
                              console.error('שגיאה בביטול הזמנה:', error);
                              // נסיון אחרון מינימלי
                              try {
                                const minimalData = { paymentStatus: 'canceled' };
                                const response = await axios.put(
                                  `${process.env.REACT_APP_API_URL}/bookings/${bookingDialog.bookingId}`,
                                  minimalData,
                                  { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }}
                                );
                                
                                if (response.data.success) {
                                  toast.success('ההזמנה בוטלה בהצלחה');
                                  closeBookingDialog();
                                  fetchBookingsData();
                                  return;
                                }
                              } catch (finalError) {
                                console.error('כל הניסיונות נכשלו:', finalError);
                              }
                              
                              // הצגת שגיאה למשתמש
                              toast.error('אירעה שגיאה בביטול ההזמנה');
                            }
                      }}
                      sx={{
                            borderRadius: 1.5,
                            fontWeight: '500',
                            px: 1.5,
                            py: 0.5,
                            fontSize: '0.85rem',
                            minHeight: 0,
                        border: '1px solid #f44336',
                        '&:hover': {
                          bgcolor: 'rgba(244,67,54,0.04)'
                        }
                      }}
                    >
                          ביטול
                  </ActionButton>
                  </Box>
                        </Box>
                        </Box>
                
                {/* תוכן ראשי - מערכת כרטיסיות */}
                <Grid container spacing={1.5}>
                  {/* עמודה ראשית - מחירים ופרטי האורח */}
                  <Grid item xs={12} md={8}>
                    {/* אזור מחירים */}
                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, mb: 1.5, bgcolor: alpha('#f5f5f5', 0.3) }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                        <MonetizationOnIcon sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>מחירים</Typography>
                        <Box sx={{ ml: 'auto' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={bookingDialog.bookingData?.isTourist || false}
                              onChange={(e) => handleBookingFormChange('isTourist', e.target.checked)}
                              color="primary"
                                size="small"
                                sx={{ p: 0.5 }}
                            />
                          }
                          label={
                              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>תייר (פטור ממע״מ)</Typography>
                            }
                            sx={{ m: 0 }}
                          />
                        </Box>
                      </Box>
                      
                      <Grid container spacing={1.5}>
                        <Grid item xs={4}>
                        <TextField
                            label="ללא מע״מ"
                          size="small"
                          fullWidth
                          type="number"
                          value={bookingDialog.bookingData.pricePerNightNoVat || Math.round((bookingDialog.bookingData.pricePerNight / (1 + vatRate / 100)) * 100) / 100}
                          onChange={(e) => handleBookingFormChange('pricePerNightNoVat', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                          }}
                          sx={{ 
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                              '& .MuiInputLabel-root': { fontSize: '0.85rem' },
                              '& .MuiOutlinedInput-input': { py: 1, fontSize: '0.9rem' },
                              '& .MuiInputAdornment-root': { '& p': { fontSize: '0.9rem' } }
                          }}
                        />
                      </Grid>
                      
                        <Grid item xs={4}>
                        <TextField
                            label="כולל מע״מ"
                          size="small"
                          fullWidth
                          type="number"
                          value={bookingDialog.bookingData.pricePerNight || bookingDialog.bookingData.totalPrice / (bookingDialog.bookingData.nights || 1)}
                          onChange={(e) => handleBookingFormChange('pricePerNight', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                          }}
                          sx={{ 
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                              '& .MuiInputLabel-root': { fontSize: '0.85rem' },
                              '& .MuiOutlinedInput-input': { py: 1, fontSize: '0.9rem' },
                              '& .MuiInputAdornment-root': { '& p': { fontSize: '0.9rem' } }
                          }}
                        />
                      </Grid>
                      
                        <Grid item xs={4}>
                        <TextField
                            label="סה״כ להזמנה"
                          size="small"
                          fullWidth
                          type="number"
                          value={bookingDialog.bookingData.totalPrice || 0}
                          onChange={(e) => handleBookingFormChange('totalPrice', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                          }}
                          sx={{ 
                              '& .MuiInputLabel-root': { fontSize: '0.85rem' },
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                              '& .MuiOutlinedInput-input': { py: 1, fontSize: '0.9rem' },
                              '& .MuiInputAdornment-root': { '& p': { fontSize: '0.9rem' } }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                
                {/* פרטי אורח */}
                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                        <PersonIcon sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>פרטי אורח</Typography>
                      </Box>
                      
                      <Grid container spacing={1.5}>
                        <Grid item xs={6} sm={3}>
                  <TextField
                    label="שם פרטי"
                            size="small"
                    fullWidth
                    defaultValue={bookingDialog.bookingData.guest?.firstName || ''}
                            sx={{ 
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                              '& .MuiInputLabel-root': { fontSize: '0.85rem' },
                              '& .MuiOutlinedInput-input': { py: 1, fontSize: '0.9rem' }
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={6} sm={3}>
                  <TextField
                    label="שם משפחה"
                            size="small"
                    fullWidth
                    defaultValue={bookingDialog.bookingData.guest?.lastName || ''}
                            sx={{ 
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                              '& .MuiInputLabel-root': { fontSize: '0.85rem' },
                              '& .MuiOutlinedInput-input': { py: 1, fontSize: '0.9rem' }
                            }}
                  />
                        </Grid>
                  
                        <Grid item xs={6} sm={3}>
                  <TextField
                    label="דוא״ל"
                            size="small"
                    fullWidth
                    defaultValue={bookingDialog.bookingData.guest?.email || ''}
                    type="email"
                            sx={{ 
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                              '& .MuiInputLabel-root': { fontSize: '0.85rem' },
                              '& .MuiOutlinedInput-input': { py: 1, fontSize: '0.9rem' }
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={6} sm={3}>
                  <TextField
                    label="טלפון"
                            size="small"
                    fullWidth
                    defaultValue={bookingDialog.bookingData.guest?.phone || ''}
                            sx={{ 
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                              '& .MuiInputLabel-root': { fontSize: '0.85rem' },
                              '& .MuiOutlinedInput-input': { py: 1, fontSize: '0.9rem' }
                            }}
                            InputProps={{
                              endAdornment: bookingDialog.bookingData.guest?.phone ? (
                                <InputAdornment position="end">
                                  <Tooltip title="וואטסאפ">
                                    <IconButton
                                      size="small"
                                      sx={{ 
                                        color: '#25D366',
                                        '&:hover': { bgcolor: alpha('#25D366', 0.1) },
                                        p: 0.5
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const cleanPhone = bookingDialog.bookingData.guest.phone.replace(/\D/g, '');
                                        const formattedPhone = cleanPhone.startsWith('0') ? `972${cleanPhone.substring(1)}` : cleanPhone;
                                        window.open(`https://wa.me/${formattedPhone}`, '_blank');
                                      }}
                                    >
                                      <WhatsAppIcon sx={{fontSize: '1.2rem'}} />
                                    </IconButton>
                                  </Tooltip>
                                </InputAdornment>
                              ) : null
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                    
                    {/* הערות */}
                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                        <InfoIcon sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>הערות</Typography>
                      </Box>
                      
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        placeholder="הערות להזמנה..."
                        value={bookingDialog.bookingData.notes || ''}
                        onChange={(e) => handleBookingFormChange('notes', e.target.value)}
                      sx={{ 
                          '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                          '& .MuiInputBase-input': { fontSize: '0.9rem', py: 0.8 }
                        }}
                      />
                    </Paper>
                  </Grid>
                  
                  {/* עמודת תשלום */}
                  <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                        <AttachMoneyIcon sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>תשלום</Typography>
                      </Box>
                      
                      <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                          <FormControl 
                            fullWidth 
                            size="small"
                            sx={{ 
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                              '& .MuiInputLabel-root': { fontSize: '0.85rem' },
                              '& .MuiSelect-select': { py: 1, fontSize: '0.9rem' }
                            }}
                          >
                            <InputLabel>אמצעי תשלום</InputLabel>
                            <Select
                              value={bookingDialog.bookingData.paymentMethod || ''}
                              label="אמצעי תשלום"
                              onChange={(e) => handlePaymentChange('paymentMethod', e.target.value)}
                            >
                              {/* <MenuItem value="credit">כרטיס אשראי</MenuItem> */}
                              <MenuItem value="creditOr">אשראי אור יהודה</MenuItem>
                              <MenuItem value="creditRothschild">אשראי רוטשילד</MenuItem>
                              <MenuItem value="cash">מזומן</MenuItem>
                              <MenuItem value="mizrahi">העברה מזרחי</MenuItem>
                              <MenuItem value="bitMizrahi">ביט מזרחי</MenuItem>
                              <MenuItem value="payboxMizrahi">פייבוקס מזרחי</MenuItem>
                              <MenuItem value="poalim">העברה פועלים</MenuItem>
                              <MenuItem value="bitPoalim">ביט פועלים</MenuItem>
                              <MenuItem value="payboxPoalim">פייבוקס פועלים</MenuItem>
                              <MenuItem value="other">אחר</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <FormControl 
                            fullWidth 
                            size="small"
                            sx={{ 
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                              '& .MuiInputLabel-root': { fontSize: '0.85rem' },
                              '& .MuiSelect-select': { py: 1, fontSize: '0.9rem' }
                            }}
                          >
                            <InputLabel>סטטוס תשלום</InputLabel>
                            <Select
                              value={bookingDialog.bookingData?.paymentStatus || 'pending'}
                              label="סטטוס תשלום"
                              onChange={(e) => handlePaymentChange('paymentStatus', e.target.value)}
                            >
                              <MenuItem value="pending">ממתין לתשלום</MenuItem>
                              <MenuItem value="partial">שולם חלקית</MenuItem>
                              <MenuItem value="paid">שולם</MenuItem>
                              <MenuItem value="canceled">בוטל</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.8, fontWeight: 500, fontSize: '0.9rem' }}>
                            פרטי כרטיס אשראי
                          </Typography>
                          
                      <TextField
                            label="מספר כרטיס"
                            size="small"
                        fullWidth
                            defaultValue={bookingDialog.bookingData.creditCard?.cardNumber || ''}
                            sx={{ 
                              mb: 1.5,
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                              '& .MuiInputLabel-root': { fontSize: '0.85rem' },
                              '& .MuiOutlinedInput-input': { py: 1, fontSize: '0.9rem' }
                            }}
                          />
                          
                          <Grid container spacing={1.5}>
                            <Grid item xs={6}>
                              <TextField
                                label="תוקף"
                                size="small"
                                fullWidth
                                placeholder="MM/YY"
                                defaultValue={bookingDialog.bookingData.creditCard && Object.values(bookingDialog.bookingData.creditCard).some(val => val) ? formatCreditCardExpiry(bookingDialog.bookingData.creditCard) : ''}
                                sx={{ 
                                  '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                                  '& .MuiInputLabel-root': { fontSize: '0.85rem' },
                                  '& .MuiOutlinedInput-input': { py: 1, fontSize: '0.9rem' }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <TextField
                                label="CVV"
                                size="small"
                        fullWidth
                                placeholder="123"
                                defaultValue={bookingDialog.bookingData.creditCard?.cvv || ''}
                                sx={{ 
                                  '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                                  '& .MuiInputLabel-root': { fontSize: '0.85rem' },
                                  '& .MuiOutlinedInput-input': { py: 1, fontSize: '0.9rem' }
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Paper>
                    </Grid>
                  </Grid>
              </>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography>לא נמצאו פרטי הזמנה</Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 1.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Button 
            onClick={closeBookingDialog} 
            color="inherit"
            size="small"
            sx={{ 
              borderRadius: 1.5, 
              textTransform: 'none', 
              fontWeight: 600,
              px: 1.5,
              fontSize: '0.9rem',
              py: 0.6
            }}
          >
            סגירה
          </Button>
          <ActionButton 
            onClick={() => handleUpdateBooking(bookingDialog.bookingData)} 
            color="primary" 
            variant="contained"
            size="small"
            startIcon={<CheckIcon sx={{fontSize: '1rem'}} />}
            sx={{
              borderRadius: 1.5,
              fontSize: '0.9rem',
              py: 0.6,
              px: 1.5
            }}
          >
            שמירה
          </ActionButton>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג הזמנה חדשה */}
      <BookingDialog
        open={newBookingDialog.open} 
        onClose={() => setNewBookingDialog({ open: false, roomId: null, date: null })}
        onSave={handleSaveNewBooking}
        selectedRoom={rooms.find(r => r._id === newBookingDialog.roomId)}
        selectedDate={newBookingDialog.date}
        rooms={rooms}
      />
      </Container>
    </>
  );
};

export default BookingListView; 
