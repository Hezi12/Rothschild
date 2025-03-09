import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Layout from '../components/Layout';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import EventIcon from '@mui/icons-material/Event';
import HotelIcon from '@mui/icons-material/Hotel';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';

const ManageBookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [room, setRoom] = useState(null);
  const [cancellationDetails, setCancellationDetails] = useState(null);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancellationLoading, setCancellationLoading] = useState(false);
  const [cancellationSuccess, setCancellationSuccess] = useState(false);
  const [cancellationError, setCancellationError] = useState(null);
  
  // פונקציה להצגת תאריך בפורמט עברי
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, d בMMM yyyy', { locale: he });
    } catch (error) {
      return dateString;
    }
  };
  
  // פונקציה לטעינת פרטי ההזמנה
  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/manage-booking/details/${id}`);
      setBooking(response.data.booking);
      setRoom(response.data.room);
      setCancellationDetails(response.data.cancellationDetails);
      
      setLoading(false);
    } catch (error) {
      console.error('שגיאה בטעינת פרטי ההזמנה:', error);
      setError('לא ניתן לטעון את פרטי ההזמנה. אנא נסה שוב מאוחר יותר.');
      setLoading(false);
    }
  };
  
  // פונקציה לביטול ההזמנה
  const cancelBooking = async () => {
    try {
      setCancellationLoading(true);
      setCancellationError(null);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/manage-booking/cancel/${id}`);
      
      // עדכון פרטי ההזמנה אחרי הביטול
      setBooking({
        ...booking,
        status: 'canceled',
        cancellationDetails: response.data.cancellationDetails
      });
      
      setCancellationSuccess(true);
      setOpenCancelDialog(false);
      setCancellationLoading(false);
    } catch (error) {
      console.error('שגיאה בביטול ההזמנה:', error);
      setCancellationError('אירעה שגיאה בתהליך ביטול ההזמנה. אנא נסה שוב מאוחר יותר.');
      setCancellationLoading(false);
    }
  };
  
  useEffect(() => {
    if (id) {
      fetchBookingDetails();
    }
  }, [id]);
  
  // סטטוס צ'יפ עם צבע מתאים
  const getStatusChip = (status) => {
    switch (status) {
      case 'confirmed':
        return <Chip color="success" icon={<DoneIcon />} label="מאושרת" />;
      case 'pending':
        return <Chip color="warning" icon={<WarningIcon />} label="ממתינה לאישור" />;
      case 'canceled':
        return <Chip color="error" icon={<CancelIcon />} label="בוטלה" />;
      default:
        return <Chip label={status} />;
    }
  };
  
  // פונקציה לבדיקה אם ההזמנה בוטלה
  const isCanceled = booking?.status === 'canceled';
  
  // בודק אם ההזמנה כבר עברה (צ'ק-אין בעבר)
  const isPastBooking = booking && new Date(booking.checkIn) < new Date();
  
  if (loading) {
    return (
      <Layout>
        <Container sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>טוען את פרטי ההזמנה...</Typography>
        </Container>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <Container sx={{ py: 8 }}>
          <Alert severity="error">{error}</Alert>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button variant="contained" onClick={() => navigate('/')}>
              חזרה לדף הבית
            </Button>
          </Box>
        </Container>
      </Layout>
    );
  }
  
  if (!booking || !room) {
    return (
      <Layout>
        <Container sx={{ py: 8 }}>
          <Alert severity="warning">לא נמצאו פרטי הזמנה</Alert>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button variant="contained" onClick={() => navigate('/')}>
              חזרה לדף הבית
            </Button>
          </Box>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        {cancellationSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ההזמנה בוטלה בהצלחה. אישור ביטול נשלח לכתובת האימייל שלך.
          </Alert>
        )}
        
        <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant={isMobile ? "h6" : "h5"} component="h1" fontWeight="bold">
              פרטי הזמנה
            </Typography>
            {getStatusChip(booking.status)}
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            {/* פרטי חדר */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HotelIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  פרטי חדר
                </Typography>
                <Typography variant="body1">
                  <strong>מספר חדר:</strong> {room.roomNumber}
                </Typography>
                <Typography variant="body1">
                  <strong>סוג:</strong> {room.type}
                </Typography>
                <Typography variant="body1">
                  <strong>מחיר ללילה:</strong> ₪{room.price}
                </Typography>
                <Typography variant="body1">
                  <strong>מספר לילות:</strong> {booking.nights}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold', color: theme.palette.primary.main }}>
                  <strong>סה"כ לתשלום:</strong> ₪{booking.totalPrice}
                </Typography>
              </Paper>
            </Grid>
            
            {/* פרטי תאריכים */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EventIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  תאריכי שהייה
                </Typography>
                <Typography variant="body1">
                  <strong>צ'ק-אין:</strong> {formatDate(booking.checkIn)}
                </Typography>
                <Typography variant="body1">
                  <strong>צ'ק-אאוט:</strong> {formatDate(booking.checkOut)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  <strong>צ'ק-אין:</strong> בין השעות 15:00-22:00
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>צ'ק-אאוט:</strong> עד השעה 11:00
                </Typography>
              </Paper>
            </Grid>
            
            {/* פרטי אורח */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  פרטי אורח
                </Typography>
                <Typography variant="body1">
                  <strong>שם:</strong> {booking.guest.name}
                </Typography>
                <Typography variant="body1">
                  <strong>טלפון:</strong> {booking.guest.phone}
                </Typography>
                <Typography variant="body1">
                  <strong>אימייל:</strong> {booking.guest.email}
                </Typography>
              </Paper>
            </Grid>
            
            {/* פרטי תשלום */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PaymentIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  פרטי תשלום
                </Typography>
                <Typography variant="body1">
                  <strong>אמצעי תשלום:</strong> {booking.paymentMethod === 'credit' ? 'כרטיס אשראי' : booking.paymentMethod}
                </Typography>
                <Typography variant="body1">
                  <strong>סטטוס תשלום:</strong> {
                    booking.paymentStatus === 'paid' ? 'שולם' : 
                    booking.paymentStatus === 'partial' ? 'תשלום חלקי' : 'טרם שולם'
                  }
                </Typography>
                {isCanceled && booking.cancellationDetails && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
                    <Typography variant="body2" color="error">
                      <strong>ההזמנה בוטלה:</strong> {formatDate(booking.cancellationDetails.canceledAt || new Date())}
                    </Typography>
                    {booking.cancellationDetails.refundAmount > 0 && (
                      <Typography variant="body2">
                        <strong>סכום לזיכוי:</strong> ₪{booking.cancellationDetails.refundAmount}
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          {/* מדיניות ביטול */}
          <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <InfoIcon sx={{ mr: 1, color: theme.palette.info.main }} />
              מדיניות ביטול
            </Typography>
            <Typography variant="body2" paragraph>
              • ביטול עד 3 ימים לפני מועד ההגעה - ללא עלות
            </Typography>
            <Typography variant="body2" paragraph>
              • ביטול מ-3 ימים לפני מועד ההגעה ועד למועד ההגעה - חיוב מלא (100%)
            </Typography>
            
            {cancellationDetails && !isCanceled && !isPastBooking && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                backgroundColor: cancellationDetails.canCancelForFree ? 'rgba(76, 175, 80, 0.08)' : 'rgba(239, 83, 80, 0.08)',
                borderRadius: 1
              }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  פרטי ביטול להזמנה זו:
                </Typography>
                <Typography variant="body2">
                  • נותרו {cancellationDetails.daysUntilArrival} ימים עד למועד ההגעה
                </Typography>
                {cancellationDetails.canCancelForFree ? (
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    • ניתן לבטל ללא עלות עד לתאריך {formatDate(cancellationDetails.freeCancellationDate)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="error.main" fontWeight="bold">
                    • ביטול כעת יגרור חיוב של ₪{cancellationDetails.cancellationFee} (100% מהסכום)
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
          
          {/* כפתורי פעולה */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/')}
            >
              חזרה לדף הבית
            </Button>
            
            {!isCanceled && !isPastBooking && (
              <Button 
                variant="contained" 
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setOpenCancelDialog(true)}
              >
                ביטול הזמנה
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
      
      {/* דיאלוג אישור ביטול */}
      <Dialog open={openCancelDialog} onClose={() => !cancellationLoading && setOpenCancelDialog(false)}>
        <DialogTitle>
          אישור ביטול הזמנה
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם אתה בטוח שברצונך לבטל את ההזמנה?
          </DialogContentText>
          
          {cancellationDetails && (
            <>
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                backgroundColor: cancellationDetails.canCancelForFree ? 'rgba(76, 175, 80, 0.08)' : 'rgba(239, 83, 80, 0.08)',
                borderRadius: 1
              }}>
                {cancellationDetails.canCancelForFree ? (
                  <Typography variant="body2" fontWeight="bold">
                    ביטול ההזמנה לא יגרור חיוב כספי
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body2" fontWeight="bold" color="error">
                      שים לב: הביטול יגרור חיוב של ₪{cancellationDetails.cancellationFee}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      זאת בהתאם למדיניות הביטול שלנו, מאחר ונותרו פחות מ-3 ימים עד למועד ההגעה.
                    </Typography>
                  </>
                )}
              </Box>
              
              {cancellationError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {cancellationError}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)} disabled={cancellationLoading}>
            חזרה
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={cancelBooking} 
            disabled={cancellationLoading}
            startIcon={cancellationLoading ? <CircularProgress size={20} /> : null}
          >
            {cancellationLoading ? 'מבטל...' : 'אישור ביטול'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default ManageBookingPage;
