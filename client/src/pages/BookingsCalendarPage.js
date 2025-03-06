import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  Chip,
  Card,
  Divider,
  Tooltip,
  Container,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  FormControlLabel,
  Switch
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Today as TodayIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Block as BlockIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay, isWithinInterval, parseISO, isToday } from 'date-fns';
import { he } from 'date-fns/locale';

const BookingsCalendarPage = () => {
  const theme = useTheme();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(startOfWeek(currentDate, { weekStartsOn: 0 }));
  const [endDate, setEndDate] = useState(endOfWeek(currentDate, { weekStartsOn: 0 }));
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [blockReason, setBlockReason] = useState('');
  const [showFullCardNumber, setShowFullCardNumber] = useState(false);
  const [error, setError] = useState(null);
  
  // פונקציות לפעולות על סטטוס תשלום והזמנות
  const [paymentStatus, setPaymentStatus] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(false);
  
  // מספר הימים שיוצגו בלוח השנה (7 = שבוע)
  const daysToShow = 14;
  
  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, [startDate, endDate]);
  
  // עדכון טווח התאריכים כשהתאריך הנוכחי משתנה
  useEffect(() => {
    setStartDate(startOfWeek(currentDate, { weekStartsOn: 0 }));
    setEndDate(endOfWeek(addDays(currentDate, daysToShow - 7), { weekStartsOn: 0 }));
  }, [currentDate, daysToShow]);
  
  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
      // נסדר את החדרים לפי מספר חדר
      const sortedRooms = response.data.data.sort((a, b) => a.roomNumber - b.roomNumber);
      setRooms(sortedRooms);
    } catch (error) {
      console.error('שגיאה בטעינת חדרים:', error);
      toast.error('שגיאה בטעינת חדרים');
    }
  };
  
  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // נקבל את כל ההזמנות בטווח התאריכים
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      const url = `${process.env.REACT_APP_API_URL}/bookings?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
      const response = await axios.get(url);
      
      setBookings(response.data.data);
    } catch (error) {
      console.error('שגיאה בטעינת הזמנות:', error);
      toast.error('שגיאה בטעינת הזמנות');
    } finally {
      setLoading(false);
    }
  };
  
  // מעבר לשבוע הבא
  const handleNextPeriod = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };
  
  // מעבר לשבוע הקודם
  const handlePrevPeriod = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };
  
  // חזרה ליום הנוכחי
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // פתיחת דיאלוג להוספת הזמנה חדשה
  const handleOpenBookingDialog = (room, date) => {
    setSelectedRoom(room);
    setSelectedDates({ start: date, end: addDays(date, 1) });
    setBookingDialogOpen(true);
  };
  
  // פתיחת דיאלוג לחסימת תאריכים
  const handleOpenBlockDialog = (room, date) => {
    setSelectedRoom(room);
    setSelectedDates({ start: date, end: addDays(date, 1) });
    setBlockDialogOpen(true);
  };
  
  // פתיחת פרטי הזמנה
  const handleOpenBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setPaymentStatus(booking.paymentStatus);
    setBookingDialogOpen(true);
    setShowFullCardNumber(false);
  };
  
  // סגירת דיאלוג
  const handleCloseDialog = () => {
    setBookingDialogOpen(false);
    setBlockDialogOpen(false);
    setSelectedBooking(null);
    setSelectedRoom(null);
    setSelectedDates({ start: null, end: null });
    setBlockReason('');
    setShowFullCardNumber(false);
  };
  
  // פונקציות לעדכון סטטוס תשלום ופעולות נוספות
  const handleUpdatePaymentStatus = async () => {
    try {
      setLoading(true);
      await axios.put(`${process.env.REACT_APP_API_URL}/bookings/${selectedBooking._id}`, {
        paymentStatus: paymentStatus
      });
      
      // עדכון הרשימה המקומית
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === selectedBooking._id 
            ? { ...booking, paymentStatus } 
            : booking
        )
      );
      
      setSelectedBooking({...selectedBooking, paymentStatus});
      toast.success('סטטוס התשלום עודכן בהצלחה');
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס התשלום:', error);
      toast.error('שגיאה בעדכון סטטוס התשלום. אנא נסה שנית.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendInvoice = async () => {
    try {
      setSendingInvoice(true);
      await axios.post(`${process.env.REACT_APP_API_URL}/bookings/${selectedBooking._id}/invoice`);
      toast.success('החשבונית נשלחה בהצלחה');
    } catch (error) {
      console.error('שגיאה בשליחת החשבונית:', error);
      toast.error('שגיאה בשליחת החשבונית. אנא נסה שנית.');
    } finally {
      setSendingInvoice(false);
    }
  };
  
  const handleDeleteBooking = async () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) {
      try {
        setDeletingBooking(true);
        await axios.delete(`${process.env.REACT_APP_API_URL}/bookings/${selectedBooking._id}`);
        
        // מסיר את ההזמנה מהרשימה המקומית
        setBookings(prevBookings => 
          prevBookings.filter(booking => booking._id !== selectedBooking._id)
        );
        
        toast.success('ההזמנה נמחקה בהצלחה');
        handleCloseDialog();
      } catch (error) {
        console.error('שגיאה במחיקת ההזמנה:', error);
        toast.error('שגיאה במחיקת ההזמנה. אנא נסה שנית.');
      } finally {
        setDeletingBooking(false);
      }
    }
  };
  
  // יצירת שורות ימים בלוח
  const renderDaysHeader = () => {
    const days = [];
    let currentDay = startDate;
    
    for (let i = 0; i < daysToShow; i++) {
      const day = addDays(currentDay, i);
      const dayName = format(day, 'EEEE', { locale: he });
      const dayNumber = format(day, 'd', { locale: he });
      const monthName = format(day, 'MMM', { locale: he });
      
      const isCurrentDay = isToday(day);
      
      days.push(
        <Box 
          key={i} 
          sx={{ 
            flex: 1, 
            textAlign: 'center',
            p: 1,
            border: '1px solid #e0e0e0',
            borderBottom: '2px solid #e0e0e0',
            backgroundColor: isCurrentDay ? theme.palette.primary.light : 'inherit',
            color: isCurrentDay ? 'white' : 'inherit',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minWidth: 70,
            justifyContent: 'center',
            alignItems: 'center',
            flexGrow: 1
          }}
        >
          <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
            {`יום ${dayName}`}
          </Typography>
          <Typography variant="body2" component="div" sx={{ fontWeight: 'bold' }}>
            {dayNumber} {monthName}
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ 
        display: 'flex', 
        mb: 1,
        pr: 15, // השארת מקום לכותרת "חדרים"
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#bdbdbd',
          borderRadius: '4px',
        },
      }}>
        {days}
      </Box>
    );
  };
  
  // רינדור תא בלוח (משבצת זמן)
  const renderCell = (room, date) => {
    // בודק אם יש הזמנה בתאריך ובחדר הזה
    const bookingsForCell = bookings.filter(booking => {
      const checkIn = parseISO(booking.checkIn);
      const checkOut = parseISO(booking.checkOut);
      
      return (
        booking.room._id === room._id &&
        date >= checkIn &&
        date < checkOut
      );
    });
    
    const hasBooking = bookingsForCell.length > 0;
    const isCurrentDay = isToday(date);
    
    return (
      <Box
        sx={{
          height: '100px',
          border: '1px solid #e0e0e0',
          p: 0.5,
          position: 'relative',
          backgroundColor: isCurrentDay ? 'rgba(25, 118, 210, 0.08)' : 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: 70,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        {hasBooking ? (
          bookingsForCell.map((booking) => (
            <Box
              key={booking._id}
              onClick={() => handleOpenBookingDetails(booking)}
              sx={{
                width: '100%',
                height: '100%',
                backgroundColor: booking.paymentStatus === 'שולם' 
                  ? 'rgba(76, 175, 80, 0.3)' 
                  : booking.paymentStatus === 'בוטל'
                  ? 'rgba(211, 47, 47, 0.3)'
                  : 'rgba(255, 152, 0, 0.3)',
                border: `2px solid ${
                  booking.paymentStatus === 'שולם' 
                    ? 'rgb(76, 175, 80)' 
                    : booking.paymentStatus === 'בוטל'
                    ? 'rgb(211, 47, 47)'
                    : 'rgb(255, 152, 0)'
                }`,
                borderRadius: '4px',
                p: 1,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  transform: 'translateY(-1px)',
                  transition: 'all 0.2s',
                },
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '0.8rem', 
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  textAlign: 'center',
                }} 
                noWrap
              >
                {booking.guest.firstName} {booking.guest.lastName}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.7rem',
                  lineHeight: 1,
                  mb: 0.5 
                }}
              >
                {format(parseISO(booking.checkIn), 'dd/MM')} - {format(parseISO(booking.checkOut), 'dd/MM')}
              </Typography>
              <Box 
                sx={{ 
                  display: 'inline-block',
                  px: 1, 
                  py: 0.3,
                  borderRadius: '12px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  backgroundColor: booking.paymentStatus === 'שולם' 
                    ? 'rgb(76, 175, 80)' 
                    : booking.paymentStatus === 'בוטל'
                    ? 'rgb(211, 47, 47)'
                    : 'rgb(255, 152, 0)',
                  color: 'white',
                }}
              >
                {booking.paymentStatus === 'pending' ? 'לא שולם' : booking.paymentStatus}
              </Box>
            </Box>
          ))
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenBookingDialog(room, date)}
              title="הוסף הזמנה"
            >
              <AddIcon />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleOpenBlockDialog(room, date)}
              title="חסום תאריך"
            >
              <BlockIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    );
  };
  
  // רינדור שורה של חדר בלוח
  const renderRoom = (room) => {
    const cells = [];
    
    for (let i = 0; i < daysToShow; i++) {
      const cellDate = addDays(startDate, i);
      cells.push(
        <Box key={i} sx={{ flex: 1 }}>
          {renderCell(room, cellDate)}
        </Box>
      );
    }
    
    return (
      <Box key={room._id} sx={{ display: 'flex', mb: 1 }}>
        <Box
          sx={{
            width: '150px',
            minWidth: '150px',
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: theme.palette.grey[100],
            borderRadius: '4px',
            mr: 1,
            border: '1px solid #e0e0e0',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            חדר {room.roomNumber}
          </Typography>
          <Typography variant="caption">
            {room.type}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flex: 1, overflowX: 'auto' }}>
          {cells}
        </Box>
      </Box>
    );
  };
  
  // רינדור דיאלוג פרטי הזמנה
  const renderBookingDetailsDialog = () => {
    if (!selectedBooking) return null;
    
    const checkIn = parseISO(selectedBooking.checkIn);
    const checkOut = parseISO(selectedBooking.checkOut);
    
    return (
      <Dialog
        open={bookingDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: theme.palette.primary.main, color: 'white' }}>
          פרטי הזמנה
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                פרטי אורח
              </Typography>
              <Typography variant="body2">
                שם: {selectedBooking.guest.firstName} {selectedBooking.guest.lastName}
              </Typography>
              <Typography variant="body2">
                טלפון: {selectedBooking.guest.phone}
              </Typography>
              <Typography variant="body2">
                דוא"ל: {selectedBooking.guest.email}
              </Typography>
              <Typography variant="body2">
                ת.ז: {selectedBooking.guest.idNumber}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                פרטי ההזמנה
              </Typography>
              <Typography variant="body2">
                תאריך צ'ק-אין: {format(checkIn, 'dd/MM/yyyy')}
              </Typography>
              <Typography variant="body2">
                תאריך צ'ק-אאוט: {format(checkOut, 'dd/MM/yyyy')}
              </Typography>
              <Typography variant="body2">
                מספר לילות: {selectedBooking.nights}
              </Typography>
              <Typography variant="body2">
                חדר: {selectedBooking.room.roomNumber} ({selectedBooking.room.type})
              </Typography>
              <Typography variant="body2">
                מחיר כולל: ₪{selectedBooking.totalPrice}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                פרטי תשלום
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  סטטוס תשלום:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  >
                    <MenuItem value="לא שולם">לא שולם</MenuItem>
                    <MenuItem value="שולם">שולם</MenuItem>
                    <MenuItem value="שולם חלקית">שולם חלקית</MenuItem>
                    <MenuItem value="מבוטל">מבוטל</MenuItem>
                  </Select>
                </FormControl>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleUpdatePaymentStatus}
                  sx={{ ml: 1 }}
                >
                  עדכן
                </Button>
              </Box>
              
              {selectedBooking.paymentMethod === 'creditCard' && selectedBooking.creditCardDetails && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    אמצעי תשלום: כרטיס אשראי
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2">
                      מספר כרטיס: {showFullCardNumber 
                        ? selectedBooking.creditCardDetails.cardNumber 
                        : `xxxx-xxxx-xxxx-${selectedBooking.creditCardDetails.cardNumber.slice(-4)}`}
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={() => setShowFullCardNumber(!showFullCardNumber)}
                      sx={{ ml: 1 }}
                    >
                      {showFullCardNumber ? 'הסתר' : 'הצג מלא'}
                    </Button>
                  </Box>
                  <Typography variant="body2">
                    תוקף: {selectedBooking.creditCardDetails.expiryMonth}/{selectedBooking.creditCardDetails.expiryYear}
                  </Typography>
                  {selectedBooking.creditCardDetails.cvv && (
                    <Typography variant="body2">
                      CVV: {selectedBooking.creditCardDetails.cvv}
                    </Typography>
                  )}
                </Box>
              )}
              
              {selectedBooking.paymentMethod === 'cash' && (
                <Typography variant="body2">
                  אמצעי תשלום: מזומן
                </Typography>
              )}
              
              {selectedBooking.paymentMethod === 'bankTransfer' && (
                <Typography variant="body2">
                  אמצעי תשלום: העברה בנקאית
                </Typography>
              )}
              
              {selectedBooking.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    הערות
                  </Typography>
                  <Typography variant="body2">
                    {selectedBooking.notes}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Box>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteBooking}
              disabled={deletingBooking}
              startIcon={<DeleteIcon />}
              sx={{ mr: 1 }}
            >
              {deletingBooking ? 'מוחק...' : 'מחק הזמנה'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleSendInvoice}
              disabled={sendingInvoice}
              startIcon={<PrintIcon />}
            >
              {sendingInvoice ? 'שולח...' : 'שלח חשבונית'}
            </Button>
          </Box>
          <Button onClick={handleCloseDialog}>סגור</Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  if (loading && rooms.length === 0) {
    return (
      <Container sx={{ mt: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          טוען נתונים...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => { setError(null); fetchRooms(); fetchBookings(); }}>
          נסה שנית
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            ניהול הזמנות - תצוגת לוח
          </Typography>
          <Box>
            <Button
              variant="outlined"
              onClick={goToToday}
              startIcon={<CalendarIcon />}
              sx={{ mx: 1 }}
            >
              היום
            </Button>
            <IconButton onClick={handlePrevPeriod} color="primary">
              <PrevIcon />
            </IconButton>
            <Typography variant="subtitle1" component="span" sx={{ mx: 1 }}>
              {format(startDate, 'dd/MM/yyyy')} - {format(addDays(startDate, 13), 'dd/MM/yyyy')}
            </Typography>
            <IconButton onClick={handleNextPeriod} color="primary">
              <NextIcon />
            </IconButton>
          </Box>
        </Box>

        <Paper sx={{ p: 1, overflowX: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <Box sx={{ width: '150px', minWidth: '150px', textAlign: 'center', mr: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  חדרים
                </Typography>
              </Box>
              {renderDaysHeader()}
            </Box>
            
            {rooms.map(room => renderRoom(room))}
          </Box>
        </Paper>
      </Paper>
      
      {/* פופאפים / דיאלוגים */}
      {renderBookingDetailsDialog()}
      
      {/* דיאלוג להוספת הזמנה - יש להשלים  */}
      <Dialog
        open={bookingDialogOpen}
        onClose={handleCloseDialog}
      >
        <DialogTitle>הוסף הזמנה חדשה</DialogTitle>
        <DialogContent>
          <Typography>
            הוספת הזמנה חדשה לחדר {selectedRoom?.roomNumber} בתאריך {selectedDates.start && format(selectedDates.start, 'dd/MM/yyyy')}
          </Typography>
          {/* כאן יש להוסיף טופס להזמנה חדשה */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ביטול</Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג לחסימת תאריכים - יש להשלים */}
      <Dialog
        open={blockDialogOpen}
        onClose={handleCloseDialog}
      >
        <DialogTitle>חסימת תאריכים</DialogTitle>
        <DialogContent>
          <Typography>
            חסימת תאריכים לחדר {selectedRoom?.roomNumber} החל מתאריך {selectedDates.start && format(selectedDates.start, 'dd/MM/yyyy')}
          </Typography>
          {/* כאן יש להוסיף טופס לחסימת תאריכים */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ביטול</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingsCalendarPage; 