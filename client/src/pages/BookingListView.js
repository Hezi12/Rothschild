import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import axios from 'axios';
import { format, addDays, addMonths, subMonths, startOfMonth, endOfMonth, isSameDay, getDay } from 'date-fns';
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
  Divider,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Stack,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarMonth as CalendarMonthIcon,
  Hotel as HotelIcon,
  Person as PersonIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// קומפוננטה ראשית - תצוגת רשימת הזמנות מודרנית
const BookingListView = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const { isAdmin } = useContext(AuthContext);

  // סטייט לשמירת נתונים
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysInView, setDaysInView] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
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
  
  // טווח ימים להצגה
  const daysToShow = isMobile ? 3 : isTablet ? 7 : 14;

  // יצירת טווח ימים להצגה
  useEffect(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < daysToShow; i++) {
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
        setRooms(response.data.data);
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
  
  // קבלת צבע רקע לפי סטטוס
  const getCellBgColor = (isBooked, isPast, paymentStatus, isCheckInDay, isCheckOutDay) => {
    if (isPast) {
      return '#f5f5f5'; // אפור לתאריך שעבר
    } else if (isBooked) {
      // שיפור - צבעים שונים לצ'ק-אין, צ'ק-אאוט, ושהייה רגילה
      if (isCheckInDay) {
        // הדגשה קלה ליום הצ'ק-אין
        return paymentStatus === 'paid' ? '#e3efff' : '#ebf7f0';
      } else if (isCheckOutDay) {
        // הדגשה קלה ליום הצ'ק-אאוט
        return paymentStatus === 'paid' ? '#e3efff' : '#ebf7f0';
      } else {
        // ימי שהייה רגילים בהזמנה
        return paymentStatus === 'paid' ? '#e6f7ff' : '#d5f2e3';
      }
    } else {
      return '#e8f5e9'; // ירוק לפנוי
    }
  };
  
  // פונקציה לקבלת רכיב תא בטבלה
  const getCellContent = (room, date) => {
    const roomBookings = getBookingsForRoomAndDate(room._id, date);
    const isBooked = roomBookings.length > 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(date);
    cellDate.setHours(0, 0, 0, 0);
    const isPast = cellDate < today;
    
    // השתמש בפונקציה החדשה לקבלת מחיר דינמי או לפי יום בשבוע
    let price = getPriceForRoomAndDate(room._id, date);
    
    // בדיקה אם זה היום הראשון או האחרון של שהות (צ'ק-אין או צק-אאוט)
    let isCheckInDay = false;
    let isCheckOutDay = false;
    let bookingId = '';
    let nights = 0;
    
    if (isBooked) {
      const booking = roomBookings[0];
      bookingId = booking._id;
      nights = booking.nights || 0;
      
      // המר תאריכים לפורמט ISO לשם השוואה
      const checkInDate = new Date(booking.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      
      const checkOutDate = new Date(booking.checkOut);
      checkOutDate.setHours(0, 0, 0, 0);
      
      const dateToCheck = new Date(date);
      dateToCheck.setHours(0, 0, 0, 0);
      
      isCheckInDay = dateToCheck.getTime() === checkInDate.getTime();
      isCheckOutDay = dateToCheck.getTime() === checkOutDate.getTime();
    }
    
    // צבעי הרקע ייקבעו לפי הסטטוס, כולל צ'ק-אין וצ'ק-אאוט
    let paymentStatus = isBooked ? roomBookings[0].paymentStatus : '';
    let bgColor = getCellBgColor(isBooked, isPast, paymentStatus, isCheckInDay, isCheckOutDay);
    
    // קביעת צבע הטקסט
    let textColor = isPast ? '#9e9e9e' : (isBooked ? '#333333' : '#2e7d32');
    
    // צבעים של גבולות הצ'ק-אין וצ'ק-אאוט
    const checkInColor = '#1976d2'; // כחול בולט לצ'ק-אין
    const checkOutColor = '#f50057'; // אדום-ורוד לצ'ק-אאוט
    
    // קישור בין תאים שמהווים את אותה ההזמנה
    const getConnectorStyle = () => {
      // רק אם זה חלק מהזמנה והוא לא צ'ק-אאוט (כי אין צורך בחיבור לימין)
      if (isBooked && !isCheckOutDay) {
        return {
          content: '""',
          position: 'absolute',
          right: '-2px', // חפיפה קלה על הגבול
          top: '50%',
          width: '4px',
          height: '30%',
          transform: 'translateY(-50%)',
          backgroundColor: paymentStatus === 'paid' ? '#a2d2ff' : '#a5d8bf',
          zIndex: 2
        };
      }
      return {};
    };
    
    return (
      <Box 
        sx={{ 
          p: 1,
          height: '100%',
          minHeight: '80px',
          bgcolor: bgColor,
          borderRadius: isBooked ? 0 : 1, // ביטול העיגול בפינות עבור תאים מוזמנים
          // גבולות דקים בין תאים
          borderTop: '1px solid rgba(0,0,0,0.05)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          // גבולות חזקים וצבעוניים לצ'ק-אין וצ'ק-אאוט
          borderLeft: isBooked ? (
            isCheckInDay ? `6px solid ${checkInColor}` : '1px solid rgba(0,0,0,0.05)'
          ) : '1px solid rgba(0,0,0,0.05)',
          borderRight: isBooked ? (
            isCheckOutDay ? `6px solid ${checkOutColor}` : '1px solid rgba(0,0,0,0.05)'
          ) : '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.2s',
          position: 'relative',
          boxShadow: isBooked ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
            zIndex: 2,
            cursor: isBooked ? 'pointer' : 'default'
          },
          // הוספת רקע צבעוני לראש התא לסימון צ'ק-אין וצ'ק-אאוט
          '&::before': isBooked && (isCheckInDay || isCheckOutDay) ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: isCheckInDay ? checkInColor : checkOutColor
          } : {},
          // הוספת קו תחתון צבעוני בתחתית התא לסימון צ'ק-אין וצ'ק-אאוט
          '&::after': isBooked && (isCheckInDay || isCheckOutDay) ? {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: isCheckInDay ? checkInColor : checkOutColor
          } : {},
          // קישור ויזואלי בין תאים של אותה הזמנה
          '.connector': getConnectorStyle()
        }}
        onClick={() => isBooked && handleViewBooking(roomBookings[0]._id)}
        data-booking-id={bookingId} // להוספת אפשרות זיהוי הזמנות קשורות
      >
        {/* קישור ויזואלי לתא הבא */}
        {isBooked && !isCheckOutDay && <div className="connector" />}
        
        {isBooked ? (
          // כאשר יש הזמנה - הצג מידע משופר עם יותר דגש על ימי צ'ק-אין וצ'ק-אאוט
          <Box sx={{ 
            width: '100%', 
            textAlign: 'center',
            position: 'relative',
            p: 1
          }}>
            {/* סימון צ'ק-אין */}
            {isCheckInDay && (
              <Box sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: checkInColor,
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: 1
              }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.65rem'
                  }}
                >
                  IN
                </Typography>
              </Box>
            )}
            
            {/* שם האורח */}
            <Typography 
              variant="body2" 
              component="div" 
              sx={{ 
                fontWeight: 'bold', 
                color: textColor, 
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                pt: isCheckInDay || isCheckOutDay ? 1 : 0
              }}
            >
              {roomBookings[0].guest && roomBookings[0].guest.firstName ? 
                `${roomBookings[0].guest.firstName} ${roomBookings[0].guest.lastName || ''}` : 
                (roomBookings[0].guest && roomBookings[0].guest.name) || 'אורח'}
            </Typography>
            
            {/* מספר לילות אם זה יום צ'ק-אין */}
            {isCheckInDay && nights > 0 && (
              <Typography 
                variant="caption" 
                component="div" 
                sx={{ 
                  color: 'text.secondary',
                  mt: 0.5,
                  fontSize: '0.7rem',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  borderRadius: '10px',
                  padding: '0 4px',
                  display: 'inline-block'
                }}
              >
                {nights} {nights === 1 ? 'לילה' : 'לילות'}
              </Typography>
            )}
            
            {/* סימון צ'ק-אאוט */}
            {isCheckOutDay && (
              <Box sx={{
                position: 'absolute',
                top: -8,
                left: -8,
                backgroundColor: checkOutColor,
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: 1
              }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.65rem'
                  }}
                >
                  OUT
                </Typography>
              </Box>
            )}
            
          </Box>
        ) : isPast ? (
          // תאריך שעבר
          <Typography variant="body2" component="div" sx={{ color: textColor, opacity: 0.7 }}>
            עבר
          </Typography>
        ) : (
          // תא פנוי - הצג מחיר בעיצוב משופר
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.5 }}>
              מחיר ללילה
            </Typography>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 'bold', 
                color: textColor,
                background: 'linear-gradient(45deg, #2e7d32, #43a047)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              ₪{price}
            </Typography>
          </Box>
        )}
        
        {isAdmin() && (
          <Box sx={{ 
            position: 'absolute', 
            bottom: 2, 
            right: 2, 
            display: 'flex', 
            opacity: 0,
            transition: 'opacity 0.2s',
            '.MuiBox-root:hover > &': {
              opacity: 1
            }
          }}>
            {!isBooked && (
              <>
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePriceDialogOpen(room._id, date, price);
                  }}
                  sx={{ 
                    p: 0.5,
                    background: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.95)'
                    }
                  }}
                >
                  <AttachMoneyIcon fontSize="small" />
                </IconButton>
                
                <IconButton 
                  size="small" 
                  color="success" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddBooking(room._id, date);
                  }}
                  sx={{ 
                    p: 0.5, 
                    ml: 0.5,
                    background: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.95)'
                    }
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        )}
      </Box>
    );
  };
  
  // פונקציה לפתיחת דיאלוג עריכת מחיר
  const handlePriceDialogOpen = (roomId, date, currentPrice) => {
    setPriceDialog({
      open: true,
      roomId,
      date,
      price: currentPrice
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
        const bookingData = response.data.data;
        console.log('נטענו פרטי הזמנה:', bookingData);
        console.log('פרטי כרטיס אשראי:', bookingData.creditCard);
        
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
      open: false,
      bookingId: null,
      bookingData: null,
      loading: false
    });
  };
  
  // עדכון פרטי הזמנה
  const handleUpdateBooking = async (updatedData) => {
    try {
      const { bookingId } = bookingDialog;
      
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`, updatedData, {
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
    // ניווט לדף יצירת הזמנה חדשה עם פרמטרים
    // היסטוריה.push(`/dashboard/bookings/new?room=${roomId}&date=${format(date, 'yyyy-MM-dd')}`);
    console.log(`הוספת הזמנה חדשה לחדר ${roomId} בתאריך ${format(date, 'yyyy-MM-dd')}`);
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
    
    for (let i = 0; i < daysToShow; i++) {
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
    
    // השארת 4 הספרות האחרונות גלויות והחלפת השאר בכוכביות
    if (cardNumber.length > 4) {
      return '*'.repeat(cardNumber.length - 4) + cardNumber.slice(-4);
    }
    
    return cardNumber;
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
  
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 0,
          mb: 2,
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            p: 2,
            color: 'white',
            borderBottom: '1px solid rgba(0,0,0,0.08)'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Typography 
                variant="h5" 
                component="h1" 
                sx={{ 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <CalendarMonthIcon sx={{ mr: 1 }} />
                לוח זמינות וניהול הזמנות
              </Typography>
            </Grid>
            
            <Grid item sx={{ flexGrow: 1 }} />
            
            <Grid item>
              <Button 
                variant="contained" 
                disableElevation
                startIcon={<TodayIcon />}
                onClick={handleToday}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)'
                  }
                }}
              >
                היום
              </Button>
            </Grid>
            
            <Grid item>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 1,
                px: 1
              }}>
                <IconButton 
                  onClick={showPrevDays}
                  sx={{ color: 'white' }}
                >
                  <ChevronRightIcon />
                </IconButton>
                
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mx: 1, 
                    minWidth: '180px', 
                    textAlign: 'center',
                    fontWeight: 'medium'
                  }}
                >
                  {daysInView.length > 0 
                    ? `${format(daysInView[0], 'dd/MM/yyyy')} - ${format(daysInView[daysInView.length - 1], 'dd/MM/yyyy')}` 
                    : 'טוען...'}
                </Typography>
                
                <IconButton 
                  onClick={showNextDays}
                  sx={{ color: 'white' }}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </Box>
            </Grid>
            
            <Grid item>
              <Button 
                variant="contained" 
                disableElevation
                startIcon={<AddIcon />}
                onClick={() => handleAddBooking(null, new Date())}
                sx={{
                  backgroundColor: '#2e7d32',
                  '&:hover': {
                    backgroundColor: '#1b5e20'
                  }
                }}
              >
                הזמנה חדשה
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ 
              mb: 2,
              '& .MuiTab-root': {
                fontWeight: 'medium',
                py: 1.5
              },
              '& .Mui-selected': {
                fontWeight: 'bold'
              }
            }}
          >
            <Tab 
              label="זמינות חדרים" 
              icon={<HotelIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="הזמנות" 
              icon={<CalendarMonthIcon />} 
              iconPosition="start" 
            />
          </Tabs>
          
          {activeTab === 0 && (
            <>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              ) : (
                <TableContainer 
                  component={Paper} 
                  variant="outlined" 
                  sx={{ 
                    maxHeight: 'calc(100vh - 280px)', 
                    overflow: 'auto',
                    borderRadius: 0,
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                      height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#bbbbbb',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#888888',
                    }
                  }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          fontWeight: 'bold', 
                          minWidth: '150px',
                          background: '#f8f9fa',
                          position: 'sticky',
                          left: 0,
                          top: 0,
                          zIndex: 3,
                          borderBottom: '2px solid #e0e0e0'
                        }}>חדר</TableCell>
                        
                        {daysInView.map((day, index) => {
                          const isToday = isSameDay(day, new Date());
                          const dayName = format(day, 'EEEE', { locale: he });
                          const dayNum = format(day, 'dd');
                          const monthNum = format(day, 'MM');
                          
                          return (
                            <TableCell 
                              key={index} 
                              align="center" 
                              sx={{ 
                                minWidth: '120px',
                                bgcolor: isToday ? '#e3f2fd' : '#f8f9fa',
                                fontWeight: isToday ? 'bold' : 'normal',
                                padding: '8px 4px',
                                borderBottom: '2px solid #e0e0e0'
                              }}
                            >
                              <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                              }}>
                                <Typography 
                                  variant="caption" 
                                  component="div" 
                                  sx={{ 
                                    color: 'text.secondary',
                                    fontWeight: 'normal'
                                  }}
                                >
                                  {dayName}
                                </Typography>
                                <Box 
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative'
                                  }}
                                >
                                  <Typography 
                                    variant="h6" 
                                    component="div" 
                                    sx={{ 
                                      fontWeight: isToday ? 'bold' : 'normal',
                                      color: isToday ? 'primary.main' : 'text.primary'
                                    }}
                                  >
                                    {dayNum}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    component="div"
                                    sx={{
                                      position: 'absolute',
                                      right: -12,
                                      top: 0,
                                      color: 'text.secondary',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {monthNum}/
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </TableHead>
                    
                    <TableBody>
                      {rooms.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={daysInView.length + 1} align="center">
                            <Typography variant="subtitle1">אין חדרים להצגה</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        rooms.map(room => (
                          <TableRow key={room._id} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}>
                            <TableCell 
                              component="th" 
                              scope="row" 
                              sx={{ 
                                fontWeight: 'medium',
                                position: 'sticky',
                                left: 0,
                                bgcolor: 'background.paper',
                                zIndex: 1,
                                borderLeft: '6px solid',
                                borderLeftColor: room.type === 'standard' ? 'primary.main' : 
                                                room.type === 'deluxe' ? 'secondary.main' : 
                                                room.type === 'suite' ? 'success.main' : 
                                                room.type === 'simple' ? 'info.main' : 
                                                room.type === 'simple_with_balcony' ? 'warning.main' :
                                                room.type === 'standard_with_balcony' ? 'warning.light' :
                                                'warning.main',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                p: 1 // פדינג קטן יותר
                              }}
                            >
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                justifyContent: 'space-between' 
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <HotelIcon sx={{ 
                                    mr: 1, 
                                    color: room.type === 'standard' ? 'primary.main' : 
                                          room.type === 'deluxe' ? 'secondary.main' : 
                                          room.type === 'suite' ? 'success.main' : 
                                          room.type === 'simple' ? 'info.main' : 
                                          room.type === 'simple_with_balcony' ? 'warning.main' :
                                          room.type === 'standard_with_balcony' ? 'warning.light' :
                                          'warning.main'
                                  }} />
                                  <Box>
                                    <Typography 
                                      variant="subtitle2" 
                                      component="div" 
                                      sx={{ 
                                        fontWeight: 'bold', 
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                    >
                                      {room.internalName || `חדר ${room.roomNumber}`}
                                    </Typography>
                                    
                                    {/* הצגת סמל קטן אם יש מרפסת */}
                                    {(room.type === 'simple_with_balcony' || room.type === 'standard_with_balcony') && (
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          fontSize: '0.65rem', 
                                          color: 'text.secondary',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <span style={{ marginRight: '2px' }}>⊙</span> עם מרפסת
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                                
                                {/* מספר החדר בצד שמאל */}
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                    color: 'text.secondary',
                                    borderRadius: '12px',
                                    px: 1,
                                    py: 0.2,
                                    fontWeight: 'medium',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {room.roomNumber}
                                </Typography>
                              </Box>
                            </TableCell>
                            
                            {daysInView.map((day, index) => (
                              <TableCell key={index} sx={{ p: 1 }}>
                                {getCellContent(room, day)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
          
          {activeTab === 1 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">רשימת הזמנות - לשונית בפיתוח</Typography>
              <Typography variant="body2">
                לשונית זו תציג את כל ההזמנות בתצוגת רשימה מסורתית יותר.
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* דיאלוג עדכון מחיר */}
        <Dialog 
          open={priceDialog.open} 
          onClose={handlePriceDialogClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: '350px'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            color: 'white',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center'
          }}>
            <AttachMoneyIcon sx={{ mr: 1 }} />
            עדכון מחיר
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <HotelIcon sx={{ mr: 1, fontSize: '1rem', color: 'primary.main' }} />
                חדר: {rooms.find(r => r._id === priceDialog.roomId)?.internalName || 'טוען...'}
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <TodayIcon sx={{ mr: 1, fontSize: '1rem', color: 'primary.main' }} />
                תאריך: {priceDialog.date ? format(priceDialog.date, 'dd/MM/yyyy') : 'טוען...'}
              </Typography>
              
              <TextField
                label="מחיר חדש"
                type="number"
                fullWidth
                variant="outlined"
                value={priceDialog.price}
                onChange={(e) => setPriceDialog({...priceDialog, price: e.target.value})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
                sx={{ mt: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={handlePriceDialogClose}
              color="inherit"
              sx={{ borderRadius: 1 }}
            >
              ביטול
            </Button>
            <Button 
              onClick={handleSavePrice} 
              variant="contained" 
              disableElevation
              sx={{ borderRadius: 1 }}
            >
              שמירה
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* דיאלוג ערטי הזמנה */}
        <Dialog 
          open={bookingDialog.open} 
          onClose={closeBookingDialog}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            color: 'white',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarMonthIcon sx={{ mr: 1 }} />
              פרטי הזמנה
            </Box>
            <IconButton 
              onClick={closeBookingDialog} 
              size="small"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 3 }}>
            {bookingDialog.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : bookingDialog.bookingData ? (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        height: '100%',
                        borderRadius: 1,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                        פרטי אורח
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="שם פרטי"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={bookingDialog.bookingData.guest?.firstName || ''}
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="שם משפחה"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={bookingDialog.bookingData.guest?.lastName || ''}
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="אימייל"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={bookingDialog.bookingData.guest?.email || ''}
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="טלפון"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={bookingDialog.bookingData.guest?.phone || ''}
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        height: '100%',
                        borderRadius: 1,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                        פרטי הזמנה
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="חדר"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={bookingDialog.bookingData.room?.internalName || bookingDialog.bookingData.room?.roomNumber || ''}
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="מספר לילות"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={bookingDialog.bookingData.nights || ''}
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="צ'ק-אין"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={bookingDialog.bookingData.checkIn ? format(new Date(bookingDialog.bookingData.checkIn), 'dd/MM/yyyy') : ''}
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="צ'ק-אאוט"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={bookingDialog.bookingData.checkOut ? format(new Date(bookingDialog.bookingData.checkOut), 'dd/MM/yyyy') : ''}
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2,
                        borderRadius: 1,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                        פרטי תשלום
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            label="סטטוס תשלום"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={
                              bookingDialog.bookingData.paymentStatus === 'paid' ? 'שולם' :
                              bookingDialog.bookingData.paymentStatus === 'partial' ? 'חלקי' :
                              bookingDialog.bookingData.paymentStatus === 'pending' ? 'ממתין' : 
                              'לא ידוע'
                            }
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            label="אמצעי תשלום"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={
                              bookingDialog.bookingData.paymentMethod === 'credit' ? 'כרטיס אשראי' :
                              bookingDialog.bookingData.paymentMethod === 'cash' ? 'מזומן' :
                              bookingDialog.bookingData.paymentMethod === 'transfer' ? 'העברה בנקאית' : 
                              'לא ידוע'
                            }
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            label="מחיר ללילה"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={`₪${bookingDialog.bookingData.pricePerNight || 0}`}
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            label="סה״כ"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={`₪${bookingDialog.bookingData.totalPrice || 0}`}
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Typography variant="body1">לא נמצאו נתונים להזמנה</Typography>
            )}
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={closeBookingDialog} 
              color="inherit"
              sx={{ borderRadius: 1 }}
            >
              סגירה
            </Button>
            {bookingDialog.bookingData && (
              <Button 
                variant="contained" 
                disableElevation
                sx={{ borderRadius: 1 }}
                onClick={() => {/* פתיחת דף עריכת הזמנה */}}
              >
                עריכת הזמנה
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default BookingListView; 