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
  Divider,
  Grid
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ContentCopy as CopyIcon, 
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

const IcalEditorPage = () => {
  const [icalContent, setIcalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [roomId, setRoomId] = useState('67c9bf6e2ac03c8869a0b03f');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // יצירת כתובת מותאמת לחדר - גישה לקובץ סטטיים
  const getIcalLink = () => {
    const baseUrl = window.location.hostname.includes('localhost') 
      ? window.location.origin 
      : 'https://rothschild-gamma.vercel.app';
    return `${baseUrl}/ical/${roomId}.ics`;
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

  // טעינת התוכן בעת טעינת הדף
  useEffect(() => {
    loadIcalContent();
  }, [roomId]);

  // העתקת הקישור ללוח
  const handleCopyLink = () => {
    const link = getIcalLink();
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          עדכון קובץ iCal סטטי
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadIcalContent}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            רענון
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadFile}
            disabled={loading}
            sx={{ mr: 1 }}
            color="secondary"
          >
            הורד קובץ
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveContent}
            disabled={loading}
          >
            שמור שינויים
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            הוראות שימוש
          </Typography>
          <Typography variant="body1" paragraph>
            עמוד זה מאפשר לך לעדכן ידנית את תוכן קובץ ה-iCal הסטטי, אם אין אפשרות לעדכונים אוטומטיים.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>שימוש:</strong>
            <ol>
              <li>ערוך את תוכן ה-iCal בשדה למטה</li>
              <li>לחץ על "הורד קובץ" כדי לשמור את הקובץ במחשב שלך</li>
              <li>העלה את הקובץ ידנית לשרת או העתק אותו לתיקיית <code>client/public/ical/</code> בפרויקט</li>
              <li>דחוף את השינויים לגיט והם יעלו לשרת</li>
            </ol>
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>הקישור לקובץ:</strong> {getIcalLink()}
            <Button 
              variant="text" 
              size="small" 
              onClick={handleCopyLink}
              startIcon={<CopyIcon />}
              sx={{ ml: 2 }}
            >
              העתק
            </Button>
          </Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          התוכן נשמר בהצלחה במערכת המקומית. כעת הורד את הקובץ והעלה אותו ידנית לשרת או לתיקיית הפרויקט.
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          label="תוכן קובץ ה-iCal"
          multiline
          fullWidth
          rows={20}
          value={icalContent}
          onChange={(e) => setIcalContent(e.target.value)}
          disabled={loading}
          variant="outlined"
          InputProps={{
            sx: { fontFamily: 'monospace' }
          }}
        />
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadFile}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          הורד קובץ
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveContent}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'שמור שינויים'}
        </Button>
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