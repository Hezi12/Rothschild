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
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {roomsList.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room._id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 3px 10px rgba(0,0,0,0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 6px 15px rgba(0,0,0,0.08)'
                }
              }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={room.images[0]?.url || room.images[0] || 'https://via.placeholder.com/400x200?text=אין+תמונה'}
                    alt={`חדר ${room.name || room.roomNumber}`}
                    sx={{
                      transition: 'transform 0.5s ease',
                      '&:hover': {
                        transform: 'scale(1.03)'
                      }
                    }}
                  />
                  <Chip 
                    icon={<CheckIcon />} 
                    label="זמין" 
                    color="success" 
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      color: theme.palette.success.main,
                      fontSize: '0.7rem',
                      height: '24px',
                      '& .MuiChip-icon': {
                        color: theme.palette.success.main,
                        fontSize: '0.9rem'
                      }
                    }}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
                  <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1rem', mb: 1 }}>
                    {room.name || `חדר ${room.roomNumber}`}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <KingBedIcon fontSize="small" color="action" sx={{ fontSize: '1rem' }} />
                      <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                        {room.maxGuests} אורחים
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SquareIcon fontSize="small" color="action" sx={{ fontSize: '1rem' }} />
                      <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                        {room.size || 20} מ"ר
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.4, fontSize: '0.8rem' }}>
                    {room.description ? room.description.substring(0, 80) + (room.description.length > 80 ? '...' : '') : 'חדר נעים ומאובזר עם כל הצרכים לשהייה מושלמת.'}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" color="primary.dark" fontWeight="bold">
                      {room.basePrice} ₪ <Typography component="span" variant="body2" color="text.secondary" fontSize="0.75rem">/ לילה</Typography>
                    </Typography>
                    <Typography variant="body1" color="primary" fontWeight="medium">
                      {room.basePrice * calculateNights()} ₪ 
                      <Typography component="span" variant="body2" color="text.secondary" fontSize="0.75rem"> סה"כ</Typography>
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {room.amenities && room.amenities.slice(0, 3).map((amenity, index) => (
                      <Chip 
                        key={index} 
                        icon={getAmenityIcon(amenity)} 
                        label={amenity} 
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.light, 0.08),
                          color: theme.palette.text.secondary,
                          fontSize: '0.7rem',
                          height: '22px',
                          '& .MuiChip-icon': {
                            color: alpha(theme.palette.primary.main, 0.7),
                            fontSize: '0.8rem'
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
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                          fontSize: '0.7rem',
                          height: '22px'
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={5}>
                      <Button 
                        fullWidth 
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/room/${room._id}`, {
                          state: { backToSearch: true, checkIn, checkOut }
                        })}
                        sx={{
                          borderRadius: 1.5,
                          py: 0.5,
                          fontSize: '0.8rem',
                          borderWidth: '1px',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderWidth: '1px',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 3px 8px rgba(0,0,0,0.05)'
                          }
                        }}
                        startIcon={<InfoIcon style={{ fontSize: '1rem' }} />}
                      >
                        פרטים
                      </Button>
                    </Grid>
                    <Grid item xs={7}>
                      <Button 
                        fullWidth 
                        variant="contained"
                        size="small"
                        onClick={() => handleBookRoom(room._id)}
                        sx={{
                          borderRadius: 1.5,
                          py: 0.5,
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          backgroundColor: theme.palette.primary.main,
                          transition: 'all 0.3s ease',
                          boxShadow: '0 3px 8px rgba(25, 118, 210, 0.2)',
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)'
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