import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography,
  styled,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import { 
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
  HomeWork as HomeIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Notes as NotesIcon,
  ArrowLeft as ArrowLeftIcon,
  Person as PersonIcon,
  Hotel as HotelIcon,
  Today as TodayIcon,
  InfoOutlined as InfoOutlinedIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import axios from 'axios';

// יצירת קומפוננטה מעוצבת לאייקון בסגנון iOS
const AppIconButton = styled(Paper)(({ theme, color }) => ({
  width: 60,
  height: 60,
  borderRadius: '28%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0.8),
  backgroundColor: color || theme.palette.primary.main,
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  transition: 'transform 0.15s, box-shadow 0.15s',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 5px 10px rgba(0,0,0,0.15)'
  }
}));

// קומפוננטה של כותרת מתחם
const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.primary
}));

// קומפוננטה של כרטיס חדר
const RoomCard = styled(Card)(({ theme, isOccupied }) => ({
  marginBottom: 6,
  borderRadius: 12,
  backgroundColor: isOccupied ? theme.palette.common.white : theme.palette.grey[50],
  border: isOccupied ? `1px solid ${theme.palette.grey[100]}` : 'none',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: isOccupied ? '0 2px 6px rgba(0,0,0,0.04)' : 'none',
  }
}));

// קומפוננטה לאייקון מספר חדר
const RoomNumberBadge = styled(({ isOccupied, isAirport, ...other }) => <Box {...other} />)(
  ({ theme, isOccupied, isAirport }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  borderRadius: '50%',
  backgroundColor: isOccupied 
    ? (isAirport ? '#f4a261' : '#4a90e2')
    : theme.palette.grey[200],
  color: isOccupied ? theme.palette.common.white : theme.palette.grey[600],
  fontWeight: 'bold',
  fontSize: '0.9rem',
  marginRight: 8,
  boxShadow: isOccupied ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
}));

