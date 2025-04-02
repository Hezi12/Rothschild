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
  CardContent,
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
  Breadcrumbs,
  Avatar
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

// קומפוננטות מותאמות אישית עם עיצוב משופר
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
  border: '1px solid',
  borderColor: alpha(theme.palette.divider, 0.1),
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 25px 0 rgba(0,0,0,0.08)'
  },
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.92)} 100%)`
}));

// קומפוננטה עבור כותרת מתחם מודרנית
const LocationHeader = styled(Box)(({ theme }) => ({
  padding: '16px 20px',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  position: 'relative',
  backgroundColor: 'white',
  '&:after': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 4,
    height: '60%',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '0 2px 2px 0'
  }
}));

// קומפוננטה עבור תא של חדר - משופר
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
  
  // עדכון לוקאלי כאשר משתנה ה-booking מבחוץ
  useEffect(() => {
    setLocalBooking(booking);
  }, [booking, currentDateKey]);
  
  // עדכון שדה ספציפי בהזמנה המקומית ושמירה אוטומטית
  const handleChange = (field, value) => {
    const updatedBooking = {
      ...localBooking,
      [field]: value
    };
    setLocalBooking(updatedBooking);
    
    // שומר אוטומטית כאשר משתנה מצב התשלום (כי אין אירוע onBlur ל-Switch)
    if (field === 'isPaid') {
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
  
  // עוגל את סטטוס התשלום
  const togglePaymentStatus = () => {
    handleChange('isPaid', !localBooking.isPaid);
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        py: 1.2,
        px: 2,
        backgroundColor: 'white',
        borderRadius: 3,
        mb: 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
          transform: 'translateY(-2px)',
          borderColor: alpha(theme.palette.primary.main, 0.1)
        },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {isMultiNightDisplay && (
        <Chip 
          icon={<EventAvailableIcon fontSize="small" />} 
          label="המשך הזמנה" 
          size="small"
          color="info"
          variant="outlined"
          sx={{ 
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: '0.75rem',
            height: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
            zIndex: 2
          }}
        />
      )}
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 2,
        width: '100%',
        position: 'relative'
      }}>
        {/* מספר החדר */}
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: localBooking.guestName ? 
              (localBooking.isPaid ? 
                alpha('#4caf50', 0.08) : 
                alpha('#ff9800', 0.08)) : 
              alpha(theme.palette.grey[100], 0.7),
            color: localBooking.guestName ? 
              (localBooking.isPaid ? 
                '#2e7d32' : 
                '#e65100') : 
              alpha(theme.palette.text.secondary, 0.8),
            width: 48,
            height: 48,
            borderRadius: '14px',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            flexShrink: 0,
            border: '1px solid',
            borderColor: localBooking.guestName ? 
              (localBooking.isPaid ? 
                alpha('#4caf50', 0.2) : 
                alpha('#ff9800', 0.2)) : 
              alpha(theme.palette.grey[200], 0.8),
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          {roomId}
        </Box>
        
        {isMultiNightDisplay ? (
          // תצוגת מידע של המשך הזמנה
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>
              {localBooking.guestName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, color: alpha(theme.palette.text.primary, 0.7) }}>
              {localBooking.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.7) }} />
                  <Typography variant="body2">{localBooking.phone}</Typography>
                </Box>
              )}
              {localBooking.nights > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <NightsStayIcon fontSize="small" sx={{ color: alpha(theme.palette.info.main, 0.7) }} />
                  <Typography variant="body2">המשך הזמנה ({localBooking.nights} לילות)</Typography>
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          // טופס עריכה - תמיד מוצג
          <Grid container spacing={2} sx={{ ml: 0 }}>
            {/* שם אורח */}
            <Grid item xs={12} sm={3}>
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
                      <PersonIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    '& fieldset': {
                      borderColor: alpha(theme.palette.divider, 0.5)
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.5)
                    },
                    '&.Mui-focused fieldset': {
                      borderWidth: 1,
                      borderColor: theme.palette.primary.main
                    }
                  }
                }}
              />
            </Grid>
            
            {/* טלפון עם אייקון וואטסאפ */}
            <Grid item xs={12} sm={3}>
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
                      <PhoneIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
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
                              bgcolor: alpha('#25D366', 0.1),
                              transform: 'scale(1.05)'
                            },
                            transition: 'all 0.2s',
                            borderRadius: '10px'
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
                    borderRadius: 2.5,
                    '& fieldset': {
                      borderColor: alpha(theme.palette.divider, 0.5)
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.5)
                    },
                    '&.Mui-focused fieldset': {
                      borderWidth: 1,
                      borderColor: theme.palette.primary.main
                    }
                  }
                }}
              />
            </Grid>
            
            {/* מספר לילות - מוקטן */}
            <Grid item xs={6} sm={1}>
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
                      <NightsStayIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    '& fieldset': {
                      borderColor: alpha(theme.palette.divider, 0.5)
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.5)
                    },
                    '&.Mui-focused fieldset': {
                      borderWidth: 1,
                      borderColor: theme.palette.primary.main
                    }
                  }
                }}
              />
            </Grid>
            
            {/* הערות - מוגדל */}
            <Grid item xs={12} sm={4}>
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
                      <CommentIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    '& fieldset': {
                      borderColor: alpha(theme.palette.divider, 0.5)
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.5)
                    },
                    '&.Mui-focused fieldset': {
                      borderWidth: 1,
                      borderColor: theme.palette.primary.main
                    }
                  }
                }}
              />
            </Grid>
            
            {/* סטטוס תשלום וכפתור מחיקה */}
            <Grid item xs={6} sm={1} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Tooltip title={localBooking.isPaid ? "סמן כלא שולם" : "סמן כשולם"}>
                <IconButton
                  onClick={togglePaymentStatus}
                  size="small"
                  sx={{
                    color: localBooking.isPaid ? 
                      '#4caf50' : 
                      alpha(theme.palette.text.secondary, 0.7),
                    '&:hover': {
                      bgcolor: localBooking.isPaid ? 
                        alpha('#4caf50', 0.1) : 
                        alpha('#f44336', 0.05),
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s',
                    borderRadius: '10px',
                    width: 32,
                    height: 32
                  }}
                >
                  {localBooking.isPaid ? <CheckCircleIcon /> : <PaymentIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title="מחק">
                <IconButton 
                  onClick={() => onDelete(locationId, roomId)}
                  color="error"
                  size="small"
                  sx={{ 
                    opacity: 0.6,
                    '&:hover': { 
                      opacity: 1,
                      backgroundColor: alpha('#f44336', 0.1),
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s',
                    borderRadius: '10px',
                    width: 32,
                    height: 32
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        )}
      </Box>
    </Paper>
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
  boxShadow: '0 3px 15px rgba(0,0,0,0.1)',
  borderRadius: '0 12px 12px 0',
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

// קומפוננטה של הסטטיסטיקה
const StatCard = ({ icon, title, value, color }) => {
  const theme = useTheme();
  
  return (
    <StyledPaper>
      <Box 
        sx={{
          position: 'absolute',
          top: -30,
          right: -10,
          borderRadius: '50%',
          width: 130,
          height: 130,
          background: `linear-gradient(145deg, ${alpha(color, 0.12)} 20%, ${alpha(color, 0.04)} 80%)`,
          zIndex: 0
        }}
      />
      <CardContent sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(color, 0.15),
              color: color
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
      </CardContent>
    </StyledPaper>
  );
};

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
  
  // שמירת הזמנה
  const handleSaveBooking = async (locationId, roomId, bookingData) => {
    const dateKey = getDateKey(currentDate);
    
    try {
      // מבנה נתונים בסיסי לשרת החדש
      const bookingToSave = {
        date: dateKey,
        location: locationId,
        roomId: roomId,
        guestName: bookingData.guestName.trim(),
        phone: bookingData.phone.trim(),
        notes: bookingData.notes.trim(),
        nights: bookingData.nights || 1,
        isPaid: bookingData.isPaid
      };
      
      // עדכון או מחיקה בהתאם למצב
      if (bookingData.guestName.trim() === '' && 
          bookingData.phone.trim() === '' && 
          bookingData.notes.trim() === '') {
        
        // בדיקה אם יש מזהה של הזמנה בשרת שצריך למחוק
        if (bookingData.bookingId) {
          await axios.delete(`${process.env.REACT_APP_API_URL}/simple-bookings/${bookingData.bookingId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
        }
        
        // מחיקה מקומית
        setBookings(prev => {
          const newBookings = { ...prev };
          
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
          
          return newBookings;
        });
      } else {
        // שליחת הבקשה לשרת - יצירה או עדכון דרך ה-API החדש
        let response;
        
        if (bookingData.bookingId) {
          // עדכון הזמנה קיימת
          response = await axios.put(`${process.env.REACT_APP_API_URL}/simple-bookings/${bookingData.bookingId}`, bookingToSave, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
        } else {
          // יצירת הזמנה חדשה
          response = await axios.post(`${process.env.REACT_APP_API_URL}/simple-bookings`, bookingToSave, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
        }
        
        if (response.data && response.data.success) {
          // קבלת המזהה שנוצר על ידי השרת
          const bookingId = response.data.booking?._id || bookingData.bookingId;
          
          // עדכון ההזמנה בסטייט המקומי
          setBookings(prev => {
            const newBookings = { ...prev };
            
            // וידוא שהמבנה קיים
            if (!newBookings[dateKey]) {
              newBookings[dateKey] = {};
            }
            
            if (!newBookings[dateKey][locationId]) {
              newBookings[dateKey][locationId] = {};
            }
            
            // שמירת ההזמנה עם המזהה שהתקבל
            newBookings[dateKey][locationId][roomId] = {
              guestName: bookingData.guestName.trim(),
              phone: bookingData.phone.trim(),
              notes: bookingData.notes.trim(),
              isPaid: bookingData.isPaid,
              nights: bookingData.nights || 1,
              bookingId: bookingId // שמירת המזהה מהשרת
            };
            
            return newBookings;
          });
        }
      }
    } catch (error) {
      console.error('שגיאה בשמירת ההזמנה:', error);
      toast.error('אירעה שגיאה בשמירת ההזמנה');
      
      // עדכון מקומי גם במקרה של שגיאה, כגיבוי
      updateLocalBookingState(dateKey, locationId, roomId, bookingData);
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
  
  // מחיקת הזמנה
  const handleDeleteBooking = async (locationId, roomId) => {
    const dateKey = getDateKey(currentDate);
    
    try {
      // בדיקה אם יש הזמנה בשרת שצריך למחוק
      const bookingId = bookings[dateKey]?.[locationId]?.[roomId]?.bookingId;
      
      if (bookingId) {
        // מחיקה מהשרת
        await axios.delete(`${process.env.REACT_APP_API_URL}/simple-bookings/${bookingId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
      }
      
      // מחיקה מקומית
      setBookings(prev => {
        const newBookings = { ...prev };
        
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
        
        return newBookings;
      });
    } catch (error) {
      console.error('שגיאה במחיקת ההזמנה:', error);
      toast.error('אירעה שגיאה במחיקת ההזמנה');
      
      // מחיקה מקומית גם במקרה של שגיאה
      setBookings(prev => {
        const newBookings = { ...prev };
        
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
        
        return newBookings;
      });
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

  // חישובים לסטטיסטיקה
  const getTotalBookingsCount = () => {
    let count = 0;
    
    // הזמנות רגילות
    const dateBookings = bookings[currentDateKey] || {};
    for (const locationId in dateBookings) {
      count += Object.keys(dateBookings[locationId] || {}).length;
    }
    
    // הזמנות רב-לילות
    const multiDateBookings = multiNightBookings[currentDateKey] || {};
    for (const locationId in multiDateBookings) {
      count += Object.keys(multiDateBookings[locationId] || {}).length;
    }
    
    return count;
  };
  
  const getTotalPaidBookingsCount = () => {
    let count = 0;
    
    // הזמנות רגילות
    const dateBookings = bookings[currentDateKey] || {};
    for (const locationId in dateBookings) {
      for (const roomId in dateBookings[locationId] || {}) {
        if (dateBookings[locationId][roomId].isPaid) {
          count++;
        }
      }
    }
    
    // הזמנות רב-לילות
    const multiDateBookings = multiNightBookings[currentDateKey] || {};
    for (const locationId in multiDateBookings) {
      for (const roomId in multiDateBookings[locationId] || {}) {
        if (multiDateBookings[locationId][roomId].isPaid) {
          count++;
        }
      }
    }
    
    return count;
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
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4, paddingLeft: '55px' }}>
        <StyledPaper 
          elevation={0} 
          sx={{ 
            p: 2,
            mb: 3, 
            borderRadius: 3,
            boxShadow: '0 3px 15px rgba(0,0,0,0.08)'
          }}
        >
          {/* סרגל ניווט תאריכים עם כפתור רענון */}
          <Paper 
            elevation={1}
            sx={{ 
              p: 1.5, 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 3,
              background: isWeekend ? 
                `linear-gradient(to right, ${alpha(theme.palette.warning.light, 0.05)}, ${alpha(theme.palette.warning.light, 0.08)})` : 
                `linear-gradient(to right, ${alpha(theme.palette.primary.light, 0.02)}, ${alpha(theme.palette.primary.light, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 3px 12px ${alpha(theme.palette.primary.main, 0.06)}`
            }}
          >
            <IconButton 
              onClick={handlePrevDay}
              size="small"
              sx={{ 
                borderRadius: 2,
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
                  borderRadius: 2,
                  px: 1.5,
                  '&:hover': {
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                  }
                }}
              >
                היום
              </Button>
              
              <Button
                onClick={handleOpenDatePicker}
                variant="text"
                color={isWeekend ? "warning" : "primary"}
                sx={{ 
                  borderRadius: 2,
                  fontWeight: 500,
                  minWidth: 250,
                  py: 0.5,
                  px: 1.5,
                  '&:hover': { 
                    backgroundColor: alpha(isWeekend ? theme.palette.warning.main : theme.palette.primary.main, 0.05) 
                  }
                }}
                startIcon={<DateRangeIcon />}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 500,
                    textAlign: 'center',
                    color: isWeekend ? 
                      alpha(theme.palette.warning.dark, 0.9) : 
                      alpha(theme.palette.primary.main, 0.9),
                    fontSize: '1rem'
                  }}
                >
                  {formattedDate}
                </Typography>
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={fetchBookings}
                size="small"
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  minWidth: 'unset',
                  px: 2
                }}
              >
                רענון
              </Button>
            </Box>
            
            <IconButton 
              onClick={handleNextDay}
              size="small"
              sx={{ 
                borderRadius: 2,
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
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress thickness={3} sx={{ color: theme.palette.primary.main }} />
            </Box>
          )}
          
          {/* תצוגת המתחמים והחדרים */}
          <Grid container spacing={2}>
            {Object.entries(LOCATIONS).map(([locationId, location]) => (
              <Grid item xs={12} key={locationId}>
                <Paper 
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    mb: 1.5,
                    boxShadow: '0 3px 10px rgba(0,0,0,0.03)',
                    '&:hover': {
                      boxShadow: '0 5px 15px rgba(0,0,0,0.06)'
                    },
                    transition: 'box-shadow 0.3s ease, transform 0.2s ease',
                    backgroundColor: 'white'
                  }}
                >
                  <LocationHeader theme={theme}>
                    <HotelIcon sx={{ color: alpha(theme.palette.primary.main, 0.8) }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: alpha(theme.palette.text.primary, 0.85) }}>
                      {location.name}
                    </Typography>
                  </LocationHeader>
                  
                  <Box sx={{ p: 1.5 }}>
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
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </StyledPaper>

        {/* בוחר תאריך - דיאלוג */}
        <Dialog
          open={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 5px 20px rgba(0,0,0,0.15)'
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', py: 2 }}>
            בחר תאריך
          </DialogTitle>
          <DialogContent>
            <DatePicker
              value={currentDate}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
              sx={{ width: '100%' }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setIsDatePickerOpen(false)} sx={{ borderRadius: 2 }}>ביטול</Button>
            <Button onClick={() => handleDateChange(currentDate)} color="primary" variant="contained" sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              אישור
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default SimpleBookingList; 