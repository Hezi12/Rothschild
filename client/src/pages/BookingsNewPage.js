import React, { useState, useEffect, useCallback } from 'react';
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
  Stack
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
  Payments as PaymentsIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// מסך ניהול הזמנות חדש ומשופר
const BookingsNewPage = () => {
  // סטייטים
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
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
    totalPrice: 0
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
      setRooms(response.data.data);
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
          totalPrice: prev.basePrice * nights
        }));
      }
    }
  }, [formData.checkIn, formData.checkOut, formData.basePrice]);
  
  // פונקציות לניהול טפסים
  const handleOpenDialog = (booking = null) => {
    console.log("Opening dialog with booking:", booking);
    
    if (booking) {
      // במקום לפתוח ישירות את החלון, קוראים לפונקציה שמביאה את הפרטים מהשרת
      fetchBookingDetails(booking._id);
    } else {
      // הזמנה חדשה
      setFormData({
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
        totalPrice: 0
      });
      setSelectedBooking(null);
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBooking(null);
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('guest.')) {
      const guestField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        guest: {
          ...prev.guest,
          [guestField]: value
        }
      }));
    } else if (name.startsWith('creditCard.')) {
      const creditCardField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        creditCard: {
          ...prev.creditCard,
          [creditCardField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleDateChange = (field, date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
    
    // מעדכן לילות ומחיר כולל אם שני התאריכים קיימים
    if (field === 'checkIn' && formData.checkOut) {
      updateNightsAndTotalPrice(date, formData.checkOut);
    } else if (field === 'checkOut' && formData.checkIn) {
      updateNightsAndTotalPrice(formData.checkIn, date);
    }
  };
  
  // פונקציה לחישוב לילות ומחיר כולל
  const updateNightsAndTotalPrice = (checkIn, checkOut) => {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    if (nights > 0 && formData.basePrice) {
      setFormData(prev => ({
        ...prev,
        nights: nights,
        totalPrice: prev.basePrice * nights
      }));
    }
  };
  
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
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
      
      // בדיקת תקינות פרטי כרטיס אשראי
      if (!formData.creditCard.cardNumber) {
        alert('נא למלא מספר כרטיס אשראי');
        return;
      }
      
      if (!formData.creditCard.expiryDate) {
        alert('נא למלא תוקף כרטיס אשראי');
        return;
      }
      
      if (!formData.creditCard.cvv) {
        alert('נא למלא קוד CVV');
        return;
      }
      
      if (!formData.creditCard.cardholderName) {
        alert('נא למלא שם בעל הכרטיס');
        return;
      }
      
      // בניית אובייקט ההזמנה
      const bookingData = {
        ...formData,
        nights,
        checkIn: format(checkIn, 'yyyy-MM-dd'),
        checkOut: format(checkOut, 'yyyy-MM-dd'),
        guest: {
          ...formData.guest,
          name: `${formData.guest.firstName} ${formData.guest.lastName}`.trim()
        },
        creditCard: {
          cardNumber: formData.creditCard.cardNumber,
          expiryDate: formData.creditCard.expiryDate,
          cvv: formData.creditCard.cvv,
          cardholderName: formData.creditCard.cardholderName
        }
      };
      
      // במקרה של הזמנה חדשה, או שלא הוזן מחיר ידנית
      if ((!selectedBooking || !formData.basePrice) && rooms.length > 0 && formData.roomId) {
        const selectedRoom = rooms.find(r => r._id === formData.roomId);
        if (selectedRoom) {
          bookingData.basePrice = selectedRoom.basePrice;
          bookingData.totalPrice = selectedRoom.basePrice * nights;
        }
      } else if (formData.basePrice) {
        // אם הוזן מחיר ידנית, חשב מחדש את סה"כ
        bookingData.totalPrice = formData.basePrice * nights;
      }
      
      console.log("Saving booking with credit card details:", bookingData.creditCard);
      
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
        console.log("Updated booking response:", response.data);
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
        console.log("Created booking response:", response.data);
        setError('');
        alert('ההזמנה נוצרה בהצלחה');
      }
      
      handleCloseDialog();
      fetchBookings(); // רענון הזמנות
    } catch (error) {
      console.error('שגיאה בשמירת ההזמנה:', error);
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
  
  // פונקציה חדשה לטעינת פרטי הזמנה מהשרת
  const fetchBookingDetails = async (bookingId) => {
    try {
      console.log("Fetching booking details for ID:", bookingId);
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/bookings/${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const booking = response.data.data;
      console.log("Fetched booking details (full object):", JSON.stringify(booking));
      
      // בדיקה מעמיקה של שדה כרטיס האשראי
      console.log("Credit Card value:", booking.creditCard);
      console.log("Credit Card type:", typeof booking.creditCard);
      console.log("Credit Card fields:", booking.creditCard ? Object.keys(booking.creditCard) : "no fields");
      
      // אם אין שדה כרטיס אשראי, נדווח על כך
      if (!booking.creditCard) {
        console.error("האובייקט 'booking' לא כולל את השדה 'creditCard'");
        alert("שגיאה: חסרים פרטי כרטיס אשראי בהזמנה. יש ליצור הזמנה חדשה עם פרטי כרטיס אשראי.");
      }
      
      // כעת מגדירים את הטופס עם הנתונים המלאים מהשרת
      setFormData({
        roomId: booking.room._id,
        checkIn: new Date(booking.checkIn),
        checkOut: new Date(booking.checkOut),
        guest: { 
          firstName: booking.guest.firstName || '',
          lastName: booking.guest.lastName || '',
          phone: booking.guest.phone || '',
          email: booking.guest.email || ''
        },
        creditCard: {
          // טיפול מדויק בשדות כרטיס אשראי
          cardNumber: booking.creditCard?.cardNumber || '',
          expiryDate: booking.creditCard?.expiryDate || '',
          cvv: booking.creditCard?.cvv || '',
          cardholderName: booking.creditCard?.cardholderName || ''
        },
        isTourist: booking.isTourist || false,
        notes: booking.notes || '',
        status: booking.status || 'confirmed',
        basePrice: booking.basePrice || 0,
        totalPrice: booking.totalPrice || 0
      });
      
      setSelectedBooking(booking);
    } catch (error) {
      console.error("שגיאה בטעינת פרטי ההזמנה:", error);
      alert(`שגיאה בטעינת פרטי ההזמנה: ${error.response?.data?.message || error.message}`);
      
      // במקרה של שגיאה, סוגרים את החלון
      setOpenDialog(false);
    }
  };
  
  // רנדור הממשק
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              ניהול הזמנות
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog(null)}
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
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
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
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
        
        {/* דיאלוג הזמנה חדשה / עריכה */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>
            {selectedBooking ? 'עריכת הזמנה' : 'הזמנה חדשה'}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Grid container spacing={1}>
              {/* חלק 1: פרטי הזמנה - סידור קומפקטי יותר */}
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>חדר</InputLabel>
                  <Select
                    name="roomId"
                    value={formData.roomId}
                    onChange={handleFormChange}
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
                    onChange={handleFormChange}
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
                  onChange={handleFormChange}
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
                      onChange={handleCheckboxChange}
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
                  onChange={(date) => handleDateChange('checkIn', date)}
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
                  onChange={(date) => handleDateChange('checkOut', date)}
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
                  type="number"
                  value={formData.checkIn && formData.checkOut ? 
                    Math.ceil((new Date(formData.checkOut) - new Date(formData.checkIn)) / (1000 * 60 * 60 * 24)) : 
                    0}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ mt: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="מחיר כולל"
                  type="number"
                  value={formData.totalPrice}
                  InputProps={{
                    readOnly: true,
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
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
                  InputProps={{
                    endAdornment: formData.guest.phone ? (
                      <InputAdornment position="end">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => openWhatsApp(formData.guest.phone)}
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
                  onChange={handleFormChange}
                />
              </Grid>
              
              {/* חלק 3: פרטי כרטיס אשראי */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>
                  פרטי כרטיס אשראי
                </Typography>
                <Divider sx={{ mb: 1 }} />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="מספר כרטיס"
                  name="creditCard.cardNumber"
                  value={formData.creditCard?.cardNumber || ''}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="תוקף (MM/YY)"
                  name="creditCard.expiryDate"
                  value={formData.creditCard?.expiryDate || ''}
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="CVV"
                  name="creditCard.cvv"
                  value={formData.creditCard?.cvv || ''}
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
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
      </Container>
    </LocalizationProvider>
  );
};

export default BookingsNewPage; 