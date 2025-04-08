import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { format, addDays, subDays, getDay, addWeeks, subWeeks, isSameDay, parseISO, addMonths } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  Button,
  Grid,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  styled,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Card,
  CardHeader,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Avatar
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  // אייקונים
  Add as AddIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Today as TodayIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarMonthIcon,
  Hotel as HotelIcon,
  Assessment as AssessmentIcon,
  AccountBalance as AccountBalanceIcon,
  Language as LanguageIcon,
  Event as EventIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  GridView as GridViewIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  EventNote as EventNoteIcon,
  Payment as PaymentIcon,
  Note as NoteIcon,
  CreditCard as CreditCardIcon,
  Edit as EditIcon,
  Clear as ClearIcon,
  FlashOn as FlashOnIcon,
  WhatsApp as WhatsAppIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  ConfirmationNumber as ConfirmationNumberIcon,
  BarChart as BarChartIcon,
  Public as PublicIcon
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BookingContext } from '../context/BookingContext';
import SvgIcon from '@mui/material/SvgIcon';

// קומפוננטת סרגל צדדי
const MinimalSidebar = styled(Box)(({ theme }) => ({
  position: 'fixed',
  left: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
  padding: '15px 0',
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  borderRadius: '0 16px 16px 0',
  zIndex: 1000,
  gap: '10px',
  width: '70px'
}));

