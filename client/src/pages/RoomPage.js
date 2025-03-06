import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  Divider,
  Card,
  CardMedia,
  CardContent,
  Chip,
  CircularProgress,
  MobileStepper
} from '@mui/material';
import { 
  KeyboardArrowLeft, 
  KeyboardArrowRight,
  Hotel as HotelIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

const RoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms/${id}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        const roomData = response.data.data;
        
        // סידור התמונות כך שהתמונה הראשית תהיה ראשונה
        if (roomData.images && roomData.images.length > 0) {
          // מציאת התמונה הראשית
          const primaryIndex = roomData.images.findIndex(img => img.isPrimary);
          
          // אם יש תמונה ראשית והיא לא במקום הראשון
          if (primaryIndex > 0) {
            // יצירת עותק של מערך התמונות
            const sortedImages = [...roomData.images];
            // הוצאת התמונה הראשית
            const primaryImage = sortedImages.splice(primaryIndex, 1)[0];
            // הוספת התמונה הראשית בתחילת המערך
            sortedImages.unshift(primaryImage);
            
            // עדכון נתוני החדר עם התמונות המסודרות
            roomData.images = sortedImages;
          }
        }
        
        setRoom(roomData);
      } catch (error) {
        console.error('שגיאה בטעינת החדר:', error);
        setError('לא ניתן לטעון את פרטי החדר. אנא נסה שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !room) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          {error || 'החדר לא נמצא'}
        </Typography>
        <Button 
          variant="contained" 
          component={Link} 
          to="/"
          sx={{ mt: 2 }}
        >
          חזרה לדף הבית
        </Button>
      </Box>
    );
  }

  const maxSteps = room.images.length;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        חדר {room.roomNumber} - {room.type === 'standard' ? 'סטנדרט' : room.type}
      </Typography>

      {/* גלריית תמונות */}
      <Card sx={{ mb: 4 }}>
        <CardMedia
          component="img"
          height="400"
          image={room.images[activeStep]?.url || 'https://via.placeholder.com/800x400?text=אין+תמונה'}
          alt={`חדר ${room.roomNumber}`}
        />
        {maxSteps > 1 && (
          <MobileStepper
            steps={maxSteps}
            position="static"
            activeStep={activeStep}
            nextButton={
              <Button
                size="small"
                onClick={handleNext}
                disabled={activeStep === maxSteps - 1}
              >
                הבא
                <KeyboardArrowLeft />
              </Button>
            }
            backButton={
              <Button 
                size="small" 
                onClick={handleBack} 
                disabled={activeStep === 0}
              >
                <KeyboardArrowRight />
                הקודם
              </Button>
            }
          />
        )}
      </Card>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* פרטי החדר */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              <HotelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              פרטי החדר
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body1" paragraph>
              {room.description}
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white', textAlign: 'center' }}>
                  <MoneyIcon />
                  <Typography variant="h6">{room.basePrice} ₪</Typography>
                  <Typography variant="body2">מחיר ללילה</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'white', textAlign: 'center' }}>
                  <PersonIcon />
                  <Typography variant="h6">{room.maxOccupancy}</Typography>
                  <Typography variant="body2">תפוסה מקסימלית</Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" gutterBottom>
              <strong>שירותים בחדר:</strong>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {room.amenities.map((amenity, index) => (
                <Chip key={index} label={amenity} />
              ))}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* כרטיס הזמנה */}
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h5" gutterBottom align="center">
              הזמן עכשיו
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body1" paragraph align="center">
              מחיר: <strong>{room.basePrice} ₪</strong> ללילה
            </Typography>
            <Typography variant="body2" paragraph align="center" color="text.secondary">
              * המחיר אינו כולל מע"מ (17%)
            </Typography>
            
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => navigate('/booking', { state: { roomId: room._id } })}
              sx={{ mt: 2 }}
            >
              המשך להזמנה
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RoomPage; 