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
  ImageListItemBar
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

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        setRooms(response.data.data);
      } catch (error) {
        console.error('שגיאה בטעינת החדרים:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

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
    <Box>
      {/* חיפוש */}
      <Paper
        ref={searchSectionRef}
        elevation={5}
        sx={{
          p: { xs: 3, sm: 4 },
          mb: 6,
          mx: { xs: 2, md: 6 },
          mt: { xs: 2, md: 3 },
          borderRadius: 3,
          border: searchFocused ? '2px solid #1976d2' : 'none',
          transition: 'all 0.3s ease',
          boxShadow: searchFocused ? '0px 8px 25px rgba(0,0,0,0.15)' : '0px 4px 15px rgba(0,0,0,0.1)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
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
                    size: isMobile ? "small" : "medium"
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
                    size: isMobile ? "small" : "medium"
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
                sx={{ height: isMobile ? 40 : 56, justifyContent: 'space-between', px: 2 }}
              >
                <Typography variant="body1">
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
                    padding: '16px'
                  }
                }}
              >
                <Box sx={{ p: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography>אורחים</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleGuestsRoomsChange('guests', Math.max(1, bookingData.guests - 1))}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography sx={{ mx: 2, minWidth: '20px', textAlign: 'center' }}>
                        {bookingData.guests}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleGuestsRoomsChange('guests', bookingData.guests + 1)}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>חדרים</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleGuestsRoomsChange('rooms', Math.max(1, bookingData.rooms - 1))}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography sx={{ mx: 2, minWidth: '20px', textAlign: 'center' }}>
                        {bookingData.rooms}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleGuestsRoomsChange('rooms', Math.min(10, bookingData.rooms + 1))}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    sx={{ mt: 2 }} 
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
              sx={{ height: isMobile ? 40 : 56 }}
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
          <Alert severity="error" sx={{ mt: 2 }}>
            {searchError}
          </Alert>
        )}

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {calculateNights()} לילות |{' '}
            <Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
              מחירים מיוחדים להזמנות דרך האתר
            </Typography>
          </Typography>
        </Box>
      </Paper>

      {/* מידע על המלונית */}
      <Box sx={{ mb: 4, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="body2" paragraph>
                המלונית שלנו ממוקמת במתחם המחודש של מרכז העיר פתח תקווה, במרחק הליכה קצר ממגוון מסעדות, חנויות ואטרקציות.
                אנו מציעים חדרים מודרניים ומאובזרים היטב, המתאימים לזוגות, משפחות ואנשי עסקים.
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                  מיקום
                </Typography>
                <Typography variant="body2" paragraph>
                  רחוב רוטשילד 79, פתח תקווה | במרכז העיר, 5 דקות הליכה מהקניון הגדול
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                  צור קשר
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tooltip title="התקשר אלינו">
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        startIcon={<CallIcon />}
                        component="a"
                        href="tel:0506070260"
                        size="small"
                        sx={{ 
                          borderRadius: '50px',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                        }}
                      >
                        050-607-0260
                      </Button>
                    </Tooltip>
                    
                    <Tooltip title="שלח לנו הודעה בוואטסאפ">
                      <Button 
                        variant="contained" 
                        color="success" 
                        startIcon={<WhatsAppIcon />}
                        component="a"
                        href="https://wa.me/972506070260"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        sx={{ 
                          borderRadius: '50px',
                          backgroundColor: '#25D366',
                          '&:hover': { backgroundColor: '#1fb655' }
                        }}
                      >
                        וואטסאפ
                      </Button>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                height: '100%', 
                overflow: 'hidden',
                borderRadius: 2,
                boxShadow: '0px 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              <Box
                component="iframe"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3379.8881269602824!2d34.884986!3d32.089128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151d366440afbecd%3A0x99ad886c7d7ebb2f!2sRothschild%20St%2079%2C%20Petah%20Tikva!5e0!3m2!1sen!2sil!4v1709767271407!5m2!1sen!2sil"
                sx={{
                  border: 0,
                  width: '100%',
                  height: '100%',
                  minHeight: { xs: '200px', md: '100%' }
                }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* החדרים שלנו - גלריה */}
      <Box sx={{ mb: 6, px: { xs: 2, md: 4 } }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h2" 
          align="center" 
          sx={{ 
            mb: { xs: 3, sm: 4 }, 
            fontWeight: 'bold',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              width: '60px',
              height: '3px',
              bottom: '-12px',
              left: 'calc(50% - 30px)',
              backgroundColor: 'primary.main'
            }
          }}
        >
          <HotelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          החדרים שלנו
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
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
                gap: '16px!important'
              }}
              variant="quilted"
              cols={3}
              rowHeight={isMobile ? 180 : 200}
            >
              {rooms.flatMap(room => 
                room.images.slice(0, 2).map((image, index) => (
                  <ImageListItem 
                    key={`${room._id}-${index}`}
                    component={Link}
                    to={`/room/${room._id}`}
                    sx={{ 
                      cursor: 'pointer',
                      overflow: 'hidden',
                      borderRadius: 2,
                      boxShadow: '0px 4px 15px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0px 6px 20px rgba(0,0,0,0.15)'
                      },
                      '&:hover img': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <img
                      src={image}
                      alt={`${room.name} - תמונה ${index + 1}`}
                      loading="lazy"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease'
                      }}
                    />
                    <ImageListItemBar
                      title={room.name}
                      subtitle={`עד ${room.maxGuests} אורחים`}
                      sx={{
                        '& .MuiImageListItemBar-title': { 
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        },
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)'
                      }}
                    />
                  </ImageListItem>
                ))
              )}
            </ImageList>
          </Box>
        )}
      </Box>

      {/* צ'אט */}
      <ChatBox />
    </Box>
  );
};

export default HomePage; 