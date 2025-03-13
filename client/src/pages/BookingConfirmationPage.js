import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Paper, Button, CircularProgress, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import PrintIcon from '@mui/icons-material/Print';

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingInfo, setBookingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // קבלת מידע על ההזמנה מהקודם
  useEffect(() => {
    if (location.state?.booking) {
      setBookingInfo(location.state.booking);
      setLoading(false);
    } else {
      // אם אין מידע, חזור לדף הבית
      navigate('/');
    }
  }, [location, navigate]);
  
  // פונקציה לפורמט תאריך
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  // רנדור רשימת החדרים
  const renderRoomsList = () => {
    if (!bookingInfo) return null;
    
    // בדיקה אם יש מספר חדרים או חדר יחיד
    const hasMultipleRooms = bookingInfo.rooms && Array.isArray(bookingInfo.rooms) && bookingInfo.rooms.length > 0;
    const roomDetails = location.state?.roomDetails || [];
    
    if (hasMultipleRooms) {
      return (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            חדרים שהוזמנו:
          </Typography>
          {roomDetails.map((room, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {room.name || room.type || `חדר ${index + 1}`}
                {room.roomNumber && ` (חדר ${room.roomNumber})`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                מחיר לילה: ₪{room.basePrice}
              </Typography>
            </Paper>
          ))}
        </Box>
      );
    } else {
      // מידע על חדר יחיד
      const roomDetail = roomDetails[0] || {};
      return (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            חדר שהוזמן:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {roomDetail.name || roomDetail.type || 'חדר'}
              {roomDetail.roomNumber && ` (חדר ${roomDetail.roomNumber})`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              מחיר לילה: ₪{roomDetail.basePrice}
            </Typography>
          </Paper>
        </Box>
      );
    }
  };
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : bookingInfo ? (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mb: 4
          }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              ההזמנה התקבלה בהצלחה!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" align="center">
              פרטי ההזמנה נשלחו לכתובת האימייל שלך.
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              פרטי הזמנה:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <b>מספר הזמנה:</b> {bookingInfo.bookingNumber || bookingInfo._id}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <b>תאריך הזמנה:</b> {formatDate(bookingInfo.bookingDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <b>צ'ק-אין:</b> {formatDate(bookingInfo.checkIn)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <b>צ'ק-אאוט:</b> {formatDate(bookingInfo.checkOut)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          {renderRoomsList()}
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              פרטי אורח:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body1">
                {bookingInfo.guest?.firstName} {bookingInfo.guest?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <b>אימייל:</b> {bookingInfo.guest?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <b>טלפון:</b> {bookingInfo.guest?.phone}
              </Typography>
            </Paper>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              סיכום תשלום:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">מחיר בסיס:</Typography>
                <Typography variant="body1">₪{bookingInfo.basePrice?.toFixed(2) || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">
                  מע"מ ({bookingInfo.isTourist ? 'פטור' : '18%'}):
                </Typography>
                <Typography variant="body1">₪{bookingInfo.vatAmount?.toFixed(2) || 0}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" color="primary">סה"כ:</Typography>
                <Typography variant="h6" color="primary">₪{bookingInfo.totalPrice?.toFixed(2) || 0}</Typography>
              </Box>
            </Paper>
          </Box>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{ mr: 2 }}
            >
              חזרה לדף הבית
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              הדפסת אישור
            </Button>
          </Box>
        </Paper>
      ) : (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" gutterBottom>
            לא נמצאו פרטי הזמנה
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            חזרה לדף הבית
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default BookingConfirmationPage; 