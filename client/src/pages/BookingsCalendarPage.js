import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  Chip,
  Card,
  Divider,
  Tooltip,
  Container,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  alpha,
  Checkbox
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Today as TodayIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Block as BlockIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon,
  CalendarMonth as MonthIcon,
  CalendarViewWeek as WeekIcon,
  FilterAlt as FilterIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Assignment as AssignmentIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
  PriceChange as PriceChangeIcon,
  Save as SaveIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay, isWithinInterval, parseISO, isToday, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, subDays } from 'date-fns';
import { he } from 'date-fns/locale';

const BookingsCalendarPage = () => {
  const theme = useTheme();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [dynamicPrices, setDynamicPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingBlockedDates, setLoadingBlockedDates] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(startOfWeek(currentDate, { weekStartsOn: 0 }));
  const [endDate, setEndDate] = useState(endOfWeek(currentDate, { weekStartsOn: 0 }));
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [blockReason, setBlockReason] = useState('');
  const [showFullCardNumber, setShowFullCardNumber] = useState(false);
  const [error, setError] = useState(null);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // משתנים חדשים לניהול מחירים
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [bulkPriceDialogOpen, setBulkPriceDialogOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [editedPrice, setEditedPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [bulkPriceData, setBulkPriceData] = useState({
    startDate: new Date(),
    endDate: new Date(),
    price: '',
    roomIds: [],
    daysOfWeek: null // null = כל הימים, אחרת מערך של ימים [0,1,2,3,4,5,6]
  });
  
  // פונקציות לפעולות על סטטוס תשלום והזמנות
  const [paymentStatus, setPaymentStatus] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(false);
  
  // נתונים להזמנה חדשה
  const [newBooking, setNewBooking] = useState({
    guest: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      idNumber: ''
    },
    nights: 1,
    totalPrice: 0,
    paymentMethod: 'cash',
    paymentStatus: 'לא שולם',
    notes: '',
    creditCardDetails: {
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: ''
    }
  });
  const [savingBooking, setSavingBooking] = useState(false);
  
  // הגדרות למצב חסימת חדר
  const [blockingRoom, setBlockingRoom] = useState(false);
  const [blockDuration, setBlockDuration] = useState(1); // מספר ימים לחסימה
  
  // הגדרות חדשות לשיפור התצוגה
  const [viewMode, setViewMode] = useState('month');
  const [daysToShow, setDaysToShow] = useState(14); // ברירת מחדל - שבועיים
  const [legendOpen, setLegendOpen] = useState(false);
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    paid: true,
    pending: true,
    canceled: true,
    blocked: true
  });
  
  // state להסרת חסימה כדי לעקוב אחר תהליך ההסרה של חסימות ספציפיות
  const [removingBlockId, setRemovingBlockId] = useState(null);
  
  // State לדיאלוג עריכת פרטי הזמנה מבוקינג
  const [bookingBlockDialogOpen, setBookingBlockDialogOpen] = useState(false);
  const [selectedBookingBlock, setSelectedBookingBlock] = useState(null);
  const [updatingBookingBlock, setUpdatingBookingBlock] = useState(false);
  const [bookingGuestData, setBookingGuestData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  
  // פעולת האתחול הראשונית - רק פעם אחת
  useEffect(() => {
    // טעינה ראשונית של החדרים
    fetchRooms();
  }, []);
  
  // עדכון טווח התאריכים כשהתאריך הנוכחי משתנה
  useEffect(() => {
    if (viewMode === 'week') {
      // הגדרה חדשה: יומיים אחורה + היום הנוכחי + 14 ימים קדימה
      setDaysToShow(17); // 2 + 1 + 14 = 17
      const twoDatesBefore = subDays(new Date(), 2); // יומיים לפני היום הנוכחי
      setStartDate(twoDatesBefore);
      setEndDate(addDays(new Date(), 14)); // 14 ימים קדימה מהיום הנוכחי
    } else {
      // תצוגת חודש
      setDaysToShow(31); // מקסימום ימים בחודש
      setStartDate(startOfMonth(currentDate));
      setEndDate(endOfMonth(currentDate));
    }
  }, [currentDate, viewMode]);
  
  // טעינת כל הנתונים הדרושים כאשר הדף נטען
  useEffect(() => {
    fetchRooms();
    
    // פונקציה לטעינת כל הנתונים מחדש - מקומית בתוך ה-useEffect
    const refreshDataLocal = () => {
      fetchBookings();
      fetchBlockedDates();
      fetchDynamicPrices();
    };
    
    // טעינה ראשונית
    refreshDataLocal();
    
    // טעינה מחדש כאשר טווח התאריכים משתנה
    if (dataInitialized) {
      refreshDataLocal();
    }
    
    setDataInitialized(true);
  }, [startDate, endDate]);
  
  // עדכון מצב הטעינה הכללי
  useEffect(() => {
    setLoading(loadingRooms || loadingBookings || loadingBlockedDates || loadingPrices);
  }, [loadingRooms, loadingBookings, loadingBlockedDates, loadingPrices]);
  
  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
      // נסדר את החדרים לפי מספר חדר
      const sortedRooms = response.data.data.sort((a, b) => a.roomNumber - b.roomNumber);
      setRooms(sortedRooms);
    } catch (error) {
      console.error('שגיאה בטעינת חדרים:', error);
      toast.error('שגיאה בטעינת חדרים');
      setError('שגיאה בטעינת נתוני החדרים. אנא רענן את הדף ונסה שנית.');
    } finally {
      setLoadingRooms(false);
    }
  };
  
  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      
      // קבלת כל ההזמנות מהשרת
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings`);
      
      if (response.data && response.data.success) {
        // עיבוד הנתונים שהתקבלו
        const bookingsData = response.data.data || [];
        
        // המרת פורמט התאריכים ושדות אחרים
        const processedBookings = bookingsData.map(booking => {
          // פיצול שם האורח לשם פרטי ושם משפחה
          const nameParts = booking.guest?.name ? booking.guest.name.split(' ') : ['', ''];
          
          return {
            ...booking,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            // המרת סטטוס תשלום לעברית
            paymentStatus: booking.paymentStatus === 'paid' ? 'שולם' : 
                          (booking.paymentStatus === 'pending' ? 'לא שולם' : booking.paymentStatus),
            // המרת אמצעי תשלום לפורמט פנימי
            paymentMethod: booking.paymentMethod === 'credit' ? 'creditCard' : 
                          (booking.paymentMethod === 'bank_transfer' ? 'bankTransfer' : 'cash'),
            // הוספת שדות נוספים לאורח
            guest: {
              ...booking.guest,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              idNumber: booking.guest?.idNumber || ''
            }
          };
        });
        
        setBookings(processedBookings);
        console.log(`נטענו ${processedBookings.length} הזמנות`);
      } else {
        console.error('שגיאה בטעינת הזמנות: תשובה לא תקינה', response.data);
        toast.error('שגיאה בטעינת הזמנות');
      }
    } catch (error) {
      console.error('שגיאה בטעינת הזמנות:', error);
      
      // הצגת פרטי השגיאה המלאים
      console.log('פרטי השגיאה המלאים:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        fullData: error.response?.data
      });
      
      toast.error('שגיאה בטעינת הזמנות מהשרת');
    } finally {
      setLoadingBookings(false);
    }
  };
  
  const fetchBlockedDates = async () => {
    try {
      setLoadingBlockedDates(true);
      
      // קבלת כל התאריכים החסומים
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms/blocked-dates`);
      
      if (response.data && response.data.success) {
        const blockedDatesData = response.data.data || [];
        
        // עיבוד הנתונים שהתקבלו
        const processedBlockedDates = blockedDatesData.map(blockedDate => {
          return {
            ...blockedDate,
            startDate: new Date(blockedDate.startDate),
            endDate: new Date(blockedDate.endDate)
          };
        });
        
        setBlockedDates(processedBlockedDates);
        console.log(`נטענו ${processedBlockedDates.length} תאריכים חסומים`);
      } else {
        console.error('שגיאה בטעינת תאריכים חסומים: תשובה לא תקינה', response.data);
        toast.error('שגיאה בטעינת תאריכים חסומים');
      }
    } catch (error) {
      console.error('שגיאה בטעינת תאריכים חסומים:', error);
      
      // הצגת פרטי השגיאה המלאים
      console.log('פרטי השגיאה המלאים:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        fullData: error.response?.data
      });
      
      toast.error('שגיאה בטעינת תאריכים חסומים מהשרת');
    } finally {
      setLoadingBlockedDates(false);
    }
  };
  
  // פונקציה חדשה לטעינת מחירים דינמיים
  const fetchDynamicPrices = async () => {
    setLoadingPrices(true);
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/prices`, {
        params: {
          startDate: startDateStr,
          endDate: endDateStr
        }
      });
      
      if (response.data.success) {
        setDynamicPrices(response.data.data);
      }
    } catch (error) {
      console.error('שגיאה בטעינת מחירים דינמיים:', error);
      setError('אירעה שגיאה בטעינת מחירים דינמיים');
      toast.error('לא ניתן לטעון מחירים דינמיים');
    } finally {
      setLoadingPrices(false);
    }
  };
  
  // פונקציה לשמירת מחיר דינמי
  const handleSaveDynamicPrice = async () => {
    if (!selectedRoom || !selectedPrice || !editedPrice) return;
    
    setSavingPrice(true);
    try {
      const numericPrice = Number(editedPrice);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        toast.error('נא להזין מחיר חיובי');
        return;
      }
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/prices`, {
        roomId: selectedRoom._id,
        date: format(selectedPrice.date, 'yyyy-MM-dd'),
        price: numericPrice
      });
      
      if (response.data.success) {
        toast.success('המחיר עודכן בהצלחה');
        fetchDynamicPrices(); // טעינה מחדש של המחירים
        setPriceDialogOpen(false);
      }
    } catch (error) {
      console.error('שגיאה בשמירת מחיר דינמי:', error);
      toast.error('אירעה שגיאה בשמירת המחיר');
    } finally {
      setSavingPrice(false);
    }
  };
  
  // פונקציה לפתיחת חלון עריכת מחיר
  const handleOpenPriceDialog = (room, date) => {
    if (!room) return;
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    setSelectedRoom(room);
    
    // בדיקה אם יש כבר מחיר דינמי לתאריך זה
    const existingPrice = dynamicPrices.find(price => 
      price.room === room._id && 
      format(new Date(price.date), 'yyyy-MM-dd') === formattedDate
    );
    
    // הגדרת המחיר הראשוני בחלון העריכה
    setSelectedPrice({ date, existingPrice });
    
    if (existingPrice) {
      setEditedPrice(existingPrice.price.toString());
      } else {
      setEditedPrice(room.basePrice.toString());
    }
    
    setPriceDialogOpen(true);
  };
  
  // פונקציה לעריכה גורפת של מחירים
  const handleBulkPriceUpdate = async () => {
    if (!bulkPriceData.roomIds.length || !bulkPriceData.price) {
      toast.error('נא לבחור חדרים ולהזין מחיר');
      return;
    }
    
    setSavingPrice(true);
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/prices/bulk`, {
        roomIds: bulkPriceData.roomIds,
        startDate: format(bulkPriceData.startDate, 'yyyy-MM-dd'),
        endDate: format(bulkPriceData.endDate, 'yyyy-MM-dd'),
        price: Number(bulkPriceData.price),
        daysOfWeek: bulkPriceData.daysOfWeek
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'המחירים עודכנו בהצלחה');
        fetchDynamicPrices(); // טעינה מחדש של המחירים
        setBulkPriceDialogOpen(false);
      }
    } catch (error) {
      console.error('שגיאה בעדכון גורף של מחירים:', error);
      toast.error('אירעה שגיאה בעדכון המחירים');
    } finally {
      setSavingPrice(false);
    }
  };
  
  // פונקציה לאיפוס מחירים דינמיים (חזרה למחיר הבסיסי)
  const handleResetPrices = async () => {
    if (!bulkPriceData.roomIds.length) {
      toast.error('נא לבחור לפחות חדר אחד');
      return;
    }
    
    if (!window.confirm('האם את/ה בטוח/ה שברצונך לאפס את המחירים הדינמיים של החדרים הנבחרים?')) {
      return;
    }
    
    setSavingPrice(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/prices/reset`, {
        roomId: bulkPriceData.roomIds.length === 1 ? bulkPriceData.roomIds[0] : null,
        startDate: format(bulkPriceData.startDate, 'yyyy-MM-dd'),
        endDate: format(bulkPriceData.endDate, 'yyyy-MM-dd')
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'המחירים אופסו בהצלחה');
        fetchDynamicPrices(); // טעינה מחדש של המחירים
        setBulkPriceDialogOpen(false);
      }
    } catch (error) {
      console.error('שגיאה באיפוס מחירים דינמיים:', error);
      toast.error('אירעה שגיאה באיפוס המחירים');
    } finally {
      setSavingPrice(false);
    }
  };
  
  // פונקציה למציאת מחיר דינמי לחדר ותאריך
  const getDynamicPrice = (roomId, date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const dynamicPrice = dynamicPrices.find(price => 
      price.room === roomId && 
      format(new Date(price.date), 'yyyy-MM-dd') === formattedDate
    );
    
    return dynamicPrice;
  };
  
  // חישוב סטטיסטיקות
  const getStats = () => {
    const totalBookings = bookings.length;
    const paidBookings = bookings.filter(b => b.paymentStatus === 'שולם').length;
    const pendingBookings = bookings.filter(b => b.paymentStatus === 'לא שולם' || b.paymentStatus === 'שולם חלקית').length;
    
    return {
      total: totalBookings,
      paid: paidBookings,
      pending: pendingBookings,
      paidPercentage: totalBookings > 0 ? Math.round((paidBookings / totalBookings) * 100) : 0
    };
  };
  
  // פונקציות ניווט בתאריכים - משופרות 
  const handleChangeViewMode = (event, newMode) => {
    // הערה: השארנו את הפונקציה למקרה שנצטרך אותה בעתיד, אבל נעדכן אותה למצב מוגבל
    if (newMode !== null && newMode === 'month') {
      setViewMode('month');
    }
  };
  
  // מעבר לתקופה הבאה (רק חודש)
  const handleNextPeriod = () => {
    // תמיד במצב חודש
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    // רענון הנתונים בתצוגה החדשה
    refreshData();
  };
  
  // מעבר לתקופה הקודמת (רק חודש)
  const handlePrevPeriod = () => {
    // תמיד במצב חודש
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    // רענון הנתונים בתצוגה החדשה
    refreshData();
  };
  
  // חזרה ליום הנוכחי
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // פתיחת דיאלוג להוספת הזמנה חדשה
  const handleOpenBookingDialog = (room, date) => {
    setSelectedRoom(room);
    
    // תאריך צ'ק אין - התאריך שנבחר
    const checkInDate = date;
    // תאריך צ'ק אאוט - יום אחד אחרי בברירת מחדל
    const checkOutDate = addDays(date, 1);
    
    setSelectedDates({ 
      start: checkInDate, 
      end: checkOutDate 
    });
    
    // איפוס טופס ההזמנה החדשה
    setNewBooking({
      guest: {
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        idNumber: ''
      },
      nights: 1,
      totalPrice: room.basePrice || 0, // מחיר בסיסי של החדר כברירת מחדל
      paymentMethod: 'cash',
      paymentStatus: 'לא שולם',
      notes: '',
      creditCardDetails: {
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: ''
      }
    });
    
    setSelectedBooking(null); // וידוא שאנחנו לא במצב עריכה
    setBookingDialogOpen(true);
  };
  
  // פתיחת דיאלוג לחסימת תאריכים
  const handleOpenBlockDialog = (room, date) => {
    setSelectedRoom(room);
    setSelectedDates({ 
      start: date, 
      end: addDays(date, blockDuration)
    });
    setBlockReason('');
    setBlockDuration(1);
    setBlockDialogOpen(true);
  };
  
  // פתיחת פרטי הזמנה
  const handleOpenBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setPaymentStatus(booking.paymentStatus);
    setBookingDialogOpen(true);
    setShowFullCardNumber(false);
  };
  
  // סגירת דיאלוג
  const handleCloseDialog = () => {
    setBookingDialogOpen(false);
    setBlockDialogOpen(false);
    setSelectedBooking(null);
    setSelectedRoom(null);
    setSelectedDates({ start: null, end: null });
    setBlockReason('');
    setShowFullCardNumber(false);
  };
  
  // פתיחת תפריט הפילטר
  const handleOpenFilterMenu = (event) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };
  
  // סגירת תפריט הפילטר
  const handleCloseFilterMenu = () => {
    setFilterMenuAnchorEl(null);
  };
  
  // שינוי מצב הפילטר
  const handleFilterChange = (filterType) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };
  
  // פונקציות לעדכון סטטוס תשלום ופעולות נוספות
  const handleUpdatePaymentStatus = async () => {
    try {
      setLoading(true);
      await axios.put(`${process.env.REACT_APP_API_URL}/bookings/${selectedBooking._id}`, {
        paymentStatus: paymentStatus
      });
      
      // עדכון הרשימה המקומית
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === selectedBooking._id 
            ? { ...booking, paymentStatus } 
            : booking
        )
      );
      
      setSelectedBooking({...selectedBooking, paymentStatus});
      toast.success('סטטוס התשלום עודכן בהצלחה');
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס התשלום:', error);
      toast.error('שגיאה בעדכון סטטוס התשלום. אנא נסה שנית.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendInvoice = async () => {
    try {
      setSendingInvoice(true);
      await axios.post(`${process.env.REACT_APP_API_URL}/bookings/${selectedBooking._id}/invoice`);
      toast.success('החשבונית נשלחה בהצלחה');
    } catch (error) {
      console.error('שגיאה בשליחת החשבונית:', error);
      toast.error('שגיאה בשליחת החשבונית. אנא נסה שנית.');
    } finally {
      setSendingInvoice(false);
    }
  };
  
  const handleDeleteBooking = async () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) {
      try {
        setDeletingBooking(true);
        await axios.delete(`${process.env.REACT_APP_API_URL}/bookings/${selectedBooking._id}`);
        
        // מסיר את ההזמנה מהרשימה המקומית
        setBookings(prevBookings => 
          prevBookings.filter(booking => booking._id !== selectedBooking._id)
        );
        
        toast.success('ההזמנה נמחקה בהצלחה');
        handleCloseDialog();
      } catch (error) {
        console.error('שגיאה במחיקת ההזמנה:', error);
        toast.error('שגיאה במחיקת ההזמנה. אנא נסה שנית.');
      } finally {
        setDeletingBooking(false);
      }
    }
  };
  
  // פונקציה לקבלת צבע עבור סטטוס תשלום
  const getStatusColor = (status) => {
    switch(status) {
      case 'שולם':
        return { bg: 'rgba(76, 175, 80, 0.3)', border: 'rgb(76, 175, 80)', text: 'rgb(76, 175, 80)' };
      case 'לא שולם':
      case 'שולם חלקית':
        return { bg: 'rgba(255, 152, 0, 0.3)', border: 'rgb(255, 152, 0)', text: 'rgb(255, 152, 0)' };
      case 'בוטל':
      case 'מבוטל':
        return { bg: 'rgba(211, 47, 47, 0.3)', border: 'rgb(211, 47, 47)', text: 'rgb(211, 47, 47)' };
      case 'נחסם':
        return { bg: 'rgba(158, 158, 158, 0.3)', border: 'rgb(158, 158, 158)', text: 'rgb(158, 158, 158)' };
      default:
        return { bg: 'rgba(33, 150, 243, 0.3)', border: 'rgb(33, 150, 243)', text: 'rgb(33, 150, 243)' };
    }
  };
  
  // פונקציה שבודקת אם התאריך חסום
  const isDateBlocked = (roomId, date) => {
    if (!blockedDates || blockedDates.length === 0) {
      return false;
    }
    
    return blockedDates.some(blockedDate => {
      try {
        // בדיקה שנתוני החדר קיימים
        if (!blockedDate.room) {
          return false;
        }
        
        // השוואת מזהה החדר (תלוי במבנה הנתונים - לפעמים זה אובייקט ולפעמים רק מזהה)
        const roomIdToCompare = typeof blockedDate.room === 'object' ? blockedDate.room._id : blockedDate.room;
        const isSameRoom = roomIdToCompare === roomId;
        
        // ודאות שהתאריכים הם אובייקטי Date
        const startDate = blockedDate.startDate instanceof Date ? blockedDate.startDate : new Date(blockedDate.startDate);
        const endDate = blockedDate.endDate instanceof Date ? blockedDate.endDate : new Date(blockedDate.endDate);
        
        // בדיקה שהתאריך נמצא בטווח החסימה
        const isDateInRange = date >= startDate && date < endDate;
        
        return isSameRoom && isDateInRange;
      } catch (err) {
        console.error('שגיאה בבדיקת תאריך חסום:', err);
        return false;
      }
    });
  };

  // פונקציה שמחזירה את פרטי החסימה של תאריך מסוים
  const getBlockedDateInfo = (roomId, date) => {
    if (!blockedDates || blockedDates.length === 0) {
      return null;
    }
    
    return blockedDates.find(blockedDate => {
      try {
        // בדיקה שנתוני החדר קיימים
        if (!blockedDate.room) {
          return false;
        }
        
        // השוואת מזהה החדר (תלוי במבנה הנתונים - לפעמים זה אובייקט ולפעמים רק מזהה)
        const roomIdToCompare = typeof blockedDate.room === 'object' ? blockedDate.room._id : blockedDate.room;
        const isSameRoom = roomIdToCompare === roomId;
        
        // ודאות שהתאריכים הם אובייקטי Date
        const startDate = blockedDate.startDate instanceof Date ? blockedDate.startDate : new Date(blockedDate.startDate);
        const endDate = blockedDate.endDate instanceof Date ? blockedDate.endDate : new Date(blockedDate.endDate);
        
        // בדיקה שהתאריך נמצא בטווח החסימה
        const isDateInRange = date >= startDate && date < endDate;
        
        return isSameRoom && isDateInRange;
      } catch (err) {
        console.error('שגיאה בקבלת פרטי תאריך חסום:', err);
        return false;
      }
    });
  };
  
  // יצירת שורות ימים בלוח - עם עיצוב משופר
  const renderDaysHeader = () => {
    const days = [];
    let currentDay = startDate;
    const numDays = viewMode === 'week' ? daysToShow : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    for (let i = 0; i < numDays; i++) {
      const day = addDays(currentDay, i);
      
      // בתצוגת חודש, לא מציגים ימים מחודשים אחרים
      if (viewMode === 'month' && !isSameMonth(day, currentDate)) {
        continue;
      }
      
      const dayName = format(day, 'EEEE', { locale: he });
      const dayNumber = format(day, 'd', { locale: he });
      const monthName = format(day, 'MMM', { locale: he });
      
      const isCurrentDay = isToday(day);
      const isWeekend = day.getDay() === 5 || day.getDay() === 6; // שישי ושבת
      
      days.push(
        <Box 
          key={i} 
          sx={{ 
            flex: '1 1 0', 
            width: '100%',
            textAlign: 'center',
            p: 1,
            border: '1px solid #e0e0e0',
            borderBottom: '2px solid #e0e0e0',
            backgroundColor: isCurrentDay 
              ? `${theme.palette.primary.light} !important` 
              : isWeekend 
                ? 'rgba(0, 0, 0, 0.04)' 
                : 'inherit',
            color: isCurrentDay ? 'white' : 'inherit',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minWidth: '70px',
            maxWidth: 'none',
            justifyContent: 'center',
            alignItems: 'center',
            boxSizing: 'border-box',
            margin: 0,
          }}
        >
          <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
            {dayName}
          </Typography>
          <Typography variant="body2" component="div" sx={{ fontWeight: 'bold' }}>
            {dayNumber} {monthName}
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ 
        display: 'flex',
        mb: 1,
        width: '100%',
        position: 'relative', // חשוב ליישור
      }}>
        {/* רווח לעמודת החדרים - חשוב ליישור מול התאים */}
        <Box sx={{ 
          width: '100px', 
          minWidth: '100px',
          position: 'sticky',
          right: 0,
          zIndex: 2,
          boxSizing: 'border-box',
          margin: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: alpha(theme.palette.background.paper, 0.98),
          borderTop: '1px solid #e0e0e0',
          borderRight: '1px solid #e0e0e0',
          borderBottom: '1px solid #e0e0e0',
          borderRadius: '8px 0 0 0',
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            חדרים
          </Typography>
        </Box>
        
        {/* תאי הימים */}
        <Box sx={{ 
          display: 'flex',
          flex: 1,
          width: 'calc(100% - 100px)', // מחסיר את רוחב עמודת החדרים
          overflow: 'hidden',
          borderRadius: '0 4px 4px 0',
        }}>
          {days}
        </Box>
      </Box>
    );
  };
  
  // רינדור תא בלוח (משבצת זמן) - עם עיצוב משופר
  const renderCell = (room, date) => {
    // בתצוגת חודש, לא מציגים ימים מחודשים אחרים
    if (viewMode === 'month' && !isSameMonth(date, currentDate)) {
      return null;
    }
    
    // נחזיר תא טעינה אם עדיין טוענים נתונים
    if (loadingBookings || loadingBlockedDates || loadingPrices) {
      return (
        <Box
          sx={{
            height: '100px',
            border: '1px solid #e0e0e0',
            p: 0.5,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            minWidth: 80
          }}
        >
          <CircularProgress size={20} />
        </Box>
      );
    }
    
    // קבלת המחיר הדינמי אם קיים
    const dynamicPrice = getDynamicPrice(room._id, date);
    const displayPrice = dynamicPrice ? dynamicPrice.price : room.basePrice;
    
    // בודק אם יש הזמנה בתאריך ובחדר הזה
    const bookingsForCell = bookings.filter(booking => {
      try {
        return (
          booking.roomId === room._id &&
          isWithinInterval(date, {
            start: parseISO(booking.checkIn),
            end: subDays(parseISO(booking.checkOut), 1)
          })
        );
      } catch (error) {
        console.error('שגיאה בבדיקת תאריכי הזמנה:', error);
        return false;
      }
    });
    
    const booking = bookingsForCell.length > 0 ? bookingsForCell[0] : null;

    // בדיקה אם זה יום ראשון או אחרון בהזמנה (לצורך עיצוב)
    const isFirstDayOfBooking = booking && isSameDay(date, parseISO(booking.checkIn));
    const isLastDayOfBooking = booking && isSameDay(date, subDays(parseISO(booking.checkOut), 1));
    const isMiddleDayOfBooking = booking && !isFirstDayOfBooking && !isLastDayOfBooking;
    
    // בדיקה אם חדר חסום בתאריך זה
    const dateIsBlocked = isDateBlocked(room._id, date);
    
    // רקע התא בהתאם למצב
    let cellBackgroundColor = '#ffffff';
    if (isToday(date)) {
      cellBackgroundColor = alpha(theme.palette.info.light, 0.1);
    }
    if (dateIsBlocked) {
      cellBackgroundColor = '#ffcccc';
    }
    if (booking) {
      // צבע לפי סטטוס התשלום
      cellBackgroundColor = getStatusColor(booking.paymentStatus);
    }
    
    return (
      <Box
        sx={{
          position: 'relative',
          backgroundColor: cellBackgroundColor,
          minHeight: '140px',
          height: '100%',
          width: '100%', // וודא שיש רוחב מלא
          border: '1px solid #e0e0e0',
          borderTop: isToday(date) ? `2px solid ${theme.palette.info.main}` : '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
          p: 0.8,
          transition: 'all 0.25s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: '1 1 0', // תא ייתפס בחלק שווה מהשורה
          boxSizing: 'border-box', // גבולות והרפדים יהיו חלק מגודל התא
          margin: 0, // ללא מרווחים חיצוניים שיכולים לשבש את היישור
          // קו מחבר למצב הזמנה שנמשכת כמה ימים
          ...(isMiddleDayOfBooking && {
            '&::before': {
              content: '""',
              position: 'absolute',
              left: '-1px',
              top: '50%',
              width: 'calc(100% + 2px)', // מתפרס מעבר לגבולות האריח
              height: '6px',
              backgroundColor: getStatusColor(booking.paymentStatus).border,
              zIndex: 1
            }
          }),
          // קו חלקי בצד ימין להזמנה שמתחילה ביום זה
          ...(isFirstDayOfBooking && {
            '&::before': {
              content: '""',
              position: 'absolute',
              left: '50%',
              right: '-1px',
              top: '50%',
              width: '50%',
              height: '6px',
              backgroundColor: getStatusColor(booking.paymentStatus).border,
              zIndex: 1
            }
          }),
          // קו חלקי בצד שמאל להזמנה שמסתיימת ביום זה
          ...(isLastDayOfBooking && {
            '&::before': {
              content: '""',
              position: 'absolute',
              left: '-1px',
              right: '50%',
              top: '50%',
              width: '50%',
              height: '6px',
              backgroundColor: getStatusColor(booking.paymentStatus).border,
              zIndex: 1
            }
          }),
          '&:hover': {
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
            backgroundColor: dateIsBlocked || booking 
              ? alpha(cellBackgroundColor, 0.9) 
              : alpha(theme.palette.primary.light, 0.12),
            zIndex: 2
          }
        }}
      >
        {/* תצוגת מחיר */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: '8px',   // הרחקת התיבה מהתחתית
          right: '8px',    // הרחקת התיבה מהצד
          fontSize: '0.9rem',
          fontWeight: 'bold',
          color: dynamicPrice ? theme.palette.secondary.main : theme.palette.text.primary,
          cursor: 'pointer',
          padding: '4px 12px',  // הרחבת הפדינג עוד יותר
          borderRadius: '16px',
          backgroundColor: dynamicPrice 
            ? alpha(theme.palette.secondary.light, 0.15)
            : alpha(theme.palette.background.paper, 0.9),  // רקע אטום יותר לנראות טובה יותר
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: dynamicPrice 
              ? alpha(theme.palette.secondary.light, 0.3)
              : alpha(theme.palette.primary.light, 0.2),
            transform: 'scale(1.08)',
            boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          }
        }} onClick={() => handleOpenPriceDialog(room, date)}>
          ₪{displayPrice}
        </Box>

        {/* הצגת תוכן התא בהתאם למצב */}
        {booking ? (
          <Box
            sx={{
              height: '100%',
              width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
              cursor: 'pointer',
              pt: 2
            }}
          >
            <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                <Tooltip
                  title={
                    <Box>
                      <Typography variant="subtitle2">{booking.guest.firstName} {booking.guest.lastName}</Typography>
                      <Typography variant="body2">צ'ק-אין: {format(parseISO(booking.checkIn), 'dd/MM/yyyy')}</Typography>
                      <Typography variant="body2">צ'ק-אאוט: {format(parseISO(booking.checkOut), 'dd/MM/yyyy')}</Typography>
                      <Typography variant="body2">סטטוס: {booking.paymentStatus}</Typography>
                      <Typography variant="body2">טלפון: {booking.guest.phone}</Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Box
              onClick={() => handleOpenBookingDetails(booking)}
              sx={{
                width: '100%',
                maxWidth: '78px',
                height: '100%',
                    backgroundColor: getStatusColor(booking.paymentStatus).bg,
                    border: `2px solid ${getStatusColor(booking.paymentStatus).border}`,
                borderRadius: '4px',
                p: 0.8,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden', // מונע גלישה של תוכן מחוץ לאריח
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s',
                },
                // מוסיף אייקון ליום הצ'ק-אין
                    '&::before': isSameDay(date, parseISO(booking.checkIn)) ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '0',
                  height: '0',
                  borderStyle: 'solid',
                  borderWidth: '12px 12px 0 0',
                  borderColor: '#2196f3 transparent transparent transparent',
                } : {},
                // מוסיף אייקון ליום שלפני הצ'ק-אאוט
                    '&::after': isSameDay(date, addDays(parseISO(booking.checkOut), -1)) ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '0',
                  height: '0',
                  borderStyle: 'solid',
                  borderWidth: '0 0 12px 12px',
                  borderColor: 'transparent transparent #f44336 transparent',
                } : {}
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '0.75rem', 
                  mb: 0.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  textAlign: 'center',
                  color: '#000000'
                }} 
                noWrap
              >
                {booking.guest?.firstName || 'אורח'}
              </Typography>
              
              {/* שם משפחה בשורה נפרדת */}
              {booking.guest?.lastName && (
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    textAlign: 'center',
                    color: '#000000'
                  }}
                  noWrap
                >
                  {booking.guest.lastName}
                </Typography>
              )}
            </Box>
                </Tooltip>
            </Box>
          </Box>
        ) : dateIsBlocked ? (
          // אם התאריך חסום - מציג תצוגה של חדר חסום
          (() => {
            // קבלת פרטי החסימה
            const blockedDateInfo = getBlockedDateInfo(room._id, date);
            const isExternal = blockedDateInfo?.externalSource === 'booking.com';
            const hasGuestDetails = isExternal && 
              blockedDateInfo?.guestDetails && 
              blockedDateInfo?.guestDetails.name;
            
            return (
              <Tooltip
                title={
                  <Box>
                    <Typography variant="subtitle2">
                      {isExternal ? 'הזמנה מ-Booking.com' : 'חדר חסום'}
                    </Typography>
                    {hasGuestDetails && (
                      <>
                        <Typography variant="body2">
                          <strong>שם:</strong> {blockedDateInfo.guestDetails.name}
                        </Typography>
                        {blockedDateInfo.guestDetails.phone && (
                          <Typography variant="body2">
                            <strong>טלפון:</strong> {blockedDateInfo.guestDetails.phone}
                          </Typography>
                        )}
                        {blockedDateInfo.guestDetails.email && (
                          <Typography variant="body2">
                            <strong>אימייל:</strong> {blockedDateInfo.guestDetails.email}
                          </Typography>
                        )}
                      </>
                    )}
                    <Typography variant="body2">
                      <strong>תאריכים:</strong> {format(new Date(blockedDateInfo?.startDate), 'dd/MM/yyyy')} - {format(new Date(blockedDateInfo?.endDate), 'dd/MM/yyyy')}
                    </Typography>
                    {blockedDateInfo?.reason && (
                      <Typography variant="body2">
                        <strong>סיבה:</strong> {blockedDateInfo.reason}
                      </Typography>
                    )}
                  </Box>
                }
                arrow
                placement="top"
              >
                <Box
                  onClick={() => toggleBlockDate(room, date)}
                  sx={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: isExternal 
                      ? 'rgba(156, 39, 176, 0.15)'
                      : 'rgba(158, 158, 158, 0.15)',
                    border: isExternal
                      ? '2px dashed rgb(156, 39, 176)'
                      : '2px dashed rgb(158, 158, 158)',
                    borderRadius: '4px',
                    p: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'absolute', // תיקון חדש
                    top: 0,              // תיקון חדש
                    left: 0,             // תיקון חדש
                    right: 0,            // תיקון חדש
                    bottom: 0,           // תיקון חדש
                    margin: 'auto',      // תיקון חדש
                    boxSizing: 'border-box', // תיקון חדש
                    '&:hover': {
                      backgroundColor: isExternal
                        ? 'rgba(156, 39, 176, 0.25)'
                        : 'rgba(211, 47, 47, 0.1)',
                      borderColor: isExternal
                        ? 'rgb(156, 39, 176)'
                        : 'rgb(211, 47, 47)',
                    }
                  }}
                >
                  {isExternal ? (
                    <>
                      <EventIcon sx={{ 
                        color: hasGuestDetails 
                          ? 'rgb(156, 39, 176)' 
                          : 'rgb(158, 158, 158)', 
                        mb: 0.3
                      }} />
                      
                      {hasGuestDetails ? (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'rgb(156, 39, 176)',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {blockedDateInfo.guestDetails.name}
                        </Typography>
                      ) : (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'rgb(158, 158, 158)',
                            fontWeight: 'bold'
                          }}
                        >
                          הזמנה בוקינג
                        </Typography>
                      )}
                    </>
                  ) : (
                    <>
                      <BlockIcon sx={{ color: 'rgb(158, 158, 158)', mb: 0.5 }} />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'rgb(158, 158, 158)',
                          fontWeight: 'bold'
                        }}
                      >
                        חסום
                      </Typography>
                    </>
                  )}
                </Box>
              </Tooltip>
            );
          })()
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row', // שינוי מעמודה לשורה
            width: '100%', 
            height: '100%', 
            justifyContent: 'space-between', // מרווח שווה בין האלמנטים
            alignItems: 'center',
            opacity: 0.5,
            transition: 'opacity 0.2s',
            padding: '8px', // פדינג יותר קטן ואחיד
            '&:hover': {
              opacity: 1
            }
          }}>
            <Tooltip title="הוסף הזמנה חדשה">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenBookingDialog(room, date)}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    transform: 'scale(1.1)'
                  } 
                }}
            >
              <AddIcon />
            </IconButton>
            </Tooltip>

            <Tooltip title="חסום תאריך">
            <IconButton
              size="small"
              color="error"
                onClick={() => toggleBlockDate(room, date)}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    transform: 'scale(1.1)'
                  } 
                }}
            >
              <BlockIcon />
            </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    );
  };
  
  // רינדור שורה של חדר בלוח - עם עיצוב משופר
  const renderRoom = (room) => {
    const roomInfo = [];
    let currentDay = startDate;
    const numDays = viewMode === 'week' ? daysToShow : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    for (let i = 0; i < numDays; i++) {
      const day = addDays(currentDay, i);
      
      // בתצוגת חודש, לא מציגים ימים מחודשים אחרים
      if (viewMode === 'month' && !isSameMonth(day, currentDate)) {
        continue;
      }
      
      roomInfo.push(
        <Box 
          key={i} 
          sx={{ 
            flex: '1 1 0',
            width: '100%',
            position: 'relative',
            boxSizing: 'border-box',
            minWidth: '70px',
            margin: 0,
            padding: '4px',
          }}
        >
          {renderCell(room, day)}
        </Box>
      );
    }
    
    return (
      <Box sx={{ 
        display: 'flex', 
        width: '100%',
      }}>
        {/* תא החדר - קבוע בצד */}
        <Box sx={{ 
          width: '100px', 
          minWidth: '100px',
          p: 1, 
          borderRight: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          position: 'sticky',
          right: 0,
          zIndex: 2, // שכבה גבוהה יותר מהתאים
          boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
          boxSizing: 'border-box',
          height: '100%',
        }}>
          <Typography variant="body1">חדר {room.roomNumber}</Typography>
          <Typography variant="caption" color="textSecondary">{room.type}</Typography>
        </Box>
        
        {/* תאי התאריכים */}
        <Box sx={{ 
          display: 'flex',
          width: 'calc(100% - 100px)', // מחסיר את רוחב עמודת החדרים
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}>
          {roomInfo}
        </Box>
      </Box>
    );
  };
  
  // רינדור דיאלוג פרטי הזמנה (לא השתנה)
  const renderBookingDetailsDialog = () => {
    if (!selectedBooking) return null;
    
    const checkIn = parseISO(selectedBooking.checkIn);
    const checkOut = parseISO(selectedBooking.checkOut);
    
    return (
      <Dialog
        open={bookingDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: theme.palette.primary.main, color: 'white' }}>
          פרטי הזמנה
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                פרטי אורח
              </Typography>
              <Typography variant="body2">
                שם: {selectedBooking.guest.firstName} {selectedBooking.guest.lastName}
              </Typography>
              <Typography variant="body2">
                טלפון: {selectedBooking.guest.phone}
              </Typography>
              <Typography variant="body2">
                דוא"ל: {selectedBooking.guest.email}
              </Typography>
              <Typography variant="body2">
                ת.ז: {selectedBooking.guest.idNumber}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                פרטי ההזמנה
              </Typography>
              <Typography variant="body2">
                תאריך צ'ק-אין: {format(checkIn, 'dd/MM/yyyy')}
              </Typography>
              <Typography variant="body2">
                תאריך צ'ק-אאוט: {format(checkOut, 'dd/MM/yyyy')}
              </Typography>
              <Typography variant="body2">
                מספר לילות: {selectedBooking.nights}
              </Typography>
              <Typography variant="body2">
                חדר: {selectedBooking.room.roomNumber} ({selectedBooking.room.type})
              </Typography>
              <Typography variant="body2">
                מחיר כולל: ₪{selectedBooking.totalPrice}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                פרטי תשלום
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  סטטוס תשלום:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  >
                    <MenuItem value="לא שולם">לא שולם</MenuItem>
                    <MenuItem value="שולם">שולם</MenuItem>
                    <MenuItem value="שולם חלקית">שולם חלקית</MenuItem>
                    <MenuItem value="מבוטל">מבוטל</MenuItem>
                  </Select>
                </FormControl>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleUpdatePaymentStatus}
                  sx={{ ml: 1 }}
                >
                  עדכן
                </Button>
              </Box>
              
              {selectedBooking.paymentMethod === 'creditCard' && selectedBooking.creditCardDetails && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    אמצעי תשלום: כרטיס אשראי
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2">
                      מספר כרטיס: {showFullCardNumber 
                        ? selectedBooking.creditCardDetails.cardNumber 
                        : `xxxx-xxxx-xxxx-${selectedBooking.creditCardDetails.cardNumber.slice(-4)}`}
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={() => setShowFullCardNumber(!showFullCardNumber)}
                      sx={{ ml: 1 }}
                    >
                      {showFullCardNumber ? 'הסתר' : 'הצג מלא'}
                    </Button>
                  </Box>
                  <Typography variant="body2">
                    תוקף: {selectedBooking.creditCardDetails.expiryMonth}/{selectedBooking.creditCardDetails.expiryYear}
                  </Typography>
                  {selectedBooking.creditCardDetails.cvv && (
                    <Typography variant="body2">
                      CVV: {selectedBooking.creditCardDetails.cvv}
                    </Typography>
                  )}
                </Box>
              )}
              
              {selectedBooking.paymentMethod === 'cash' && (
                <Typography variant="body2">
                  אמצעי תשלום: מזומן
                </Typography>
              )}
              
              {selectedBooking.paymentMethod === 'bankTransfer' && (
                <Typography variant="body2">
                  אמצעי תשלום: העברה בנקאית
                </Typography>
              )}
              
              {selectedBooking.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    הערות
                  </Typography>
                  <Typography variant="body2">
                    {selectedBooking.notes}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Box>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteBooking}
              disabled={deletingBooking}
              startIcon={<DeleteIcon />}
              sx={{ mr: 1 }}
            >
              {deletingBooking ? 'מוחק...' : 'מחק הזמנה'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleSendInvoice}
              disabled={sendingInvoice}
              startIcon={<PrintIcon />}
            >
              {sendingInvoice ? 'שולח...' : 'שלח חשבונית'}
            </Button>
          </Box>
          <Button onClick={handleCloseDialog}>סגור</Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // מרכיב חדש למקרא (Legend)
  const renderLegend = () => {
    return (
      <Box>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 'bold', 
          mb: 1.5, 
          color: theme.palette.text.primary,
          borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          pb: 0.5
        }}>
          מקרא לוח שנה
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: alpha(theme.palette.success.light, 0.1),
            borderRadius: '8px',
            p: 0.8,
            pr: 1.5,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.success.light, 0.2),
              transform: 'translateY(-2px)'
            }
          }}>
            <Box sx={{ 
              width: 20, 
              height: 20, 
              backgroundColor: 'rgb(76, 175, 80)', 
              borderRadius: '50%', 
              mr: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>שולם</Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.warning.light, 0.1),
            borderRadius: '8px',
            p: 0.8,
            pr: 1.5,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.warning.light, 0.2),
              transform: 'translateY(-2px)'
            }
          }}>
            <Box sx={{ 
              width: 20, 
              height: 20, 
              backgroundColor: 'rgb(255, 152, 0)', 
              borderRadius: '50%', 
              mr: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>לא שולם / שולם חלקית</Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.error.light, 0.1),
            borderRadius: '8px',
            p: 0.8,
            pr: 1.5,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.light, 0.2),
              transform: 'translateY(-2px)'
            }
          }}>
            <Box sx={{ 
              width: 20, 
              height: 20, 
              backgroundColor: 'rgb(211, 47, 47)', 
              borderRadius: '50%', 
              mr: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>בוטל</Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.grey[300], 0.2),
            borderRadius: '8px',
            p: 0.8,
            pr: 1.5,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.grey[300], 0.3),
              transform: 'translateY(-2px)'
            }
          }}>
            <Box sx={{ 
              width: 20, 
              height: 20, 
              backgroundColor: 'rgb(158, 158, 158)', 
              borderRadius: '50%', 
              mr: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>נחסם</Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.info.light, 0.1),
            borderRadius: '8px',
            p: 0.8,
            pr: 1.5,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.info.light, 0.2),
              transform: 'translateY(-2px)'
            }
          }}>
            <Box sx={{ 
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '12px 12px 0 0',
              borderColor: '#2196f3 transparent transparent transparent',
              mr: 1,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
            }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>יום צ'ק-אין</Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.error.light, 0.1),
            borderRadius: '8px',
            p: 0.8,
            pr: 1.5,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.light, 0.2),
              transform: 'translateY(-2px)'
            }
          }}>
            <Box sx={{ 
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '0 0 12px 12px',
              borderColor: 'transparent transparent #f44336 transparent',
              mr: 1,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
            }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>יום לפני צ'ק-אאוט</Typography>
          </Box>
        </Box>
      </Box>
    );
  };
  
  // עדכון שדה בתוך אובייקט האורח
  const handleGuestFieldChange = (e) => {
    const { name, value } = e.target;
    setNewBooking(prev => ({
      ...prev,
      guest: {
        ...prev.guest,
        [name]: value
      }
    }));
  };
  
  // עדכון שדה בטופס ההזמנה
  const handleBookingFieldChange = (e) => {
    const { name, value } = e.target;
    setNewBooking(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // עדכון פרטי כרטיס אשראי
  const handleCreditCardFieldChange = (e) => {
    const { name, value } = e.target;
    setNewBooking(prev => ({
      ...prev,
      creditCardDetails: {
        ...prev.creditCardDetails,
        [name]: value
      }
    }));
  };
  
  // עדכון תאריך צ'ק-אין
  const handleCheckInDateChange = (date) => {
    // וידוא שהתאריך תקין
    if (!date || isNaN(date.getTime())) return;
    
    // אם תאריך הצ'ק-אאוט הוא לפני או שווה לתאריך הצ'ק-אין החדש
    if (selectedDates.end <= date) {
      // עדכון תאריך הצ'ק-אאוט ליום אחד אחרי
      const newCheckOutDate = addDays(date, 1);
      setSelectedDates({
        start: date,
        end: newCheckOutDate
      });
      
      // חישוב מספר לילות מעודכן
      const nights = 1;
      updateNightsAndPrice(nights);
    } else {
      setSelectedDates(prev => ({
        ...prev,
        start: date
      }));
      
      // חישוב מספר לילות מעודכן
      const nights = Math.round((selectedDates.end - date) / (1000 * 60 * 60 * 24));
      updateNightsAndPrice(nights);
    }
  };
  
  // עדכון תאריך צ'ק-אאוט
  const handleCheckOutDateChange = (date) => {
    // וידוא שהתאריך תקין
    if (!date || isNaN(date.getTime())) return;
    
    // תאריך צ'ק-אאוט חייב להיות לפחות יום אחד אחרי תאריך צ'ק-אין
    if (date <= selectedDates.start) {
      // אם התאריך לא תקין, נקבע אותו ליום אחד אחרי הצ'ק-אין
      date = addDays(selectedDates.start, 1);
      toast.info('תאריך צ\'ק-אאוט חייב להיות אחרי תאריך צ\'ק-אין');
    }
    
    setSelectedDates(prev => ({
      ...prev,
      end: date
    }));
    
    // חישוב מספר לילות מעודכן
    const nights = Math.round((date - selectedDates.start) / (1000 * 60 * 60 * 24));
    updateNightsAndPrice(nights);
  };
  
  // עדכון מספר לילות ומחיר
  const updateNightsAndPrice = (nights) => {
    if (!selectedRoom) return;
    
    const basePrice = selectedRoom.basePrice || 0;
    const totalPrice = basePrice * nights;
    
    setNewBooking(prev => ({
      ...prev,
      nights,
      totalPrice
    }));
  };
  
  // שמירת הזמנה חדשה
  const handleSaveNewBooking = async () => {
    // וידוא שכל השדות החובה מולאו
    if (!newBooking.guest.firstName || !newBooking.guest.lastName || !newBooking.guest.phone) {
      toast.error('נא למלא את כל שדות החובה');
      return;
    }
    
    if (!selectedRoom || !selectedDates.start || !selectedDates.end) {
      toast.error('נתוני החדר או התאריכים חסרים');
      return;
    }
    
    try {
      setSavingBooking(true);
      
      // יצירת אובייקט ההזמנה לשליחה
      const bookingData = {
        guest: {
          name: `${newBooking.guest.firstName} ${newBooking.guest.lastName}`,
          phone: newBooking.guest.phone,
          email: newBooking.guest.email || 'no-email@example.com'
        },
        roomId: selectedRoom._id,
        checkIn: selectedDates.start.toISOString(),
        checkOut: selectedDates.end.toISOString(),
        nights: newBooking.nights,
        totalPrice: newBooking.totalPrice,
        paymentMethod: newBooking.paymentMethod === 'creditCard' ? 'credit' : (newBooking.paymentMethod === 'bankTransfer' ? 'bank_transfer' : 'cash'),
        paymentStatus: newBooking.paymentStatus === 'שולם' ? 'paid' : 'pending',
        notes: newBooking.notes || '',
        creditCardDetails: newBooking.paymentMethod === 'creditCard' ? {
          cardNumber: newBooking.creditCardDetails.cardNumber || '',
          expiryDate: `${newBooking.creditCardDetails.expiryMonth || ''}/${newBooking.creditCardDetails.expiryYear || ''}`,
          cvv: newBooking.creditCardDetails.cvv || ''
        } : undefined
      };
      
      // שליחת בקשה לשרת ליצירת הזמנה חדשה
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/bookings`, bookingData);
      
      // הוספת ההזמנה החדשה למערך ההזמנות המקומי
      // בדיקה שקיבלנו נתונים תקינים בתשובה
      if (response.data && response.data.success) {
        // למקרה שהתשובה היא רק מזהה ההזמנה ומספר ההזמנה, ולא ההזמנה המלאה
        if (!response.data.data && response.data._id) {
          // נשתמש בנתונים ששלחנו + המזהה שקיבלנו
          const newBookingWithDetails = {
            _id: response.data._id,
            bookingNumber: response.data.bookingNumber,
            room: selectedRoom,
            checkIn: selectedDates.start.toISOString(),
            checkOut: selectedDates.end.toISOString(),
            nights: newBooking.nights,
            totalPrice: newBooking.totalPrice,
            paymentStatus: newBooking.paymentStatus === 'שולם' ? 'paid' : 'pending',
            paymentMethod: newBooking.paymentMethod,
            guest: {
              name: `${newBooking.guest.firstName} ${newBooking.guest.lastName}`,
              phone: newBooking.guest.phone,
              email: newBooking.guest.email || '',
              firstName: newBooking.guest.firstName,
              lastName: newBooking.guest.lastName,
              idNumber: newBooking.guest.idNumber || ''
            },
            notes: newBooking.notes || ''
          };
          
          setBookings(prev => [...prev, newBookingWithDetails]);
        } else if (response.data.data) {
          // אם קיבלנו את פרטי ההזמנה המלאים
          const booking = response.data.data;
          let guestFirstName = '';
          let guestLastName = '';
          
          // בדיקה שיש שם אורח ושניתן לפצל אותו
          if (booking.guest && booking.guest.name) {
            const nameParts = booking.guest.name.split(' ');
            guestFirstName = nameParts[0] || '';
            guestLastName = nameParts.slice(1).join(' ') || '';
          }
          
          const newBookingWithDetails = {
            ...booking,
            room: selectedRoom, // שימוש באובייקט החדר המלא במקום רק ה-ID
            checkIn: selectedDates.start.toISOString(),
            checkOut: selectedDates.end.toISOString(),
            paymentStatus: booking.paymentStatus === 'paid' ? 'שולם' : 'לא שולם',
            paymentMethod: booking.paymentMethod === 'credit' ? 'creditCard' : 
                           (booking.paymentMethod === 'bank_transfer' ? 'bankTransfer' : 'cash'),
            guest: {
              ...booking.guest,
              firstName: guestFirstName,
              lastName: guestLastName,
              idNumber: newBooking.guest.idNumber || ''
            }
          };
          
          setBookings(prev => [...prev, newBookingWithDetails]);
        }
        
        toast.success('ההזמנה נוצרה בהצלחה');
        setBookingDialogOpen(false);
        
        // רענון נתונים מהשרת לאחר יצירת ההזמנה
        setTimeout(() => {
          fetchBookings();
          fetchBlockedDates();
        }, 1000);
      } else {
        // אם התשובה אינה מכילה success: true
        toast.error('שגיאה ביצירת הזמנה. התשובה מהשרת אינה תקינה.');
      }
    } catch (error) {
      console.error('שגיאה ביצירת הזמנה:', error);
      console.log('פרטי השגיאה המלאים:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        errors: error.response?.data?.errors,
        fullData: error.response?.data
      });
      
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`שגיאה: ${error.response.data.message}`);
      } else {
        toast.error('שגיאה ביצירת הזמנה. אנא נסה שנית.');
      }
    } finally {
      setSavingBooking(false);
    }
  };
  
  // רינדור דיאלוג להוספת הזמנה חדשה
  const renderNewBookingDialog = () => {
    if (!selectedRoom || !selectedDates.start) return null;
    
    return (
      <Dialog
        open={bookingDialogOpen && !selectedBooking}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: theme.palette.primary.main, color: 'white' }}>
          הוספת הזמנה חדשה
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* פרטי האורח */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee', pb: 1 }}>
                פרטי האורח
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="firstName"
                label="שם פרטי *"
                fullWidth
                variant="outlined"
                value={newBooking.guest.firstName}
                onChange={handleGuestFieldChange}
                size="small"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="lastName"
                label="שם משפחה *"
                fullWidth
                variant="outlined"
                value={newBooking.guest.lastName}
                onChange={handleGuestFieldChange}
                size="small"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="טלפון *"
                fullWidth
                variant="outlined"
                value={newBooking.guest.phone}
                onChange={handleGuestFieldChange}
                size="small"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="דוא״ל"
                fullWidth
                variant="outlined"
                value={newBooking.guest.email}
                onChange={handleGuestFieldChange}
                size="small"
                type="email"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="idNumber"
                label="תעודת זהות"
                fullWidth
                variant="outlined"
                value={newBooking.guest.idNumber}
                onChange={handleGuestFieldChange}
                size="small"
              />
            </Grid>
            
            {/* פרטי ההזמנה */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee', pb: 1, mt: 2 }}>
                פרטי ההזמנה
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="חדר"
                fullWidth
                variant="outlined"
                value={selectedRoom ? `חדר ${selectedRoom.roomNumber} (${selectedRoom.type})` : ''}
                size="small"
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="nights"
                label="מספר לילות"
                fullWidth
                variant="outlined"
                value={newBooking.nights}
                onChange={(e) => {
                  const nights = Math.max(1, parseInt(e.target.value) || 1);
                  updateNightsAndPrice(nights);
                  
                  // עדכון תאריך צאוט בהתאם למספר הלילות
                  if (selectedDates.start) {
                    setSelectedDates(prev => ({
                      ...prev,
                      end: addDays(prev.start, nights)
                    }));
                  }
                }}
                size="small"
                type="number"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="תאריך צ'ק-אין"
                fullWidth
                variant="outlined"
                value={format(selectedDates.start, 'dd/MM/yyyy')}
                size="small"
                InputProps={{
                  endAdornment: (
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        const datePicker = document.getElementById('check-in-date-picker');
                        if (datePicker) datePicker.click();
                      }}
                    >
                      <TodayIcon />
                    </IconButton>
                  ),
                }}
              />
              <input
                id="check-in-date-picker"
                type="date"
                style={{ display: 'none' }}
                value={format(selectedDates.start, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  handleCheckInDateChange(date);
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="תאריך צ'ק-אאוט"
                fullWidth
                variant="outlined"
                value={format(selectedDates.end, 'dd/MM/yyyy')}
                size="small"
                helperText="לחץ על האייקון לשינוי תאריך יציאה"
                InputProps={{
                  endAdornment: (
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        // פתיחה ישירה של בוחר תאריכים במקום לחיצה על אלמנט מוסתר
                        const input = document.createElement('input');
                        input.type = 'date';
                        input.min = format(addDays(selectedDates.start, 1), 'yyyy-MM-dd');
                        input.value = format(selectedDates.end, 'yyyy-MM-dd');
                        
                        input.onchange = (e) => {
                          const date = new Date(e.target.value);
                          handleCheckOutDateChange(date);
                        };
                        
                        // פתיחת בוחר התאריכים באופן תכנותי
                        input.showPicker && input.showPicker();
                        // אם showPicker לא זמין, ננסה לדמות קליק
                        if (!input.showPicker) {
                          input.style.position = 'absolute';
                          input.style.opacity = 0;
                          document.body.appendChild(input);
                          input.click();
                          setTimeout(() => document.body.removeChild(input), 1000);
                        }
                      }}
                    >
                      <TodayIcon />
                    </IconButton>
                  ),
                }}
              />
              <input
                id="check-out-date-picker"
                type="date"
                style={{ display: 'none' }}
                value={format(selectedDates.end, 'yyyy-MM-dd')}
                min={format(addDays(selectedDates.start, 1), 'yyyy-MM-dd')} // מוסיף מגבלה של מינימום יום אחרי צ'ק-אין
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  handleCheckOutDateChange(date);
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="totalPrice"
                label="מחיר כולל"
                fullWidth
                variant="outlined"
                value={newBooking.totalPrice}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  handleBookingFieldChange({
                    target: { name: 'totalPrice', value }
                  });
                }}
                size="small"
                type="number"
                InputProps={{
                  startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₪</Typography>,
                  inputProps: { min: 0 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>סטטוס תשלום</InputLabel>
                <Select
                  name="paymentStatus"
                  value={newBooking.paymentStatus}
                  onChange={handleBookingFieldChange}
                  label="סטטוס תשלום"
                >
                  <MenuItem value="לא שולם">לא שולם</MenuItem>
                  <MenuItem value="שולם">שולם</MenuItem>
                  <MenuItem value="שולם חלקית">שולם חלקית</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>אמצעי תשלום</InputLabel>
                <Select
                  name="paymentMethod"
                  value={newBooking.paymentMethod}
                  onChange={handleBookingFieldChange}
                  label="אמצעי תשלום"
                >
                  <MenuItem value="cash">מזומן</MenuItem>
                  <MenuItem value="creditCard">כרטיס אשראי</MenuItem>
                  <MenuItem value="bankTransfer">העברה בנקאית</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* פרטי כרטיס אשראי (מוצג רק אם אמצעי התשלום הוא כרטיס אשראי) */}
            {newBooking.paymentMethod === 'creditCard' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 1, mt: 1 }}>
                    פרטי כרטיס אשראי
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    name="cardNumber"
                    label="מספר כרטיס"
                    fullWidth
                    variant="outlined"
                    value={newBooking.creditCardDetails.cardNumber}
                    onChange={handleCreditCardFieldChange}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="expiryMonth"
                    label="חודש תפוגה"
                    fullWidth
                    variant="outlined"
                    value={newBooking.creditCardDetails.expiryMonth}
                    onChange={handleCreditCardFieldChange}
                    size="small"
                    type="number"
                    InputProps={{ inputProps: { min: 1, max: 12 } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="expiryYear"
                    label="שנת תפוגה"
                    fullWidth
                    variant="outlined"
                    value={newBooking.creditCardDetails.expiryYear}
                    onChange={handleCreditCardFieldChange}
                    size="small"
                    type="number"
                    InputProps={{ inputProps: { min: new Date().getFullYear() % 100 } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="cvv"
                    label="CVV"
                    fullWidth
                    variant="outlined"
                    value={newBooking.creditCardDetails.cvv}
                    onChange={handleCreditCardFieldChange}
                    size="small"
                    type="number"
                    InputProps={{ inputProps: { min: 0, max: 999 } }}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="הערות"
                fullWidth
                variant="outlined"
                value={newBooking.notes}
                onChange={handleBookingFieldChange}
                size="small"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            ביטול
          </Button>
          <Button
            onClick={handleSaveNewBooking}
            variant="contained"
            color="primary"
            disabled={savingBooking}
            startIcon={savingBooking ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {savingBooking ? 'שומר...' : 'צור הזמנה'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // עדכון מספר ימי חסימה כאשר משנים את הערך
  const handleBlockDurationChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setBlockDuration(value);
      // עדכון תאריך סיום בהתאם למספר הימים
      if (selectedDates.start) {
        setSelectedDates(prev => ({
          ...prev,
          end: addDays(prev.start, value)
        }));
      }
    }
  };
  
  // שמירת חסימת תאריכים
  const handleSaveBlockedDates = async () => {
    if (!selectedRoom || !selectedDates.start) {
      toast.error('חסרים פרטים לחסימת החדר');
      return;
    }

    try {
      setBlockingRoom(true);
      // שליחת בקשה לשרת לחסימת החדר בתאריכים הנבחרים
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/rooms/block-dates`, {
        roomId: selectedRoom._id,
        startDate: selectedDates.start.toISOString(),
        endDate: selectedDates.end.toISOString(),
        reason: blockReason
      });
      
      // המרת תאריכים ממחרוזות לאובייקטי Date
      const newBlockedDate = {
        ...response.data.data,
        startDate: new Date(response.data.data.startDate),
        endDate: new Date(response.data.data.endDate)
      };
      
      // עדכון רשימת התאריכים החסומים
      setBlockedDates(prev => [...prev, newBlockedDate]);
      
      toast.success('החדר נחסם בהצלחה לתאריכים שנבחרו');
      handleCloseDialog();
    } catch (error) {
      console.error('שגיאה בחסימת תאריכים:', error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`שגיאה: ${error.response.data.message}`);
      } else {
        toast.error('שגיאה בחסימת תאריכים. אנא נסה שנית.');
      }
    } finally {
      setBlockingRoom(false);
    }
  };

  // הסרת חסימת תאריכים
  const handleRemoveBlockedDates = async (blockedDateId) => {
    if (!window.confirm('האם אתה בטוח שברצונך להסיר את החסימה?')) {
      return;
    }
    
    try {
      // סימון שאנחנו בתהליך הסרה של חסימה זו
      setRemovingBlockId(blockedDateId);
      
      // אם זו חסימה זמנית (מקומית בלבד), נסיר אותה רק מהמצב המקומי
      if (blockedDateId.startsWith('temp-')) {
        setBlockedDates(prev => prev.filter(item => item._id !== blockedDateId));
        toast.success('החסימה הוסרה בהצלחה');
        return;
      }
      
      // אם זו חסימה רגילה, נשלח בקשה לשרת
      await axios.delete(`${process.env.REACT_APP_API_URL}/rooms/blocked-dates/${blockedDateId}`);
      
      // עדכון הרשימה המקומית
      setBlockedDates(prev => prev.filter(item => item._id !== blockedDateId));
      
      toast.success('החסימה הוסרה בהצלחה');
    } catch (error) {
      console.error('שגיאה בהסרת חסימת תאריכים:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`שגיאה: ${error.response.data.message}`);
      } else {
        toast.error('שגיאה בהסרת החסימה. אנא נסה שנית.');
      }
      
      // במקרה של שגיאה קשה, ננסה להסיר מהמצב המקומי בכל זאת
      if (error.response && error.response.status === 404) {
        setBlockedDates(prev => prev.filter(item => item._id !== blockedDateId));
        toast.info('החסימה הוסרה מהממשק המקומי');
      }
    } finally {
      // גמרנו את תהליך ההסרה
      setRemovingBlockId(null);
    }
  };

  // פונקציה פשוטה לחסימת תאריך או הסרת חסימה
  const toggleBlockDate = async (room, date) => {
    try {
      setBlockingRoom(true);
      
      // בדיקה אם התאריך חסום
      const isBlocked = isDateBlocked(room._id, date);
      
      if (isBlocked) {
        // בדיקה אם זו חסימה מבוקינג
        const blockedDateInfo = getBlockedDateInfo(room._id, date);
        const isBookingBlock = blockedDateInfo?.externalSource === 'booking.com';
        
        if (isBookingBlock) {
          // אם זו חסימה מבוקינג, נפתח דיאלוג עריכת פרטי אורח מבוקינג
          handleOpenBookingBlockDialog(blockedDateInfo);
          setBlockingRoom(false);
          return;
        }
        
        // אם זו לא חסימה מבוקינג, המשך כרגיל - מחיקת החסימה
        const existingBlock = blockedDates.find(b =>
          (typeof b.room === 'object' ? b.room._id : b.room) === room._id &&
          date >= new Date(b.startDate) &&
          date < new Date(b.endDate)
        );
        
        if (existingBlock) {
          // מחיקת החסימה הקיימת
          await handleRemoveBlockedDates(existingBlock._id);
        }
      } else {
        // אם התאריך לא חסום, חסום אותו
        // יצירת תאריך סיום (יום אחד אחרי)
        const endDate = addDays(date, 1);
        
        // יצירת חסימה זמנית
        const tempBlock = {
          _id: `temp-${Date.now()}`,
          room: room,
          startDate: date,
          endDate: endDate,
          reason: ''
        };
        
        // הוספת החסימה הזמנית למצב
        setBlockedDates(prev => [...prev, tempBlock]);
        
        // שליחת בקשה לשרת
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/rooms/block-dates`, {
            roomId: room._id,
            startDate: date.toISOString(),
            endDate: endDate.toISOString(),
            reason: ''
          });
          
          // עדכון החסימה במצב עם המידע מהשרת
          const newBlockedDate = {
            ...response.data.data,
            startDate: new Date(response.data.data.startDate),
            endDate: new Date(response.data.data.endDate)
          };
          
          // מחליף את החסימה הזמנית בחסימה האמיתית
          setBlockedDates(prev => 
            prev
              .filter(item => item._id !== tempBlock._id)
              .concat(newBlockedDate)
          );
        } catch (err) {
          console.error("שגיאה בהוספת חסימה:", err);
          // אם נכשל, נסיר את החסימה הזמנית
          setBlockedDates(prev => prev.filter(item => item._id !== tempBlock._id));
          toast.error('שגיאה בחסימת תאריך');
        }
      }
    } catch (error) {
      console.error('שגיאה בחסימת תאריך:', error);
      toast.error('שגיאה בטיפול בתאריך');
    } finally {
      setBlockingRoom(false);
    }
  };

  // פונקציה חדשה לסנכרון יומני Booking.com
  const handleSyncBookingCalendars = async () => {
    try {
      setIsSyncing(true);
      
      // קריאה ל-API לסנכרון כל יומני ה-iCal
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/rooms/sync-all-icals`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': localStorage.getItem('token')
          }
        }
      );
      
      if (response.data.success) {
        // טעינה מחדש של הנתונים
        await fetchBlockedDates();
        
        // הצג הודעת הצלחה
        const syncResults = response.data.data.results || [];
        const totalEvents = syncResults.reduce((sum, result) => sum + (result.addedEvents || 0), 0);
        
        toast.success(`סנכרון הושלם בהצלחה! ${totalEvents} אירועים סונכרנו`);
      } else {
        toast.error('שגיאה בסנכרון: ' + (response.data.data?.error || 'פרטים לא זמינים'));
      }
    } catch (error) {
      console.error('שגיאה בסנכרון יומני Booking.com:', error);
      toast.error(
        error.response?.data?.message || 
        'שגיאה בסנכרון יומני Booking.com. אנא נסה שוב.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // פונקציה לעדכון פרטי אורח בהזמנה מבוקינג
  const handleUpdateBookingGuestData = async () => {
    if (!selectedBookingBlock) return;
    
    try {
      setUpdatingBookingBlock(true);
      
      // עדכון הנתונים בצד הלקוח
      const updatedBlockedDates = blockedDates.map(block => {
        if (block._id === selectedBookingBlock._id) {
          return {
            ...block,
            guestDetails: bookingGuestData
          };
        }
        return block;
      });
      
      setBlockedDates(updatedBlockedDates);
      
      // שליחת עדכון לשרת
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/rooms/blocked-dates/${selectedBookingBlock._id}/guest-details`,
        { guestDetails: bookingGuestData },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': localStorage.getItem('token')
          }
        }
      );
      
      toast.success('פרטי האורח עודכנו בהצלחה');
      handleCloseBookingBlockDialog();
      
    } catch (error) {
      console.error('שגיאה בעדכון פרטי אורח:', error);
      toast.error('שגיאה בעדכון פרטי האורח');
    } finally {
      setUpdatingBookingBlock(false);
    }
  };
  
  // פתיחת דיאלוג עריכת פרטי הזמנה מבוקינג
  const handleOpenBookingBlockDialog = (blockedDate) => {
    setSelectedBookingBlock(blockedDate);
    
    // איתחול פרטי האורח מהמידע הקיים
    setBookingGuestData({
      name: blockedDate?.guestDetails?.name || '',
      email: blockedDate?.guestDetails?.email || '',
      phone: blockedDate?.guestDetails?.phone || '',
      notes: blockedDate?.guestDetails?.notes || ''
    });
    
    setBookingBlockDialogOpen(true);
  };
  
  // סגירת דיאלוג עריכת פרטי הזמנה מבוקינג
  const handleCloseBookingBlockDialog = () => {
    setSelectedBookingBlock(null);
    setBookingBlockDialogOpen(false);
    setBookingGuestData({
      name: '',
      email: '',
      phone: '',
      notes: ''
    });
  };
  
  // עדכון שדות פרטי האורח
  const handleBookingGuestDataChange = (e) => {
    const { name, value } = e.target;
    setBookingGuestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // רינדור דיאלוג עריכת פרטי הזמנה מבוקינג
  const renderBookingBlockEditDialog = () => {
    const startDateFormatted = selectedBookingBlock ? 
      format(new Date(selectedBookingBlock.startDate), 'dd/MM/yyyy') : '';
    
    const endDateFormatted = selectedBookingBlock ? 
      format(new Date(selectedBookingBlock.endDate), 'dd/MM/yyyy') : '';
    
    return (
      <Dialog 
        open={bookingBlockDialogOpen} 
        onClose={handleCloseBookingBlockDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon color="primary" />
            עדכון פרטי אורח מבוקינג
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              הזמנה זו סונכרנה מ-Booking.com. עדכון הפרטים כאן לא ישפיע על המידע בבוקינג, אלא רק במערכת המקומית.
            </Alert>
            <Typography variant="subtitle1" gutterBottom>
              <strong>תאריכי שהייה:</strong> {startDateFormatted} - {endDateFormatted}
            </Typography>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              <strong>חדר:</strong> {selectedBookingBlock?.room?.roomNumber || ''}
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="שם האורח"
                name="name"
                value={bookingGuestData.name}
                onChange={handleBookingGuestDataChange}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="אימייל"
                name="email"
                value={bookingGuestData.email}
                onChange={handleBookingGuestDataChange}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="טלפון"
                name="phone"
                value={bookingGuestData.phone}
                onChange={handleBookingGuestDataChange}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="הערות"
                name="notes"
                value={bookingGuestData.notes}
                onChange={handleBookingGuestDataChange}
                variant="outlined"
                margin="normal"
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBookingBlockDialog} disabled={updatingBookingBlock}>
            ביטול
          </Button>
          <Button 
            onClick={handleUpdateBookingGuestData} 
            variant="contained" 
            color="primary"
            disabled={updatingBookingBlock}
            startIcon={updatingBookingBlock ? <CircularProgress size={20} /> : null}
          >
            {updatingBookingBlock ? 'מעדכן...' : 'שמור פרטים'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // רינדור כל רכיבי הלוח רק כאשר כל הנתונים טעונים
  if (loading && !dataInitialized) {
    return (
      <Container sx={{ mt: 3, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          טוען נתונים...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => { 
          setError(null); 
          setDataInitialized(false);
          fetchRooms(); 
        }}>
          נסה שנית
        </Button>
      </Container>
    );
  }

  // חישוב סטטיסטיקות עבור הכותרת
  const stats = getStats();

  // דיאלוג לעריכת מחיר
  const renderPriceDialog = () => {
    if (!selectedRoom || !selectedPrice) return null;

  return (
      <Dialog
        open={priceDialogOpen}
        onClose={() => setPriceDialogOpen(false)}
        aria-labelledby="price-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="price-dialog-title">
          עריכת מחיר - חדר {selectedRoom.roomNumber}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              תאריך: {format(selectedPrice.date, 'dd/MM/yyyy')}
            </Typography>
            
            <TextField
              label="מחיר"
              type="number"
              value={editedPrice}
              onChange={(e) => setEditedPrice(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">₪</InputAdornment>,
              }}
              helperText={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Typography variant="caption">
                    מחיר בסיס: ₪{selectedRoom.basePrice}
                  </Typography>
                  {selectedPrice.existingPrice && (
                    <Typography variant="caption" color="secondary">
                      מחיר נוכחי: ₪{selectedPrice.existingPrice.price}
                    </Typography>
                  )}
                </Box>
              }
            />
            
            {selectedPrice.existingPrice && (
              <Button
                onClick={() => setEditedPrice(selectedRoom.basePrice.toString())}
                sx={{ mt: 2 }}
                color="secondary"
                variant="outlined"
                startIcon={<RefreshIcon />}
              >
                איפוס למחיר בסיס
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriceDialogOpen(false)}>ביטול</Button>
          <Button 
            onClick={handleSaveDynamicPrice} 
            color="primary"
            variant="contained"
            disabled={savingPrice}
            startIcon={savingPrice ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // דיאלוג לעריכה גורפת של מחירים
  const renderBulkPriceDialog = () => {
    return (
      <Dialog
        open={bulkPriceDialogOpen}
        onClose={() => setBulkPriceDialogOpen(false)}
        aria-labelledby="bulk-price-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="bulk-price-dialog-title">
          עריכה גורפת של מחירים
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              בחר חדרים
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {rooms.map((room) => (
                <Chip
                  key={room._id}
                  label={`חדר ${room.roomNumber}`}
                  color={bulkPriceData.roomIds.includes(room._id) ? "primary" : "default"}
                  onClick={() => {
                    setBulkPriceData(prev => {
                      if (prev.roomIds.includes(room._id)) {
                        return {
                          ...prev,
                          roomIds: prev.roomIds.filter(id => id !== room._id)
                        };
                      } else {
                        return {
                          ...prev,
                          roomIds: [...prev.roomIds, room._id]
                        };
                      }
                    });
                  }}
                />
              ))}
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  מתאריך
                </Typography>
                <TextField
                  type="date"
                  value={format(bulkPriceData.startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setBulkPriceData(prev => ({
                    ...prev, 
                    startDate: new Date(e.target.value)
                  }))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  עד תאריך
                </Typography>
                <TextField
                  type="date"
                  value={format(bulkPriceData.endDate, 'yyyy-MM-dd')}
                  onChange={(e) => setBulkPriceData(prev => ({
                    ...prev, 
                    endDate: new Date(e.target.value)
                  }))}
                  fullWidth
                />
              </Grid>
            </Grid>
            
            <TextField
              label="מחיר"
              type="number"
              value={bulkPriceData.price}
              onChange={(e) => setBulkPriceData(prev => ({
                ...prev, 
                price: e.target.value
              }))}
              fullWidth
              margin="normal"
              InputProps={{
                startAdornment: <InputAdornment position="start">₪</InputAdornment>,
              }}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>ימי שבוע</InputLabel>
              <Select
                value={bulkPriceData.daysOfWeek === null ? 'all' : 'specific'}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    setBulkPriceData(prev => ({
                      ...prev, 
                      daysOfWeek: null
                    }));
                  } else {
                    setBulkPriceData(prev => ({
                      ...prev, 
                      daysOfWeek: [0, 1, 2, 3, 4] // ברירת מחדל: ימי חול
                    }));
                  }
                }}
              >
                <MenuItem value="all">כל הימים</MenuItem>
                <MenuItem value="specific">ימים ספציפיים</MenuItem>
              </Select>
            </FormControl>
            
            {bulkPriceData.daysOfWeek && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[
                  { value: 0, label: 'ראשון' },
                  { value: 1, label: 'שני' },
                  { value: 2, label: 'שלישי' },
                  { value: 3, label: 'רביעי' },
                  { value: 4, label: 'חמישי' },
                  { value: 5, label: 'שישי' },
                  { value: 6, label: 'שבת' },
                ].map((day) => (
                  <Chip
                    key={day.value}
                    label={day.label}
                    color={bulkPriceData.daysOfWeek.includes(day.value) ? "primary" : "default"}
                    onClick={() => {
                      setBulkPriceData(prev => {
                        if (prev.daysOfWeek.includes(day.value)) {
                          return {
                            ...prev,
                            daysOfWeek: prev.daysOfWeek.filter(d => d !== day.value)
                          };
                        } else {
                          return {
                            ...prev,
                            daysOfWeek: [...prev.daysOfWeek, day.value]
                          };
                        }
                      });
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleResetPrices} 
            color="error"
            disabled={savingPrice || !bulkPriceData.roomIds.length}
          >
            איפוס מחירים
          </Button>
          <Button onClick={() => setBulkPriceDialogOpen(false)}>ביטול</Button>
          <Button 
            onClick={handleBulkPriceUpdate} 
            color="primary"
            variant="contained"
            disabled={savingPrice || !bulkPriceData.roomIds.length || !bulkPriceData.price}
            startIcon={savingPrice ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            עדכון מחירים
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // פונקציית רענון גלובלית נגישה לכל החלקים בקומפוננטה
  const refreshData = () => {
    fetchBookings();
    fetchBlockedDates();
    fetchDynamicPrices();
  };
  
  const renderRow = (rooms, i) => {
    return (
      <Box
        key={i}
        sx={{
          display: 'flex',
          borderBottom: '1px solid #e0e0e0',
          width: '100%',
        }}
      >
        {rooms.map(room => renderRoom(room))}
      </Box>
    );
  };
  
  // פונקציה חדשה לבדיקת כל החסימות
  const checkAllBlockedDates = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms/blocked-dates`);
      console.log('כל החסימות במערכת:', response.data);
      
      // הצגת החסימות בחלון התראה
      const blockedDatesInfo = response.data.data.map(block => {
        return `חדר: ${block.room}, מ-${new Date(block.startDate).toLocaleDateString()} עד ${new Date(block.endDate).toLocaleDateString()}, סיבה: ${block.reason}, מזהה חיצוני: ${block.externalReference || 'אין'}`;
      }).join('\n');
      
      alert(`חסימות במערכת:\n${blockedDatesInfo}`);
    } catch (error) {
      console.error('שגיאה בקבלת חסימות:', error);
      toast.error('שגיאה בקבלת נתוני חסימות');
    }
  };

  // פונקציה למחיקת כל החסימות
  const deleteAllBlockedDates = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את כל החסימות במערכת? פעולה זו אינה הפיכה!')) {
      return;
    }
    
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/rooms/blocked-dates/all`);
      console.log('תוצאת מחיקת חסימות:', response.data);
      
      toast.success(`נמחקו ${response.data.deletedCount} חסימות בהצלחה`);
      
      // רענון הנתונים
      fetchBlockedDates();
    } catch (error) {
      console.error('שגיאה במחיקת חסימות:', error);
      toast.error('שגיאה במחיקת חסימות');
    }
  };

  // עדכון הכפתורים לתצוגה
  const renderDebugButtons = () => {
    return (
      <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button 
          variant="outlined" 
          color="warning" 
          onClick={checkAllBlockedDates}
          startIcon={<InfoIcon />}
        >
          בדיקת חסימות
        </Button>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={deleteAllBlockedDates}
          startIcon={<DeleteIcon />}
        >
          מחיקת כל החסימות
        </Button>
        <Button 
          variant="contained" 
          color="error" 
          onClick={() => disableAllICalSync(false)}
          startIcon={<BlockIcon />}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'נטרול סנכרון Booking.com'}
        </Button>
        <Button 
          variant="contained" 
          color="error" 
          onClick={() => disableAllICalSync(true)}
          startIcon={<DeleteIcon />}
          disabled={loading}
          sx={{ bgcolor: 'darkred', '&:hover': { bgcolor: 'firebrick' } }}
        >
          {loading ? <CircularProgress size={24} /> : 'נטרול סנכרון + מחיקת כל החסימות'}
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleFullRefresh}
          startIcon={<RefreshIcon />}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'רענון מלא של הנתונים'}
        </Button>
      </Box>
    );
  };
  
  // פונקציה לנטרול כל הסנכרונים מבוקינג
  const disableAllICalSync = async (forceDeleteAll = false) => {
    const message = forceDeleteAll 
      ? 'האם אתה בטוח שברצונך לנטרל את כל הסנכרונים עם Booking.com ולמחוק את כל החסימות במערכת? פעולה זו אינה הפיכה!' 
      : 'האם אתה בטוח שברצונך לנטרל את כל הסנכרונים עם Booking.com ולמחוק את החסימות הקשורות? פעולה זו אינה הפיכה!';
      
    if (!window.confirm(message)) {
      return;
    }
    
    try {
      setLoading(true);
      const url = forceDeleteAll 
        ? `${process.env.REACT_APP_API_URL}/rooms/disable-all-ical-sync?forceDeleteAll=true`
        : `${process.env.REACT_APP_API_URL}/rooms/disable-all-ical-sync`;
        
      const result = await axios.delete(url);
      console.log('תוצאת ניטרול סנכרונים:', result.data);
      
      if (result.data && result.data.success) {
        toast.success(`הסנכרון נוטרל בהצלחה! נמחקו ${result.data.deletedBlockedDates} חסימות ו-${result.data.updatedRooms} חדרים עודכנו`);
        
        // רענון הנתונים
        fetchBlockedDates();
        fetchRooms();
      } else {
        toast.warning('הפעולה הושלמה אך התשובה מהשרת לא הייתה ברורה. מומלץ לרענן את הדף.');
      }
    } catch (error) {
      console.error('שגיאה בניטרול הסנכרונים:', error);
      
      // הצגת פרטי השגיאה המלאים
      console.log('פרטי השגיאה המלאים:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        error: error.response?.data?.error,
        fullData: error.response?.data
      });
      
      // הודעת שגיאה מפורטת יותר
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`שגיאה בניטרול הסנכרונים: ${error.response.data.message}`);
      } else {
        toast.error('שגיאה בניטרול הסנכרונים מבוקינג. נסה שוב מאוחר יותר.');
      }
      
      // במקרה של שגיאה, ננסה לרענן את הנתונים בכל זאת
      fetchBlockedDates();
      fetchRooms();
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה לרענון מלא של הנתונים
  const handleFullRefresh = async () => {
    try {
      setLoading(true);
      toast.info('מרענן את כל הנתונים...');
      
      // רענון כל הנתונים
      await Promise.all([
        fetchRooms(),
        fetchBookings(),
        fetchBlockedDates(),
        fetchDynamicPrices()
      ]);
      
      toast.success('כל הנתונים רועננו בהצלחה');
    } catch (error) {
      console.error('שגיאה ברענון הנתונים:', error);
      toast.error('שגיאה ברענון הנתונים');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth={false} sx={{ mt: 2, pb: 4 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        {/* כותרת ואפשרויות לוח השנה */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom sx={{ 
              fontWeight: 'bold', 
              fontSize: '1.5rem',
              color: theme.palette.primary.dark,
              mb: 1.5
            }}>
              ניהול הזמנות - תצוגת לוח
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {/* הסרנו את הצגת הסטטיסטיקות כאן */}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {/* כפתור סנכרון יומנים */}
              <Tooltip title="סנכרון יומנים חיצוניים">
                <IconButton
                  color="primary"
                  onClick={handleSyncBookingCalendars}
                  disabled={isSyncing}
                  sx={{ 
                    ml: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    '&:hover': { 
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSyncing ? <CircularProgress size={24} /> : <CalendarIcon />}
                </IconButton>
              </Tooltip>
            
              {/* הסרנו את כפתור הסינון */}
            
              {/* כפתור עריכה גורפת של מחירים */}
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<PriceChangeIcon />}
                onClick={() => setBulkPriceDialogOpen(true)}
                size="small"
                sx={{ 
                  mr: 1,
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  '&:hover': { 
                    transform: 'translateY(-1px)',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.12)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                מחירים
              </Button>
            
              <Menu
                anchorEl={filterMenuAnchorEl}
                open={Boolean(filterMenuAnchorEl)}
                onClose={handleCloseFilterMenu}
              >
                <MenuItem onClick={() => handleFilterChange('paid')}>
                  <FormControlLabel
                    control={<Switch checked={activeFilters.paid} />}
                    label="הצג הזמנות ששולמו"
                  />
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('pending')}>
                  <FormControlLabel
                    control={<Switch checked={activeFilters.pending} />}
                    label="הצג הזמנות לא ששולמו"
                  />
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('canceled')}>
                  <FormControlLabel
                    control={<Switch checked={activeFilters.canceled} />}
                    label="הצג הזמנות שבוטלו"
                  />
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('blocked')}>
                  <FormControlLabel
                    control={<Switch checked={activeFilters.blocked} />}
                    label="הצג תאריכים חסומים"
                  />
                </MenuItem>
              </Menu>
              
            <Button
              variant="outlined"
              onClick={goToToday}
              startIcon={<CalendarIcon />}
              size="small"
              sx={{ 
                mr: 1,
                borderRadius: '8px',
                fontWeight: 'bold',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                '&:hover': { 
                  transform: 'translateY(-1px)',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.12)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              היום
            </Button>
              
              <ToggleButtonGroup
                value="month"
                exclusive
                onChange={handleChangeViewMode}
                size="small"
                sx={{ display: 'none' }} // מסתיר את הקבוצה לחלוטין
              >
                {/* השארנו את הכפתורים למקרה שנרצה להחזיר אותם בעתיד */}
                <ToggleButton value="week">
                  <Tooltip title="תצוגת שבועות">
                    <WeekIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="month">
                  <Tooltip title="תצוגת חודש">
                    <MonthIcon />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                onClick={handlePrevPeriod} 
                color="primary"
                sx={{
                  borderRadius: '8px',
                  p: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateX(2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <PrevIcon />
              </IconButton>
              <Typography variant="subtitle1" component="span" sx={{ 
                mx: 1.5, 
                fontWeight: 'bold',
                color: theme.palette.text.primary,
                fontSize: '1rem'
              }}>
                {format(currentDate, 'MMMM yyyy', { locale: he })}
              </Typography>
              <IconButton 
                onClick={handleNextPeriod} 
                color="primary"
                sx={{
                  borderRadius: '8px',
                  p: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateX(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <NextIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        <Button 
          variant="text" 
          startIcon={<InfoIcon />} 
          onClick={() => setLegendOpen(!legendOpen)}
          size="small"
          sx={{ 
            mb: 1,
            borderRadius: '8px',
            fontWeight: 'medium',
            color: theme.palette.info.main,
            '&:hover': {
              backgroundColor: alpha(theme.palette.info.main, 0.08),
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {legendOpen ? 'הסתר מקרא' : 'הצג מקרא'}
        </Button>
        
        {legendOpen && (
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              mb: 2, 
              borderRadius: '12px',
              backgroundColor: alpha(theme.palette.background.paper, 0.95),
              boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
            }}
          >
            {renderLegend()}
          </Paper>
        )}

        <Paper sx={{ 
          p: 1.5, 
          overflowX: 'auto', 
          boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
          borderRadius: '12px',
          '&::-webkit-scrollbar': {
            height: '10px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: '5px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.primary.main, 0.2),
            borderRadius: '5px',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.3),
            }
          },
          position: 'relative',
          maxWidth: '100%',
          scrollBehavior: 'smooth',
          transition: 'all 0.3s ease',
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 'fit-content' }}>
            {/* כותרות הימים */}
            {renderDaysHeader()}
            
            {/* הצגת החדרים */}
            {renderRow(rooms, 0)}
          </Box>
        </Paper>
      </Paper>
      
      {/* הדיאלוגים הקיימים */}
      {renderNewBookingDialog()}
      {renderBookingDetailsDialog()}
      
      {/* דיאלוג חדש לעריכת פרטי הזמנה מבוקינג */}
      {renderBookingBlockEditDialog()}
      
      {/* חלון ערכית מחיר */}
      {renderPriceDialog()}
      
      {/* חלון ערכיה גורפת של מחירים */}
      {renderBulkPriceDialog()}
      
      {/* כפתור לבדיקת חסימות */}
      {renderDebugButtons()}
    </Container>
  );
};

export default BookingsCalendarPage; 