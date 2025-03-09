import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import he from 'date-fns/locale/he';
import { addDays, differenceInDays } from 'date-fns';
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
  Divider,
  TextField,
  CircularProgress,
  ImageList,
  ImageListItem,
  IconButton,
  Chip,
  Alert,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Link as MuiLink,
  Tooltip,
  ImageListItemBar,
  alpha
} from '@mui/material';
import { 
  Hotel as HotelIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  EventAvailable as EventIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  WhatsApp as WhatsAppIcon,
  Call as CallIcon
} from '@mui/icons-material';
import ChatBox from '../components/ChatBox';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // הגדרת תאריכי ברירת מחדל
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bookingData, setBookingData] = useState({
    checkIn: today,
    checkOut: tomorrow,
    guests: 1,
    rooms: 1
  });
  const [guestsMenuAnchor, setGuestsMenuAnchor] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
  // גלילה אל אזור החיפוש כאשר פותחים את דף ההזמנה
  const searchSectionRef = useRef(null);

  // מחלקות וסטייל
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
        setRooms(response.data.data);
      } catch (error) {
        console.error('שגיאה בטעינת חדרים:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // מחלקות וסטייל - גלריה כללית
  const [gallery, setGallery] = useState(null);
  const [galleryLoading, setGalleryLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setGalleryLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/gallery`);
        setGallery(response.data.data);
      } catch (error) {
        console.error('שגיאה בטעינת הגלריה:', error);
      } finally {
        setGalleryLoading(false);
      }
    };

    fetchGallery();
  }, []);

  useEffect(() => {
    // אם המשתמש הגיע מדף החדר עם בקשה לפתוח את ההזמנה
    if (location.state?.openBooking) {
      // הסרת מידע המצב מההיסטוריה להימנע מבעיות ברענון הדף
      window.history.replaceState({}, document.title);
      
      // התמקדות באזור החיפוש
      setSearchFocused(true);
      
      // גלילה לאזור החיפוש
      setTimeout(() => {
        searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [location.state]);

  // טיפול בשינוי תאריכים
  const handleDateChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // פתיחה וסגירה של תפריט אורחים וחדרים
  const handleGuestsMenuOpen = (event) => {
    setGuestsMenuAnchor(event.currentTarget);
  };

  const handleGuestsMenuClose = () => {
    setGuestsMenuAnchor(null);
  };

  // עדכון מספר אורחים וחדרים
  const handleGuestsRoomsChange = (field, value) => {
    // וידוא שהערך הוא בטווח חוקי
    const newValue = Math.max(1, Math.min(field === 'guests' ? 10 : 5, value));
    
    setBookingData(prev => ({
      ...prev,
      [field]: newValue
    }));
  };

  // חישוב מספר הלילות
  const calculateNights = () => {
    if (bookingData.checkIn && bookingData.checkOut) {
      return differenceInDays(bookingData.checkOut, bookingData.checkIn);
    }
    return 0;
  };

  // בדיקת זמינות וניווט להזמנה
  const handleCheckAvailability = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut) {
      setSearchError('אנא בחר תאריכי צ׳ק אין וצ׳ק אאוט');
      return;
    }

    if (calculateNights() < 1) {
      setSearchError('תאריך צ׳ק אאוט חייב להיות לפחות יום אחד אחרי צ׳ק אין');
      return;
    }

    setSearchError('');
    setSearchLoading(true);

    try {
      // במקום לנווט ישירות לדף ההזמנה, אנחנו עוברים לדף תוצאות החיפוש
      navigate('/search-results', { 
        state: { 
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: bookingData.guests,
          rooms: bookingData.rooms
        } 
      });
    } catch (error) {
      console.error('שגיאה בבדיקת זמינות:', error);
      setSearchError('אירעה שגיאה בבדיקת הזמינות. אנא נסה שוב.');
    } finally {
      setSearchLoading(false);
    }
  };

  // ניווט בין תמונות הגלריה
  const handleNextImage = () => {
    if (rooms?.length > 0 && rooms[0]?.images?.length > 0) {
      const room = rooms[0];
      const totalImages = room.images.length;
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % totalImages);
    }
  };

  const handlePrevImage = () => {
    if (rooms?.length > 0 && rooms[0]?.images?.length > 0) {
      const room = rooms[0];
      const totalImages = room.images.length;
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + totalImages) % totalImages);
    }
  };

  return (
    <Box sx={{ 
      maxWidth: '1400px', 
      mx: 'auto',
      px: { xs: 2, sm: 3, md: 4 },
      py: { xs: 2, md: 3 },
      backgroundColor: alpha(theme.palette.background.default, 0.7),
      backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* חיפוש */}
      <Paper
        ref={searchSectionRef}
        elevation={3}
        sx={{
          p: { xs: 3, sm: 4 },
          mb: 6,
          borderRadius: 4,
          border: searchFocused ? `2px solid ${theme.palette.primary.main}` : 'none',
          transition: 'all 0.3s ease',
          boxShadow: searchFocused 
            ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`
            : '0 8px 24px rgba(0,0,0,0.05)',
          background: 'linear-gradient(135deg, #ffffff, #f9f9ff)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '5px',
            background: 'linear-gradient(90deg, #42a5f5, #1976d2, #0d47a1)',
            opacity: 0.8
          },
          backdropFilter: 'blur(8px)'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
              <DatePicker
                label="תאריך כניסה"
                value={bookingData.checkIn}
                onChange={(newValue) => handleDateChange('checkIn', newValue)}
                disablePast
                sx={{ width: '100%' }}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    fullWidth: true,
                    size: isMobile ? "small" : "medium",
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.1)}`
                        },
                        '&.Mui-focused': {
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                        }
                      }
                    }
                  },
                  actionBar: {
                    actions: ['clear', 'today'],
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
              <DatePicker
                label="תאריך יציאה"
                value={bookingData.checkOut}
                onChange={(newValue) => handleDateChange('checkOut', newValue)}
                disablePast
                minDate={addDays(bookingData.checkIn, 1)}
                sx={{ width: '100%' }}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    fullWidth: true,
                    size: isMobile ? "small" : "medium",
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.1)}`
                        },
                        '&.Mui-focused': {
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                        }
                      }
                    }
                  },
                  actionBar: {
                    actions: ['clear', 'today'],
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Box>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleGuestsMenuOpen}
                endIcon={<ArrowDropDownIcon />}
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  height: isMobile ? 40 : 56, 
                  justifyContent: 'space-between', 
                  px: 2,
                  borderRadius: 2,
                  borderWidth: '1.5px',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderWidth: '1.5px',
                    boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                }}
              >
                <Typography variant="body1" fontWeight="medium">
                  {`${bookingData.guests} אורחים, ${bookingData.rooms} חדרים`}
                </Typography>
              </Button>
              <Menu
                id="guests-menu"
                anchorEl={guestsMenuAnchor}
                open={Boolean(guestsMenuAnchor)}
                onClose={handleGuestsMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                sx={{ mt: 1 }}
                PaperProps={{
                  style: {
                    width: isMobile ? '90%' : '300px',
                    padding: '16px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <Box sx={{ p: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography>אורחים</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, borderRadius: 2, bgcolor: 'background.paper' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleGuestsRoomsChange('guests', Math.max(1, bookingData.guests - 1))}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ mx: 2, minWidth: '24px', textAlign: 'center', fontWeight: 'medium' }}>
                        {bookingData.guests}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleGuestsRoomsChange('guests', bookingData.guests + 1)}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>חדרים</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, borderRadius: 2, bgcolor: 'background.paper' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleGuestsRoomsChange('rooms', Math.max(1, bookingData.rooms - 1))}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ mx: 2, minWidth: '24px', textAlign: 'center', fontWeight: 'medium' }}>
                        {bookingData.rooms}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleGuestsRoomsChange('rooms', Math.min(10, bookingData.rooms + 1))}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    sx={{ 
                      mt: 2, 
                      borderRadius: '50px',
                      py: 1,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                    onClick={handleGuestsMenuClose}
                  >
                    אישור
                  </Button>
                </Box>
              </Menu>
            </Box>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<SearchIcon />}
              onClick={handleCheckAvailability}
              disabled={searchLoading}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                height: isMobile ? 40 : 56, 
                borderRadius: 2,
                fontWeight: 'bold',
                boxShadow: '0 6px 12px rgba(25, 118, 210, 0.2)',
                transition: 'all 0.3s ease',
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {searchLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'חפש זמינות'
              )}
            </Button>
          </Grid>
        </Grid>

        {searchError && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2, 
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '1.2rem'
              }
            }}
          >
            {searchError}
          </Alert>
        )}

        <Box sx={{ mt: 3, textAlign: 'center', pt: 1 }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              p: 1.5,
              border: '1px dashed',
              borderColor: alpha(theme.palette.primary.main, 0.3),
              borderRadius: 4,
              display: 'inline-block',
              px: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.03)
            }}
          >
            {calculateNights()} לילות |{' '}
            <Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
              מחירים מיוחדים להזמנות דרך האתר
            </Typography>
          </Typography>
        </Box>
      </Paper>

      {/* מידע על המלונית */}
      <Box sx={{ mb: 6, px: { xs: 0, md: 0 } }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h2" 
          align="center" 
          sx={{ 
            mb: { xs: 4, sm: 5 }, 
            fontWeight: 'bold',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.palette.primary.dark,
            '&::after': {
              content: '""',
              position: 'absolute',
              width: '80px',
              height: '3px',
              bottom: '-12px',
              background: 'linear-gradient(90deg, #42a5f5, #1976d2)',
              borderRadius: '50px'
            }
          }}
        >
          <LocationIcon sx={{ mr: 1.5, verticalAlign: 'middle', color: theme.palette.primary.main }} />
          אודות
        </Typography>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ 
              p: 4, 
              borderRadius: 4, 
              height: '100%',
              background: 'linear-gradient(to bottom right, #ffffff, #f5f9ff)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}>
              <Typography variant="body1" paragraph lineHeight={1.8}>
                אנו ממוקמים במרכז העיר פתח תקווה, במרחק הליכה קצר ממגוון מסעדות וחנויות מקומיות. המקום מספק חנייה חופשית לאורחים ונגיש מאוד לתחבורה ציבורית מכל חלקי המטרופולין.
                המקום מציע חדרים נוחים ומאובזרים, המתאימים במיוחד לזוגות וליחידים הזקוקים לשהייה באזור. עם צ'ק-אין עצמי נוח וגישה 24/7, אנו מציעים תמורה מלאה למחיר משתלם במיוחד.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  color: theme.palette.primary.dark
                }}>
                  <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                  מיקום
                </Typography>
                <Typography variant="body1" paragraph sx={{ 
                  pl: 3,
                  borderLeft: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  lineHeight: 1.8
                }}>
                  רחוב רוטשילד 79, פתח תקווה | במרכז העיר, קרוב לקניון הגדול ולבתי החולים בלינסון ושניידר
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                height: '100%', 
                overflow: 'hidden',
                borderRadius: 4,
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                border: `1px solid ${alpha(theme.palette.grey[300], 0.8)}`,
                '&:hover': {
                  boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Box
                component="iframe"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3379.8881269602824!2d34.884986!3d32.089128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151d366440afbecd%3A0x99ad886c7d7ebb2f!2sRothschild%20St%2079%2C%20Petah%20Tikva!5e0!3m2!1sen!2sil!4v1709767271407!5m2!1sen!2sil"
                sx={{
                  border: 0,
                  width: '100%',
                  height: '100%',
                  minHeight: { xs: '250px', md: '100%' }
                }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* גלריית תמונות */}
      <Box sx={{ mt: { xs: 6, sm: 8 } }}>
        <Typography 
          variant="h4" 
          component="h2" 
          align="center" 
          sx={{ 
            mb: { xs: 4, sm: 5 }, 
            fontWeight: 'bold',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.palette.primary.dark,
            '&::after': {
              content: '""',
              position: 'absolute',
              width: '80px',
              height: '3px',
              bottom: '-12px',
              background: 'linear-gradient(90deg, #42a5f5, #1976d2)',
              borderRadius: '50px'
            }
          }}
        >
          <HotelIcon sx={{ mr: 1.5, verticalAlign: 'middle', color: theme.palette.primary.main }} />
          הגלריה שלנו
        </Typography>

        {galleryLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} thickness={4} sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : gallery && gallery.images && gallery.images.length > 0 ? (
          <Box>
            <ImageList
              sx={{ 
                width: '100%', 
                // משתנה בהתאם לגודל המסך
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)!important', 
                  sm: 'repeat(2, 1fr)!important', 
                  md: 'repeat(3, 1fr)!important'
                },
                gap: '24px!important',
                pt: 1,
                overflow: 'visible'
              }}
              variant="standard"
              cols={3}
              rowHeight={isMobile ? 200 : 240}
            >
              {gallery.images.map((image, index) => (
                <ImageListItem 
                  key={image._id || index}
                  sx={{ 
                    cursor: 'pointer',
                    overflow: 'hidden',
                    borderRadius: 4,
                    boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 15px 30px rgba(0,0,0,0.12)'
                    },
                    '&:hover img': {
                      transform: 'scale(1.08)',
                      filter: 'brightness(1.05)'
                    },
                    '&:active': {
                      transform: 'translateY(-3px)'
                    }
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.title || `תמונה ${index + 1}`}
                    loading="lazy"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'all 0.7s ease'
                    }}
                  />
                  {image.title && (
                    <ImageListItemBar
                      title={image.title}
                      sx={{
                        '& .MuiImageListItemBar-title': { 
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          mb: 0.5
                        },
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
                        padding: '16px 12px',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  )}
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              אין תמונות בגלריה
            </Typography>
          </Box>
        )}
      </Box>

      {/* צ'אט */}
      <ChatBox />
    </Box>
  );
};

export default HomePage; 