import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions, 
  Button, 
  Chip, 
  Divider, 
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Check as CheckIcon,
  EventAvailable as CalendarIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [roomsList, setRoomsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // קבלת הנתונים מהמצב של הניווט
  const checkIn = location.state?.checkIn;
  const checkOut = location.state?.checkOut;
  const guests = location.state?.guests || 1;
  const roomsCount = location.state?.rooms || 1;
  
  useEffect(() => {
    // אם אין תאריכים, חזור לדף הבית
    if (!checkIn || !checkOut) {
      navigate('/');
      return;
    }
    
    const fetchAvailableRooms = async () => {
      try {
        setLoading(true);
        
        // במציאות היינו בודקים מול השרת אילו חדרים זמינים בתאריכים שנבחרו
        // לצורך הדוגמה, נשתמש בכל החדרים הקיימים
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
        
        // נסמן את כל החדרים כזמינים בתאריכים הנבחרים
        // במציאות זה יגיע מהשרת
        const availableRooms = response.data.data.map(room => ({
          ...room,
          isAvailable: true
        }));
        
        setRoomsList(availableRooms);
      } catch (error) {
        console.error('שגיאה בטעינת חדרים זמינים:', error);
        setError('שגיאה בטעינת החדרים הזמינים. אנא נסה שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailableRooms();
  }, [checkIn, checkOut, navigate]);
  
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('he-IL');
  };
  
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  };
  
  const handleBookRoom = (roomId) => {
    navigate('/booking', { 
      state: { 
        roomId,
        checkIn,
        checkOut,
        guests,
        rooms: roomsCount
      } 
    });
  };
  
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        חדרים זמינים
      </Typography>
      
      {/* פרטי החיפוש */}
      <Paper sx={{ p: 3, mb: 4, maxWidth: '800px', mx: 'auto' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                <strong>תאריכי שהייה:</strong>
              </Typography>
            </Box>
            <Typography>
              צ'ק אין: {formatDate(checkIn)}
            </Typography>
            <Typography>
              צ'ק אאוט: {formatDate(checkOut)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="body1">
                <strong>משך שהייה:</strong> {calculateNights()} לילות
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {guests} {guests === 1 ? 'אורח' : 'אורחים'} • 
                {roomsCount} {roomsCount === 1 ? 'חדר' : 'חדרים'} 
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<BackIcon />}
                onClick={() => navigate('/')}
                sx={{ mt: 1 }}
              >
                שנה חיפוש
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
          {error}
        </Alert>
      ) : roomsList.length === 0 ? (
        <Alert severity="info" sx={{ maxWidth: '800px', mx: 'auto' }}>
          אין חדרים זמינים בתאריכים שנבחרו. אנא בחר תאריכים אחרים.
        </Alert>
      ) : (
        <Grid container spacing={4} sx={{ px: 2 }}>
          {roomsList.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={room.images.find(img => img.isPrimary)?.url || room.images[0]?.url || 'https://via.placeholder.com/400x200?text=אין+תמונה'}
                  alt={`חדר ${room.roomNumber}`}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div">
                    חדר {room.roomNumber}
                    {room.type !== 'standard' && ` - ${room.type}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {room.description.substring(0, 100)}...
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" color="primary" fontWeight="bold">
                      {room.basePrice} ₪ / לילה
                    </Typography>
                    <Chip 
                      icon={<CheckIcon />} 
                      label="זמין" 
                      color="success" 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {room.amenities.slice(0, 3).map((amenity, index) => (
                      <Chip key={index} label={amenity} size="small" />
                    ))}
                    {room.amenities.length > 3 && (
                      <Chip label={`+${room.amenities.length - 3}`} size="small" variant="outlined" />
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    fullWidth 
                    variant="outlined"
                    onClick={() => navigate(`/room/${room._id}`, {
                      state: { backToSearch: true, checkIn, checkOut }
                    })}
                  >
                    פרטים נוספים
                  </Button>
                  <Button 
                    fullWidth 
                    variant="contained"
                    onClick={() => handleBookRoom(room._id)}
                  >
                    בחר חדר
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SearchResultsPage; 