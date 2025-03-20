import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { format, addDays, addMonths, subMonths, isSameDay, getDay, differenceInDays } from 'date-fns';
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
  // אייקונים חדשים לסרגל הצדדי
  Dashboard as DashboardIcon,
  ListAlt as ListAltIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { InputAdornment } from '@mui/material';

// קומפוננטות מותאמות אישית עם styled
const StyledTableCell = styled(TableCell)(({ theme, isWeekend, isToday }) => ({
  padding: theme.spacing(0.75), // פחות ריפוד
  minWidth: '120px',
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
  minWidth: '80px',
  maxWidth: '120px',
  padding: theme.spacing(1),
  paddingRight: 0, // ללא ריפוד בצד ימין
  paddingLeft: theme.spacing(0.5), // ריפוד מאוד מוקטן בצד שמאל
  borderRight: 0, // ללא גבול מימין
  borderTopRightRadius: 0, // ללא עיגול בפינה הימנית העליונה
  borderBottomRightRadius: 0 // ללא עיגול בפינה הימנית התחתונה
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
  boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}`,
  backgroundColor: alpha(theme.palette.primary.light, 0.03),
  zIndex: 0
}));

// קומפוננטה חדשה - סרגל צדדי מינימליסטי
const MinimalSidebar = styled(Box)(({ theme }) => ({
  position: 'fixed',
  left: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
  padding: '10px 0',
  backgroundColor: '#ffffff',
  boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
  borderRadius: '0 8px 8px 0',
  zIndex: 100,
  gap: '5px'
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
    borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent'
  }
}));

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */

const BookingListView = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const { isAdmin } = useContext(AuthContext);
  const location = useLocation();
  const currentPath = location.pathname;

  // סטייט לשמירת נתונים
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  
  // סטייט עבור אחוז המע"מ
  const [vatRate, setVatRate] = useState(18); // 18% מע"מ  
  
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
    
    // מוסיף 3 ימים לפני היום הנוכחי
    for (let i = -3; i < daysToShow - 3; i++) {
      days.push(addDays(today, i));
    }
    
    setDaysInView(days);
  }, [daysToShow]);
  
  // משתנה סטייט למחירים דינמיים
  const [dynamicPrices, setDynamicPrices] = useState([]);
  
  const navigate = useNavigate();
  
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
  
  // טעינת הזמנות
  const fetchBookings = async () => {
    try {
      if (daysInView.length === 0) return;
      
      setLoading(true);
      const startDate = format(daysInView[0], 'yyyy-MM-dd');
      const endDate = format(daysInView[daysInView.length - 1], 'yyyy-MM-dd');
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings`, {
        params: { startDate, endDate },
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        console.log('נטענו הזמנות:', response.data.data);
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('שגיאה בטעינת ההזמנות:', error);
      setError('אירעה שגיאה בטעינת ההזמנות');
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה לקבלת הזמנות לחדר ספציפי ביום ספציפי
  const getBookingsForRoomAndDate = (roomId, date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    console.log(`בודק הזמנות לחדר ${roomId} בתאריך ${formattedDate}`);
    
    const roomBookings = bookings.filter(booking => {
      const checkInDate = format(new Date(booking.checkIn), 'yyyy-MM-dd');
      const checkOutDate = format(new Date(booking.checkOut), 'yyyy-MM-dd');
      
      // תנאי לבדיקת התאריך - חייב להיות בין צ'ק אין לצ'ק אאוט
      const isDateInRange = formattedDate >= checkInDate && formattedDate < checkOutDate;
      
      if (!isDateInRange) {
        return false;
      }
      
      console.log(`נמצאה הזמנה בטווח התאריכים: ${booking._id}, צ'ק-אין: ${checkInDate}, צ'ק-אאוט: ${checkOutDate}`);
      
      // בדיקה אם ההזמנה היא להזמנת חדר בודד
      if (booking.room && booking.room._id === roomId) {
        console.log(`התאמה להזמנת חדר בודד: ${booking._id}, חדר: ${booking.room._id}`);
        return true;
      }
      
      // בדיקה אם ההזמנה היא להזמנת חדרים מרובים
      if (booking.rooms && Array.isArray(booking.rooms)) {
        console.log(`בודק הזמנת חדרים מרובים: ${booking._id}, חדרים: ${JSON.stringify(booking.rooms)}`);
        
        // בדיקה אם מזהה החדר נמצא במערך rooms כמזהה
        if (booking.rooms.includes(roomId)) {
          console.log(`התאמה להזמנת חדרים מרובים (מזהה): ${booking._id}, חדר ${roomId} נמצא במערך`);
          return true;
        }
        
        // בדיקה אם מזהה החדר נמצא במערך rooms כאובייקט
        if (booking.rooms.some(room => room._id === roomId)) {
          console.log(`התאמה להזמנת חדרים מרובים (אובייקט): ${booking._id}, חדר ${roomId} נמצא במערך`);
          return true;
        }
        
        console.log(`אין התאמה להזמנת חדרים מרובים: ${booking._id}, חדר ${roomId} לא נמצא במערך`);
      }
      
      return false;
    });
    
    console.log(`נמצאו ${roomBookings.length} הזמנות לחדר ${roomId} בתאריך ${formattedDate}`);
    
    if (roomBookings.length > 0) {
      console.log(`פרטי הזמנות שנמצאו: ${JSON.stringify(roomBookings.map(booking => ({
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        isMultiRoom: booking.isMultiRoomBooking,
        room: booking.room?._id,
        rooms: booking.rooms
      })))}`);
    }
    
    return roomBookings;
  };
  
  // פונקציה לקבלת צבע התא לפי סטטוס ההזמנה
  const getCellBgColor = (isBooked, isPast, paymentStatus, isMultiDay) => {
    if (!isBooked) {
      // חדר פנוי - צבע לבן/בהיר מאוד
      return isPast 
        ? alpha(theme.palette.grey[100], 0.3) 
        : 'rgba(255, 255, 255, 0.5)';
    }
    
    // הזמנה רגילה או המשך שהייה
    if (isMultiDay) {
      return alpha(theme.palette.info.light, 0.08);
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
    if (!roomBooking) return false;
    
    const checkIn = new Date(roomBooking.checkIn);
    const checkOut = new Date(roomBooking.checkOut);
    
    return (
      roomBooking.room === roomId &&
      date >= checkIn &&
      date < checkOut &&
      differenceInDays(checkOut, checkIn) > 1
    );
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
    const isBooked = bookingsForCell.length > 0;
    const isPast = date < new Date(new Date().setHours(0,0,0,0)); // תאריך בעבר
    
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
    const booking = bookingsForCell[0]; // במקרה שלנו, יכולה להיות רק הזמנה אחת לחדר ליום
    
    // בדיקה אם זו הזמנה שנמשכת מכמה ימים
    const { isMultiDay, isStart, isMiddle, isEnd } = isPartOfMultiDayStay(booking, room._id, date);
    
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
            {(isStart || isMiddle) && (
              <ArrowBackIcon sx={{ fontSize: 10 }} />
            )}
            
            {isMiddle && (
              <Typography variant="caption" sx={{ mx: 0.3, fontSize: '0.6rem' }}>
                המשך
          </Typography>
            )}
            
            {(isMiddle || isEnd) && (
              <ArrowForwardIcon sx={{ fontSize: 10 }} />
            )}
            
            {isStart && (
              <Typography variant="caption" sx={{ mr: 0.3, fontSize: '0.6rem' }}>
                כניסה
              </Typography>
            )}
            
            {isEnd && (
              <Typography variant="caption" sx={{ ml: 0.3, fontSize: '0.6rem' }}>
                יציאה
              </Typography>
            )}
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

  // טיפול בשינוי שדה בדיאלוג עריכת הזמנה
  const handleBookingFormChange = (field, value) => { 
    setBookingDialog(prev => { 
      const updatedBookingData = { ...prev.bookingData }; 
      
      if (field.includes('.')) { 
        const [parent, child] = field.split('.'); 
        updatedBookingData[parent] = { 
          ...updatedBookingData[parent], 
          [child]: value 
        }; 
      } else { 
        updatedBookingData[field] = value; 
      }
      
      // טיפול בשדות מחיר
      const nights = updatedBookingData.nights || 1;

      // אם שינו מחיר ללילה ללא מע"מ
      if (field === 'pricePerNightNoVat' && value) {
        const priceNoVat = parseFloat(value);
        const isTourist = updatedBookingData.isTourist;
        
        // חישוב מחיר עם מע"מ תלוי אם תייר
        if (isTourist) {
          updatedBookingData.pricePerNight = priceNoVat; // תייר - אין מע"מ
        } else {
          updatedBookingData.pricePerNight = Math.round((priceNoVat * (1 + vatRate / 100)) * 100) / 100;
        }
        
        // עדכון סה"כ מחיר
        updatedBookingData.totalPrice = Math.round(updatedBookingData.pricePerNight * nights * 100) / 100;
      }
      
      // אם שינו מחיר ללילה כולל מע"מ
      if (field === 'pricePerNight' && value) {
        const priceWithVat = parseFloat(value);
        const isTourist = updatedBookingData.isTourist;
        
        // חישוב מחיר ללא מע"מ תלוי אם תייר
        if (isTourist) {
          updatedBookingData.pricePerNightNoVat = priceWithVat; // תייר - זהה למחיר עם מע"מ
        } else {
          updatedBookingData.pricePerNightNoVat = Math.round((priceWithVat / (1 + vatRate / 100)) * 100) / 100;
        }
        
        // עדכון סה"כ מחיר
        updatedBookingData.totalPrice = Math.round(priceWithVat * nights * 100) / 100;
      }
      
      // אם שינו סה"כ מחיר
      if (field === 'totalPrice' && value) {
        const totalPrice = parseFloat(value);
        const isTourist = updatedBookingData.isTourist;
        
        // עדכון מחיר ללילה כולל מע"מ
        updatedBookingData.pricePerNight = Math.round((totalPrice / nights) * 100) / 100;
        
        // עדכון מחיר ללילה ללא מע"מ תלוי אם תייר
        if (isTourist) {
          updatedBookingData.pricePerNightNoVat = updatedBookingData.pricePerNight; // תייר - זהה למחיר עם מע"מ
        } else {
          updatedBookingData.pricePerNightNoVat = Math.round((updatedBookingData.pricePerNight / (1 + vatRate / 100)) * 100) / 100;
        }
      }
      
      // אם שינו את השדה isTourist
      if (field === 'isTourist') {
        const isTourist = value === true || value === 'true';
        
        if (isTourist) {
          // תייר: מחיר ללילה כולל מע"מ = מחיר ללא מע"מ (אין מע"מ)
          updatedBookingData.pricePerNight = updatedBookingData.pricePerNightNoVat;
        } else {
          // לא תייר: חישוב מחיר כולל מע"מ
          updatedBookingData.pricePerNight = Math.round((updatedBookingData.pricePerNightNoVat * (1 + vatRate / 100)) * 100) / 100;
        }
        
        // עדכון סה"כ מחיר
        updatedBookingData.totalPrice = Math.round(updatedBookingData.pricePerNight * nights * 100) / 100;
      }
      
      return { 
        ...prev, 
        bookingData: updatedBookingData 
      }; 
    }); 
  };

  // עדכון פרטי הזמנה
  const handleUpdateBooking = async (updatedData) => {
    try {
      const { bookingId } = bookingDialog;
      
      // לוודא שיש לנו את כל שדות המחיר שצריך
      const bookingToUpdate = {
        ...updatedData,
        // וידוא קיום שדות המחיר
        pricePerNight: updatedData.pricePerNight || updatedData.totalPrice / (updatedData.nights || 1),
        pricePerNightNoVat: updatedData.pricePerNightNoVat || Math.round((updatedData.pricePerNight / (1 + vatRate / 100)) * 100) / 100,
        totalPrice: updatedData.totalPrice || 0,
        // לשמירה על תאימות עם מבנה קיים
        basePrice: updatedData.pricePerNightNoVat || Math.round((updatedData.pricePerNight / (1 + vatRate / 100)) * 100) / 100
      };
      
      console.log('שולח עדכון הזמנה עם נתוני מחיר:', {
        totalPrice: bookingToUpdate.totalPrice,
        pricePerNight: bookingToUpdate.pricePerNight,
        pricePerNightNoVat: bookingToUpdate.pricePerNightNoVat
      });
      
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`, bookingToUpdate, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        toast.success('ההזמנה עודכנה בהצלחה');
        closeBookingDialog();
        fetchBookings(); // רענון הנתונים
      } else {
        toast.error('אירעה שגיאה בעדכון ההזמנה');
      }
    } catch (error) {
      console.error('שגיאה בעדכון ההזמנה:', error);
      toast.error('אירעה שגיאה בעדכון ההזמנה');
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
        paymentMethod: 'credit',
        paymentStatus: 'pending',
        // הוספת שדות כרטיס אשראי
        creditCard: {
          cardNumber: '',
          expiry: '',
          cvv: ''
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
        paymentMethod: 'credit',
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
      
      // אם שינו סה"כ מחיר להזמנה
      if (field === 'totalPrice' && value) {
        const totalPrice = parseFloat(value);
        const nights = updatedFormData.nights || 1;
        const isTourist = updatedFormData.isTourist;
        
        // עדכון מחיר ללילה כולל מע"מ
        updatedFormData.pricePerNight = Math.round((totalPrice / nights) * 100) / 100;
        
        // עדכון מחיר ללילה ללא מע"מ - תלוי אם תייר
        if (isTourist) {
          updatedFormData.pricePerNightNoVat = updatedFormData.pricePerNight; // תייר - זהה למחיר עם מע"מ
        } else {
          updatedFormData.pricePerNightNoVat = Math.round((updatedFormData.pricePerNight / (1 + vatRate / 100)) * 100) / 100;
        }
      }
      
      // אם שינו את השדה isTourist
      if (field === 'isTourist') {
        const isTourist = value === true || value === 'true';
        
        const nights = updatedFormData.nights || 1;
        
        if (isTourist) {
          // תייר: מחיר ללילה כולל מע"מ = מחיר ללא מע"מ (אין מע"מ)
          updatedFormData.pricePerNight = updatedFormData.pricePerNightNoVat;
        } else {
          // לא תייר: עדכון מחיר כולל מע"מ
          updatedFormData.pricePerNight = Math.round((updatedFormData.pricePerNightNoVat * (1 + vatRate / 100)) * 100) / 100;
        }
        
        // עדכון סה"כ מחיר להזמנה
        updatedFormData.totalPrice = Math.round(updatedFormData.pricePerNight * nights * 100) / 100;
        
        console.log(`סטטוס תייר עודכן ל-${isTourist ? 'כן' : 'לא'}, מחיר עודכן: ${updatedFormData.pricePerNight} x ${nights} לילות = ${updatedFormData.totalPrice}`);
      }
      
      return {
        ...prev,
        formData: updatedFormData
      };
    });
  };
  
  // פונקציה לשמירת הזמנה חדשה
  const handleSaveNewBooking = async () => {
    try {
      // עדכון מצב טעינה
      setNewBookingDialog(prev => ({ ...prev, loading: true }));
      
      const { formData } = newBookingDialog;
      
      // הגדרת ערכי ברירת מחדל לשדות חסרים
      const defaultFirstName = formData.firstName || 'אורח';
      const defaultLastName = formData.lastName || ''; // השארת שם משפחה ריק אם לא הוזן
      const defaultEmail = formData.email || 'guest@example.com';
      const defaultPhone = formData.phone || '0500000000';
      const roomId = formData.roomId || (rooms.length > 0 ? rooms[0]._id : '');
      const totalPrice = formData.totalPrice || '0';
      const pricePerNight = formData.pricePerNight || '0';
      const pricePerNightNoVat = formData.pricePerNightNoVat || '0';
      const nights = formData.nights || 1;
      
      // עיבוד וטיפול בתאריכים
      const checkIn = formData.checkIn ? new Date(formData.checkIn) : new Date();
      const checkOutDate = formData.checkOut ? new Date(formData.checkOut) : new Date(new Date().setDate(new Date().getDate() + 1));
      const checkInFormatted = format(checkIn, 'yyyy-MM-dd');
      const checkOutFormatted = format(checkOutDate, 'yyyy-MM-dd');
      
      // וידוא שישר פרטי כרטיס אשראי
      const creditCardDetails = formData.creditCard || {
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      };
      
      // מבנה בקשה תואם למצופה בשרת
      const requestData = {
        roomId: roomId,  // השרת מצפה ל-roomId ולא ל-room
        checkIn: checkInFormatted,
        checkOut: checkOutFormatted,
        nights: nights,
        totalPrice: parseFloat(totalPrice),
        pricePerNight: parseFloat(pricePerNight),
        pricePerNightNoVat: parseFloat(pricePerNightNoVat),
        basePrice: parseFloat(pricePerNightNoVat), // לשמירה על תאימות עם מבנה קיים
        status: 'confirmed',
        paymentStatus: formData.paymentStatus || 'pending',
        paymentMethod: formData.paymentMethod || 'credit',
        guest: {
          firstName: defaultFirstName,
          lastName: defaultLastName,
          email: defaultEmail,
          phone: defaultPhone
        },
        creditCard: {
          cardNumber: creditCardDetails.cardNumber || '',
          expiryDate: creditCardDetails.expiryDate || '',
          cvv: creditCardDetails.cvv || '',
          cardholderName: creditCardDetails.cardholderName || ''
        },
        notes: formData.notes || ''
      };
      
      console.log('שליחת בקשה ליצירת הזמנה:', JSON.stringify(requestData));
      
      // שליחת הבקשה לשרת
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/bookings`, 
        requestData, 
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // עדכון מצב תצוגה
      closeNewBookingDialog();
      
      // רענון הזמנות
      fetchBookings();
      
      // הודעה למשתמש
      toast.success('ההזמנה נוצרה בהצלחה');
    } catch (error) {
      console.error('שגיאה ביצירת הזמנה:', error);
      console.error('פרטי השגיאה:', error.response?.data);
      
      // עדכון מצב שגיאה בדיאלוג
      setNewBookingDialog(prev => ({ ...prev, loading: false }));
      
      // הודעת שגיאה למשתמש
      toast.error(`שגיאה: ${error.response?.data?.message || 'אירעה שגיאה ביצירת ההזמנה'}`);
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
    // לוג מפורט של נתוני כרטיס האשראי לצורך ניפוי שגיאות
    console.log('מנסה לפרמט תוקף כרטיס אשראי:', creditCard);
    
    if (!creditCard) return '';
    
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
    if (creditCard.expiryDate) {
      console.log('נמצא שדה expiryDate:', creditCard.expiryDate);
      return creditCard.expiryDate;
    }
    
    // בדיקה אם יש שדה expirationDate
    if (creditCard.expirationDate) {
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
    if (!cardNumber) return '';
    
    // הסרת רווחים קיימים וחלוקה מחדש ל-4 ספרות בכל קבוצה
    const cleaned = cardNumber.replace(/\s+/g, '');
    let formatted = '';
    
    for (let i = 0; i < cleaned.length; i += 4) {
      const chunk = cleaned.slice(i, i + 4);
      formatted += chunk + ' ';
    }
    
    return formatted.trim();
  };
  
  // עדכון קריאה לפונקציה לטעינת מחירים דינמיים כשהדף נטען
  useEffect(() => {
    fetchBookings();
    fetchRooms();
    // הוסף טעינת מחירים דינמיים
    if (daysInView && daysInView.length > 0) {
      fetchDynamicPrices(daysInView[0], daysInView[daysInView.length - 1]);
    }
  }, [daysInView]);
  
  // פונקציה לטיפול בלחיצה על תא
  const handleCellClick = (roomId, date) => {
    const bookingsForCell = getBookingsForRoomAndDate(roomId, date);
    const isBooked = bookingsForCell.length > 0;
    const isPast = date < new Date(new Date().setHours(0,0,0,0)); // תאריך בעבר
    
    if (isBooked) {
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
        <SidebarButton title="דף הבית" placement="right" isActive={currentPath === '/'}>
          <IconButton component={Link} to="/">
            <HomeIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="לוח מחוונים" placement="right" isActive={currentPath === '/dashboard'}>
          <IconButton component={Link} to="/dashboard">
            <DashboardIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="יומן הזמנות" placement="right" isActive={currentPath === '/dashboard/bookings-calendar'}>
          <IconButton component={Link} to="/dashboard/bookings-calendar">
            <CalendarMonthIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="ניהול הזמנות" placement="right" isActive={currentPath === '/dashboard/bookings-new'}>
          <IconButton component={Link} to="/dashboard/bookings-new">
            <ListAltIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="ניהול חדרים" placement="right" isActive={currentPath === '/dashboard/rooms'}>
          <IconButton component={Link} to="/dashboard/rooms">
            <HotelIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="גלריה" placement="right" isActive={currentPath === '/dashboard/gallery'}>
          <IconButton component={Link} to="/dashboard/gallery">
            <CollectionsIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
      </MinimalSidebar>
      
      <Container maxWidth="xl" sx={{ py: 2, height: '100%' }}>
        <Paper 
        elevation={0} 
          sx={{ 
          p: 2, 
          pl: 2,  // ריפוד שמאלי
          pr: 4,  // הגדלת הריפוד הימני כדי למנוע התנגשות עם סרגל הכלים
          borderRadius: 3,
          backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #f8f9fa 100%)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',  // מכסה את כל גובה החלון
          maxHeight: '100vh', // מגביל את הגובה המקסימלי
          position: 'fixed', // קובע את העמוד במקום
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          marginRight: '60px' // מרווח בצד ימין למניעת התנגשות עם סרגל הכלים
        }}
      >
        <Box sx={{ 
          mb: 2, 
          pt: 1,  // מרווח עליון לעיצוב יותר טוב
          px: 1,  // מרווח אופקי
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          pb: 2  // מרווח תחתון
        }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={4}>
              {/* הסרת הקופסה עם הכותרת והקישור בהתאם לבקשת המשתמש */}
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', md: 'flex-end' },
                mt: { xs: 1, md: 0 }
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
                    ml: 0, // אין מרווח בצד שמאל
                    mr: 12 // מרווח גדול יותר בצד ימין
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
                    <TableContainer sx={{ 
                      height: 'fit-content', // גובה מותאם לתוכן בדיוק
                      boxSizing: 'border-box',
                      overflow: 'auto',
                      pb: 0,
                      pl: 0, pr: 2, // הקטנת מרווח שמאלי והגדלת מרווח ימני
                      '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px'
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
                                borderTopLeftRadius: 0, // ללא עיגול בפינה השמאלית העליונה
                                p: 1.5, // ריפוד מקורי
                                pl: 2, // ריפוד שמאלי מוקטן
                                pr: 0 // ללא ריפוד מימין
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
                                    width: '100px', // רוחב קבוע לכל עמודה
                                    minWidth: '100px', 
                                    maxWidth: '100px'
                                  }}
                                >
                                  {isToday && <HighlightedColumn />}
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      color: isFriday ? theme.palette.warning.dark : isToday ? theme.palette.primary.main : theme.palette.text.primary,
                                      mb: 0.5
                                    }}>
                                      {isFriday 
                                        ? <CircleIcon fontSize="small" sx={{ mr: 0.5, fontSize: 6, color: theme.palette.warning.main }} />
                                        : isToday 
                                          ? <BlinkingDot fontSize="small" sx={{ mr: 0.5, fontSize: 8, color: theme.palette.primary.main }} />
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
                                              ? theme.palette.primary.main 
                                              : theme.palette.text.primary,
                                          fontSize: '0.8rem' // גופן קטן יותר
                                        }}
                                      >
                                        {format(day, 'EEEE', { locale: he })}
                                      </Typography>
                                    </Box>
                                    <Typography 
                                      variant="caption" 
                                      component="div"
                                      sx={{
                                        fontWeight: isToday ? 600 : 400,
                                        padding: '2px 4px', // פחות ריווח
                                        borderRadius: 10,
                                        bgcolor: isToday ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                        fontSize: '0.8rem' // גופן קטן יותר
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
                                  height: '70px' // גובה קבוע קטן יותר לשורה
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
                                  const isBooked = bookingsForCell.length > 0;
                                  const isPast = day < new Date(new Date().setHours(0,0,0,0)); // תאריך בעבר
                                  const paymentStatus = isBooked ? bookingsForCell[0].paymentStatus : null;
                                  const isCurrentDay = isSameDay(day, new Date());
                                  
                                  // בדיקה אם ההזמנה היא חלק משהייה מרובת ימים
                                  let isMultiDay = false;
                                  let isFirstDay = false;
                                  let isLastDay = false;
                                  
                                  if (isBooked) {
                                    const multiDayInfo = isPartOfMultiDayStay(bookingsForCell[0], room._id, day);
                                    isMultiDay = multiDayInfo.isMultiDay;
                                    isFirstDay = multiDayInfo.isStart;
                                    isLastDay = multiDayInfo.isEnd;
                                  }
                                  
                                  return (
                                    <TableCell 
                                      key={`${room._id}-${index}`} 
                                      align="center"
                                      onClick={() => handleCellClick(room._id, day)}
                                      sx={{ 
                                        cursor: 'pointer',
                                        padding: '8px 6px', // ריווח מוקטן
                                        position: 'relative',
                                        bgcolor: getCellBgColor(isBooked, isPast, paymentStatus, isMultiDay),
                                        borderLeft: isMultiDay && !isFirstDay ? 0 : '1px solid rgba(224, 224, 224, 0.15)',
                                        borderRight: isMultiDay && !isLastDay ? 0 : '1px solid rgba(224, 224, 224, 0.15)',
                                        borderBottom: '1px solid rgba(224, 224, 224, 0.15)',
                                        '&:hover': {
                                          filter: 'brightness(0.95)',
                                          zIndex: 1
                                        },
                                        transition: 'all 0.2s ease',
                                        minHeight: '70px', // גובה אחיד מוקטן
                                        maxHeight: '70px',
                                        height: '70px',
                                        width: '100px', // רוחב קבוע
                                        minWidth: '100px',
                                        maxWidth: '100px',
                                        ...(isCurrentDay && {
                                          zIndex: 1, // רק להגדרת z-index, בלי מסגרת
                                        })
                                      }}
                                    >
                                    {isCurrentDay && <HighlightedColumn />}
                                    {getCellContent(room, day)}
                                  </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ height: 0, overflow: 'hidden' }}></Box> {/* חוסם רווחים מיותרים בתחתית */}
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
        
        {/* דיאלוג עריכת הזמנה - מעוצב יותר קומפקטי */}
        <Dialog 
          open={bookingDialog.open} 
          onClose={closeBookingDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 15px 50px rgba(0,0,0,0.15)',
            backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          pb: 1.5,
          pt: 1.5,
          bgcolor: alpha(theme.palette.background.paper, 0.5)
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  הזמנה #{bookingDialog.bookingData?.bookingNumber || ''}
              </Typography>
                <Button 
                  size="small" 
                  variant="contained" 
                  sx={{ 
                    ml: 2,
                    borderRadius: 4,
                    bgcolor: '#2196f3',
                    color: '#fff',
                    px: 2,
                    '&:hover': {
                      bgcolor: '#1976d2'
                    }
                  }}
                >
                  ממתין לתשלום
                </Button>
              </Box>
              {/* הסרת כפתור הוואטסאפ הישן */}
              <IconButton
                aria-label="סגור"
                onClick={closeBookingDialog}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      color: theme.palette.error.main
                    }
                  }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
        <DialogContent sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
            {bookingDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5 }}>
              <CircularProgress thickness={4} size={60} sx={{ color: theme.palette.primary.main }} />
              </Box>
            ) : bookingDialog.bookingData ? (
              <Grid container spacing={2}>
                {/* כפתורי פעולה מהירים */}
                <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap', 
                  mb: 2, 
                  justifyContent: 'flex-end' 
                }}>
                  <ActionButton
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CloseIcon />}
                      onClick={() => {
                      const updatedData = { ...bookingDialog.bookingData, paymentStatus: 'canceled' };
                        handleUpdateBooking(updatedData);
                      }}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 'medium',
                        border: '1px solid #f44336',
                        '&:hover': {
                          bgcolor: 'rgba(244,67,54,0.04)'
                        }
                      }}
                    >
                      ביטול הזמנה
                  </ActionButton>
                    
                  <ActionButton
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => {
                        const updatedData = { ...bookingDialog.bookingData, paymentStatus: 'paid' };
                        handleUpdateBooking(updatedData);
                      }}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 'medium',
                        border: '1px solid #2196f3',
                        color: '#2196f3',
                        '&:hover': {
                          bgcolor: 'rgba(33,150,243,0.04)'
                        }
                      }}
                    >
                      סמן כשולם
                  </ActionButton>
                  </Box>
                </Grid>
                
                {/* אזור עריכת מחירים */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      mb: 2,
                      bgcolor: alpha(theme.palette.primary.light, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}
                  >
                    <Grid container spacing={1}>
                      <Grid item xs={6} sm={3}>
                        <Box>
                        <Typography variant="caption" color="text.secondary">סה"כ לתשלום</Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold',
                          color: theme.palette.success.dark
                        }}>
                            ₪{bookingDialog.bookingData.totalPrice || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Box>
                        <Typography variant="caption" color="text.secondary">תאריכי שהייה</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {bookingDialog.bookingData.checkIn ? format(new Date(bookingDialog.bookingData.checkIn), 'dd/MM/yyyy') : ''} -<br />
                          {bookingDialog.bookingData.checkOut ? format(new Date(bookingDialog.bookingData.checkOut), 'dd/MM/yyyy') : ''}
                        </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Box>
                        <Typography variant="caption" color="text.secondary">מספר לילות</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {bookingDialog.bookingData.nights || 1}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Box>
                        <Typography variant="caption" color="text.secondary">מספר חדר</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {rooms.find(r => r._id === bookingDialog.bookingData.room)?.roomNumber || ''}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                
                {/* אזור עריכת מחירים */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      mb: 2
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ 
                      mb: 1.5, 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <MonetizationOnIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                      פרטי מחיר
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {/* אפשרות תייר - פטור ממע"מ */}
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={bookingDialog.bookingData?.isTourist || false}
                              onChange={(e) => handleBookingFormChange('isTourist', e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2">תייר (פטור ממע״מ)</Typography>
                              <Tooltip title="סימון זה יסיר את המע״מ מהחישוב עבור אורחים שאינם תושבי ישראל">
                                <InfoIcon fontSize="small" color="action" sx={{ opacity: 0.7 }} />
                              </Tooltip>
                            </Box>
                          }
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="מחיר ללילה (ללא מע״מ)"
                          size="small"
                          fullWidth
                          type="number"
                          value={bookingDialog.bookingData.pricePerNightNoVat || Math.round((bookingDialog.bookingData.pricePerNight / (1 + vatRate / 100)) * 100) / 100}
                          onChange={(e) => handleBookingFormChange('pricePerNightNoVat', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                          }}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="מחיר ללילה (כולל מע״מ)"
                          size="small"
                          fullWidth
                          type="number"
                          value={bookingDialog.bookingData.pricePerNight || bookingDialog.bookingData.totalPrice / (bookingDialog.bookingData.nights || 1)}
                          onChange={(e) => handleBookingFormChange('pricePerNight', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                          }}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="סה״כ מחיר להזמנה"
                          size="small"
                          fullWidth
                          type="number"
                          value={bookingDialog.bookingData.totalPrice || 0}
                          onChange={(e) => handleBookingFormChange('totalPrice', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                          }}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                
                {/* פרטי אורח ותשלום - סידור אופטימלי יותר */}
                <Grid item xs={12} container spacing={2}>
                {/* פרטי אורח */}
                <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        height: '100%'
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ 
                        mb: 1.5, 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <PersonIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                        פרטי אורח
                      </Typography>
                      
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                  <TextField
                    label="שם פרטי"
                            size="small"
                    fullWidth
                    defaultValue={bookingDialog.bookingData.guest?.firstName || ''}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={6}>
                  <TextField
                    label="שם משפחה"
                            size="small"
                    fullWidth
                    defaultValue={bookingDialog.bookingData.guest?.lastName || ''}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }}
                  />
                        </Grid>
                  
                        <Grid item xs={12}>
                  <TextField
                    label="דוא״ל"
                            size="small"
                    fullWidth
                    defaultValue={bookingDialog.bookingData.guest?.email || ''}
                    type="email"
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                  <TextField
                    label="טלפון"
                            size="small"
                    fullWidth
                    defaultValue={bookingDialog.bookingData.guest?.phone || ''}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }}
                            InputProps={{
                              endAdornment: bookingDialog.bookingData.guest?.phone ? (
                                <InputAdornment position="end">
                                  <Tooltip title="שלח הודעת וואטסאפ">
                                    <IconButton
                                      size="small"
                                      sx={{ 
                                        color: '#25D366',
                                        '&:hover': { 
                                          bgcolor: alpha('#25D366', 0.1)
                                        }
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // מנקה את מספר הטלפון מתווים שאינם ספרות
                                        const cleanPhone = bookingDialog.bookingData.guest.phone.replace(/\D/g, '');
                                        // מסיר את ה-0 מתחילת המספר אם יש ומוסיף קידומת ישראל
                                        const formattedPhone = cleanPhone.startsWith('0') ? `972${cleanPhone.substring(1)}` : cleanPhone;
                                        window.open(`https://wa.me/${formattedPhone}`, '_blank');
                                      }}
                                    >
                                      <WhatsAppIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </InputAdornment>
                              ) : null
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                </Grid>
                
                  {/* פרטי תשלום */}
                <Grid item xs={12} md={6}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        height: '100%'
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ 
                        mb: 2, 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: theme.palette.primary.main
                      }}>
                        פרטי תשלום <AttachMoneyIcon fontSize="small" />
                      </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                          <FormControl 
                            fullWidth 
                            size="small"
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }}
                          >
                            <InputLabel>אמצעי תשלום</InputLabel>
                            <Select
                              defaultValue={bookingDialog.bookingData.paymentMethod || ''}
                              label="אמצעי תשלום"
                            >
                              <MenuItem value="credit">כרטיס אשראי</MenuItem>
                              <MenuItem value="cash">מזומן</MenuItem>
                              <MenuItem value="mizrahi">העברה מזרחי</MenuItem>
                              <MenuItem value="poalim">העברה פועלים</MenuItem>
                              <MenuItem value="other">אחר</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <FormControl 
                            fullWidth 
                            size="small"
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }}
                          >
                            <InputLabel>מתחים לתשלום</InputLabel>
                            <Select
                              defaultValue={bookingDialog.bookingData.paymentStatus || 'pending'}
                              label="מתחים לתשלום"
                            >
                              <MenuItem value="pending">ממתין לתשלום</MenuItem>
                              <MenuItem value="partial">שולם חלקית</MenuItem>
                              <MenuItem value="paid">שולם</MenuItem>
                              <MenuItem value="canceled">בוטל</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" sx={{ 
                            mb: 1, 
                            mt: 1,
                            fontWeight: 500
                          }}>
                            פרטי כרטיס אשראי
                          </Typography>
                          
                      <TextField
                            label="מספר כרטיס"
                            size="small"
                        fullWidth
                            defaultValue={bookingDialog.bookingData.creditCard?.cardNumber || ''}
                            sx={{ 
                              mb: 2,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }}
                          />
                          
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <TextField
                                label="תוקף"
                                size="small"
                                fullWidth
                                placeholder="MM/YY"
                                defaultValue={formatCreditCardExpiry(bookingDialog.bookingData.creditCard)}
                                sx={{ 
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
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
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Paper>
                    </Grid>
                  </Grid>
                  
              {/* הערות */}
              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2
                  }}
                >
                  <Typography variant="subtitle1" sx={{ 
                    mb: 1.5, 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <InfoIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                    הערות
                  </Typography>
                  
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    placeholder="הוסף הערות להזמנה כאן..."
                    defaultValue={bookingDialog.bookingData.notes || ''}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography>לא נמצאו פרטי הזמנה</Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Button 
            onClick={closeBookingDialog} 
            color="inherit"
            size="small"
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 600,
              px: 2
            }}
          >
            סגירה
          </Button>
          <ActionButton 
            onClick={() => handleUpdateBooking(bookingDialog.bookingData)} 
            color="primary" 
            variant="contained"
            size="small"
            startIcon={<CheckIcon />}
          >
            שמירת שינויים
          </ActionButton>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג יצירת הזמנה חדשה */}
      <Dialog 
        open={newBookingDialog.open} 
        onClose={closeNewBookingDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          p: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.5)
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                הזמנה חדשה
                {newBookingDialog.roomId && rooms.find(r => r._id === newBookingDialog.roomId) && (
                  <Typography variant="body2" component="span" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                    חדר {rooms.find(r => r._id === newBookingDialog.roomId).roomNumber} | 
                    {newBookingDialog.date && <> {format(newBookingDialog.date, 'dd/MM/yyyy')}</>}
                  </Typography>
                )}
              </Typography>
            </Box>
            <IconButton
              aria-label="סגור"
              onClick={closeNewBookingDialog}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 2 }}>
          {newBookingDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
              <CircularProgress thickness={4} size={32} sx={{ color: theme.palette.primary.main }} />
            </Box>
          ) : (
                  <Grid container spacing={2}>
              {/* פרטי אורח */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>פרטי אורח</Typography>
              </Grid>
              
                    <Grid item xs={6}>
                      <TextField
                  label="שם פרטי"
                        fullWidth
                  size="small"
                  value={newBookingDialog.formData.firstName}
                  onChange={(e) => handleNewBookingFormChange('firstName', e.target.value)}
                      />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <TextField
                  label="שם משפחה"
                        fullWidth
                  size="small"
                  value={newBookingDialog.formData.lastName}
                  onChange={(e) => handleNewBookingFormChange('lastName', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="טלפון"
                  fullWidth
                  size="small"
                  value={newBookingDialog.formData.phone}
                  onChange={(e) => handleNewBookingFormChange('phone', e.target.value)}
                        InputProps={{
                    endAdornment: newBookingDialog.formData.phone ? (
                      <InputAdornment position="end">
                        <Tooltip title="שלח הודעת וואטסאפ">
                          <IconButton
                            size="small"
                            sx={{ 
                              color: '#25D366',
                              '&:hover': { 
                                bgcolor: alpha('#25D366', 0.1)
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // מנקה את מספר הטלפון מתווים שאינם ספרות
                              const cleanPhone = newBookingDialog.formData.phone.replace(/\D/g, '');
                              // מסיר את ה-0 מתחילת המספר אם יש ומוסיף קידומת ישראל
                              const formattedPhone = cleanPhone.startsWith('0') ? `972${cleanPhone.substring(1)}` : cleanPhone;
                              window.open(`https://wa.me/${formattedPhone}`, '_blank');
                            }}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ) : null
                        }}
                      />
                    </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="דוא״ל"
                  fullWidth
                  size="small"
                  type="email"
                  value={newBookingDialog.formData.email}
                  onChange={(e) => handleNewBookingFormChange('email', e.target.value)}
                />
                  </Grid>
                  
              {/* פרטי הזמנה */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1, mt: 1, fontWeight: 600 }}>פרטי הזמנה</Typography>
                    </Grid>
                    
              <Grid item xs={6}>
                <TextField
                  label="תאריך כניסה"
                  type="date"
                  fullWidth
                  size="small"
                  value={newBookingDialog.formData.checkIn}
                  onChange={(e) => handleNewBookingFormChange('checkIn', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="תאריך יציאה"
                  type="date"
                  fullWidth
                  size="small"
                  value={newBookingDialog.formData.checkOut}
                  onChange={(e) => handleNewBookingFormChange('checkOut', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                        <InputLabel>חדר</InputLabel>
                        <Select
                    value={newBookingDialog.formData.roomId}
                    onChange={(e) => handleNewBookingFormChange('roomId', e.target.value)}
                          label="חדר"
                        >
                          {rooms.map(room => (
                            <MenuItem key={room._id} value={room._id}>
                        חדר {room.roomNumber}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                </Grid>
                
              {/* שינוי הגריד ל-6 וקבלת 2 שדות מחיר */}
              <Grid item xs={4}>
                <TextField
                  label="מחיר ללילה (ללא מע״מ)"
                  fullWidth
                  size="small"
                  type="number"
                  value={newBookingDialog.formData.pricePerNightNoVat}
                  onChange={(e) => handleNewBookingFormChange('pricePerNightNoVat', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                  }}
                />
              </Grid>
                    
              <Grid item xs={4}>
                <TextField
                  label="מחיר ללילה (כולל מע״מ)"
                  fullWidth
                  size="small"
                  type="number"
                  value={newBookingDialog.formData.pricePerNight}
                  onChange={(e) => handleNewBookingFormChange('pricePerNight', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                  }}
                />
              </Grid>
                    
              <Grid item xs={4}>
                <TextField
                  label="סה״כ להזמנה"
                  fullWidth
                  size="small"
                  type="number"
                  value={newBookingDialog.formData.totalPrice}
                  onChange={(e) => handleNewBookingFormChange('totalPrice', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₪</InputAdornment>
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  מספר לילות: {newBookingDialog.formData.nights || '0'}
                </Typography>
              </Grid>
              
              {/* אפשרות תייר - פטור ממע"מ */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newBookingDialog.formData.isTourist || false}
                      onChange={(e) => handleNewBookingFormChange('isTourist', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2">תייר (פטור ממע״מ)</Typography>
                      <Tooltip title="סימון זה יסיר את המע״מ מהחישוב עבור אורחים שאינם תושבי ישראל">
                        <InfoIcon fontSize="small" color="action" sx={{ opacity: 0.7 }} />
                      </Tooltip>
                    </Box>
                  }
                />
              </Grid>
              
              {/* פרטי תשלום */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ 
                  mb: 1, 
                  mt: 1, 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: theme.palette.primary.main
                }}>
                  פרטי תשלום <AttachMoneyIcon fontSize="small" />
                </Typography>
              </Grid>
              
              {/* שני שדות בחירה: אמצעי תשלום ומתחים לתשלום */}
              <Grid item xs={6}>
                <FormControl 
                  fullWidth 
                  size="small"
                >
                  <InputLabel>אמצעי תשלום</InputLabel>
                  <Select
                    value={newBookingDialog.formData.paymentMethod || ''}
                    onChange={(e) => handleNewBookingFormChange('paymentMethod', e.target.value)}
                    label="אמצעי תשלום"
                  >
                    <MenuItem value="credit">כרטיס אשראי</MenuItem>
                    <MenuItem value="cash">מזומן</MenuItem>
                    <MenuItem value="bankTransfer">העברה בנקאית</MenuItem>
                    <MenuItem value="other">אחר</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6}>
                <FormControl 
                  fullWidth 
                  size="small"
                >
                  <InputLabel>מתחים לתשלום</InputLabel>
                  <Select
                    value={newBookingDialog.formData.paymentStatus || 'pending'}
                    onChange={(e) => handleNewBookingFormChange('paymentStatus', e.target.value)}
                    label="מתחים לתשלום"
                  >
                    <MenuItem value="pending">ממתין לתשלום</MenuItem>
                    <MenuItem value="partial">שולם חלקית</MenuItem>
                    <MenuItem value="paid">שולם</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* פרטי כרטיס אשראי */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                      <TextField
                  label="מספר כרטיס"
                        fullWidth
                  size="small"
                  value={newBookingDialog.formData.creditCard?.cardNumber || ''}
                  onChange={(e) => handleNewBookingFormChange('creditCard.cardNumber', e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                      />
                    </Grid>
                
              <Grid item xs={6}>
                <TextField
                  label="תוקף"
                  fullWidth
                  size="small"
                  placeholder="MM/YY"
                  value={newBookingDialog.formData.creditCard?.expiry || ''}
                  onChange={(e) => handleNewBookingFormChange('creditCard.expiry', e.target.value)}
                      />
                    </Grid>
                    
              <Grid item xs={6}>
                      <TextField
                        label="CVV"
                        fullWidth
                  size="small"
                  placeholder="XXX"
                  value={newBookingDialog.formData.creditCard?.cvv || ''}
                  onChange={(e) => handleNewBookingFormChange('creditCard.cvv', e.target.value)}
                />
                </Grid>
                
                {/* הערות */}
                <Grid item xs={12}>
                  <TextField
                  label="הערות"
                    fullWidth
                  size="small"
                    multiline
                  rows={2}
                  placeholder="הוסף הערות להזמנה כאן..."
                  value={newBookingDialog.formData.notes}
                  onChange={(e) => handleNewBookingFormChange('notes', e.target.value)}
                  />
                </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Button 
            onClick={closeNewBookingDialog} 
            color="inherit"
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 600,
              px: 3
            }}
          >
            סגירה
                    </Button>
                    <Button 
            onClick={handleSaveNewBooking} 
                      color="primary" 
                      variant="contained"
            disabled={newBookingDialog.loading}
            startIcon={newBookingDialog.loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ 
              borderRadius: 2, 
              bgcolor: '#2196f3',
              color: '#fff',
              px: 3,
              '&:hover': {
                bgcolor: '#1976d2'
              }
            }}
          >
            {newBookingDialog.loading ? 'שומר...' : 'שמירת שינויים'}
                    </Button>
        </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default BookingListView; 
