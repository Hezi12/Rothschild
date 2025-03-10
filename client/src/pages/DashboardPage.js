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
  ListItemIcon,
  Chip
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Hotel as HotelIcon,
  EventNote as BookingIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Collections as GalleryIcon,
  Image
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Modal } from 'react-bootstrap';
import { Form } from 'react-bootstrap';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalRooms: 0,
    activeBookings: 0,
    upcomingBookings: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // קבלת סטטיסטיקות
        const roomsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
        const bookingsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/bookings`);
        
        const rooms = roomsResponse.data.data;
        const bookings = bookingsResponse.data.data;
        
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

  // פונקציה למחיקת כל ההזמנות במערכת
  const handleDeleteAllBookings = async () => {
    if (!deletePassword) {
      toast.error('יש להזין סיסמה');
      return;
    }
    
    try {
      setDeletingAll(true);
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/bookings/all`,
        { 
          data: { password: deletePassword },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowDeleteAllModal(false);
        setDeletePassword('');
        // רענון הדף
        window.location.reload();
      }
    } catch (error) {
      console.error('שגיאה במחיקת כל ההזמנות:', error);
      toast.error(error.response?.data?.message || 'אירעה שגיאה במחיקת ההזמנות');
    } finally {
      setDeletingAll(false);
    }
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
          <Button
            component={Link}
            to="/dashboard/bookings"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ fontWeight: 'bold' }}
          >
            ניהול הזמנות
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

      {/* שורת כלים נוספים */}
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip 
          icon={<GalleryIcon />} 
          label="גלריה כללית" 
          component={Link}
          to="/dashboard/gallery"
          clickable
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 'bold' }}
        />
        <Chip 
          icon={<EditIcon />} 
          label="עורך iCal" 
          component={Link}
          to="/dashboard/ical-editor"
          clickable
          color="secondary"
          variant="outlined"
          sx={{ fontWeight: 'bold' }}
        />
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
                      primary={booking.guest.name}
                      secondary={`חדר ${booking.room.roomNumber} | צ'ק-אין: ${formatDate(booking.checkIn)} | צ'ק-אאוט: ${formatDate(booking.checkOut)}`}
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

      {/* כפתור מחיקת כל ההזמנות */}
      <div className="card mt-4 border-danger">
        <div className="card-header bg-danger text-white">
          <h3>פעולות מערכת מסוכנות</h3>
        </div>
        <div className="card-body">
          <p className="text-danger fw-bold">אזהרה: הפעולות הבאות הן בלתי הפיכות ויכולות לגרום לאובדן נתונים!</p>
          <Button 
            variant="outline-danger" 
            className="mt-2"
            onClick={() => setShowDeleteAllModal(true)}
          >
            מחק את כל ההזמנות והחסימות במערכת
          </Button>
        </div>
      </div>
      
      {/* מודאל אישור מחיקת כל ההזמנות */}
      <Modal show={showDeleteAllModal} onHide={() => setShowDeleteAllModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">אזהרה חמורה!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="fw-bold text-danger">פעולה זו תמחק את כל ההזמנות והחסימות במערכת ללא אפשרות שחזור!</p>
          <p>אם אתה בטוח שברצונך להמשיך, הזן את סיסמת האדמין הראשי:</p>
          <Form.Group>
            <Form.Control
              type="password"
              placeholder="סיסמת אדמין ראשי"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteAllModal(false)}>
            ביטול
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteAllBookings}
            disabled={deletingAll}
          >
            {deletingAll ? 'מוחק...' : 'מחק את כל ההזמנות והחסימות'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* כלים נוספים */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        כלים נוספים
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip 
          icon={<Image />} 
          label="גלריה כללית" 
          component={Link}
          to="/dashboard/gallery"
          clickable
          color="primary"
          variant="outlined"
        />
        <Chip 
          icon={<CalendarIcon />} 
          label="עורך iCal" 
          component={Link}
          to="/dashboard/ical-editor"
          clickable
          color="primary"
          variant="outlined"
        />
      </Box>
    </Box>
  );
};

export default DashboardPage; 