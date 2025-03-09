import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';

const CancellationRequestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [cancellationStatus, setCancellationStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  
  useEffect(() => {
    // הדפסת דיבוג
    console.log("דף ביטול נטען עם ID:", id);
    
    const fetchBookingDetails = async () => {
      try {
        console.log("מנסה לבצע בקשת API עם ID:", id);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/cancel-request/${id}`);
        console.log("תשובה מהשרת:", response.data);
        
        if (response.data.success) {
          setBooking(response.data.data.booking);
          setCancellationStatus(response.data.data.cancellationStatus);
        } else {
          setError('לא ניתן למצוא את פרטי ההזמנה');
        }
      } catch (err) {
        console.error('שגיאה בטעינת פרטי ההזמנה:', err.response?.data || err.message);
        setError('חלה שגיאה בטעינת פרטי ההזמנה');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [id]);
  
  const handleCancellationRequest = async () => {
    setOpenDialog(false);
    setSubmitting(true);
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/bookings/cancel-request/${id}`);
      
      if (response.data.success) {
        setSuccess(true);
      } else {
        setError('חלה שגיאה בשליחת בקשת הביטול');
      }
    } catch (err) {
      console.error('שגיאה בשליחת בקשת ביטול:', err);
      setError('חלה שגיאה בשליחת בקשת הביטול');
    } finally {
      setSubmitting(false);
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('he-IL', options);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Alert severity="error">
          <AlertTitle>שגיאה</AlertTitle>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/')}
        >
          חזרה לדף הבית
        </Button>
      </Box>
    );
  }
  
  if (success) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>בקשת הביטול התקבלה בהצלחה!</AlertTitle>
            {cancellationStatus?.isFree 
              ? 'ההזמנה בוטלה ללא עלות'
              : 'ההזמנה בוטלה בתשלום דמי ביטול'}
          </Alert>
          
          <Typography variant="h5" gutterBottom>
            פרטי הביטול
          </Typography>
          
          <Box sx={{ textAlign: 'right', p: 2, bgcolor: cancellationStatus?.isFree ? '#e8f5e9' : '#ffebee', borderRadius: 1, mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>מספר הזמנה:</strong> {booking?.bookingNumber}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>תאריך ביטול:</strong> {new Date().toLocaleDateString('he-IL')}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>סטטוס:</strong> {cancellationStatus?.isFree ? 'ביטול ללא עלות' : 'ביטול בחיוב מלא'}
            </Typography>
            {!cancellationStatus?.isFree && (
              <Typography variant="body1" gutterBottom>
                <strong>עלות ביטול:</strong> ₪{cancellationStatus?.fee.toFixed(2)}
              </Typography>
            )}
          </Box>
          
          <Typography variant="body1" paragraph>
            בקשת הביטול שלך התקבלה והועברה לטיפול.
            {cancellationStatus?.isFree 
              ? ' הביטול אושר ללא עלות כיוון שבוצע מעל 3 ימים לפני ההגעה.' 
              : ' הביטול אושר בעלות מלאה כיוון שבוצע פחות מ-3 ימים לפני ההגעה.'}
          </Typography>
          
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            חזרה לדף הבית
          </Button>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          ביטול הזמנה
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          פרטי ההזמנה
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>מספר הזמנה:</strong> {booking?.bookingNumber}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>שם אורח:</strong> {booking?.guest?.name}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>תאריך הגעה:</strong> {formatDate(booking?.checkIn)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>תאריך יציאה:</strong> {formatDate(booking?.checkOut)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>מספר לילות:</strong> {booking?.nights}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>סכום הזמנה:</strong> ₪{booking?.totalPrice?.toFixed(2)}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          מדיניות ביטול
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            • ביטול מעל 3 ימים לפני מועד ההגעה - ללא עלות
          </Typography>
          <Typography variant="body1" paragraph>
            • ביטול פחות מ-3 ימים לפני מועד ההגעה - חיוב מלא
          </Typography>
        </Box>
        
        <Alert 
          severity={cancellationStatus?.isFree ? "info" : "warning"}
          sx={{ mb: 3 }}
        >
          <AlertTitle>
            {cancellationStatus?.isFree 
              ? 'ניתן לבטל ללא עלות' 
              : 'ביטול כרוך בעלות מלאה'}
          </AlertTitle>
          <Typography variant="body2">
            {cancellationStatus?.isFree 
              ? `נותרו ${cancellationStatus?.daysUntilCheckIn} ימים עד למועד ההגעה, ניתן לבטל ללא עלות.` 
              : `נותרו ${cancellationStatus?.daysUntilCheckIn} ימים עד למועד ההגעה, ביטול כרוך בתשלום מלא של ₪${cancellationStatus?.fee?.toFixed(2)}.`}
          </Typography>
        </Alert>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/')}
          >
            חזרה לדף הבית
          </Button>
          
          <Button 
            variant="contained" 
            color="error"
            onClick={() => setOpenDialog(true)}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'בטל הזמנה'}
          </Button>
        </Box>
      </Paper>
      
      {/* דיאלוג לאישור הביטול */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>
          אישור ביטול הזמנה
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם את/ה בטוח/ה שברצונך לבטל את ההזמנה?
            {cancellationStatus?.isFree 
              ? ' הביטול יתבצע ללא עלות.' 
              : ` הביטול כרוך בעלות של ₪${cancellationStatus?.fee?.toFixed(2)}.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>ביטול</Button>
          <Button 
            onClick={handleCancellationRequest} 
            color="error" 
            autoFocus
          >
            כן, בטל הזמנה
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CancellationRequestPage; 