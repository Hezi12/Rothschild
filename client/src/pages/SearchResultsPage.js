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
  Info as InfoIcon
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
      py: 4,
      px: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto',
      backgroundColor: alpha(theme.palette.background.default, 0.7)
    }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        component="h1" 
        align="center" 
        gutterBottom
        sx={{ 
          fontWeight: 'bold',
          position: 'relative',
          display: 'inline-block',
          mb: 4,
          mx: 'auto',
          width: '100%',
          color: theme.palette.primary.dark,
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '80px',
            height: '3px',
            bottom: '-10px',
            left: 'calc(50% - 40px)',
            background: 'linear-gradient(90deg, #42a5f5, #1976d2)',
            borderRadius: '50px'
          }
        }}
      >
        חדרים זמינים
      </Typography>
      
      {/* פרטי החיפוש */}
      <Paper 
        elevation={2}
        sx={{ 
          p: { xs: 2.5, sm: 3.5 }, 
          mb: 5, 
          maxWidth: '900px', 
          mx: 'auto',
          borderRadius: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          background: 'linear-gradient(to bottom right, #ffffff, #f5f9ff)',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: 'linear-gradient(90deg, #42a5f5, #1976d2)',
            opacity: 0.8
          }
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <CalendarIcon color="primary" sx={{ mr: 1.5 }} />
              <Typography variant="h6" fontWeight="medium" fontSize="1.1rem">
                תאריכי שהייה:
              </Typography>
            </Box>
            <Box sx={{ 
              pl: 4,
              borderLeft: `3px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              ml: 0.5
            }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <b>צ'ק אין:</b> {formatDate(checkIn)}
              </Typography>
              <Typography variant="body1">
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
              <Typography variant="h6" fontWeight="medium" fontSize="1.1rem" sx={{ mb: 1.5 }}>
                <b>{calculateNights()}</b> לילות
              </Typography>
              <Typography variant="body1" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <PersonIcon fontSize="small" color="primary" />
                {guests} {guests === 1 ? 'אורח' : 'אורחים'} 
                {roomsCount > 1 && <> • {roomsCount} חדרים</>}
              </Typography>
              <Button 
                variant="outlined" 
                size="medium" 
                startIcon={<BackIcon />}
                onClick={() => navigate('/')}
                sx={{ 
                  borderRadius: '50px',
                  px: 2.5,
                  py: 0.8,
                  borderWidth: '1.5px',
                  fontWeight: 'medium',
                  '&:hover': {
                    borderWidth: '1.5px',
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                שנה חיפוש
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={50} thickness={4} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{ 
            maxWidth: '900px', 
            mx: 'auto', 
            mb: 4,
            borderRadius: 2,
            py: 1.5
          }}
        >
          {error}
        </Alert>
      ) : roomsList.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ 
            maxWidth: '900px', 
            mx: 'auto',
            borderRadius: 2,
            py: 1.5
          }}
        >
          אין חדרים זמינים בתאריכים שנבחרו. אנא בחר תאריכים אחרים.
        </Alert>
      ) : (
        <Grid container spacing={4} sx={{ mt: 1 }}>
          {roomsList.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room._id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 15px 30px rgba(0,0,0,0.12)'
                }
              }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="220"
                    image={room.images[0] || 'https://via.placeholder.com/400x200?text=אין+תמונה'}
                    alt={`חדר ${room.name}`}
                    sx={{
                      transition: 'transform 0.7s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                  <Chip 
                    icon={<CheckIcon />} 
                    label="זמין לתאריכים שבחרת" 
                    color="success" 
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: theme.palette.success.main,
                      fontWeight: 'medium',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '& .MuiChip-icon': {
                        color: theme.palette.success.main
                      }
                    }}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                    {room.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <KingBedIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {room.maxGuests} אורחים
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SquareIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {room.size || 20} מ"ר
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                    {room.description ? room.description.substring(0, 90) + (room.description.length > 90 ? '...' : '') : 'חדר נעים ומאובזר עם כל הצרכים לשהייה מושלמת.'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="h6" color="primary.dark" fontWeight="bold">
                      {room.basePrice} ₪ <Typography component="span" variant="body2" color="text.secondary">/ לילה</Typography>
                    </Typography>
                    <Typography variant="h6" color="primary" fontWeight="medium">
                      {room.basePrice * calculateNights()} ₪ 
                      <Typography component="span" variant="body2" color="text.secondary"> סה"כ</Typography>
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5 }}>
                    {room.amenities && room.amenities.slice(0, 3).map((amenity, index) => (
                      <Chip 
                        key={index} 
                        icon={getAmenityIcon(amenity)} 
                        label={amenity} 
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.light, 0.1),
                          color: theme.palette.primary.dark,
                          fontWeight: 'medium',
                          '& .MuiChip-icon': {
                            color: alpha(theme.palette.primary.main, 0.9)
                          }
                        }}
                      />
                    ))}
                    {room.amenities && room.amenities.length > 3 && (
                      <Chip 
                        label={`+${room.amenities.length - 3}`} 
                        size="small" 
                        variant="outlined"
                        sx={{
                          borderColor: alpha(theme.palette.primary.main, 0.3)
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2.5, pt: 0.5 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={5}>
                      <Button 
                        fullWidth 
                        variant="outlined"
                        size="large"
                        onClick={() => navigate(`/room/${room._id}`, {
                          state: { backToSearch: true, checkIn, checkOut }
                        })}
                        sx={{
                          borderRadius: 2,
                          py: 1,
                          borderWidth: '1.5px',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderWidth: '1.5px',
                            transform: 'translateY(-3px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.07)'
                          }
                        }}
                        startIcon={<InfoIcon />}
                      >
                        פרטים
                      </Button>
                    </Grid>
                    <Grid item xs={7}>
                      <Button 
                        fullWidth 
                        variant="contained"
                        size="large"
                        onClick={() => handleBookRoom(room._id)}
                        sx={{
                          borderRadius: 2,
                          py: 1,
                          fontWeight: 'bold',
                          backgroundColor: theme.palette.primary.main,
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                            transform: 'translateY(-3px)',
                            boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)'
                          }
                        }}
                      >
                        הזמן עכשיו
                      </Button>
                    </Grid>
                  </Grid>
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