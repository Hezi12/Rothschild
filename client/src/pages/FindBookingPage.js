import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FindBookingPage = () => {
  const [bookingId, setBookingId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // בדיקה בסיסית של הקלט
    if (!bookingId || !email) {
      setError('אנא הזן גם מספר הזמנה וגם כתובת אימייל');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // בדיקה אם ההזמנה קיימת
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings/validate`, {
        params: {
          bookingId,
          email
        }
      });

      if (response.data.valid) {
        // אם ההזמנה קיימת, נווט לדף הניהול
        navigate(`/manage-booking/${bookingId}`);
      } else {
        setError('לא נמצאה הזמנה התואמת לפרטים שהוזנו');
      }
    } catch (err) {
      console.error('שגיאה בחיפוש הזמנה:', err);
      setError('אירעה שגיאה בחיפוש ההזמנה. אנא נסה שנית מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          חיפוש הזמנה
        </Typography>
        
        <Typography variant="body1" paragraph align="center">
          יש לך מספר הזמנה? הזן את מספר ההזמנה והאימייל שלך כדי לצפות בפרטי ההזמנה שלך
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="מספר הזמנה"
            variant="outlined"
            fullWidth
            margin="normal"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            required
            inputProps={{ dir: 'ltr' }}
          />
          
          <TextField
            label="כתובת אימייל"
            variant="outlined"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            inputProps={{ dir: 'ltr' }}
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            size="large"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'חיפוש הזמנה'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default FindBookingPage; 