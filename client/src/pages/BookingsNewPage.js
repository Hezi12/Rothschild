import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
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
  Breadcrumbs
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
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthContext } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import { alpha } from '@mui/material/styles';

// מסך ניהול הזמנות חדש ומשופר
const BookingsNewPage = () => {
  // הקשר אימות
  const { isAdmin } = useContext(AuthContext);
  
  // סטייטים
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openHardDeleteDialog, setOpenHardDeleteDialog] = useState(false);
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
  
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      // בניית מחרוזת query מהפילטרים
      let queryParams = [];
      
      if (filters.startDate) {
        queryParams.push(`startDate=${format(filters.startDate, 'yyyy-MM-dd')}`);
      }
      
      if (filters.endDate) {
        queryParams.push(`endDate=${format(filters.endDate, 'yyyy-MM-dd')}`);
      }
      
      if (filters.roomId) {
        queryParams.push(`roomId=${filters.roomId}`);
      }
      
      if (filters.guestName) {
        queryParams.push(`guestName=${filters.guestName}`);
      }
      
      if (filters.status) {
        queryParams.push(`status=${filters.status}`);
      }
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings${queryString}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setBookings(response.data.data);
      setError('');
    } catch (error) {
      console.error('שגיאה בטעינת הזמנות:', error);
      setError('שגיאה בטעינת ההזמנות');
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  // אפקט למשיכת נתונים בטעינה ראשונית
  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, [fetchRooms, fetchBookings]);
  
  // עדכון המחיר הכולל כאשר המחיר הבסיסי או התאריכים משתנים
  useEffect(() => {
    if (formData.checkIn && formData.checkOut && formData.basePrice) {
      const checkIn = new Date(formData.checkIn);
      const checkOut = new Date(formData.checkOut);
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
        response = await axios.put(
          `${process.env.REACT_APP_API_URL}/bookings/${selectedBooking._id}`,
          bookingData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        console.log("תגובת השרת לעדכון הזמנה:", response.data);
        setError('');
        alert('ההזמנה עודכנה בהצלחה');
      } else {
        // יצירת הזמנה חדשה
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/bookings`,
          bookingData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
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
      await axios.delete(`${process.env.REACT_APP_API_URL}/bookings/${selectedBooking._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
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
        await axios.post(`${process.env.REACT_APP_API_URL}/bookings/hard-delete-many`, 
          { bookingIds: selectedBookingIds },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        alert(`${selectedBookingIds.length} הזמנות נמחקו לצמיתות בהצלחה`);
        setSelectedBookingIds([]);
      } else {
        // מחיקת הזמנה בודדת
        await axios.delete(`${process.env.REACT_APP_API_URL}/bookings/${selectedBooking._id}/hard-delete`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
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
  
  const handleUpdatePaymentStatus = async (bookingId, newStatus) => {
    if (!selectedBooking) return;
    
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/bookings/${selectedBooking._id}/payment-status`,
        { 
          paymentStatus: newStatus, 
          paymentMethod: '' 
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setOpenPaymentDialog(false);
      setSelectedBooking(null);
      fetchBookings(); // רענון הזמנות
      alert('סטטוס התשלום עודכן בהצלחה');
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס תשלום:', error);
      setError(error.response?.data?.message || 'שגיאה בעדכון סטטוס התשלום');
      alert(`שגיאה: ${error.response?.data?.message || 'שגיאה בעדכון סטטוס התשלום'}`);
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
      default: return status;
    }
  };
  
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'pending': return 'error';
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
  
  // פונקציה להבאת פרטי הזמנה מהשרת
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
      
      console.log('פרטי הזמנה מהשרת:', response.data);
      
      if (response.data.success) {
        const booking = response.data.data;
        
        console.log('פרטי כרטיס אשראי:', {
          value: booking.creditCard,
          type: typeof booking.creditCard,
          exists: !!booking.creditCard,
          isObject: booking.creditCard && typeof booking.creditCard === 'object',
          keys: booking.creditCard ? Object.keys(booking.creditCard) : [],
          hasCardNumber: booking.creditCard && booking.creditCard.cardNumber,
          // שדות ספציפיים
          cardNumber: booking.creditCard?.cardNumber,
          expiryDate: booking.creditCard?.expiryDate,
          cvv: booking.creditCard?.cvv,
          cardholderName: booking.creditCard?.cardholderName
        });
        
        // עיבוד לפרטי כרטיס אשראי (מטפל במקרה שאין אובייקט, או שהוא ריק)
        const creditCard = booking.creditCard || {
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        };
        
        // תיעוד - אם אין אובייקט כרטיס אשראי או שהוא ריק
        if (!booking.creditCard || Object.keys(booking.creditCard).length === 0) {
          console.log('אין פרטי כרטיס אשראי בהזמנה, משתמש בערכי ברירת מחדל ריקים');
        }
        
        // חישוב מחיר ללילה
        let pricePerNight = 0;
        if (booking.nights && booking.nights > 0) {
          pricePerNight = booking.totalPrice / booking.nights;
        }
        
        // הגדרת ערכי טופס ברירת מחדל מהזמנה קיימת
        setFormData({
          roomId: booking.room._id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          nights: booking.nights,
          basePrice: booking.basePrice || 0,
          totalPrice: booking.totalPrice || 0,
          pricePerNight: pricePerNight,
          status: booking.status || 'confirmed',
          isTourist: booking.isTourist || false,
          notes: booking.notes || '',
          guest: {
            firstName: booking.guest?.firstName || '',
            lastName: booking.guest?.lastName || '',
            email: booking.guest?.email || '',
            phone: booking.guest?.phone || '',
            idNumber: booking.guest?.idNumber || ''
          },
          creditCard: {
            cardNumber: creditCard.cardNumber || '',
            expiryDate: creditCard.expiryDate || '',
            cvv: creditCard.cvv || '',
            cardholderName: creditCard.cardholderName || ''
          }
        });
        
        setSelectedBooking(booking);
        setOpenDialog(true);
      } else {
        setError('שגיאה בטעינת פרטי ההזמנה');
      }
    } catch (error) {
      console.error('שגיאה בטעינת פרטי ההזמנה:', error);
      setError('שגיאה בטעינת פרטי ההזמנה');
    } finally {
      setLoading(false);
    }
  };
  
  // רנדור הממשק
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ניהול הזמנות
              </Typography>
              <Tooltip title="עבור לתצוגת יומן">
                <IconButton 
                  component={RouterLink} 
                  to="/dashboard/bookings-calendar" 
                  size="small" 
                  color="primary" 
                  sx={{ 
                    ml: 1,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2)
                    }
                  }}
                >
                  <CalendarMonthIcon fontSize="small" />
                </IconButton>
              </Tooltip>
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
                            <Tooltip title={`טלפון: ${booking.guest.phone || 'לא צוין'}\nאימייל: ${booking.guest.email || 'לא צוין'}`}>
                              <Box component="span" sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                {booking.guest.firstName} {booking.guest.lastName}
                                {booking.guest.phone && (
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
          <DialogTitle>
            עדכון סטטוס תשלום
          </DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              בחר סטטוס תשלום עבור הזמנה {selectedBooking?.bookingNumber}:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              <Button
                variant="outlined"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleUpdatePaymentStatus(selectedBooking._id, 'paid')}
              >
                שולם
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleUpdatePaymentStatus(selectedBooking._id, 'pending')}
              >
                לא שולם
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPaymentDialog(false)} color="inherit">
              סגור
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