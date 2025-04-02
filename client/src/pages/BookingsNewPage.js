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
  Language as LanguageIcon,
  Assessment as AssessmentIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthContext } from '../context/AuthContext';
import { BookingContext } from '../context/BookingContext';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import BookingDialog from '../components/BookingDialog';
import { toast } from 'react-hot-toast';

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
  const theme = useTheme();
  
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
    checkIn: new Date(),
    checkOut: new Date(new Date().setDate(new Date().getDate() + 1)),
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
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
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
        checkIn: today, // שינוי מ-toISOString().split('T')[0] ל-Date
        checkOut: tomorrow, // שינוי מ-toISOString().split('T')[0] ל-Date
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
      const VAT_RATE = 0.18; // שיעור המע"מ - 18%
      
      // עדכון אוטומטי של המחיר לפי מספר הלילות כאשר משנים מחיר לילה
      if (name === 'pricePerNight' && value && prev.nights) {
        const pricePerNight = parseFloat(value);
        if (!isNaN(pricePerNight)) {
          const totalBeforeVAT = pricePerNight * prev.nights;
          const totalPrice = prev.isTourist ? totalBeforeVAT : totalBeforeVAT * (1 + VAT_RATE);
          
          updatedData.totalPrice = Math.round(totalPrice * 100) / 100;
          updatedData.basePrice = Math.round(totalBeforeVAT * 100) / 100;
        }
      }
      
      // עדכון מחיר לילה אם שינו את המחיר הכולל
      if (name === 'totalPrice' && value && prev.nights && prev.nights > 0) {
        const totalPrice = parseFloat(value);
        if (!isNaN(totalPrice)) {
          const totalBeforeVAT = prev.isTourist ? totalPrice : totalPrice / (1 + VAT_RATE);
          const pricePerNight = totalBeforeVAT / prev.nights;
          
          updatedData.pricePerNight = Math.round(pricePerNight * 100) / 100;
          updatedData.basePrice = Math.round(totalBeforeVAT * 100) / 100;
        }
      }
      
      // עדכון מחיר לילה אם שינו את מחיר בסיס
      if (name === 'basePrice' && value && prev.nights && prev.nights > 0) {
        const basePrice = parseFloat(value);
        if (!isNaN(basePrice)) {
          const totalPrice = prev.isTourist ? basePrice : basePrice * (1 + VAT_RATE);
          const pricePerNight = basePrice / prev.nights;
          
          updatedData.totalPrice = Math.round(totalPrice * 100) / 100;
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
              const totalBeforeVAT = pricePerNight * nights;
              const totalPrice = prev.isTourist ? totalBeforeVAT : totalBeforeVAT * (1 + VAT_RATE);
              
              updatedData.totalPrice = Math.round(totalPrice * 100) / 100;
              updatedData.basePrice = Math.round(totalBeforeVAT * 100) / 100;
            }
          }
        }
      }

      // עדכון מחירים אם שינו את סטטוס תייר
      if (name === 'isTourist') {
        const basePrice = parseFloat(prev.basePrice);
        if (!isNaN(basePrice)) {
          const totalPrice = value ? basePrice : basePrice * (1 + VAT_RATE);
          updatedData.totalPrice = Math.round(totalPrice * 100) / 100;
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
  
  // פונקציה לטיפול בשינוי תאריכים
  const handleDateChange = (date, field) => {
    if (!date) return;
    
    const newDate = date instanceof Date ? date : new Date(date);
    setFormData(prev => ({
      ...prev,
      [field]: newDate
    }));
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
  
  // פונקציה לטיפול בשינוי תאריכי סינון
  const handleFilterDateChange = (date, field) => {
    if (!date) return;
    
    const newDate = date instanceof Date ? date : new Date(date);
    setFilters(prev => ({
      ...prev,
      [field]: newDate
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      roomId: '',
      guestName: '',
      status: ''
    });
  };
  
  // פונקציות לשמירה, עדכון ומחיקה
  const handleSaveBooking = async (formData) => {
    try {
      console.log("נתוני הזמנה לשמירה:", formData);
      
      // בדיקה אם זו הזמנה חדשה או עריכה
      if (selectedBooking) {
        // עריכת הזמנה קיימת
        const bookingDataToUpdate = {
          roomId: formData.roomId,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          nights: formData.nights,
          totalPrice: formData.totalPrice,
          basePrice: formData.pricePerNightNoVat,
          pricePerNight: formData.pricePerNightWithVat,
          isTourist: formData.isTourist,
          guest: {
            firstName: formData.guest.firstName,
            lastName: formData.guest.lastName,
            phone: formData.guest.phone,
            email: formData.guest.email
          },
          notes: formData.notes,
          creditCard: formData.creditCard
        };

        // האם יש שינוי בסטטוס תשלום או באמצעי תשלום
        const isPaidChanged = (selectedBooking.paymentStatus === 'paid') !== formData.isPaid;
        const paymentMethodChanged = selectedBooking.paymentMethod !== formData.paymentMethod;
        
        console.log("שולח עדכון הזמנה:", {
          ...bookingDataToUpdate,
          isPaid: formData.isPaid,
          paymentMethod: formData.paymentMethod,
          isPaidChanged,
          paymentMethodChanged,
          creditCard: bookingDataToUpdate.creditCard ? "קיים" : "לא קיים"
        });
        
        let updateSuccess = true;
        let paymentUpdateSuccess = true;
        
        // עדכון פרטי ההזמנה הבסיסיים
        const response = await contextUpdateBooking(selectedBooking._id, bookingDataToUpdate);
        updateSuccess = response.success;
        
        // אם יש שינוי בסטטוס תשלום או באמצעי תשלום, נעדכן בנפרד
        if (isPaidChanged || paymentMethodChanged) {
          console.log("מעדכן סטטוס תשלום ואמצעי תשלום בנפרד:", {
            paymentStatus: formData.isPaid ? 'paid' : 'pending',
            paymentMethod: formData.paymentMethod || ''
          });
          
          const paymentResponse = await updatePaymentStatus(
            selectedBooking._id,
            formData.isPaid ? 'paid' : 'pending',
            formData.paymentMethod || ''
          );
          
          paymentUpdateSuccess = paymentResponse.success;
        }

        if (updateSuccess && paymentUpdateSuccess) {
          toast.success('ההזמנה עודכנה בהצלחה');
          setOpenDialog(false);
          contextFetchBookings(); // רענון רשימת ההזמנות
      } else {
          toast.error('שגיאה בעדכון ההזמנה');
        }
      } else {
        // יצירת הזמנה חדשה
        const response = await contextCreateBooking({
          roomId: formData.roomId,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          nights: formData.nights,
          totalPrice: formData.totalPrice,
          basePrice: formData.pricePerNightNoVat,
          pricePerNight: formData.pricePerNightWithVat,
          isTourist: formData.isTourist,
          guest: {
            firstName: formData.guest.firstName,
            lastName: formData.guest.lastName,
            phone: formData.guest.phone,
            email: formData.guest.email
          },
          paymentStatus: formData.isPaid ? 'paid' : 'pending',
          paymentMethod: formData.paymentMethod || '',
          creditCard: formData.creditCard,
          notes: formData.notes
        });

        if (response.success) {
          toast.success('ההזמנה נוצרה בהצלחה');
          setOpenDialog(false);
          contextFetchBookings(); // רענון רשימת ההזמנות
      } else {
          toast.error('שגיאה ביצירת ההזמנה');
      }
      }
    } catch (error) {
      console.error('שגיאה בשמירת ההזמנה:', error);
      toast.error(error.response?.data?.message || 'שגיאה בשמירת ההזמנה');
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
      
      const paymentMethod = method || '';
      console.log(`שולח עדכון לשרת: updatePaymentStatus(${bookingId}, ${status}, ${paymentMethod})`);
      
      const result = await updatePaymentStatus(bookingId, status, paymentMethod);
      
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
      case 'paid':
        return 'שולם';
      case 'pending':
        return 'לא שולם';
      case 'partial':
        return 'שולם חלקית';
      case 'canceled':
        return 'בוטל';
      default:
        return status;
    }
  };
  
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'partial':
        return 'info';
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const getPaymentMethodLabel = (method) => {
    if (!method) return '';
    
    switch (method) {
      case 'cash':
        return 'מזומן';
      // case 'credit':
      //   return 'כרטיס אשראי';
      case 'creditOr':
        return 'אשראי אור יהודה';
      case 'creditRothschild':
        return 'אשראי רוטשילד';
      case 'mizrahi':
        return 'העברה מזרחי';
      case 'bitMizrahi':
        return 'ביט מזרחי';
      case 'payboxMizrahi':
        return 'פייבוקס מזרחי';
      case 'poalim':
        return 'העברה פועלים';
      case 'bitPoalim':
        return 'ביט פועלים';
      case 'payboxPoalim':
        return 'פייבוקס פועלים';
      case 'other':
        return 'אחר';
      default:
        return method;
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
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/bookings/${bookingId}`,
        {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
        }
      );
      
      if (response.data && response.data.success) {
        const bookingData = response.data.data;
        console.log("נטענו פרטי הזמנה:", bookingData);
        console.log("סטטוס תשלום:", bookingData.paymentStatus);
        console.log("אמצעי תשלום:", bookingData.paymentMethod);
        
        // עדכון הטופס עם נתוני ההזמנה
        setSelectedBooking(bookingData);
        setOpenDialog(true);
      }
    } catch (error) {
      console.error('שגיאה בטעינת פרטי הזמנה:', error);
      setError('שגיאה בטעינת פרטי ההזמנה');
    } finally {
      setLoading(false);
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
            aria-label="dashboard"
          >
            <DashboardIcon sx={{ color: isActive => isActive ? '#3498db' : theme.palette.text.secondary, '&:hover': { color: '#2980b9' } }} />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="יומן הזמנות" placement="right" isActive={currentPath === '/dashboard/bookings-calendar'}>
          <IconButton
            component={RouterLink}
            to="/dashboard/bookings-calendar"
            aria-label="bookings-calendar"
          >
            <CalendarMonthIcon sx={{ color: isActive => isActive ? '#e74c3c' : theme.palette.text.secondary, '&:hover': { color: '#c0392b' } }} />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="106 / Airport" placement="right" isActive={currentPath === '/dashboard/simple-bookings'}>
          <IconButton
            component={RouterLink}
            to="/dashboard/simple-bookings"
            aria-label="airport"
          >
            <HotelIcon sx={{ color: isActive => isActive ? '#f39c12' : theme.palette.text.secondary, '&:hover': { color: '#d35400' } }} />
          </IconButton>
        </SidebarButton>

        <SidebarButton title="דו״ח הכנסות" placement="right" isActive={currentPath === '/dashboard/income-report'}>
          <IconButton
            component={RouterLink}
            to="/dashboard/income-report"
            aria-label="income-report"
          >
            <AssessmentIcon sx={{ color: isActive => isActive ? '#9b59b6' : theme.palette.text.secondary, '&:hover': { color: '#8e44ad' } }} />
          </IconButton>
        </SidebarButton>

        <SidebarButton title="ניהול פיננסי" placement="right" isActive={currentPath === '/dashboard/financial-management'}>
          <IconButton
            component={RouterLink}
            to="/dashboard/financial-management"
            aria-label="financial"
          >
            <AccountBalanceIcon sx={{ color: isActive => isActive ? '#16a085' : theme.palette.text.secondary, '&:hover': { color: '#1abc9c' } }} />
          </IconButton>
        </SidebarButton>
        
        <Box sx={{ flexGrow: 1 }} /> {/* מרווח גמיש שידחוף את האייקון הבא לתחתית */}
        
        <SidebarButton title="אתר הבית" placement="right" isActive={currentPath === '/'}>
          <IconButton
            component={RouterLink}
            to="/"
            aria-label="home"
          >
            <LanguageIcon sx={{ color: isActive => isActive ? '#2ecc71' : theme.palette.text.secondary, '&:hover': { color: '#27ae60' } }} />
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
                  onChange={(date) => handleFilterDateChange(date, 'startDate')}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="עד תאריך"
                  value={filters.endDate}
                  onChange={(date) => handleFilterDateChange(date, 'endDate')}
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
                          hover
                          selected={selectedBookingIds.includes(booking._id)}
                          onClick={() => handleOpenDialog(booking)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedBookingIds.includes(booking._id)}
                              onChange={(e) => handleSelectBooking(e, booking._id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                #{booking.bookingNumber}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {booking.room?.roomNumber || 'לא ידוע'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {booking.guest?.firstName} {booking.guest?.lastName}
                              </Typography>
                                {booking.guest?.phone && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                  {booking.guest.phone}
                                </Typography>
                                )}
                              </Box>
                          </TableCell>
                          <TableCell>
                            {new Date(booking.checkIn).toLocaleDateString('he-IL')}
                          </TableCell>
                          <TableCell>
                            {new Date(booking.checkOut).toLocaleDateString('he-IL')}
                          </TableCell>
                          <TableCell align="center">
                            {booking.nights}
                          </TableCell>
                          <TableCell align="right">
                            {booking.totalPrice ? `${booking.totalPrice} ₪` : '--'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(booking.status)}
                              color={getStatusColor(booking.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              label={getPaymentStatusLabel(booking.paymentStatus)}
                              color={getPaymentStatusColor(booking.paymentStatus)}
                              size="small"
                                sx={{ minWidth: 80 }}
                              />
                              {booking.paymentStatus === 'paid' && booking.paymentMethod && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5, 
                                  mt: 0.5,
                                  color: 'success.main',
                                  bgcolor: alpha(theme.palette.success.main, 0.1),
                                  p: '2px 8px',
                                  borderRadius: 1,
                                  fontSize: '0.75rem'
                                }}>
                                  <Box 
                                    sx={{ 
                                      width: 6, 
                                      height: 6, 
                                      borderRadius: '50%', 
                                      bgcolor: 'success.main'
                                    }} 
                                  />
                                  {getPaymentMethodLabel(booking.paymentMethod)}
                                </Box>
                              )}
                            </Box>
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
        
        {/* דיאלוג הזמנה חדשה או עריכת הזמנה */}
        <BookingDialog
          open={openDialog}
          onClose={handleCloseDialog}
          onSave={handleSaveBooking}
          rooms={rooms}
          booking={selectedBooking}
          isEdit={!!selectedBooking}
        />
        
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