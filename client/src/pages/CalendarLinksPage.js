import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Divider,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Link as LinkIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const CalendarLinksPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // שימוש בכתובת קבועה של שרת הפרודקשן, אבל גם תמיכה בשרת מקומי
  const baseUrl = window.location.hostname.includes('localhost') 
    ? window.location.origin 
    : 'https://rothschild-gamma.vercel.app';

  // טעינת רשימת החדרים
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
      if (response.data && response.data.data) {
        setRooms(response.data.data);
      }
    } catch (err) {
      console.error('שגיאה בטעינת חדרים:', err);
      setError('שגיאה בטעינת חדרים. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // יצירת כתובת מותאמת לחדר - משתמש בנקודת הקצה החדשה
  const getCalendarLink = (roomId) => {
    // משתמש בנקודת הקצה iCal של השרת החדש
    return `${baseUrl}/calendar/${roomId}.ics`;
  };

  // העתקת הקישור ללוח לזיכרון
  const handleCopyLink = (roomId) => {
    const link = getCalendarLink(roomId);
    navigator.clipboard.writeText(link)
      .then(() => {
        setSnackbar({
          open: true,
          message: 'הקישור הועתק ללוח',
          severity: 'success'
        });
      })
      .catch(err => {
        console.error('שגיאה בהעתקת הקישור:', err);
        setSnackbar({
          open: true,
          message: 'שגיאה בהעתקת הקישור',
          severity: 'error'
        });
      });
  };

  // בדיקת הקישור - פתיחה בחלון חדש
  const handleTestLink = (roomId) => {
    const link = getCalendarLink(roomId);
    window.open(link, '_blank');
  };

  // סגירת התראת סנאקבר
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            קישורי יומן לבוקינג.קום
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            ניהול ויצירת קישורי יומן iCal עם סיומת .ics עבור בוקינג.קום
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchRooms}
          disabled={loading}
        >
          רענון
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <LinkIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
            הוראות שימוש
          </Typography>
          <Typography variant="body1" paragraph>
            כאן תוכל/י ליצור ולהעתיק קישורים ללוחות שנה בפורמט iCal עם סיומת .ics, כפי שנדרש על ידי בוקינג.קום.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>שימוש:</strong> העתק את הקישור של החדר הרצוי והדבק אותו בשדה היבוא של לוח השנה בממשק מנהל האתר של בוקינג.קום.
          </Typography>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
        <Typography variant="body1">
          <strong>הערה:</strong> המערכת כרגע משתמשת בקבצי iCal סטטיים. עדכונים בהזמנות לא ישתקפו אוטומטית בקבצים אלה.
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>מספר חדר</TableCell>
                <TableCell>סוג חדר</TableCell>
                <TableCell>קישור</TableCell>
                <TableCell align="center">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room._id}>
                  <TableCell>{room.roomNumber}</TableCell>
                  <TableCell>{room.type}</TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={getCalendarLink(room._id)}
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="העתק קישור">
                      <IconButton onClick={() => handleCopyLink(room._id)}>
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="בדוק קישור">
                      <IconButton onClick={() => handleTestLink(room._id)}>
                        <CalendarIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CalendarLinksPage; 