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
  MenuItem
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
  Add as AddIcon
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
    <Box sx={{ 
      minHeight: '92vh', 
      display: 'flex', 
      flexDirection: 'column', 
      p: 0,
      pb: 3,
      background: 'linear-gradient(to bottom, #f7f9fc, #ffffff)',
    }}>
      {/* כותרת ראשית ומידע */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          mb: 3,
          mt: 2,
          px: 2
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{
            fontWeight: 600,
            color: '#2c3e50',
            fontSize: { xs: '1.8rem', md: '2.2rem' },
          }}
        >
          מלונית רוטשילד 79
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{
            maxWidth: '600px',
            mx: 'auto',
            fontSize: '1rem',
            opacity: 0.9
          }}
        >
          נוחות במחיר משתלם במרכז פתח תקווה
        </Typography>
      </Box>

      {/* חיפוש תאריכים - עיצוב מודרני ומקצועי */}
      <Paper 
        elevation={searchFocused ? 4 : 1} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 4, 
          maxWidth: '850px', 
          mx: 'auto',
          borderRadius: '16px',
          transition: 'all 0.3s ease',
          background: searchFocused 
            ? 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)' 
            : '#ffffff',
          position: 'relative',
          overflow: 'visible',
          boxShadow: searchFocused 
            ? '0 10px 30px rgba(0,0,0,0.08)'
            : '0 2px 8px rgba(0,0,0,0.04)',
          width: '90%'
        }}
        ref={searchSectionRef}
        onMouseEnter={() => setSearchFocused(true)}
        onMouseLeave={() => setSearchFocused(false)}
      >
        <Grid 
          container 
          spacing={2} 
          alignItems="center" 
          sx={{ 
            borderRadius: '12px',
            p: { xs: 0, sm: 1 },
          }}
        >
          {/* תאריך כניסה */}
          <Grid item xs={6} sm={3}>
            <Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mb: 0.5, 
                  fontWeight: 500,
                  color: '#64748b'
                }}
              >
                צ'ק אין
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  value={bookingData.checkIn}
                  onChange={(date) => handleDateChange('checkIn', date)}
                  disablePast
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  inputFormat="dd/MM/yyyy"
                  PaperProps={{
                    sx: {
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    }
                  }}
                  PopperProps={{
                    sx: {
                      '& .MuiPickersDay-root': {
                        borderRadius: '8px',
                      },
                      '& .MuiPickersDay-root.Mui-selected': {
                        backgroundColor: theme.palette.primary.main,
                      }
                    }
                  }}
                  sx={{ 
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#f1f5f9',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff',
                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)'
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '10px 14px',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }
                  }}
                />
              </LocalizationProvider>
            </Box>
          </Grid>
          
          {/* תאריך יציאה */}
          <Grid item xs={6} sm={3}>
            <Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mb: 0.5, 
                  fontWeight: 500,
                  color: '#64748b'
                }}
              >
                צ'ק אאוט
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  value={bookingData.checkOut}
                  onChange={(date) => handleDateChange('checkOut', date)}
                  minDate={bookingData.checkIn ? addDays(bookingData.checkIn, 1) : addDays(new Date(), 1)}
                  inputFormat="dd/MM/yyyy"
                  PaperProps={{
                    sx: {
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    }
                  }}
                  PopperProps={{
                    sx: {
                      '& .MuiPickersDay-root': {
                        borderRadius: '8px',
                      },
                      '& .MuiPickersDay-root.Mui-selected': {
                        backgroundColor: theme.palette.primary.main,
                      }
                    }
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  sx={{ 
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#f1f5f9',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff',
                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)'
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '10px 14px',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }
                  }}
                />
              </LocalizationProvider>
            </Box>
          </Grid>
          
          {/* בחירת אורחים וחדרים */}
          <Grid item xs={6} sm={3}>
            <Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mb: 0.5, 
                  fontWeight: 500,
                  color: '#64748b'
                }}
              >
                אורחים וחדרים
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGuestsMenuOpen}
                endIcon={<ArrowDropDownIcon />}
                sx={{ 
                  height: '40px',
                  justifyContent: 'space-between',
                  textTransform: 'none',
                  color: '#334155',
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  borderRadius: '10px',
                  transition: 'all 0.2s ease',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: '#94a3b8',
                    backgroundColor: '#f1f5f9'
                  },
                  '& .MuiButton-endIcon': {
                    color: '#64748b'
                  },
                  fontSize: '0.9rem',
                }}
              >
                <Box sx={{ textAlign: 'start', width: '100%' }}>
                  <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
                    {bookingData.guests} {bookingData.guests === 1 ? 'אורח' : 'אורחים'}
                    {bookingData.rooms > 1 && `, ${bookingData.rooms} חדרים`}
                  </Typography>
                </Box>
              </Button>
              <Menu
                anchorEl={guestsMenuAnchor}
                open={Boolean(guestsMenuAnchor)}
                onClose={handleGuestsMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                sx={{ mt: 1 }}
                PaperProps={{
                  sx: {
                    width: 280,
                    p: 2,
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
                    border: '1px solid #f1f5f9'
                  }
                }}
              >
                {/* בחירת אורחים */}
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 1.5, 
                      fontWeight: 600, 
                      color: '#334155'
                    }}
                  >
                    אורחים
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleGuestsRoomsChange('guests', bookingData.guests - 1)}
                      disabled={bookingData.guests <= 1}
                      sx={{ 
                        border: '1px solid', 
                        borderColor: bookingData.guests <= 1 ? '#e2e8f0' : '#cbd5e1',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        color: bookingData.guests <= 1 ? '#94a3b8' : '#64748b',
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.04)'
                        },
                        '&:active': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)'
                        }
                      }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#334155',
                        mx: 2
                      }}
                    >
                      {bookingData.guests}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleGuestsRoomsChange('guests', bookingData.guests + 1)}
                      disabled={bookingData.guests >= 10}
                      sx={{ 
                        border: '1px solid', 
                        borderColor: bookingData.guests >= 10 ? '#e2e8f0' : '#cbd5e1',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        color: bookingData.guests >= 10 ? '#94a3b8' : '#64748b',
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.04)'
                        },
                        '&:active': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)'
                        }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                {/* בחירת חדרים */}
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 1.5, 
                      fontWeight: 600, 
                      color: '#334155'
                    }}
                  >
                    חדרים
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleGuestsRoomsChange('rooms', bookingData.rooms - 1)}
                      disabled={bookingData.rooms <= 1}
                      sx={{ 
                        border: '1px solid', 
                        borderColor: bookingData.rooms <= 1 ? '#e2e8f0' : '#cbd5e1',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        color: bookingData.rooms <= 1 ? '#94a3b8' : '#64748b',
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.04)'
                        },
                        '&:active': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)'
                        }
                      }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#334155',
                        mx: 2
                      }}
                    >
                      {bookingData.rooms}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleGuestsRoomsChange('rooms', bookingData.rooms + 1)}
                      disabled={bookingData.rooms >= 5}
                      sx={{ 
                        border: '1px solid', 
                        borderColor: bookingData.rooms >= 5 ? '#e2e8f0' : '#cbd5e1',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        color: bookingData.rooms >= 5 ? '#94a3b8' : '#64748b',
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.04)'
                        },
                        '&:active': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)'
                        }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    size="small" 
                    onClick={handleGuestsMenuClose}
                    sx={{ 
                      fontWeight: 600,
                      textTransform: 'none',
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.04)'
                      }
                    }}
                  >
                    אישור
                  </Button>
                </Box>
              </Menu>
            </Box>
          </Grid>
          
          {/* כפתור חיפוש */}
          <Grid item xs={6} sm={3}>
            <Box sx={{ mt: { xs: 'auto', sm: '17px' } }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleCheckAvailability}
                disabled={searchLoading || !bookingData.checkIn || !bookingData.checkOut}
                sx={{ 
                  height: '40px',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  background: !searchLoading && bookingData.checkIn && bookingData.checkOut ? 
                    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : undefined,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
                    transform: 'translateY(-1px)',
                    background: 'linear-gradient(135deg, #4f86f7 0%, #2563eb 100%)'
                  },
                  '&:active': {
                    transform: 'translateY(1px)',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                  }
                }}
              >
                {searchLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <>
                    <SearchIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                    חפש זמינות
                  </>
                )}
              </Button>
            </Box>
          </Grid>
          
          {/* הודעות שגיאה או מידע */}
          {searchError && (
            <Grid item xs={12}>
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 1.5, 
                  borderRadius: '10px', 
                  py: 0.5,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.1)'
                }}
              >
                <Typography variant="body2">{searchError}</Typography>
              </Alert>
            </Grid>
          )}
          
          {bookingData.checkIn && bookingData.checkOut && calculateNights() > 0 && (
            <Grid item xs={12}>
              <Alert 
                severity="info" 
                icon={<EventIcon />}
                sx={{ 
                  mt: 1.5, 
                  borderRadius: '10px',
                  py: 0.5,
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.1)',
                  '& .MuiAlert-icon': {
                    color: theme.palette.primary.main
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  משך שהייה: <strong>{calculateNights()} לילות</strong> 
                  {bookingData.guests > 1 && ` • ${bookingData.guests} אורחים`}
                  {bookingData.rooms > 1 && ` • ${bookingData.rooms} חדרים`}
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* פרטי מיקום ומידע בסיסי - קומפקטי */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2.5, 
          mb: 4, 
          maxWidth: '850px', 
          mx: 'auto',
          borderRadius: '16px',
          width: '90%'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <LocationIcon 
                sx={{ 
                  mr: 1, 
                  fontSize: '1.2rem',
                  color: theme.palette.primary.main,
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  p: 0.5,
                  borderRadius: '50%'
                }} 
              />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                רחוב רוטשילד 79, פתח תקווה
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon 
                sx={{ 
                  mr: 1, 
                  fontSize: '1.2rem',
                  color: theme.palette.primary.main,
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  p: 0.5,
                  borderRadius: '50%'
                }} 
              />
              <Typography 
                variant="body1" 
                component="a" 
                href="tel:03-1234567" 
                sx={{ 
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': {
                    color: theme.palette.primary.main
                  }
                }}
              >
                03-1234567
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              מלונית במיקום מרכזי, חדרים מאובזרים עם מיזוג, טלוויזיה, Wi-Fi חינם ומקלחת פרטית.
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* הצגת החדרים - גלריה מינימליסטית */}
      <Box sx={{ 
        textAlign: 'center', 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        px: 2
      }}>
        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom
          sx={{
            fontWeight: 600,
            color: '#2c3e50',
            mb: 2
          }}
        >
          החדרים שלנו
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
          </Box>
        ) : rooms?.length > 0 ? (
          <Box sx={{ maxWidth: '850px', mx: 'auto', position: 'relative', width: '90%' }}>
            <Paper 
              elevation={2} 
              sx={{ 
                overflow: 'hidden', 
                mb: 2, 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}
            >
              {rooms[0] && rooms[0]?.images && Array.isArray(rooms[0]?.images) && rooms[0].images.length > 0 && (
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height={isMobile ? '200' : '300'}
                    image={rooms[0]?.images?.[currentImageIndex]?.url || 'https://via.placeholder.com/800x400?text=אין+תמונה'}
                    alt="חדר במלונית"
                    sx={{ 
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                      '&:hover': {
                        transform: 'scale(1.02)'
                      }
                    }}
                  />
                  {rooms[0]?.images && Array.isArray(rooms[0]?.images) && rooms[0].images.length > 1 && (
                    <>
                      <IconButton 
                        sx={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: 16, 
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          '&:hover': { 
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                            transform: 'translateY(-50%) scale(1.05)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                        onClick={handlePrevImage}
                      >
                        <ArrowForwardIcon />
                      </IconButton>
                      <IconButton 
                        sx={{ 
                          position: 'absolute', 
                          top: '50%', 
                          right: 16, 
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          '&:hover': { 
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                            transform: 'translateY(-50%) scale(1.05)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                        onClick={handleNextImage}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                      
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          bottom: 10, 
                          left: '50%', 
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: '4px'
                        }}
                      >
                        {rooms[0]?.images && Array.isArray(rooms[0].images) && rooms[0].images.map((_, idx) => (
                          <Box 
                            key={idx}
                            sx={{ 
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: idx === currentImageIndex ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.7)',
                              transition: 'all 0.2s ease'
                            }}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              )}
            </Paper>
          </Box>
        ) : (
          <Typography sx={{ color: '#475569' }}>לא נמצאו חדרים זמינים כרגע.</Typography>
        )}
      </Box>

      {/* צ'אט בוט */}
      <ChatBox />
    </Box>
  );
};

export default HomePage; 