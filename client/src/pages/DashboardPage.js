import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Hotel as HotelIcon,
  EventNote as BookingIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalRooms: 0,
    activeBookings: 0,
    upcomingBookings: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // קבלת סטטיסטיקות
        const roomsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
        const bookingsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/bookings`);
        
        const rooms = roomsResponse.data.data;
        const bookings = bookingsResponse.data.data;
        
        console.log('נטענו הזמנות לדשבורד:', bookings);
        
        const today = new Date();
        const activeBookings = bookings.filter(booking => 
          new Date(booking.checkOut) >= today
        );
        
        const upcomingBookings = bookings.filter(booking => 
          new Date(booking.checkIn) > today
        );
        
        setStats({
          totalRooms: rooms.length,
          activeBookings: activeBookings.length,
          upcomingBookings: upcomingBookings.length
        });
        
        // קבלת ההזמנות האחרונות (5 הזמנות)
        setRecentBookings(bookings.slice(0, 5));
      } catch (error) {
        console.error('שגיאה בטעינת נתוני הדשבורד:', error);
        toast.error('שגיאה בטעינת נתוני הדשבורד');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  const getRoomDisplayText = (booking) => {
    let roomText = '';
    
    // הצגת חדר או חדרים
    if (booking.room) {
      roomText = `חדר ${booking.room.internalName || booking.room.roomNumber || 'לא ידוע'}`;
    } else if (booking.rooms && booking.rooms.length > 0) {
      roomText = `הזמנה מרובת חדרים (${booking.rooms.length} חדרים)`;
    } else {
      roomText = 'חדר לא מוגדר';
    }
    
    // הוספת תאריכי צ'ק-אין וצ'ק-אאוט
    let dates = '';
    if (booking.checkIn && booking.checkOut) {
      dates = ` | צ'ק-אין: ${formatDate(booking.checkIn)} | צ'ק-אאוט: ${formatDate(booking.checkOut)}`;
    }
    
    return roomText + dates;
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          דשבורד ניהול
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          שלום, {user?.name || 'מנהל'}! ברוך הבא למערכת הניהול של מלונית רוטשילד 79.
        </Typography>
      </Box>

      {/* כרטיסי סטטיסטיקה */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'primary.light',
              color: 'white'
            }}
          >
            <HotelIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5" component="div">
              {loading ? '...' : stats.totalRooms}
            </Typography>
            <Typography variant="body2">סה"כ חדרים</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'success.light',
              color: 'white'
            }}
          >
            <BookingIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5" component="div">
              {loading ? '...' : stats.activeBookings}
            </Typography>
            <Typography variant="body2">הזמנות פעילות</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'secondary.light',
              color: 'white'
            }}
          >
            <CalendarIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5" component="div">
              {loading ? '...' : stats.upcomingBookings}
            </Typography>
            <Typography variant="body2">הזמנות עתידיות</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* כפתורים ראשיים */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Button
            component={Link}
            to="/dashboard/bookings-new"
            fullWidth
            variant="contained"
            color="success"
            size="large"
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            ניהול הזמנות - גרסה חדשה ומשופרת
          </Button>
        </Grid>
        <Grid item xs={12} md={6}>
          <Button
            component={Link}
            to="/dashboard/rooms"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ fontWeight: 'bold' }}
          >
            ניהול חדרים
          </Button>
        </Grid>
      </Grid>

      {/* קישור ללוח זמינות */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Button
            component={Link}
            to="/dashboard/bookings-calendar"
            fullWidth
            variant="contained"
            color="info"
            size="large"
            sx={{ fontWeight: 'bold' }}
          >
            לוח זמינות חדרים והזמנות - תצוגה חדשה
          </Button>
        </Grid>
      </Grid>
      
      {/* קישור לרשימת הזמנות פשוטה */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Button
            component={Link}
            to="/dashboard/simple-bookings"
            fullWidth
            variant="contained"
            color="secondary"
            size="large"
            sx={{ fontWeight: 'bold' }}
          >
            רשימת הזמנות פשוטה - למתחמים אחרים
          </Button>
        </Grid>
      </Grid>

      {/* שורת כלים נוספים */}
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {/* הסרת קישור הגלריה מכאן */}
      </Box>

      {/* הזמנות אחרונות */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            הזמנות אחרונות
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {loading ? (
            <Typography>טוען...</Typography>
          ) : recentBookings.length > 0 ? (
            <List>
              {recentBookings.map((booking) => (
                <React.Fragment key={booking._id}>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={booking.guest?.name || (booking.guest ? `${booking.guest.firstName || ''} ${booking.guest.lastName || ''}` : 'אורח')}
                      secondary={getRoomDisplayText(booking)}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography>אין הזמנות להצגה</Typography>
          )}
        </CardContent>
        <CardActions>
          <Button 
            size="small" 
            component={Link} 
            to="/dashboard/bookings"
          >
            צפה בלוח ההזמנות
          </Button>
        </CardActions>
      </Card>

      {/* כלים נוספים */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        כלים נוספים
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {/* הסרת קישור הגלריה מכאן */}
      </Box>
    </Box>
  );
};

export default DashboardPage; 