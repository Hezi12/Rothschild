import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  Stepper, 
  Step, 
  StepLabel,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  useTheme,
  useMediaQuery,
  Container,
  MobileStepper,
  StepContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { addDays, differenceInDays } from 'date-fns';
import HotelIcon from '@mui/icons-material/Hotel';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import { alpha } from '@mui/material/styles';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockIcon from '@mui/icons-material/Lock';
import InfoIcon from '@mui/icons-material/Info';
import { EventAvailable as EventAvailableIcon, EventBusy as EventBusyIcon } from '@mui/icons-material';

const steps = ['בחירת תאריכים', 'פרטי אורח', 'פרטי תשלום', 'סיכום'];

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const initialCheckIn = location.state?.checkIn || null;
  const initialCheckOut = location.state?.checkOut || null;
  const initialRoomId = location.state?.selectedRoomId || location.state?.roomId || null;
  const initialGuests = location.state?.guests || 1;
  const initialRooms = location.state?.rooms || 1;
  
  // אם יש תאריכים וחדר, התחל משלב פרטי האורח (שלב 1) במקום משלב בחירת תאריכים (שלב 0)
  const initialStep = (initialCheckIn && initialCheckOut && initialRoomId) ? 1 : 0;
  
  const [activeStep, setActiveStep] = useState(initialStep);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [bookingId, setBookingId] = useState('');
  
  // פרטי הזמנה
  const [bookingData, setBookingData] = useState({
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
    roomId: initialRoomId || '',
    guests: initialGuests,
    rooms: initialRooms,
    guest: {
      firstName: '',
      lastName: '',
      phone: '',
      email: ''
    },
    isTourist: false,
    paymentMethod: 'credit',
    creditCardDetails: {
      cardNumber: '',
      expiryDate: '',
      cvv: ''
    },
    notes: ''
  });
  
  // חישובים
  const [calculations, setCalculations] = useState({
    nights: 0,
    basePrice: 0,
    vatRate: 18,
    vatAmount: 0,
    totalPrice: 0
  });

  const typeToDisplayName = {
    'standard': 'Standard',
    'deluxe': 'Deluxe',
    'suite': 'Suite'
  };

  // טעינת פרטי החדר
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        
        // מזהה החדר
        const roomId = initialRoomId || (location.search ? new URLSearchParams(location.search).get('roomId') : null);
        
        // אם אין מזהה חדר, קח את החדר הסטנדרטי (מספר 6)
        let url = '';
        if (roomId) {
          url = `${process.env.REACT_APP_API_URL}/rooms/${roomId}`;
        } else {
          url = `${process.env.REACT_APP_API_URL}/rooms`;
        }
        
        const response = await axios.get(url);
        
        // אם זו רשימת חדרים, ניקח את הראשון (כאשר אין מזהה ספציפי)
        let selectedRoom;
        if (roomId) {
          selectedRoom = response.data.data;
        } else {
          // מציאת החדר הסטנדרטי (חדר 6)
          const rooms = response.data.data;
          selectedRoom = rooms.find(r => r.roomNumber === 6) || rooms[0];
        }
        
        if (selectedRoom) {
          setRoom(selectedRoom);
        } else {
          setError('החדר המבוקש לא נמצא.');
        }
      } catch (error) {
        console.error('שגיאה בטעינת החדר:', error);
        setError('חלה שגיאה בטעינת פרטי החדר. אנא נסה שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoom();
  }, [initialRoomId, location.search]);

  // חישוב מספר הלילות
  const calculateNights = () => {
    if (bookingData.checkIn && bookingData.checkOut) {
      try {
        const startDate = new Date(bookingData.checkIn);
        const endDate = new Date(bookingData.checkOut);
        
        // וידוא שהתאריכים תקפים
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error('תאריכים לא תקפים:', { checkIn: bookingData.checkIn, checkOut: bookingData.checkOut });
          return 0;
        }
        
        const nights = differenceInDays(endDate, startDate);
        return nights > 0 ? nights : 0;
      } catch (error) {
        console.error('שגיאה בחישוב מספר הלילות:', error);
        return 0;
      }
    }
    return 0;
  };

  // בדיקת זמינות אוטומטית בהתחלה אם יש כבר תאריכים וחדר
  useEffect(() => {
    if (initialCheckIn && initialCheckOut && initialRoomId && room && activeStep > 0) {
      // בדיקת זמינות שקטה כאשר עולה הדף
      const checkRoomAvailability = async () => {
        try {
          setCheckingAvailability(true);
          
          // בדיקת זמינות אמיתית מול השרת
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/rooms/check-availability`, {
            roomId: initialRoomId,
            checkIn: initialCheckIn,
            checkOut: initialCheckOut,
            isTourist: bookingData.isTourist
          });
          
          if (!response.data.isAvailable) {
            setError('החדר אינו זמין בתאריכים שנבחרו. אנא בחר תאריכים אחרים.');
            navigate('/');
            return;
          }
          
          // עדכון מחירים מהשרת
          setCalculations({
            nights: response.data.nights || calculateNights(),
            basePrice: response.data.basePrice || (room.basePrice * calculateNights()),
            vatRate: 18,
            vatAmount: response.data.vatAmount || (bookingData.isTourist ? 0 : (response.data.basePrice || (room.basePrice * calculateNights())) * 0.18),
            totalPrice: response.data.totalPrice || ((room.basePrice * calculateNights()) + (bookingData.isTourist ? 0 : (room.basePrice * calculateNights()) * 0.18))
          });
        } catch (error) {
          console.error('שגיאה בבדיקת זמינות:', error);
          setError('שגיאה בבדיקת זמינות החדר. אנא נסה שוב מאוחר יותר.');
          // במקרה של שגיאה נחזור לדף הבית
          navigate('/');
        } finally {
          setCheckingAvailability(false);
        }
      };
      
      checkRoomAvailability();
    }
  }, [room, initialCheckIn, initialCheckOut, initialRoomId, activeStep]);

  // חישוב מחירים כאשר משתנים תאריכים או סטטוס תייר
  useEffect(() => {
    if (bookingData.checkIn && bookingData.checkOut && room) {
      const nights = calculateNights();
      const basePrice = nights * (room.basePrice || 400);  // ברירת מחדל 400 ₪
      const vatRate = 18; // אחוז המע"מ
      const vatAmount = bookingData.isTourist ? 0 : basePrice * (vatRate / 100);
      const totalPrice = basePrice + vatAmount;
      
      // וידוא שכל הערכים הם מספרים תקפים
      setCalculations({
        nights: nights || 0,
        basePrice: basePrice || 0,
        vatRate: vatRate,
        vatAmount: vatAmount || 0,
        totalPrice: isNaN(totalPrice) ? 0 : totalPrice
      });
    }
  }, [bookingData.checkIn, bookingData.checkOut, bookingData.isTourist, room]);

  // בדיקת זמינות החדר
  const checkAvailability = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut) {
      toast.error('אנא בחר תאריכי צ׳ק-אין וצ׳ק-אאוט');
      return false;
    }
    
    if (calculateNights() < 1) {
      toast.error('תאריך צ׳ק-אאוט חייב להיות לפחות יום אחד אחרי צ׳ק-אין');
      return false;
    }
    
    try {
      setCheckingAvailability(true);
      setError(null);
      
      // אם לא נבחר חדר ספציפי, בדוק את כל החדרים הזמינים
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/rooms/check-availability`, {
        roomId: bookingData.roomId || null,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        isTourist: bookingData.isTourist
      });
      
      const isAvailable = response.data.isAvailable;
      
      if (!isAvailable) {
        toast.error('החדר אינו זמין בתאריכים שנבחרו. אנא בחר תאריכים אחרים.');
        return false;
      }
      
      // עדכון מחירים מהשרת אם זמינים
      if (response.data.totalPrice) {
        setCalculations({
          ...calculations,
          basePrice: response.data.basePrice || calculations.basePrice,
          totalPrice: response.data.totalPrice || calculations.totalPrice,
          nights: response.data.nights || calculations.nights
        });
      }
      
      return true;
    } catch (error) {
      console.error('שגיאה בבדיקת זמינות:', error);
      toast.error('שגיאה בבדיקת זמינות החדר. אנא נסה שוב מאוחר יותר.');
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  // טיפול בשינוי שדות
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    // טיפול מיוחד במספר כרטיס אשראי - הוספת רווחים כל 4 ספרות
    if (name === 'creditCardDetails.cardNumber') {
      // הסרת כל התווים שאינם ספרות
      const digitsOnly = value.replace(/\D/g, '');
      
      // הוספת רווחים כל 4 ספרות
      let formattedValue = '';
      for (let i = 0; i < digitsOnly.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formattedValue += ' ';
        }
        formattedValue += digitsOnly[i];
      }
      
      // הגבלה ל-19 תווים (16 ספרות + 3 רווחים)
      formattedValue = formattedValue.slice(0, 19);
      
      setBookingData(prev => ({
        ...prev,
        creditCardDetails: {
          ...prev.creditCardDetails,
          cardNumber: formattedValue
        }
      }));
      return;
    }
    
    // טיפול מיוחד בתאריך תוקף - הוספת / אוטומטית
    if (name === 'creditCardDetails.expiryDate') {
      // הסרת כל התווים שאינם ספרות
      const digitsOnly = value.replace(/\D/g, '');
      
      // פורמט בצורת MM/YY
      let formattedValue = '';
      if (digitsOnly.length <= 2) {
        formattedValue = digitsOnly;
      } else {
        formattedValue = `${digitsOnly.substring(0, 2)}/${digitsOnly.substring(2, 4)}`;
      }
      
      // הגבלה ל-5 תווים (4 ספרות + סלאש)
      formattedValue = formattedValue.slice(0, 5);
      
      setBookingData(prev => ({
        ...prev,
        creditCardDetails: {
          ...prev.creditCardDetails,
          expiryDate: formattedValue
        }
      }));
      return;
    }
    
    // טיפול רגיל בשאר השדות
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setBookingData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // טיפול בשינוי תאריכים
  const handleDateChange = (name, date) => {
    setBookingData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  // מעבר לשלב הבא
  const handleNext = async () => {
    // בדיקות תקינות לפי השלב הנוכחי
    if (activeStep === 0) {
      // בשלב בחירת תאריכים, בדוק שנבחרו תאריכים ושהחדר זמין
      const isAvailable = await checkAvailability();
      if (!isAvailable) return;
    } else if (activeStep === 1) {
      // בשלב פרטי אורח, בדוק שהוכנסו כל הפרטים הנדרשים
      if (!bookingData.guest.firstName || !bookingData.guest.lastName || !bookingData.guest.phone || !bookingData.guest.email) {
        toast.error('אנא מלא את כל פרטי האורח');
        return;
      }
      
      // בדיקת תקינות כתובת אימייל בסיסית
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(bookingData.guest.email)) {
        toast.error('אנא הכנס כתובת אימייל תקינה');
        return;
      }
      
      // בדיקת תקינות מספר טלפון בסיסית
      if (!/^\d{9,10}$/.test(bookingData.guest.phone.replace(/[-\s]/g, ''))) {
        toast.error('אנא הכנס מספר טלפון תקין');
        return;
      }
    } else if (activeStep === 2) {
      // בשלב פרטי תשלום, בדוק שהוכנסו פרטי תשלום תקינים
      if (bookingData.paymentMethod === 'credit') {
        if (!bookingData.creditCardDetails.cardNumber || 
            !bookingData.creditCardDetails.expiryDate || 
            !bookingData.creditCardDetails.cvv) {
          toast.error('אנא מלא את כל פרטי כרטיס האשראי');
          return;
        }
        
        // בדיקת תקינות פרטי כרטיס אשראי באמצעות הפונקציה שכבר קיימת
        if (!isPaymentDetailsValid()) {
          toast.error('פרטי כרטיס האשראי אינם תקינים');
          return;
        }
      }
    }
    
    // עובר לשלב הבא
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  // חזרה לשלב הקודם
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // שליחת ההזמנה
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // הכנת אובייקט ההזמנה לשליחה
      const bookingPayload = {
        roomId: bookingData.roomId,
        checkIn: bookingData.checkIn instanceof Date ? bookingData.checkIn.toISOString() : bookingData.checkIn,
        checkOut: bookingData.checkOut instanceof Date ? bookingData.checkOut.toISOString() : bookingData.checkOut,
        nights: calculations.nights,
        basePrice: calculations.basePrice,
        vatRate: calculations.vatRate,
        vatAmount: calculations.vatAmount,
        totalPrice: calculations.totalPrice,
        isTourist: bookingData.isTourist,
        guest: {
          firstName: bookingData.guest.firstName,
          lastName: bookingData.guest.lastName,
          email: bookingData.guest.email,
          phone: bookingData.guest.phone,
          country: bookingData.guest.country || 'ישראל'
        },
        status: 'confirmed',
        paymentStatus: 'pending',
        notes: bookingData.notes
      };
      
      console.log('שולח הזמנה:', bookingPayload);
      
      // שליחת ההזמנה לשרת
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/bookings`, bookingPayload);
      
      // בדיקה אם יש מספר הזמנה בתשובה
      let bookingNumber = '';
      if (response.data.data && response.data.data.bookingNumber) {
        bookingNumber = response.data.data.bookingNumber;
      } else if (response.data.bookingNumber) {
        bookingNumber = response.data.bookingNumber;
      } else {
        console.log('לא נמצא מספר הזמנה בתשובה:', response.data);
      }
      
      setBookingId(bookingNumber);
      setActiveStep(activeStep + 1);
      toast.success('ההזמנה נשלחה בהצלחה!');
    } catch (error) {
      console.error('שגיאה בשליחת ההזמנה:', error);
      
      let errorMessage = 'אירעה שגיאה בשליחת ההזמנה. אנא נסה שוב.';
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = 'נתונים שגויים. אנא בדוק את הפרטים שהזנת.';
        } else if (error.response.status === 500) {
          errorMessage = 'שגיאת שרת. אנא נסה שוב מאוחר יותר.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // חזרה לדף הבית
  const handleReset = () => {
    navigate('/');
  };

  // חישוב מחיר סופי
  const calculateTotalPrice = (basePrice) => {
    const nights = calculateNights();
    if (!nights || nights <= 0 || !basePrice) return 0;
    return basePrice * nights;
  };

  // תצוגת שלב 1 - בחירת תאריכים
  const renderDateSelection = () => (
    <Box>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        component="h1" 
        align="center" 
        gutterBottom 
        sx={{ mb: 3, fontWeight: 'bold' }}
      >
        הזמנת חדר
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          borderRadius: 2,
          mb: { xs: 3, sm: 4 }
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="תאריך הגעה"
                value={bookingData.checkIn}
                onChange={(date) => handleDateChange('checkIn', date)}
                format="dd/MM/yyyy"
                disablePast
                slotProps={{
                  textField: {
                    variant: "outlined",
                    fullWidth: true,
                    error: Boolean(error && error.includes('תאריך')),
                    InputLabelProps: { shrink: true }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="תאריך עזיבה"
                value={bookingData.checkOut}
                onChange={(date) => handleDateChange('checkOut', date)}
                format="dd/MM/yyyy"
                disablePast
                minDate={bookingData.checkIn ? addDays(new Date(bookingData.checkIn), 1) : null}
                slotProps={{
                  textField: {
                    variant: "outlined",
                    fullWidth: true,
                    error: Boolean(error && error.includes('תאריך')),
                    InputLabelProps: { shrink: true }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="מספר אורחים"
                value={bookingData.guests}
                onChange={handleChange}
                name="guests"
                fullWidth
                variant="outlined"
                SelectProps={{
                  native: true
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="מספר חדרים"
                value={bookingData.rooms}
                onChange={handleChange}
                name="rooms"
                fullWidth
                variant="outlined"
                SelectProps={{
                  native: true
                }}
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isTourist"
                    checked={bookingData.isTourist}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label={
                  <Typography fontWeight="medium">
                    אני תייר (פטור ממע״מ)
                  </Typography>
                }
              />
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ ml: 4 }}
              >
                תיירים מחו"ל זכאים לפטור ממע"מ. המחירים יוצגו ללא מע"מ (18%).
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={checkAvailability}
                disabled={checkingAvailability}
                fullWidth
                size="large"
                sx={{ mt: 1 }}
              >
                {checkingAvailability ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'בדוק זמינות'
                )}
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>
      
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          component="h2" 
          gutterBottom 
          align="center"
          sx={{ mb: 2, fontWeight: 'bold' }}
        >
          חדרים זמינים
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : availableRooms.length > 0 ? (
          <Grid container spacing={3}>
            {availableRooms.map((room) => (
              <Grid item xs={12} sm={6} md={4} key={room._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer',
                    border: bookingData.roomId === room._id ? `2px solid ${theme.palette.primary.main}` : 'none',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => {
                    setBookingData({
                      ...bookingData,
                      roomId: room._id,
                      totalPrice: calculateTotalPrice(room.basePrice || room.price)
                    });
                  }}
                >
                  <Box
                    sx={{
                      height: 160,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      component="img"
                      src={room.images?.[0]?.url || '/images/placeholder.jpg'}
                      alt={`חדר ${typeToDisplayName[room.type] || room.type}`}
                      sx={{
                        height: '100%',
                        width: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontWeight: 'bold'
                      }}
                    >
                      ₪{room.basePrice || room.price} / לילה
                    </Box>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      חדר {typeToDisplayName[room.type] || room.type}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {room.description}
                    </Typography>
                    <Box sx={{ mt: 'auto', pt: 1 }}>
                      <Button
                        variant={bookingData.roomId === room._id ? "contained" : "outlined"}
                        fullWidth
                        size={isMobile ? "small" : "medium"}
                        onClick={() => {
                          setBookingData({
                            ...bookingData,
                            roomId: room._id,
                            totalPrice: calculateTotalPrice(room.basePrice || room.price)
                          });
                        }}
                      >
                        {bookingData.roomId === room._id ? 'נבחר' : 'בחר חדר זה'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 2,
              py: { xs: 1.5, sm: 2 }
            }}
          >
            <Typography variant="body1">אין חדרים זמינים לתאריכים שבחרת. אנא בחר תאריכים אחרים.</Typography>
          </Alert>
        )}
      </Box>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          disabled={!bookingData.roomId}
          onClick={handleNext}
          size={isMobile ? "medium" : "large"}
          sx={{ 
            minWidth: isMobile ? 150 : 200,
            py: { xs: 1, sm: 1.5 },
            fontWeight: 'bold'
          }}
        >
          המשך להזמנה
        </Button>
      </Box>
    </Box>
  );

  // תצוגת שלב 2 - פרטי אורח
  const renderGuestDetails = () => (
    <Box>
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}` 
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            pb: 1, 
            mb: 2, 
            borderBottom: `1px solid ${theme.palette.divider}`,
            fontWeight: 'bold',
            color: theme.palette.primary.main
          }}
        >
          פרטי האורח
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="שם פרטי"
              name="guest.firstName"
              value={bookingData.guest.firstName}
              onChange={handleChange}
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="שם משפחה"
              name="guest.lastName"
              value={bookingData.guest.lastName}
              onChange={handleChange}
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="טלפון"
              name="guest.phone"
              value={bookingData.guest.phone}
              onChange={handleChange}
              placeholder="050-1234567"
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="אימייל"
              name="guest.email"
              type="email"
              value={bookingData.guest.email}
              onChange={handleChange}
              placeholder="your@email.com"
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mt: 1, 
                borderRadius: 2,
                borderColor: bookingData.isTourist ? theme.palette.primary.main : theme.palette.divider,
                backgroundColor: bookingData.isTourist ? `${theme.palette.primary.main}10` : 'transparent',
                transition: 'all 0.3s ease'
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    name="isTourist"
                    checked={bookingData.isTourist}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label={
                  <Typography fontWeight="medium">
                    אני תייר (פטור ממע״מ)
                  </Typography>
                }
              />
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  ml: 4, 
                  mt: 0.5,
                  pr: 1, 
                  borderRight: `2px solid ${theme.palette.primary.light}` 
                }}
              >
                תיירים מחו"ל זכאים לפטור ממע"מ. לצורך קבלת הפטור יש להציג דרכון זר בתוקף
                ואישור כניסה לישראל (חותמת ביקורת גבולות) בעת הצ'ק-אין.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="הערות מיוחדות"
              name="notes"
              multiline
              rows={3}
              value={bookingData.notes}
              onChange={handleChange}
              placeholder="בקשות מיוחדות, זמן הגעה משוער או כל מידע אחר שיעזור לנו להתכונן לביקורך"
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  // תצוגת שלב 3 - פרטי תשלום
  const renderPaymentDetails = () => (
    <Box>
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}` 
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            pb: 1, 
            mb: 2, 
            borderBottom: `1px solid ${theme.palette.divider}`,
            fontWeight: 'bold',
            color: theme.palette.primary.main
          }}
        >
          אבטחת הזמנה
        </Typography>
        
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            borderRadius: 2
          }}
        >
          <Typography variant="body2" fontWeight="medium">
            פרטי האשראי נדרשים לצורך הבטחת ההזמנה בלבד (פיקדון).
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            התשלום עצמו יתבצע בעת הצ'ק-אין במזומן, בהעברה בנקאית, או באמצעות ביט/פייבוקס.
          </Typography>
        </Alert>
        
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2.5, 
            mb: 2, 
            borderRadius: 2,
            borderColor: theme.palette.divider,
            backgroundColor: alpha(theme.palette.background.paper, 0.7)
          }}
        >
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            sx={{ 
              fontWeight: 'medium',
              mb: 2,
              color: theme.palette.primary.dark,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <CreditCardIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
            פרטי כרטיס אשראי לפיקדון
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="מספר כרטיס אשראי"
                name="creditCardDetails.cardNumber"
                value={bookingData.creditCardDetails.cardNumber}
                onChange={handleChange}
                placeholder="0000 0000 0000 0000"
                InputProps={{
                  sx: { borderRadius: 1.5 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="תוקף (MM/YY)"
                name="creditCardDetails.expiryDate"
                value={bookingData.creditCardDetails.expiryDate}
                onChange={handleChange}
                placeholder="MM/YY"
                InputProps={{
                  sx: { borderRadius: 1.5 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="קוד אבטחה (CVV)"
                name="creditCardDetails.cvv"
                value={bookingData.creditCardDetails.cvv}
                onChange={handleChange}
                type="password"
                placeholder="***"
                InputProps={{
                  sx: { borderRadius: 1.5 }
                }}
              />
            </Grid>
          </Grid>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: 2,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <LockIcon sx={{ mr: 1, fontSize: '0.9rem' }} />
            כל פרטי האשראי מוצפנים ומאובטחים לחלוטין.
          </Typography>
        </Paper>
      </Paper>
    </Box>
  );

  // תצוגת שלב 4 - סיכום
  const renderSummary = () => (
    <Box>
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}` 
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            pb: 1, 
            mb: 2, 
            borderBottom: `1px solid ${theme.palette.divider}`,
            fontWeight: 'bold',
            color: theme.palette.primary.main
          }}
        >
          סיכום הזמנה
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'medium',
                  display: 'flex',
                  alignItems: 'center',
                  color: theme.palette.primary.dark
                }}
              >
                <HotelIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                פרטי החדר:
              </Typography>
              <Box 
                sx={{ 
                  ml: 3, 
                  pl: 2, 
                  borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.3)}` 
                }}
              >
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>חדר:</b> {typeToDisplayName[room.type] || room.type}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>צ'ק-אין:</b> {bookingData.checkIn instanceof Date && !isNaN(bookingData.checkIn) 
                    ? bookingData.checkIn.toLocaleDateString('he-IL') 
                    : 'לא צוין תאריך תקף'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>צ'ק-אאוט:</b> {bookingData.checkOut instanceof Date && !isNaN(bookingData.checkOut) 
                    ? bookingData.checkOut.toLocaleDateString('he-IL') 
                    : 'לא צוין תאריך תקף'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>לילות:</b> {calculations.nights}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>אורחים:</b> {bookingData.guests}
                </Typography>
                <Typography variant="body2">
                  <b>חדרים:</b> {bookingData.rooms}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'medium',
                  display: 'flex',
                  alignItems: 'center',
                  color: theme.palette.primary.dark
                }}
              >
                <PersonIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                פרטי האורח:
              </Typography>
              <Box 
                sx={{ 
                  ml: 3, 
                  pl: 2, 
                  borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.3)}` 
                }}
              >
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>שם מלא:</b> {bookingData.guest.firstName} {bookingData.guest.lastName}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>טלפון:</b> {bookingData.guest.phone}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>אימייל:</b> {bookingData.guest.email}
                </Typography>
                {bookingData.notes && (
                  <Typography variant="body2">
                    <b>הערות:</b> {bookingData.notes}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'medium',
                  display: 'flex',
                  alignItems: 'center',
                  color: theme.palette.primary.dark
                }}
              >
                <PaymentIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                פרטי תשלום:
              </Typography>
              <Box 
                sx={{ 
                  ml: 3, 
                  pl: 2, 
                  borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.3)}` 
                }}
              >
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>מחיר בסיס:</b> {calculations.basePrice.toFixed(2)} ₪
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>מע"מ ({bookingData.isTourist ? 'פטור' : '18%'}):</b> {calculations.vatAmount.toFixed(2)} ₪
                </Typography>
                <Typography variant="body2" sx={{ 
                  mt: 1.5,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  color: theme.palette.primary.main
                }}>
                  סה"כ לתשלום: {calculations.totalPrice.toFixed(2)} ₪
                </Typography>
                {bookingData.isTourist && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    *פטור ממע"מ לתיירים בהצגת דרכון בצ'ק-אין
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box sx={{ my: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'medium',
                  display: 'flex',
                  alignItems: 'center',
                  color: theme.palette.text.primary,
                  mb: 1
                }}
              >
                <InfoIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                מדיניות ביטול
              </Typography>
              <Box sx={{ pl: 3, mt: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EventAvailableIcon sx={{ mr: 1, color: 'success.main', fontSize: '1rem' }} />
                  ביטול עד 3 ימים לפני ההגעה - ללא עלות
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventBusyIcon sx={{ mr: 1, color: 'error.main', fontSize: '1rem' }} />
                  ביטול פחות מ-3 ימים לפני ההגעה - חיוב במחיר מלא
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  // תצוגת שלב סיום
  const renderComplete = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#4CAF50', fontWeight: 'bold', mb: 3 }}>
        תודה על הזמנתך!
      </Typography>
      
      <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 2, maxWidth: 600, mx: 'auto', mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          ההזמנה שלך התקבלה בהצלחה
        </Typography>
        <Typography variant="body1" paragraph>
          אישור הזמנה מפורט עם כל הפרטים נשלח לכתובת האימייל שלך.
        </Typography>
        <Typography variant="body1" paragraph>
          אנו מצפים לארח אותך במלונית רוטשילד 79!
        </Typography>
      </Box>
      
      <Button
        variant="contained"
        onClick={handleReset}
        sx={{ mt: 2, px: 4, py: 1.5 }}
        size="large"
      >
        חזרה לדף הבית
      </Button>
    </Box>
  );

  // תצוגת תוכן לפי שלב
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderDateSelection();
      case 1:
        return renderGuestDetails();
      case 2:
        return renderPaymentDetails();
      case 3:
        return renderSummary();
      default:
        return 'שלב לא ידוע';
    }
  };

  // רנדור הסטפר בהתאם לגודל המסך
  const renderStepper = () => {
    if (isMobile) {
      // עבור מסכים קטנים, נציג רק את השלב הנוכחי והשלבים הקודמים/הבאים
      return (
        <Box sx={{ mb: 3 }}>
          <MobileStepper
            variant="text"
            steps={steps.length}
            position="static"
            activeStep={activeStep}
            sx={{ 
              bgcolor: 'transparent',
              p: 0,
              '& .MuiMobileStepper-dot': {
                width: 10,
                height: 10,
                mx: 0.5
              },
              '& .MuiMobileStepper-dotActive': {
                bgcolor: 'primary.main'
              }
            }}
            nextButton={<Box />}
            backButton={<Box />}
          />
          <Typography 
            variant="h6" 
            align="center" 
            sx={{ mt: 1, fontWeight: 'bold' }}
          >
            {steps[activeStep]}
          </Typography>
        </Box>
      );
    } else {
      // עבור מסכים גדולים, נציג את הסטפר המלא
      return (
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      );
    }
  };
  
  // בדיקת תקינות פרטי האורח
  const isGuestDetailsValid = () => {
    const { firstName, lastName, phone, email } = bookingData.guest;
    return (
      firstName && 
      firstName.length >= 2 && 
      lastName && 
      lastName.length >= 2 && 
      phone && 
      phone.length >= 9 &&
      email && 
      email.includes('@') && 
      email.includes('.')
    );
  };
  
  // בדיקת תקינות פרטי התשלום
  const isPaymentDetailsValid = () => {
    if (bookingData.paymentMethod === 'credit') {
      const { cardNumber, expiryDate, cvv } = bookingData.creditCardDetails;
      
      // ניקוי רווחים ממספר הכרטיס
      const cleanCardNumber = cardNumber ? cardNumber.replace(/\s/g, '') : '';
      
      // בדיקה פשוטה יותר - אם יש מספר כרטיס עם לפחות 8 ספרות
      // ואם יש תאריך תוקף וקוד CVV כלשהו
      const isValid = (
        cleanCardNumber && 
        cleanCardNumber.length >= 8 && 
        expiryDate && 
        cvv
      );

      // הדפסת מידע לקונסול לצורכי דיבוג
      console.log('פרטי תוקף כרטיס האשראי:', {
        cardNumber: cleanCardNumber,
        cardNumberLength: cleanCardNumber.length,
        expiryDate,
        cvv,
        isValid
      });
      
      return isValid;
    }
    // עבור אמצעי תשלום אחרים תמיד מחזיר true
    return true;
  };

  if (loading && !room) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          חזרה לדף הבית
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      {renderStepper()}
      
      {activeStep === steps.length ? (
        renderComplete()
      ) : (
        <Box>
          {getStepContent(activeStep)}
          
          {activeStep !== 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button onClick={handleBack} disabled={activeStep === 0} size={isMobile ? "small" : "medium"}>
                חזרה
              </Button>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                {activeStep === 2 && !isPaymentDetailsValid() && (
                  <Typography variant="caption" color="error" sx={{ mb: 1 }}>
                    יש להזין את כל פרטי האשראי: מספר כרטיס (לפחות 8 ספרות), תאריך תוקף וקוד אבטחה
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                  disabled={
                    (activeStep === 0 && !bookingData.roomId) ||
                    (activeStep === 1 && !isGuestDetailsValid()) ||
                    (activeStep === 2 && !isPaymentDetailsValid())
                  }
                  size={isMobile ? "small" : "medium"}
                >
                  {activeStep === steps.length - 1 ? 'סיים הזמנה' : 'המשך'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default BookingPage; 