// קומפוננטת כפתור בסרגל
const SidebarButton = ({ children, title, placement, isActive }) => {
  const theme = useTheme();
  
  return (
    <Tooltip title={title} placement={placement || "right"}>
      {React.cloneElement(children, {
        sx: {
          padding: '12px',
          borderRadius: '50%',
          color: isActive ? theme.palette.primary.main : 'inherit',
          backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease',
          boxShadow: isActive ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}` : 'none',
          ...children.props.sx
        }
      })}
    </Tooltip>
  );
};

// קומפוננטת תא בלוח
const CalendarCell = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '90px',
  height: '100%',
  width: '100%',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  padding: '0.8px',
  transition: 'all 0.25s ease',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  flex: '1 1 0',
  boxSizing: 'border-box',
  margin: 0,
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
}));

// קומפוננטת אייקון בלוח
const CellIconButton = styled(IconButton)(({ theme }) => ({
  width: '18px',
  height: '18px',
  padding: '1px',
  '& .MuiSvgIcon-root': {
    fontSize: '0.8rem',
  }
}));

// דף ניהול הזמנות החדש
const BookingsManager = () => {
  const theme = useTheme();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // קונטקסט
  const { isAdmin } = useContext(AuthContext);
  const { 
    bookings,
    loading: contextLoading,
    error: contextError,
    fetchBookings: contextFetchBookings
  } = useContext(BookingContext);
  
  // סטייט
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(null);
  const [daysInView, setDaysInView] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState({
    roomId: "",
    startDate: null,
    endDate: null,
    status: "confirmed"
  });
  
  // רספונסיביות
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // ימי השבוע בעברית
  const hebrewDays = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת'];
  
  // מספרי החדרים - כל החדרים
  // הסרנו את ההגבלה למספרים מסוימים
  
  // עדכון רשימת הימים בתצוגה
  useEffect(() => {
    const calculateVisibleDays = () => {
      // משתמש ב-currentWeekStartDate אם קיים, אחרת היום הנוכחי
      const today = currentWeekStartDate || new Date();
      
      // מתחיל מיומיים לפני היום הנוכחי
      const days = [];
      
      // מוסיף 8 ימים - מתחיל מיומיים לפני היום הנוכחי
      for (let i = -2; i < 6; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        days.push(date);
      }
      
      setDaysInView(days);
    };

    calculateVisibleDays();
  }, [currentWeekStartDate]);
  
  // לוג למסוף עבור הסרגל הצדדי
  useEffect(() => {
    console.log(`=== סרגל צדדי בדף BookingsManager ===`);
    console.log(`נתיב נוכחי: ${currentPath}`);
    console.log(`האם סרגל צדדי אמור להיות מוצג: כן`);
  }, [currentPath]);
  
  // טעינת חדרים
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.success) {
          // מיון החדרים לפי מספר החדר
          const sortedRooms = [...response.data.data].sort((a, b) => a.roomNumber - b.roomNumber);
          // הסרת הסינון - להציג את כל החדרים במקום רק את אלה שמוגדרים ב-roomNumbers
          setRooms(sortedRooms);
          console.log('נטענו', sortedRooms.length, 'חדרים');
        }
      } catch (error) {
        console.error('שגיאה בטעינת החדרים:', error);
        setError('אירעה שגיאה בטעינת החדרים');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, []);
  
  // טעינת הזמנות
  useEffect(() => {
    const fetchBookingsData = async () => {
      try {
        console.log('טוען נתוני הזמנות מהשרת...');
        setLoading(true);
        
        // טעינת הזמנות מהשרת
        // טעינה של חודש שלם, נסה להשתמש בקאש או ליעל את הבקשה על פי צורך
        console.log('שולח בקשת הזמנות לשרת');
        await contextFetchBookings({});
        
        setLoading(false);
      } catch (error) {
        console.error('שגיאה בעת טעינת הזמנות:', error);
        setLoading(false);
      }
    };
    
    fetchBookingsData();
  }, [contextFetchBookings]);
  
  // בדיקת הנתונים בעת שינוי הזמנות בקונטקסט
  useEffect(() => {
    console.log(`=== עדכון מהקונטקסט ===`);
    console.log(`מספר הזמנות בקונטקסט: ${bookings ? bookings.length : 0}`);
    if (bookings && bookings.length > 0) {
      console.log(`דוגמה להזמנה ראשונה:`, bookings[0]);
      
      // סינון הזמנות מבוטלות ועדכון הזמנות מסוננות
      const activeBookings = bookings.filter(booking => booking.status !== 'canceled');
      setFilteredBookings(activeBookings);
    }
  }, [bookings]);
  
  // הגדרת התאריך ההתחלתי בטעינה הראשונית
  useEffect(() => {
    // אם לא מוגדר תאריך התחלה, יגדיר את היום הנוכחי
    if (!currentWeekStartDate) {
      setCurrentWeekStartDate(new Date());
    }
  }, []);
  
  // פונקציות ניווט בין תאריכים - מעדכן לשבוע שלם (8 ימים)
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekStartDate || new Date());
    prevWeek.setDate(prevWeek.getDate() - 8); // מזיז שבוע שלם אחורה
    setCurrentWeekStartDate(prevWeek);
  };
  
  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStartDate || new Date());
    nextWeek.setDate(nextWeek.getDate() + 8); // מזיז שבוע שלם קדימה
    setCurrentWeekStartDate(nextWeek);
  };
  
  const goToToday = () => {
    setCurrentWeekStartDate(new Date());
  };
  
  // פונקציה להוספת הזמנה
  const handleAddBooking = (roomId = "", date = null) => {
    console.log('יצירת הזמנה חדשה:', { roomId, date });
    
    // חיפוש פרטי החדר לפי מזהה
    const selectedRoom = roomId ? rooms.find(room => room._id === roomId) : null;
    
    // תאריך צ'ק אין - התאריך שנבחר
    const checkInDate = date ? new Date(date) : new Date();
    // תאריך צ'ק אאוט - יום אחד אחרי בברירת מחדל
    const checkOutDate = addDays(checkInDate, 1);
    
    // חישוב מספר לילות (ברירת מחדל: לילה אחד)
    const nights = 1;
    
    // חישוב מחיר בסיסי אם החדר נמצא
    const basePrice = selectedRoom?.basePrice || "";
    
    // איפוס ההזמנה הנבחרת - הזמנה חדשה עם ערכים מחושבים
    setSelectedBooking({
      _id: null, // אין מזהה - הזמנה חדשה
      roomId: roomId || "",
      roomNumber: selectedRoom?.roomNumber || "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      startDate: checkInDate,
      endDate: checkOutDate,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults: 2,
      children: 0,
      pricePerNight: basePrice,
      tourist: false,
      notes: "",
      status: "confirmed",
      paymentMethod: "cash",
      isPaid: false,
      // מידע משלים למבנה ההזמנה החדשה
      guest: {
        firstName: "",
        lastName: "",
        phone: "",
        email: ""
      },
      nights: nights
    });
    
    console.log('אובייקט ההזמנה החדשה:', selectedBooking);
    
    // פתיחת דיאלוג ההזמנה
    setBookingDialogOpen(true);
  };
  
  // פונקציה לטיפול בלחיצה על הזמנה בלוח
  const handleBookingClick = (booking) => {
    console.log("נלחץ על הזמנה:", booking);
    
    if (!booking) {
      console.error("נסיון ללחוץ על הזמנה לא קיימת");
      return;
    }
    
    // יוצרים עותק של ההזמנה
    const adaptedBooking = { ...booking };
    
    // טיפול בשדה roomId
    if (booking.room && booking.room._id) {
      adaptedBooking.roomId = booking.room._id;
    } else if (booking.roomId) {
      adaptedBooking.roomId = booking.roomId;
    }
    
    // טיפול בנתוני אורח - וידוא שנתוני האורח יוצגו נכון
    if (booking.guest) {
      adaptedBooking.firstName = booking.guest.firstName || '';
      adaptedBooking.lastName = booking.guest.lastName || '';
      adaptedBooking.email = booking.guest.email || '';
      adaptedBooking.phone = booking.guest.phone || '';
    }
    
    // טיפול בתאריכים - תומך במבנים שונים של הזמנות
    const startDate = booking.startDate || booking.checkIn;
    const endDate = booking.endDate || booking.checkOut;
    
    if (startDate) {
      adaptedBooking.startDate = new Date(startDate);
      adaptedBooking.checkIn = new Date(startDate);
    }
    
    if (endDate) {
      adaptedBooking.endDate = new Date(endDate);
      adaptedBooking.checkOut = new Date(endDate);
    }
    
    // חישוב מספר לילות
    if (adaptedBooking.startDate && adaptedBooking.endDate) {
      const startTime = adaptedBooking.startDate.getTime();
      const endTime = adaptedBooking.endDate.getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      adaptedBooking.nights = Math.round(Math.abs((endTime - startTime) / oneDay));
    } else {
      adaptedBooking.nights = 1;
    }
    
    // טיפול במחיר - התאמה לפורמט מספרי תקין
    if (booking.pricePerNight) {
      const priceValue = parseFloat(booking.pricePerNight);
      adaptedBooking.pricePerNight = !isNaN(priceValue) ? priceValue.toString() : '';
      adaptedBooking.totalPrice = priceValue * adaptedBooking.nights;
    } else if (booking.price) {
      const priceValue = parseFloat(booking.price);
      adaptedBooking.pricePerNight = !isNaN(priceValue) ? priceValue.toString() : '';
      adaptedBooking.totalPrice = priceValue;
    } else if (booking.basePrice) {
      const priceValue = parseFloat(booking.basePrice);
      adaptedBooking.pricePerNight = !isNaN(priceValue) ? priceValue.toString() : '';
      adaptedBooking.totalPrice = priceValue * adaptedBooking.nights;
    } else {
      adaptedBooking.pricePerNight = '';
      adaptedBooking.totalPrice = 0;
    }
    
    // וידוא שדות סטטוס והתשלום
    adaptedBooking.status = booking.status || 'confirmed';
    adaptedBooking.isPaid = booking.isPaid || false;
    adaptedBooking.paymentMethod = booking.paymentMethod;
    adaptedBooking.tourist = booking.tourist || booking.isTourist || false;
    
    // עדכון שדות פרטי תשלום ואשראי - טיפול בפורמט אשראי חדש 
    if (booking.creditCard) {
      console.log("סוג נתוני אשראי:", typeof booking.creditCard);
      console.log("תוכן נתוני אשראי:", booking.creditCard);
      
      if (typeof booking.creditCard === 'object') {
        // מבנה האשראי החדש כאובייקט - הדפסה מפורטת של כל השדות
        console.log("פרטי אובייקט אשראי:", JSON.stringify(booking.creditCard));
        
        // חיפוש מספר כרטיס בשדות שונים אפשריים
        let rawCardNumber = '';
        
        // בדיקה אם יש שדה cardNumber
        if (booking.creditCard.hasOwnProperty('cardNumber')) {
          rawCardNumber = booking.creditCard.cardNumber;
          console.log("שימוש בשדה cardNumber:", rawCardNumber);
        } 
        // בדיקה אם יש שדה number
        else if (booking.creditCard.hasOwnProperty('number')) {
          rawCardNumber = booking.creditCard.number;
          console.log("שימוש בשדה number:", rawCardNumber);
        }
        // בדיקה אם יש שדה בשם המספר הכרטיס בשורש האובייקט
        else if (booking.hasOwnProperty('cardNumber')) {
          rawCardNumber = booking.cardNumber;
          console.log("שימוש בשדה השורש cardNumber:", rawCardNumber);
        }
        
        // פורמט מספר כרטיס האשראי - מחיקת רווחים או תווים אחרים והוספת רווחים חדשים כל 4 ספרות
        if (rawCardNumber && rawCardNumber.toString().trim() !== '') {
          // ניקוי הכרטיס מכל התווים שאינם ספרות
          const cleanNumber = rawCardNumber.toString().replace(/\D/g, '');
          // ללא רווחים - 16 ספרות רצופות
          adaptedBooking.creditCard = cleanNumber;
          console.log("מספר כרטיס אשראי מנוקה:", adaptedBooking.creditCard);
        } else {
          adaptedBooking.creditCard = '';
          console.log("לא נמצא שדה מספר כרטיס מוכר או שהוא ריק");
        }
        
        // חילוץ יתר השדות מהאובייקט
        adaptedBooking.cardHolderName = booking.creditCard.cardHolderName || booking.creditCard.holderName || booking.creditCard.cardholderName || booking.cardHolderName || '';
        adaptedBooking.expiryDate = booking.creditCard.expiryDate || booking.creditCard.expiry || booking.expiryDate || '';
        adaptedBooking.cvv = booking.creditCard.cvv || booking.creditCard.securityCode || booking.cvv || '';
      } else {
        // מבנה האשראי הישן כמחרוזת
        // ניקוי הכרטיס מכל התווים שאינם ספרות והוספת פורמט
        const cleanNumber = booking.creditCard.toString().replace(/\D/g, '');
        adaptedBooking.creditCard = cleanNumber; // ללא רווחים
        
        adaptedBooking.cardHolderName = booking.cardHolderName || '';
        adaptedBooking.expiryDate = booking.expiryDate || '';
        adaptedBooking.cvv = booking.cvv || '';
      }
    } else {
      adaptedBooking.creditCard = '';
      adaptedBooking.cardHolderName = booking.cardHolderName || '';
      adaptedBooking.expiryDate = booking.expiryDate || '';
      adaptedBooking.cvv = booking.cvv || '';
    }
    
    // יצירת יכולת דיבוג - הדפסת כל שדות ההזמנה המותאמת
    console.log("== פרטי הזמנה מותאמת ==");
    console.log("מספר כרטיס:", adaptedBooking.creditCard);
    console.log("שם בעל כרטיס:", adaptedBooking.cardHolderName);
    console.log("תוקף:", adaptedBooking.expiryDate);
    console.log("CVV:", adaptedBooking.cvv);
    
    // עדכון הערות
    adaptedBooking.notes = booking.notes || '';
    
    // הגדרת מספר מבוגרים וילדים
    adaptedBooking.adults = booking.adults || 2;
    adaptedBooking.children = booking.children || 0;
    
    // חישוב מע"מ (17%)
    adaptedBooking.vat = adaptedBooking.totalPrice * 0.17;
    adaptedBooking.totalPriceWithVAT = adaptedBooking.totalPrice + adaptedBooking.vat;
    
    console.log("הזמנה מותאמת לעריכה:", adaptedBooking);
    
    setSelectedBooking(adaptedBooking);
    setBookingDialogOpen(true);
  };
  
  // דיאלוג הוספת/עריכת הזמנה
  const BookingDialog = ({ open, onClose, selectedBooking, onSave, rooms }) => {
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
      paymentMethod: "cash",
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
    const [accordionExpanded, setAccordionExpanded] = useState(true);

    // מעקב אחר האלמנט שבפוקוס כרגע
    const [focusedField, setFocusedField] = useState(null);
    
    // ייחוס לשדות השונים כדי לשמור על הפוקוס
    const firstNameRef = React.useRef(null);
    const lastNameRef = React.useRef(null);
    const emailRef = React.useRef(null);
    const phoneRef = React.useRef(null);
    const pricePerNightRef = React.useRef(null);
    const priceWithVATRef = React.useRef(null);
    const totalPriceRef = React.useRef(null);
    
    // אתחול ערכי הדיאלוג בהתאם להזמנה שנבחרה או הזמנה חדשה
    useEffect(() => {
      if (selectedBooking) {
        console.log('[Dialog Init] Initializing with selectedBooking:', selectedBooking);
        
        // בדיקה אם זו הזמנה קיימת (יש מזהה)
        setIsEditMode(!!selectedBooking._id);
        
        // העתקת כל השדות מההזמנה שנבחרה
        const bookingData = {
          _id: selectedBooking._id || null, // שמירת המזהה המקורי חשובה!
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
          paymentMethod: selectedBooking.paymentMethod,
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
        console.log('[Dialog Init] Booking state set with paymentMethod:', bookingData.paymentMethod);
        
        // חישוב מספר לילות
        const start = bookingData.startDate;
        const end = bookingData.endDate;
        const nights = calculateNightsFromDates(start, end);
        setNightsCount(nights > 0 ? nights : 1);
        
        // חישוב מחירים
        const price = parseFloat(bookingData.pricePerNight) || 0;
        const priceWithVatValue = calculatePriceWithVAT(price);
        const totalPriceValue = priceWithVatValue * (nights > 0 ? nights : 1);
        
        setPriceWithVAT(priceWithVatValue.toString());
        setTotalPrice(totalPriceValue.toString());
        setIsTouristField(bookingData.tourist);
      }
    }, [selectedBooking]);
    
    // פונקציה לחישוב מספר הלילות בין שני תאריכים
    const calculateNightsFromDates = (start, end) => {
      if (!start || !end) return 0;
      
      try {
        // בדיקה שהתאריכים תקינים
        const startDate = start instanceof Date ? new Date(start) : new Date(start);
        const endDate = end instanceof Date ? new Date(end) : new Date(end);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn('תאריכים לא תקינים לחישוב לילות:', start, end);
          return 0;
        }
        
        // חישוב מספר המילישניות בין התאריכים וחלוקה במספר המילישניות ביום
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
      } catch (error) {
        console.error('שגיאה בחישוב מספר לילות:', error);
        return 0;
      }
    };
    
    // פונקציה לחישוב מספר הלילות בהזמנה הנוכחית
    const calculateNights = () => {
      return calculateNightsFromDates(booking.startDate, booking.endDate);
    };
    
    // פונקציה לעדכון מחיר כולל להזמנה
    const updateTotalPrice = (price, nights, isTourist) => {
      if (!price || nights <= 0) {
        setTotalPrice("");
        return;
      }
      
      let finalPrice;
      if (isTourist) {
        // לתייר - מחיר לילה ללא מע"מ כפול מספר לילות
        finalPrice = parseFloat(price) * nights;
      } else {
        // לישראלי - מחיר לילה עם מע"מ כפול מספר לילות
        const priceWithVAT = calculatePriceWithVAT(price);
        finalPrice = priceWithVAT * nights;
      }
      
      setTotalPrice(finalPrice.toString());
    };
    
    // פונקציה לחישוב מחיר עם מע"מ
    const calculatePriceWithVAT = (price) => {
      if (!price) return 0;
      const priceValue = parseFloat(price);
      if (isNaN(priceValue)) return 0;
      return Math.round(priceValue * 1.17);
    };
    
    // פונקציה לחישוב מחיר ללא מע"מ
    const calculatePriceWithoutVAT = (priceWithVAT) => {
      if (!priceWithVAT) return 0;
      const priceValue = parseFloat(priceWithVAT);
      if (isNaN(priceValue)) return 0;
      return Math.round(priceValue / 1.17);
    };
    
    // טיפול בשינוי בשדה מחיר לילה (ללא מע"מ)
    const handlePricePerNightChange = (e) => {
      const { value } = e.target;
      
      // אם הערך ריק, עדכן גם את שדה מחיר עם מע"מ
      if (value === '') {
        setBooking(prev => ({
          ...prev,
          pricePerNight: ''
        }));
        setPriceWithVAT('');
        setTotalPrice('');
        return;
      }
      
      // נסה להמיר את הערך למספר
      const priceValue = parseFloat(value);
      
      // עדכן רק אם הערך תקין
      if (!isNaN(priceValue)) {
        // עדכון שדה מחיר לילה
        setBooking(prev => ({
          ...prev,
          pricePerNight: priceValue.toString()
        }));
      }
    };
    
    // טיפול בשינוי בשדה מחיר לילה כולל מע"מ
    const handlePriceWithVATChange = (e) => {
      const { value } = e.target;
      setPriceWithVAT(value);
      
      if (value === "") {
        setBooking(prev => ({
          ...prev,
          pricePerNight: ""
        }));
        setTotalPrice('');
        return;
      }
      
      // המרה למספר
      const priceWithVATValue = parseFloat(value);
      
      // בדיקה שהערך תקין
      if (isNaN(priceWithVATValue)) {
        return;
      }
      
      // חישוב מחיר לילה ללא מע"מ
      if (booking.tourist) {
        // לתייר - המחיר זהה
        setBooking(prev => ({
          ...prev,
          pricePerNight: priceWithVATValue.toString()
        }));
      } else {
        // לישראלי - חישוב מחיר ללא מע"מ
        const priceWithoutVAT = calculatePriceWithoutVAT(priceWithVATValue);
        if (!isNaN(priceWithoutVAT)) {
          setBooking(prev => ({
            ...prev,
            pricePerNight: priceWithoutVAT.toString()
          }));
        }
      }
    };
    
    // טיפול בשינוי בשדה מחיר כולל להזמנה
    const handleTotalPriceChange = (e) => {
      const { value } = e.target;
      setTotalPrice(value);
      
      if (value === '') {
        return;
      }
      
      // המרה למספר
      const totalPriceValue = parseFloat(value);
      
      // בדיקה שהערך תקין
      if (isNaN(totalPriceValue)) {
        return;
      }
      
      // חשב את המחיר לילה בהתאם לסך הכל ומספר הלילות
      const nights = calculateNights();
      if (nights > 0) {
        const pricePerNightValue = totalPriceValue / nights;
        
        if (booking.tourist) {
          // לתייר - המחיר לילה הוא פשוט הסכום הכולל חלקי מספר הלילות
          setBooking(prev => ({
            ...prev,
            pricePerNight: Math.round(pricePerNightValue).toString()
          }));
          setPriceWithVAT(Math.round(pricePerNightValue).toString());
        } else {
          // לישראלי - צריך לחשב את המחיר ללא מע"מ
          const priceWithoutVAT = Math.round(pricePerNightValue / 1.17);
          setBooking(prev => ({
            ...prev,
            pricePerNight: priceWithoutVAT.toString()
          }));
          setPriceWithVAT(Math.round(pricePerNightValue).toString());
        }
      }
    };
    
    // טיפול בשינוי בשדות טופס
    const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      
      // טיפול בסוגים שונים של שדות קלט
      let fieldValue;
      
      if (type === 'checkbox') {
        fieldValue = checked;
      } else if (type === 'number') {
        // המרה לטיפוס מספרי עבור שדות מספרים
        fieldValue = value === '' ? '' : Number(value);
      } else {
        // שדות טקסט רגילים - שמירה כמחרוזת
        fieldValue = value;
      }
      
      // הדפסה ספציפית עבור שינוי אמצעי תשלום
      if (name === 'paymentMethod') {
        console.log('[Input Change] paymentMethod changed to:', fieldValue);
      }
      
      // עדכון State של ההזמנה
      setBooking(prev => ({
        ...prev,
        [name]: fieldValue
      }));
      
      // עדכון השדות הנוספים לפי הצורך
      if (name === 'tourist') {
        setIsTouristField(fieldValue);
        
        // עדכון המחיר עם/בלי מע"מ בהתאם לשינוי סטטוס התייר
        if (booking.pricePerNight) {
          const price = parseFloat(booking.pricePerNight);
          if (!isNaN(price)) {
            if (fieldValue) { // אם עכשיו תייר
              // המחיר ללא מע"מ זהה למחיר הבסיסי
              setPriceWithVAT(price.toString());
            } else { // אם עכשיו לא תייר
              // צריך לחשב מחיר עם מע"מ
              const priceWithVat = calculatePriceWithVAT(price);
              setPriceWithVAT(priceWithVat.toString());
            }
          }
        }
      }
    };
    
    // טיפול באירוע פוקוס
    const handleFocus = (fieldName) => {
      setFocusedField(fieldName);
    };
    
    // טיפול באירוע סיום פוקוס
    const handleBlur = () => {
      setFocusedField(null);
    };
    
    // סגירת הדיאלוג
    const handleClose = () => {
      // ניקוי שדות - חשוב לכלול את כל השדות האפשריים
      setBooking({
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
        paymentMethod: "cash",
        isPaid: false,
        creditCard: "",
        cardHolderName: "",
        expiryDate: "",
        cvv: ""
      });
      setPriceWithVAT("");
      setTotalPrice("");
      setNightsCount(0);
      setFormErrors({});
      setIsEditMode(false);
      setIsTouristField(false);
      setFocusedField(null);
      
      // סגירת הדיאלוג
      onClose();
    };
    
    // טיפול בביטול הזמנה
    const handleCancelBooking = async () => {
      console.log('פונקציית ביטול הזמנה הופעלה');
      console.log('פרטי ההזמנה לביטול:', booking);
      
      try {
        // וידוא שיש מזהה להזמנה
        const bookingId = booking._id || selectedBooking?._id;
        if (!bookingId) {
          console.error('אין מזהה הזמנה, לא ניתן לבטל', booking);
          alert('שגיאה בביטול ההזמנה: חסר מזהה הזמנה');
          return;
        }
        
        if (!window.confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) {
          console.log('המשתמש ביטל את פעולת הביטול');
          return;
        }
        
        console.log('שולח בקשת ביטול לשרת עבור הזמנה:', bookingId);
        
        // שינוי סטטוס ההזמנה ל"מבוטל" באמצעות נקודת הקצה הנכונה
        // תיקון כפילות /api במסלול
        const apiUrl = process.env.REACT_APP_API_URL;
        // הסרת /api מהסוף של apiUrl אם קיים
        const baseUrl = apiUrl.endsWith('/api') ? apiUrl : apiUrl;
        
        console.log('כתובת בסיס API:', baseUrl);
        const response = await axios.post(
          `${baseUrl}/bookings/${bookingId}/cancel`,
          {},
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
        );
        
        console.log('תשובה התקבלה מהשרת:', response.data);
        
        if (response.data.success) {
          // רענון רשימת ההזמנות בקונטקסט
          contextFetchBookings();
          
          // סגירת הדיאלוג
          handleClose();
          
          // הודעה למשתמש
          alert('ההזמנה בוטלה בהצלחה');
        } else {
          console.error('שגיאה בביטול ההזמנה:', response.data.message);
          alert(`שגיאה בביטול ההזמנה: ${response.data.message}`);
        }
      } catch (error) {
        console.error('שגיאה בביטול ההזמנה:', error);
        alert(`שגיאה בביטול ההזמנה: ${error.response?.data?.message || error.message}`);
      }
    };
    
    // שמירת ההזמנה - הפונקציה שמופעלת כשלוחצים על כפתור שמירה
    const handleSaveClick = async () => {
      try {
        console.log('[Save Click] Current booking state before validation:', booking);
        console.log('[Save Click] paymentMethod in state before save:', booking.paymentMethod);
        // ולידציה
        const errors = validateBooking();
        if (Object.keys(errors).length > 0) {
          console.log('שגיאות ולידציה:', errors);
          setFormErrors(errors);
          return;
        }
        
        // המרה והכנה של תאריכים בפורמט נכון
        const formattedStartDate = booking.startDate instanceof Date 
          ? format(booking.startDate, 'yyyy-MM-dd')
          : booking.startDate
            ? format(new Date(booking.startDate), 'yyyy-MM-dd')
            : null;
            
        const formattedEndDate = booking.endDate instanceof Date
          ? format(booking.endDate, 'yyyy-MM-dd')
          : booking.endDate
            ? format(new Date(booking.endDate), 'yyyy-MM-dd')
            : null;
        
        // בדיקה נוספת של תאריכים
        console.log('תאריכים המקוריים:', {
          startDate: booking.startDate,
          endDate: booking.endDate,
          startDateType: typeof booking.startDate,
          endDateType: typeof booking.endDate,
          isStartDate: booking.startDate instanceof Date,
          isEndDate: booking.endDate instanceof Date
        });
        
        console.log('תאריכים מפורמטים:', {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        });
        
        // הכנת אובייקט ההזמנה לשליחה
        const bookingData = {
          ...booking,
          // העברת המזהה המקורי אם זו הזמנה קיימת
          _id: isEditMode ? booking._id : undefined,
          // וידוא שיש חדר תקין
          roomId: booking.roomId || "",
          // המרת התאריכים לפורמט yyyy-MM-dd
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          // השתמש בשמות השדות שהשרת מצפה להם
          checkIn: formattedStartDate,
          checkOut: formattedEndDate,
          // וידוא שהמחירים הם מספרים תקינים או אפס
          pricePerNight: booking.pricePerNight ? parseFloat(booking.pricePerNight) : 0,
          pricePerNightNoVat: booking.pricePerNightNoVat ? parseFloat(booking.pricePerNightNoVat) : 0,
          totalPrice: booking.totalPrice ? parseFloat(booking.totalPrice) : 0,
          // ספירת לילות
          nights: nightsCount || 1,
          // הגדרת סטטוס
          status: booking.status || 'confirmed',
          // Always save the selected payment method, default to 'cash' if somehow empty
          paymentMethod: booking.paymentMethod,
          paymentStatus: booking.isPaid ? 'paid' : 'pending',
          // שמירת פרטי האורח גם באובייקט האורח וגם בשורש ההזמנה
          guest: {
            firstName: booking.firstName || '',
            lastName: booking.lastName || '',
            phone: booking.phone || '',
            email: booking.email || ''
          },
          // יצירת אובייקט נתוני כרטיס אשראי
          creditCard: {
            cardNumber: booking.creditCard ? booking.creditCard.replace(/\s/g, '') : '', // השדה הנכון שהשרת מצפה לו
            number: booking.creditCard ? booking.creditCard.replace(/\s/g, '') : '', // שמירה גם בשדה השני ליתר ביטחון
            cardHolderName: booking.cardHolderName || '',
            expiryDate: booking.expiryDate || '',
            cvv: booking.cvv || ''
          }
        };
        
        // מחיקת שדות כרטיס האשראי מהשורש כדי למנוע כפילות
        delete bookingData.cardHolderName;
        delete bookingData.expiryDate;
        delete bookingData.cvv;
        
        console.log('[Save Click] Final bookingData being sent:', bookingData);
        console.log('[Save Click] paymentMethod in final bookingData:', bookingData.paymentMethod);
        
        console.log('נתוני כרטיס אשראי לשמירה:', {
          מספר_כרטיס: bookingData.creditCard.cardNumber,
          שדה_מספר_חלופי: bookingData.creditCard.number,
          תוקף: bookingData.creditCard.expiryDate,
          cvv: bookingData.creditCard.cvv,
          שם_בעל_כרטיס: bookingData.creditCard.cardHolderName
        });

        // תיקון כפילות /api במסלול
        const apiUrl = process.env.REACT_APP_API_URL;
        // הסרת /api מהסוף של apiUrl אם קיים
        const baseUrl = apiUrl.endsWith('/api') ? apiUrl : apiUrl;
        console.log('כתובת בסיס API:', baseUrl);
        
        // בדיקה אם זו עריכת הזמנה קיימת או יצירת הזמנה חדשה
        if (isEditMode && booking._id) {
          console.log('עדכון הזמנה קיימת:', booking._id);
          
          // שליחת בקשת עדכון לשרת
          const response = await axios.put(
            `${baseUrl}/bookings/${booking._id}`,
            bookingData,
            { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
          );
          
          if (response.data.success) {
            console.log('הזמנה עודכנה בהצלחה:', response.data);
            contextFetchBookings();
            onClose();
            alert('ההזמנה עודכנה בהצלחה');
          } else {
            console.error('שגיאה בעדכון ההזמנה:', response.data.message);
            alert(`שגיאה בעדכון ההזמנה: ${response.data.message}`);
          }
        } else {
          console.log('יצירת הזמנה חדשה');
          
          // שליחת בקשת יצירה לשרת
          const response = await axios.post(
            `${baseUrl}/bookings`,
            bookingData,
            { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
          );
          
          if (response.data.success) {
            console.log('הזמנה נוצרה בהצלחה:', response.data);
            contextFetchBookings();
            onClose();
            alert('ההזמנה נוצרה בהצלחה');
          } else {
            console.error('שגיאה ביצירת ההזמנה:', response.data.message);
            alert(`שגיאה ביצירת ההזמנה: ${response.data.message}`);
          }
        }
      } catch (error) {
        console.error('שגיאה בשמירת ההזמנה:', error);
        alert(`שגיאה בשמירת ההזמנה: ${error.response?.data?.message || error.message}`);
        
        if (error.response) {
          console.log('תשובת השרת:', error.response.data);
          console.log('קוד סטטוס:', error.response.status);
        }
      }
    };
    
    // ולידציה של ההזמנה
    const validateBooking = () => {
      const errors = {};
      
      // בדיקת שדות חובה
      if (!booking.roomId) {
        errors.roomId = 'נא לבחור חדר';
      }
      
      if (!booking.firstName || (typeof booking.firstName === 'string' && booking.firstName.trim() === '')) {
        errors.firstName = 'נא להזין שם פרטי';
      }
      
      if (!booking.lastName || (typeof booking.lastName === 'string' && booking.lastName.trim() === '')) {
        errors.lastName = 'נא להזין שם משפחה';
      }
      
      if (booking.email && typeof booking.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) {
        errors.email = 'נא להזין כתובת אימייל תקינה';
      }
      
      if (!booking.phone || (typeof booking.phone === 'string' && booking.phone.trim() === '')) {
        errors.phone = 'נא להזין מספר טלפון';
      } else if (booking.phone && typeof booking.phone === 'string' && booking.phone.length < 9) {
        errors.phone = 'מספר הטלפון קצר מדי';
      }
      
      // בדיקת תאריכים
      if (!booking.startDate) {
        errors.startDate = 'נא לבחור תאריך צ\'ק אין';
      }
      
      if (!booking.endDate) {
        errors.endDate = 'נא לבחור תאריך צ\'ק אאוט';
      }
      
      if (booking.startDate && booking.endDate) {
        const startTime = new Date(booking.startDate).getTime();
        const endTime = new Date(booking.endDate).getTime();
        
        if (isNaN(startTime) || isNaN(endTime)) {
          if (isNaN(startTime)) {
            errors.startDate = 'תאריך צ\'ק אין לא תקין';
          }
          if (isNaN(endTime)) {
            errors.endDate = 'תאריך צ\'ק אאוט לא תקין';
          }
        } else if (startTime >= endTime) {
          errors.endDate = 'תאריך צ\'ק אאוט חייב להיות לאחר תאריך צ\'ק אין';
        }
      }
      
      // בדיקת מחיר - תיקון בטוח ללא trim()
      if (!booking.pricePerNight) {
        errors.pricePerNight = 'נא להזין מחיר ללילה';
      } else {
        // המרה בטוחה למספר
        let priceString = booking.pricePerNight;
        if (typeof priceString !== 'string') {
          priceString = String(priceString);
        }
        
        const price = parseFloat(priceString);
        if (isNaN(price) || price <= 0) {
          errors.pricePerNight = 'נא להזין מחיר תקין';
        }
      }
      
      // בדיקות נוספות
      if (booking.adults === undefined || booking.adults === null || parseInt(booking.adults) < 1) {
        errors.adults = 'נא להזין לפחות אדם אחד';
      }
      
      console.log('תוצאות ולידציה:', errors);
      return errors;
    };
    
    // עדכון שדה מחיר לילה כולל מע"מ
    useEffect(() => {
      // רק אם אין פוקוס על שדה מחיר כולל מע"מ
      if (focusedField !== 'priceWithVAT') {
        if (!booking.pricePerNight || booking.pricePerNight === '') {
          setPriceWithVAT("");
          return;
        }
        
        // המרה למספר ובדיקת תקינות
        const priceValue = parseFloat(booking.pricePerNight);
        if (isNaN(priceValue)) {
          setPriceWithVAT("");
          return;
        }
        
        if (booking.tourist) {
          setPriceWithVAT(priceValue.toString());
        } else {
          const calculatedPriceWithVAT = calculatePriceWithVAT(priceValue);
          setPriceWithVAT(calculatedPriceWithVAT.toString());
        }
      }
    }, [booking.pricePerNight, booking.tourist, focusedField]);
    
    // עדכון מספר הלילות בכל שינוי של תאריכי ההזמנה
    useEffect(() => {
      const nights = calculateNights();
      setNightsCount(nights);
      
      // עדכון סה"כ להזמנה
      if (nights > 0 && booking.pricePerNight && booking.pricePerNight !== '') {
        const priceValue = parseFloat(booking.pricePerNight);
        
        // בדיקה שהמחיר תקין
        if (isNaN(priceValue)) {
          setTotalPrice('');
          return;
        }
        
        let finalPrice;
        if (booking.tourist) {
          finalPrice = priceValue * nights;
        } else {
          const priceWithVAT = calculatePriceWithVAT(priceValue);
          finalPrice = priceWithVAT * nights;
        }
        
        // רק אם אין פוקוס על שדה סה"כ להזמנה
        if (focusedField !== 'totalPrice') {
          setTotalPrice(finalPrice.toString());
        }
      } else {
        // אם אין לילות או אין מחיר, אפס את שדה הסה"כ
        if (focusedField !== 'totalPrice') {
          setTotalPrice('');
        }
      }
    }, [booking.startDate, booking.endDate, booking.pricePerNight, booking.tourist, focusedField]);
    
    // פתיחת חלון חשבונית
    const handleOpenInvoice = () => {
      if (!booking || !booking._id) {
        alert('לא ניתן להציג חשבונית להזמנה שעדיין לא נשמרה');
        return;
      }

      // פתיחת חלון חדש לתצוגת החשבונית
      const invoiceWindow = window.open('', '_blank', 'width=800,height=800');
      
      if (!invoiceWindow) {
        alert('הדפדפן חסם את פתיחת החלון החדש. אנא אפשר חלונות קופצים עבור אתר זה.');
        return;
      }
      
      // הכנת הנתונים לתצוגת החשבונית
      const roomDetails = rooms.find(r => r._id === booking.roomId);
      const roomNumber = roomDetails ? roomDetails.roomNumber : 'לא ידוע';
      
      // חישוב תאריכים
      const checkInDate = booking.startDate ? new Date(booking.startDate) : new Date();
      const checkOutDate = booking.endDate ? new Date(booking.endDate) : new Date();
      
      // פורמט תאריכים לעברית
      const formatHebrewDate = (date) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString('he-IL', options);
      };
      
      // מע"מ וסכומים - תיקון החישובים
      const vatRate = booking.tourist ? 0 : 0.18;
      
      // חישוב נכון - מניחים שהמחיר הבסיסי הוא ללא מע"מ
      const pricePerNightNoVat = booking.pricePerNight ? parseFloat(booking.pricePerNight) / (1 + vatRate) : 0;
      const totalNights = booking.nights || nightsCount || 1;
      
      // סכום לפני מע"מ = מחיר ללילה ללא מע"מ * מספר לילות
      const totalWithoutVat = pricePerNightNoVat * totalNights;
      
      // סכום המע"מ = סכום לפני מע"מ * שיעור המע"מ
      const totalVatAmount = booking.tourist ? 0 : (totalWithoutVat * vatRate);
      
      // סכום כולל = סכום לפני מע"מ + סכום המע"מ
      const totalAmount = totalWithoutVat + totalVatAmount;

      // שם הלקוח
      const guestName = `${booking.firstName || booking.guest?.firstName || ''} ${booking.lastName || booking.guest?.lastName || ''}`.trim() || 'אורח';

      // יצירת תוכן החשבונית בעברית
      // שימוש ב-RTL ועיצוב מותאם לעברית
      const invoiceContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <title>INV-${booking.bookingNumber || booking._id?.substring(0, 6) || 'XXXXXX'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap');
            
            body {
              font-family: 'Rubik', sans-serif;
              background-color: #f8f8f8;
              margin: 0;
              padding: 20px;
              direction: rtl;
              text-align: right;
            }
            
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background-color: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              border-radius: 4px;
              padding: 30px;
            }
            
            .invoice-header {
              padding-bottom: 15px;
              border-bottom: 1px solid #e0e0e0;
              margin-bottom: 20px;
              text-align: center;
            }
            
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            
            .company-details {
              font-size: 14px;
              color: #666;
              margin-bottom: 15px;
              line-height: 1.4;
            }
            
            .invoice-number {
              font-size: 15px;
              font-weight: 500;
              color: #333;
              margin-top: 10px;
            }
            
            .invoice-date {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            
            .invoice-title {
              font-size: 24px;
              font-weight: 500;
              color: #333;
              margin: 20px 0;
              text-align: center;
              position: relative;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            
            .customer-section {
              margin: 20px 0;
              padding: 10px 15px;
              background-color: #f9f9f9;
              border-radius: 4px;
            }
            
            .customer-title {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            
            .customer-name {
              font-size: 16px;
              font-weight: 500;
              color: #333;
            }
            
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            
            .invoice-table th {
              background-color: #f5f5f5;
              color: #333;
              padding: 10px;
              text-align: right;
              font-weight: 500;
              font-size: 14px;
              border-bottom: 1px solid #ddd;
            }
            
            .invoice-table tr:nth-child(even) {
              background-color: #fcfcfc;
            }
            
            .invoice-table td {
              padding: 10px;
              border-bottom: 1px solid #eee;
              color: #333;
              font-size: 14px;
            }
            
            .invoice-table .align-right {
              text-align: left;
            }
            
            .price-note {
              font-size: 12px;
              color: #888;
              text-align: right;
              margin-top: 5px;
            }
            
            .invoice-total {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
              font-size: 14px;
            }
            
            .invoice-total-table {
              width: 40%;
              border-collapse: collapse;
            }
            
            .invoice-total-table td {
              padding: 8px 10px;
              border-bottom: 1px solid #eee;
            }
            
            .invoice-total-table .total-row {
              font-weight: bold;
              font-size: 16px;
              background-color: #f9f9f9;
              color: #333;
              border-top: 1px solid #ddd;
            }
            
            .invoice-notes {
              margin-top: 20px;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 4px;
              color: #666;
            }
            
            .invoice-notes strong {
              color: #333;
            }
            
            .print-button {
              display: block;
              margin: 20px auto;
              padding: 10px 20px;
              background-color: #4a6da7;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-family: 'Rubik', sans-serif;
              font-size: 14px;
              font-weight: 500;
            }
            
            .print-button:hover {
              background-color: #3a5a8c;
            }
            
            @media print {
              body {
                background-color: white;
                padding: 0;
              }
              
              .invoice-container {
                box-shadow: none;
                padding: 10px;
              }
              
              .print-button {
                display: none;
              }
              
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button class="print-button" onclick="window.print()">הדפס חשבונית</button>
          </div>
          
          <div class="invoice-container">
            <div class="invoice-header">
              <div class="company-name">דיאם אס הוטלס</div>
              <div class="company-details">
                רוטשילד 79, פתח תקווה<br>
                ח.פ. 516679909
              </div>
              <div class="invoice-date">תאריך: ${formatHebrewDate(new Date())}</div>
              <div class="invoice-number">מספר חשבונית: INV-${booking.bookingNumber || booking._id?.substring(0, 6) || 'XXXXXX'}</div>
            </div>
            
            <div class="invoice-title">חשבונית מס מקור</div>
            
            <div class="customer-section">
              <div class="customer-title">לכבוד:</div>
              <div class="customer-name">${guestName}</div>
            </div>
            
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>תיאור</th>
                  <th>חדר</th>
                  <th>תאריכים</th>
                  <th>לילות</th>
                  <th>מחיר ללילה (ללא מע"מ)</th>
                  <th class="align-right">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>שירותי אירוח</td>
                  <td>${roomNumber}</td>
                  <td>${formatHebrewDate(checkInDate)} - ${formatHebrewDate(checkOutDate)}</td>
                  <td>${totalNights}</td>
                  <td>₪${pricePerNightNoVat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td class="align-right">₪${totalWithoutVat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              </tbody>
            </table>
            <div class="price-note">* המחירים המוצגים הם ללא מע"מ</div>
            
            <div class="invoice-total">
              <table class="invoice-total-table">
                <tr>
                  <td>סכום לפני מע"מ:</td>
                  <td class="align-right">₪${totalWithoutVat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
                <tr>
                  <td>מע"מ (${booking.tourist ? '0' : '18'}%):</td>
                  <td class="align-right">₪${totalVatAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
                <tr class="total-row">
                  <td>סה"כ לתשלום:</td>
                  <td class="align-right">₪${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              </table>
            </div>
            
            ${booking.notes ? `
            <div class="invoice-notes">
              <p><strong>הערות:</strong></p>
              <p>${booking.notes}</p>
            </div>
            ` : ''}
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button class="print-button" onclick="window.print()">הדפס חשבונית</button>
          </div>
        </body>
        </html>
      `;
      
      // כתיבת תוכן החשבונית לחלון החדש
      invoiceWindow.document.open();
      invoiceWindow.document.write(invoiceContent);
      invoiceWindow.document.close();
    };
    
    // פתיחת חלון חשבונית באנגלית
    const handleOpenEnglishInvoice = () => {
      if (!booking || !booking._id) {
        alert('לא ניתן להציג חשבונית להזמנה שעדיין לא נשמרה');
        return;
      }

      // פתיחת חלון חדש לתצוגת החשבונית
      const invoiceWindow = window.open('', '_blank', 'width=800,height=800');
      
      if (!invoiceWindow) {
        alert('הדפדפן חסם את פתיחת החלון החדש. אנא אפשר חלונות קופצים עבור אתר זה.');
        return;
      }
      
      // הכנת הנתונים לתצוגת החשבונית
      const roomDetails = rooms.find(r => r._id === booking.roomId);
      const roomNumber = roomDetails ? roomDetails.roomNumber : 'Unknown';
      
      // חישוב תאריכים
      const checkInDate = booking.startDate ? new Date(booking.startDate) : new Date();
      const checkOutDate = booking.endDate ? new Date(booking.endDate) : new Date();
      
      // פורמט תאריכים באנגלית
      const formatEnglishDate = (date) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString('en-US', options);
      };
      
      // מע"מ וסכומים - תיקון החישובים
      const vatRate = booking.tourist ? 0 : 0.18;
      
      // חישוב נכון - מניחים שהמחיר הבסיסי הוא ללא מע"מ
      const pricePerNightNoVat = booking.pricePerNight ? parseFloat(booking.pricePerNight) / (1 + vatRate) : 0;
      const totalNights = booking.nights || nightsCount || 1;
      
      // סכום לפני מע"מ = מחיר ללילה ללא מע"מ * מספר לילות
      const totalWithoutVat = pricePerNightNoVat * totalNights;
      
      // סכום המע"מ = סכום לפני מע"מ * שיעור המע"מ
      const totalVatAmount = booking.tourist ? 0 : (totalWithoutVat * vatRate);
      
      // סכום כולל = סכום לפני מע"מ + סכום המע"מ
      const totalAmount = totalWithoutVat + totalVatAmount;

      // שם הלקוח
      const guestName = `${booking.firstName || booking.guest?.firstName || ''} ${booking.lastName || booking.guest?.lastName || ''}`.trim() || 'Guest';

      // יצירת תוכן החשבונית באנגלית
      // שימוש ב-LTR ועיצוב מותאם לאנגלית
      const invoiceContent = `
        <!DOCTYPE html>
        <html dir="ltr" lang="en">
        <head>
          <meta charset="UTF-8">
          <title>INV-${booking.bookingNumber || booking._id?.substring(0, 6) || 'XXXXXX'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap');
            
            body {
              font-family: 'Rubik', sans-serif;
              background-color: #f8f8f8;
              margin: 0;
              padding: 20px;
              direction: ltr;
              text-align: left;
            }
            
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background-color: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              border-radius: 4px;
              padding: 30px;
            }
            
            .invoice-header {
              padding-bottom: 15px;
              border-bottom: 1px solid #e0e0e0;
              margin-bottom: 20px;
              text-align: center;
            }
            
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            
            .company-details {
              font-size: 14px;
              color: #666;
              margin-bottom: 15px;
              line-height: 1.4;
            }
            
            .invoice-number {
              font-size: 15px;
              font-weight: 500;
              color: #333;
              margin-top: 10px;
            }
            
            .invoice-date {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            
            .invoice-title {
              font-size: 24px;
              font-weight: 500;
              color: #333;
              margin: 20px 0;
              text-align: center;
              position: relative;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            
            .customer-section {
              margin: 20px 0;
              padding: 10px 15px;
              background-color: #f9f9f9;
              border-radius: 4px;
            }
            
            .customer-title {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            
            .customer-name {
              font-size: 16px;
              font-weight: 500;
              color: #333;
            }
            
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            
            .invoice-table th {
              background-color: #f5f5f5;
              color: #333;
              padding: 10px;
              text-align: left;
              font-weight: 500;
              font-size: 14px;
              border-bottom: 1px solid #ddd;
            }
            
            .invoice-table tr:nth-child(even) {
              background-color: #fcfcfc;
            }
            
            .invoice-table td {
              padding: 10px;
              border-bottom: 1px solid #eee;
              color: #333;
              font-size: 14px;
            }
            
            .invoice-table .align-right {
              text-align: right;
            }
            
            .price-note {
              font-size: 12px;
              color: #888;
              text-align: left;
              margin-top: 5px;
            }
            
            .invoice-total {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
              font-size: 14px;
            }
            
            .invoice-total-table {
              width: 40%;
              border-collapse: collapse;
            }
            
            .invoice-total-table td {
              padding: 8px 10px;
              border-bottom: 1px solid #eee;
            }
            
            .invoice-total-table .total-row {
              font-weight: bold;
              font-size: 16px;
              background-color: #f9f9f9;
              color: #333;
              border-top: 1px solid #ddd;
            }
            
            .invoice-notes {
              margin-top: 20px;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 4px;
              color: #666;
            }
            
            .invoice-notes strong {
              color: #333;
            }
            
            .print-button {
              display: block;
              margin: 20px auto;
              padding: 10px 20px;
              background-color: #4a6da7;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-family: 'Rubik', sans-serif;
              font-size: 14px;
              font-weight: 500;
            }
            
            .print-button:hover {
              background-color: #3a5a8c;
            }
            
            @media print {
              body {
                background-color: white;
                padding: 0;
              }
              
              .invoice-container {
                box-shadow: none;
                padding: 10px;
              }
              
              .print-button {
                display: none;
              }
              
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button class="print-button" onclick="window.print()">Print Invoice</button>
          </div>
          
          <div class="invoice-container">
            <div class="invoice-header">
              <div class="company-name">DM Hotels</div>
              <div class="company-details">
                Rothschild 79, Petah Tikva<br>
                ID. 516679909
              </div>
              <div class="invoice-date">Date: ${formatEnglishDate(new Date())}</div>
              <div class="invoice-number">Invoice Number: INV-${booking.bookingNumber || booking._id?.substring(0, 6) || 'XXXXXX'}</div>
            </div>
            
            <div class="invoice-title">Tax Invoice</div>
            
            <div class="customer-section">
              <div class="customer-title">Bill To:</div>
              <div class="customer-name">${guestName}</div>
            </div>
            
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Room</th>
                  <th>Dates</th>
                  <th>Nights</th>
                  <th>Price per night (excl. VAT)</th>
                  <th class="align-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Accommodation Services</td>
                  <td>${roomNumber}</td>
                  <td>${formatEnglishDate(checkInDate)} - ${formatEnglishDate(checkOutDate)}</td>
                  <td>${totalNights}</td>
                  <td>₪${pricePerNightNoVat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td class="align-right">₪${totalWithoutVat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              </tbody>
            </table>
            <div class="price-note">* Prices shown are excluding VAT</div>
            
            <div class="invoice-total">
              <table class="invoice-total-table">
                <tr>
                  <td>Amount before VAT:</td>
                  <td class="align-right">₪${totalWithoutVat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
                <tr>
                  <td>VAT (${booking.tourist ? '0' : '18'}%):</td>
                  <td class="align-right">₪${totalVatAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
                <tr class="total-row">
                  <td>Total Amount:</td>
                  <td class="align-right">₪${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              </table>
            </div>
            
            ${booking.notes ? `
            <div class="invoice-notes">
              <p><strong>Notes:</strong></p>
              <p>${booking.notes}</p>
            </div>
            ` : ''}
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button class="print-button" onclick="window.print()">Print Invoice</button>
          </div>
        </body>
        </html>
      `;
      
      // כתיבת תוכן החשבונית לחלון החדש
      invoiceWindow.document.open();
      invoiceWindow.document.write(invoiceContent);
      invoiceWindow.document.close();
    };
    
    // פתיחת חלון אישור הזמנה
    const handleOpenBookingConfirmation = () => {
      if (!booking || !booking._id) {
        alert('לא ניתן להציג אישור הזמנה עבור הזמנה שעדיין לא נשמרה');
        return;
      }

      // פתיחת חלון חדש לתצוגת אישור ההזמנה
      const confirmationWindow = window.open('', '_blank', 'width=800,height=800');
      
      if (!confirmationWindow) {
        alert('הדפדפן חסם את פתיחת החלון החדש. אנא אפשר חלונות קופצים עבור אתר זה.');
        return;
      }
      
      // הכנת הנתונים לתצוגת אישור ההזמנה
      const roomDetails = rooms.find(r => r._id === booking.roomId);
      const roomNumber = roomDetails ? roomDetails.roomNumber : 'לא ידוע';
      const roomName = roomDetails ? roomDetails.name : '';
      
      // חישוב תאריכים
      const checkInDate = booking.startDate ? new Date(booking.startDate) : new Date();
      const checkOutDate = booking.endDate ? new Date(booking.endDate) : new Date();
      
      // פורמט תאריכים לעברית
      const formatHebrewDate = (date) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString('he-IL', options);
      };
      
      // מע"מ וסכומים
      const vatRate = booking.tourist ? 0 : 0.18;
      const pricePerNightNoVat = booking.pricePerNight ? parseFloat(booking.pricePerNight) : 0;
      const totalNights = booking.nights || nightsCount || 1;
      const totalWithoutVat = pricePerNightNoVat * totalNights;
      const totalVatAmount = booking.tourist ? 0 : (totalWithoutVat * vatRate);
      const totalAmount = totalWithoutVat + totalVatAmount;
      
      // שם הלקוח
      const guestName = `${booking.firstName || booking.guest?.firstName || ''} ${booking.lastName || booking.guest?.lastName || ''}`.trim() || 'אורח';

      // יצירת תוכן אישור ההזמנה
      const confirmationContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <title>אישור הזמנה: ${booking.bookingNumber || booking._id?.substring(0, 6) || 'XXXXXX'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap');
            
            body {
              font-family: 'Rubik', sans-serif;
              background-color: #f8f8f8;
              margin: 0;
              padding: 20px;
              direction: rtl;
              text-align: right;
            }
            
            .confirmation-container {
              max-width: 800px;
              margin: 0 auto;
              background-color: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              border-radius: 4px;
              padding: 30px;
            }
            
            .confirmation-header {
              padding-bottom: 15px;
              border-bottom: 1px solid #e0e0e0;
              margin-bottom: 20px;
              text-align: center;
            }
            
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            
            .company-details {
              font-size: 14px;
              color: #666;
              margin-bottom: 15px;
              line-height: 1.4;
            }
            
            .confirmation-number {
              font-size: 15px;
              font-weight: 500;
              color: #333;
              margin-top: 10px;
            }
            
            .confirmation-date {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            
            .confirmation-title {
              font-size: 24px;
              font-weight: 500;
              color: #333;
              margin: 20px 0;
              text-align: center;
              position: relative;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            
            .guest-section {
              margin: 20px 0;
              padding: 10px 15px;
              background-color: #f9f9f9;
              border-radius: 4px;
            }
            
            .guest-title {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            
            .guest-name {
              font-size: 16px;
              font-weight: 500;
              color: #333;
            }
            
            .booking-details {
              margin: 20px 0;
              border: 1px solid #eee;
              border-radius: 4px;
              overflow: hidden;
            }
            
            .booking-details-title {
              background-color: #f5f5f5;
              padding: 10px 15px;
              font-weight: 500;
              color: #333;
              border-bottom: 1px solid #eee;
            }
            
            .booking-details-content {
              padding: 15px;
            }
            
            .booking-details-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            
            .booking-detail-item {
              margin-bottom: 10px;
            }
            
            .detail-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 2px;
            }
            
            .detail-value {
              font-size: 14px;
              font-weight: 500;
              color: #333;
            }
            
            .room-details {
              margin: 20px 0;
              border: 1px solid #eee;
              border-radius: 4px;
              overflow: hidden;
            }
            
            .price-details {
              margin: 20px 0;
              border: 1px solid #eee;
              border-radius: 4px;
              overflow: hidden;
            }
            
            .price-table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .price-table td {
              padding: 10px 15px;
              border-bottom: 1px solid #eee;
            }
            
            .price-table tr:last-child td {
              border-bottom: none;
            }
            
            .price-label {
              font-size: 14px;
              color: #333;
            }
            
            .price-value {
              font-size: 14px;
              font-weight: 500;
              color: #333;
              text-align: left;
            }
            
            .total-row {
              background-color: #f9f9f9;
              font-weight: bold;
            }
            
            .cancellation-policy {
              margin: 20px 0;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 4px;
              border-left: 4px solid #4a6da7;
            }
            
            .policy-title {
              font-size: 16px;
              font-weight: 500;
              color: #333;
              margin-bottom: 10px;
            }
            
            .policy-text {
              font-size: 14px;
              color: #666;
              line-height: 1.5;
            }
            
            .print-button {
              display: block;
              margin: 20px auto;
              padding: 10px 20px;
              background-color: #4a6da7;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-family: 'Rubik', sans-serif;
              font-size: 14px;
              font-weight: 500;
            }
            
            .print-button:hover {
              background-color: #3a5a8c;
            }
            
            @media print {
              body {
                background-color: white;
                padding: 0;
              }
              
              .confirmation-container {
                box-shadow: none;
                padding: 10px;
              }
              
              .print-button {
                display: none;
              }
              
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button class="print-button" onclick="window.print()">הדפס אישור הזמנה</button>
          </div>
          
          <div class="confirmation-container">
            <div class="confirmation-header">
              <div class="company-name">דיאם אס הוטלס</div>
              <div class="company-details">
                רוטשילד 79, פתח תקווה<br>
                טלפון: 03-1234567
              </div>
              <div class="confirmation-date">תאריך: ${formatHebrewDate(new Date())}</div>
              <div class="confirmation-number">מספר הזמנה: ${booking.bookingNumber || booking._id?.substring(0, 6) || 'XXXXXX'}</div>
            </div>
            
            <div class="confirmation-title">אישור הזמנה</div>
            
            <div class="guest-section">
              <div class="guest-title">שלום</div>
              <div class="guest-name">${guestName}</div>
            </div>
            
            <p>אנו שמחים לאשר את ביצוע ההזמנה שלך ומצפים לארח אותך.</p>
            
            <div class="booking-details">
              <div class="booking-details-title">פרטי ההזמנה</div>
              <div class="booking-details-content">
                <div class="booking-details-grid">
                  <div class="booking-detail-item">
                    <div class="detail-label">תאריך הגעה (צ'ק אין)</div>
                    <div class="detail-value">${formatHebrewDate(checkInDate)}</div>
                  </div>
                  <div class="booking-detail-item">
                    <div class="detail-label">תאריך עזיבה (צ'ק אאוט)</div>
                    <div class="detail-value">${formatHebrewDate(checkOutDate)}</div>
                  </div>
                  <div class="booking-detail-item">
                    <div class="detail-label">מספר לילות</div>
                    <div class="detail-value">${totalNights}</div>
                  </div>
                  <div class="booking-detail-item">
                    <div class="detail-label">מספר חדר</div>
                    <div class="detail-value">${roomNumber}</div>
                  </div>
                  <div class="booking-detail-item">
                    <div class="detail-label">סוג חדר</div>
                    <div class="detail-value">${roomName}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="price-details">
              <div class="booking-details-title">פרטי תשלום</div>
              <div class="booking-details-content">
                <table class="price-table">
                  <tr>
                    <td class="price-label">מחיר ללילה (לפני מע"מ)</td>
                    <td class="price-value">₪${pricePerNightNoVat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  </tr>
                  <tr>
                    <td class="price-label">מספר לילות</td>
                    <td class="price-value">${totalNights}</td>
                  </tr>
                  <tr>
                    <td class="price-label">סה"כ לפני מע"מ</td>
                    <td class="price-value">₪${totalWithoutVat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  </tr>
                  <tr>
                    <td class="price-label">מע"מ (${booking.tourist ? '0' : '18'}%)</td>
                    <td class="price-value">₪${totalVatAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  </tr>
                  <tr class="total-row">
                    <td class="price-label">סה"כ לתשלום</td>
                    <td class="price-value">₪${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <div class="cancellation-policy">
              <div class="policy-title">מדיניות ביטול</div>
              <div class="policy-text">
                <p>ביטול ללא חיוב אפשרי עד 24 שעות לפני מועד ההגעה.</p>
                <p>ביטול הזמנה פחות מ-24 שעות לפני ההגעה או אי-הגעה יחויב במחיר של לילה אחד.</p>
                <p>במקרה של עזיבה מוקדמת, לא יינתן החזר עבור הלילות שלא נוצלו.</p>
              </div>
            </div>
            
            <p>אנו מאחלים לך שהות נעימה ומהנה!</p>
            <p>לשאלות או בקשות נוספות, אנא צור קשר בטלפון: 03-1234567</p>
            
            ${booking.notes ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 4px;">
              <p><strong>הערות:</strong></p>
              <p>${booking.notes}</p>
            </div>
            ` : ''}
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button class="print-button" onclick="window.print()">הדפס אישור הזמנה</button>
          </div>
        </body>
        </html>
      `;
      
      // כתיבת תוכן אישור ההזמנה לחלון החדש
      confirmationWindow.document.open();
      confirmationWindow.document.write(confirmationContent);
      confirmationWindow.document.close();
    };
    
    // פונקציה לשליחת פרטי צ'ק-אין בוואטסאפ
    const handleSendCheckinDetails = () => {
      if (!booking || !booking.phone) {
        alert('אין מספר טלפון שמור להזמנה זו');
        return;
      }
      
      // נתונים נדרשים
      const roomDetails = rooms.find(r => r._id === booking.roomId);
      const roomNumber = roomDetails ? roomDetails.roomNumber : '';
      
      // נקה את מספר הטלפון מתווים שאינם ספרות
      const phoneNumber = booking.phone.replace(/\D/g, '');
      const formattedPhone = phoneNumber.startsWith('0') ? '972' + phoneNumber.substring(1) : phoneNumber;
      
      // יצירת הודעת וואטסאפ עם טקסט במקום אמוג'ים
      let message = `*שלום ${booking.firstName || 'אורח/ת יקר/ה'}!*\n\n`;
      message += `הנה פרטי הצ'ק-אין שלך:\n\n`;
      message += `🏠 כתובת: רוטשילד 79, פתח תקווה\n`;
      message += `🚪 הכניסה ממש ליד הכניסה לסופרמרקט "יש בשכונה" יש דלת זכוכית\n`;
      message += `2️⃣ קומה 2\n`;
      message += `🔢 חדר ${roomNumber}\n\n`;
      message += `🔑 החדר פתוח ומפתח בתוך החדר\n\n`;
      message += `💡 שימו לב למים חמים צריך להדליק את הדוד\n\n`;
      message += `לכל שאלה או בקשה אני זמין ואשמח לעזור.\n`;
      message += `תודה ושהות נעימה! ✨`;
      
      // פתיחת וואטסאפ עם ההודעה
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // הצגת דיאלוג שמזכיר למשתמש לשלוח תמונה
      setTimeout(() => {
        const sendImage = window.confirm('הודעת וואטסאפ נפתחה. האם ברצונך לשלוח גם את תמונת הכניסה לבניין לאחר שליחת ההודעה?');
        if (sendImage) {
          alert('לאחר שליחת ההודעה, לחץ על סיכה (📎) בשורת ההודעה בוואטסאפ ובחר "תמונות וסרטונים" כדי לשלוח את תמונת הכניסה לבניין.');
        }
      }, 1000);
    };
    
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {isEditMode 
                ? booking.bookingNumber 
                  ? `עריכת הזמנה ${booking.bookingNumber.substring(2)}` 
                  : 'עריכת הזמנה'
                : 'הזמנה חדשה'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* אייקון ביטול להזמנה */}
              {isEditMode && booking.status !== 'canceled' && (
                <Tooltip title="ביטול הזמנה">
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small"
                    onClick={handleCancelBooking}
                    startIcon={<ClearIcon />}
                    sx={{ minWidth: 0, p: '4px 8px' }}
                  >
                    בטל
                  </Button>
                </Tooltip>
              )}
            </Box>
          </Box>
        </DialogTitle>
        
        {/* סרגל עליון חדש לאייקונים */}
        {isEditMode && (
          <Box 
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              mt: -1,
              mb: 2,
              px: 2,
              pb: 2,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Tooltip title="חשבונית בעברית">
              <IconButton
                color="primary"
                onClick={handleOpenInvoice}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderRadius: '12px',
                  p: 1.5,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <ReceiptIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="חשבונית באנגלית">
              <IconButton
                color="secondary"
                onClick={handleOpenEnglishInvoice}
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  borderRadius: '12px',
                  p: 1.5,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ReceiptIcon />
                  <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 'bold' }}>EN</Typography>
                </Box>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="אישור הזמנה">
              <IconButton
                color="info"
                onClick={handleOpenBookingConfirmation}
                sx={{
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  borderRadius: '12px',
                  p: 1.5,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.info.main, 0.15),
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <ConfirmationNumberIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="שלח פרטי צ'ק-אין בוואטסאפ">
              <IconButton
                color="success"
                onClick={handleSendCheckinDetails}
                sx={{
                  bgcolor: alpha(theme.palette.success.light, 0.08),
                  borderRadius: '12px',
                  p: 1.5,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.light, 0.15),
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <WhatsAppIcon />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem />
            
            <FormControlLabel
              control={
                <Switch
                  checked={booking.isPaid}
                  onChange={(e) => {
                    // כאשר מסמנים כשולם, מגדירים אמצעי תשלום ברירת מחדל אם לא קיים
                    const updatedBooking = {
                      ...booking,
                      isPaid: e.target.checked
                    };
                    
                    // אם מסמנים כשולם וטרם הוגדר אמצעי תשלום, הגדר ברירת מחדל
                    if (e.target.checked && !booking.paymentMethod) {
                      updatedBooking.paymentMethod = 'cash';
                      console.log('הגדרת אמצעי תשלום ברירת מחדל: מזומן');
                    }
                    
                    setBooking(updatedBooking);
                  }}
                  color="success"
                />
              }
              label="שולם"
              labelPlacement="start"
              sx={{ mr: 1, minWidth: 80 }}
            />
            
            {/* תפריט בחירת אמצעי תשלום - מוצג רק כאשר סטטוס התשלום הוא 'שולם' */}
            {booking.isPaid && (
              <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                <InputLabel id="payment-method-label">אמצעי תשלום</InputLabel>
                <Select
                  labelId="payment-method-label"
                  id="payment-method-select"
                  value={booking.paymentMethod || 'cash'}
                  onChange={(e) => setBooking({...booking, paymentMethod: e.target.value})}
                  label="אמצעי תשלום"
                >
                  <MenuItem value="cash">מזומן</MenuItem>
                  <MenuItem value="creditOr">אשראי אור יהודה</MenuItem>
                  <MenuItem value="creditRothschild">אשראי רוטשילד</MenuItem>
                  <MenuItem value="mizrahi">העברה מזרחי</MenuItem>
                  <MenuItem value="bitMizrahi">ביט מזרחי</MenuItem>
                  <MenuItem value="payboxMizrahi">פייבוקס מזרחי</MenuItem>
                  <MenuItem value="poalim">העברה פועלים</MenuItem>
                  <MenuItem value="bitPoalim">ביט פועלים</MenuItem>
                  <MenuItem value="payboxPoalim">פייבוקס פועלים</MenuItem>
                  <MenuItem value="other">אחר</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        )}
        
        <DialogContent>
          <Grid container spacing={2}>
            {/* פרטי אורח */}
            <Grid item xs={12}>
              <Paper 
                variant="outlined" 
                sx={{ p: 1, mb: 1, bgcolor: 'transparent' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon sx={{ mr: 0.5, fontSize: '1rem', color: theme.palette.primary.main }} />
                  <span className="subtitle" style={{ fontSize: '0.9rem', fontWeight: '500' }}>פרטי אורח</span>
                </Box>
                <Grid container spacing={1}>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      label="שם פרטי"
                      fullWidth
                      size="small"
                      value={booking.firstName}
                      onChange={(e) => setBooking({...booking, firstName: e.target.value})}
                      sx={{ bgcolor: alpha('#4caf50', 0.05) }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      label="שם משפחה"
                      fullWidth
                      size="small"
                      value={booking.lastName}
                      onChange={(e) => setBooking({...booking, lastName: e.target.value})}
                      sx={{ bgcolor: alpha('#4caf50', 0.05) }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      label="טלפון"
                      fullWidth
                      size="small"
                      value={booking.phone}
                      onChange={(e) => setBooking({...booking, phone: e.target.value})}
                      InputProps={{
                        endAdornment: booking.phone ? (
                          <InputAdornment position="end">
                            <Tooltip title="פתח וואטסאפ">
                              <IconButton 
                                edge="end" 
                                size="small"
                                onClick={(e) => {
                                  e.preventDefault();
                                  // נוריד את כל התווים שאינם ספרות
                                  const phoneNumber = booking.phone.replace(/\D/g, '');
                                  window.open(`https://wa.me/${phoneNumber.startsWith('0') ? '972' + phoneNumber.substring(1) : phoneNumber}`, '_blank');
                                }}
                              >
                                <WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ) : null
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      label="אימייל"
                      fullWidth
                      size="small"
                      value={booking.email}
                      onChange={(e) => setBooking({...booking, email: e.target.value})}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* פרטי הזמנה */}
            <Grid item xs={12}>
              <Paper 
                variant="outlined" 
                sx={{ p: 1, mb: 1, bgcolor: 'transparent' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EventNoteIcon sx={{ mr: 0.5, fontSize: '1rem', color: theme.palette.primary.main }} />
                  <span className="subtitle" style={{ fontSize: '0.9rem', fontWeight: '500' }}>פרטי הזמנה</span>
                  <Box sx={{ ml: 'auto' }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={booking.tourist}
                          onChange={(e) => setBooking({...booking, tourist: e.target.checked})}
                          color="primary"
                          size="small"
                        />
                      }
                      label={<span style={{ fontSize: '0.75rem' }}>תייר (פטור ממע״מ)</span>}
                      sx={{ m: 0 }}
                    />
                  </Box>
                </Box>
                <Grid container spacing={1}>
                  <Grid item xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>חדר</InputLabel>
                      <Select
                        value={booking.roomId}
                        onChange={(e) => setBooking({...booking, roomId: e.target.value})}
                        label="חדר"
                      >
                        {rooms.map(room => (
                          <MenuItem key={room._id} value={room._id}>
                            {room.roomNumber} - {room.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <DatePicker
                      label="צ'ק אין"
                      value={booking.startDate}
                      onChange={(date) => {
                        setBooking({...booking, startDate: date});
                      }}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <DatePicker
                      label="צ'ק אאוט"
                      value={booking.endDate}
                      onChange={(date) => {
                        setBooking({...booking, endDate: date});
                      }}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                      minDate={booking.startDate ? new Date(booking.startDate.getTime() + (24 * 60 * 60 * 1000)) : undefined}
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <TextField
                      label="מספר לילות"
                      fullWidth
                      size="small"
                      type="number"
                      value={nightsCount}
                      onChange={(e) => setBooking({...booking, adults: parseInt(e.target.value, 10) || 0})}
                      InputProps={{
                        inputProps: { min: 1 }
                      }}
                    />
                  </Grid>
                  
                  {/* שדות המחיר בשורה אחת */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="מחיר ללילה (ללא מע״מ)"
                        size="small"
                        type="text"
                        value={booking.pricePerNight || ''}
                        onChange={handlePricePerNightChange}
                        onFocus={() => handleFocus('pricePerNight')}
                        onBlur={handleBlur}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                          inputProps: { min: 0 }
                        }}
                        sx={{ width: '30%', bgcolor: alpha('#e3f2fd', 0.3) }}
                      />
                      
                      <TextField
                        label="מחיר ללילה כולל מע״מ"
                        size="small"
                        type="text"
                        value={priceWithVAT || ''}
                        onChange={handlePriceWithVATChange}
                        onFocus={() => handleFocus('priceWithVAT')}
                        onBlur={handleBlur}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                          endAdornment: booking.tourist ? <InputAdornment position="end">(פטור ממע״מ)</InputAdornment> : null
                        }}
                        sx={{ width: '35%' }}
                      />
                      
                      <TextField
                        label="סה״כ להזמנה"
                        size="small"
                        type="text"
                        value={totalPrice || ''}
                        onChange={handleTotalPriceChange}
                        onFocus={() => handleFocus('totalPrice')}
                        onBlur={handleBlur}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₪</InputAdornment>
                        }}
                        sx={{ width: '35%', bgcolor: alpha('#4caf50', 0.05) }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* פרטי תשלום + הערות - זה לצד זה */}
            <Grid item xs={12} container spacing={1}>
              <Grid item xs={12} md={7}>
                <Paper 
                  variant="outlined" 
                  sx={{ p: 1, height: '100%', bgcolor: 'transparent' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CreditCardIcon sx={{ mr: 0.5, fontSize: '1rem', color: theme.palette.primary.main }} />
                    <span className="subtitle" style={{ fontSize: '0.9rem', fontWeight: '500' }}>פרטי תשלום</span>
                  </Box>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <TextField
                        label="מספר כרטיס"
                        fullWidth
                        size="small"
                        value={booking.creditCard || ''}
                        onChange={(e) => {
                          // ניקוי מכל התווים שאינם ספרות בלבד
                          const value = e.target.value;
                          const cleanValue = value.replace(/\D/g, '');
                          // ללא הוספת רווחים - 16 ספרות רצופות
                          setBooking({...booking, creditCard: cleanValue});
                        }}
                        placeholder="0000000000000000"
                        inputProps={{ maxLength: 16 }} // 16 ספרות בלבד
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        label="שם בעל הכרטיס"
                        fullWidth
                        size="small"
                        value={booking.cardHolderName || ''}
                        onChange={(e) => setBooking({...booking, cardHolderName: e.target.value})}
                      />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <TextField
                        label="תוקף"
                        fullWidth
                        size="small"
                        placeholder="MM/YY"
                        value={booking.expiryDate || ''}
                        onChange={(e) => setBooking({...booking, expiryDate: e.target.value})}
                      />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <TextField
                        label="CVV"
                        fullWidth
                        size="small"
                        value={booking.cvv || ''}
                        onChange={(e) => setBooking({...booking, cvv: e.target.value})}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Paper 
                  variant="outlined" 
                  sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'transparent' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <NoteIcon sx={{ mr: 0.5, fontSize: '1rem', color: theme.palette.primary.main }} />
                    <span className="subtitle" style={{ fontSize: '0.9rem', fontWeight: '500' }}>הערות</span>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    size="small"
                    placeholder="הערות נוספות..."
                    value={booking.notes || ''}
                    onChange={(e) => setBooking({...booking, notes: e.target.value})}
                    sx={{ flexGrow: 1 }}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>סגור</Button>
          <Button onClick={handleSaveClick} variant="contained" color="primary">
            {isEditMode ? 'שמור' : 'צור הזמנה'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // דיאלוג חיפוש הזמנות
  const SearchDialog = () => {
    const [searchParams, setSearchParams] = useState({
      guestName: '',
      phone: '',
      email: '',
      roomNumber: '',
      dateFrom: null,
      dateTo: null,
      bookingStatus: '',
      paymentStatus: ''
    });
    
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const handleClose = () => {
      setSearchDialogOpen(false);
    };
    
    const handleSearch = async () => {
      try {
        setIsSearching(true);
        
        // בניית פרמטרים לחיפוש (נוסיף רק פרמטרים שהוזנו)
        const queryParams = {};
        
        if (searchParams.guestName) queryParams.guestName = searchParams.guestName;
        if (searchParams.phone) queryParams.phone = searchParams.phone;
        if (searchParams.email) queryParams.email = searchParams.email;
        if (searchParams.roomNumber) queryParams.roomNumber = searchParams.roomNumber;
        if (searchParams.dateFrom) queryParams.dateFrom = format(searchParams.dateFrom, 'yyyy-MM-dd');
        if (searchParams.dateTo) queryParams.dateTo = format(searchParams.dateTo, 'yyyy-MM-dd');
        if (searchParams.bookingStatus) queryParams.status = searchParams.bookingStatus;
        if (searchParams.paymentStatus) queryParams.isPaid = searchParams.paymentStatus === 'paid';
        
        // קריאה ל-API
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/search`, {
          params: queryParams,
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.success) {
          setSearchResults(response.data.data);
        } else {
          console.error('שגיאה בחיפוש:', response.data.message);
        }
      } catch (error) {
        console.error('שגיאה בחיפוש הזמנות:', error);
      } finally {
        setIsSearching(false);
      }
    };
    
    const handleClearSearch = () => {
      setSearchParams({
        guestName: '',
        phone: '',
        email: '',
        roomNumber: '',
        dateFrom: null,
        dateTo: null,
        bookingStatus: '',
        paymentStatus: ''
      });
      setSearchResults([]);
    };
    
    const handleViewBooking = (booking) => {
      // סגירת דיאלוג החיפוש
      setSearchDialogOpen(false);
      
      // הגדרת ההזמנה הנבחרת לעריכה
      setSelectedBooking(booking);
      
      // פתיחת דיאלוג עריכת הזמנה
      setBookingDialogOpen(true);
    };
    
    const handleJumpToDate = (date) => {
      // סגירת דיאלוג החיפוש
      setSearchDialogOpen(false);
      
      // קפיצה לתאריך הנבחר בלוח
      setCurrentWeekStartDate(new Date(date));
    };
    
    // פונקציות עזר לחיפוש מהיר לפי תקופות
    const setLastMonth = () => {
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      
      setSearchParams({
        ...searchParams,
        dateFrom: lastMonth,
        dateTo: today
      });
    };
    
    const setLastWeek = () => {
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      
      setSearchParams({
        ...searchParams,
        dateFrom: lastWeek,
        dateTo: today
      });
    };
    
    const setToday = () => {
      const today = new Date();
      
      setSearchParams({
        ...searchParams,
        dateFrom: today,
        dateTo: today
      });
    };
    
    const setTomorrow = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setSearchParams({
        ...searchParams,
        dateFrom: tomorrow,
        dateTo: tomorrow
      });
    };
    
    const setNextWeek = () => {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      setSearchParams({
        ...searchParams,
        dateFrom: today,
        dateTo: nextWeek
      });
    };
    
    return (
      <Dialog 
        open={searchDialogOpen} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth 
        PaperProps={{
          sx: {
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: alpha(theme.palette.primary.light, 0.05),
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
          p: 2
        }}>
          <Typography variant="h6">חיפוש הזמנות</Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {/* שורה ראשונה - פרטי אורח */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                <PersonIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'text-top' }} />
                פרטי אורח
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="שם אורח"
                    fullWidth
                    size="small"
                    value={searchParams.guestName}
                    onChange={(e) => setSearchParams({...searchParams, guestName: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="טלפון"
                    fullWidth
                    size="small"
                    value={searchParams.phone}
                    onChange={(e) => setSearchParams({...searchParams, phone: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="אימייל"
                    fullWidth
                    size="small"
                    value={searchParams.email}
                    onChange={(e) => setSearchParams({...searchParams, email: e.target.value})}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            {/* שורה שנייה - פרטי הזמנה */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                <EventNoteIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'text-top' }} />
                פרטי הזמנה
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="מספר חדר"
                    fullWidth
                    size="small"
                    value={searchParams.roomNumber}
                    onChange={(e) => setSearchParams({...searchParams, roomNumber: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <DatePicker
                    label="מתאריך"
                    value={searchParams.dateFrom}
                    onChange={(date) => setSearchParams({...searchParams, dateFrom: date})}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <DatePicker
                    label="עד תאריך"
                    value={searchParams.dateTo}
                    onChange={(date) => setSearchParams({...searchParams, dateTo: date})}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>סטטוס הזמנה</InputLabel>
                    <Select
                      value={searchParams.bookingStatus}
                      onChange={(e) => setSearchParams({...searchParams, bookingStatus: e.target.value})}
                      label="סטטוס הזמנה"
                    >
                      <MenuItem value="">הכל</MenuItem>
                      <MenuItem value="confirmed">מאושר</MenuItem>
                      <MenuItem value="pending">ממתין</MenuItem>
                      <MenuItem value="canceled">מבוטל</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
            
            {/* כפתורי חיפוש מהיר */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                <FlashOnIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'text-top' }} />
                חיפוש מהיר
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label="חודש אחרון" 
                  onClick={setLastMonth} 
                  size="small" 
                  color={searchParams.dateFrom && searchParams.dateTo && 
                    isSameDay(addMonths(searchParams.dateTo, -1), searchParams.dateFrom) ? "primary" : "default"}
                />
                <Chip 
                  label="שבוע אחרון" 
                  onClick={setLastWeek} 
                  size="small" 
                  color={searchParams.dateFrom && searchParams.dateTo && 
                    isSameDay(addDays(searchParams.dateTo, -7), searchParams.dateFrom) ? "primary" : "default"}
                />
                <Chip 
                  label="היום" 
                  onClick={setToday} 
                  size="small" 
                  color={searchParams.dateFrom && searchParams.dateTo && 
                    isSameDay(searchParams.dateFrom, searchParams.dateTo) && 
                    isSameDay(searchParams.dateFrom, new Date()) ? "primary" : "default"}
                />
                <Chip 
                  label="מחר" 
                  onClick={setTomorrow} 
                  size="small" 
                  color={searchParams.dateFrom && searchParams.dateTo && 
                    isSameDay(searchParams.dateFrom, searchParams.dateTo) && 
                    isSameDay(searchParams.dateFrom, addDays(new Date(), 1)) ? "primary" : "default"}
                />
                <Chip 
                  label="שבוע הבא" 
                  onClick={setNextWeek} 
                  size="small" 
                  color={searchParams.dateFrom && searchParams.dateTo && 
                    isSameDay(searchParams.dateFrom, new Date()) && 
                    isSameDay(searchParams.dateTo, addDays(new Date(), 7)) ? "primary" : "default"}
                />
              </Box>
            </Grid>
            
            {/* כפתורי חיפוש */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleClearSearch}
                  startIcon={<ClearIcon />}
                  size="small"
                >
                  נקה
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                  disabled={isSearching}
                  size="small"
                >
                  חפש
                </Button>
              </Box>
            </Grid>
            
            {/* תוצאות חיפוש */}
            {searchResults.length > 0 && (
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                    תוצאות חיפוש ({searchResults.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {searchParams.dateFrom && searchParams.dateTo ? 
                      `מתאריך ${format(searchParams.dateFrom, 'dd/MM/yyyy')} עד ${format(searchParams.dateTo, 'dd/MM/yyyy')}` : 
                      'כל התאריכים'}
                  </Typography>
                </Box>
                
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '400px', overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>חדר</TableCell>
                        <TableCell>שם אורח</TableCell>
                        <TableCell>טלפון</TableCell>
                        <TableCell>צ'ק אין</TableCell>
                        <TableCell>צ'ק אאוט</TableCell>
                        <TableCell>לילות</TableCell>
                        <TableCell>סה"כ</TableCell>
                        <TableCell>סטטוס</TableCell>
                        <TableCell>תשלום</TableCell>
                        <TableCell>פעולות</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchResults.map((booking) => {
                        // טיפול במבנה משתנה של שדות ההזמנה
                        const checkInDate = new Date(booking.startDate || booking.checkIn);
                        const checkOutDate = new Date(booking.endDate || booking.checkOut);
                        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
                        
                        // חילוץ פרטי אורח מהמבנה המורכב
                        const guestName = booking.guest ? 
                          `${booking.guest.firstName || ''} ${booking.guest.lastName || ''}`.trim() : 
                          `${booking.firstName || ''} ${booking.lastName || ''}`.trim();
                          
                        const guestPhone = booking.guest?.phone || booking.phone || '';
                        
                        // חילוץ מספר חדר
                        const roomNumber = booking.room?.roomNumber || booking.roomNumber || '';
                        
                        // חילוץ סכום
                        const totalPrice = booking.totalPrice || 0;
                        
                        // סטטוס תשלום
                        const paymentStatus = booking.paymentStatus || (booking.isPaid ? 'paid' : 'pending');
                        
                        return (
                          <TableRow key={booking._id} sx={{
                            bgcolor: booking.status === 'canceled' ? alpha('#f44336', 0.05) : 'inherit'
                          }}>
                            <TableCell>{roomNumber}</TableCell>
                            <TableCell>{guestName || 'אורח ללא שם'}</TableCell>
                            <TableCell>{guestPhone}</TableCell>
                            <TableCell>{format(checkInDate, 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{format(checkOutDate, 'dd/MM/yyyy')}</TableCell>
                            <TableCell align="center">{nights}</TableCell>
                            <TableCell align="right">₪{totalPrice.toLocaleString()}</TableCell>
                            <TableCell>
                              <Chip 
                                label={
                                  booking.status === 'confirmed' ? 'מאושר' : 
                                  booking.status === 'pending' ? 'ממתין' : 'מבוטל'
                                }
                                size="small"
                                color={
                                  booking.status === 'confirmed' ? 'success' : 
                                  booking.status === 'pending' ? 'warning' : 'error'
                                }
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={
                                  paymentStatus === 'paid' ? 'שולם' : 
                                  paymentStatus === 'partial' ? 'חלקי' : 'ממתין'
                                }
                                size="small"
                                color={
                                  paymentStatus === 'paid' ? 'success' : 
                                  paymentStatus === 'partial' ? 'info' : 'warning'
                                }
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="ערוך הזמנה">
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => handleViewBooking(booking)}
                                    disabled={booking.status === 'canceled'}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="הצג בלוח">
                                  <IconButton 
                                    size="small" 
                                    color="info"
                                    onClick={() => handleJumpToDate(booking.startDate || booking.checkIn)}
                                  >
                                    <CalendarMonthIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
            
            {/* הודעה כשאין תוצאות */}
            {searchResults.length === 0 && isSearching === false && (
              <Grid item xs={12} sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  אין תוצאות מתאימות לחיפוש. נסה להשתמש בפילטרים אחרים.
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 2, 
          bgcolor: alpha(theme.palette.background.default, 0.5),
          borderTop: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1)
        }}>
          <Button onClick={handleClose} color="inherit" variant="outlined" size="small">
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // עדכון filteredBookings כאשר bookings משתנה
  useEffect(() => {
    if (bookings && bookings.length > 0) {
      // סינון הזמנות מבוטלות מהתצוגה
      const activeBookings = bookings.filter(booking => booking.status !== 'canceled');
      console.log(`סינון הזמנות: ${bookings.length} סה"כ, ${activeBookings.length} פעילות`);
      setFilteredBookings(activeBookings);
    } else {
      setFilteredBookings([]);
    }
  }, [bookings]);
  
  // פונקציה לרינדור תאי הלוח
  const renderCalendarCells = () => {
    console.log('=== נתוני רינדור לוח ===');
    console.log('מספר ההזמנות:', bookings ? bookings.length : 0);
    console.log('מספר הזמנות פעילות:', filteredBookings ? filteredBookings.length : 0);
    console.log('מספר חדרים:', rooms.length);
    
    if (bookings && bookings.length > 0 && bookings[0]) {
      console.log('דוגמת הזמנה ראשונה:', bookings[0]);
      console.log('שדות תאריכים בהזמנה ראשונה:', {
        startDate: bookings[0].startDate,
        endDate: bookings[0].endDate,
        checkIn: bookings[0].checkIn,
        checkOut: bookings[0].checkOut
      });
    }
    
    if (loading) {
      return <Typography>טוען נתונים...</Typography>;
    }
    
    if (error) {
      return <Typography color="error">{error}</Typography>;
    }
    
    return (
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: `70px repeat(${daysInView.length}, 1fr)`,
        gap: 0.5,
        my: 1
      }}>
        {/* כותרות עמודות - תאריכים */}
        <Box sx={{ 
          height: '50px', 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.primary.light, 0.1),
          borderRadius: '8px',
          p: 1,
          fontSize: '0.85rem'
        }}>
          חדר
        </Box>
        
        {daysInView.map((day, idx) => {
          const isToday = isSameDay(day, new Date());
          
          return (
            <Box 
              key={`header-${idx}`}
              sx={{ 
                height: '50px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isToday ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.light, 0.05),
                borderRadius: '8px',
                p: 0.5
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 'medium',
                  fontSize: '0.75rem'
                }}
              >
                {hebrewDays[getDay(day)]}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: isToday ? 'bold' : 'medium',
                  fontSize: '0.85rem',
                  color: isToday ? theme.palette.primary.main : 'inherit'
                }}
              >
                {format(day, 'dd/MM')}
              </Typography>
            </Box>
          );
        })}
        
        {/* תאי הלוח לכל חדר ותאריך */}
        {rooms.map((room) => (
          <React.Fragment key={`room-${room._id}`}>
            {/* עמודת החדר (קבועה מימין) */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.light, 0.05),
              borderRadius: '8px',
              p: 1,
              height: '100%',
              fontWeight: 'medium',
              fontSize: '0.9rem'
            }}>
              {room.roomNumber}
            </Box>
            
            {/* תאים לכל יום */}
            {daysInView.map((day, dayIdx) => {
              // בדיקה אם יש הזמנה ביום זה לחדר זה - משתמש ב-filteredBookings
              const bookingsForCell = filteredBookings?.filter(booking => {
                try {
                  // בדיקה בסיסית שיש נתונים תקינים בהזמנה
                  if (!booking || (!booking.roomId && !booking.room)) {
                    return false;
                  }
                  
                  // המרת התאריכים למחרוזות נכונות למקרה שהן לא בפורמט הנכון
                  // תומך בשני סוגי שדות: startDate/endDate או checkIn/checkOut
                  const startDateField = booking.startDate || booking.checkIn;
                  const endDateField = booking.endDate || booking.checkOut;
                  
                  if (!startDateField || !endDateField) {
                    return false;
                  }
                  
                  const checkInDate = startDateField instanceof Date ? 
                    startDateField : new Date(startDateField);
                  const checkOutDate = endDateField instanceof Date ? 
                    endDateField : new Date(endDateField);
                  
                  // וידוא שהתאריכים תקינים
                  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
                    return false;
                  }
                  
                  // איפוס שעות לצורך השוואה מדויקת
                  const checkInDateNoTime = new Date(checkInDate);
                  checkInDateNoTime.setHours(0, 0, 0, 0);
                  
                  const checkOutDateNoTime = new Date(checkOutDate);
                  checkOutDateNoTime.setHours(0, 0, 0, 0);
                  
                  // התאריך לבדיקה גם ללא רכיב השעה
                  const dateNoTime = new Date(day);
                  dateNoTime.setHours(0, 0, 0, 0);
                  
                  // זיהוי מזהה החדר בהזמנה - תמיכה במספר מבנים אפשריים
                  let bookingRoomId = null;
                  let bookingRoomNumber = null;
                  
                  if (booking.roomId) {
                    bookingRoomId = booking.roomId;
                  } else if (booking.room) {
                    // אם room הוא אובייקט עם _id
                    if (typeof booking.room === 'object' && booking.room !== null) {
                      bookingRoomId = booking.room._id;
                      bookingRoomNumber = booking.room.roomNumber;
                    } else {
                      // אם room הוא מזהה חדר (מחרוזת או ObjectId)
                      bookingRoomId = booking.room.toString();
                    }
                  }
                  
                  // אם יש בהזמנה ישירות מספר חדר
                  if (booking.roomNumber) {
                    bookingRoomNumber = booking.roomNumber;
                  }
                  
                  // בדיקת התאמת חדר - בדיקה לפי מזהה או מספר חדר
                  const isSameRoom = bookingRoomId === room._id || 
                                     bookingRoomId === room._id.toString() ||
                                     bookingRoomNumber === room.roomNumber || 
                                     (bookingRoomNumber && room.roomNumber && 
                                      parseInt(bookingRoomNumber) === parseInt(room.roomNumber));
                  
                  if (!isSameRoom) {
                    return false;
                  }
                  
                  // בדיקה אם התאריך נמצא בין צ'ק-אין לצ'ק-אאוט (לא כולל צ'ק-אאוט)
                  const isDateInRange = dateNoTime >= checkInDateNoTime && dateNoTime < checkOutDateNoTime;
                  
                  return isDateInRange;
                } catch (error) {
                  console.error('שגיאה בבדיקת תאריכי הזמנה:', error, booking);
                  return false;
                }
              });
              
              // הדפסת מידע על התאמת הזמנות לתא הנוכחי (רק לתא הראשון)
              if (dayIdx === 0 && room.roomNumber === rooms[0].roomNumber) {
                console.log(`בדיקת הזמנות לחדר ${room.roomNumber} ביום הראשון: נמצאו ${bookingsForCell?.length || 0} הזמנות`);
                if (bookingsForCell && bookingsForCell.length > 0) {
                  console.log('הזמנות שנמצאו:', bookingsForCell);
                }
              }
              
              const hasBooking = bookingsForCell && bookingsForCell.length > 0;
              const booking = hasBooking ? bookingsForCell[0] : null;
              
              let statusColor = theme.palette.success.main; // ברירת מחדל ירוק למאושר
              
              if (booking) {
                switch(booking.status) {
                  case 'pending':
                    statusColor = theme.palette.warning.main; // כתום לממתין
                    break;
                  case 'canceled':
                    statusColor = theme.palette.error.main; // אדום למבוטל
                    break;
                  default:
                    statusColor = theme.palette.success.main; // ירוק למאושר
                }
              }
              
              // בדיקה אם זה יום הצ'ק-אין של ההזמנה - הפס הכהה יופיע רק ביום הזה
              const isCheckInDay = booking ? (() => {
                const checkInDate = booking.startDate 
                  ? new Date(booking.startDate) 
                  : booking.checkIn 
                    ? new Date(booking.checkIn) 
                    : null;
                
                if (!checkInDate) return false;
                
                const checkInDateNoTime = new Date(checkInDate);
                checkInDateNoTime.setHours(0, 0, 0, 0);
                
                const dayNoTime = new Date(day);
                dayNoTime.setHours(0, 0, 0, 0);
                
                return checkInDateNoTime.getTime() === dayNoTime.getTime();
              })() : false;
              
              return (
                <CalendarCell 
                  key={`cell-${room._id}-${dayIdx}`}
                  onClick={() => {
                    if (hasBooking) {
                      // אם יש הזמנה קיימת, פתח את פרטי ההזמנה
                      handleBookingClick(booking);
                    } else {
                      // אם אין הזמנה, הוסף הזמנה חדשה לתאריך זה ולחדר זה
                      console.log(`יצירת הזמנה חדשה לחדר ${room.roomNumber} בתאריך ${format(day, 'yyyy-MM-dd')}`);
                      handleAddBooking(room._id, day);
                    }
                  }}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: hasBooking ? 
                      // בדיקה אם יש סימן קריאה בהערות - צבע אדום
                      (booking.notes && booking.notes.includes('!') ? alpha('#f44336', 0.2) : alpha(statusColor, 0.1)) 
                      : 'white',
                    borderLeft: hasBooking && isCheckInDay ? `3px solid ${statusColor}` : null,
                    '&:hover': {
                      bgcolor: hasBooking ? 
                        (booking.notes && booking.notes.includes('!') ? alpha('#f44336', 0.25) : alpha(statusColor, 0.15)) 
                        : alpha(theme.palette.primary.light, 0.05),
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
                    }
                  }}
                >
                  {hasBooking && (
                    <>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 0.5
                      }}>
                        <Typography variant="caption" sx={{ 
                          fontWeight: 'bold',
                          fontSize: '0.85rem' // הגדלת הגופן של שם האורח
                        }}>
                          {booking.firstName || booking.lastName ? 
                            `${booking.firstName || ''} ${booking.lastName || ''}` :
                            booking.guest && (booking.guest.firstName || booking.guest.lastName) ? 
                              `${booking.guest.firstName || ''} ${booking.guest.lastName || ''}` : 
                              'אורח'
                          }
                        </Typography>
                      </Box>
                      
                      {/* הוסרו תאריכי צ'ק-אין וצ'ק-אאוט */}
                      
                      {/* העברת האייקון של עריכה לתחתית האריח + הוספת אייקון וואטסאפ לתאריכים רלוונטיים */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        p: 0.5,
                        mt: 'auto',
                        gap: 0.5
                      }}>
                        {/* אייקון אזהרה אם יש הערות */}
                        {booking.notes && booking.notes.trim() !== '' && (
                          <Tooltip title={booking.notes}>
                            <CellIconButton 
                              size="small" 
                              sx={{ 
                                color: booking.notes.includes('!') ? '#f44336' : '#ff9800'
                              }}
                            >
                              {booking.notes.includes('!') ? <ErrorIcon /> : <WarningIcon />}
                            </CellIconButton>
                          </Tooltip>
                        )}

                        {/* נקודה אדומה אם ההזמנה לא שולמה והתאריך חלף או נוכחי */}
                        {(() => {
                          // בדיקת תאריך
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          const bookingDate = new Date(day);
                          bookingDate.setHours(0, 0, 0, 0);
                          
                          // בדיקה אם התאריך חלף או נוכחי
                          const isPastOrToday = bookingDate.getTime() <= today.getTime();
                          
                          // בדיקה אם ההזמנה לא שולמה
                          const isNotPaid = 
                            (booking.isPaid === false) || 
                            (booking.paymentStatus === 'pending' || booking.paymentStatus === 'unpaid');
                          
                          if (isPastOrToday && isNotPaid) {
                            return (
                              <Box 
                                sx={{ 
                                  width: '8px', 
                                  height: '8px', 
                                  borderRadius: '50%', 
                                  bgcolor: '#f44336',
                                  boxShadow: '0 0 4px rgba(244, 67, 54, 0.5)'
                                }} 
                              />
                            );
                          }
                          return null;
                        })()}
                        
                        {/* אייקון וואטסאפ רק להזמנות של היום, אתמול ומחר */}
                        {(() => {
                          // בדיקה אם התאריך הוא היום, אתמול או מחר
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          const tomorrow = new Date(today);
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          
                          const yesterday = new Date(today);
                          yesterday.setDate(yesterday.getDate() - 1);
                          
                          const bookingDate = new Date(day);
                          bookingDate.setHours(0, 0, 0, 0);
                          
                          const isRelevantDate = 
                            bookingDate.getTime() === today.getTime() || 
                            bookingDate.getTime() === yesterday.getTime() || 
                            bookingDate.getTime() === tomorrow.getTime();
                          
                          // קבלת מספר הטלפון
                          const phoneNumber = booking.phone || 
                                            (booking.guest && booking.guest.phone ? booking.guest.phone : '');
                          
                          if (isRelevantDate && phoneNumber) {
                            return (
                              <CellIconButton 
                                size="small" 
                                sx={{ color: '#25D366' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // נוריד את כל התווים שאינם ספרות
                                  const cleanPhone = phoneNumber.replace(/\D/g, '');
                                  window.open(`https://wa.me/${cleanPhone.startsWith('0') ? '972' + cleanPhone.substring(1) : cleanPhone}`, '_blank');
                                }}
                              >
                                <WhatsAppIcon />
                              </CellIconButton>
                            );
                          }
                          return null;
                        })()}
                        
                        <CellIconButton 
                          size="small" 
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingClick(booking);
                          }}
                        >
                          <EditIcon />
                        </CellIconButton>
                      </Box>
                    </>
                  )}
                  
                  {!hasBooking && (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                      p: 0.5
                    }}>
                      <Box /> {/* אלמנט ריק בחלק העליון */}
                      
                      {/* האייקון עובר לחלק התחתון */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        mt: 'auto'
                      }}>
                        <Tooltip title={`הוסף הזמנה: ${room.roomNumber} - ${format(day, 'dd/MM/yyyy')}`}>
                          <AddIcon fontSize="small" />
                        </Tooltip>
                      </Box>
                    </Box>
                  )}
                </CalendarCell>
              );
            })}
          </React.Fragment>
        ))}
      </Box>
    );
  };
  
  // בדיקת התאמה בין הזמנות לחדרים
  useEffect(() => {
    if (bookings?.length > 0 && rooms?.length > 0) {
      console.log('=== בדיקת התאמת הזמנות וחדרים ===');
      
      // בדוק את מבנה החדרים וההזמנות
      console.log('דוגמת חדר:', rooms[0]);
      console.log('דוגמת הזמנה:', bookings[0]);
      
      // בדוק את מספרי החדרים הזמינים
      const roomNumbers = rooms.map(r => r.roomNumber);
      console.log('מספרי חדרים זמינים:', roomNumbers);
      
      // בדוק את מספרי החדרים בהזמנות
      const bookingRoomNumbers = [];
      for (const booking of bookings) {
        // הוסף בדיקה לפי מבנה הנתונים - חדר יכול להיות במספר מקומות
        let roomNumber = null;
        
        if (booking.room && booking.room.roomNumber) {
          roomNumber = booking.room.roomNumber;
        } else if (booking.roomNumber) {
          roomNumber = booking.roomNumber;
        }
        
        if (roomNumber && !bookingRoomNumbers.includes(roomNumber)) {
          bookingRoomNumbers.push(roomNumber);
        }
      }
      
      console.log('מספרי חדרים בהזמנות:', bookingRoomNumbers);
      
      // בדוק חדרים שאין להם התאמה
      const unmatchedRooms = bookingRoomNumbers.filter(num => !roomNumbers.includes(num));
      if (unmatchedRooms.length > 0) {
        console.log('מספרי חדרים בהזמנות שאין להם התאמה:', unmatchedRooms);
      }
    }
  }, [bookings, rooms]);
  
  // טיפול בשמירת הזמנה מהדיאלוג
  const handleSave = async (bookingData) => {
    try {
      console.log('שמירת הזמנה:', bookingData);
      
      // רענון נתוני ההזמנות
      await contextFetchBookings({});
      
      // סגירת הדיאלוג
      setBookingDialogOpen(false);
    } catch (error) {
      console.error('שגיאה בשמירת ההזמנה:', error);
    }
  };
  
  // רנדור הממשק
  return (
    <>
      {/* סרגל צדדי */}
      <MinimalSidebar>
        <SidebarButton title="דשבורד" placement="right" isActive={currentPath === '/dashboard'}>
          <IconButton component={RouterLink} to="/dashboard">
            <DashboardIcon sx={{ fontSize: '1.5rem', color: '#3f51b5' }} />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="דוחות הכנסה" placement="right" isActive={currentPath === '/dashboard/income-report'}>
          <IconButton component={RouterLink} to="/dashboard/income-report">
            <BarChartIcon sx={{ fontSize: '1.5rem', color: '#4caf50' }} />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="אתר הבית" placement="right" isActive={currentPath === '/'}>
          <IconButton component={RouterLink} to="/">
            <PublicIcon sx={{ fontSize: '1.5rem', color: '#1976d2' }} />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="Booking.com" placement="right">
          <IconButton 
            onClick={() => window.open('https://account.booking.com/sign-in?op_token=EgVvYXV0aCKyAQoUNlo3Mm9IT2QzNk5uN3prM3BpcmgSCWF1dGhvcml6ZRoaaHR0cHM6Ly9hZG1pbi5ib29raW5nLmNvbS8qOnsiYXV0aF9hdHRlbXB0X2lkIjoiN2RhZmRmODMtMThhNi00NmU4LTlkNDQtOGJkMDZhZTMxNzEwIn0yK05ibmdTNDlGZ0poWHd6RXNNRjNqOFliZU16VGpyTUZSaWxzamprbTllUDA6BFMyNTZCBGNvZGUqEzCwm8Hl4dMnOgBCAFjwhab84DI', '_blank')}
          >
            <Avatar sx={{ width: 28, height: 28, fontSize: '1.2rem', bgcolor: '#0896ff', fontWeight: 'bold' }}>B</Avatar>
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="Expedia" placement="right">
          <IconButton 
            onClick={() => window.open('https://www.expediapartnercentral.com/Account/Logon?returnUrl=https%3A%2F%2Fapps.expediapartnercentral.com%2Flodging%2Fhome%2Fhome%3Fhtid%3D25818583', '_blank')}
          >
            <Avatar sx={{ width: 28, height: 28, fontSize: '1.2rem', bgcolor: '#00355F', fontWeight: 'bold' }}>E</Avatar>
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="CreditGuard" placement="right">
          <IconButton 
            onClick={() => window.open('https://console.creditguard.co.il/html/login.html', '_blank')}
          >
            <CreditCardIcon sx={{ fontSize: '1.5rem', color: '#F27935' }} />
          </IconButton>
        </SidebarButton>
      </MinimalSidebar>
      
      <Box sx={{ 
        p: 3,
        maxWidth: '1600px', // מגדיר רוחב מקסימלי למכל
        mx: 'auto'
      }}>
        {/* בר ניווט בין תאריכים - שורה יחידה המשלבת הכל */}
        <Paper sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2, 
          p: 1,
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: alpha(theme.palette.primary.light, 0.05),
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              px: 0.5
            }}
          >
            <IconButton 
              onClick={goToPreviousWeek} 
              size="small" 
              disableRipple
              sx={{ 
                p: 0.5,
                color: theme.palette.text.secondary
              }}
            >
              <NavigateNextIcon fontSize="small" />
            </IconButton>
            
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 'medium', 
                mx: 1, 
                color: theme.palette.text.primary,
                fontSize: '0.95rem'
              }}
            >
              {daysInView.length > 0 && 
                `${format(daysInView[0], 'dd/MM')} - ${format(daysInView[daysInView.length - 1], 'dd/MM')}`
              }
            </Typography>
            
            <IconButton 
              onClick={goToNextWeek} 
              size="small"
              disableRipple 
              sx={{ 
                p: 0.5,
                color: theme.palette.text.secondary
              }}
            >
              <NavigateBeforeIcon fontSize="small" />
            </IconButton>
            
            <IconButton 
              onClick={goToToday}
              size="small"
              disableRipple
              sx={{ 
                p: 0.5,
                color: theme.palette.primary.main
              }}
            >
              <TodayIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="חיפוש הזמנות">
              <IconButton
                onClick={() => setSearchDialogOpen(true)}
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  borderRadius: '8px',
                  color: theme.palette.info.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.info.main, 0.2),
                  }
                }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <IconButton
              onClick={() => handleAddBooking()}
              size="small" 
              color="primary"
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.9),
                color: 'white',
                borderRadius: '8px',
                '&:hover': {
                  bgcolor: theme.palette.primary.main,
                }
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
        
        {/* לוח ההזמנות */}
        <Paper sx={{ 
          p: 2, 
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {renderCalendarCells()}
        </Paper>
        
        {/* דיאלוג הוספה/עריכה */}
        <BookingDialog 
          open={bookingDialogOpen} 
          onClose={() => setBookingDialogOpen(false)} 
          selectedBooking={selectedBooking} 
          onSave={handleSave} 
          rooms={rooms}
        />
        
        {/* דיאלוג חיפוש */}
        <SearchDialog />
      </Box>
    </>
  );
};

// עטיפת הקומפוננטה עם הספק התאריכים
const BookingsManagerWithDateProvider = () => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <BookingsManager />
    </LocalizationProvider>
  );
};

export default BookingsManagerWithDateProvider; 