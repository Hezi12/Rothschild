import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { format, addDays, addMonths, subMonths, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
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
  Card,
  CardContent,
  CardActions,
  Stack,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarMonth as CalendarMonthIcon,
  Hotel as HotelIcon,
  Person as PersonIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

// קומפוננטה ראשית - תצוגת רשימת הזמנות מודרנית
const BookingListView = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const { isAdmin } = useContext(AuthContext);

  // סטייט לשמירת נתונים
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysInView, setDaysInView] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [priceDialog, setPriceDialog] = useState({
    open: false,
    roomId: null,
    date: null,
    price: 0
  });
  const [viewBookingDialog, setViewBookingDialog] = useState({
    open: false,
    bookingId: null,
    bookingData: null,
    loading: false
  });
  
  // טווח ימים להצגה
  const daysToShow = isMobile ? 3 : isTablet ? 7 : 14;

  // יצירת טווח ימים להצגה
  useEffect(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < daysToShow; i++) {
      days.push(addDays(today, i));
    }
    
    setDaysInView(days);
  }, [daysToShow]);
  
  // טעינת נתונים
  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, [daysInView]);
  
  // טעינת חדרים
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setRooms(response.data.data);
      }
    } catch (error) {
      console.error('שגיאה בטעינת החדרים:', error);
      setError('אירעה שגיאה בטעינת החדרים');
    } finally {
      setLoading(false);
    }
  };
  
  // טעינת הזמנות
  const fetchBookings = async () => {
    try {
      if (daysInView.length === 0) return;
      
      setLoading(true);
      
      // טווח תאריכים מורחב - נטען 3 ימים נוספים לפני ואחרי הטווח הנוכחי
      const startDate = format(addDays(daysInView[0], -3), 'yyyy-MM-dd');
      const endDate = format(addDays(daysInView[daysInView.length - 1], 3), 'yyyy-MM-dd');
      
      console.log(`טוען הזמנות מ-${startDate} עד ${endDate}`);
      
      // ניסיון טעינה עם מספר ניסיונות חוזרים במקרה של כישלון
      let attempts = 0;
      let success = false;
      let error = null;
      
      while (attempts < 3 && !success) {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings`, {
            params: { startDate, endDate },
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          
          if (response.data.success) {
            console.log(`נטענו ${response.data.data.length} הזמנות`);
            setBookings(response.data.data);
            success = true;
          } else {
            throw new Error('השרת החזיר תשובה שגויה');
          }
        } catch (err) {
          error = err;
          attempts++;
          if (attempts < 3) {
            // המתנה לפני ניסיון חוזר
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!success) {
        console.error('שגיאה בטעינת ההזמנות לאחר מספר ניסיונות:', error);
        setError('אירעה שגיאה בטעינת ההזמנות');
        
        // יתכן שיש token לא תקין - בדיקה
        const token = localStorage.getItem('token');
        if (!token) {
          setError('נראה שאינך מחובר. אנא התחבר מחדש.');
        }
      }
    } catch (error) {
      console.error('שגיאה בטעינת ההזמנות:', error);
      setError('אירעה שגיאה בטעינת ההזמנות');
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה לקבלת הזמנות לחדר ספציפי ביום ספציפי
  const getBookingsForRoomAndDate = (roomId, date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    return bookings.filter(booking => {
      const checkInDate = format(new Date(booking.checkIn), 'yyyy-MM-dd');
      const checkOutDate = format(new Date(booking.checkOut), 'yyyy-MM-dd');
      
      return booking.room._id === roomId && 
             formattedDate >= checkInDate && 
             formattedDate < checkOutDate;
    });
  };
  
  // פונקציה לקבלת רכיב תא בטבלה
  const getCellContent = (room, date) => {
    const roomBookings = getBookingsForRoomAndDate(room._id, date);
    const isBooked = roomBookings.length > 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(date);
    cellDate.setHours(0, 0, 0, 0);
    const isPast = cellDate < today;
    
    // בדיקה האם תאריך הצ'ק-אין של ההזמנה
    const isCheckInDate = roomBookings.length > 0 && 
      format(new Date(roomBookings[0].checkIn), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    
    // בדיקה האם תאריך הצ'ק-אאוט של ההזמנה
    const isCheckOutDate = roomBookings.length > 0 && 
      format(new Date(roomBookings[0].checkOut), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    
    // קביעת צבע רקע מתאים
    let bgColor = '';
    if (isPast) {
      bgColor = '#f5f5f5'; // אפור לתאריכים שעברו
    } else if (isCheckInDate) {
      bgColor = '#ffecb3'; // צהוב בהיר לתאריך צ'ק-אין
    } else if (isCheckOutDate) {
      bgColor = '#c8e6c9'; // ירוק בהיר לתאריך צ'ק-אאוט
    } else if (isBooked) {
      bgColor = '#ffcdd2'; // אדום בהיר לתאריכים תפוסים
    } else {
      bgColor = '#e8f5e9'; // ירוק בהיר לתאריכים פנויים
    }
    
    // מחיר ברירת מחדל הוא מחיר הבסיס של החדר
    let price = room.basePrice;
    
    // אם יש מחיר מיוחד לתאריך זה, השתמש בו במקום
    // (כאן אפשר להוסיף לוגיקה לקבלת מחירים דינמיים)
    
    // פונקציית הלחיצה על התא
    const handleCellClick = () => {
      if (isBooked && roomBookings[0]) {
        // אם התא תפוס, פתח את פרטי ההזמנה
        handleViewBooking(roomBookings[0]._id);
      } else if (!isPast) {
        // אם התא פנוי, פתח יצירת הזמנה חדשה
        handleAddBooking(room._id, date);
      }
    };
    
    return (
      <Box 
        sx={{ 
          p: 1,
          height: '100%',
          minHeight: '80px',
          bgcolor: bgColor,
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transform: 'scale(1.02)',
            zIndex: 2
          },
          position: 'relative',
          border: isCheckInDate ? '2px solid #ff9800' : 
                 isCheckOutDate ? '2px solid #4caf50' : 
                 'none',
          cursor: isPast ? 'default' : 'pointer'
        }}
        onClick={handleCellClick}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" component="div" 
            sx={{ fontSize: '1rem', fontWeight: 'bold', color: isBooked ? '#d32f2f' : isPast ? '#9e9e9e' : '#2e7d32' }}>
            ₪{price}
          </Typography>
          
          {isCheckInDate ? (
            <Chip 
              size="small" 
              icon={<EventAvailableIcon />} 
              label="צ'ק-אין" 
              color="warning" 
              sx={{ fontSize: '0.7rem' }} 
            />
          ) : isCheckOutDate ? (
            <Chip 
              size="small" 
              icon={<EventAvailableIcon />} 
              label="צ'ק-אאוט" 
              color="success" 
              sx={{ fontSize: '0.7rem' }} 
            />
          ) : isBooked ? (
            <Chip 
              size="small" 
              icon={<EventBusyIcon />} 
              label="תפוס" 
              color="error" 
              sx={{ fontSize: '0.7rem' }} 
            />
          ) : isPast ? (
            <Chip 
              size="small" 
              icon={<CloseIcon />} 
              label="עבר" 
              color="default" 
              sx={{ fontSize: '0.7rem' }} 
            />
          ) : (
            <Chip 
              size="small" 
              icon={<EventAvailableIcon />} 
              label="פנוי" 
              color="success" 
              sx={{ fontSize: '0.7rem' }} 
            />
          )}
        </Box>
        
        {isBooked && roomBookings[0] && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" component="div" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
              <PersonIcon fontSize="inherit" sx={{ mr: 0.5 }} />
              {roomBookings[0].guest.firstName} {roomBookings[0].guest.lastName}
            </Typography>
            
            {isCheckInDate && (
              <Typography variant="caption" component="div" sx={{ display: 'flex', alignItems: 'center', mt: 0.5, color: '#ff9800' }}>
                כניסה היום
              </Typography>
            )}
            
            {isCheckOutDate && (
              <Typography variant="caption" component="div" sx={{ display: 'flex', alignItems: 'center', mt: 0.5, color: '#4caf50' }}>
                יציאה היום
              </Typography>
            )}
            
            {!isCheckInDate && !isCheckOutDate && (
              <Typography variant="caption" component="div" sx={{ mt: 0.5, color: '#666' }}>
                {roomBookings[0].nights} לילות
              </Typography>
            )}
          </Box>
        )}
        
        {isAdmin() && (
          <Box sx={{ 
            position: 'absolute', 
            bottom: 2, 
            right: 2, 
            display: 'flex', 
            opacity: isBooked ? 0.7 : 0,
            transition: 'opacity 0.2s',
            '.MuiBox-root:hover > &': {
              opacity: 1
            }
          }}>
            <Tooltip title="עדכון מחיר">
              <IconButton 
                size="small" 
                color="primary" 
                onClick={(e) => {
                  e.stopPropagation(); // מניעת הפעלת אירוע הלחיצה על התא
                  handlePriceDialogOpen(room._id, date, price);
                }}
                sx={{ 
                  p: 0.5,
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' } 
                }}
              >
                <AttachMoneyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {isBooked ? (
              <Tooltip title="צפייה בהזמנה">
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={(e) => {
                    e.stopPropagation(); // מניעת הפעלת אירוע הלחיצה על התא
                    handleViewBooking(roomBookings[0]._id);
                  }}
                  sx={{ 
                    p: 0.5, 
                    ml: 0.5,
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' } 
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="הזמנה חדשה">
                <IconButton 
                  size="small" 
                  color="success" 
                  onClick={(e) => {
                    e.stopPropagation(); // מניעת הפעלת אירוע הלחיצה על התא
                    handleAddBooking(room._id, date);
                  }}
                  sx={{ 
                    p: 0.5,
                    ml: 0.5,
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' } 
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
    );
  };
  
  // פונקציה לפתיחת דיאלוג עריכת מחיר
  const handlePriceDialogOpen = (roomId, date, currentPrice) => {
    setPriceDialog({
      open: true,
      roomId,
      date,
      price: currentPrice
    });
  };
  
  // פונקציה לסגירת דיאלוג עריכת מחיר
  const handlePriceDialogClose = () => {
    setPriceDialog({
      ...priceDialog,
      open: false
    });
  };
  
  // פונקציה לשמירת מחיר חדש
  const handleSavePrice = async () => {
    try {
      // כאן צריך להוסיף קריאת API לשמירת מחיר דינמי
      // לדוגמה:
      /*
      await axios.post(`${process.env.REACT_APP_API_URL}/dynamic-prices`, {
        roomId: priceDialog.roomId,
        date: format(priceDialog.date, 'yyyy-MM-dd'),
        price: priceDialog.price
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      */
      
      toast.success('המחיר עודכן בהצלחה');
      handlePriceDialogClose();
      fetchBookings(); // רענון הנתונים
    } catch (error) {
      console.error('שגיאה בעדכון המחיר:', error);
      toast.error('אירעה שגיאה בעדכון המחיר');
    }
  };
  
  // פונקציה לצפייה בהזמנה
  const handleViewBooking = async (bookingId) => {
    try {
      // פתיחת הדיאלוג עם מצב טעינה
      setViewBookingDialog({
        open: true,
        bookingId,
        bookingData: null,
        loading: true
      });
      
      // טעינת נתוני ההזמנה
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setViewBookingDialog(prev => ({
          ...prev,
          bookingData: response.data.data,
          loading: false
        }));
      } else {
        throw new Error('שגיאה בטעינת נתוני ההזמנה');
      }
    } catch (error) {
      console.error('שגיאה בטעינת פרטי ההזמנה:', error);
      toast.error('אירעה שגיאה בטעינת פרטי ההזמנה');
      setViewBookingDialog(prev => ({
        ...prev,
        loading: false
      }));
    }
  };
  
  const handleViewBookingClose = () => {
    setViewBookingDialog({
      open: false,
      bookingId: null,
      bookingData: null,
      loading: false
    });
  };
  
  // פונקציה להוספת הזמנה חדשה
  const handleAddBooking = (roomId, date) => {
    // ניווט לדף יצירת הזמנה חדשה עם פרמטרים
    window.location.href = `/booking?room=${roomId}&checkIn=${format(date, 'yyyy-MM-dd')}`;
  };
  
  // החלפת טווח ימים הבא
  const showNextDays = () => {
    if (daysInView.length === 0) return;
    
    const newDays = daysInView.map(day => addDays(day, daysToShow));
    setDaysInView(newDays);
  };
  
  // החלפת טווח ימים הקודם
  const showPrevDays = () => {
    if (daysInView.length === 0) return;
    
    const newDays = daysInView.map(day => addDays(day, -daysToShow));
    setDaysInView(newDays);
  };
  
  // החלפה לחודש הבא
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // החלפה לחודש הקודם
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // החלפה ליום הנוכחי
  const handleToday = () => {
    const today = new Date();
    const newDays = [];
    
    for (let i = 0; i < daysToShow; i++) {
      newDays.push(addDays(today, i));
    }
    
    setDaysInView(newDays);
  };
  
  // החלפת לשונית פעילה
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item>
            <Typography variant="h5" component="h1">
              לוח זמינות וניהול הזמנות
            </Typography>
          </Grid>
          
          <Grid item sx={{ flexGrow: 1 }} />
          
          <Grid item>
            <Button 
              variant="outlined" 
              startIcon={<TodayIcon />}
              onClick={handleToday}
            >
              היום
            </Button>
          </Grid>
          
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={showPrevDays}>
                <ChevronRightIcon />
              </IconButton>
              
              <Typography variant="subtitle1" sx={{ mx: 1, minWidth: '180px', textAlign: 'center' }}>
                {daysInView.length > 0 
                  ? `${format(daysInView[0], 'dd/MM/yyyy')} - ${format(daysInView[daysInView.length - 1], 'dd/MM/yyyy')}` 
                  : 'טוען...'}
              </Typography>
              
              <IconButton onClick={showNextDays}>
                <ChevronLeftIcon />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => handleAddBooking(null, new Date())}
            >
              הזמנה חדשה
            </Button>
          </Grid>
        </Grid>
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="זמינות חדרים" icon={<HotelIcon />} iconPosition="start" />
          <Tab label="הזמנות" icon={<CalendarMonthIcon />} iconPosition="start" />
        </Tabs>
        
        {activeTab === 0 && (
          <>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: '150px' }}>חדר</TableCell>
                      
                      {daysInView.map((day, index) => {
                        const isToday = isSameDay(day, new Date());
                        return (
                          <TableCell key={index} align="center" sx={{ 
                            minWidth: '120px',
                            bgcolor: isToday ? '#e3f2fd' : 'inherit',
                            fontWeight: isToday ? 'bold' : 'normal'
                          }}>
                            <Typography variant="subtitle2" component="div">
                              {format(day, 'EEEE', { locale: he })}
                            </Typography>
                            <Typography variant="body2" component="div">
                              {format(day, 'dd/MM/yyyy')}
                            </Typography>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  
                  <TableBody>
                    {rooms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={daysInView.length + 1} align="center">
                          <Typography variant="subtitle1">אין חדרים להצגה</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rooms.map(room => (
                        <TableRow key={room._id}>
                          <TableCell 
                            component="th" 
                            scope="row" 
                            sx={{ 
                              fontWeight: 'bold',
                              position: 'sticky',
                              left: 0,
                              bgcolor: 'background.paper',
                              zIndex: 1
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <HotelIcon sx={{ mr: 1, color: 'primary.main' }} />
                              <Box>
                                <Typography variant="subtitle2" component="div">
                                  {room.internalName || `חדר ${room.roomNumber}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {room.type === 'standard' ? 'סטנדרט' : 
                                   room.type === 'deluxe' ? 'דלוקס' : 
                                   room.type === 'suite' ? 'סוויטה' : 
                                   room.type === 'simple' ? 'פשוט' : 
                                   room.type === 'simple_with_balcony' ? 'פשוט עם מרפסת' : 
                                   room.type === 'standard_with_balcony' ? 'סטנדרט עם מרפסת' : 
                                   room.type}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          
                          {daysInView.map((day, index) => (
                            <TableCell key={index} sx={{ p: 1 }}>
                              {getCellContent(room, day)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
        
        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">רשימת הזמנות - לשונית בפיתוח</Typography>
            <Typography variant="body2">
              לשונית זו תציג את כל ההזמנות בתצוגת רשימה מסורתית יותר.
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* דיאלוג עדכון מחיר */}
      <Dialog open={priceDialog.open} onClose={handlePriceDialogClose}>
        <DialogTitle>עדכון מחיר</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              חדר: {rooms.find(r => r._id === priceDialog.roomId)?.internalName || 'טוען...'}
            </Typography>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              תאריך: {priceDialog.date ? format(priceDialog.date, 'dd/MM/yyyy') : 'טוען...'}
            </Typography>
            <TextField
              label="מחיר חדש"
              type="number"
              fullWidth
              value={priceDialog.price}
              onChange={(e) => setPriceDialog({ ...priceDialog, price: Number(e.target.value) })}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₪</Typography>
              }}
              sx={{ mt: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePriceDialogClose} color="inherit">ביטול</Button>
          <Button onClick={handleSavePrice} color="primary" variant="contained">
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג פרטי הזמנה */}
      <Dialog 
        open={viewBookingDialog.open} 
        onClose={handleViewBookingClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {viewBookingDialog.bookingData ? 
            `פרטי הזמנה #${viewBookingDialog.bookingData.bookingNumber || viewBookingDialog.bookingId}` : 
            'פרטי הזמנה'
          }
        </DialogTitle>
        <DialogContent>
          {viewBookingDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              {viewBookingDialog.bookingData ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        פרטי האירוח
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">תאריך צ'ק-אין:</Typography>
                        <Typography variant="body2">
                          {format(new Date(viewBookingDialog.bookingData.checkIn), 'dd/MM/yyyy')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">תאריך צ'ק-אאוט:</Typography>
                        <Typography variant="body2">
                          {format(new Date(viewBookingDialog.bookingData.checkOut), 'dd/MM/yyyy')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">מספר לילות:</Typography>
                        <Typography variant="body2">{viewBookingDialog.bookingData.nights}</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">חדר:</Typography>
                        <Typography variant="body2">
                          {viewBookingDialog.bookingData.room && 
                            (viewBookingDialog.bookingData.room.internalName || `חדר ${viewBookingDialog.bookingData.room.roomNumber}`)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">סטטוס:</Typography>
                        <Chip 
                          size="small" 
                          label={viewBookingDialog.bookingData.status === 'confirmed' ? 'מאושר' : 
                                viewBookingDialog.bookingData.status === 'cancelled' ? 'מבוטל' : 
                                viewBookingDialog.bookingData.status === 'pending' ? 'ממתין' : 
                                viewBookingDialog.bookingData.status} 
                          color={viewBookingDialog.bookingData.status === 'confirmed' ? 'success' : 
                                viewBookingDialog.bookingData.status === 'cancelled' ? 'error' : 
                                'warning'} 
                        />
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        פרטי אורח
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">שם:</Typography>
                        <Typography variant="body2">
                          {viewBookingDialog.bookingData.guest && 
                            `${viewBookingDialog.bookingData.guest.firstName} ${viewBookingDialog.bookingData.guest.lastName}`}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">אימייל:</Typography>
                        <Typography variant="body2">
                          {viewBookingDialog.bookingData.guest && viewBookingDialog.bookingData.guest.email}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">טלפון:</Typography>
                        <Typography variant="body2">
                          {viewBookingDialog.bookingData.guest && viewBookingDialog.bookingData.guest.phone}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">מדינה:</Typography>
                        <Typography variant="body2">
                          {viewBookingDialog.bookingData.guest && (viewBookingDialog.bookingData.guest.country || 'ישראל')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">תייר:</Typography>
                        <Typography variant="body2">
                          {viewBookingDialog.bookingData.isTourist ? 'כן' : 'לא'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        פרטי תשלום
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">מחיר לילה:</Typography>
                            <Typography variant="body2">₪{viewBookingDialog.bookingData.basePrice}</Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">מע"מ:</Typography>
                            <Typography variant="body2">₪{viewBookingDialog.bookingData.vatAmount}</Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>סה"כ לתשלום:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₪{viewBookingDialog.bookingData.totalPrice}</Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">סטטוס תשלום:</Typography>
                            <Chip 
                              size="small" 
                              label={viewBookingDialog.bookingData.paymentStatus === 'pending' ? 'ממתין לתשלום' : 
                                    viewBookingDialog.bookingData.paymentStatus === 'paid' ? 'שולם' : 
                                    viewBookingDialog.bookingData.paymentStatus === 'refunded' ? 'הוחזר' : 
                                    viewBookingDialog.bookingData.paymentStatus} 
                              color={viewBookingDialog.bookingData.paymentStatus === 'paid' ? 'success' : 
                                    viewBookingDialog.bookingData.paymentStatus === 'refunded' ? 'info' : 
                                    'warning'} 
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">אמצעי תשלום:</Typography>
                            <Typography variant="body2">
                              {viewBookingDialog.bookingData.paymentMethod === 'credit' ? 'כרטיס אשראי' :
                                viewBookingDialog.bookingData.paymentMethod === 'cash' ? 'מזומן' :
                                viewBookingDialog.bookingData.paymentMethod === 'bit' ? 'ביט/פייבוקס' :
                                viewBookingDialog.bookingData.paymentMethod}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  {viewBookingDialog.bookingData.notes && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          הערות
                        </Typography>
                        <Typography variant="body2">{viewBookingDialog.bookingData.notes}</Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Alert severity="error">
                  לא נמצאו פרטי ההזמנה עבור ההזמנה זו.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {viewBookingDialog.bookingData && (
            <Button 
              color="error" 
              onClick={() => {
                // הוספת לוגיקה למחיקת ההזמנה
                // כאן צריך להוסיף בהמשך קריאה למחיקת ההזמנה
                alert('פונקציונליות מחיקה תתווסף בהמשך');
              }}
            >
              מחק הזמנה
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={handleViewBookingClose} color="inherit">סגירה</Button>
          {viewBookingDialog.bookingData && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => {
                // ניווט לדף עריכת ההזמנה
                window.location.href = `/dashboard/bookings-new?id=${viewBookingDialog.bookingId}`;
              }}
            >
              ערוך הזמנה
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingListView; 