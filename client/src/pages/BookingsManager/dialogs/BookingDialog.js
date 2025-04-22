import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  FormControlLabel,
  Switch,
  Box,
  InputAdornment,
  Checkbox,
  useTheme,
  IconButton,
  Chip,
  alpha,
  Divider,
  Avatar,
  Paper,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HotelIcon from '@mui/icons-material/Hotel';
import PaymentIcon from '@mui/icons-material/Payment';
import NoteIcon from '@mui/icons-material/Note';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// פונקציות עזר
import { calculatePriceWithVAT, calculatePriceWithoutVAT, roundTo, parseAndRound, calculateVATAmount, calculateTotalPrice } from '../utils/priceUtils';
import { calculateNightsFromDates } from '../utils/dateUtils';

// קומפוננטת דיאלוג הזמנה
const BookingDialog = ({ open, onClose, selectedBooking, onSave, rooms }) => {
  const theme = useTheme();
  
  // רשימת אמצעי תשלום אפשריים
  const PAYMENT_METHODS = [
    { value: 'cash', label: 'מזומן' },
    { value: 'creditOr', label: 'אשראי אור יהודה' },
    { value: 'creditRothschild', label: 'אשראי רוטשילד' },
    { value: 'mizrahi', label: 'העברה מזרחי' },
    { value: 'bitMizrahi', label: 'ביט מזרחי' },
    { value: 'payboxMizrahi', label: 'פייבוקס מזרחי' },
    { value: 'poalim', label: 'העברה פועלים' },
    { value: 'bitPoalim', label: 'ביט פועלים' },
    { value: 'payboxPoalim', label: 'פייבוקס פועלים' },
    { value: 'other', label: 'אחר' }
  ];
  
  // סטייט עבור ערכי השדות בטופס ההזמנה
  const [booking, setBooking] = useState({
    roomId: "",
    roomNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    startDate: null,
    endDate: null,
    adults: 2,
    children: 0,
    pricePerNight: "",
    tourist: false,
    notes: "",
    status: "confirmed",
    paymentMethod: "",
    isPaid: false,
    creditCard: "",
    cardHolderName: "",
    expiryDate: "",
    cvv: ""
  });
  
  // סטייט עבור שדות נוספים בטופס
  const [priceWithVAT, setPriceWithVAT] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [isTouristField, setIsTouristField] = useState(false);
  const [nightsCount, setNightsCount] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // ייחוס לשדות
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const pricePerNightRef = useRef(null);
  
  // אתחול ערכי הדיאלוג בהתאם להזמנה שנבחרה או הזמנה חדשה
  useEffect(() => {
    if (selectedBooking) {
      // בדיקה אם זו הזמנה קיימת (יש מזהה)
      setIsEditMode(!!selectedBooking._id);
      
      // העתקת כל השדות מההזמנה שנבחרה
      const bookingData = {
        _id: selectedBooking._id || null,
        bookingNumber: selectedBooking.bookingNumber || "",
        roomId: selectedBooking.roomId || "",
        roomNumber: selectedBooking.roomNumber || "",
        firstName: selectedBooking.firstName || selectedBooking.guest?.firstName || "",
        lastName: selectedBooking.lastName || selectedBooking.guest?.lastName || "",
        email: selectedBooking.email || selectedBooking.guest?.email || "",
        phone: selectedBooking.phone || selectedBooking.guest?.phone || "",
        startDate: selectedBooking.startDate ? new Date(selectedBooking.startDate) : 
                 selectedBooking.checkIn ? new Date(selectedBooking.checkIn) : new Date(),
        endDate: selectedBooking.endDate ? new Date(selectedBooking.endDate) : 
               selectedBooking.checkOut ? new Date(selectedBooking.checkOut) : new Date(new Date().getTime() + 86400000),
        adults: selectedBooking.adults || 2,
        children: selectedBooking.children || 0,
        pricePerNight: selectedBooking.pricePerNight || selectedBooking.basePrice || "",
        tourist: selectedBooking.tourist || selectedBooking.isTourist || false,
        notes: selectedBooking.notes || "",
        status: selectedBooking.status || "confirmed",
        paymentMethod: selectedBooking.paymentMethod || "",
        isPaid: selectedBooking.isPaid === true || selectedBooking.paymentStatus === 'paid',
        creditCard: selectedBooking.creditCard || "",
        cardHolderName: selectedBooking.cardHolderName || "",
        expiryDate: selectedBooking.expiryDate || "",
        cvv: selectedBooking.cvv || ""
      };
      
      // טיפול במקרה שיש אובייקט creditCard מלא במקום שדות נפרדים
      if (selectedBooking.creditCard && typeof selectedBooking.creditCard === 'object') {
        bookingData.creditCard = selectedBooking.creditCard.cardNumber || "";
        bookingData.cardHolderName = selectedBooking.creditCard.cardholderName || selectedBooking.creditCard.cardHolderName || "";
        bookingData.expiryDate = selectedBooking.creditCard.expiryDate || "";
        bookingData.cvv = selectedBooking.creditCard.cvv || "";
      }
      
      // עדכון הסטייט של הדיאלוג
      setBooking(bookingData);
      
      // חישוב מספר לילות
      const start = bookingData.startDate;
      const end = bookingData.endDate;
      const nights = calculateNightsFromDates(start, end);
      setNightsCount(nights > 0 ? nights : 1);
      
      // חישוב מחירים
      const price = parseFloat(bookingData.pricePerNight) || 0;
      const priceWithVatValue = calculatePriceWithVAT(price);
      
      // שימוש במחיר המקורי אם קיים
      if (selectedBooking.originalTotalPrice && selectedBooking.originalTotalPrice.trim() !== '') {
        setTotalPrice(selectedBooking.originalTotalPrice);
      } else {
        const nightsToUse = nights > 0 ? nights : 1;
        const totalPriceValue = bookingData.tourist ? 
          roundTo(price * nightsToUse) : 
          roundTo(priceWithVatValue * nightsToUse);
        setTotalPrice(totalPriceValue.toString());
      }
      
      setPriceWithVAT(priceWithVatValue.toString());
      setIsTouristField(bookingData.tourist);
    }
  }, [selectedBooking]);
  
  // פונקציה לעדכון מחיר כולל להזמנה
  const updateTotalPrice = (price, nights, isTourist) => {
    if (!price || nights <= 0) {
      setTotalPrice("");
      return;
    }
    
    let finalPrice;
    if (isTourist) {
      finalPrice = parseFloat(price) * nights;
    } else {
      const priceWithVAT = calculatePriceWithVAT(price);
      finalPrice = priceWithVAT * nights;
    }
    
    setTotalPrice(finalPrice.toString());
  };
  
  // טיפול בשינוי בשדה מחיר לילה (ללא מע"מ)
  const handlePricePerNightChange = (e) => {
    const { value } = e.target;
    
    if (value === '') {
      setBooking(prev => ({ ...prev, pricePerNight: '' }));
      setPriceWithVAT('');
      setTotalPrice('');
      return;
    }
    
    // הפיכת הערך למספר ועיגול ל-2 ספרות אחרי הנקודה
    const priceValue = parseFloat(value);
    
    if (!isNaN(priceValue)) {
      // שימוש בפונקציות המעודכנות מ-priceUtils
      const roundedBasePrice = roundTo(priceValue);
      setBooking(prev => ({ ...prev, pricePerNight: roundedBasePrice.toString() }));
      
      // חישוב מחיר לילה כולל מע"מ
      let vatPrice;
      if (booking.tourist) {
        vatPrice = roundedBasePrice; // לתייר המחיר זהה (אין מע"מ)
      } else {
        vatPrice = calculatePriceWithVAT(roundedBasePrice);
      }
      setPriceWithVAT(vatPrice.toString());
      
      // חישוב סה"כ להזמנה
      const total = calculateTotalPrice(roundedBasePrice, nightsCount, booking.tourist);
      setTotalPrice(total.toString());
    }
  };

  // טיפול בשינוי בשדה מחיר לילה (כולל מע"מ)
  const handlePriceWithVATChange = (e) => {
    const { value } = e.target;
    
    if (value === '') {
      setPriceWithVAT('');
      setBooking(prev => ({ ...prev, pricePerNight: '' }));
      setTotalPrice('');
      return;
    }
    
    const priceWithVATValue = parseFloat(value);
    
    if (!isNaN(priceWithVATValue)) {
      // שימוש בפונקציות המעודכנות מ-priceUtils
      const roundedPriceWithVAT = roundTo(priceWithVATValue);
      setPriceWithVAT(roundedPriceWithVAT.toString());
      
      // חישוב מחיר לילה ללא מע"מ
      let basePrice;
      if (booking.tourist) {
        basePrice = roundedPriceWithVAT; // לתייר המחיר זהה (אין מע"מ)
      } else {
        basePrice = calculatePriceWithoutVAT(roundedPriceWithVAT);
      }
      setBooking(prev => ({ ...prev, pricePerNight: basePrice.toString() }));
      
      // חישוב סה"כ להזמנה - בתייר המחיר הבסיסי והמחיר עם מע"מ זהים
      const basePriceForTotal = booking.tourist ? roundedPriceWithVAT : basePrice;
      const total = calculateTotalPrice(basePriceForTotal, nightsCount, booking.tourist);
      setTotalPrice(total.toString());
    }
  };

  // טיפול בשינוי בשדה סה"כ להזמנה
  const handleTotalPriceChange = (e) => {
    const { value } = e.target;
    
    if (value === '' || nightsCount <= 0) {
      setTotalPrice('');
      if (nightsCount <= 0) return;
      setPriceWithVAT('');
      setBooking(prev => ({ ...prev, pricePerNight: '' }));
      return;
    }
    
    const totalValue = parseFloat(value);
    
    if (!isNaN(totalValue)) {
      // שימוש בפונקציות המעודכנות מ-priceUtils
      const roundedTotal = roundTo(totalValue);
      setTotalPrice(roundedTotal.toString());
      
      // חישוב מחיר לילה כולל מע"מ
      const priceWithVATValue = roundTo(roundedTotal / nightsCount);
      setPriceWithVAT(priceWithVATValue.toString());
      
      // חישוב מחיר לילה ללא מע"מ
      let basePrice;
      if (booking.tourist) {
        basePrice = priceWithVATValue; // לתייר המחיר זהה (אין מע"מ)
      } else {
        basePrice = calculatePriceWithoutVAT(priceWithVATValue);
      }
      setBooking(prev => ({ ...prev, pricePerNight: basePrice.toString() }));
    }
  };

  // טיפול בשינוי בשדה מספר לילות
  const handleNightsCountChange = (e) => {
    const { value } = e.target;
    
    if (value === '') {
      setNightsCount(0);
      setTotalPrice('');
      return;
    }
    
    const nightsValue = parseInt(value);
    
    if (!isNaN(nightsValue) && nightsValue > 0) {
      setNightsCount(nightsValue);
      
      // עדכון סה"כ להזמנה רק אם יש מחיר לילה
      if (priceWithVAT) {
        const priceWithVATValue = parseFloat(priceWithVAT);
        // עיגול סה"כ להזמנה לשתי ספרות אחרי הנקודה
        const total = parseFloat((priceWithVATValue * nightsValue).toFixed(2));
        setTotalPrice(total.toString());
      }
      
      // עדכון תאריך צ'ק אאוט לפי מספר הלילות החדש
      if (booking.startDate) {
        const newEndDate = new Date(booking.startDate);
        newEndDate.setDate(newEndDate.getDate() + nightsValue);
        
        setBooking(prev => ({
          ...prev,
          endDate: newEndDate
        }));
      }
    }
  };
  
  // טיפול בשינוי בכל שדה אחר
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let updatedValue = type === 'checkbox' ? checked : value;
    
    if (name === 'adults' || name === 'children') {
      updatedValue = parseInt(value) || 0;
    }
    
    // טיפול מיוחד באמצעי תשלום - כשבוחרים אמצעי תשלום, אוטומטית מסמנים שההזמנה שולמה
    if (name === 'paymentMethod') {
      setBooking(prev => ({ 
        ...prev, 
        [name]: updatedValue,
        isPaid: updatedValue !== "" // אם נבחר אמצעי תשלום (שלא ריק), סימן שהתשלום בוצע
      }));
    } else {
      setBooking(prev => ({ ...prev, [name]: updatedValue }));
    }
    
    if (name === 'tourist') {
      setIsTouristField(checked);
      
      const price = parseFloat(booking.pricePerNight) || 0;
      if (price > 0) {
        let vatPrice;
      if (checked) {
          // לתייר אין מע"מ - המחיר זהה למחיר הבסיסי
          vatPrice = price;
      } else {
          vatPrice = calculatePriceWithVAT(price);
          // עיגול מחיר לילה כולל מע"מ לשתי ספרות אחרי הנקודה
          vatPrice = parseFloat(vatPrice.toFixed(2));
        }
        
        setPriceWithVAT(vatPrice.toString());
        
        // עדכון סה"כ להזמנה
        const total = parseFloat((vatPrice * nightsCount).toFixed(2));
        setTotalPrice(total.toString());
      }
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => {
        const errors = { ...prev };
        delete errors[name];
        return errors;
      });
    }
  };
  
  // סגירת הדיאלוג
  const handleClose = () => {
    if (!onClose) return;
    setBooking({
      roomId: "",
      roomNumber: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 86400000),
      adults: 2,
      children: 0,
      pricePerNight: "",
      tourist: false,
      notes: "",
      status: "confirmed",
      paymentMethod: "",
      isPaid: false,
      creditCard: "",
      cardHolderName: "",
      expiryDate: "",
      cvv: ""
    });
    setPriceWithVAT("");
    setTotalPrice("");
    setFormErrors({});
    setNightsCount(0);
    setIsEditMode(false);
    
    onClose();
  };

  // שמירת ההזמנה
  const handleSaveClick = async () => {
    const errors = validateBooking();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      
      // העברה ללשונית הרלוונטית בהתאם לשגיאה הראשונה
      if (errors.firstName || errors.lastName || errors.email || errors.phone) {
        return;
      } else if (errors.roomId || errors.startDate || errors.endDate) {
        return;
      }
      
      return;
    }

    // חישוב מע"מ בצורה מדויקת עם פונקציות העיגול החדשות
    const basePrice = parseAndRound(booking.pricePerNight);
    const vatRate = booking.tourist ? 0 : 17; // אם תייר אז 0% מע"מ, אחרת 17%
    const vatAmount = booking.tourist ? 0 : calculateVATAmount(basePrice * nightsCount);
    const totalPriceValue = booking.tourist ? 
      roundTo(basePrice * nightsCount) : 
      roundTo(basePrice * nightsCount + vatAmount);
    
    // שמירת המחיר המקורי
    // חשוב: אם יש כבר מחיר כולל שהוזן ידנית על ידי המשתמש, נשתמש בו במקום לחשב מחדש
    let originalTotalPrice;
    
    // אם יש כבר מחיר מקורי בהזמנה הקיימת, נשמור אותו
    if (selectedBooking && selectedBooking.originalTotalPrice) {
      originalTotalPrice = selectedBooking.originalTotalPrice;
    }
    // אם המשתמש הזין ידנית מחיר סופי, נשתמש בו כמחיר מקורי
    else if (totalPrice && totalPrice.trim() !== "") {
      originalTotalPrice = totalPrice;
    }
    // אחרת נשתמש במחיר המחושב
    else {
      originalTotalPrice = totalPriceValue.toString();
    }
    
    try {
      // יצירת אובייקט פשוט יותר עם פחות שדות כפולים
      const simpleBookingData = {
        roomId: booking.roomId,
        roomNumber: parseInt(booking.roomNumber || 
                  (rooms.find(r => r._id === booking.roomId)?.roomNumber || "0")),

        // פרטי אורח
        guest: {
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email || "",
          phone: booking.phone || "",
          notes: ""
        },
        
        // תאריכים
        checkIn: booking.startDate ? booking.startDate.toISOString() : new Date().toISOString(),
        checkOut: booking.endDate ? booking.endDate.toISOString() : new Date(new Date().getTime() + 86400000).toISOString(),
        nights: nightsCount,
        
        // פרטי תשלום - שמירה על הערכים בפורמט מדויק
        basePrice: basePrice,
        vatRate: vatRate,
        vatAmount: vatAmount,
        totalPrice: totalPriceValue,
        originalTotalPrice: originalTotalPrice, // שמירת המחיר המקורי כמחרוזת
        isTourist: booking.tourist,
        paymentStatus: booking.isPaid ? 'paid' : 'pending',
        paymentMethod: booking.paymentMethod || "",
        
        // פרטי כרטיס אשראי - רק אם יש
        creditCard: booking.creditCard ? {
          cardNumber: booking.creditCard,
          cardholderName: booking.cardHolderName || booking.firstName + ' ' + booking.lastName,
          expiryDate: booking.expiryDate || "",
          cvv: booking.cvv || ""
        } : null,
        
        // פרטים נוספים
        status: booking.status || "confirmed",
        notes: booking.notes || "",
        source: "direct"
      };
      
      // אם זו עריכת הזמנה קיימת, הוסף את המזהים
      if (booking._id) {
        simpleBookingData._id = booking._id;
      }
      if (booking.bookingNumber) {
        simpleBookingData.bookingNumber = booking.bookingNumber;
      }
      
      console.log('שומר הזמנה מפושטת:', simpleBookingData);
      console.log('מבנה JSON להזמנה פשוטה:', JSON.stringify(simpleBookingData, null, 2));
      
      if (onSave) {
        await onSave(simpleBookingData);
      }
    } catch (error) {
      console.error('שגיאה בשמירת הזמנה:', error);
      
      // טיפול בשגיאות 500
      if (error.response && error.response.status === 500) {
        console.error('שגיאה פנימית בשרת (500)');
        console.error('התגובה המלאה:', error.response);
        if (error.response.data) {
          console.error('גוף התשובה:', error.response.data);
          console.error('סטטוס:', error.response.status);
          console.error('כותרות:', error.response.headers);
        }
        alert('אירעה שגיאה פנימית בשרת. פרטים נוספים בקונסול.');
      } else {
        // שגיאות אחרות
        console.error('פרטי השגיאה:', error.response?.data || error.message);
        alert('אירעה שגיאה בשמירת ההזמנה. אנא בדוק את הפרטים ונסה שנית.');
      }
    }
  };
  
  // וידוא נתוני ההזמנה
  const validateBooking = () => {
    const errors = {};
    
    if (!booking.firstName) {
      errors.firstName = 'שדה חובה';
    }
    
    if (!booking.lastName) {
      errors.lastName = 'שדה חובה';
    }
    
    if (!booking.roomId) {
      errors.roomId = 'יש לבחור חדר';
    }
    
    if (!booking.startDate) {
      errors.startDate = 'יש לבחור תאריך צ\'ק אין';
    }
    
    if (!booking.endDate) {
      errors.endDate = 'יש לבחור תאריך צ\'ק אאוט';
    }
    
    if (booking.startDate && booking.endDate && booking.startDate >= booking.endDate) {
      errors.endDate = 'תאריך צ\'ק אאוט חייב להיות אחרי תאריך צ\'ק אין';
    }
    
    // בדיקת תקינות מחיר
    if (!booking.pricePerNight && !isEditMode) {
      errors.pricePerNight = 'יש להזין מחיר לילה';
    }
    
    return errors;
  };
  
  // פתיחת WhatsApp עם הודעה
  const handleWhatsAppClick = () => {
    if (booking.phone) {
      let phone = booking.phone.replace(/\D/g, '');
      if (!phone.startsWith('972')) {
        if (phone.startsWith('0')) {
          phone = '972' + phone.substring(1);
        } else {
          phone = '972' + phone;
        }
      }
      
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };
  
  // רנדור הדיאלוג
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          maxHeight: '90vh',
        },
        backdropFilter: 'blur(4px)'
      }}
    >
      <DialogTitle 
        sx={{ 
          bgcolor: theme.palette.background.default, 
          color: theme.palette.text.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          dir: 'rtl',
          borderBottom: '1px solid',
          borderColor: theme.palette.divider
        }}
      >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              bgcolor: isEditMode ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.success.main, 0.1),
              color: isEditMode ? theme.palette.info.main : theme.palette.success.main,
              width: 38,
              height: 38,
              mr: 1.5
            }}
          >
            {isEditMode ? <CalendarMonthIcon /> : <AddCircleOutlineIcon />}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: '500', fontSize: '1.1rem' }}>
              {isEditMode ? `עריכת הזמנה ${booking.bookingNumber || ''}` : 'הזמנה חדשה'}
            </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconButton 
            onClick={handleSaveClick} 
            size="medium" 
            sx={{ 
              color: 'white',
              borderRadius: '50%',
              backgroundColor: booking.isPaid ? theme.palette.success.main : theme.palette.primary.main,
              width: 42,
              height: 42,
              '&:hover': {
                backgroundColor: booking.isPaid ? theme.palette.success.dark : theme.palette.primary.dark,
                boxShadow: '0 0 10px ' + alpha(booking.isPaid ? theme.palette.success.main : theme.palette.primary.main, 0.5),
              }
            }}
          >
            {isEditMode ? <SaveIcon fontSize="small" /> : <AddCircleOutlineIcon fontSize="small" />}
          </IconButton>
          
          {booking.isPaid && (
            <Box 
              sx={{
                borderRadius: '20px',
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.5),
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                overflow: 'hidden',
                px: 1,
                height: 42,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 150
              }}
            >
              <FormControl 
                size="small" 
                sx={{ 
                  width: '100%',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                }}
              >
                <Select
                  name="paymentMethod"
                  value={booking.paymentMethod}
                  onChange={handleInputChange}
                  displayEmpty
                  variant="outlined"
                  renderValue={(value) => {
                    if (!value) return <em style={{ fontSize: '0.8rem' }}>אמצעי תשלום</em>;
                    const method = PAYMENT_METHODS.find(m => m.value === value);
                    return <span style={{ fontSize: '0.8rem' }}>{method ? method.label : value}</span>;
                  }}
                  sx={{ 
                    fontSize: '0.8rem',
                    '& .MuiSelect-select': {
                      py: 0.5
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      display: 'none'
                    }
                  }}
                  IconComponent={(props) => (
                    <Box 
                      component="div" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        pr: 0.5
                      }}
                      {...props}
                    >
                      ▼
                    </Box>
                  )}
                >
                  <MenuItem value="">
                    <em>לא נבחר</em>
                  </MenuItem>
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
          
          <Box 
            sx={{
              borderRadius: '20px',
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.5),
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              overflow: 'hidden',
              height: 42,
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              position: 'relative'
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.85rem', 
                mr: 1,
                fontWeight: booking.isPaid ? 500 : 400,
                color: booking.isPaid ? theme.palette.success.main : theme.palette.text.secondary
              }}
            >
              {booking.isPaid ? "שולם" : "לא שולם"}
            </Typography>
            
            <Switch
              name="isPaid"
              checked={booking.isPaid}
              onChange={(e) => {
                const { checked } = e.target;
                setBooking(prev => ({
                  ...prev,
                  isPaid: checked,
                  paymentMethod: checked ? prev.paymentMethod : ""
                }));
              }}
              color="success"
              size="small"
              sx={{ 
                ml: 0.5,
                '& .MuiSwitch-thumb': {
                  width: 16,
                  height: 16,
                },
                '& .MuiSwitch-track': {
                  borderRadius: 10,
                }
              }}
            />
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent 
        sx={{ 
          p: 2.5, 
          dir: 'rtl',
          bgcolor: theme.palette.background.default
        }}
      >
        <Grid container spacing={2.5}>
          {/* חלק 1: פרטי אורח */}
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 1.5, 
              borderBottom: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.7),
              pb: 0.5
            }}>
              <PersonIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              פרטי אורח
            </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="שם פרטי"
              name="firstName"
              value={booking.firstName}
              onChange={handleInputChange}
              inputRef={firstNameRef}
              error={!!formErrors.firstName}
              helperText={formErrors.firstName}
              variant="outlined"
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="שם משפחה"
              name="lastName"
              value={booking.lastName}
              onChange={handleInputChange}
              inputRef={lastNameRef}
              error={!!formErrors.lastName}
              helperText={formErrors.lastName}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="טלפון"
              name="phone"
              value={booking.phone}
              onChange={handleInputChange}
              inputRef={phoneRef}
              InputProps={{
                endAdornment: booking.phone && (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={handleWhatsAppClick} 
                      size="small"
                      edge="end"
                      sx={{ 
                        color: '#25D366',
                        bgcolor: alpha('#25D366', 0.1),
                        '&:hover': {
                          bgcolor: alpha('#25D366', 0.2),
                        },
                        borderRadius: '6px',
                        mr: '-8px',
                        p: '4px'
                      }}
                    >
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="אימייל"
              name="email"
              value={booking.email}
              onChange={handleInputChange}
              inputRef={emailRef}
              error={!!formErrors.email}
              helperText={formErrors.email}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>
          
          {/* חלק 2: פרטי הזמנה */}
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mt: 1.5, 
              mb: 1.5, 
              borderBottom: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.7),
              pb: 0.5
            }}>
              <CalendarMonthIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              פרטי הזמנה
            </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: alpha(theme.palette.primary.light, 0.05),
                borderRadius: '10px',
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.1)
              }}
            >
              <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl 
              fullWidth 
              size="small" 
              error={!!formErrors.roomId}
              sx={{
                '& .MuiOutlinedInput-root': {
                        borderRadius: '8px'
                }
              }}
            >
              <InputLabel id="room-select-label">חדר</InputLabel>
              <Select
                labelId="room-select-label"
                name="roomId"
                value={booking.roomId}
                onChange={handleInputChange}
                label="חדר"
              >
                {rooms && rooms.map(room => (
                  <MenuItem key={room._id} value={room._id}>
                    {`חדר ${room.roomNumber} - ${room.name}`}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.roomId && (
                <Typography variant="caption" color="error">
                  {formErrors.roomId}
                </Typography>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
              <DatePicker
                label="צ'ק אין"
                value={booking.startDate}
                onChange={(newDate) => {
                  setBooking(prev => ({
                    ...prev,
                    startDate: newDate
                  }));
                  
                  // עדכון מספר לילות אם יש תאריך סיום
                  if (booking.endDate) {
                    const nights = calculateNightsFromDates(newDate, booking.endDate);
                    setNightsCount(nights > 0 ? nights : 1);
                    
                    // עדכון מחיר כולל
                    const price = parseFloat(booking.pricePerNight) || 0;
                    updateTotalPrice(price, nights > 0 ? nights : 1, isTouristField);
                  }
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    error: !!formErrors.startDate,
                    helperText: formErrors.startDate,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                      }
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
              <DatePicker
                label="צ'ק אאוט"
                value={booking.endDate}
                onChange={(newDate) => {
                  setBooking(prev => ({
                    ...prev,
                    endDate: newDate
                  }));
                  
                  // עדכון מספר לילות אם יש תאריך התחלה
                  if (booking.startDate) {
                    const nights = calculateNightsFromDates(booking.startDate, newDate);
                    setNightsCount(nights > 0 ? nights : 1);
                    
                    // עדכון מחיר כולל
                    const price = parseFloat(booking.pricePerNight) || 0;
                    updateTotalPrice(price, nights > 0 ? nights : 1, isTouristField);
                  }
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    error: !!formErrors.endDate,
                    helperText: formErrors.endDate,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                      }
                    }
                  }
                }}
              />
            </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth
                    size="small"
                    label="מספר לילות"
                    value={nightsCount}
                    onChange={handleNightsCountChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <HotelIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                        </InputAdornment>
                      ),
                      inputProps: { min: 1, type: 'number' }
                    }}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="מחיר לילה (ללא מע״מ)"
              name="pricePerNight"
              value={booking.pricePerNight}
              onChange={handlePricePerNightChange}
              inputRef={pricePerNightRef}
              InputProps={{
                endAdornment: <InputAdornment position="end">₪</InputAdornment>,
              }}
              error={!!formErrors.pricePerNight}
              helperText={formErrors.pricePerNight}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="מחיר לילה (כולל מע״מ)"
              value={priceWithVAT}
              onChange={handlePriceWithVATChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">₪</InputAdornment>,
              }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  bgcolor: alpha(theme.palette.background.paper, 0.5)
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="סה״כ להזמנה"
              value={totalPrice}
              onChange={handleTotalPriceChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">₪</InputAdornment>,
              }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  bgcolor: alpha(theme.palette.primary.light, 0.05)
                },
                '& .MuiInputBase-input': {
                  fontWeight: 'medium'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Checkbox
                  name="tourist"
                  checked={booking.tourist}
                  onChange={handleInputChange}
                  sx={{
                    color: theme.palette.warning.main,
                    '&.Mui-checked': {
                      color: theme.palette.warning.main,
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">תייר</Typography>
                  {booking.tourist && (
                  <Chip 
                    size="small" 
                    label="פטור ממע״מ" 
                      sx={{ 
                        fontSize: '0.65rem', 
                        height: '20px',
                        ml: 1
                      }} 
                      color="warning"
                    variant="outlined" 
                  />
                  )}
                </Box>
              }
            />
          </Grid>
          
          {/* חלק 3: פרטי תשלום */}
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mt: 1.5, 
              mb: 1.5, 
              borderBottom: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.7),
              pb: 0.5
            }}>
              <PaymentIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                פרטי תשלום והערות
            </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="מספר כרטיס"
              name="creditCard"
              value={booking.creditCard}
              onChange={handleInputChange}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="שם בעל הכרטיס"
              name="cardHolderName"
              value={booking.cardHolderName}
              onChange={handleInputChange}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={1.5}>
            <TextField
              fullWidth
              size="small"
              label="תוקף"
              name="expiryDate"
              value={booking.expiryDate}
              onChange={handleInputChange}
              variant="outlined"
              placeholder="MM/YY"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={1.5}>
            <TextField
              fullWidth
              size="small"
              label="CVV"
              name="cvv"
              value={booking.cvv}
              onChange={handleInputChange}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="הערות נוספות להזמנה..."
              name="notes"
              value={booking.notes}
              onChange={handleInputChange}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;

