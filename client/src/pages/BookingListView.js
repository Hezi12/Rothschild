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
  Tabs
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
  const getCellBgColor = (isBooked, isPast, paymentStatus) => {
    if (isPast) {
      return '#f5f5f5'; // אפור לתאריך שעבר
    } else if (isBooked) {
      // שינוי: צבע לא אדום עבור חדרים מוזמנים
      if (paymentStatus === 'paid') {
        return '#e6f7ff'; // כחול בהיר במקום צהוב
      } else {
        return '#d5f2e3'; // ירוק בהיר במקום אדום
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
    
    // צבע הרקע משתנה לפי סטטוס ההזמנה
    let paymentStatus = isBooked ? roomBookings[0].paymentStatus : '';
    let bgColor = getCellBgColor(isBooked, isPast, paymentStatus);
    
    // קביעת צבע הטקסט
    let textColor = isPast ? '#9e9e9e' : (isBooked ? '#333333' : '#2e7d32');
    
    return (
      <Box 
        sx={{ 
          p: 1,
          height: '100%',
          minHeight: '80px',
          bgcolor: bgColor,
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transform: 'scale(1.02)',
            zIndex: 2,
            cursor: isBooked ? 'pointer' : 'default'
          },
          position: 'relative'
        }}
        onClick={() => isBooked && handleViewBooking(roomBookings[0]._id)}
      >
        {isBooked ? (
          // כאשר יש הזמנה - הצג רק את שם האורח
          <Typography variant="body1" component="div" sx={{ fontWeight: 'bold', color: textColor, textAlign: 'center' }}>
            {roomBookings[0].guest && roomBookings[0].guest.firstName ? 
              `${roomBookings[0].guest.firstName} ${roomBookings[0].guest.lastName || ''}` : 
              (roomBookings[0].guest && roomBookings[0].guest.name) || 'אורח'}
          </Typography>
        ) : isPast ? (
          // תאריך שעבר
          <Typography variant="body2" component="div" sx={{ color: textColor }}>
            עבר
          </Typography>
        ) : (
          // תא פנוי - הצג מחיר
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: textColor }}>
            ₪{price}
          </Typography>
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
                  sx={{ p: 0.5 }}
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
                  sx={{ p: 0.5 }}
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
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item>
            <Typography variant="h5" component="h1">
              לוח זמינות וניהול הזמנות
            </Typography>
          </Grid>
          
          <Grid item sx={{ flexGrow: 1 }} />
          
          <Grid item>
            <Button 
              variant="outlined" 
              startIcon={<TodayIcon />}
              onClick={handleToday}
            >
              היום
            </Button>
          </Grid>
          
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={showPrevDays}>
                <ChevronRightIcon />
              </IconButton>
              
              <Typography variant="subtitle1" sx={{ mx: 1, minWidth: '180px', textAlign: 'center' }}>
                {daysInView.length > 0 
                  ? `${format(daysInView[0], 'dd/MM/yyyy')} - ${format(daysInView[daysInView.length - 1], 'dd/MM/yyyy')}` 
                  : 'טוען...'}
              </Typography>
              
              <IconButton onClick={showNextDays}>
                <ChevronLeftIcon />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => handleAddBooking(null, new Date())}
            >
              הזמנה חדשה
            </Button>
          </Grid>
        </Grid>
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="זמינות חדרים" icon={<HotelIcon />} iconPosition="start" />
          <Tab label="הזמנות" icon={<CalendarMonthIcon />} iconPosition="start" />
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
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '150px' }}>חדר</TableCell>
                      
                      {daysInView.map((day, index) => {
                        const isToday = isSameDay(day, new Date());
                        return (
                          <TableCell key={index} align="center" sx={{ 
                            minWidth: '120px',
                            bgcolor: isToday ? '#e3f2fd' : 'inherit',
                            fontWeight: isToday ? 'bold' : 'normal'
                          }}>
                            <Typography variant="subtitle2" component="div">
                              {format(day, 'EEEE', { locale: he })}
                            </Typography>
                            <Typography variant="body2" component="div">
                              {format(day, 'dd/MM/yyyy')}
                            </Typography>
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
                        <TableRow key={room._id}>
                          <TableCell 
                            component="th" 
                            scope="row" 
                            sx={{ 
                              fontWeight: 'bold',
                              position: 'sticky',
                              left: 0,
                              bgcolor: 'background.paper',
                              zIndex: 1
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <HotelIcon sx={{ mr: 1, color: 'primary.main' }} />
                              <Box>
                                <Typography variant="subtitle2" component="div">
                                  {room.internalName || `חדר ${room.roomNumber}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {room.type === 'standard' ? 'סטנדרט' : 
                                   room.type === 'deluxe' ? 'דלוקס' : 
                                   room.type === 'suite' ? 'סוויטה' : 
                                   room.type === 'simple' ? 'פשוט' : 
                                   room.type === 'simple_with_balcony' ? 'פשוט עם מרפסת' : 
                                   room.type === 'standard_with_balcony' ? 'סטנדרט עם מרפסת' : 
                                   room.type}
                                </Typography>
                              </Box>
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
      </Paper>
      
      {/* דיאלוג עדכון מחיר */}
      <Dialog open={priceDialog.open} onClose={handlePriceDialogClose}>
        <DialogTitle>עדכון מחיר</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              חדר: {rooms.find(r => r._id === priceDialog.roomId)?.internalName || 'טוען...'}
            </Typography>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              תאריך: {priceDialog.date ? format(priceDialog.date, 'dd/MM/yyyy') : 'טוען...'}
            </Typography>
            <TextField
              label="מחיר חדש"
              type="number"
              fullWidth
              value={priceDialog.price}
              onChange={(e) => setPriceDialog({ ...priceDialog, price: Number(e.target.value) })}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₪</Typography>
              }}
              sx={{ mt: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePriceDialogClose} color="inherit">ביטול</Button>
          <Button onClick={handleSavePrice} color="primary" variant="contained">
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג עריכת הזמנה */}
      <Dialog 
        open={bookingDialog.open} 
        onClose={closeBookingDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              עריכת הזמנה #{bookingDialog.bookingData?.bookingNumber || '251003'}
            </Typography>
            <IconButton
              aria-label="סגור"
              onClick={closeBookingDialog}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {bookingDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : bookingDialog.bookingData ? (
            <Grid container spacing={2}>
              {/* כפתורי פעולה מהירים */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => {
                      const updatedData = { ...bookingDialog.bookingData, paymentStatus: 'cancelled' };
                      handleUpdateBooking(updatedData);
                    }}
                    sx={{ fontWeight: 'bold' }}
                  >
                    ביטול הזמנה
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<CheckIcon />}
                    onClick={() => {
                      const updatedData = { ...bookingDialog.bookingData, paymentStatus: 'paid' };
                      handleUpdateBooking(updatedData);
                    }}
                    sx={{ fontWeight: 'bold' }}
                  >
                    סמן כשולם
                  </Button>
                </Box>
              </Grid>
              
              {/* חלק עליון - פרטי הזמנה ראשיים */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">מחיר בסך הכל</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          ₪{bookingDialog.bookingData.totalPrice || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">סטטוס</Typography>
                        <Box>
                          <Chip 
                            size="small" 
                            color={bookingDialog.bookingData.paymentStatus === 'paid' ? "success" : "warning"} 
                            label={bookingDialog.bookingData.paymentStatus === 'paid' ? "שולם" : "לא שולם"} 
                          />
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">תאריך צ'ק אין</Typography>
                        <Typography variant="body1">
                          {bookingDialog.bookingData.checkIn ? format(new Date(bookingDialog.bookingData.checkIn), 'dd/MM/yyyy') : '---'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">תאריך צ'ק אאוט</Typography>
                        <Typography variant="body1">
                          {bookingDialog.bookingData.checkOut ? format(new Date(bookingDialog.bookingData.checkOut), 'dd/MM/yyyy') : '---'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              {/* פרטי אורח */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>פרטי אורח</Typography>
                
                <TextField
                  label="שם פרטי"
                  fullWidth
                  margin="normal"
                  defaultValue={bookingDialog.bookingData.guest?.firstName || ''}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                />
                
                <TextField
                  label="שם משפחה"
                  fullWidth
                  margin="normal"
                  defaultValue={bookingDialog.bookingData.guest?.lastName || ''}
                />
                
                <TextField
                  label="דוא״ל"
                  fullWidth
                  margin="normal"
                  defaultValue={bookingDialog.bookingData.guest?.email || ''}
                  type="email"
                  InputProps={{
                    startAdornment: <Box sx={{ color: 'text.secondary', mr: 1 }}>@</Box>
                  }}
                />
                
                <TextField
                  label="טלפון"
                  fullWidth
                  margin="normal"
                  defaultValue={bookingDialog.bookingData.guest?.phone || ''}
                />
              </Grid>
              
              {/* פרטי הזמנה */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>פרטי הזמנה</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="תאריך צ'ק אין"
                      type="date"
                      fullWidth
                      margin="normal"
                      defaultValue={bookingDialog.bookingData.checkIn ? format(new Date(bookingDialog.bookingData.checkIn), 'yyyy-MM-dd') : ''}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ 
                        max: bookingDialog.bookingData.checkOut ? format(new Date(bookingDialog.bookingData.checkOut), 'yyyy-MM-dd') : '' 
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      label="תאריך צ'ק אאוט"
                      type="date"
                      fullWidth
                      margin="normal"
                      defaultValue={bookingDialog.bookingData.checkOut ? format(new Date(bookingDialog.bookingData.checkOut), 'yyyy-MM-dd') : ''}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ 
                        min: bookingDialog.bookingData.checkIn ? format(new Date(bookingDialog.bookingData.checkIn), 'yyyy-MM-dd') : '' 
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="לילות"
                      type="number"
                      fullWidth
                      margin="normal"
                      defaultValue={bookingDialog.bookingData.nights || 1}
                      InputProps={{ 
                        readOnly: true,
                        startAdornment: <Typography sx={{ mr: 1 }}>לילות:</Typography>
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      label="מחיר כולל"
                      fullWidth
                      margin="normal"
                      defaultValue={bookingDialog.bookingData.totalPrice || 0}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>₪</Typography>
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>סטטוס תשלום</InputLabel>
                      <Select
                        defaultValue={bookingDialog.bookingData.paymentStatus || 'pending'}
                        label="סטטוס תשלום"
                      >
                        <MenuItem value="pending">ממתין לתשלום</MenuItem>
                        <MenuItem value="paid">שולם</MenuItem>
                        <MenuItem value="cancelled">בוטל</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>חדר</InputLabel>
                      <Select
                        value={bookingDialog.bookingData.room?._id || ''}
                        label="חדר"
                      >
                        {rooms.map(room => (
                          <MenuItem key={room._id} value={room._id}>
                            {room.internalName || `חדר ${room.roomNumber}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              
              {/* פרטי כרטיס אשראי */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>פרטי כרטיס אשראי</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="שם בעל הכרטיס"
                      fullWidth
                      margin="normal"
                      defaultValue={bookingDialog.bookingData.creditCard?.cardholderName || ''}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="מספר כרטיס"
                      fullWidth
                      margin="normal"
                      defaultValue={formatCreditCardNumber(bookingDialog.bookingData.creditCard?.cardNumber)}
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <TextField
                      label="תוקף (MM/YY)"
                      fullWidth
                      margin="normal"
                      placeholder="MM/YY"
                      defaultValue={formatCreditCardExpiry(bookingDialog.bookingData.creditCard)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        maxLength: 5,
                        pattern: "[0-9]{2}/[0-9]{2}"
                      }}
                      id="creditCardExpiry"
                      onChange={(e) => {
                        let value = e.target.value;
                        
                        // אם המשתמש מכניס 2 ספרות, הוסף את הסימן '/' אוטומטית
                        if (value.length === 2 && !value.includes('/')) {
                          value = value + '/';
                          e.target.value = value;
                        }
                        
                        // מסנן: רק ספרות ו-'/'
                        value = value.replace(/[^\d/]/g, '');
                        
                        // מבטיח פורמט MM/YY
                        if (value.length > 0) {
                          const parts = value.split('/');
                          if (parts[0] && parseInt(parts[0]) > 12) {
                            parts[0] = '12';
                          }
                          if (parts.length > 1 && parts[1].length > 2) {
                            parts[1] = parts[1].substring(0, 2);
                          }
                          value = parts.join('/');
                        }
                        
                        e.target.value = value;
                        
                        // עדכון הנתונים בסטייט
                        setBookingDialog(prev => ({
                          ...prev,
                          bookingData: {
                            ...prev.bookingData,
                            creditCard: {
                              ...prev.bookingData.creditCard,
                              expiry: value
                            }
                          }
                        }));
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <TextField
                      label="CVV"
                      fullWidth
                      margin="normal"
                      defaultValue={bookingDialog.bookingData.creditCard?.cvv || ''}
                      inputProps={{
                        maxLength: 3,
                        pattern: "[0-9]{3}"
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              {/* הערות */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>הערות</Typography>
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  margin="normal"
                  defaultValue={bookingDialog.bookingData.notes || ''}
                />
              </Grid>
              
              {/* כפתורי שמירה וביטול */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                  <Button onClick={closeBookingDialog} color="inherit" variant="outlined">
                    ביטול
                  </Button>
                  <Button 
                    onClick={() => handleUpdateBooking(bookingDialog.bookingData)} 
                    color="primary" 
                    variant="contained"
                    startIcon={<CheckIcon />}
                  >
                    שמירה
                  </Button>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography>לא נמצאו פרטי הזמנה</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default BookingListView; 