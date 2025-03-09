import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField,
  Divider, 
  Alert, 
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import { format } from 'date-fns';
import he from 'date-fns/locale/he';

const CancelBookingPage = () => {
  const location = useLocation();
  const [token, setToken] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationDetails, setCancellationDetails] = useState(null);

  // מגדיר אפשרויות סיבת ביטול
  const cancelReasons = [
    'שינוי תכניות',
    'מצאתי אפשרות זולה יותר',
    'שינוי תאריכים',
    'אילוצים משפחתיים',
    'אילוצי עבודה',
    'סיבה אחרת'
  ];

  useEffect(() => {
    // מקבל את הטוקן מפרמטרי ה-URL
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      fetchBookingDetails(tokenParam);
    } else {
      setLoading(false);
      setError('לא נמצא טוקן ביטול בכתובת. אנא ודא שהקישור תקין.');
    }
  }, [location.search]);

  const fetchBookingDetails = async (tokenParam) => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/cancel`, {
        params: { token: tokenParam }
      });

      if (response.data.success) {
        setBooking(response.data.booking);
      } else {
        setError('לא ניתן למצוא את פרטי ההזמנה. אנא ודא שהקישור תקין.');
      }
    } catch (err) {
      console.error('שגיאה בטעינת פרטי ביטול:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('אירעה שגיאה בטעינת פרטי ההזמנה. אנא נסה שנית מאוחר יותר.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/cancel`, {
        token,
        reason: cancellationReason
      });

      if (response.data.success) {
        setSuccess(true);
        setCancellationDetails(response.data.cancellation);
        setOpenDialog(false);
      } else {
        setError('אירעה שגיאה בביטול ההזמנה. אנא נסה שנית מאוחר יותר.');
      }
    } catch (err) {
      console.error('שגיאה בביטול ההזמנה:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('אירעה שגיאה בביטול ההזמנה. אנא נסה שנית מאוחר יותר.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReasonChange = (event) => {
    setCancellationReason(event.target.value);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'EEEE, d בMMMM yyyy', { locale: he });
    } catch {
      return dateString;
    }
  };

  // תצוגת טעינה
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }

  // תצוגת שגיאה
  if (error) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1" paragraph>
          אם אתה צריך עזרה, אנא צור קשר עם מלונית רוטשילד 79 בטלפון 050-607-0260.
        </Typography>
      </Box>
    );
  }

  // תצוגת אישור ביטול
  if (success) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            הזמנתך בוטלה בהצלחה!
          </Alert>
          
          <Typography variant="h5" gutterBottom align="center">
            אישור ביטול הזמנה
          </Typography>
          
          <Typography variant="body1" paragraph>
            אישור ביטול נשלח לכתובת האימייל שלך.
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ my: 2 }}>
            <Typography variant="h6" gutterBottom>
              פרטי החזר
            </Typography>
            
            {cancellationDetails.isFullRefund ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                אתה זכאי להחזר מלא בסך ₪{cancellationDetails.refundAmount}.
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                בהתאם למדיניות הביטול, לא ניתן החזר כספי לביטול הזמנה זו.
              </Alert>
            )}
            
            {cancellationDetails.refundAmount > 0 && (
              <Typography variant="body2" paragraph>
                ההחזר יתבצע באמצעות אותו אמצעי תשלום שבו בוצעה ההזמנה תוך 7-14 ימי עסקים.
              </Typography>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" paragraph align="center">
            תודה שבחרת במלונית רוטשילד 79, נשמח לראותך בביקור עתידי.
          </Typography>
          
          <Button 
            variant="outlined" 
            color="primary" 
            fullWidth 
            sx={{ mt: 2 }}
            href="/"
          >
            חזרה לדף הבית
          </Button>
        </Paper>
      </Box>
    );
  }

  // תצוגת דף אישור ביטול
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom align="center">
          ביטול הזמנה
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          אנא אשר את פרטי ההזמנה לפני הביטול
        </Alert>
        
        {booking && (
          <>
            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>פרטי האורח:</strong> {booking.guest.name}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>תאריך הגעה:</strong> {formatDate(booking.checkIn)}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>תאריך יציאה:</strong> {formatDate(booking.checkOut)}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>מספר לילות:</strong> {booking.nights}
              </Typography>
              
              <Typography variant="subtitle1">
                <strong>סכום ששולם:</strong> ₪{booking.amountPaid || 0}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                פרטי החזר
              </Typography>
              
              {booking.isFullRefund ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  אתה זכאי להחזר מלא בסך ₪{booking.refundAmount}
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  בהתאם למדיניות הביטול, לא ניתן החזר כספי לביטול הזמנה זו.
                </Alert>
              )}
              
              <Typography variant="body2" paragraph>
                ביטול עד 3 ימים לפני ההגעה - ללא עלות.
                ביטול פחות מ-3 ימים לפני ההגעה - חיוב מלא (100%).
              </Typography>
            </Box>
            
            <Button 
              variant="contained" 
              color="error" 
              fullWidth 
              size="large"
              onClick={handleOpenDialog}
              sx={{ mt: 2 }}
            >
              ביטול הזמנה
            </Button>
            
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth 
              sx={{ mt: 2 }}
              href="/"
            >
              ביטול הפעולה (חזרה לדף הבית)
            </Button>
            
            <Dialog open={openDialog} onClose={handleCloseDialog}>
              <DialogTitle>
                אישור ביטול הזמנה
              </DialogTitle>
              <DialogContent>
                <DialogContentText>
                  האם אתה בטוח שברצונך לבטל את ההזמנה? פעולה זו אינה ניתנת לביטול.
                </DialogContentText>
                
                <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
                  <FormLabel component="legend">סיבת הביטול:</FormLabel>
                  <RadioGroup value={cancellationReason} onChange={handleReasonChange}>
                    {cancelReasons.map((reason) => (
                      <FormControlLabel 
                        key={reason} 
                        value={reason} 
                        control={<Radio />} 
                        label={reason} 
                      />
                    ))}
                  </RadioGroup>
                  
                  {cancellationReason === 'סיבה אחרת' && (
                    <TextField
                      margin="normal"
                      fullWidth
                      label="פרט את סיבת הביטול"
                      variant="outlined"
                      onChange={(e) => setCancellationReason(`סיבה אחרת: ${e.target.value}`)}
                    />
                  )}
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} color="primary">
                  ביטול
                </Button>
                <Button 
                  onClick={handleCancelBooking} 
                  color="error" 
                  variant="contained"
                  disabled={!cancellationReason}
                >
                  אישור ביטול
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default CancelBookingPage; 