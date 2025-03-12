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
  alpha,
  Stack,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio
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
import Carousel from 'react-material-ui-carousel';

const MaterialGalleryCarousel = ({ gallery, isMobile, theme }) => {
  if (!gallery || !gallery.images || gallery.images.length === 0) {
    return null;
  }

  const imagesPerSlide = isMobile ? 1 : 3;
  
  const totalGroups = Math.ceil(gallery.images.length / imagesPerSlide);
  
  const imageGroups = chunk(gallery.images, imagesPerSlide);

  return (
    <Carousel
      animation="slide"
      navButtonsAlwaysVisible
      autoPlay={true}
      stopAutoPlayOnHover={true}
      interval={5000}
      timeout={300}
      indicators={true}
      swipe={true}
      cycleNavigation={true}
      fullHeightHover={false}
      next={(next, active) => active + 1 === totalGroups ? 0 : active + 1}
      prev={(prev, active) => active - 1 < 0 ? totalGroups - 1 : active - 1}
      navButtonsProps={{
        style: {
          backgroundColor: theme.palette.primary.main,
          borderRadius: '50%',
          color: 'white',
          padding: '5px',
        }
      }}
      indicatorContainerProps={{
        style: {
          marginTop: '20px',
        }
      }}
      NextIcon={<ArrowBackIcon />}
      PrevIcon={<ArrowForwardIcon />}
    >
      {imageGroups.map((imageGroup, groupIndex) => (
        <div 
          key={groupIndex} 
          style={{ 
            display: 'flex', 
            gap: '16px', 
            padding: '0 16px',
            justifyContent: imageGroup.length < imagesPerSlide ? 'flex-start' : 'space-between' 
          }}
        >
          {imageGroup.map((image, index) => (
            <div 
              key={`${groupIndex}-${image._id || index}`}
              style={{ 
                flex: '1 1 0',
                minWidth: 0,
                maxWidth: `${100/imagesPerSlide}%`,
                height: isMobile ? '240px' : '280px',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                margin: '0 4px'
              }}
            >
              <img
                src={image.url}
                alt={image.title || `תמונה ${index + 1}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transition: 'transform 0.6s ease'
                }}
              />
              {image.title && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '16px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.0))',
                    color: 'white',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                    {image.title}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </Carousel>
  );
};

const chunk = (array, size) => {
  if (!array || !array.length) return [];
  if (array.length <= size) return [array];
  
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    const group = [];
    
    for (let j = 0; j < size; j++) {
      const index = (i + j) % array.length;
      group.push(array[index]);
    }
    
    if (i < array.length) {
      chunks.push(group);
    }
  }
  
  return chunks;
};

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
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
    rooms: 1,
    isTourist: false
  });
  const [guestsMenuAnchor, setGuestsMenuAnchor] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
  const searchSectionRef = useRef(null);

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
    if (location.state?.openBooking) {
      window.history.replaceState({}, document.title);
      
      setSearchFocused(true);
      
      setTimeout(() => {
        searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [location.state]);

  const handleDateChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGuestsMenuOpen = (event) => {
    setGuestsMenuAnchor(event.currentTarget);
  };

  const handleGuestsMenuClose = () => {
    setGuestsMenuAnchor(null);
  };

  const handleGuestsRoomsChange = (field, value) => {
    const newValue = Math.max(1, Math.min(field === 'guests' ? 10 : 5, value));
    
    setBookingData(prev => ({
      ...prev,
      [field]: newValue
    }));
  };

  const calculateNights = () => {
    if (bookingData.checkIn && bookingData.checkOut) {
      return differenceInDays(bookingData.checkOut, bookingData.checkIn);
    }
    return 0;
  };

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
      const guests = Number(bookingData.guests) || 1;
      const rooms = Number(bookingData.rooms) || 1;
      
      console.log('נתוני חיפוש:', {
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: guests,
        rooms: rooms,
        isTourist: bookingData.isTourist
      });
      
      navigate('/search-results', { 
        state: { 
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: guests,
          rooms: rooms,
          isTourist: bookingData.isTourist
        } 
      });
    } catch (error) {
      console.error('שגיאה בבדיקת זמינות:', error);
      setSearchError('אירעה שגיאה בבדיקת הזמינות. אנא נסה שוב.');
    } finally {
      setSearchLoading(false);
    }
  };

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
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                      סטטוס מבקר:
                    </Typography>
                    <RadioGroup
                      row
                      value={bookingData.isTourist ? 'tourist' : 'israeli'}
                      onChange={(e) => setBookingData(prev => ({ ...prev, isTourist: e.target.value === 'tourist' }))}
                      sx={{ 
                        '& .MuiFormControlLabel-root': { 
                          marginLeft: 0, 
                          marginRight: 0 
                        }
                      }}
                    >
                      <FormControlLabel
                        value="israeli"
                        control={<Radio size="small" />}
                        label={
                          <Box>
                            <Typography variant="body2" component="span">
                              תושב ישראל
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              מחירים כוללים מע״מ (18%)
                            </Typography>
                          </Box>
                        }
                        sx={{ flex: 1, alignItems: 'flex-start' }}
                      />
                      <FormControlLabel
                        value="tourist"
                        control={<Radio size="small" />}
                        label={
                          <Box>
                            <Typography variant="body2" component="span">
                              תייר
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              פטור ממע״מ בהצגת דרכון בצ׳ק אין
                            </Typography>
                          </Box>
                        }
                        sx={{ flex: 1, alignItems: 'flex-start' }}
                      />
                    </RadioGroup>
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

        <Box sx={{ 
          mt: 3, 
          pt: 1, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: { xs: 'center', sm: 'space-between' }, 
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{ width: { xs: 0, sm: '200px' }, flexShrink: 0 }}></Box>
          
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
              backgroundColor: alpha(theme.palette.primary.main, 0.03),
              textAlign: 'center',
              order: { xs: 1, sm: 'unset' },
              margin: { xs: '0 auto', sm: '0 auto' },
              flex: 1
            }}
          >
            <Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
              מחירים מיוחדים להזמנות דרך האתר
            </Typography>
          </Typography>
          
          <RadioGroup
            row
            value={bookingData.isTourist ? 'tourist' : 'israeli'}
            onChange={(e) => setBookingData(prev => ({ ...prev, isTourist: e.target.value === 'tourist' }))}
            sx={{ 
              flexWrap: 'nowrap',
              '& .MuiFormControlLabel-root': { 
                marginLeft: 0, 
                marginRight: 0 
              },
              order: { xs: 2, sm: 'unset' },
              width: { xs: '100%', sm: 'auto' },
              flexShrink: 0,
              minWidth: { sm: '200px' }
            }}
          >
            <FormControlLabel
              value="israeli"
              control={<Radio color="primary" size="small" />}
              label={
                <Box>
                  <Typography variant="body2" component="span">
                    תושב ישראל
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                    מחירים כוללים מע״מ (18%)
                  </Typography>
                </Box>
              }
              sx={{ 
                mr: { xs: 1, sm: 3 },
                minWidth: { xs: '120px', sm: 'auto' }
              }}
            />
            <FormControlLabel
              value="tourist"
              control={<Radio color="primary" size="small" />}
              label={
                <Box>
                  <Typography variant="body2" component="span">
                    תייר
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                    פטור ממע״מ בהצגת דרכון בצ׳ק אין
                  </Typography>
                </Box>
              }
              sx={{ 
                minWidth: { xs: '120px', sm: 'auto' }
              }}
            />
          </RadioGroup>
        </Box>
      </Paper>

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
                אנו ממוקמים במרכז העיר פתח תקווה, במרחק הליכה קצר ממגוון מסעדות וחנויות מקומיות. המקום מספק חנייה לאורחים ונגישות לתחבורה ציבורית. המקום מציע חדרים נוחים ומאובזרים, המתאימים לזוגות וליחידים הזקוקים לשהייה באזור. עם צ'ק-אין עצמי נוח בכל שעה, אנו מציעים תמורה מלאה למחיר משתלם במיוחד.
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

      <Box sx={{ mt: { xs: 6, sm: 8 }, mb: 8 }}>
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
          החדרים שלנו
        </Typography>

        {galleryLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} thickness={4} sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : gallery && gallery.images && gallery.images.length > 0 ? (
          <Box sx={{ mt: 4 }}>
            <MaterialGalleryCarousel gallery={gallery} isMobile={isMobile} theme={theme} />
          </Box>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              אין תמונות בגלריה כרגע
            </Typography>
          </Box>
        )}
      </Box>

      <ChatBox />
    </Box>
  );
};

export default HomePage; 