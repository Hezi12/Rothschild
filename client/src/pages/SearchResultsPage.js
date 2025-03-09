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
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
  IconButton
} from '@mui/material';
import { 
  Check as CheckIcon,
  EventAvailable as CalendarIcon,
  ArrowBack as BackIcon,
  KingBed as KingBedIcon,
  Person as PersonIcon,
  Square as SquareIcon,
  Wifi as WifiIcon,
  AcUnit as AcIcon,
  LocalParking as ParkingIcon,
  Info as InfoIcon,
  Hotel as HotelIcon
} from '@mui/icons-material';

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [roomsList, setRoomsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
        
        // שליחת בקשה לבדיקת זמינות אמיתית מול השרת
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/rooms/check-availability`, {
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          guests: guests,
          rooms: roomsCount
        });
        
        // עדכון רשימת החדרים הזמינים
        setRoomsList(response.data.data || []);
      } catch (error) {
        console.error('שגיאה בטעינת חדרים זמינים:', error);
        setError('שגיאה בטעינת החדרים הזמינים. אנא נסה שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailableRooms();
  }, [checkIn, checkOut, guests, roomsCount, navigate]);
  
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

  // פונקציה עזר להצגת אייקון מתאים לכל אמנטי
  const getAmenityIcon = (amenity) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
      case 'אינטרנט אלחוטי':
        return <WifiIcon fontSize="small" />;
      case 'חניה':
      case 'parking':
        return <ParkingIcon fontSize="small" />;
      case 'מיזוג אוויר':
      case 'air condition':
        return <AcIcon fontSize="small" />;
      default:
        return <SquareIcon fontSize="small" />;
    }
  };
  
  return (
    <Box sx={{ 
      py: 3,
      px: { xs: 2, sm: 2, md: 3 },
      maxWidth: '1300px',
      mx: 'auto'
    }}>
      <Typography 
        variant="h5" 
        component="h1" 
        align="center" 
        gutterBottom
        sx={{ 
          fontWeight: 'bold',
          position: 'relative',
          display: 'inline-block',
          mb: 3,
          mx: 'auto',
          width: '100%',
          color: theme.palette.primary.dark
        }}
      >
        חדרים זמינים
      </Typography>
      
      {/* פרטי החיפוש */}
      <Paper 
        elevation={1}
        sx={{ 
          p: { xs: 2, sm: 2.5 }, 
          mb: 3, 
          maxWidth: '850px', 
          mx: 'auto',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarIcon color="primary" sx={{ mr: 1, fontSize: '1.1rem' }} />
              <Typography variant="subtitle1" fontWeight="medium" fontSize="0.95rem">
                תאריכי שהייה:
              </Typography>
            </Box>
            <Box sx={{ 
              pl: 3.5,
              ml: 0.5
            }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                <b>צ'ק אין:</b> {formatDate(checkIn)}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                <b>צ'ק אאוט:</b> {formatDate(checkOut)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ 
              textAlign: { xs: 'left', sm: 'right' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'flex-start', sm: 'flex-end' }
            }}>
              <Typography variant="subtitle1" fontWeight="medium" fontSize="0.95rem" sx={{ mb: 1 }}>
                <b>{calculateNights()}</b> לילות
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.2, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem' }}>
                <PersonIcon fontSize="small" color="primary" sx={{ fontSize: '1rem' }} />
                {guests} {guests === 1 ? 'אורח' : 'אורחים'} 
                {roomsCount > 1 && <> • {roomsCount} חדרים</>}
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<BackIcon fontSize="small" />}
                onClick={() => navigate('/')}
                sx={{ 
                  borderRadius: '50px',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                שנה חיפוש
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} thickness={4} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{ 
            maxWidth: '850px', 
            mx: 'auto', 
            mb: 3,
            borderRadius: 1,
            py: 1
          }}
        >
          {error}
        </Alert>
      ) : roomsList.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ 
            maxWidth: '850px', 
            mx: 'auto',
            borderRadius: 1,
            py: 1
          }}
        >
          אין חדרים זמינים בתאריכים שנבחרו. אנא בחר תאריכים אחרים.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {roomsList.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room._id}>
              <Card 
                elevation={2} 
                sx={{ 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                  }
                }}
              >
                {room.images && room.images.length > 0 ? (
                  <CardMedia
                    component="img"
                    height={200}
                    image={room.images[0].url}
                    alt={`תמונה של ${room.name}`}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box sx={{ 
                    height: 200, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'grey.100'
                  }}>
                    <HotelIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                  </Box>
                )}
                
                <CardContent sx={{ flexGrow: 1, pb: 0 }}>
                  <Typography 
                    variant="h6" 
                    component="h2" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      borderBottom: `2px solid ${theme.palette.primary.main}`,
                      pb: 1,
                      display: 'inline-block'
                    }}
                  >
                    {room.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {room.amenities && room.amenities.slice(0, 4).map((amenity, index) => (
                      <Chip
                        key={index}
                        icon={getAmenityIcon(amenity)}
                        label={amenity}
                        size="small"
                        sx={{ 
                          fontSize: '0.75rem', 
                          height: '24px',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    ))}
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      overflow: 'hidden',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                      minHeight: '3.6em'
                    }}
                  >
                    {room.description}
                  </Typography>
                  
                  {/* מדיניות ביטול בקצרה */}
                  <Box sx={{ 
                    mb: 2, 
                    p: 1, 
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                    borderRadius: 1,
                    border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        fontSize: '0.75rem',
                        color: theme.palette.info.dark
                      }}
                    >
                      <InfoIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                      <b>מדיניות ביטול:</b> ביטול חינם עד 3 ימים לפני ההגעה
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={1} alignItems="center" sx={{ mt: 'auto' }}>
                    <Grid item xs={6}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: '0.8rem' }}
                      >
                        מחיר ללילה:
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: theme.palette.primary.main 
                        }}
                      >
                        ₪{room.basePrice}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleBookRoom(room._id)}
                          sx={{ 
                            borderRadius: '50px',
                            px: 2,
                            fontWeight: 'bold',
                            boxShadow: 2
                          }}
                        >
                          הזמן עכשיו
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SearchResultsPage; 