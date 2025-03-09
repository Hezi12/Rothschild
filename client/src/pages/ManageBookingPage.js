import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, differenceInDays, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Divider, 
  useTheme, 
  useMediaQuery,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  AlertTitle
} from '@mui/material';
import { 
  CalendarToday, 
  AccessTime, 
  Person, 
  Hotel, 
  Payment, 
  EventBusy, 
  Cancel,
  ReceiptLong,
  ArrowBack,
  CheckCircleOutline,
  ErrorOutline
} from '@mui/icons-material';

const ManageBookingPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [booking, setBooking] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationStatus, setCancellationStatus] = useState(null);
  const [cancellationFee, setCancellationFee] = useState(0);
  
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`);
        
        if (response.data) {
          setBooking(response.data);
          
          // שליפת פרטי החדר
          const roomResponse = await axios.get(`${process.env.REACT_APP_API_URL}/rooms/${response.data.roomId}`);
          if (roomResponse.data) {
            setRoom(roomResponse.data);
          }
          
          // חישוב דמי ביטול
          calculateCancellationFee(response.data);
        }
      } catch (err) {
        console.error('שגיאה בטעינת פרטי ההזמנה:', err);
        setError('לא ניתן לטעון את פרטי ההזמנה. אנא נסה שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [bookingId]);
  
  // חישוב דמי ביטול בהתאם למדיניות הביטול
  const calculateCancellationFee = (bookingData) => {
    if (!bookingData?.checkIn) return;
    
    const today = new Date();
    const checkInDate = new Date(bookingData.checkIn);
    const daysUntilCheckIn = differenceInDays(checkInDate, today);
    
    // חישוב מחיר ביטול לפי מדיניות - אפס עד 3 ימים לפני, מחיר מלא פחות מ-3 ימים
    if (daysUntilCheckIn >= 3) {
      setCancellationFee(0);
    } else {
      setCancellationFee(bookingData.totalPrice);
    }
  };
  
  // ביטול ההזמנה
  const handleCancelBooking = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}/cancel`, {
        cancellationFee
      });
      
      if (response.data.success) {
        setCancellationStatus('success');
        setBooking(prev => ({
          ...prev,
          status: 'cancelled',
          cancellationDate: new Date(),
          cancellationFee
        }));
      } else {
        setCancellationStatus('error');
      }
    } catch (err) {
      console.error('שגיאה בביטול ההזמנה:', err);
      setCancellationStatus('error');
    } finally {
      setCancelDialogOpen(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>שגיאה</AlertTitle>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/')} 
          sx={{ mt: 2 }}
        >
          חזרה לדף הבית
        </Button>
      </Box>
    );
  }
  
  if (!booking || !room) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <AlertTitle>לא נמצאו פרטים</AlertTitle>
          לא נמצאו פרטים להזמנה המבוקשת.
        </Alert>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/')} 
          sx={{ mt: 2 }}
        >
          חזרה לדף הבית
        </Button>
      </Box>
    );
  }
  
  // חישוב תאריך אחרון לביטול ללא עלות (3 ימים לפני הצ'ק-אין)
  const freeCancellationDeadline = addDays(new Date(booking.checkIn), -3);
  const isPastFreeCancellationDeadline = new Date() > freeCancellationDeadline;
  
  // בדיקה האם ניתן לבטל את ההזמנה
  const canCancel = booking.status !== 'cancelled' && new Date(booking.checkIn) > new Date();
  
  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* כפתור חזרה */}
      <Button 
        startIcon={<ArrowBack />} 
        onClick={() => navigate('/')} 
        sx={{ mb: 3 }}
      >
        חזרה לדף הבית
      </Button>
      
      {/* כותרת */}
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        component="h1" 
        gutterBottom 
        sx={{ fontWeight: 'bold' }}
      >
        ניהול הזמנה
      </Typography>
      
      {/* הודעת סטטוס לאחר ביטול */}
      {cancellationStatus === 'success' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>הזמנתך בוטלה בהצלחה</AlertTitle>
          פרטי הביטול נשלחו לכתובת האימייל שלך.
          {cancellationFee > 0 && ` דמי ביטול בסך ${cancellationFee} ₪ יחויבו בהתאם למדיניות הביטול.`}
        </Alert>
      )}
      
      {cancellationStatus === 'error' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>שגיאה בביטול ההזמנה</AlertTitle>
          אירעה שגיאה בתהליך ביטול ההזמנה. אנא נסה שוב או צור קשר עם שירות הלקוחות.
        </Alert>
      )}
      
      {/* פרטי הזמנה */}
      <Paper elevation={2} sx={{ mb: 4, p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>פרטי הזמנה</Typography>
          <Chip 
            label={
              booking.status === 'confirmed' ? 'מאושרת' : 
              booking.status === 'cancelled' ? 'מבוטלת' : 
              booking.status === 'completed' ? 'הושלמה' : 'ממתינה'
            }
            color={
              booking.status === 'confirmed' ? 'success' : 
              booking.status === 'cancelled' ? 'error' : 
              booking.status === 'completed' ? 'info' : 'warning'
            }
          />
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <ReceiptLong sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1"><strong>מספר הזמנה:</strong> {booking._id}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1">
                <strong>תאריך הזמנה:</strong> {format(new Date(booking.createdAt), 'dd.MM.yyyy', { locale: he })}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Hotel sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1"><strong>חדר:</strong> {room.name}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Person sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1"><strong>אורח:</strong> {booking.guest.name}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1">
                <strong>תאריך הגעה:</strong> {format(new Date(booking.checkIn), 'EEEE, dd.MM.yyyy', { locale: he })}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1">
                <strong>תאריך יציאה:</strong> {format(new Date(booking.checkOut), 'EEEE, dd.MM.yyyy', { locale: he })}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1"><strong>מספר לילות:</strong> {booking.nights}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Payment sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1"><strong>מחיר כולל:</strong> ₪{booking.totalPrice}</Typography>
            </Box>
          </Grid>
          
          {booking.status === 'cancelled' && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 1 }}>
                <strong>ההזמנה בוטלה בתאריך:</strong> {format(new Date(booking.cancellationDate || new Date()), 'dd.MM.yyyy', { locale: he })}
                {booking.cancellationFee > 0 && ` (דמי ביטול: ₪${booking.cancellationFee})`}
              </Alert>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* מדיניות ביטול והסבר */}
      <Paper elevation={2} sx={{ mb: 4, p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
          <EventBusy sx={{ mr: 1, fontSize: '1.3rem', color: 'primary.main' }} />
          מדיניות ביטול
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • <strong>ביטול עד 3 ימים לפני מועד ההגעה:</strong> ללא עלות
          </Typography>
          <Typography variant="body2">
            • <strong>ביטול פחות מ-3 ימים לפני מועד ההגעה:</strong> חיוב בעלות מלאה (100%)
          </Typography>
        </Box>
        
        <Alert severity={isPastFreeCancellationDeadline ? "warning" : "info"} sx={{ mb: 2 }}>
          {isPastFreeCancellationDeadline ? (
            <>
              <AlertTitle>התאריך האחרון לביטול ללא עלות חלף</AlertTitle>
              במקרה של ביטול ההזמנה בשלב זה, יחול חיוב מלא בסך ₪{booking.totalPrice}.
            </>
          ) : (
            <>
              <AlertTitle>ניתן לבטל ללא עלות עד {format(freeCancellationDeadline, 'EEEE, dd.MM.yyyy', { locale: he })}</AlertTitle>
              אתה עדיין בתקופת הביטול ללא עלות. ביטול ההזמנה לא יגרור תשלום.
            </>
          )}
        </Alert>
        
        {canCancel && (
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<Cancel />} 
            onClick={() => setCancelDialogOpen(true)}
            fullWidth={isMobile}
            sx={{ mt: 1 }}
          >
            בטל הזמנה
          </Button>
        )}
        
        {!canCancel && booking.status !== 'cancelled' && (
          <Alert severity="error">
            <AlertTitle>לא ניתן לבטל</AlertTitle>
            לא ניתן לבטל הזמנה לאחר מועד ההגעה.
          </Alert>
        )}
      </Paper>
      
      {/* דיאלוג אישור ביטול */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>
          {cancellationFee > 0 ? "ביטול הזמנה עם דמי ביטול" : "אישור ביטול הזמנה"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {cancellationFee > 0 ? (
              <>
                <strong>שים לב:</strong> ביטול ההזמנה בשלב זה יחייב תשלום דמי ביטול בסך {cancellationFee} ₪.
                <br />
                האם אתה בטוח שברצונך לבטל את ההזמנה?
              </>
            ) : (
              <>
                אתה עומד לבטל את ההזמנה. אין דמי ביטול בשלב זה.
                <br />
                האם אתה בטוח שברצונך להמשיך?
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            חזרה
          </Button>
          <Button 
            onClick={handleCancelBooking} 
            color="error" 
            variant="contained"
            startIcon={<Cancel />}
          >
            בטל הזמנה
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageBookingPage; 