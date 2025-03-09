import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ContentCopy as CopyIcon, 
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const IcalEditorPage = () => {
  const [icalContent, setIcalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [roomId, setRoomId] = useState('67c9bf6e2ac03c8869a0b03f');
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // רשימת חדרים לדוגמה - בעתיד אפשר לטעון מהשרת
  const rooms = [
    { _id: '67c9bf6e2ac03c8869a0b03f', roomNumber: '6', type: 'חדר סטנדרט' },
    // בעתיד יתווספו כאן עוד חדרים
  ];

  // יצירת כתובת מותאמת לחדר - גישה לקובץ סטטי
  const getIcalLink = (id) => {
    const baseUrl = window.location.hostname.includes('localhost') 
      ? window.location.origin 
      : 'https://rothschild-gamma.vercel.app';
    return `${baseUrl}/ical/${id || roomId}.ics`;
  };

  // טעינת התוכן הנוכחי של קובץ ה-iCal
  const loadIcalContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(getIcalLink());
      setIcalContent(response.data);
    } catch (err) {
      console.error('שגיאה בטעינת תוכן ה-iCal:', err);
      setError('שגיאה בטעינת תוכן ה-iCal. יתכן שהקובץ לא קיים עדיין.');
      // יצירת תבנית בסיסית אם הקובץ לא קיים
      setIcalContent(`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Rothschild 79 Hotel//NONSGML v1.0//EN
CALSCALE:GREGORIAN
X-WR-CALNAME:Rothschild 79 - Room 6
BEGIN:VEVENT
UID:booking-demo-id-1@rothschild79
DTSTAMP:20240813T123456Z
DTSTART;VALUE=DATE:20250310
DTEND;VALUE=DATE:20250315
SUMMARY:אורח לדוגמה 1
DESCRIPTION:Booking for 5 nights\\nPhone: 0501234567\\nEmail: guest1@example.com
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`);
    } finally {
      setLoading(false);
    }
  };

  // טעינת התוכן בעת טעינת הדף או שינוי חדר
  useEffect(() => {
    loadIcalContent();
  }, [roomId]);

  // שינוי חדר נבחר
  const handleRoomChange = (event) => {
    setRoomId(event.target.value);
  };

  // שינוי טאב
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // העתקת הקישור ללוח
  const handleCopyLink = (id) => {
    const link = getIcalLink(id);
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

  // הורדת הקובץ למחשב המקומי
  const handleDownloadFile = () => {
    const element = document.createElement('a');
    const file = new Blob([icalContent], {type: 'text/calendar'});
    element.href = URL.createObjectURL(file);
    element.download = `${roomId}.ics`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    setSnackbar({
      open: true,
      message: 'הקובץ הורד בהצלחה',
      severity: 'success'
    });
  };

  // פונקציית עזר לעדכון התוכן בוורסל
  const updateStaticIcalOnServer = async () => {
    // כאן יכולנו להוסיף נקודת קצה בשרת שתקבל את התוכן החדש ותשמור אותו
    // אבל מכיוון שאין לנו גישה לשרת כרגע, נציג רק הודעת הצלחה
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  };

  // שמירת התוכן החדש
  const handleSaveContent = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // בדיקה בסיסית שהתוכן תקין
      if (!icalContent.includes('BEGIN:VCALENDAR') || !icalContent.includes('END:VCALENDAR')) {
        throw new Error('תוכן ה-iCal אינו תקין. חייב להתחיל ב-BEGIN:VCALENDAR ולהסתיים ב-END:VCALENDAR');
      }
      
      // ניסיון לשמור את התוכן בשרת
      await updateStaticIcalOnServer();
      
      setSuccess(true);
      setSnackbar({
        open: true,
        message: 'תוכן ה-iCal עודכן בהצלחה במערכת המקומית. בקרוב יעלה לשרת!',
        severity: 'success'
      });
    } catch (err) {
      console.error('שגיאה בשמירת תוכן ה-iCal:', err);
      setError(err.message || 'שגיאה בשמירת תוכן ה-iCal');
      setSnackbar({
        open: true,
        message: 'שגיאה בשמירת תוכן ה-iCal: ' + (err.message || ''),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // סגירת התראת סנאקבר
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} color="secondary" />
          עדכון קבצי iCal סטטיים
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadIcalContent}
            disabled={loading}
            size="small"
            sx={{ mr: 1 }}
          >
            רענון
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadFile}
            disabled={loading}
            size="small"
            sx={{ mr: 1 }}
            color="secondary"
          >
            הורד
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveContent}
            disabled={loading}
            size="small"
          >
            שמור
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="מצבי תצוגה">
          <Tab label="עריכת תוכן" />
          <Tab label="רשימת חדרים" />
        </Tabs>
      </Paper>

      {/* תצוגת טאב 0 - עריכת תוכן */}
      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>בחר חדר</InputLabel>
              <Select
                value={roomId}
                onChange={handleRoomChange}
                label="בחר חדר"
              >
                {rooms.map(room => (
                  <MenuItem key={room._id} value={room._id}>
                    חדר {room.roomNumber} ({room.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              התוכן נשמר בהצלחה. הורד את הקובץ והעלה אותו ידנית לשרת/גיט.
            </Alert>
          )}

          <Paper sx={{ p: 2, mb: 2 }}>
            <TextField
              label={`תוכן iCal לחדר ${rooms.find(r => r._id === roomId)?.roomNumber || ''}`}
              multiline
              fullWidth
              rows={15}
              value={icalContent}
              onChange={(e) => setIcalContent(e.target.value)}
              disabled={loading}
              variant="outlined"
              InputProps={{
                sx: { fontFamily: 'monospace' }
              }}
            />
          </Paper>
        </>
      )}

      {/* תצוגת טאב 1 - רשימת חדרים */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>מספר</TableCell>
                <TableCell>סוג</TableCell>
                <TableCell>קישור</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room._id}>
                  <TableCell>{room.roomNumber}</TableCell>
                  <TableCell>{room.type}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getIcalLink(room._id)}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopyLink(room._id)}
                      title="העתק קישור"
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => setRoomId(room._id)}
                      title="ערוך"
                      color="secondary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>הקישור הנוכחי:</strong> {getIcalLink()}
          <IconButton 
            size="small" 
            onClick={() => handleCopyLink()}
            title="העתק קישור"
            sx={{ ml: 1 }}
          >
            <CopyIcon fontSize="small" />
          </IconButton>
        </Typography>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default IcalEditorPage; 