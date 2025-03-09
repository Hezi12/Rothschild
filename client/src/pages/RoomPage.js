import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
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
  MobileStepper,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
  Container
} from '@mui/material';
import { 
  KeyboardArrowLeft, 
  KeyboardArrowRight,
  Hotel as HotelIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  ArrowBack,
  Check as CheckIcon,
  Room as RoomIcon,
  AcUnit,
  Wifi,
  Tv,
  KingBed,
  Kitchen,
  DirectionsCar,
  Bathtub,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

// מיפוי של האייקונים לפי סוג השירות
const amenityIcons = {
  'מיזוג': <AcUnit fontSize="small" />,
  'אינטרנט אלחוטי': <Wifi fontSize="small" />,
  'טלוויזיה': <Tv fontSize="small" />,
  'מקרר': <Kitchen fontSize="small" />,
  'מיטה זוגית': <KingBed fontSize="small" />,
  'חניה': <DirectionsCar fontSize="small" />,
  'מקלחת': <Bathtub fontSize="small" />
};

const RoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // קבלת נתוני החיפוש אם קיימים
  const checkIn = location.state?.checkIn;
  const checkOut = location.state?.checkOut;
  const fromSearchResults = location.state?.backToSearch || false;

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

  if (error) {
    return (
      <Box sx={{ mt: 4, px: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!room) {
    return (
      <Box sx={{ mt: 4, px: 2 }}>
        <Alert severity="warning">החדר המבוקש לא נמצא.</Alert>
      </Box>
    );
  }

  // בדיקה אם יש תמונות לחדר
  const hasImages = room.images && room.images.length > 0;
  const maxSteps = hasImages ? room.images.length : 0;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      {/* חזרה לתוצאות החיפוש או לדף הבית */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => {
            if (fromSearchResults) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          sx={{ mb: 1 }}
          size={isMobile ? "small" : "medium"}
        >
          {fromSearchResults ? 'חזרה לתוצאות החיפוש' : 'חזרה לדף הבית'}
        </Button>
      </Box>

      {/* כרטיס מידע על החדר */}
      <Grid container spacing={3}>
        {/* תמונות החדר - שיפור הגלריה */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={3}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              height: '100%',
              position: 'relative',
              mb: { xs: 2, md: 0 }
            }}
          >
            {hasImages ? (
              <>
                <Box sx={{ position: 'relative', height: 0, paddingTop: '75%' }}>
                  <CardMedia
                    component="img"
                    image={room.images[activeStep].url}
                    alt={`תמונה של ${room.name}`}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.02)'
                      }
                    }}
                  />
                </Box>
                {maxSteps > 1 && (
                  <>
                    {/* כפתורי ניווט בין התמונות בצדדים */}
                    <IconButton
                      size="large"
                      onClick={handleBack}
                      disabled={activeStep === 0}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        right: 16,
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)'
                        },
                        zIndex: 2
                      }}
                    >
                      <KeyboardArrowRight />
                    </IconButton>
                    <IconButton
                      size="large"
                      onClick={handleNext}
                      disabled={activeStep === maxSteps - 1}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: 16,
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)'
                        },
                        zIndex: 2
                      }}
                    >
                      <KeyboardArrowLeft />
                    </IconButton>
                    
                    {/* תצוגה של כמה תמונות יש ואיזו תמונה מוצגת כעת */}
                    <MobileStepper
                      steps={maxSteps}
                      position="static"
                      activeStep={activeStep}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        mt: 0,
                        borderRadius: 0
                      }}
                      backButton={<Box />}
                      nextButton={<Box />}
                    />
                    
                    {/* גלריית תמונות ממוזערות */}
                    <Box
                      sx={{
                        display: 'flex',
                        overflowX: 'auto',
                        p: 1,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        '&::-webkit-scrollbar': {
                          height: 6,
                        },
                        '&::-webkit-scrollbar-thumb': {
                          borderRadius: 3,
                          backgroundColor: theme.palette.primary.main,
                        }
                      }}
                    >
                      {room.images.map((image, index) => (
                        <Box
                          key={index}
                          onClick={() => setActiveStep(index)}
                          sx={{
                            width: 60,
                            height: 60,
                            flexShrink: 0,
                            mr: 1,
                            opacity: index === activeStep ? 1 : 0.6,
                            border: index === activeStep ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                            borderRadius: 1,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              opacity: 0.9
                            }
                          }}
                        >
                          <img
                            src={image.url}
                            alt={`תמונה ממוזערת ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </>
            ) : (
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100'
                }}
              >
                <HotelIcon sx={{ fontSize: 80, color: 'grey.400' }} />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* מידע על החדר */}
        <Grid item xs={12} md={7}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              mb: { xs: 2, sm: 3 },
              borderRadius: 2
            }}
          >
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1" 
              gutterBottom 
              sx={{ fontWeight: 'bold', mb: 2 }}
            >
              {room.name}
            </Typography>

            <Typography 
              variant="body1" 
              sx={{ 
                mb: 3,
                color: 'text.secondary',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}
            >
              {room.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <PersonIcon color="primary" sx={{ mb: 1, fontSize: isMobile ? '1.5rem' : '2rem' }} />
                  <Typography variant="body2" color="text.secondary">מספר אורחים</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>עד {room.maxGuests}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <RoomIcon color="primary" sx={{ mb: 1, fontSize: isMobile ? '1.5rem' : '2rem' }} />
                  <Typography variant="body2" color="text.secondary">גודל החדר</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{room.size} מ"ר</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <MoneyIcon color="primary" sx={{ mb: 1, fontSize: isMobile ? '1.5rem' : '2rem' }} />
                  <Typography variant="body2" color="text.secondary">מחיר ללילה</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>₪{room.price}</Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
              שירותים בחדר
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 1.5 }, mb: 3 }}>
              {room.amenities.map((amenity, index) => (
                <Chip
                  key={index}
                  icon={amenityIcons[amenity] || <CheckIcon fontSize="small" />}
                  label={amenity}
                  sx={{ 
                    mb: 1, 
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    height: isMobile ? '28px' : '32px'
                  }}
                />
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />
            
            {/* מדיניות ביטול */}
            <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
              מדיניות ביטול
            </Typography>
            
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.07),
                borderRadius: 2,
                border: `1px dashed ${alpha(theme.palette.info.main, 0.4)}`,
                mb: 3
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  fontSize: '0.95rem',
                  color: theme.palette.info.dark
                }}
              >
                <EventAvailableIcon fontSize="small" sx={{ mr: 1, mt: '2px', color: theme.palette.info.main }} />
                <Box>
                  <b>ביטול חינם עד 24 שעות לפני ההגעה.</b><br />
                  לאחר מכן יחויב לילה אחד במקרה של אי הגעה או ביטול.
                </Box>
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              color="primary"
              size={isMobile ? "medium" : "large"}
              fullWidth
              onClick={() => {
                navigate('/booking', {
                  state: {
                    selectedRoomId: room._id,
                    checkIn,
                    checkOut
                  }
                });
              }}
              sx={{ 
                mt: 2,
                py: { xs: 1, sm: 1.5 },
                fontWeight: 'bold'
              }}
            >
              הזמן עכשיו
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RoomPage; 