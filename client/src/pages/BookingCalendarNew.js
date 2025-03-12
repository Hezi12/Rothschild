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
  Container
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
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
const DayCell = ({ date, room, bookings, blockedDates, onCellClick, onOpenDetails }) => {
  const theme = useTheme();
  // בדיקה אם התאריך חסום
  const isBlocked = blockedDates.some(block => 
    block.room === room._id && 
    date >= new Date(block.startDate) && 
    date < new Date(block.endDate)
  );
  
  // סינון הזמנות הרלוונטיות לתא זה
  const cellBookings = bookings.filter(booking => {
    if (!booking || !booking.checkIn || !booking.checkOut) return false;
    
    const checkIn = booking.checkIn instanceof Date ? booking.checkIn : new Date(booking.checkIn);
    const checkOut = booking.checkOut instanceof Date ? booking.checkOut : new Date(booking.checkOut);
    
    // בדיקה אם התאריך נמצא בטווח ההזמנה ושייך לאותו חדר
    return (
      booking.room === room._id && 
      date >= checkIn && 
      date < checkOut
    );
  });
  
  // בחירת רקע לתא לפי מצבו
  let backgroundColor = 'white';
  if (isToday(date)) {
    backgroundColor = alpha(theme.palette.info.light, 0.1);
  }
  
  // תצוגת הזמנה תקבל עדיפות על פני חסימה
  if (cellBookings.length > 0) {
    // יש הזמנה בתא זה - נציג אותה
    return (
      <Box
        sx={{
          minWidth: '100px',
          minHeight: '80px',
          height: '100%',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          backgroundColor: isToday(date) ? alpha(theme.palette.info.light, 0.1) : 'white',
          p: 0.5
        }}
      >
        <BookingCellContent 
          booking={cellBookings[0]} 
          onOpenDetails={onOpenDetails} 
        />
      </Box>
    );
  }
  
  // אם אין הזמנה בתא זה, אבל יש חסימה
  if (isBlocked) {
    return (
      <Box
        onClick={() => onCellClick(room, date)}
        sx={{
          minWidth: '100px',
          minHeight: '80px',
          height: '100%',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          backgroundColor: '#ffcccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <Typography variant="caption" color="error">
          חסום
        </Typography>
      </Box>
    );
  }
  
  // תא רגיל - פנוי
  return (
    <Box
      onClick={() => onCellClick(room, date)}
      sx={{
        minWidth: '100px',
        minHeight: '80px',
        height: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.light, 0.1)
        }
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {room.basePrice} ₪
      </Typography>
    </Box>
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
  
  // ניהול מצב (state)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dates, setDates] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // מצב דיאלוגים
  const [newBookingDialog, setNewBookingDialog] = useState(false);
  const [bookingDetailsDialog, setBookingDetailsDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // מצב טופס הזמנה חדשה
  const [newBooking, setNewBooking] = useState({
    room: '',
    checkIn: '',
    checkOut: '',
    nights: 1,
    totalPrice: 0,
    guest: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: ''
    },
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    isTourist: false,
    creditCardDetails: {
      cardNumber: '',
      expiryDate: '',
      cvv: ''
    },
    notes: ''
  });
  
  // יצירת טווח תאריכים להצגה
  const calculateDatesToShow = useCallback(() => {
    // במצב חודשי נציג חודש שלם
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysToShow = eachDayOfInterval({ start: monthStart, end: monthEnd });
    setDates(daysToShow);
  }, [currentDate]);
  
  // טעינת חדרים
  const fetchRooms = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
      if (response.data.success) {
        setRooms(response.data.data.filter(room => room.isActive));
      }
    } catch (error) {
      console.error('שגיאה בטעינת חדרים:', error);
      toast.error('שגיאה בטעינת חדרים');
    }
  }, []);
  
  // טעינת הזמנות
  const fetchBookings = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings`);
      if (response.data.success) {
        const processedBookings = response.data.data.map(booking => ({
          ...booking,
          checkIn: new Date(booking.checkIn),
          checkOut: new Date(booking.checkOut)
        }));
        setBookings(processedBookings);
      }
    } catch (error) {
      console.error('שגיאה בטעינת הזמנות:', error);
      toast.error('שגיאה בטעינת הזמנות');
    }
  }, []);
  
  // טעינת תאריכים חסומים
  const fetchBlockedDates = useCallback(async () => {
    try {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms/blocked-dates`);
        if (response.data.success) {
          setBlockedDates(response.data.data);
          console.log(`נטענו ${response.data.data.length} תאריכים חסומים`);
        } else {
          console.warn('תשובה לא תקינה בטעינת תאריכים חסומים:', response.data);
          setBlockedDates([]); // אתחול למערך ריק במקרה של תשובה לא תקינה
        }
      } catch (apiError) {
        // במקרה של שגיאת תקשורת או שגיאת שרת, נמשיך בלי תאריכים חסומים
        console.warn('לא ניתן לטעון תאריכים חסומים. ממשיכים עם מערך ריק:', apiError);
        setBlockedDates([]); // אתחול למערך ריק
        // לא מציגים הודעת שגיאה למשתמש - פשוט ממשיכים בלי תאריכים חסומים
      }
    } catch (error) {
      console.error('שגיאה חמורה בטעינת תאריכים חסומים:', error);
      setBlockedDates([]); // אתחול למערך ריק במקרה של שגיאה
    }
  }, []);
  
  // רענון כללי של הנתונים
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRooms(),
        fetchBookings(),
        fetchBlockedDates()
      ]);
    } catch (error) {
      console.error('שגיאה ברענון נתונים:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchRooms, fetchBookings, fetchBlockedDates]);
  
  // אתחול הדף
  useEffect(() => {
    calculateDatesToShow();
    refreshData();
  }, [calculateDatesToShow, refreshData]);
  
  // עדכון תאריכים בשינוי חודש
  useEffect(() => {
    calculateDatesToShow();
  }, [currentDate, calculateDatesToShow]);
  
  // הצגת הודעת אזהרה בטעינת הדף
  useEffect(() => {
    toast.warning(
      <div style={{ textAlign: 'center', direction: 'rtl' }}>
        <h4>דף מיושן</h4>
        <p>דף זה יוסר בקרוב. אנא השתמש בדף "ניהול הזמנות (חדש)" מהתפריט.</p>
      </div>,
      { autoClose: false }
    );
  }, []);
  
  // ניווט לחודש הבא
  const handleNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };
  
  // ניווט לחודש הקודם
  const handlePrevMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };
  
  // ניווט להיום
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // פתיחת דיאלוג הזמנה חדשה
  const handleOpenNewBookingDialog = (room, date) => {
    setSelectedRoom(room);
    setSelectedDate(date);
    
    // חישוב תאריך צ'ק-אאוט (יום אחד לאחר צ'ק-אין)
    const checkInDate = date;
    const checkOutDate = addDays(date, 1);
    
    // חישוב מספר לילות (ברירת מחדל: לילה אחד)
    const nights = 1;
    
    // חישוב סך הכל לתשלום
    const totalPrice = room.basePrice * nights;
    
    setNewBooking({
      room: room._id,
      checkIn: format(checkInDate, 'yyyy-MM-dd'),
      checkOut: format(checkOutDate, 'yyyy-MM-dd'),
      nights: nights,
      totalPrice: totalPrice,
      guest: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: ''
      },
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      isTourist: false,
      creditCardDetails: {
        cardNumber: '',
        expiryDate: '',
        cvv: ''
      },
      notes: ''
    });
    
    setNewBookingDialog(true);
  };
  
  // פתיחת דיאלוג פרטי הזמנה
  const handleOpenBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setBookingDetailsDialog(true);
  };
  
  // סגירת דיאלוגים
  const handleCloseDialogs = () => {
    setNewBookingDialog(false);
    setBookingDetailsDialog(false);
    setSelectedBooking(null);
    setSelectedRoom(null);
    setSelectedDate(null);
  };
  
  // שינוי שדה בטופס הזמנה חדשה
  const handleBookingFieldChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNewBooking(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewBooking(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // שינוי תאריך צ'ק-אין
  const handleCheckInDateChange = (e) => {
    const newCheckIn = e.target.value;
    const checkInDate = new Date(newCheckIn);
    
    // חישוב מחדש של מספר הלילות והמחיר הכולל
    let checkOutDate = new Date(newBooking.checkOut);
    const room = rooms.find(r => r._id === newBooking.room);
    
    if (!isNaN(checkOutDate.getTime()) && !isNaN(checkInDate.getTime()) && room) {
      const oneDay = 24 * 60 * 60 * 1000; // מילישניות ביום
      const nights = Math.ceil(Math.max(1, (checkOutDate - checkInDate) / oneDay));
      const totalPrice = room.basePrice * nights;
      
      setNewBooking(prev => ({
        ...prev,
        checkIn: newCheckIn,
        nights: nights,
        totalPrice: totalPrice
      }));
    } else {
      // אם אין תאריך צ'ק-אאוט תקין או אין חדר
      setNewBooking(prev => ({
        ...prev,
        checkIn: newCheckIn
      }));
    }
  };
  
  // שינוי תאריך צ'ק-אאוט
  const handleCheckOutDateChange = (e) => {
    const newCheckOut = e.target.value;
    const checkOutDate = new Date(newCheckOut);
    
    // חישוב מחדש של מספר הלילות והמחיר הכולל
    let checkInDate = new Date(newBooking.checkIn);
    const room = rooms.find(r => r._id === newBooking.room);
    
    if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && room) {
      const oneDay = 24 * 60 * 60 * 1000; // מילישניות ביום
      const nights = Math.ceil(Math.max(1, (checkOutDate - checkInDate) / oneDay));
      const totalPrice = room.basePrice * nights;
      
      setNewBooking(prev => ({
        ...prev,
        checkOut: newCheckOut,
        nights: nights,
        totalPrice: totalPrice
      }));
    } else {
      // אם אין תאריך צ'ק-אין תקין או אין חדר
      setNewBooking(prev => ({
        ...prev,
        checkOut: newCheckOut
      }));
    }
  };
  
  // שמירת הזמנה חדשה
  const handleSaveNewBooking = async () => {
    // וידוא שכל השדות הנדרשים מלאים
    const { room, checkIn, checkOut, guest } = newBooking;
    if (!room || !checkIn || !checkOut || !guest.firstName || !guest.lastName || !guest.phone) {
      toast.error('יש למלא את כל השדות החובה');
      return;
    }
    
    try {
      // לוגים לדיבאג - בדיקת כל ההזמנות והחסימות הקיימות
      console.log('=== בדיקת דיבאג לפני יצירת הזמנה חדשה ===');
      console.log(`מנסה ליצור הזמנה לחדר: ${room} בתאריכים:`, {
        checkIn: checkIn,
        checkOut: checkOut
      });
      
      console.log('הזמנות קיימות במערכת:', bookings.length);
      bookings.forEach(booking => {
        console.log(`הזמנה: ${booking._id}, חדר: ${booking.room._id || booking.room}, תאריכים:`, {
          checkIn: booking.checkIn,
          checkOut: booking.checkOut
        });
      });
      
      console.log('חסימות קיימות במערכת:', blockedDates.length);
      blockedDates.forEach(block => {
        console.log(`חסימה: ${block._id}, חדר: ${block.room._id || block.room}, תאריכים:`, {
          startDate: block.startDate,
          endDate: block.endDate,
          reason: block.reason
        });
      });
      
      // הכנת האובייקט בפורמט שהשרת מצפה לקבל
      const bookingData = {
        roomId: room, // השרת מצפה ל-roomId ולא ל-room
        checkIn: format(new Date(checkIn), 'yyyy-MM-dd'),
        checkOut: format(new Date(checkOut), 'yyyy-MM-dd'),
        nights: newBooking.nights || 1,
        isTourist: newBooking.isTourist || false,
        paymentMethod: newBooking.paymentMethod || 'cash',
        paymentStatus: newBooking.paymentStatus || 'pending',
        totalPrice: newBooking.totalPrice || 0,
        guest: {
          firstName: guest.firstName,
          lastName: guest.lastName,
          name: `${guest.firstName} ${guest.lastName}`,
          email: guest.email || '',
          phone: guest.phone,
          address: guest.address || ''
        },
        notes: newBooking.notes || ''
      };
      
      // הוספת פרטי כרטיס אשראי אם הם קיימים
      if (newBooking.paymentMethod === 'credit' && newBooking.creditCardDetails) {
        bookingData.creditCardDetails = {
          cardNumber: newBooking.creditCardDetails?.cardNumber || '',
          expiryDate: newBooking.creditCardDetails?.expiryDate || '',
          cvv: newBooking.creditCardDetails?.cvv || ''
        };
      }
      
      console.log('שולח נתוני הזמנה לשרת:', bookingData);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/bookings`,
        bookingData
      );
      
      if (response.data.success) {
        toast.success('ההזמנה נוצרה בהצלחה');
        handleCloseDialogs();
        refreshData();
      }
    } catch (error) {
      console.error('שגיאה ביצירת הזמנה:', error);
      toast.error(error.response?.data?.message || 'שגיאה ביצירת הזמנה');
    }
  };
  
  // מחיקת הזמנה
  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;
    
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את ההזמנה?')) {
      return;
    }
    
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/bookings/${selectedBooking._id}`
      );
      
      if (response.data.success) {
        toast.success('ההזמנה נמחקה בהצלחה');
        handleCloseDialogs();
        refreshData();
      }
    } catch (error) {
      console.error('שגיאה במחיקת הזמנה:', error);
      toast.error('שגיאה במחיקת הזמנה');
    }
  };
  
  // טיפול בלחיצה על תא בלוח
  const handleCellClick = (room, date) => {
    handleOpenNewBookingDialog(room, date);
  };
  
  // רינדור הדיאלוג ליצירת הזמנה חדשה
  const renderNewBookingDialog = () => {
    return (
      <Dialog 
        open={newBookingDialog} 
        onClose={handleCloseDialogs}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>הזמנה חדשה</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>חדר</InputLabel>
                <Select
                  name="room"
                  value={newBooking.room}
                  onChange={handleBookingFieldChange}
                >
                  {rooms.map(room => (
                    <MenuItem key={room._id} value={room._id}>
                      {room.name} - {room.basePrice} ₪ ללילה
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="תאריך הגעה"
                type="date"
                name="checkIn"
                value={newBooking.checkIn}
                onChange={handleCheckInDateChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="תאריך עזיבה"
                type="date"
                name="checkOut"
                value={newBooking.checkOut}
                onChange={handleCheckOutDateChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="מספר לילות"
                type="number"
                name="nights"
                value={newBooking.nights}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="מחיר כולל"
                type="number"
                name="totalPrice"
                value={newBooking.totalPrice}
                onChange={handleBookingFieldChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                פרטי האורח
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="שם פרטי"
                name="guest.firstName"
                value={newBooking.guest.firstName}
                onChange={handleBookingFieldChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="שם משפחה"
                name="guest.lastName"
                value={newBooking.guest.lastName}
                onChange={handleBookingFieldChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="דוא״ל"
                name="guest.email"
                value={newBooking.guest.email}
                onChange={handleBookingFieldChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="טלפון"
                name="guest.phone"
                value={newBooking.guest.phone}
                onChange={handleBookingFieldChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>סטטוס תשלום</InputLabel>
                <Select
                  name="paymentStatus"
                  value={newBooking.paymentStatus}
                  onChange={handleBookingFieldChange}
                >
                  <MenuItem value="paid">שולם</MenuItem>
                  <MenuItem value="partial">תשלום חלקי</MenuItem>
                  <MenuItem value="unpaid">לא שולם</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>ביטול</Button>
          <Button 
            onClick={handleSaveNewBooking} 
            variant="contained" 
            color="primary"
          >
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // רינדור דיאלוג פרטי הזמנה
  const renderBookingDetailsDialog = () => {
    if (!selectedBooking) return null;
    
    return (
      <Dialog 
        open={bookingDetailsDialog} 
        onClose={handleCloseDialogs}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>פרטי הזמנה</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="h6">
                {selectedBooking.guest.firstName} {selectedBooking.guest.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                הזמנה #{selectedBooking._id.substring(0, 8)}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">תאריך הגעה:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {format(new Date(selectedBooking.checkIn), 'dd/MM/yyyy')}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">תאריך עזיבה:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {format(new Date(selectedBooking.checkOut), 'dd/MM/yyyy')}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">מספר לילות:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {selectedBooking.nights}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">מחיר כולל:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {selectedBooking.totalPrice} ₪
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">חדר:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {rooms.find(r => r._id === selectedBooking.room)?.name || 'לא ידוע'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">סטטוס תשלום:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {selectedBooking.paymentStatus === 'paid' && 'שולם'}
                {selectedBooking.paymentStatus === 'partial' && 'תשלום חלקי'}
                {selectedBooking.paymentStatus === 'unpaid' && 'לא שולם'}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                פרטי האורח
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">דוא״ל:</Typography>
              <Typography variant="body1">
                {selectedBooking.guest.email}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">טלפון:</Typography>
              <Typography variant="body1">
                {selectedBooking.guest.phone}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteBooking}
            color="error"
            startIcon={<DeleteIcon />}
          >
            מחיקה
          </Button>
          <Button onClick={handleCloseDialogs}>סגירה</Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // פונקציה חדשה לאיפוס מלא של המערכת
  const handleForceReset = async () => {
    // אזהרה כפולה למניעת מחיקה בטעות
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את כל ההזמנות וכל החסימות מהמערכת? פעולה זו אינה הפיכה!')) {
      return;
    }
    if (!window.confirm('אזהרה נוספת: פעולה זו תמחק את כל היסטוריית ההזמנות והחסימות ללא אפשרות שחזור. האם אתה בטוח?')) {
      return;
    }

    // בקשת סיסמת מנהל לאבטחה נוספת
    const deletePassword = prompt('הזן סיסמת מנהל למחיקת כל הנתונים:');
    if (!deletePassword) {
      toast.error('יש להזין סיסמה');
      return;
    }

    try {
      setLoading(true);
      
      // מחיקת כל ההזמנות
      const bookingsResponse = await axios.delete(
        `${process.env.REACT_APP_API_URL}/bookings/all`,
        { 
          data: { password: deletePassword },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // מחיקת כל החסימות
      const blocksResponse = await axios.delete(
        `${process.env.REACT_APP_API_URL}/rooms/blocked-dates/all`,
        { 
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const bookingsDeleted = bookingsResponse.data.success ? bookingsResponse.data.count : 0;
      const blocksDeleted = blocksResponse.data.deletedCount || 0;
      
      toast.success(`נמחקו בהצלחה: ${bookingsDeleted} הזמנות ו-${blocksDeleted} חסימות`);
      
      // רענון הנתונים
      await refreshData();
    } catch (error) {
      console.error('שגיאה באיפוס המערכת:', error);
      toast.error(error.response?.data?.message || 'אירעה שגיאה באיפוס המערכת');
    } finally {
      setLoading(false);
    }
  };
  
  // רינדור הלוח
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          ניהול הזמנות - גרסה חדשה
        </Typography>
        
        {/* חלק הראש עם החודש הנוכחי וכפתורי ניווט */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" component="div">
              {format(currentDate, 'MMMM yyyy', { locale: he })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={goToToday} startIcon={<TodayIcon />}>
              היום
            </Button>
            <Button variant="outlined" onClick={handlePrevMonth} startIcon={<ArrowForwardIcon />}>
              חודש קודם
            </Button>
            <Button variant="outlined" onClick={handleNextMonth} startIcon={<ArrowBackIcon />}>
              חודש הבא
            </Button>
          </Box>
        </Box>
        
        {/* תצוגת הלוח */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: `180px repeat(${dates.length}, 100px)`, gap: 1 }}>
              {/* כותרת ריקה עבור טור החדרים */}
              <Box sx={{ border: '1px solid rgba(0,0,0,0.1)', p: 1, bgcolor: 'background.paper', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                חדרים / תאריכים
              </Box>
              
              {/* כותרות תאריכים */}
              <DayHeaders dates={dates} />
              
              {/* שורות החדרים */}
              {rooms.map(room => (
                <React.Fragment key={room._id}>
                  {/* תא חדר */}
                  <RoomCell room={room} />
                  
                  {/* תאים לכל תאריך */}
                  {dates.map(date => (
                    <DayCell
                      key={date.toISOString()}
                      date={date}
                      room={room}
                      bookings={bookings}
                      blockedDates={blockedDates}
                      onCellClick={handleCellClick}
                      onOpenDetails={handleOpenBookingDetails}
                    />
                  ))}
                </React.Fragment>
              ))}
            </Box>
          </Box>
        )}
        
        {/* כפתור איפוס המערכת */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleForceReset}
            startIcon={<DeleteIcon />}
            sx={{ fontWeight: 'bold' }}
          >
            איפוס מלא של המערכת - מחיקת כל ההזמנות והחסימות
          </Button>
        </Box>
      </Paper>
      
      {/* הדיאלוגים */}
      {renderNewBookingDialog()}
      {renderBookingDetailsDialog()}
    </Container>
  );
};

export default BookingCalendarNew; 