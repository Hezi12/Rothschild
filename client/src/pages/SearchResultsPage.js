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
  IconButton,
  Badge,
  Drawer,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  Container,
  Snackbar
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
  Hotel as HotelIcon,
  ShoppingCart as CartIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Tv as TvIcon,
  Kitchen as KitchenIcon,
  Bathtub as BathtubIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [roomsList, setRoomsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // קבלת הנתונים מהמצב של הניווט
  const checkIn = location.state?.checkIn;
  const checkOut = location.state?.checkOut;
  const guestsParam = location.state?.guests;
  const guests = Number(guestsParam) || 1;
  const roomsCount = location.state?.rooms || 1;
  const isTourist = location.state?.isTourist || false;
  
  useEffect(() => {
    // אם אין תאריכים, חזור לדף הבית
    if (!checkIn || !checkOut) {
      navigate('/');
      return;
    }
    
    const fetchAvailableRooms = async () => {
      try {
        setLoading(true);
        
        console.log('שולח בקשה לבדיקת זמינות עם הפרמטרים:', {
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          guests: guests,
          rooms: roomsCount,
          isTourist: isTourist
        });
        
        console.log('סוג של guests:', typeof guests, 'ערך:', guests);
        
        // שליחת בקשה לבדיקת זמינות אמיתית מול השרת
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/rooms/check-availability`, {
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          guests: guests,
          rooms: roomsCount,
          isTourist: isTourist
        });
        
        console.log('תשובה מהשרת:', response.data);
        
        let availableRooms = response.data.data || [];
        
        // וידוא שיש לנו מערך
        if (!Array.isArray(availableRooms)) {
          if (availableRooms && typeof availableRooms === 'object') {
            // אם קיבלנו אובייקט בודד במקום מערך, הפוך אותו למערך
            availableRooms = [availableRooms];
          } else {
            // אם אין נתונים תקינים, הגדר כמערך ריק
            availableRooms = [];
          }
        }
        
        // סינון נוסף בצד הקליינט למקרה שהשרת לא סינן נכון
        // צריך להיות רק חדר אחד מכל סוג עבור 1-2 אורחים
        if (guests <= 2 && roomsCount === 1) {
          console.log('מבצע סינון נוסף בצד הקליינט עבור 1-2 אורחים');
          
          // מפה לשמירת החדר הזול ביותר מכל סוג
          const roomTypeMap = {};
          
          // עבור על כל החדרים ושמור את הזול ביותר מכל סוג
          availableRooms.forEach(room => {
            if (!roomTypeMap[room.type] || room.totalPrice < roomTypeMap[room.type].totalPrice) {
              roomTypeMap[room.type] = room;
            }
          });
          
          // המר את המפה בחזרה למערך
          availableRooms = Object.values(roomTypeMap);
          
          // מיין לפי מחיר
          availableRooms.sort((a, b) => a.totalPrice - b.totalPrice);
          
          console.log('לאחר סינון נוסף בקליינט נשארו:', availableRooms.length, 'חדרים');
        }
        
        // עדכון רשימת החדרים הזמינים
        setRoomsList(availableRooms);
        
        console.log('מספר חדרים שהתקבלו:', availableRooms.length);
        console.log('סוגי חדרים שהתקבלו:', availableRooms.map(room => ({ 
          roomNumber: room.roomNumber, 
          type: room.type, 
          maxGuests: room.maxOccupancy,
          totalPrice: room.totalPrice
        })));
      } catch (error) {
        console.error('שגיאה בטעינת חדרים זמינים:', error);
        setError('שגיאה בטעינת החדרים הזמינים. אנא נסה שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailableRooms();
  }, [checkIn, checkOut, guests, roomsCount, isTourist, navigate]);
  
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
        rooms: roomsCount,
        isTourist: isTourist
      } 
    });
  };

  // פונקציה להצגת הודעות
  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // פונקציה לסגירת הודעות
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // טיפול בבחירת חדרים
  const handleSelectRoom = (room) => {
    setSelectedRooms(prev => {
      // בדיקה אם החדר כבר קיים ברשימה
      const isSelected = prev.some(selectedRoom => selectedRoom._id === room._id);
      
      if (isSelected) {
        // אם החדר כבר נבחר, הסר אותו מהרשימה
        return prev.filter(selectedRoom => selectedRoom._id !== room._id);
      } else {
        // אם החדר לא נבחר, הוסף אותו לרשימה
        // אבל נוודא שלא חורגים ממספר החדרים המוגדר
        if (prev.length < roomsCount) {
          return [...prev, room];
        } else {
          // שימוש ב-showMessage במקום toast.warning
          showMessage(`ניתן לבחור מקסימום ${roomsCount} חדרים. עדכן את מספר החדרים כדי לבחור יותר.`, 'warning');
          return prev;
        }
      }
    });
  };

  // המשך לדף ההזמנה עם כל החדרים שנבחרו
  const handleContinueBooking = () => {
    if (selectedRooms.length === 0) {
      // שימוש ב-showMessage במקום toast.error
      showMessage('אנא בחר לפחות חדר אחד להזמנה', 'error');
      return;
    }
    
    // אם נבחר רק חדר אחד, עבור ישירות לדף ההזמנה עם החדר הזה
    if (selectedRooms.length === 1) {
      navigate('/booking', { 
        state: { 
          roomId: selectedRooms[0]._id,
          checkIn,
          checkOut,
          guests,
          rooms: roomsCount,
          isTourist: isTourist
        } 
      });
      return;
    }
    
    // אם נבחרו יותר מחדר אחד, עבור לדף הזמנה מרובת חדרים
    navigate('/booking', { 
      state: { 
        selectedRooms: selectedRooms.map(room => room._id),
        checkIn,
        checkOut,
        guests,
        rooms: selectedRooms.length,
        isTourist: isTourist
      } 
    });
  };

  // מיפוי של האייקונים לפי סוג האמנטי
  const amenityIcons = {
    'מיזוג אוויר': <AcIcon fontSize="small" />,
    'אינטרנט אלחוטי': <WifiIcon fontSize="small" />,
    'wifi': <WifiIcon fontSize="small" />,
    'חניה': <ParkingIcon fontSize="small" />,
    'parking': <ParkingIcon fontSize="small" />,
    'מיטה זוגית': <KingBedIcon fontSize="small" />,
    'טלוויזיה': <TvIcon fontSize="small" />,
    'מקרר': <KitchenIcon fontSize="small" />,
    'מקלחת': <BathtubIcon fontSize="small" />,
    'שירותים': <BathtubIcon fontSize="small" />
  };

  // פונקציה עזר להצגת אייקון מתאים לכל אמנטי
  const getAmenityIcon = (amenity) => {
    return amenityIcons[amenity] || <SquareIcon fontSize="small" />;
  };
  
  // פונקציה לחישוב תאריך הביטול
  const calculateCancellationDate = () => {
    if (!checkIn) return '';
    const cancellationDate = new Date(checkIn);
    cancellationDate.setDate(cancellationDate.getDate() - 3);
    return formatDate(cancellationDate);
  };
  
  const typeToDisplayName = {
    'standard': 'Standard',
    'deluxe': 'Deluxe',
    'suite': 'Suite',
    'simple': 'Simple',
    'simple_room': 'Simple',
    'standard_room': 'Standard',
    'deluxe_room': 'Deluxe',
    'suite_room': 'Suite',
    'family': 'Family',
    'family_room': 'Family'
  };
  
  // פונקציה לקבלת שם תצוגה עבור סוג החדר
  const getRoomDisplayName = (room) => {
    if (typeToDisplayName[room.type]) {
      return typeToDisplayName[room.type];
    } else if (room.name) {
      return room.name;
    } else if (room.type) {
      // המרה של snake_case או camelCase לטקסט מרווח עם אות ראשונה גדולה
      return room.type
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^\w/, c => c.toUpperCase());
    } else {
      return 'Standard'; // ברירת מחדל
    }
  };
  
  // רנדור של כפתור "המשך להזמנה" והמידע על חדרים שנבחרו
  const renderBookingButton = () => {
    // מחזיר null כדי לא להציג את הסרגל התחתון בכלל
    return null;
    
    /* 
    // הקוד המקורי מושבת:
    return (
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: 'background.paper',
          boxShadow: '0px -2px 10px rgba(0,0,0,0.1)',
          padding: { xs: 2, sm: 3 },
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ mb: { xs: 2, sm: 0 } }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {selectedRooms.length > 0 
                  ? `נבחרו ${selectedRooms.length} חדרים מתוך ${roomsCount}`
                  : 'לא נבחרו חדרים עדיין'
                }
              </Typography>
              {selectedRooms.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {selectedRooms.map(room => `חדר ${room.roomNumber} (${room.type})`).join(', ')}
                </Typography>
              )}
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              size="large"
              disabled={selectedRooms.length === 0}
              onClick={handleContinueBooking}
              startIcon={<HotelIcon />}
              sx={{ 
                fontWeight: 'bold',
                px: 4,
                borderRadius: '30px'
              }}
            >
              המשך להזמנה
            </Button>
          </Box>
        </Container>
      </Box>
    );
    */
  };

  // רנדור הכרטיסים של החדרים עם האפשרות לבחירה
  const renderRooms = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/')} sx={{ mt: 2 }}>
            חזרה לדף הבית
          </Button>
        </Box>
      );
    }

    if (roomsList.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <InfoIcon sx={{ fontSize: 60, mb: 2, color: 'text.secondary' }} />
          <Typography variant="h6" gutterBottom>
            לא נמצאו חדרים זמינים בתאריכים שבחרת
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/')} sx={{ mt: 2 }}>
            נסה תאריכים אחרים
          </Button>
        </Box>
      );
    }

    return (
      <Grid container spacing={4}>
        {roomsList.map((room) => (
          <Grid item xs={12} sm={6} md={4} key={room._id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6,
                },
                border: selectedRooms.some(r => r._id === room._id) ? `2px solid ${theme.palette.success.main}` : 'none',
              }}
            >
              {/* סימון לחדרים שנבחרו */}
              {selectedRooms.some(r => r._id === room._id) && (
                <Chip
                  icon={<CheckIcon />}
                  label="נבחר"
                  color="primary"
                  size="small"
                  sx={{ 
                    position: 'absolute', 
                    top: 10, 
                    right: 10, 
                    zIndex: 10,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
              )}
              
              {room.images && room.images.length > 0 ? (
                <CardMedia
                  component="img"
                  height={180}
                  image={room.images.find(img => img.isPrimary)?.url || room.images[0].url}
                  alt={`תמונה של ${room.name || getRoomDisplayName(room) || 'חדר'}`}
                  sx={{ objectFit: 'cover' }}
                />
              ) : (
                <Box sx={{ 
                  height: 180, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'grey.100'
                }}>
                  <HotelIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                </Box>
              )}
              
              <CardContent sx={{ 
                flexGrow: 1, 
                pb: 0,
                px: 1.7,
                pt: 1.7
              }}>
                <Typography 
                  variant="h6" 
                  component="h2" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    pb: 0.5,
                    mb: 1.2,
                    display: 'inline-block'
                  }}
                >
                  {getRoomDisplayName(room)}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 0.7, flexWrap: 'wrap', mb: 1.2 }}>
                  {room.amenities && room.amenities.slice(0, 4).map((amenity, index) => {
                    // המרת מיזוג אוויר למיטה זוגית בתצוגה בלבד אם צריך
                    const displayText = amenity === "מיזוג אוויר" ? "מיטה זוגית" : amenity;
                    const displayIcon = amenity === "מיזוג אוויר" 
                      ? amenityIcons["מיטה זוגית"] 
                      : getAmenityIcon(amenity);
                    
                    return (
                      <Chip
                        key={index}
                        icon={displayIcon}
                        label={displayText}
                        size="small"
                        sx={{ 
                          fontSize: '0.7rem', 
                          height: '22px',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    );
                  })}
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 1.5,
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    minHeight: '2.4em',
                    fontSize: '0.8rem',
                    lineHeight: 1.2
                  }}
                >
                  {room.description}
                </Typography>
                
                {/* מדיניות ביטול בקצרה */}
                <Box sx={{ 
                  mb: 1.5, 
                  p: 0.8, 
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  borderRadius: 1,
                  border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      fontSize: '0.7rem',
                      color: theme.palette.info.dark
                    }}
                  >
                    <InfoIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.8rem' }} />
                    <b>מדיניות ביטול: </b> ביטול חינם עד {calculateCancellationDate()}
                  </Typography>
                </Box>
                
                <Grid container spacing={1} alignItems="center" sx={{ mt: 'auto' }}>
                  <Grid item xs={6}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      מחיר ללילה:
                      {isTourist && (
                        <Typography 
                          component="span" 
                          sx={{ 
                            display: 'block', 
                            fontSize: '0.65rem', 
                            color: 'success.main',
                            fontWeight: 'medium'
                          }}
                        >
                          (פטור ממע״מ)
                        </Typography>
                      )}
                    </Typography>
                    <Box sx={{ mt: 0.3 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: theme.palette.primary.main,
                          fontSize: '1.1rem'
                        }}
                      >
                        ₪{isTourist 
                          ? (room.nightsTotal ? Math.round(room.nightsTotal / calculateNights()) : room.basePrice) 
                          : (room.totalPrice ? Math.round(room.totalPrice / calculateNights()) : Math.round((room.basePrice || 0) * 1.18))}
                      </Typography>
                      {!isTourist && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ display: 'block', fontSize: '0.65rem' }}
                        >
                          כולל מע״מ (18%)
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.7 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/room/${room._id}`, {
                          state: {
                            checkIn,
                            checkOut,
                            guests
                          }
                        })}
                        sx={{ 
                          borderRadius: '50px',
                          px: 2,
                          py: 0.4,
                          fontSize: '0.75rem',
                          fontWeight: 'medium',
                          flexGrow: 1,
                          minWidth: 0
                        }}
                      >
                        פרטים
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color={selectedRooms.some(r => r._id === room._id) ? "success" : "primary"}
                        onClick={() => handleSelectRoom(room)}
                        sx={{ 
                          borderRadius: '50px',
                          px: 1.5,
                          py: 0.4,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          flexGrow: 1,
                          minWidth: 0
                        }}
                      >
                        {selectedRooms.some(r => r._id === room._id) ? "נבחר ✓" : "בחר"}
                      </Button>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'flex-end', 
                      mt: 0.7,
                      color: 'text.primary', 
                      fontWeight: 'medium',
                      fontSize: '0.75rem'
                    }}>
                      {Array.from({ length: room.maxGuests || guests }).map((_, index) => (
                        <PersonIcon key={index} sx={{ fontSize: '0.85rem', color: theme.palette.primary.main }} />
                      ))}
                      <span style={{ marginRight: '3px' }}>{room.maxGuests || guests} אורחים</span>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ 
      py: 3,
      px: { xs: 2, sm: 2, md: 3 },
      maxWidth: '1300px',
      mx: 'auto'
    }}>
      {/* פרטי החיפוש והחדרים שנבחרו */}
      <Paper 
        elevation={2}
        sx={{ 
          p: { xs: 2, sm: 2.5 }, 
          mb: 3, 
          maxWidth: '850px', 
          mx: 'auto',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* כותרת האריח */}
        <Box 
          sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.07),
            mx: -2.5,
            mt: -2.5,
            mb: 2,
            p: 1.5,
            px: 2.5,
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{ 
              color: theme.palette.primary.dark,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <CalendarIcon fontSize="small" />
            פרטי החיפוש והבחירה שלך
          </Typography>
        </Box>
        
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} sm={6}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'space-between',
              pr: { xs: 0, sm: 2 },
              borderRight: { xs: 'none', sm: `1px solid ${alpha(theme.palette.divider, 0.7)}` }
            }}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  color="primary"
                  fontWeight="bold"
                  sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.7 }}
                >
                  <CalendarIcon fontSize="small" />
                  תאריכי שהייה ({calculateNights()} לילות):
                </Typography>
                
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 1.5,
                  mx: 1
                }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                      צ'ק אין:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" fontSize="0.95rem">
                      {formatDate(checkIn)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: 'text.secondary',
                    px: 1.5
                  }}>
                    <BackIcon fontSize="small" />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontSize="0.75rem" align="right">
                      צ'ק אאוט:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" fontSize="0.95rem" align="right">
                      {formatDate(checkOut)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<BackIcon fontSize="small" />}
                  onClick={() => navigate('/')}
                  sx={{ 
                    borderRadius: '50px',
                    px: 2,
                    py: 0.6,
                    fontSize: '0.8rem',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  שנה חיפוש
                </Button>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1
              }}>
                <Typography 
                  variant="subtitle2" 
                  color="primary"
                  fontWeight="bold"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}
                >
                  <CartIcon fontSize="small" />
                  חדרים נבחרים:
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5, 
                  fontSize: '0.85rem',
                  color: theme.palette.text.secondary
                }}>
                  <PersonIcon fontSize="small" color="primary" sx={{ fontSize: '1rem' }} />
                  {guests} {guests === 1 ? 'אורח' : 'אורחים'} 
                  {roomsCount > 1 && <> • {roomsCount} חדרים</>}
                </Box>
              </Box>
              
              {/* אזור הצגת החדרים הנבחרים */}
              <Box>
                {selectedRooms.length === 0 ? (
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      textAlign: 'center', 
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                      borderRadius: 1,
                      border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: '90px'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mb: 0.5, fontSize: '0.85rem' }}
                    >
                      טרם נבחרו חדרים
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem', maxWidth: '220px' }}
                    >
                      לחץ על כפתור "בחר" בחדרים שברצונך להזמין
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ 
                      maxHeight: '120px', 
                      overflowY: 'auto',
                      mb: 1.5,
                      pr: 1
                    }}>
                      <List dense disablePadding>
                        {selectedRooms.map((room) => (
                          <ListItem 
                            key={room._id} 
                            disablePadding
                            sx={{ 
                              mb: 0.7, 
                              bgcolor: alpha(theme.palette.primary.light, 0.08),
                              borderRadius: 1,
                              py: 0.7,
                              border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`
                            }}
                          >
                            <ListItemAvatar sx={{ minWidth: '45px' }}>
                              <Avatar 
                                sx={{ 
                                  width: 30, 
                                  height: 30,
                                  bgcolor: theme.palette.primary.main
                                }}
                              >
                                <HotelIcon fontSize="small" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  חדר {getRoomDisplayName(room)}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {room.nightsTotal ? 
                                    `${room.nightsTotal} ₪ ל-${calculateNights()} לילות` : 
                                    `${room.basePrice * calculateNights()} ₪ ל-${calculateNights()} לילות`
                                  }
                                </Typography>
                              }
                              sx={{ margin: 0 }}
                            />
                            <IconButton 
                              size="small" 
                              onClick={() => handleSelectRoom(room)}
                              sx={{ mr: 0.5 }}
                            >
                              <BackIcon fontSize="small" />
                            </IconButton>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="medium"
                        onClick={handleContinueBooking}
                        endIcon={<ArrowBackIcon />}
                        sx={{ 
                          borderRadius: '50px',
                          px: 2.5, 
                          py: 0.6,
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          boxShadow: 1
                        }}
                      >
                        המשך להזמנה {selectedRooms.length > 0 && `(${selectedRooms.length})`}
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* כותרת החדרים הזמינים */}
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
      
      {renderRooms()}
      
      {/* הוספת Snackbar להצגת הודעות */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SearchResultsPage; 