import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, isSameDay, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  Button,
  Grid,
  Card,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  alpha,
  Tooltip,
  useTheme,
  InputAdornment,
  Fade,
  Switch,
  FormControlLabel,
  Badge,
  Chip,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  styled,
  Container,
  MenuItem
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Today as TodayIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Room as RoomIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Comment as CommentIcon,
  WhatsApp as WhatsAppIcon,
  Payment as PaymentIcon,
  NightsStay as NightsStayIcon,
  EventAvailable as EventAvailableIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarMonthIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
  DateRange as DateRangeIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Event as EventIcon,
  Hotel as HotelIcon,
  Language as LanguageIcon,
  Assessment as AssessmentIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Link } from 'react-router-dom';

// רשימת החדרים לפי מתחמים
const LOCATIONS = {
  'rothschild': {
    name: 'רוטשילד',
    rooms: ['106']
  },
  'oryehuda': {
    name: 'אור יהודה',
    rooms: ['2', '3', '5', '6', '7', '8']
  }
};

// רשימת אמצעי תשלום
const PAYMENT_METHODS = [
  { value: '', label: 'לא שולם' },
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

// קומפוננטה עבור תא של חדר
const RoomBookingCell = ({ 
  locationId, 
  roomId, 
  booking, 
  currentDateKey, 
  onSave, 
  onDelete,
  isMultiNightDisplay,
  originalBookingDate
}) => {
  const theme = useTheme();
  
  // מצב מקומי לתא
  const [localBooking, setLocalBooking] = useState(booking);
  // פותח את תפריט אמצעי התשלום
  const [paymentMenuOpen, setPaymentMenuOpen] = useState(false);
  
  // עדכון לוקאלי כאשר משתנה ה-booking מבחוץ
  useEffect(() => {
    setLocalBooking(booking);
  }, [booking, currentDateKey]);
  
  // עדכון שדה ספציפי בהזמנה המקומית ושמירה אוטומטית
  const handleChange = (field, value) => {
    let updatedBooking = { ...localBooking };
    
    // מטפל במקרה של שינוי אמצעי תשלום
    if (field === 'paymentMethod') {
      updatedBooking[field] = value;
      
      // אם בחרו שיטת תשלום (לא "לא שולם"), אז מעדכנים גם את isPaid לtrue
      if (value !== '') {
        updatedBooking.isPaid = true;
      } else {
        // אם בחרו "לא שולם", אז מעדכנים את isPaid לfalse
        updatedBooking.isPaid = false;
      }
    } else {
      // שינוי של שדות אחרים
      updatedBooking[field] = value;
    }
    
    setLocalBooking(updatedBooking);
    
    // שמירה אוטומטית כשמשנים שיטת תשלום
    if (field === 'paymentMethod') {
      onSave(locationId, roomId, updatedBooking);
    }
  };
  
  // אירוע שמירה אוטומטית בעת יציאה מהשדה
  const handleBlur = () => {
    onSave(locationId, roomId, localBooking);
  };
  
  // פתיחת וואטסאפ
  const handleWhatsAppClick = (phone) => {
    if (!phone) return;
    
    // מנקה את מספר הטלפון מתווים שאינם ספרות
    const cleanPhone = phone.replace(/\D/g, '');
    // מסיר את ה-0 מתחילת המספר אם יש ומוסיף קידומת ישראל
    const formattedPhone = cleanPhone.startsWith('0') ? 
      `972${cleanPhone.substring(1)}` : cleanPhone;
      
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };
  
  // החזרת שם אמצעי תשלום לפי ערך
  const getPaymentMethodLabel = (value) => {
    const method = PAYMENT_METHODS.find(m => m.value === value);
    return method ? method.label : '';
  };
  
  return (
    <React.Fragment>
      <ListItem
        sx={{
          py: 0.8,
          px: 1,
          backgroundColor: 'white',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.light, 0.05)
          },
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          width: '100%'
        }}>
          {/* מספר החדר */}
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: localBooking.guestName ? 
                (localBooking.isPaid ? 
                  alpha(theme.palette.success.main || '#4caf50', 0.15) : 
                  alpha(theme.palette.warning.main || '#ff9800', 0.15)) : 
                alpha(theme.palette.grey[200], 0.7),
              color: localBooking.guestName ? 
                (localBooking.isPaid ? 
                  theme.palette.success.dark || '#1b5e20' : 
                  theme.palette.warning.dark || '#e65100') : 
                theme.palette.text.secondary,
              width: 28,
              height: 28,
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              flexShrink: 0,
              marginRight: 1.5,
              border: '1px solid',
              borderColor: localBooking.guestName ? 
                (localBooking.isPaid ? 
                  alpha(theme.palette.success.main || '#4caf50', 0.3) : 
                  alpha(theme.palette.warning.main || '#ff9800', 0.3)) : 
                alpha(theme.palette.grey[300], 0.5)
            }}
          >
            {roomId}
          </Box>
          
          {isMultiNightDisplay ? (
            // תצוגת מידע של המשך הזמנה
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {localBooking.guestName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, color: alpha(theme.palette.text.primary, 0.7) }}>
                {localBooking.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneIcon fontSize="small" />
                    <Typography variant="body2">{localBooking.phone}</Typography>
                  </Box>
                )}
                {localBooking.nights > 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <NightsStayIcon fontSize="small" />
                    <Typography variant="body2">המשך הזמנה ({localBooking.nights} לילות)</Typography>
                  </Box>
                )}
                {localBooking.isPaid && localBooking.paymentMethod && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PaymentIcon fontSize="small" />
                    <Typography variant="body2">
                      {getPaymentMethodLabel(localBooking.paymentMethod)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            // טופס עריכה - תמיד מוצג
            <Grid container spacing={1} sx={{ width: '100%' }}>
              {/* שם אורח */}
              <Grid item xs={2.8} sx={{ px: 0.5 }}>
                <TextField
                  fullWidth
                  placeholder="שם האורח"
                  variant="outlined"
                  size="small"
                  value={localBooking.guestName}
                  onChange={(e) => handleChange('guestName', e.target.value)}
                  onBlur={handleBlur}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" sx={{ color: alpha(theme.palette.text.primary, 0.5) }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      height: '38px',
                      '& fieldset': {
                        borderColor: alpha(theme.palette.divider, 0.8)
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
              </Grid>
              
              {/* טלפון עם אייקון וואטסאפ */}
              <Grid item xs={2} sx={{ px: 0.5 }}>
                <TextField
                  fullWidth
                  placeholder="טלפון"
                  variant="outlined"
                  size="small"
                  value={localBooking.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={handleBlur}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon fontSize="small" sx={{ color: alpha(theme.palette.text.primary, 0.5) }} />
                      </InputAdornment>
                    ),
                    endAdornment: localBooking.phone && (
                      <InputAdornment position="end">
                        <Tooltip title="שלח הודעת וואטסאפ">
                          <IconButton
                            edge="end"
                            onClick={() => handleWhatsAppClick(localBooking.phone)}
                            size="small"
                            sx={{ 
                              color: '#25D366',
                              '&:hover': { 
                                bgcolor: alpha('#25D366', 0.1)
                              },
                              padding: '2px'
                            }}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      height: '38px',
                      '& fieldset': {
                        borderColor: alpha(theme.palette.divider, 0.8)
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
              </Grid>
              
              {/* מספר לילות - מוקטן */}
              <Grid item xs={0.8} sx={{ px: 0.5 }}>
                <TextField
                  fullWidth
                  placeholder="לילות"
                  variant="outlined"
                  size="small"
                  type="number"
                  inputProps={{ min: 1, max: 30 }}
                  value={localBooking.nights || 1}
                  onChange={(e) => handleChange('nights', parseInt(e.target.value) || 1)}
                  onBlur={handleBlur}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NightsStayIcon fontSize="small" sx={{ color: alpha(theme.palette.text.primary, 0.5) }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      height: '38px',
                      '& fieldset': {
                        borderColor: alpha(theme.palette.divider, 0.8)
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
              </Grid>
              
              {/* הערות - מוגדל */}
              <Grid item xs={4} sx={{ px: 0.5 }}>
                <TextField
                  fullWidth
                  placeholder="הערות"
                  variant="outlined"
                  size="small"
                  value={localBooking.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  onBlur={handleBlur}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CommentIcon fontSize="small" sx={{ color: alpha(theme.palette.text.primary, 0.5) }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      height: '38px',
                      '& fieldset': {
                        borderColor: alpha(theme.palette.divider, 0.8)
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
              </Grid>
              
              {/* אמצעי תשלום */}
              <Grid item xs={1.3} sx={{ px: 0.5 }}>
                <TextField
                  select
                  fullWidth
                  placeholder="אמצעי תשלום"
                  variant="outlined"
                  size="small"
                  value={localBooking.paymentMethod || ''}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  SelectProps={{
                    MenuProps: {
                      anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left',
                      },
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      },
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      height: '38px',
                      '& fieldset': {
                        borderColor: alpha(theme.palette.divider, 0.8)
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                >
                  {PAYMENT_METHODS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              {/* סכום */}
              <Grid item xs={1.1} sx={{ px: 0.5 }}>
                <TextField
                  fullWidth
                  placeholder="סכום"
                  variant="outlined"
                  size="small"
                  type="number"
                  value={localBooking.amount || ''}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  onBlur={handleBlur}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">₪</InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      height: '38px',
                      '& fieldset': {
                        borderColor: alpha(theme.palette.divider, 0.8)
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>
          )}
        </Box>
        
        {/* מחיקה - מחוץ לתוך ה-Box כדי לוודא התייחסות נכונה */}
        {!isMultiNightDisplay && (
          <Tooltip title="מחק" placement="top">
            <IconButton 
              onClick={() => onDelete(locationId, roomId)}
              color="error"
              size="small"
              sx={{ 
                opacity: 0.7,
                '&:hover': { opacity: 1 },
                padding: '4px',
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                right: 8
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {isMultiNightDisplay && (
          <Tooltip title={`הזמנה מקורית מתאריך ${format(parseISO(originalBookingDate), 'dd/MM/yyyy')}`} placement="top">
            <Chip 
              icon={<EventAvailableIcon />} 
              label="המשך הזמנה" 
              size="small"
              color="info"
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem',
                height: '20px',
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                right: 8
              }}
            />
          </Tooltip>
        )}
      </ListItem>
    </React.Fragment>
  );
};

// קומפוננטה של סרגל צדדי אם לא קיימת כבר
const MinimalSidebar = styled(Box)(({ theme }) => ({
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
}));

const SidebarButton = styled(Tooltip)(({ theme, isActive }) => ({
  '& .MuiButtonBase-root': {
    padding: '12px',
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05)
    },
    transition: 'all 0.3s ease',
    borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
    borderRight: 'none'
  }
}));

const SimpleBookingList = () => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState({});
  const [multiNightBookings, setMultiNightBookings] = useState({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // טעינת נתוני הזמנות מהשרת בעת טעינת הדף
  useEffect(() => {
    fetchBookings();
  }, []);
  
  // פונקציה לטעינת ההזמנות מהשרת
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      
      // קבלת כל ההזמנות מהשרת מ-API החדש לטקסט פשוט
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/simple-bookings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.success) {
        // ארגון ההזמנות לפי תאריך ומיקום
        const formattedBookings = {};
        
        response.data.simpleBookings.forEach(booking => {
          const checkIn = new Date(booking.date);
          const dateKey = format(checkIn, 'yyyy-MM-dd');
          
          // אין צורך בחילוץ מספר החדר כי כבר יש לנו את כל המידע במבנה הנכון
          const { location, roomId } = booking;
          
          // יצירת המבנה הנדרש
          if (!formattedBookings[dateKey]) {
            formattedBookings[dateKey] = {};
          }
          
          if (!formattedBookings[dateKey][location]) {
            formattedBookings[dateKey][location] = {};
          }
          
          // שמירת הפרטים הרלוונטיים
          formattedBookings[dateKey][location][roomId] = {
            guestName: booking.guestName || '',
            phone: booking.phone || '',
            notes: booking.notes || '',
            isPaid: booking.isPaid || false,
            nights: booking.nights || 1,
            paymentMethod: booking.paymentMethod || '',
            amount: booking.amount || 0,
            bookingId: booking._id // שמירת המזהה מהשרת
          };
        });
        
        setBookings(formattedBookings);
        // חישוב הזמנות רב-לילות
        calculateMultiNightBookings(formattedBookings);
      }
    } catch (error) {
      console.error('שגיאה בטעינת ההזמנות:', error);
      toast.error('אירעה שגיאה בטעינת ההזמנות מהשרת');
      
      // במקרה של שגיאה, ננסה לטעון מהלוקל סטורג' כגיבוי
      const savedBookings = localStorage.getItem('simpleBookings');
      if (savedBookings) {
        try {
          const parsedBookings = JSON.parse(savedBookings);
          setBookings(parsedBookings);
          calculateMultiNightBookings(parsedBookings);
        } catch (e) {
          console.error('שגיאה בטעינה מלוקל סטורג\':', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // חישוב של הזמנות רב-לילות
  const calculateMultiNightBookings = (bookingsData) => {
    const multiNightData = {};
    
    // סריקה של כל ההזמנות לחיפוש הזמנות עם יותר מלילה אחד
    Object.entries(bookingsData).forEach(([dateKey, locationsData]) => {
      Object.entries(locationsData).forEach(([locationId, roomsData]) => {
        Object.entries(roomsData).forEach(([roomId, booking]) => {
          // בדיקה אם יש יותר מלילה אחד
          const nights = booking.nights || 1;
          if (nights > 1) {
            // יצירת רשומות עבור הלילות הנוספים
            for (let i = 1; i < nights; i++) {
              const nextDate = addDays(parseISO(dateKey), i);
              const nextDateKey = format(nextDate, 'yyyy-MM-dd');
              
              if (!multiNightData[nextDateKey]) {
                multiNightData[nextDateKey] = {};
              }
              
              if (!multiNightData[nextDateKey][locationId]) {
                multiNightData[nextDateKey][locationId] = {};
              }
              
              // שמירת פרטי ההזמנה המקורית לתאריך הבא
              multiNightData[nextDateKey][locationId][roomId] = {
                ...booking,
                originalBookingDate: dateKey,
                isMultiNight: true
              };
            }
          }
        });
      });
    });
    
    setMultiNightBookings(multiNightData);
  };
  
  // שמירת נתוני הזמנות ל-localStorage לגיבוי מקומי
  useEffect(() => {
    localStorage.setItem('simpleBookings', JSON.stringify(bookings));
  }, [bookings]);
  
  // מעבר ליום הבא
  const handleNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };
  
  // מעבר ליום הקודם
  const handlePrevDay = () => {
    setCurrentDate(prev => subDays(prev, 1));
  };
  
  // מעבר להיום
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // פתיחת בוחר תאריך
  const handleOpenDatePicker = () => {
    setIsDatePickerOpen(true);
  };
  
  // טיפול בבחירת תאריך
  const handleDateChange = (newDate) => {
    if (newDate) {
      setCurrentDate(newDate);
      setIsDatePickerOpen(false);
    }
  };
  
  // פונקציה לקבלת מפתח ייחודי לתאריך
  const getDateKey = (date) => {
    return format(date, 'yyyy-MM-dd');
  };
  
  // פונקציה להוספת או עדכון הזמנה
  const handleSaveBooking = async (locationId, roomId, bookingData) => {
    try {
      setIsLoading(true);
      
      // הכנת נתוני ההזמנה לשליחה לשרת
      const { guestName, phone, notes, isPaid, nights, paymentMethod, amount, bookingId } = bookingData;
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      
      // נתוני ההזמנה
      const bookingToSave = {
        date: dateKey,
        guestName,
        phone,
        notes,
        isPaid: paymentMethod ? true : false, // הגדרת isPaid לפי אם יש אמצעי תשלום או לא
        nights: nights || 1,
        location: locationId,
        roomId,
        paymentMethod: paymentMethod || '', // אמצעי תשלום
        amount: amount || 0
      };
      
      // אם יש מזהה הזמנה, זה עדכון של הזמנה קיימת
      if (bookingId) {
        // עדכון הזמנה קיימת בשרת
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/simple-bookings/${bookingId}`, 
          bookingToSave,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
        );
        
        if (response.data && response.data.success) {
          // עדכון מצב הזמנות מקומי
          const updatedBookings = { ...bookings };
          if (!updatedBookings[dateKey]) {
            updatedBookings[dateKey] = {};
          }
          if (!updatedBookings[dateKey][locationId]) {
            updatedBookings[dateKey][locationId] = {};
          }
          
          // שים לב: בתגובת PUT המזהה נמצא ב-booking._id
          const savedBookingId = response.data.booking && response.data.booking._id ? 
            response.data.booking._id : bookingId;
          
          updatedBookings[dateKey][locationId][roomId] = {
            ...bookingToSave,
            bookingId: savedBookingId
          };
          
          setBookings(updatedBookings);
          calculateMultiNightBookings(updatedBookings);
          
          console.log(`הזמנה עודכנה בהצלחה לחדר ${roomId} בתאריך ${dateKey}`);
        }
      } 
      // אחרת, זו הזמנה חדשה
      else {
        // יצירת הזמנה חדשה בשרת
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/simple-bookings`, 
          bookingToSave,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
        );
        
        if (response.data && response.data.success) {
          // עדכון מצב הזמנות מקומי
          const updatedBookings = { ...bookings };
          if (!updatedBookings[dateKey]) {
            updatedBookings[dateKey] = {};
          }
          if (!updatedBookings[dateKey][locationId]) {
            updatedBookings[dateKey][locationId] = {};
          }
          
          // שים לב: בתגובת POST המזהה נמצא ב-booking._id
          const savedBookingId = response.data.booking && response.data.booking._id ? 
            response.data.booking._id : null;
          
          if (savedBookingId) {
            updatedBookings[dateKey][locationId][roomId] = {
              ...bookingToSave,
              bookingId: savedBookingId
            };
            
            setBookings(updatedBookings);
            calculateMultiNightBookings(updatedBookings);
            
            console.log(`הזמנה חדשה נוצרה בהצלחה לחדר ${roomId} בתאריך ${dateKey}`);
          } else {
            console.error('לא ניתן למצוא את מזהה ההזמנה בתגובת השרת');
            toast.error('אירעה שגיאה בשמירת ההזמנה - חסר מזהה');
          }
        }
      }
    } catch (error) {
      console.error('שגיאה בשמירת ההזמנה:', error);
      toast.error('אירעה שגיאה בשמירת ההזמנה');
    } finally {
      setIsLoading(false);
    }
  };
  
  // עדכון ההזמנה בסטייט המקומי בלבד (למקרה של כשל בשרת)
  const updateLocalBookingState = (dateKey, locationId, roomId, bookingData) => {
    setBookings(prev => {
      const newBookings = { ...prev };
      
      // עדכון או מחיקה בהתאם למצב
      if (bookingData.guestName.trim() === '' && 
          bookingData.phone.trim() === '' && 
          bookingData.notes.trim() === '') {
        // מחיקה מקומית
        if (newBookings[dateKey]?.[locationId]?.[roomId]) {
          delete newBookings[dateKey][locationId][roomId];
        }
        
        // ניקוי מבנים ריקים
        if (newBookings[dateKey]?.[locationId] && Object.keys(newBookings[dateKey][locationId]).length === 0) {
          delete newBookings[dateKey][locationId];
        }
        
        if (newBookings[dateKey] && Object.keys(newBookings[dateKey]).length === 0) {
          delete newBookings[dateKey];
        }
      } else {
        // וידוא שהמבנה קיים
        if (!newBookings[dateKey]) {
          newBookings[dateKey] = {};
        }
        
        if (!newBookings[dateKey][locationId]) {
          newBookings[dateKey][locationId] = {};
        }
        
        // שמירת ההזמנה
        newBookings[dateKey][locationId][roomId] = {
          guestName: bookingData.guestName.trim(),
          phone: bookingData.phone.trim(),
          notes: bookingData.notes.trim(),
          isPaid: bookingData.isPaid,
          nights: bookingData.nights || 1,
          bookingId: bookingData.bookingId // שמירת המזהה מהשרת אם קיים
        };
      }
      
      return newBookings;
    });
  };
  
  // פונקציה ליצירת הזמנה חדשה לחדר
  const handleAddBooking = (locationId, roomId) => {
    // יצירת מזהה זמני ייחודי
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    
    // הכנת נתוני הזמנה בסיסיים
    const newBooking = {
      guestName: '',
      phone: '',
      notes: '',
      isPaid: false,
      nights: 1,
      paymentMethod: '',
      amount: 0
    };
    
    // עדכון מצב הזמנה ללא שליחה לשרת (תתבצע כאשר האורח ישנה ויזין מידע)
    const updatedBookings = { ...bookings };
    if (!updatedBookings[dateKey]) {
      updatedBookings[dateKey] = {};
    }
    if (!updatedBookings[dateKey][locationId]) {
      updatedBookings[dateKey][locationId] = {};
    }
    updatedBookings[dateKey][locationId][roomId] = newBooking;
    setBookings(updatedBookings);
    
    toast.success('תא הזמנה חדש נוצר. הזן פרטי אורח לשמירה');
  };

  // מחיקת הזמנה
  const handleDeleteBooking = async (locationId, roomId) => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    
    try {
      setIsLoading(true);
      
      // ודא שההזמנה קיימת
      if (!bookings[dateKey]?.[locationId]?.[roomId]) {
        toast.error('ההזמנה לא נמצאה');
        return;
      }
      
      // אם יש מזהה הזמנה, נמחק מהשרת
      const bookingId = bookings[dateKey][locationId][roomId].bookingId;
      if (bookingId) {
        const response = await axios.delete(`${process.env.REACT_APP_API_URL}/simple-bookings/${bookingId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data && response.data.success) {
          toast.success('ההזמנה נמחקה בהצלחה');
        }
      }
      
      // עדכון מצב מקומי
      const updatedBookings = { ...bookings };
      if (updatedBookings[dateKey]?.[locationId]?.[roomId]) {
        delete updatedBookings[dateKey][locationId][roomId];
        
        // ניקוי מבנים ריקים
        if (Object.keys(updatedBookings[dateKey][locationId]).length === 0) {
          delete updatedBookings[dateKey][locationId];
        }
        
        if (Object.keys(updatedBookings[dateKey]).length === 0) {
          delete updatedBookings[dateKey];
        }
        
        setBookings(updatedBookings);
        calculateMultiNightBookings(updatedBookings);
      }
    } catch (error) {
      console.error('שגיאה במחיקת ההזמנה:', error);
      toast.error('אירעה שגיאה במחיקת ההזמנה');
    } finally {
      setIsLoading(false);
    }
  };
  
  // פורמט יום ותאריך בעברית
  const formattedDate = format(currentDate, "EEEE d בMMMM yyyy", { locale: he });
  
  // מפתח של התאריך הנוכחי
  const currentDateKey = getDateKey(currentDate);
  
  // האם התאריך הנוכחי הוא סוף שבוע
  const isWeekend = format(currentDate, 'EEEE', { locale: he }).includes('שבת') || 
                    format(currentDate, 'EEEE', { locale: he }).includes('שישי');
  
  // פונקציה לבדיקה אם החדר מאוכלס כחלק מהזמנה רב-לילות
  const isPartOfMultiNightBooking = (locationId, roomId) => {
    return multiNightBookings[currentDateKey]?.[locationId]?.[roomId] || null;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      {/* סרגל צדדי מינימליסטי */}
      <MinimalSidebar>
        <SidebarButton title="לוח מחוונים" placement="right" isActive={currentPath === '/dashboard'}>
          <IconButton 
            component={Link} 
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
            component={Link} 
            to="/dashboard/bookings-calendar"
            sx={{ 
              color: isActive => isActive ? '#e74c3c' : '#666',
              '&:hover': { color: '#c0392b' }
            }}
          >
            <EventIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="תצוגת הזמנות" placement="right" isActive={currentPath === '/dashboard/bookings-new'}>
          <IconButton 
            component={Link} 
            to="/dashboard/bookings-new"
            sx={{ 
              color: isActive => isActive ? '#9b59b6' : '#666',
              '&:hover': { color: '#8e44ad' }
            }}
          >
            <CalendarMonthIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="דו״ח הכנסות" placement="right" isActive={currentPath === '/dashboard/income-report'}>
          <IconButton 
            component={Link} 
            to="/dashboard/income-report"
            sx={{ 
              color: isActive => isActive ? '#e74c3c' : '#666',
              '&:hover': { color: '#c0392b' }
            }}
          >
            <AssessmentIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>

        <SidebarButton title="ניהול פיננסי" placement="right" isActive={currentPath === '/dashboard/financial-management'}>
          <IconButton 
            component={Link} 
            to="/dashboard/financial-management"
            sx={{ 
              color: isActive => isActive ? '#16a085' : '#666',
              '&:hover': { color: '#1abc9c' }
            }}
          >
            <AccountBalanceIcon fontSize="medium" />
          </IconButton>
        </SidebarButton>
        
        <Box sx={{ flexGrow: 1 }} /> {/* מרווח גמיש שידחוף את האייקון הבא לתחתית */}
        
        <SidebarButton title="אתר הבית" placement="right" isActive={currentPath === '/'}>
          <IconButton 
            component={Link} 
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
      
      {/* תוכן העמוד בסגנון dashboard */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, paddingLeft: '55px' }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}
        >
          {/* כותרת הדף בסגנון dashboard */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                <HotelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                106 / Airport Guest House
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={fetchBookings}
              sx={{ 
                borderRadius: 1.5,
                boxShadow: 2
              }}
            >
              רענון
            </Button>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* סרגל ניווט תאריכים בסגנון dashboard */}
          <Paper 
            elevation={1}
            sx={{ 
              p: 1.5, 
              mb: 3, 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 2,
              background: isWeekend ? 
                `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.light, 0.08)})` : 
                'white',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.06)}`
            }}
          >
            <IconButton 
              onClick={handlePrevDay}
              size="small"
              sx={{ 
                borderRadius: 1.5,
                color: theme.palette.primary.main,
                '&:hover': { 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1) 
                }
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              flex: 1,
              justifyContent: 'center'
            }}>
              <Button
                startIcon={<TodayIcon />}
                onClick={handleToday}
                variant="outlined"
                size="small"
                color="primary"
                sx={{ 
                  borderRadius: 1.5,
                  px: 1.5,
                  '&:hover': {
                    boxShadow: `0 1px 5px ${alpha(theme.palette.primary.main, 0.2)}`
                  }
                }}
              >
                היום
              </Button>
              
              <Button
                onClick={handleOpenDatePicker}
                variant="text"
                color="primary"
                sx={{ 
                  borderRadius: 1.5,
                  fontWeight: 500,
                  minWidth: 250
                }}
                startIcon={<DateRangeIcon />}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 500,
                    textAlign: 'center',
                    color: isWeekend ? theme.palette.primary.dark : theme.palette.primary.main,
                  }}
                >
                  {formattedDate}
                </Typography>
              </Button>
            </Box>
            
            <IconButton 
              onClick={handleNextDay}
              size="small"
              sx={{ 
                borderRadius: 1.5,
                color: theme.palette.primary.main,
                '&:hover': { 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1) 
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Paper>
          
          {/* חיווי טעינה */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress thickness={3} sx={{ color: theme.palette.primary.main }} />
            </Box>
          )}
          
          {/* תצוגת המתחמים והחדרים */}
          <Grid container spacing={2}>
            {Object.entries(LOCATIONS).map(([locationId, location]) => (
              <Grid item xs={12} key={locationId}>
                <Card 
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    mb: 1,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    '&:hover': {
                      boxShadow: `0 5px 15px ${alpha(theme.palette.primary.main, 0.08)}`
                    },
                    transition: 'box-shadow 0.3s ease'
                  }}
                >
                  <CardHeader
                    title={location.name}
                    sx={{
                      background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.7)}, ${alpha(theme.palette.primary.dark, 0.85)})`,
                      color: 'white',
                      py: 1,
                      px: 2,
                      '& .MuiCardHeader-title': {
                        fontSize: '1rem',
                        fontWeight: '600'
                      }
                    }}
                  />
                  
                  <List disablePadding>
                    {location.rooms.map(roomId => {
                      // בדיקה אם החדר מאוכלס כחלק מהזמנה רב-לילות
                      const multiNightBooking = isPartOfMultiNightBooking(locationId, roomId);
                      
                      if (multiNightBooking) {
                        // החדר מאוכלס כחלק מהזמנה רב-לילות
                        return (
                          <RoomBookingCell 
                            key={roomId}
                            locationId={locationId}
                            roomId={roomId}
                            booking={multiNightBooking}
                            currentDateKey={currentDateKey}
                            onSave={handleSaveBooking}
                            onDelete={handleDeleteBooking}
                            isMultiNightDisplay={true}
                            originalBookingDate={multiNightBooking.originalBookingDate}
                          />
                        );
                      } else {
                        // קבלת נתוני ההזמנה הקיימת או יצירת ברירת מחדל חדשה
                        const booking = bookings[currentDateKey]?.[locationId]?.[roomId] || { 
                          guestName: '', 
                          phone: '', 
                          notes: '',
                          isPaid: false,
                          nights: 1
                        };
                        
                        // שימוש בקומפוננטה הנפרדת
                        return (
                          <RoomBookingCell 
                            key={roomId}
                            locationId={locationId}
                            roomId={roomId}
                            booking={booking}
                            currentDateKey={currentDateKey}
                            onSave={handleSaveBooking}
                            onDelete={handleDeleteBooking}
                            isMultiNightDisplay={false}
                          />
                        );
                      }
                    })}
                  </List>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* בוחר תאריך - דיאלוג */}
        <Dialog
          open={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            בחר תאריך
          </DialogTitle>
          <DialogContent>
            <DatePicker
              value={currentDate}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} fullWidth />}
              sx={{ width: '100%' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDatePickerOpen(false)}>ביטול</Button>
            <Button onClick={() => handleDateChange(currentDate)} color="primary" variant="contained">
              אישור
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default SimpleBookingList; 