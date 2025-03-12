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
  Container,
  Rating,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
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
  EventBusy as EventBusyIcon,
  Info as InfoIcon,
  Bed as BedIcon,
  SquareFoot as SquareFootIcon,
  LocalOffer as LocalOfferIcon,
  CreditCard as CreditCardIcon,
  Coffee as CoffeeIcon,
  Lock as LockIcon,
  MeetingRoom as MeetingRoomIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

// מיפוי של האייקונים לפי סוג השירות
const amenityIcons = {
  'מיזוג': <AcUnit fontSize="small" />,
  'מיזוג אוויר': <AcUnit fontSize="small" />,
  'אינטרנט אלחוטי': <Wifi fontSize="small" />,
  'טלוויזיה': <Tv fontSize="small" />,
  'מקרר': <Kitchen fontSize="small" />,
  'מיטה זוגית': <KingBed fontSize="small" />,
  'חניה': <DirectionsCar fontSize="small" />,
  'מקלחת': <Bathtub fontSize="small" />,
  'שירותים': <Bathtub fontSize="small" />,
  'ערכת קפה': <CoffeeIcon fontSize="small" />,
  'חדר פרטי': <LockIcon fontSize="small" />
};

// פונקציה לקבלת אייקון אמנטי
const getAmenityIcon = (amenity) => {
  return amenityIcons[amenity] || <CheckIcon fontSize="small" />;
};

// הוספת פונקציה לחישוב תאריך הביטול
const calculateCancellationDate = (checkInDate) => {
  if (!checkInDate) return '';
  const cancellationDate = new Date(checkInDate);
  cancellationDate.setDate(cancellationDate.getDate() - 3);
  return new Date(cancellationDate).toLocaleDateString('he-IL');
};

const RoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [hoveredImage, setHoveredImage] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // קבלת הנתונים מהמצב של הניווט
  const checkIn = location.state?.checkIn;
  const checkOut = location.state?.checkOut;
  const guests = location.state?.guests || 1;
  const isTourist = location.state?.isTourist || false;
  const fromSearchResults = Boolean(location.state);

  const typeToDisplayName = {
    'standard': 'Standard',
    'deluxe': 'Deluxe',
    'suite': 'Suite'
  };

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
          const primaryIndex = roomData.images.findIndex(img => img.isPrimary);
          if (primaryIndex > 0) {
            const sortedImages = [...roomData.images];
            const primaryImage = sortedImages.splice(primaryIndex, 1)[0];
            sortedImages.unshift(primaryImage);
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
    setActiveStep((prevActiveStep) => (prevActiveStep + 1) % maxSteps);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => 
      prevActiveStep === 0 ? maxSteps - 1 : prevActiveStep - 1
    );
  };

  const handleImageClick = (index) => {
    setActiveStep(index);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('he-IL');
  };

  const handleBookNow = () => {
    navigate('/booking', { 
      state: { 
        roomId: id,
        checkIn,
        checkOut,
        guests,
        isTourist
      } 
    });
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '50vh'
      }}>
        <CircularProgress size={40} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, px: 2, maxWidth: '800px', mx: 'auto' }}>
        <Alert severity="error" variant="filled">{error}</Alert>
      </Box>
    );
  }

  if (!room) {
    return (
      <Box sx={{ mt: 4, px: 2, maxWidth: '800px', mx: 'auto' }}>
        <Alert severity="warning" variant="filled">החדר המבוקש לא נמצא.</Alert>
      </Box>
    );
  }

  // בדיקה אם יש תמונות לחדר
  const hasImages = room.images && room.images.length > 0;
  const maxSteps = hasImages ? room.images.length : 0;

  // שינוי הטאבים
  const tabLabels = ["פרטים", "מדיניות"];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      {/* כותרת ראשית וכפתור חזרה */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              mb: 1,
              borderRadius: 2,
              px: 2
            }}
          >
            חזרה
          </Button>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1"
            sx={{ 
              fontWeight: 'bold',
              color: theme.palette.primary.dark,
              mt: 1
            }}
          >
            חדר {typeToDisplayName[room.type] || room.type}
          </Typography>
          
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 0.5,
            color: theme.palette.text.secondary
          }}>
            <RoomIcon fontSize="small" color="primary" />
            <Typography variant="body2">
              רוטשילד 79, פתח תקווה
            </Typography>
          </Box>
        </Box>
        
        {fromSearchResults && checkIn && checkOut && (
          <Box sx={{ 
            p: 1.5, 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <EventAvailableIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
              <Typography variant="body2" fontWeight="medium">
                תאריכי שהייה:
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.9rem' }}>
              {formatDate(checkIn)} - {formatDate(checkOut)}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
              <PersonIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem', verticalAlign: 'middle' }} />
              {guests} {guests === 1 ? 'אורח' : 'אורחים'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* גוף עמוד החדר */}
      <Grid container spacing={3}>
        {/* אזור התמונות - חלק שמאלי */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
              mb: { xs: 2, md: 0 },
              height: '100%',
              maxHeight: { md: '480px' },
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {hasImages ? (
              <Box sx={{ 
                position: 'relative', 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%' 
              }}>
                {/* תמונה ראשית */}
                <Box sx={{ 
                  flex: 1,
                  position: 'relative', 
                  overflow: 'hidden',
                  background: '#f5f5f5'
                }}>
                  <CardMedia
                    component="img"
                    image={room.images[activeStep].url}
                    alt={`תמונה של ${room.name}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s',
                      '&:hover': {
                        transform: 'scale(1.04)'
                      }
                    }}
                  />
                  
                  {/* כפתורי ניווט בגלריה */}
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 2
                  }}>
                    <IconButton
                      onClick={handleBack}
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                      }}
                    >
                      <KeyboardArrowRight />
                    </IconButton>
                    <IconButton
                      onClick={handleNext}
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                      }}
                    >
                      <KeyboardArrowLeft />
                    </IconButton>
                  </Box>
                </Box>
                
                {/* גלריית התמונות המוקטנות - עידכון CSS */}
                <Box sx={{ 
                  display: 'flex',
                  overflowX: 'auto',
                  p: 1,
                  gap: 1,
                  height: '70px',
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  '&::-webkit-scrollbar': {
                    height: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    borderRadius: '2px',
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  },
                  alignItems: 'center'
                }}>
                  {room.images.map((image, index) => (
                    <Box
                      key={index}
                      onClick={() => handleImageClick(index)}
                      onMouseEnter={() => setHoveredImage(index)}
                      onMouseLeave={() => setHoveredImage(null)}
                      sx={{ 
                        width: '70px',
                        height: '50px',
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: index === activeStep 
                          ? `2px solid ${theme.palette.primary.main}`
                          : '2px solid transparent',
                        opacity: hoveredImage === index || index === activeStep ? 1 : 0.7,
                        transition: 'all 0.2s',
                        flexShrink: 0,
                        position: 'relative'
                      }}
                    >
                      <img
                        src={image.url}
                        alt={`תמונה ${index + 1} של ${room.name}`}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ 
                height: '300px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'grey.100'
              }}>
                <HotelIcon sx={{ fontSize: 80, color: 'grey.400' }} />
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* פרטי החדר - חלק ימני */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04), p: 2, pb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    פרטי החדר
                  </Typography>
                </Box>
                <Box>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    color="primary.main" 
                    sx={{ fontWeight: 'bold' }}
                  >
                    ₪{room.basePrice}
                    <Typography component="span" variant="body2" sx={{ ml: 0.5 }}>
                      / לילה
                    </Typography>
                  </Typography>
                  {isTourist ? (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        color: 'success.main',
                        fontWeight: 'medium'
                      }}
                    >
                      פטור ממע״מ לתיירים
                    </Typography>
                  ) : (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      כולל מע״מ (18%)
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* מאפיינים מרכזיים של החדר */}
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={6} sm={3} md={6} lg={3}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <BedIcon color="primary" />
                    <Typography variant="body2" align="center" sx={{ mt: 0.5 }}>
                      {room.maxGuests} אורחים
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={6} lg={3}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <SquareFootIcon color="primary" />
                    <Typography variant="body2" align="center" sx={{ mt: 0.5 }}>
                      {room.size || 25} מ"ר
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={6} lg={3}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <KingBed color="primary" />
                    <Typography variant="body2" align="center" sx={{ mt: 0.5 }}>
                      מיטה זוגית
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3} md={6} lg={3}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <RoomIcon color="primary" />
                    <Typography variant="body2" align="center" sx={{ mt: 0.5 }}>
                      חלון פונה לרחוב
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            
            <Divider />
            
            {/* טאבים של פרטי החדר */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 'medium',
                    fontSize: '0.9rem'
                  }
                }}
              >
                <Tab label="פרטים" />
                <Tab label="מדיניות" />
              </Tabs>
              
              <Box sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
                {/* תוכן טאב 1 - פרטים */}
                {activeTab === 0 && (
                  <Box>
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                      {room.description ? room.description : 'חדר סטנדרט נעים ונוח, מתאים לזוגות או ליחידים. החדר מעוצב בסטנדרט גבוה וכולל את כל הפינוקים להם אתם זקוקים לחופשה מושלמת.'}
                    </Typography>
                    
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
                      מידע נוסף:
                    </Typography>
                    
                    <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ borderBottom: 'none', py: 1, width: '50%' }}>
                              <Typography variant="body2" fontWeight="medium">צ'ק אין:</Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom: 'none', py: 1 }}>
                              <Typography variant="body2">החל מ-15:00</Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ borderBottom: 'none', py: 1 }}>
                              <Typography variant="body2" fontWeight="medium">צ'ק אאוט:</Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom: 'none', py: 1 }}>
                              <Typography variant="body2">עד 10:00</Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Grid container spacing={1}>
                      {/* אמנטי מקורי עם תוספות */}
                      {[
                        ...(room.amenities && room.amenities.length > 0 ? room.amenities : []),
                        'ערכת קפה',
                        'חדר פרטי'
                      ].map((amenity, index) => (
                        <Grid item xs={6} sm={4} key={index}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1.5,
                            p: 1,
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}>
                            <Box sx={{ 
                              minWidth: 32, 
                              height: 32, 
                              borderRadius: '50%', 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: theme.palette.primary.main
                            }}>
                              {getAmenityIcon(amenity)}
                            </Box>
                            <Typography variant="body2">{amenity}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                
                {/* תוכן טאב 2 - מדיניות */}
                {activeTab === 1 && (
                  <Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        מדיניות ביטול:
                      </Typography>
                      <Typography variant="body2">
                        • ביטול חינם עד {checkIn ? calculateCancellationDate(checkIn) : "3 ימים לפני ההגעה"}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        תנאי תשלום:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <CreditCardIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          ניתן לשלם באשראי, במזומן או באמצעות ביט
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <InfoIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          נדרש כרטיס אשראי לפיקדון
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        מידע חשוב:
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        • צ׳ק אין עצמאי ונוח - כל הפרטים ישלחו אליכם ביום ההגעה
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        • צ׳ק אין משעה 15:00, צ׳ק אאוט עד השעה 10:00 בבוקר
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        • בשבתות ובחגים יהודיים ניתן לבצע צ׳ק אין רק משעתיים וחצי לאחר השקיעה
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        • אסור לקיים מסיבות או אירועים רועשים
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        • אין להכניס אורחים נוספים מעבר לתפוסה המאושרת
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        • אין להכניס חיות מחמד
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* כפתור הזמנה */}
              {fromSearchResults && checkIn && checkOut && (
                <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleBookNow}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.2,
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    הזמן עכשיו
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RoomPage; 