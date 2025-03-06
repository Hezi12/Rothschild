import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  Grid,
  Paper,
  Container,
  Divider
} from '@mui/material';
import { 
  Hotel as HotelIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';

const HomePage = () => {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        // קבלת חדר 6 (החדר הסטנדרטי)
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
        const rooms = response.data.data;
        
        // מציאת חדר 6
        const standardRoom = rooms.find(room => room.roomNumber === 6);
        
        if (standardRoom) {
          setRoom(standardRoom);
        }
      } catch (error) {
        console.error('שגיאה בטעינת החדר:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, []);

  return (
    <Box>
      {/* כותרת ראשית */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          mb: 6,
          mt: 2
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          ברוכים הבאים למלונית רוטשילד 79
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          נוחות במחיר משתלם במרכז פתח תקווה
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          component={Link} 
          to="/booking"
          sx={{ mt: 2 }}
        >
          הזמן עכשיו
        </Button>
      </Box>

      {/* מידע על המלונית */}
      <Paper elevation={3} sx={{ p: 3, mb: 6 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              <HotelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              אודות המלונית
            </Typography>
            <Typography paragraph>
              מלונית רוטשילד 79 ממוקמת במרכז פתח תקווה, במרחק הליכה קצר ממרכז העיר, מסעדות, חנויות ותחבורה ציבורית.
            </Typography>
            <Typography paragraph>
              אנו מציעים חדרים נוחים ומאובזרים במחירים אטרקטיביים, מתאימים לאנשי עסקים, זוגות ומטיילים.
            </Typography>
            <Typography paragraph>
              כל חדר מצויד במיזוג אוויר, טלוויזיה, מקרר, מקלחת פרטית וחיבור Wi-Fi חינם.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              מיקום ויצירת קשר
            </Typography>
            <Typography paragraph>
              <strong>כתובת:</strong> רחוב רוטשילד 79, פתח תקווה
            </Typography>
            <Typography paragraph>
              <strong>טלפון:</strong> <PhoneIcon sx={{ fontSize: 'small', verticalAlign: 'middle' }} /> 03-1234567
            </Typography>
            <Typography paragraph>
              <strong>אימייל:</strong> diamshotels@gmail.com
            </Typography>
            <Typography paragraph>
              <strong>שעות קבלה:</strong> 24/7
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* הצגת החדר */}
      <Typography variant="h4" component="h2" gutterBottom textAlign="center">
        החדר שלנו
      </Typography>
      <Divider sx={{ mb: 4 }} />

      {loading ? (
        <Typography>טוען...</Typography>
      ) : room ? (
        <Card sx={{ maxWidth: 800, mx: 'auto' }}>
          <CardMedia
            component="img"
            height="300"
            image={room.images[0]?.url || 'https://via.placeholder.com/800x400?text=חדר+סטנדרט'}
            alt={`חדר ${room.roomNumber}`}
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              חדר {room.roomNumber} - {room.type === 'standard' ? 'סטנדרט' : room.type}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {room.description}
            </Typography>
            <Typography variant="body1">
              <strong>מחיר:</strong> {room.basePrice} ₪ ללילה
            </Typography>
            <Typography variant="body2">
              <strong>תפוסה מקסימלית:</strong> {room.maxOccupancy} אנשים
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                <strong>שירותים בחדר:</strong>
              </Typography>
              <Grid container spacing={1}>
                {room.amenities.map((amenity, index) => (
                  <Grid item key={index}>
                    <Paper sx={{ px: 1, py: 0.5 }}>
                      {amenity}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </CardContent>
          <CardActions>
            <Button 
              size="large" 
              variant="contained" 
              fullWidth
              component={Link}
              to={`/room/${room._id}`}
            >
              פרטים נוספים
            </Button>
          </CardActions>
        </Card>
      ) : (
        <Typography textAlign="center">לא נמצאו חדרים זמינים כרגע.</Typography>
      )}
    </Box>
  );
};

export default HomePage; 