const DashboardPage = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayDate, setTodayDate] = useState('');
  const [bookings, setBookings] = useState([]);
  const [simpleBookings, setSimpleBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // הגדרת מערכי החדרים
  const rothschildRooms = [1, 3, 4, 6, 13, 17, 21];
  const room106 = [106];
  const airportRooms = [2, 3, 5, 6, 7, 8];
  
  // הוספת אייקון להערות
  const NotesIcon = styled(InfoOutlinedIcon)({
    fontSize: '1rem',
  });
  
  // פונקציה לפירמוט מספר טלפון לקישור וואטסאפ
  const formatPhoneForWhatsapp = (phone) => {
    if (!phone) return '';
    // הסרת תווים שאינם ספרות
    return phone.replace(/\D/g, '');
  };
  
  // פונקציה לפירמוט תאריך
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  // פונקציה למעבר ליום הקודם
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };
  
  // פונקציה למעבר ליום הבא
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };
  
  // פונקציה לחזרה להיום
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // עדכון התאריך המוצג
  useEffect(() => {
    setTodayDate(formatDate(selectedDate));
  }, [selectedDate]);
  
  // פונקציה לטעינת נתוני ההזמנות
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // טעינת הזמנות רגילות ופשוטות במקביל
        const token = localStorage.getItem('token');
        
        console.log(`מתחיל לטעון הזמנות לתאריך ${formatDate(selectedDate)}...`);
        
        const [normalBookingsResponse, simpleBookingsResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/bookings`),
          axios.get(`/api/simple-bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        // סינון ההזמנות לתאריך הנבחר
        const targetDate = new Date(selectedDate);
        targetDate.setHours(0, 0, 0, 0);
        
        // עיבוד הזמנות רגילות
        const bookingsData = normalBookingsResponse.data.data || [];
        
        const filteredBookings = bookingsData.filter(booking => {
          // ודא שיש תאריך תקין בהזמנה
          if (!booking.checkIn) return false;
          
          const checkIn = new Date(booking.checkIn);
          checkIn.setHours(0, 0, 0, 0);
          
          const checkOut = new Date(booking.checkOut);
          checkOut.setHours(0, 0, 0, 0);
          
          // בדוק אם התאריך הנבחר בין תאריך הצ'ק-אין לצ'ק-אאוט
          return checkIn <= targetDate && targetDate < checkOut;
        });
        
        // עיבוד הזמנות פשוטות
        const simpleBookingsData = simpleBookingsResponse.data.simpleBookings || [];
        
        // קבלת הזמנות לתאריך הנבחר מתוך המבנה החדש
        const filteredSimpleBookings = simpleBookingsData
        .filter(booking => {
          try {
            // ודא שיש תאריך הזמנה תקין
            if (!booking.date) {
              return false;
            }
            
            // ודא שהתאריך חוקי
            const bookingDate = new Date(booking.date);
            if (isNaN(bookingDate.getTime())) {
              return false;
            }
            
            bookingDate.setHours(0, 0, 0, 0);
            
            // חישוב תאריך צ'ק אאוט לפי מספר הלילות
            const nights = booking.nights || 1;
            const checkOutDate = new Date(bookingDate);
            checkOutDate.setDate(checkOutDate.getDate() + nights);
            
            // בדוק אם התאריך הנבחר בטווח השהייה
            return bookingDate <= targetDate && targetDate < checkOutDate;
      } catch (error) {
            console.error('שגיאה בחישוב תאריכים:', error);
            return false;
          }
        })
        .map(booking => {
          return {
            ...booking,
            guestName: booking.guestName || '',
            guestPhone: booking.phone || '',
            location: booking.location,
            roomId: booking.roomId
          };
        });
        
        setBookings(filteredBookings);
        setSimpleBookings(filteredSimpleBookings);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('אירעה שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [selectedDate]);

  // בדיקת הזמנות לפני הרנדור
  useEffect(() => {
    if (!loading) {
      console.log(`=== בדיקת הזמנות לתאריך ${formatDate(selectedDate)} ===`);
      console.log("הזמנות רגילות:", bookings);
      console.log("הזמנות פשוטות:", simpleBookings);
      
      // בדיקה אם יש הזמנות לחדר 106
      const room106Booking = simpleBookings.find(b => String(b.roomId) === '106');
      console.log("הזמנה לחדר 106:", room106Booking);
      
      // בדיקה אם יש הזמנות לחדרי איירפורט
      const airportBookingsFound = simpleBookings.filter(b => 
        ['2', '3', '5', '6', '7', '8'].includes(String(b.roomId)) && 
        b.location !== 'רוטשילד'
      );
      console.log(`הזמנות לחדרי איירפורט בתאריך ${formatDate(selectedDate)}:`, airportBookingsFound);
    }
  }, [bookings, simpleBookings, loading, selectedDate, formatDate]);
  
  // הסכמה - שימוש במשתנים הקיימים לנוחות
  const rothschildBookings = bookings; // הזמנות רגילות לרוטשילד
  const airportBookings = simpleBookings; // הזמנות פשוטות
  
  // פונקציה למציאת הזמנה לחדר ספציפי
  const findBookingForRoom = (roomNumber, bookingsList, isAirport = false) => {
    // חדר 106 או Airport Guest House - צריך לחפש בהזמנות הפשוטות
    if (isAirport || roomNumber === 106) {
      // בדיקה פשוטה - מתבססת רק על מספר החדר
      const booking = simpleBookings.find(b => {
        // המרת מספרי החדר למחרוזות לשם ההשוואה
        const roomIdMatches = String(b.roomId) === String(roomNumber);
        
        // אם זה חדר 106 ולא חדר של איירפורט
        if (roomNumber === 106 && !isAirport) {
          return roomIdMatches;
        }
        
        // אם זה חדר של איירפורט
        if (isAirport) {
          return roomIdMatches;
        }
        
        return false;
      });
      
      return booking;
    }
    
    // חיפוש בהזמנות רגילות של רוטשילד (חדרים 1, 3, 4, 6, 13, 17, 21)
    return bookings.find(booking => booking.room && booking.room.roomNumber === roomNumber);
  };
  
  // פונקציה לקבלת פרטי האורח מהזמנה (רגילה או פשוטה)
  const getGuestDetails = (booking, isSimple = false) => {
    if (!booking) return { guestName: '', guestPhone: '', notes: '' };
    
    console.log('getGuestDetails קיבל הזמנה:', booking);
    
    // בדוק אם זו הזמנה פשוטה (לפי מבנה האובייקט)
    const isSimpleBooking = isSimple || 
      (booking.location !== undefined && booking.roomId !== undefined);
    
    if (isSimpleBooking) {
      // פרטים מהזמנה פשוטה
      console.log('מחזיר פרטים מהזמנה פשוטה');
      return {
        guestName: booking.guestName || '',
        guestPhone: booking.guestPhone || booking.phone || '',
        notes: booking.notes || ''
      };
    } else {
      // פרטים מהזמנה רגילה
      console.log('מחזיר פרטים מהזמנה רגילה');
      if (booking.guest) {
        return {
          guestName: booking.guest.firstName && booking.guest.lastName ? 
            `${booking.guest.firstName} ${booking.guest.lastName}` : 
            booking.guest.name || '',
          guestPhone: booking.guest.phone || '',
          notes: booking.notes || ''
        };
      }
      return { guestName: '', guestPhone: '', notes: '' };
    }
  };
  
  // פונקציה לבדיקה אם היום הוא יום הצ'ק אין
  const isCheckInToday = (booking, isSimple = false) => {
    if (!booking) return false;
    
    try {
      const targetDate = new Date(selectedDate);
      targetDate.setHours(0, 0, 0, 0);
      
      let checkInDate;
      
      if (isSimple) {
        // הזמנה פשוטה
        if (!booking.date) return false;
        checkInDate = new Date(booking.date);
      } else {
        // הזמנה רגילה
        if (!booking.checkIn) return false;
        checkInDate = new Date(booking.checkIn);
      }
      
      checkInDate.setHours(0, 0, 0, 0);
      
      // בדיקה אם תאריך הצ'ק אין הוא התאריך המבוקש
      return checkInDate.getTime() === targetDate.getTime();
    } catch (error) {
      console.error('שגיאה בבדיקת תאריך צ\'ק אין:', error);
      return false;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1, sm: 2 } }}>
      {/* אייקונים בסגנון iOS */}
      <Grid 
        container 
        justifyContent="center" 
        spacing={3} 
            sx={{
          mb: 4,
          mt: 2,
          px: { xs: 0, sm: 1 },
          '& > .MuiGrid-item': {
            px: { xs: 1, sm: 2 }
          }
        }}
      >
        <Grid item>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AppIconButton
              component={Link}
              to="/dashboard/bookings-calendar"
              color="#2980b9" 
            >
              <CalendarIcon sx={{ fontSize: 32, color: 'white', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} />
            </AppIconButton>
            <Typography variant="body2" sx={{ mt: 1, fontSize: '0.8rem', fontWeight: 500, color: '#555', textAlign: 'center' }}>
              יומן
            </Typography>
          </Box>
        </Grid>

        <Grid item>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AppIconButton
              component={Link}
              to="/dashboard/simple-bookings"
              color="#e74c3c" 
            >
              <HomeIcon sx={{ fontSize: 32, color: 'white', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} />
            </AppIconButton>
            <Typography variant="body2" sx={{ mt: 1, fontSize: '0.8rem', fontWeight: 500, color: '#555', textAlign: 'center' }}>
              Airport / 106<br/>Guest House
            </Typography>
          </Box>
        </Grid>
        
        <Grid item>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AppIconButton
              component={Link}
              to="/dashboard/rooms"
              color="#8e44ad" 
            >
              <SettingsIcon sx={{ fontSize: 32, color: 'white', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} />
            </AppIconButton>
            <Typography variant="body2" sx={{ mt: 1, fontSize: '0.8rem', fontWeight: 500, color: '#555', textAlign: 'center' }}>
              הגדרות
            </Typography>
          </Box>
        </Grid>

        <Grid item>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AppIconButton
              component={Link}
              to="/"
              color="#2ecc71" 
            >
              <LanguageIcon sx={{ fontSize: 32, color: 'white', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} />
            </AppIconButton>
            <Typography variant="body2" sx={{ mt: 1, fontSize: '0.8rem', fontWeight: 500, color: '#555', textAlign: 'center' }}>
              אתר הבית
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* רשימת אורחים להיום */}
      <Box sx={{ mt: 3, mb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress size={36} sx={{ color: '#0066ff' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : (
          <Grid container spacing={2.5}>
            {/* עמודת רוטשילד 79 */}
        <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionTitle>
                  <HotelIcon sx={{ mr: 0.8, fontSize: '1.1rem', color: '#4a90e2' }} />
                  רוטשילד 79
                </SectionTitle>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    size="small" 
                    onClick={goToPreviousDay}
                    sx={{ 
                      color: '#4a90e2', 
                      bgcolor: 'rgba(74, 144, 226, 0.05)',
                      '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.1)' },
                      width: 24,
                      height: 24,
                      mr: 0.8
                    }}
                  >
                    <ArrowLeftIcon sx={{ fontSize: '0.9rem', transform: 'rotate(180deg)' }} />
                  </IconButton>
                  
                  <Chip 
                    label={todayDate}
                    sx={{ 
                      bgcolor: '#4a90e2', 
                      color: 'white', 
                      fontWeight: 500,
                      borderRadius: '16px',
                      boxShadow: '0px 1px 2px rgba(0,0,0,0.08)',
                      fontSize: '0.75rem',
                      height: '24px'
                    }}
                    size="small"
                    icon={<TodayIcon sx={{ color: 'white !important', fontSize: '0.8rem' }} />}
                    onClick={goToToday}
                  />
                  
                  <IconButton 
                    size="small" 
                    onClick={goToNextDay}
                    sx={{ 
                      color: '#4a90e2', 
                      bgcolor: 'rgba(74, 144, 226, 0.05)',
                      '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.1)' },
                      width: 24,
                      height: 24,
                      ml: 0.8
                    }}
                  >
                    <ArrowLeftIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Box>
              </Box>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  pb: 1.5,
                  bgcolor: 'white',
                  border: '1px solid rgba(0,0,0,0.05)',
                  borderRadius: 3,
                  boxShadow: '0px 1px 6px rgba(0,0,0,0.02)'
                }}
              >
                <Box sx={{ mt: 1 }}>
                  {/* חדרי רוטשילד הרגילים */}
                  {rothschildRooms.map(roomNumber => {
                    const booking = findBookingForRoom(roomNumber, rothschildBookings);
                    const isOccupied = !!booking;
                    const isCheckinToday = isCheckInToday(booking, false);
                    const { guestName, guestPhone, notes } = getGuestDetails(booking);

                    return (
                      <RoomCard key={`roth-${roomNumber}`} isOccupied={isOccupied}>
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                              <RoomNumberBadge isOccupied={isOccupied} isAirport={false}>
                                {roomNumber}
                              </RoomNumberBadge>
                              
                              {isOccupied && (
                                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, overflow: 'hidden' }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 600, 
                                      mr: 1.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis', 
                                      whiteSpace: 'nowrap',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    {guestName}
                                  </Typography>
                                  
                                  {guestPhone && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          color: 'rgba(0,0,0,0.5)',
                                          fontSize: '0.75rem',
                                          direction: 'ltr',
                                          display: 'inline-block',
                                          letterSpacing: '0.02em'
                                        }}
                                      >
                                        {guestPhone}
                                      </Typography>
                                      
                                      <Tooltip title="שלח הודעת וואטסאפ">
                                        <IconButton 
                                          size="small" 
                                          component="a"
                                          href={`https://wa.me/${formatPhoneForWhatsapp(guestPhone)}`}
                                          target="_blank"
                                          sx={{ 
                                            bgcolor: '#25D366', 
                                            color: 'white', 
                                            p: 0.2,
                                            ml: 0.5,
                                            minWidth: 18,
                                            width: 18,
                                            height: 18,
                                            '&:hover': { bgcolor: '#1fb655' }
                                          }}
                                        >
                                          <WhatsAppIcon sx={{ fontSize: '0.7rem' }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  )}
                                </Box>
                              )}
                            </Box>

                            {isOccupied ? (
                              isCheckinToday ? (
                                <Chip 
                                  size="small" 
                                  label="צ'ק אין היום" 
                                  sx={{ 
                                    bgcolor: 'rgba(74, 144, 226, 0.9)',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 20,
                                    borderRadius: '10px',
                                    fontWeight: 500
                                  }} 
                                />
                              ) : (
                                <Chip 
                                  size="small" 
                                  label="מאוכלס" 
                                  sx={{ 
                                    bgcolor: 'rgba(76, 175, 80, 0.9)',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 20,
                                    minWidth: 45,
                                    borderRadius: '10px',
                                    fontWeight: 500
                                  }} 
                                />
                              )
                            ) : (
                              <Chip 
                                size="small" 
                                label="פנוי" 
                                sx={{ 
                                  bgcolor: '#f5f5f5',
                                  color: '#888',
                                  fontSize: '0.7rem',
                                  height: 20,
                                  minWidth: 45,
                                  borderRadius: '10px',
                                  fontWeight: 500
                                }} 
                              />
                            )}
      </Box>

                          {isOccupied && notes && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 0.5 }}>
                              <NotesIcon sx={{ fontSize: '0.8rem', mr: 0.5, mt: 0.2, color: 'rgba(0,0,0,0.4)' }} />
                              <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.75rem' }}>
                                {notes}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </RoomCard>
                    );
                  })}
                  
                  {/* חדר 106 המיוחד */}
                  {room106.map(roomNumber => {
                    const booking = findBookingForRoom(roomNumber, null, false);
                    const isOccupied = !!booking;
                    const isCheckinToday = isCheckInToday(booking, true);
                    const { guestName, guestPhone, notes } = getGuestDetails(booking, true);

                    return (
                      <RoomCard key={`special-${roomNumber}`} isOccupied={isOccupied}>
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                              <RoomNumberBadge isOccupied={isOccupied} isAirport={false}>
                                {roomNumber}
                              </RoomNumberBadge>
                              
                              {isOccupied && (
                                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, overflow: 'hidden' }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 600, 
                                      mr: 1.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis', 
                                      whiteSpace: 'nowrap',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    {guestName}
                                  </Typography>
                                  
                                  {guestPhone && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          color: 'rgba(0,0,0,0.5)',
                                          fontSize: '0.75rem',
                                          direction: 'ltr',
                                          display: 'inline-block',
                                          letterSpacing: '0.02em'
                                        }}
                                      >
                                        {guestPhone}
          </Typography>
                                      
                                      <Tooltip title="שלח הודעת וואטסאפ">
                                        <IconButton 
                                          size="small" 
                                          component="a"
                                          href={`https://wa.me/${formatPhoneForWhatsapp(guestPhone)}`}
                                          target="_blank"
                                          sx={{ 
                                            bgcolor: '#25D366', 
                                            color: 'white', 
                                            p: 0.2,
                                            ml: 0.5,
                                            minWidth: 18,
                                            width: 18,
                                            height: 18,
                                            '&:hover': { bgcolor: '#1fb655' }
                                          }}
                                        >
                                          <WhatsAppIcon sx={{ fontSize: '0.7rem' }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  )}
                                </Box>
                              )}
                            </Box>
                            
                            {isOccupied ? (
                              isCheckinToday ? (
                                <Chip 
                                  size="small" 
                                  label="צ'ק אין היום" 
                                  sx={{ 
                                    bgcolor: 'rgba(74, 144, 226, 0.9)',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 20,
                                    borderRadius: '10px',
                                    fontWeight: 500
                                  }} 
                                />
                              ) : (
                                <Chip 
                                  size="small" 
                                  label="מאוכלס" 
                                  sx={{ 
                                    bgcolor: 'rgba(76, 175, 80, 0.9)',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 20,
                                    minWidth: 45,
                                    borderRadius: '10px',
                                    fontWeight: 500
                                  }} 
                                />
                              )
                            ) : (
                              <Chip 
                                size="small" 
                                label="פנוי" 
                                sx={{ 
                                  bgcolor: '#f5f5f5',
                                  color: '#888',
                                  fontSize: '0.7rem',
                                  height: 20,
                                  minWidth: 45,
                                  borderRadius: '10px',
                                  fontWeight: 500
                                }} 
                              />
                            )}
                          </Box>
                          
                          {isOccupied && notes && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 0.5 }}>
                              <NotesIcon sx={{ fontSize: '0.8rem', mr: 0.5, mt: 0.2, color: 'rgba(0,0,0,0.4)' }} />
                              <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.75rem' }}>
                                {notes}
      </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </RoomCard>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
            
            {/* עמודת Airport Guest House */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionTitle>
                  <HomeIcon sx={{ mr: 0.8, fontSize: '1.1rem', color: '#f4a261' }} />
                  Airport Guest House
                </SectionTitle>
                
                <Box sx={{ display: 'flex', alignItems: 'center', visibility: 'hidden' }}>
                  <IconButton 
                    size="small" 
                    sx={{ 
                      width: 24,
                      height: 24,
                      mr: 0.8
                    }}
                    disabled
                  >
                    <ArrowLeftIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                  
                  <Chip 
                    label={todayDate}
                    sx={{ 
                      bgcolor: '#f4a261', 
                      color: 'white', 
                      fontWeight: 500,
                      borderRadius: '16px',
                      fontSize: '0.75rem',
                      height: '24px'
                    }}
                    size="small"
                    icon={<TodayIcon sx={{ color: 'white !important', fontSize: '0.8rem' }} />}
                  />
                  
                  <IconButton
                    size="small" 
                    sx={{ 
                      width: 24,
                      height: 24,
                      ml: 0.8
                    }}
                    disabled
                  >
                    <ArrowLeftIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Box>
              </Box>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  pb: 1.5,
                  bgcolor: 'white',
                  border: '1px solid rgba(0,0,0,0.05)',
                  borderRadius: 3,
                  boxShadow: '0px 1px 6px rgba(0,0,0,0.02)'
                }}
              >
                <Box sx={{ mt: 1 }}>
                  {airportRooms.map(roomNumber => {
                    const booking = findBookingForRoom(roomNumber, null, true);
                    const isOccupied = !!booking;
                    const isCheckinToday = isCheckInToday(booking, true);
                    const { guestName, guestPhone, notes } = getGuestDetails(booking, true);

                    return (
                      <RoomCard key={`airport-${roomNumber}`} isOccupied={isOccupied}>
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                              <RoomNumberBadge isOccupied={isOccupied} isAirport={true}>
                                {roomNumber}
                              </RoomNumberBadge>
                              
                              {isOccupied && (
                                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, overflow: 'hidden' }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 600, 
                                      mr: 1.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis', 
                                      whiteSpace: 'nowrap',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    {guestName}
                                  </Typography>
                                  
                                  {guestPhone && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          color: 'rgba(0,0,0,0.5)',
                                          fontSize: '0.75rem',
                                          direction: 'ltr',
                                          display: 'inline-block',
                                          letterSpacing: '0.02em'
                                        }}
                                      >
                                        {guestPhone}
                                      </Typography>
                                      
                                      <Tooltip title="שלח הודעת וואטסאפ">
                                        <IconButton 
            size="small" 
                                          component="a"
                                          href={`https://wa.me/${formatPhoneForWhatsapp(guestPhone)}`}
                                          target="_blank"
                                          sx={{ 
                                            bgcolor: '#25D366', 
                                            color: 'white', 
                                            p: 0.2,
                                            ml: 0.5,
                                            minWidth: 18,
                                            width: 18,
                                            height: 18,
                                            '&:hover': { bgcolor: '#1fb655' }
                                          }}
                                        >
                                          <WhatsAppIcon sx={{ fontSize: '0.7rem' }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  )}
                                </Box>
                              )}
                            </Box>
                            
                            {isOccupied ? (
                              isCheckinToday ? (
                                <Chip 
                                  size="small" 
                                  label="צ'ק אין היום" 
                                  sx={{ 
                                    bgcolor: 'rgba(74, 144, 226, 0.9)',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 20,
                                    borderRadius: '10px',
                                    fontWeight: 500
                                  }} 
                                />
                              ) : (
                                <Chip 
                                  size="small" 
                                  label="מאוכלס" 
                                  sx={{ 
                                    bgcolor: 'rgba(76, 175, 80, 0.9)',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 20,
                                    minWidth: 45,
                                    borderRadius: '10px',
                                    fontWeight: 500
                                  }} 
                                />
                              )
                            ) : (
                              <Chip 
                                size="small" 
                                label="פנוי" 
                                sx={{ 
                                  bgcolor: '#f5f5f5',
                                  color: '#888',
                                  fontSize: '0.7rem',
                                  height: 20,
                                  minWidth: 45,
                                  borderRadius: '10px',
                                  fontWeight: 500
                                }} 
                              />
                            )}
                          </Box>
                          
                          {isOccupied && notes && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 0.5 }}>
                              <NotesIcon sx={{ fontSize: '0.8rem', mr: 0.5, mt: 0.2, color: 'rgba(0,0,0,0.4)' }} />
                              <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.75rem' }}>
                                {notes}
      </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </RoomCard>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default DashboardPage; 