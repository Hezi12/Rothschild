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
import CheckIcon from '@mui/icons-material/Check';

const steps = ['בחירת תאריכים', 'פרטי אורח', 'פרטי תשלום', 'סיכום'];

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const currentPath = location.pathname;
  
  const initialCheckIn = location.state?.checkIn || '';
  const initialCheckOut = location.state?.checkOut || '';
  const initialRoomId = location.state?.selectedRoomId || location.state?.roomId || null;
  const initialSelectedRooms = location.state?.selectedRooms || (initialRoomId ? [initialRoomId] : []);
  const initialGuests = location.state?.guests || 1;
  const initialRooms = location.state?.rooms || 1;
  const initialIsTourist = location.state?.isTourist || false;
  
  const initialStep = initialCheckIn && initialCheckOut && (initialRoomId || (initialSelectedRooms && initialSelectedRooms.length > 0)) ? 1 : 0;
  
  const calculateCancellationDate = (checkInDate) => {
    if (!checkInDate) return '';
    const cancellationDate = new Date(checkInDate);
    cancellationDate.setDate(cancellationDate.getDate() - 3);
    return new Date(cancellationDate).toLocaleDateString('he-IL');
  };

  const calculateNights = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const [activeStep, setActiveStep] = useState(initialStep);
  const [loading, setLoading] = useState(true);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [room, setRoom] = useState(null);
  const [bookingData, setBookingData] = useState({
    selectedRooms: initialSelectedRooms,
    roomId: initialRoomId,
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
    guests: initialGuests,
    rooms: initialRooms,
    guestDetails: {
      firstName: '',
      lastName: '',
      phone: '',
      email: ''
    },
    isTourist: initialIsTourist,
    paymentMethod: 'creditRothschild',
    creditCardDetails: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    },
    notes: '',
    nights: calculateNights(initialCheckIn, initialCheckOut),
    basePrice: 0,
    vat: 0,
    totalPrice: 0,
    roomDetails: [],
  });
  
  const typeToDisplayName = {
    'standard': 'Standard',
    'deluxe': 'Deluxe',
    'suite': 'Suite',
    'simple': 'Simple',
    'simple_with_balcony': 'Simple with Balcony',
    'standard_with_balcony': 'Standard with Balcony'
  };

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        
        if (bookingData.selectedRooms && bookingData.selectedRooms.length > 0) {
          const roomIds = bookingData.selectedRooms;
          
          const roomPromises = roomIds.map(roomId => 
            axios.get(`${process.env.REACT_APP_API_URL}/rooms/${roomId}`)
          );
          
          const responses = await Promise.all(roomPromises);
          const loadedRooms = responses.map(response => response.data.data);
          
          setAvailableRooms(loadedRooms);
          
          if (loadedRooms.length > 0) {
            setRoom(loadedRooms[0]);
          }
        } else if (initialRoomId) {
          const url = `${process.env.REACT_APP_API_URL}/rooms/${initialRoomId}`;
          const response = await axios.get(url);
          const selectedRoom = response.data.data;
          
          if (selectedRoom) {
            setRoom(selectedRoom);
            setAvailableRooms([selectedRoom]);
          } else {
            setError('החדר המבוקש לא נמצא.');
          }
        } else {
          let url = `${process.env.REACT_APP_API_URL}/rooms`;
          
          const response = await axios.get(url);
          
          const rooms = response.data.data;
          const defaultRoom = rooms.find(r => r.roomNumber === 6) || rooms[0];
          
          if (defaultRoom) {
            setRoom(defaultRoom);
          } else {
            setError('לא נמצאו חדרים זמינים.');
          }
        }
      } catch (error) {
        console.error('שגיאה בטעינת החדר:', error);
        setError('חלה שגיאה בטעינת פרטי החדר. אנא נסה שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoom();
  }, [initialRoomId, bookingData.selectedRooms, location.search]);

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState(null);
  const [bookingId, setBookingId] = useState('');
  
  const [selectedRooms, setSelectedRooms] = useState([]);
  
  useEffect(() => {
    if (bookingData.checkIn && bookingData.checkOut && room) {
      const fetchPrices = async () => {
        try {
          const isMultiRoom = bookingData.rooms > 1;
          
          if (isMultiRoom || (bookingData.selectedRooms && bookingData.selectedRooms.length > 1)) {
            let roomIdsToCheck = [];
            
            if (bookingData.selectedRooms && bookingData.selectedRooms.length > 1) {
              roomIdsToCheck = bookingData.selectedRooms;
            } else if (bookingData.roomId) {
              roomIdsToCheck = Array(bookingData.rooms).fill(bookingData.roomId);
            } else {
              return;
            }
            
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/rooms/check-multiple-availability`, {
              roomIds: roomIdsToCheck,
              checkIn: bookingData.checkIn,
              checkOut: bookingData.checkOut,
              guests: bookingData.guests,
              isTourist: bookingData.isTourist
            });
            
            const { data } = response.data;
            console.log('תוצאת חישוב מחיר עבור מספר חדרים:', data);
            
            if (data.allRoomsAvailable) {
              setBookingData(prev => ({
                ...prev,
                basePrice: data.totalBasePrice,
                vat: data.totalVatAmount,
                totalPrice: data.totalPrice,
                nights: data.nights,
                selectedRooms: roomIdsToCheck
              }));
            }
          } else {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/rooms/check-availability`, {
              roomId: bookingData.roomId,
              checkIn: bookingData.checkIn,
              checkOut: bookingData.checkOut,
              isTourist: bookingData.isTourist
            });
            
            const data = response.data.data;
            if (data && data.isAvailable !== false) {
              setBookingData(prev => ({
                ...prev,
                basePrice: data.nightsTotal || data.basePrice * data.nights,
                vat: data.vatAmount,
                totalPrice: data.totalPrice,
                nights: data.nights
              }));
            }
          }
        } catch (error) {
          console.error('שגיאה בקבלת מחירים:', error);
          const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);
          
          const roomCount = bookingData.rooms || 1;
          const basePricePerRoom = room.basePrice || 400;
          const basePrice = nights * basePricePerRoom * roomCount;
          const vatRate = 18;
          const vatAmount = bookingData.isTourist ? 0 : Math.round(basePrice * (vatRate / 100) * 100) / 100;
          const totalPrice = Math.round((basePrice + vatAmount) * 100) / 100;
          
          setBookingData(prev => ({
            ...prev,
            basePrice: basePrice,
            vat: vatAmount,
            totalPrice: totalPrice,
            nights: nights
          }));
        }
      };
      
      fetchPrices();
    }
  }, [bookingData.checkIn, bookingData.checkOut, bookingData.roomId, bookingData.selectedRooms, bookingData.rooms, bookingData.guests, bookingData.isTourist, room]);

  useEffect(() => {
    if (bookingData.basePrice > 0) {
      const vatRate = 18;
      const vatAmount = bookingData.isTourist ? 0 : Math.round(bookingData.basePrice * (vatRate / 100) * 100) / 100;
      const totalPrice = Math.round((bookingData.basePrice + vatAmount) * 100) / 100;
      
      setBookingData(prev => ({
        ...prev,
        vat: vatAmount,
        totalPrice: totalPrice
      }));
    }
  }, [bookingData.isTourist, bookingData.basePrice]);

  const checkAvailability = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut) {
      toast.error('אנא בחר תאריכי צ׳ק-אין וצ׳ק-אאוט');
      return false;
    }
    
    if (calculateNights(bookingData.checkIn, bookingData.checkOut) < 1) {
      toast.error('תאריך צ׳ק-אאוט חייב להיות לפחות יום אחד אחרי צ׳ק-אין');
      return false;
    }
    
    try {
      setCheckingAvailability(true);
      setError(null);
      
      const isMultiRoom = bookingData.rooms > 1;
      
      if (isMultiRoom || (bookingData.selectedRooms && bookingData.selectedRooms.length > 1)) {
        let roomIdsToCheck = [];
        
        if (bookingData.selectedRooms && bookingData.selectedRooms.length > 1) {
          roomIdsToCheck = bookingData.selectedRooms;
        } else if (bookingData.roomId) {
          roomIdsToCheck = Array(bookingData.rooms).fill(bookingData.roomId);
        } else {
          toast.error('אנא בחר לפחות חדר אחד');
          setCheckingAvailability(false);
          return false;
        }
        
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/rooms/check-multiple-availability`, {
          roomIds: roomIdsToCheck,
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: bookingData.guests,
          isTourist: bookingData.isTourist
        });
        
        const { data } = response.data;
        console.log('תוצאת בדיקת זמינות מרובת חדרים:', data);
        
        if (!data.allRoomsAvailable) {
          toast.error('אחד או יותר מהחדרים אינם זמינים בתאריכים שנבחרו. אנא בחר תאריכים אחרים.');
          setCheckingAvailability(false);
          return false;
        }
        
        setBookingData(prev => ({
          ...prev,
          basePrice: data.totalBasePrice || 0,
          vat: data.totalVatAmount || 0,
          totalPrice: data.totalPrice || 0,
          nights: data.nights || prev.nights,
          selectedRooms: roomIdsToCheck
        }));
        
        return true;
      } else {
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
          setCheckingAvailability(false);
          return false;
        }
        
        if (response.data.totalPrice) {
          setBookingData(prev => ({
            ...prev,
            basePrice: response.data.nightsTotal || response.data.basePrice || prev.basePrice,
            vat: response.data.vatAmount || prev.vat,
            totalPrice: response.data.totalPrice || prev.totalPrice,
            nights: response.data.nights || prev.nights
          }));
        }
        
        return true;
      }
    } catch (error) {
      console.error('שגיאה בבדיקת זמינות:', error);
      toast.error('שגיאה בבדיקת זמינות החדר. אנא נסה שוב מאוחר יותר.');
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (name === 'creditCardDetails.cardNumber') {
      const digitsOnly = value.replace(/\D/g, '');
      
      let formattedValue = '';
      for (let i = 0; i < digitsOnly.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formattedValue += ' ';
        }
        formattedValue += digitsOnly[i];
      }
      
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
    
    if (name === 'creditCardDetails.expiryDate') {
      const digitsOnly = value.replace(/\D/g, '');
      
      let formattedValue = '';
      if (digitsOnly.length <= 2) {
        formattedValue = digitsOnly;
      } else {
        formattedValue = `${digitsOnly.substring(0, 2)}/${digitsOnly.substring(2, 4)}`;
      }
      
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

  const handleDateChange = (name, date) => {
    setBookingData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      const isAvailable = await checkAvailability();
      if (!isAvailable) return;
    } else if (activeStep === 1) {
      if (!bookingData.guestDetails.firstName || !bookingData.guestDetails.lastName || !bookingData.guestDetails.phone || !bookingData.guestDetails.email) {
        toast.error('אנא מלא את כל פרטי האורח');
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(bookingData.guestDetails.email)) {
        toast.error('אנא הכנס כתובת אימייל תקינה');
        return;
      }
      
      if (!/^\d{9,10}$/.test(bookingData.guestDetails.phone.replace(/[-\s]/g, ''))) {
        toast.error('אנא הכנס מספר טלפון תקין');
        return;
      }
    } else if (activeStep === 2) {
      if (bookingData.paymentMethod === 'credit') {
        if (!bookingData.creditCardDetails.cardNumber || 
            !bookingData.creditCardDetails.expiryDate || 
            !bookingData.creditCardDetails.cvv) {
          toast.error('אנא מלא את כל פרטי כרטיס האשראי');
          return;
        }
        
        if (!isPaymentDetailsValid()) {
          toast.error('פרטי כרטיס האשראי אינם תקינים');
          return;
        }
      }
    }
    
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (bookingData.selectedRooms && bookingData.selectedRooms.length > 1) {
        const bookingPayload = {
          roomIds: bookingData.selectedRooms,
          checkIn: bookingData.checkIn instanceof Date ? bookingData.checkIn.toISOString() : bookingData.checkIn,
          checkOut: bookingData.checkOut instanceof Date ? bookingData.checkOut.toISOString() : bookingData.checkOut,
          nights: bookingData.nights,
          basePrice: bookingData.basePrice,
          vatRate: 18,
          vatAmount: bookingData.vat,
          totalPrice: bookingData.totalPrice,
          isTourist: bookingData.isTourist,
          guest: {
            firstName: bookingData.guestDetails.firstName,
            lastName: bookingData.guestDetails.lastName,
            email: bookingData.guestDetails.email,
            phone: bookingData.guestDetails.phone,
            country: bookingData.guestDetails.country || 'ישראל'
          },
          creditCard: {
            cardNumber: bookingData.creditCardDetails.cardNumber,
            expiryDate: bookingData.creditCardDetails.expiryDate,
            cvv: bookingData.creditCardDetails.cvv,
            cardholderName: bookingData.creditCardDetails.cardholderName
          },
          status: 'confirmed',
          paymentStatus: 'pending',
          notes: bookingData.notes,
          isMultiRoomBooking: true,
          totalRooms: bookingData.selectedRooms.length
        };
        
        console.log('שולח הזמנה מרובת חדרים:', {
          ...bookingPayload,
          creditCard: { ...bookingPayload.creditCard, cardNumber: '****' }
        });
        
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/bookings/multi-room`, bookingPayload);
        
        let bookingNumber = '';
        if (response.data.data && response.data.data.bookingNumber) {
          bookingNumber = response.data.data.bookingNumber;
        } else if (response.data.bookingNumber) {
          bookingNumber = response.data.bookingNumber;
        }
        
        setBookingId(bookingNumber);
        setActiveStep(activeStep + 1);
        toast.success('ההזמנה נשלחה בהצלחה!');
      } else {
        const bookingPayload = {
          roomId: bookingData.roomId || (bookingData.selectedRooms && bookingData.selectedRooms[0]),
          checkIn: bookingData.checkIn instanceof Date ? bookingData.checkIn.toISOString() : bookingData.checkIn,
          checkOut: bookingData.checkOut instanceof Date ? bookingData.checkOut.toISOString() : bookingData.checkOut,
          nights: bookingData.nights,
          basePrice: bookingData.basePrice,
          vatRate: 18,
          vatAmount: bookingData.vat,
          totalPrice: bookingData.totalPrice,
          isTourist: bookingData.isTourist,
          guest: {
            firstName: bookingData.guestDetails.firstName,
            lastName: bookingData.guestDetails.lastName,
            email: bookingData.guestDetails.email,
            phone: bookingData.guestDetails.phone,
            country: bookingData.guestDetails.country || 'ישראל'
          },
          creditCard: {
            cardNumber: bookingData.creditCardDetails.cardNumber,
            expiryDate: bookingData.creditCardDetails.expiryDate,
            cvv: bookingData.creditCardDetails.cvv,
            cardholderName: bookingData.creditCardDetails.cardholderName
          },
          status: 'confirmed',
          paymentStatus: 'pending',
          notes: bookingData.notes
        };
        
        console.log('שולח הזמנה:', {
          ...bookingPayload,
          creditCard: { ...bookingPayload.creditCard, cardNumber: '****' }
        });
        
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/bookings`, bookingPayload);
        
        let bookingNumber = '';
        if (response.data.data && response.data.data.bookingNumber) {
          bookingNumber = response.data.data.bookingNumber;
        } else if (response.data.bookingNumber) {
          bookingNumber = response.data.bookingNumber;
        }
        
        setBookingId(bookingNumber);
        setActiveStep(activeStep + 1);
        toast.success('ההזמנה נשלחה בהצלחה!');
      }
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

  const handleReset = () => {
    navigate('/');
  };

  const calculateTotalPrice = (basePrice) => {
    const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);
    if (!nights || nights <= 0 || !basePrice) return 0;
    return basePrice * nights;
  };

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
                    border: bookingData.selectedRooms.includes(room._id) || bookingData.roomId === room._id 
                      ? `2px solid ${theme.palette.primary.main}` 
                      : 'none',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => {
                    setBookingData({
                      ...bookingData,
                      roomId: room._id,
                      selectedRooms: [room._id]
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
                      ₪{bookingData.isTourist ? (room.basePrice || room.price) : Math.round((room.basePrice || room.price) * 1.18)} / לילה
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
                        variant={bookingData.selectedRooms.includes(room._id) || bookingData.roomId === room._id ? "contained" : "outlined"}
                        fullWidth
                        size={isMobile ? "small" : "medium"}
                        startIcon={bookingData.selectedRooms.includes(room._id) || bookingData.roomId === room._id ? <CheckIcon /> : null}
                      >
                        {bookingData.selectedRooms.includes(room._id) || bookingData.roomId === room._id ? 'נבחר' : 'בחר חדר זה'}
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

  const renderGuestDetails = () => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
        פרטי האורח
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="שם משפחה"
            name="guestDetails.lastName"
            value={bookingData.guestDetails.lastName}
            onChange={handleChange}
            fullWidth
            required
            error={Boolean(error && error.includes('שם משפחה'))}
            helperText={Boolean(error && error.includes('שם משפחה')) ? error : ''}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="שם פרטי"
            name="guestDetails.firstName"
            value={bookingData.guestDetails.firstName}
            onChange={handleChange}
            fullWidth
            required
            error={Boolean(error && error.includes('שם פרטי'))}
            helperText={Boolean(error && error.includes('שם פרטי')) ? error : ''}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="אימייל"
            name="guestDetails.email"
            type="email"
            value={bookingData.guestDetails.email}
            onChange={handleChange}
            fullWidth
            required
            error={Boolean(error && error.includes('אימייל'))}
            helperText={Boolean(error && error.includes('אימייל')) ? error : ''}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="טלפון"
            name="guestDetails.phone"
            value={bookingData.guestDetails.phone}
            onChange={handleChange}
            fullWidth
            required
            error={Boolean(error && error.includes('טלפון'))}
            helperText={Boolean(error && error.includes('טלפון')) ? error : ''}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
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
    </Box>
  );

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
            התשלום יתבצע בעת הצ'ק-אין במזומן, באשראי, או באמצעות ביט/פייבוקס.
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
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="שם בעל הכרטיס"
                name="creditCardDetails.cardholderName"
                value={bookingData.creditCardDetails.cardholderName}
                onChange={handleChange}
                placeholder="שם מלא כפי שמופיע על הכרטיס"
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
                {bookingData.selectedRooms && bookingData.selectedRooms.length > 1 ? (
                  <>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      נבחרו {bookingData.selectedRooms.length} חדרים:
                    </Typography>
                    {availableRooms.map((roomItem, index) => (
                      <Box key={roomItem._id} sx={{ mb: 1, pl: 1 }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <b>חדר {index + 1}:</b> {typeToDisplayName[roomItem.type] || roomItem.type}
                          <span style={{ marginRight: '8px', color: 'text.secondary' }}>
                            {bookingData.isTourist ? 
                              `${(roomItem.basePrice || 400) * bookingData.nights} ₪` : 
                              `${Math.round((roomItem.basePrice || 400) * 1.18 * bookingData.nights)} ₪ (כולל מע"מ)`}
                          </span>
                        </Typography>
                      </Box>
                    ))}
                  </>
                ) : (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <b>חדר:</b> {typeToDisplayName[room.type] || room.type}
                  </Typography>
                )}
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
                  <b>לילות:</b> {bookingData.nights}
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
                  <b>שם מלא:</b> {bookingData.guestDetails.firstName} {bookingData.guestDetails.lastName}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>טלפון:</b> {bookingData.guestDetails.phone}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>אימייל:</b> {bookingData.guestDetails.email}
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
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold', color: 'primary.main' }}>
                  {bookingData.rooms > 1 ? 
                    `סיכום מחיר עבור ${bookingData.rooms} חדרים:` : 
                    'סיכום מחיר:'}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>מחיר בסיס:</b> {bookingData.basePrice.toFixed(2)} ₪
                  {bookingData.rooms > 1 ? 
                    ` (${bookingData.rooms} חדרים × ${(bookingData.basePrice / bookingData.rooms).toFixed(2)} ₪)` : ''}
                  {!bookingData.isTourist && <span style={{ marginRight: '8px', fontSize: '0.8rem' }}>(לפני מע"מ)</span>}
                </Typography>
                
                {bookingData.selectedRooms && bookingData.selectedRooms.length > 1 && availableRooms.length > 0 && (
                  <Box sx={{ pl: 2, mb: 1, borderLeft: '1px dashed rgba(0,0,0,0.1)' }}>
                    {availableRooms.map((roomItem, index) => (
                      <Typography key={roomItem._id} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        חדר {index + 1} ({typeToDisplayName[roomItem.type] || roomItem.type}): 
                        {bookingData.isTourist ?
                          ` ${((roomItem.basePrice || 400) * bookingData.nights).toFixed(2)} ₪` :
                          ` ${((roomItem.basePrice || 400) * bookingData.nights).toFixed(2)} ₪ (לפני מע"מ)`
                        }
                      </Typography>
                    ))}
                  </Box>
                )}
                
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>מע"מ ({bookingData.isTourist ? 'פטור' : '18%'}):</b> {bookingData.vat.toFixed(2)} ₪
                </Typography>
                <Typography variant="body2" sx={{ 
                  mt: 1.5,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  color: theme.palette.primary.main
                }}>
                  סה"כ לתשלום: {bookingData.totalPrice.toFixed(2)} ₪
                  {bookingData.rooms > 1 ? 
                    ` (עבור ${bookingData.rooms} חדרים)` : ''}
                  {!bookingData.isTourist && <span style={{ fontSize: '0.8rem', fontWeight: 'normal', marginRight: '5px' }}>(כולל מע"מ)</span>}
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
                  ביטול עד {calculateCancellationDate(bookingData.checkIn)} - ללא עלות
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventBusyIcon sx={{ mr: 1, color: 'error.main', fontSize: '1rem' }} />
                  ביטול לאחר {calculateCancellationDate(bookingData.checkIn)} - חיוב במחיר מלא
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

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

  const renderStepper = () => {
    if (isMobile) {
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
  
  const isGuestDetailsValid = () => {
    const { firstName, lastName, phone, email } = bookingData.guestDetails;
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
  
  const isPaymentDetailsValid = () => {
    if (bookingData.paymentMethod === 'credit') {
      const { cardNumber, expiryDate, cvv, cardholderName } = bookingData.creditCardDetails;
      
      const cleanCardNumber = cardNumber ? cardNumber.replace(/\s/g, '') : '';
      
      const isValid = (
        cleanCardNumber && 
        cleanCardNumber.length >= 8 && 
        expiryDate && 
        cvv &&
        cardholderName
      );

      console.log('פרטי תוקף כרטיס האשראי:', {
        cardNumber: cleanCardNumber,
        cardNumberLength: cleanCardNumber.length,
        expiryDate,
        cvv,
        cardholderName,
        isValid
      });
      
      return isValid;
    }
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
      
      {activeStep === 0 && renderDateSelection()}
      {activeStep === 1 && renderGuestDetails()}
      {activeStep === 2 && renderPaymentDetails()}
      {activeStep === 3 && renderSummary()}
      
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, mt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          הקודם
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep === steps.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={loading}
            sx={{ 
              bgcolor: theme.palette.success.main, 
              '&:hover': { bgcolor: theme.palette.success.dark }
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'סיום והזמנה'
            )}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || (activeStep === 0 && !bookingData.checkIn)}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'הבא'}
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default BookingPage; 