import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
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
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Stack,
  Link,
  Breadcrumbs,
  DialogContentText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Event as EventIcon,
  WhatsApp as WhatsAppIcon,
  Payments as PaymentsIcon,
  Launch as LaunchIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarMonthIcon,
  Dashboard as DashboardIcon,
  Hotel as HotelIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthContext } from '../context/AuthContext';
import { BookingContext } from '../context/BookingContext';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { alpha } from '@mui/material/styles';

// קומפוננטה חדשה - סרגל צדדי מינימליסטי
const MinimalSidebar = (props) => (
  <Box
    {...props}
    sx={{
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
      gap: '5px',
      width: '60px'
    }}
  />
);

const SidebarButton = ({ children, title, placement, isActive }) => (
  <Tooltip title={title} placement={placement || "right"}>
    {React.cloneElement(children, {
      sx: {
        padding: '12px',
        color: isActive ? theme => theme.palette.primary.main : theme => theme.palette.text.secondary,
        backgroundColor: isActive ? theme => alpha(theme.palette.primary.main, 0.1) : 'transparent',
        '&:hover': {
          backgroundColor: theme => alpha(theme.palette.primary.main, 0.05)
        },
        transition: 'all 0.3s ease',
        borderLeft: isActive ? theme => `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
        borderRight: 'none'
      }
    })}
  </Tooltip>
);

// מסך ניהול הזמנות חדש ומשופר
const BookingsNewPage = () => {
  // הקשר אימות
  const { isAdmin } = useContext(AuthContext);
  // קונטקסט הזמנות
  const { 
    bookings: contextBookings, 
    loading: contextLoading, 
    error: contextError, 
    fetchBookings: contextFetchBookings,
    createBooking: contextCreateBooking,
    updateBooking: contextUpdateBooking,
    deleteBooking: contextDeleteBooking,
    updatePaymentStatus,
  } = useContext(BookingContext);
  
  // ניתוב ומיקום נוכחי
  const location = useLocation();
  const currentPath = location.pathname;
  
  // סטייטים
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openHardDeleteDialog, setOpenHardDeleteDialog] = useState(false);
  const [tempPaymentStatus, setTempPaymentStatus] = useState('');
  const [tempPaymentMethod, setTempPaymentMethod] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedBookingIds, setSelectedBookingIds] = useState([]);
  const [formData, setFormData] = useState({
    roomId: '',
    checkIn: null,
    checkOut: null,
    guest: {
      firstName: '',
      lastName: '',
      phone: '',
      email: ''
    },
    creditCard: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    },
    isTourist: false,
    notes: '',
    status: 'confirmed',
    basePrice: 0,
    totalPrice: 0,
    nights: 0,
    pricePerNight: 0
  });
  
  // סטייטים לסינון וחיפוש
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    roomId: '',
    guestName: '',
    status: ''
  });
  
  // מצב להודעות snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // לוגיקה לטעינת נתונים מהשרת
  const fetchRooms = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      // מיון החדרים לפי מספר החדר
      const sortedRooms = [...response.data.data].sort((a, b) => a.roomNumber - b.roomNumber);
      setRooms(sortedRooms);
    } catch (error) {
      console.error('שגיאה בטעינת חדרים:', error);
      setError('שגיאה בטעינת החדרים');
    }
  }, []);
  
  // פונקציה לטעינת הזמנות עם הקונטקסט
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      await contextFetchBookings(filters);
    } catch (error) {
      console.error('שגיאה בטעינת הזמנות:', error);
      setError('שגיאה בטעינת ההזמנות');
    } finally {
      setLoading(false);
    }
  }, [filters, contextFetchBookings]);
  
  // עדכון הסטייט המקומי כשמשתנים הנתונים בקונטקסט
  useEffect(() => {
    if (contextBookings) {
      setBookings(contextBookings);
    }
    
    if (contextLoading !== undefined) {
      setLoading(contextLoading);
    }
    
    if (contextError) {
      setError(contextError);
    }
  }, [contextBookings, contextLoading, contextError]);
  
  // אפקט למשיכת נתונים בטעינה ראשונית
  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, [fetchRooms, fetchBookings]);
  
  // עדכון המחיר הכולל כאשר המחיר הבסיסי או התאריכים משתנים
  useEffect(() => {
    if (formData.checkIn && formData.checkOut && formData.basePrice) {
      const checkIn = formData.checkIn instanceof Date ? formData.checkIn : parseISO(formData.checkIn);
      const checkOut = formData.checkOut instanceof Date ? formData.checkOut : parseISO(formData.checkOut);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      
      if (nights > 0) {
        setFormData(prev => ({
          ...prev,
          totalPrice: prev.basePrice * nights,
          nights: nights,
          pricePerNight: prev.basePrice / nights
        }));
      }
    }
  }, [formData.checkIn, formData.checkOut, formData.basePrice]);
  
  // פונקציות לניהול טפסים
  const handleOpenDialog = (booking = null) => {
    console.log("פותח חלון עם הזמנה:", booking);
    
    if (booking) {
      // במקום לפתוח ישירות את החלון, קוראים לפונקציה שמביאה את הפרטים מהשרת
      fetchBookingDetails(booking._id);
    } else {
      // הזמנה חדשה
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      // איפוס הטופס להזמנה חדשה
      setFormData({
        roomId: '',
        checkIn: today.toISOString().split('T')[0],
        checkOut: tomorrow.toISOString().split('T')[0],
        nights: 1,
        basePrice: 0,
        totalPrice: 0,
        pricePerNight: 0,
        status: 'confirmed',
        isTourist: false,
        notes: '',
        guest: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          idNumber: ''
        },
        creditCard: {
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        }
      });
      setSelectedBooking(null);
      setOpenDialog(true);
    }
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBooking(null);
  };
  
  const handleFormChange = (name, value) => {
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      
      // עדכון אוטומטי של המחיר לפי מספר הלילות כאשר משנים מחיר לילה
      if (name === 'pricePerNight' && value && prev.nights) {
        const pricePerNight = parseFloat(value);
        if (!isNaN(pricePerNight)) {
          const totalPrice = pricePerNight * prev.nights;
          const basePrice = Math.round((totalPrice / 1.17) * 100) / 100;
          
          updatedData.totalPrice = totalPrice;
          updatedData.basePrice = basePrice;
        }
      }
      
      // עדכון מחיר לילה אם שינו את המחיר הכולל
      if (name === 'totalPrice' && value && prev.nights && prev.nights > 0) {
        const totalPrice = parseFloat(value);
        if (!isNaN(totalPrice)) {
          const pricePerNight = totalPrice / prev.nights;
          const basePrice = Math.round((totalPrice / 1.17) * 100) / 100;
          
          updatedData.pricePerNight = Math.round(pricePerNight * 100) / 100;
          updatedData.basePrice = basePrice;
        }
      }
      
      // עדכון מחיר לילה אם שינו את מחיר בסיס
      if (name === 'basePrice' && value && prev.nights && prev.nights > 0) {
        const basePrice = parseFloat(value);
        if (!isNaN(basePrice)) {
          const totalPrice = Math.round((basePrice * 1.17) * 100) / 100;
          const pricePerNight = totalPrice / prev.nights;
          
          updatedData.totalPrice = totalPrice;
          updatedData.pricePerNight = Math.round(pricePerNight * 100) / 100;
        }
      }
      
      // עדכון כל המחירים אם שינו את מספר הלילות
      if (name === 'nights' && value) {
        const nights = parseInt(value);
        
        if (!isNaN(nights) && nights > 0) {
          // אם יש מחיר לילה, נחשב לפיו
          if (prev.pricePerNight) {
            const pricePerNight = parseFloat(prev.pricePerNight);
            if (!isNaN(pricePerNight)) {
              updatedData.totalPrice = pricePerNight * nights;
              updatedData.basePrice = Math.round((updatedData.totalPrice / 1.17) * 100) / 100;
            }
          }
          // אם אין מחיר לילה אבל יש מחיר בסיס, נחשב לפיו
          else if (prev.basePrice) {
            const basePrice = parseFloat(prev.basePrice);
            const totalPrice = Math.round((basePrice * 1.17) * 100) / 100;
            if (!isNaN(basePrice)) {
              updatedData.totalPrice = totalPrice * nights;
              updatedData.basePrice = basePrice * nights;
              updatedData.pricePerNight = Math.round((totalPrice) * 100) / 100;
            }
          }
        }
      }
      
      // עדכון לילות אם שינו את תאריך הצ'ק-אין או אאוט
      if ((name === 'checkIn' || name === 'checkOut') && prev.checkIn && prev.checkOut) {
        try {
          const checkIn = name === 'checkIn' ? new Date(value) : new Date(prev.checkIn);
          const checkOut = name === 'checkOut' ? new Date(value) : new Date(prev.checkOut);
          
          if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
            const diffTime = checkOut.getTime() - checkIn.getTime();
            const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (nights > 0) {
              updatedData.nights = nights;
              
              // עדכון מחירים אם יש מחיר לילה
              if (prev.pricePerNight) {
                const pricePerNight = parseFloat(prev.pricePerNight);
                if (!isNaN(pricePerNight)) {
                  updatedData.totalPrice = pricePerNight * nights;
                  updatedData.basePrice = Math.round((updatedData.totalPrice / 1.17) * 100) / 100;
                }
              }
            }
          }
        } catch (e) {
          console.error('שגיאה בחישוב לילות:', e);
        }
      }
      
      // טיפול בשדות מקוננים
      if (name.startsWith('guest.')) {
        const guestField = name.split('.')[1];
        updatedData.guest = { ...prev.guest, [guestField]: value };
      } else if (name.startsWith('creditCard.')) {
        const creditCardField = name.split('.')[1];
        updatedData.creditCard = { ...prev.creditCard, [creditCardField]: value };
      }
      
      return updatedData;
    });
  };
  
  const handleDateChange = (field, newDate) => {
    handleFormChange(field, newDate);
  };
  
  const handleCheckboxChange = (event) => {
    handleFormChange(event.target.name, event.target.checked);
  };
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      roomId: '',
      guestName: '',
      status: ''
    });
  };
  
  // פונקציות לשמירה, עדכון ומחיקה
  const handleSaveBooking = async () => {
    try {
      // חישוב מספר לילות
      const checkIn = new Date(formData.checkIn);
      const checkOut = new Date(formData.checkOut);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      
      // בדיקת תקינות בסיסית
      if (!formData.roomId) {
        alert('נא לבחור חדר');
        return;
      }
      
      if (!formData.checkIn || !formData.checkOut) {
        alert('נא למלא תאריכי הגעה ועזיבה');
        return;
      }

      if (!formData.guest || !formData.guest.firstName) {
        alert('נא למלא שם פרטי');
        return;
      }
      
      // וידוא שיש אובייקט כרטיס אשראי
      if (!formData.creditCard) {
        formData.creditCard = {
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        };
      }
      
      // וידוא כי אובייקט כרטיס האשראי מלא ותקין
      const creditCardDetails = {
        cardNumber: formData.creditCard.cardNumber || '',
        expiryDate: formData.creditCard.expiryDate || '',
        cvv: formData.creditCard.cvv || '',
        cardholderName: formData.creditCard.cardholderName || ''
      };
      
      console.log('פרטי כרטיס אשראי לשמירה:', creditCardDetails);
      
      // וידוא שיש אובייקט אורח תקין
      const guestDetails = {
        firstName: formData.guest.firstName || '',
        lastName: formData.guest.lastName || '',
        email: formData.guest.email || '',
        phone: formData.guest.phone || '',
        idNumber: formData.guest.idNumber || '',
        isTourist: formData.isTourist || false
      };
      
      // בניית אובייקט ההזמנה
      const bookingData = {
        roomId: formData.roomId,
        nights,
        checkIn: format(checkIn, 'yyyy-MM-dd'),
        checkOut: format(checkOut, 'yyyy-MM-dd'),
        guest: guestDetails,
        creditCard: creditCardDetails,
        isTourist: formData.isTourist || false,
        notes: formData.notes || '',
        status: formData.status || 'confirmed',
        basePrice: formData.basePrice || 0,
        totalPrice: formData.totalPrice || 0,
        paymentStatus: 'pending'
      };
      
      console.log("אובייקט הזמנה לשרת:", JSON.stringify(bookingData));
      
      let response;
      if (selectedBooking) {
        // עדכון הזמנה קיימת
        response = await contextUpdateBooking(selectedBooking._id, bookingData);
        console.log("תגובת השרת לעדכון הזמנה:", response.data);
        setError('');
        alert('ההזמנה עודכנה בהצלחה');
      } else {
        // יצירת הזמנה חדשה
        response = await contextCreateBooking(bookingData);
        console.log("תגובת השרת ליצירת הזמנה:", response.data);
        setError('');
        alert('ההזמנה נוצרה בהצלחה');
      }
      
      // בדיקה אם הכרטיס אשראי חזר בתשובה מהשרת
      if (response.data.data.creditCard) {
        console.log('כרטיס אשראי בתשובה:', response.data.data.creditCard);
      } else {
        console.error('חסר מידע כרטיס אשראי בתשובה מהשרת');
      }
      
      handleCloseDialog();
      fetchBookings(); // רענון הזמנות
    } catch (error) {
      console.error('שגיאה בשמירת ההזמנה:', error);
      
      // הצגת פרטי שגיאה נוספים בקונסול
      if (error.response) {
        console.error('תגובת השרת:', error.response.status);
        console.error('פרטי שגיאה:', error.response.data);
      }
      
      setError(error.response?.data?.message || 'שגיאה בשמירת ההזמנה');
      alert(`שגיאה: ${error.response?.data?.message || 'שגיאה בשמירת ההזמנה'}`);
    }
  };
  
  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      await contextDeleteBooking(selectedBooking._id);
      
      setOpenDeleteDialog(false);
      setSelectedBooking(null);
      fetchBookings(); // רענון הזמנות
      alert('ההזמנה בוטלה בהצלחה');
    } catch (error) {
      console.error('שגיאה בביטול ההזמנה:', error);
      setError(error.response?.data?.message || 'שגיאה בביטול ההזמנה');
      alert(`שגיאה: ${error.response?.data?.message || 'שגיאה בביטול ההזמנה'}`);
    }
  };
  
  const handleHardDeleteBooking = async () => {
    if (!selectedBooking && selectedBookingIds.length === 0) return;

    try {
      if (selectedBookingIds.length > 0) {
        // מחיקת מספר הזמנות
        await contextDeleteBooking(selectedBookingIds);
        alert(`${selectedBookingIds.length} הזמנות נמחקו לצמיתות בהצלחה`);
        setSelectedBookingIds([]);
      } else {
        // מחיקת הזמנה בודדת
        await contextDeleteBooking(selectedBooking._id);
        alert('ההזמנה נמחקה לצמיתות בהצלחה');
      }
      
      setOpenHardDeleteDialog(false);
      setSelectedBooking(null);
      fetchBookings(); // רענון הזמנות
    } catch (error) {
      console.error('שגיאה במחיקת ההזמנה לצמיתות:', error);
      setError(error.response?.data?.message || 'שגיאה במחיקת ההזמנה לצמיתות');
      alert(`שגיאה: ${error.response?.data?.message || 'שגיאה במחיקת ההזמנה לצמיתות'}`);
    }
  };
  
  // פונקציה לטיפול בבחירת/ביטול בחירת כל ההזמנות
  const handleSelectAllBookings = (event) => {
    if (event.target.checked) {
      const allBookingIds = bookings.map(booking => booking._id);
      setSelectedBookingIds(allBookingIds);
    } else {
      setSelectedBookingIds([]);
    }
  };

  // פונקציה לטיפול בבחירת/ביטול בחירת הזמנה בודדת
  const handleSelectBooking = (event, bookingId) => {
    if (event.target.checked) {
      setSelectedBookingIds(prev => [...prev, bookingId]);
    } else {
      setSelectedBookingIds(prev => prev.filter(id => id !== bookingId));
    }
  };
  
  const handleGenerateInvoice = (bookingId) => {
    // יצירת חשבונית PDF
    const invoiceUrl = `${process.env.REACT_APP_API_URL}/bookings/${bookingId}/invoice`;
    const token = localStorage.getItem('token');
    
    // פתיחת החשבונית בחלון חדש
    window.open(`${invoiceUrl}?token=${token}`, '_blank');
  };
  
  const handleUpdatePaymentStatus = async (bookingId, status, method) => {
    console.log('===== תחילת עדכון סטטוס תשלום בדף BookingsNewPage =====');
    if (!bookingId) {
      console.error('אין מזהה הזמנה בעת ניסיון לעדכן סטטוס תשלום');
      setSnackbar({
        open: true,
        message: 'שגיאה: חסר מזהה הזמנה',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      console.log('נתוני עדכון סטטוס תשלום:', { 
        bookingId, 
        status, 
        method,
        selectedBooking: selectedBooking ? {
          bookingNumber: selectedBooking.bookingNumber,
          currentStatus: selectedBooking.paymentStatus,
          currentMethod: selectedBooking.paymentMethod
        } : null
      });
      
      // ודא שיש לנו ערכים תקינים
      if (!status) {
        console.error('חסר סטטוס תשלום');
        setSnackbar({
          open: true,
          message: 'לא ניתן לעדכן - חסר סטטוס תשלום',
          severity: 'error'
        });
        return;
      }
      
      // וידוא שיש גם אמצעי תשלום אם הסטטוס הוא 'paid'
      if (status === 'paid' && !method) {
        console.warn('מוגדר סטטוס שולם, אבל חסר אמצעי תשלום');
        // אנחנו ממשיכים למרות האזהרה, אבל מציגים התראה
        setSnackbar({
          open: true,
          message: 'לתשלומים שהושלמו מומלץ לציין גם את אמצעי התשלום',
          severity: 'warning'
        });
      }
      
      console.log(`שולח עדכון לשרת: updatePaymentStatus(${bookingId}, ${status}, ${method})`);
      
      const result = await updatePaymentStatus(bookingId, status, method);
      
      console.log('תוצאת עדכון סטטוס תשלום:', result);
      
      if (result.success) {
        console.log('עדכון סטטוס תשלום הצליח');
        
        // רענון נתוני ההזמנות כדי לראות את העדכון
        await fetchBookings();
        
        // עדכון ההזמנה הנבחרת אם היא זו שעודכנה
        if (selectedBooking && selectedBooking._id === bookingId) {
          console.log('מעדכן את ההזמנה הנבחרת במצב המקומי');
          setSelectedBooking(prevBooking => ({
            ...prevBooking,
            paymentStatus: status,
            paymentMethod: method
          }));
        }
        
        // איפוס משתני הביניים
        setTempPaymentStatus(null);
        setTempPaymentMethod(null);
        
        setOpenPaymentDialog(false);
        setSnackbar({
          open: true,
          message: 'סטטוס התשלום עודכן בהצלחה!',
          severity: 'success'
        });
      } else {
        console.error('כישלון בעדכון סטטוס תשלום:', result.error);
        setSnackbar({
          open: true,
          message: `שגיאה בעדכון סטטוס התשלום: ${result.error || 'שגיאה לא ידועה'}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('===== שגיאה בעדכון סטטוס תשלום =====');
      console.error('שגיאה בעדכון סטטוס תשלום:', error);
      console.error('פרטי השגיאה:', error.response?.data || error.message);
      
      setSnackbar({
        open: true,
        message: `שגיאה בעדכון סטטוס התשלום: ${error.message || 'שגיאה לא ידועה'}`,
        severity: 'error'
      });
    } finally {
      console.log('===== סיום עדכון סטטוס תשלום בדף BookingsNewPage =====');
      setLoading(false);
    }
  };
  
  // פונקציות עזר לתצוגה
  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'מאושר';
      case 'pending': return 'ממתין';
      case 'canceled': return 'מבוטל';
      case 'completed': return 'הסתיים';
      default: return status;
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'canceled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };
  
  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'שולם';
      case 'partial': return 'שולם חלקית';
      case 'pending': return 'לא שולם';
      case 'canceled': return 'בוטל';
      default: return status || 'לא ידוע';
    }
  };
  
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'pending': return 'error';
      case 'canceled': return 'error';
      default: return 'default';
    }
  };
  
  // פונקציה לפתיחת ווטסאפ
  const openWhatsApp = (phoneNumber) => {
    // הסרת תווים שאינם ספרות
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // בדיקה אם המספר מתחיל ב-0, אם כן - להסיר ולהוסיף 972
    let formattedNumber = cleanNumber;
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '972' + formattedNumber.substring(1);
    } else if (!formattedNumber.startsWith('972')) {
      formattedNumber = '972' + formattedNumber;
    }
    
    // פתיחת קישור ווטסאפ
    window.open(`https://wa.me/${formattedNumber}`, '_blank');
  };
  
  // פונקציה לטעינת פרטי הזמנה מהשרת
  const fetchBookingDetails = async (bookingId) => {
    setOpenDialog(true);
    
    try {
      setSelectedBooking({ loading: true });
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('פרטי הזמנה מהשרת:', response);
      
      if (response.data.success) {
        const bookingData = response.data.data;
        
        // בדיקה אם יש פרטי כרטיס אשראי
        console.log('פרטי כרטיס אשראי:', bookingData.creditCard);
        
        // המרת מחרוזות תאריך לאובייקטי Date
        if (bookingData.checkIn && typeof bookingData.checkIn === 'string') {
          bookingData.checkIn = parseISO(bookingData.checkIn);
        }
        
        if (bookingData.checkOut && typeof bookingData.checkOut === 'string') {
          bookingData.checkOut = parseISO(bookingData.checkOut);
        }
        
        // חישוב מחדש של מספר הלילות
        if (bookingData.checkIn && bookingData.checkOut) {
          const nights = Math.ceil(
            (new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / 
            (1000 * 60 * 60 * 24)
          );
          bookingData.nights = nights;
        }
        
        // וידוא שפרטי האורח קיימים ומלאים
        if (!bookingData.guest) {
          bookingData.guest = {
            firstName: 'אורח',
            lastName: 'ללא שם',
            phone: '',
            email: ''
          };
        } else {
          // בדיקה ומילוי שדות חסרים של האורח
          if ((!bookingData.guest.firstName || bookingData.guest.firstName === '') && 
              (!bookingData.guest.lastName || bookingData.guest.lastName === '')) {
            
            // אם יש שדה name, נשתמש בו לחילוץ שם פרטי ומשפחה
            if (bookingData.guest.name) {
              const nameParts = bookingData.guest.name.split(' ');
              bookingData.guest.firstName = nameParts[0] || 'אורח';
              bookingData.guest.lastName = nameParts.slice(1).join(' ') || 'ללא שם';
            } else {
              // אם אין שום שדה שם, נשתמש בערכי ברירת מחדל
              bookingData.guest.firstName = 'אורח';
              bookingData.guest.lastName = 'ללא שם';
            }
          } else {
            // ודא שהשדות לא יהיו undefined
            bookingData.guest.firstName = bookingData.guest.firstName || 'אורח';
            bookingData.guest.lastName = bookingData.guest.lastName || 'ללא שם';
          }
          
          // ודא שיש שדות טלפון ואימייל, אפילו ריקים
          bookingData.guest.phone = bookingData.guest.phone || '';
          bookingData.guest.email = bookingData.guest.email || '';
        }
        
        // עדכון הטופס עם נתוני ההזמנה
        setFormData({
          roomId: bookingData.room?._id || bookingData.roomId || '',
          checkIn: bookingData.checkIn || null,
          checkOut: bookingData.checkOut || null,
          guest: {
            firstName: bookingData.guest.firstName || 'אורח',
            lastName: bookingData.guest.lastName || 'ללא שם',
            phone: bookingData.guest.phone || '',
            email: bookingData.guest.email || ''
          },
          creditCard: bookingData.creditCard || {
            cardNumber: '',
            expiryDate: '',
            cvv: '',
            cardholderName: ''
          },
          isTourist: bookingData.isTourist || false,
          notes: bookingData.notes || '',
          status: bookingData.status || 'confirmed',
          basePrice: bookingData.basePrice || 0,
          totalPrice: bookingData.totalPrice || 0,
          nights: bookingData.nights || 0,
          pricePerNight: bookingData.pricePerNight || 0
        });
        
        setSelectedBooking(bookingData);
      }
    } catch (error) {
      console.error('שגיאה בטעינת פרטי הזמנה:', error);
      setError('שגיאה בטעינת פרטי ההזמנה');
    }
  };
  
  // רנדור הממשק
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      {/* סרגל צדדי מינימליסטי */}
      <MinimalSidebar>
        <SidebarButton title="לוח מחוונים" placement="right" isActive={currentPath === '/dashboard'}>
          <IconButton 
            component={RouterLink} 
            to="/dashboard"
            sx={{ 
              color: isActive => isActive ? '#3498db' : '#666',
              '&:hover': { color: '#2980b9' }
            }}
          >
            <DashboardIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="יומן הזמנות" placement="right" isActive={currentPath === '/dashboard/bookings-calendar'}>
          <IconButton 
            component={RouterLink} 
            to="/dashboard/bookings-calendar"
            sx={{ 
              color: isActive => isActive ? '#e74c3c' : '#666',
              '&:hover': { color: '#c0392b' }
            }}
          >
            <EventIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="106 / Airport" placement="right" isActive={currentPath === '/dashboard/simple-bookings'}>
          <IconButton 
            component={RouterLink} 
            to="/dashboard/simple-bookings"
            sx={{ 
              color: isActive => isActive ? '#f39c12' : '#666',
              '&:hover': { color: '#d35400' }
            }}
          >
            <HotelIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>

        <Box sx={{ flexGrow: 1 }} /> {/* מרווח גמיש שידחוף את האייקון הבא לתחתית */}
        
        <SidebarButton title="אתר הבית" placement="right" isActive={currentPath === '/'}>
          <IconButton 
            component={RouterLink} 
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

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, paddingLeft: '55px' }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ניהול הזמנות
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              הזמנה חדשה
            </Button>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* אזור פילטרים */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              סינון וחיפוש
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="מתאריך"
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="עד תאריך"
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>חדר</InputLabel>
                  <Select
                    value={filters.roomId}
                    onChange={(e) => handleFilterChange('roomId', e.target.value)}
                    label="חדר"
                  >
                    <MenuItem value="">הכל</MenuItem>
                    {rooms.map((room) => (
                      <MenuItem key={room._id} value={room._id}>
                        {room.internalName || `חדר ${room.roomNumber}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="שם אורח"
                  value={filters.guestName}
                  onChange={(e) => handleFilterChange('guestName', e.target.value)}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>סטטוס</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label="סטטוס"
                  >
                    <MenuItem value="">הכל</MenuItem>
                    <MenuItem value="confirmed">מאושר</MenuItem>
                    <MenuItem value="pending">ממתין</MenuItem>
                    <MenuItem value="canceled">מבוטל</MenuItem>
                    <MenuItem value="completed">הסתיים</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={fetchBookings}
                    fullWidth
                    startIcon={<SearchIcon />}
                  >
                    חיפוש
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={resetFilters}
                    fullWidth
                    startIcon={<RefreshIcon />}
                  >
                    איפוס
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* טבלת הזמנות */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : (
            <>
              {isAdmin() && selectedBookingIds.length > 0 && (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setOpenHardDeleteDialog(true)}
                  >
                    מחיקה לצמיתות ({selectedBookingIds.length})
                  </Button>
                </Box>
              )}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedBookingIds.length > 0 && selectedBookingIds.length < bookings.length}
                          checked={bookings.length > 0 && selectedBookingIds.length === bookings.length}
                          onChange={handleSelectAllBookings}
                        />
                      </TableCell>
                      <TableCell>מס' הזמנה</TableCell>
                      <TableCell>חדר</TableCell>
                      <TableCell>אורח</TableCell>
                      <TableCell>צ'ק אין</TableCell>
                      <TableCell>צ'ק אאוט</TableCell>
                      <TableCell>לילות</TableCell>
                      <TableCell>מחיר</TableCell>
                      <TableCell>סטטוס</TableCell>
                      <TableCell>תשלום</TableCell>
                      <TableCell>פעולות</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center">
                          לא נמצאו הזמנות
                        </TableCell>
                      </TableRow>
                    ) : (
                      bookings.map((booking) => (
                        <TableRow 
                          key={booking._id}
                          sx={{ 
                            backgroundColor: booking.status === 'canceled' ? '#f5f5f5' : 'inherit',
                            opacity: booking.status === 'canceled' ? 0.7 : 1
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedBookingIds.includes(booking._id)}
                              onChange={(event) => handleSelectBooking(event, booking._id)}
                            />
                          </TableCell>
                          <TableCell>{booking.bookingNumber}</TableCell>
                          <TableCell>
                            {booking.room?.internalName || `חדר ${booking.room?.roomNumber}`}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={`טלפון: ${booking.guest?.phone || 'לא צוין'}\nאימייל: ${booking.guest?.email || 'לא צוין'}`}>
                              <Box component="span" sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                {/* בדיקה מורחבת למיקום שם האורח */}
                                {booking.guest ? (
                                  <>
                                    {/* אפשרות 1: שמות בנפרד בתוך guest */}
                                    {booking.guest.firstName || booking.guest.firstName === '' ? booking.guest.firstName : ''}
                                    {' '}
                                    {booking.guest.lastName || booking.guest.lastName === '' ? booking.guest.lastName : ''}
                                    
                                    {/* אפשרות 2: שם בשדה name בתוך guest */}
                                    {!booking.guest.firstName && !booking.guest.lastName && booking.guest.name ? booking.guest.name : ''}
                                    
                                    {/* אפשרות 3: כשאין כלום בכלל */}
                                    {!booking.guest.firstName && !booking.guest.lastName && !booking.guest.name ? 'אורח ללא שם' : ''}
                                  </>
                                ) : 'אורח ללא שם'}
                                
                                {booking.guest?.phone && (
                                  <IconButton 
                                    size="small" 
                                    color="primary" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openWhatsApp(booking.guest.phone);
                                    }}
                                    title="פתח בווטסאפ"
                                    sx={{ ml: 1 }}
                                  >
                                    <WhatsAppIcon style={{ color: '#25D366' }} fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {format(new Date(booking.checkIn), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            {format(new Date(booking.checkOut), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>{booking.nights}</TableCell>
                          <TableCell>
                            {booking.totalPrice.toLocaleString()} ₪
                            {booking.isTourist && (
                              <Chip size="small" label="תייר" color="info" sx={{ ml: 1 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(booking.status)}
                              color={getStatusColor(booking.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getPaymentStatusLabel(booking.paymentStatus)}
                              color={getPaymentStatusColor(booking.paymentStatus)}
                              size="small"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setOpenPaymentDialog(true);
                              }}
                              clickable
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <IconButton 
                                color="primary" 
                                size="small"
                                onClick={() => handleOpenDialog(booking)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                color="error" 
                                size="small"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setOpenDeleteDialog(true);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                color="info" 
                                size="small"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setOpenPaymentDialog(true);
                                }}
                              >
                                <PaymentsIcon fontSize="small" />
                              </IconButton>
                              {/* אייקון חשבונית */}
                              <Tooltip title="הפקת חשבונית PDF">
                               <IconButton 
                                 color="primary" 
                                 size="small"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleGenerateInvoice(booking._id);
                                 }}
                               >
                                 <ReceiptIcon fontSize="small" />
                               </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
        
        {/* דיאלוג הזמנה חדשה / עריכה */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>
            {selectedBooking ? 'עריכת הזמנה' : 'הזמנה חדשה'}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
              <Link component={RouterLink} to="/dashboard">
                ראשי
              </Link>
              <Link component={RouterLink} to="/dashboard/bookings">
                הזמנות
              </Link>
              <Typography color="textPrimary">
                {selectedBooking ? `עריכת הזמנה #${selectedBooking?.bookingNumber}` : 'הזמנה חדשה'}
              </Typography>
            </Breadcrumbs>
            <Grid container spacing={1}>
              {/* חלק 1: פרטי הזמנה - סידור קומפקטי יותר */}
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>חדר</InputLabel>
                  <Select
                    name="roomId"
                    value={formData.roomId}
                    onChange={(e) => handleFormChange('roomId', e.target.value)}
                    label="חדר"
                    size="small"
                  >
                    <MenuItem value="">בחר חדר</MenuItem>
                    {rooms.map((room) => (
                      <MenuItem key={room._id} value={room._id}>
                        {room.internalName || `חדר ${room.roomNumber}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>סטטוס</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    label="סטטוס"
                    size="small"
                  >
                    <MenuItem value="confirmed">מאושר</MenuItem>
                    <MenuItem value="pending">ממתין</MenuItem>
                    <MenuItem value="canceled">מבוטל</MenuItem>
                    <MenuItem value="completed">הסתיים</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="מחיר בסיס ללילה"
                  name="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => handleFormChange('basePrice', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isTourist}
                      onChange={(e) => handleFormChange('isTourist', e.target.checked)}
                      name="isTourist"
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                      <Typography variant="body2">תייר (פטור ממע"מ)</Typography>
                    </Box>
                  }
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="תאריך צ'ק אין"
                  value={formData.checkIn}
                  onChange={(date) => handleFormChange('checkIn', date)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      size: "small",
                      margin: "dense"
                    } 
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="תאריך צ'ק אאוט"
                  value={formData.checkOut}
                  onChange={(date) => handleFormChange('checkOut', date)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      size: "small",
                      margin: "dense"
                    } 
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="לילות"
                  name="nights"
                  type="number"
                  value={formData.nights}
                  onChange={(e) => handleFormChange('nights', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">לילות</InputAdornment>,
                  }}
                  sx={{ mt: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="מחיר ללילה"
                  name="pricePerNight"
                  type="number"
                  value={formData.pricePerNight}
                  onChange={(e) => handleFormChange('pricePerNight', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                  }}
                  sx={{ mt: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="מחיר כולל מע״מ"
                  name="totalPrice"
                  type="number"
                  value={formData.totalPrice}
                  onChange={(e) => handleFormChange('totalPrice', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                  }}
                  sx={{ mt: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="מחיר ללא מע״מ"
                  name="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => handleFormChange('basePrice', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                  }}
                  sx={{ mt: 1 }}
                />
              </Grid>
              
              {/* חלק 2: פרטי אורח */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>
                  פרטי אורח
                </Typography>
                <Divider sx={{ mb: 1 }} />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="שם פרטי"
                  name="guest.firstName"
                  value={formData.guest.firstName}
                  onChange={(e) => handleFormChange('guest.firstName', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="שם משפחה"
                  name="guest.lastName"
                  value={formData.guest.lastName}
                  onChange={(e) => handleFormChange('guest.lastName', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="טלפון"
                  name="guest.phone"
                  value={formData.guest.phone}
                  onChange={(e) => handleFormChange('guest.phone', e.target.value)}
                  InputProps={{
                    endAdornment: formData.guest.phone ? (
                      <InputAdornment position="end">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={(e) => openWhatsApp(formData.guest.phone)}
                          title="פתח בווטסאפ"
                        >
                          <WhatsAppIcon style={{ color: '#25D366' }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="אימייל"
                  name="guest.email"
                  value={formData.guest.email}
                  onChange={(e) => handleFormChange('guest.email', e.target.value)}
                />
              </Grid>
              
              {/* חלק 3: פרטי כרטיס אשראי */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>
                    פרטי כרטיס אשראי
                  </Typography>
                  <Tooltip title="מערכת ניהול כרטיסי אשראי CreditGuard">
                    <IconButton 
                      color="primary" 
                      size="small" 
                      component={Link} 
                      href="https://console.creditguard.co.il/html/mainFrames.html" 
                      target="_blank"
                      sx={{ ml: 1, mt: 0.5 }}
                    >
                      <LaunchIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Divider sx={{ mb: 1 }} />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="מספר כרטיס"
                  name="creditCard.cardNumber"
                  value={formData.creditCard?.cardNumber || ''}
                  onChange={(e) => handleFormChange('creditCard.cardNumber', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="תוקף (MM/YY)"
                  name="creditCard.expiryDate"
                  value={formData.creditCard?.expiryDate || ''}
                  onChange={(e) => handleFormChange('creditCard.expiryDate', e.target.value)}
                  placeholder="MM/YY"
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="שם בעל הכרטיס"
                  name="creditCard.cardholderName"
                  value={formData.creditCard?.cardholderName || ''}
                  onChange={(e) => handleFormChange('creditCard.cardholderName', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="CVV"
                  name="creditCard.cvv"
                  value={formData.creditCard?.cvv || ''}
                  onChange={(e) => handleFormChange('creditCard.cvv', e.target.value)}
                />
              </Grid>
              
              {/* חלק 4: הערות */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="הערות"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit" size="small">
              ביטול
            </Button>
            <Button
              onClick={handleSaveBooking}
              variant="contained"
              color="primary"
              size="small"
              disabled={!formData.roomId || !formData.checkIn || !formData.checkOut || !formData.guest?.firstName || !formData.guest?.lastName}
            >
              שמירה
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* דיאלוג ביטול הזמנה */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>
            ביטול הזמנה
          </DialogTitle>
          <DialogContent>
            <Typography>
              האם אתה בטוח שברצונך לבטל את ההזמנה {selectedBooking?.bookingNumber}?
              <br />
              פעולה זו אינה הפיכה.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">
              ביטול
            </Button>
            <Button
              onClick={handleDeleteBooking}
              variant="contained"
              color="error"
            >
              בטל הזמנה
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* דיאלוג עדכון סטטוס תשלום */}
        <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
          <DialogTitle>עדכון סטטוס תשלום</DialogTitle>
          <DialogContent>
            <DialogContentText>
              בחר סטטוס תשלום חדש ואמצעי תשלום:
            </DialogContentText>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>סטטוס תשלום</InputLabel>
                <Select
                  value={tempPaymentStatus || (selectedBooking ? selectedBooking.paymentStatus : 'pending')}
                  onChange={(e) => setTempPaymentStatus(e.target.value)}
                  label="סטטוס תשלום"
                >
                  <MenuItem value="pending">לא שולם</MenuItem>
                  <MenuItem value="partial">שולם חלקית</MenuItem>
                  <MenuItem value="paid">שולם</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>אמצעי תשלום</InputLabel>
                <Select
                  value={tempPaymentMethod || (selectedBooking ? selectedBooking.paymentMethod : '')}
                  onChange={(e) => setTempPaymentMethod(e.target.value)}
                  label="אמצעי תשלום"
                >
                  <MenuItem value="credit">כרטיס אשראי</MenuItem>
                  <MenuItem value="creditOr">אשראי אור יהודה</MenuItem>
                  <MenuItem value="creditRothschild">אשראי רוטשילד</MenuItem>
                  <MenuItem value="cash">מזומן</MenuItem>
                  <MenuItem value="mizrahi">מזרחי</MenuItem>
                  <MenuItem value="poalim">פועלים</MenuItem>
                  <MenuItem value="other">אחר</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPaymentDialog(false)} color="inherit">
              ביטול
            </Button>
            <Button 
              onClick={() => handleUpdatePaymentStatus(selectedBooking?._id, tempPaymentStatus, tempPaymentMethod)} 
              color="primary" 
              variant="contained"
            >
              עדכון
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* דיאלוג מחיקה לצמיתות */}
        <Dialog open={openHardDeleteDialog} onClose={() => setOpenHardDeleteDialog(false)}>
          <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
            מחיקה לצמיתות
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ mt: 2, mb: 1 }}>
              <strong>אזהרה חמורה!</strong>
            </Typography>
            {selectedBookingIds.length > 0 ? (
              <>
                <Typography>
                  האם אתה בטוח שברצונך למחוק לצמיתות {selectedBookingIds.length} הזמנות?
                </Typography>
                <Typography sx={{ mt: 2, color: 'error.main' }}>
                  פעולה זו תמחק את כל ההזמנות שנבחרו באופן מוחלט מהמערכת ואינה ניתנת לשחזור!
                </Typography>
              </>
            ) : (
              <>
                <Typography>
                  האם אתה בטוח שברצונך למחוק לצמיתות את ההזמנה {selectedBooking?.bookingNumber}?
                </Typography>
                <Typography sx={{ mt: 2, color: 'error.main' }}>
                  פעולה זו תמחק את ההזמנה באופן מוחלט מהמערכת ואינה ניתנת לשחזור!
                </Typography>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenHardDeleteDialog(false)} color="inherit">
              ביטול
            </Button>
            <Button
              onClick={handleHardDeleteBooking}
              variant="contained"
              color="error"
            >
              מחק לצמיתות
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default BookingsNewPage; 