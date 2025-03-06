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
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { addDays, differenceInDays } from 'date-fns';

const steps = ['בחירת תאריכים', 'פרטי אורח', 'פרטי תשלום', 'סיכום'];

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState(null);
  
  // פרטי הזמנה
  const [bookingData, setBookingData] = useState({
    roomId: location.state?.roomId || '',
    checkIn: null,
    checkOut: null,
    guest: {
      name: '',
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
    vatAmount: 0,
    totalPrice: 0
  });

  // טעינת פרטי החדר
  useEffect(() => {
    const fetchRoom = async () => {
      if (!bookingData.roomId) {
        // אם אין מזהה חדר, טען את החדר הסטנדרטי (חדר 6)
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
          const rooms = response.data.data;
          const standardRoom = rooms.find(room => room.roomNumber === 6);
          
          if (standardRoom) {
            setRoom(standardRoom);
            setBookingData(prev => ({ ...prev, roomId: standardRoom._id }));
          } else {
            setError('לא נמצא חדר סטנדרטי. אנא נסה שוב מאוחר יותר.');
          }
        } catch (error) {
          console.error('שגיאה בטעינת החדר:', error);
          setError('לא ניתן לטעון את פרטי החדר. אנא נסה שוב מאוחר יותר.');
        }
      } else {
        // אם יש מזהה חדר, טען את פרטי החדר הספציפי
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms/${bookingData.roomId}`);
          setRoom(response.data.data);
        } catch (error) {
          console.error('שגיאה בטעינת החדר:', error);
          setError('לא ניתן לטעון את פרטי החדר. אנא נסה שוב מאוחר יותר.');
        }
      }
      setLoading(false);
    };

    fetchRoom();
  }, [bookingData.roomId]);

  // חישוב מחירים כאשר משתנים תאריכים או סטטוס תייר
  useEffect(() => {
    if (room && bookingData.checkIn && bookingData.checkOut) {
      const nights = differenceInDays(bookingData.checkOut, bookingData.checkIn);
      const basePrice = room.basePrice * nights;
      const vatAmount = bookingData.isTourist ? 0 : basePrice * 0.17;
      const totalPrice = basePrice + vatAmount;
      
      setCalculations({
        nights,
        basePrice,
        vatAmount,
        totalPrice
      });
    }
  }, [room, bookingData.checkIn, bookingData.checkOut, bookingData.isTourist]);

  // בדיקת זמינות החדר
  const checkAvailability = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut || !bookingData.roomId) {
      return false;
    }
    
    setCheckingAvailability(true);
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/rooms/check-availability`, {
        roomId: bookingData.roomId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut
      });
      
      setCheckingAvailability(false);
      return response.data.isAvailable;
    } catch (error) {
      console.error('שגיאה בבדיקת זמינות:', error);
      setCheckingAvailability(false);
      return false;
    }
  };

  // טיפול בשינוי שדות
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    
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
    // בדיקת תקינות לפי השלב הנוכחי
    if (activeStep === 0) {
      // בדיקת תאריכים
      if (!bookingData.checkIn || !bookingData.checkOut) {
        toast.error('נא לבחור תאריכי צ\'ק-אין וצ\'ק-אאוט');
        return;
      }
      
      if (differenceInDays(bookingData.checkOut, bookingData.checkIn) <= 0) {
        toast.error('תאריך צ\'ק-אאוט חייב להיות מאוחר יותר מתאריך צ\'ק-אין');
        return;
      }
      
      // בדיקת זמינות
      const isAvailable = await checkAvailability();
      if (!isAvailable) {
        toast.error('החדר אינו זמין בתאריכים שנבחרו. אנא בחר תאריכים אחרים.');
        return;
      }
    } else if (activeStep === 1) {
      // בדיקת פרטי אורח
      const { name, phone, email } = bookingData.guest;
      if (!name || !phone || !email) {
        toast.error('נא למלא את כל פרטי האורח');
        return;
      }
      
      // בדיקת תקינות אימייל בסיסית
      if (!email.includes('@') || !email.includes('.')) {
        toast.error('נא להזין כתובת אימייל תקינה');
        return;
      }
    } else if (activeStep === 2) {
      // בדיקת פרטי תשלום
      if (bookingData.paymentMethod === 'credit') {
        const { cardNumber, expiryDate, cvv } = bookingData.creditCardDetails;
        if (!cardNumber || !expiryDate || !cvv) {
          toast.error('נא למלא את כל פרטי כרטיס האשראי');
          return;
        }
        
        // בדיקות תקינות בסיסיות
        if (cardNumber.replace(/\s/g, '').length < 14) {
          toast.error('מספר כרטיס אשראי אינו תקין');
          return;
        }
        
        if (cvv.length < 3) {
          toast.error('קוד אבטחה (CVV) אינו תקין');
          return;
        }
      }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // חזרה לשלב הקודם
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // שליחת ההזמנה
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/bookings`, {
        roomId: bookingData.roomId,
        guest: bookingData.guest,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        isTourist: bookingData.isTourist,
        paymentMethod: bookingData.paymentMethod,
        creditCardDetails: bookingData.paymentMethod === 'credit' ? bookingData.creditCardDetails : undefined,
        notes: bookingData.notes
      });
      
      toast.success('ההזמנה נשלחה בהצלחה!');
      setActiveStep(steps.length);
    } catch (error) {
      console.error('שגיאה בשליחת ההזמנה:', error);
      toast.error(error.response?.data?.message || 'שגיאה בשליחת ההזמנה. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  // חזרה לדף הבית
  const handleReset = () => {
    navigate('/');
  };

  // תצוגת שלב 1 - בחירת תאריכים
  const renderDateSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        בחר תאריכי שהייה
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
            <DatePicker
              label="תאריך צ'ק-אין"
              value={bookingData.checkIn}
              onChange={(date) => handleDateChange('checkIn', date)}
              disablePast
              renderInput={(params) => <TextField {...params} fullWidth required />}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
            <DatePicker
              label="תאריך צ'ק-אאוט"
              value={bookingData.checkOut}
              onChange={(date) => handleDateChange('checkOut', date)}
              minDate={bookingData.checkIn ? addDays(bookingData.checkIn, 1) : addDays(new Date(), 1)}
              renderInput={(params) => <TextField {...params} fullWidth required />}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>
      
      {bookingData.checkIn && bookingData.checkOut && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1">
            סיכום:
          </Typography>
          <Typography>
            מספר לילות: {calculations.nights}
          </Typography>
          <Typography>
            מחיר בסיס: {calculations.basePrice} ₪
          </Typography>
        </Box>
      )}
    </Box>
  );

  // תצוגת שלב 2 - פרטי אורח
  const renderGuestDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        פרטי האורח
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="שם מלא"
            name="guest.name"
            value={bookingData.guest.name}
            onChange={handleChange}
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
          />
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
            label="אני תייר (פטור ממע״מ)"
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
          />
        </Grid>
      </Grid>
    </Box>
  );

  // תצוגת שלב 3 - פרטי תשלום
  const renderPaymentDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        פרטי תשלום
      </Typography>
      
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">אמצעי תשלום</FormLabel>
        <RadioGroup
          name="paymentMethod"
          value={bookingData.paymentMethod}
          onChange={handleChange}
        >
          <FormControlLabel value="credit" control={<Radio />} label="כרטיס אשראי" />
          <FormControlLabel value="cash" control={<Radio />} label="מזומן (בהגעה)" />
          <FormControlLabel value="bank_transfer" control={<Radio />} label="העברה בנקאית" />
        </RadioGroup>
      </FormControl>
      
      {bookingData.paymentMethod === 'credit' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="מספר כרטיס אשראי"
              name="creditCardDetails.cardNumber"
              value={bookingData.creditCardDetails.cardNumber}
              onChange={handleChange}
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
            />
          </Grid>
        </Grid>
      )}
      
      {bookingData.paymentMethod === 'bank_transfer' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          פרטי חשבון להעברה בנקאית יישלחו לאימייל שלך לאחר השלמת ההזמנה.
        </Alert>
      )}
      
      {bookingData.paymentMethod === 'cash' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          תשלום במזומן יתבצע בעת ההגעה למלונית.
        </Alert>
      )}
    </Box>
  );

  // תצוגת שלב 4 - סיכום
  const renderSummary = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        סיכום הזמנה
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            פרטי החדר:
          </Typography>
          <Typography>
            חדר {room.roomNumber} - {room.type === 'standard' ? 'סטנדרט' : room.type}
          </Typography>
          <Typography>
            תאריך צ'ק-אין: {bookingData.checkIn.toLocaleDateString('he-IL')}
          </Typography>
          <Typography>
            תאריך צ'ק-אאוט: {bookingData.checkOut.toLocaleDateString('he-IL')}
          </Typography>
          <Typography>
            מספר לילות: {calculations.nights}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            פרטי האורח:
          </Typography>
          <Typography>
            שם: {bookingData.guest.name}
          </Typography>
          <Typography>
            טלפון: {bookingData.guest.phone}
          </Typography>
          <Typography>
            אימייל: {bookingData.guest.email}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            פרטי תשלום:
          </Typography>
          <Typography>
            אמצעי תשלום: {
              bookingData.paymentMethod === 'credit' ? 'כרטיס אשראי' :
              bookingData.paymentMethod === 'cash' ? 'מזומן' : 'העברה בנקאית'
            }
          </Typography>
          <Typography>
            מחיר בסיס: {calculations.basePrice.toFixed(2)} ₪
          </Typography>
          <Typography>
            מע"מ ({bookingData.isTourist ? 'פטור' : '17%'}): {calculations.vatAmount.toFixed(2)} ₪
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            סה"כ לתשלום: {calculations.totalPrice.toFixed(2)} ₪
          </Typography>
        </CardContent>
      </Card>
      
      <Alert severity="info">
        לאחר אישור ההזמנה, תקבל אישור במייל עם פרטי ההזמנה המלאים.
      </Alert>
    </Box>
  );

  // תצוגת שלב סיום
  const renderComplete = () => (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <Typography variant="h5" gutterBottom>
        תודה על הזמנתך!
      </Typography>
      <Typography variant="subtitle1" paragraph>
        ההזמנה שלך התקבלה בהצלחה. אישור הזמנה נשלח לכתובת האימייל שלך.
      </Typography>
      <Typography paragraph>
        מספר הזמנה: {/* כאן יוצג מספר ההזמנה אם יש */}
      </Typography>
      <Button
        variant="contained"
        onClick={handleReset}
        sx={{ mt: 3 }}
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
    <Box>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        הזמנת חדר
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        {activeStep === steps.length ? (
          renderComplete()
        ) : (
          <>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {getStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0 || loading || checkingAvailability}
                onClick={handleBack}
              >
                חזור
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading || checkingAvailability}
                >
                  {loading ? <CircularProgress size={24} /> : 'אשר הזמנה'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={loading || checkingAvailability}
                >
                  {checkingAvailability ? <CircularProgress size={24} /> : 'המשך'}
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default BookingPage; 