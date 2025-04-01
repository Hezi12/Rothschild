import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Link
} from '@mui/material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import axios from 'axios';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LaunchIcon from '@mui/icons-material/Launch';

const BookingDetailsDialog = ({ open, booking, onClose, onBookingChange }) => {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedBooking, setEditedBooking] = useState({});

  // הוספת שדות מצב לעדכון סטטוס תשלום
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // כשהדיאלוג נפתח, אתחל את הנתונים
  useEffect(() => {
    if (booking) {
      // טיפול בשדות האורח - וידוא שיש גם firstName/lastName וגם name
      // במודל הישן יש guest.name, במודל החדש יש guest.firstName + guest.lastName
      let guestFirstName = '';
      let guestLastName = '';
      
      // נסה לקבל שם מלא וחלק אותו
      if (booking.guest.name) {
        const nameParts = booking.guest.name.split(' ');
        guestFirstName = nameParts[0] || '';
        guestLastName = nameParts.slice(1).join(' ') || '';
      } 
      // אם יש firstName ו-lastName, השתמש בהם
      else if (booking.guest.firstName || booking.guest.lastName) {
        guestFirstName = booking.guest.firstName || '';
        guestLastName = booking.guest.lastName || '';
      }
      
      // וודא שיש אובייקט creditCard
      const creditCard = booking.creditCard || {};
      
      setEditedBooking({
        ...booking,
        checkIn: booking.checkIn ? format(new Date(booking.checkIn), 'yyyy-MM-dd') : '',
        checkOut: booking.checkOut ? format(new Date(booking.checkOut), 'yyyy-MM-dd') : '',
        guest: {
          ...booking.guest,
          firstName: guestFirstName,
          lastName: guestLastName
        },
        creditCard: {
          cardNumber: creditCard.cardNumber || '',
          expiryDate: creditCard.expiryDate || '',
          cvv: creditCard.cvv || '',
          cardholderName: creditCard.cardholderName || ''
        },
        totalPrice: booking.totalPrice || 0,
        notes: booking.notes || '',
        paymentStatus: booking.paymentStatus || 'pending',
        paymentMethod: booking.paymentMethod || ''
      });
      
      // הגדרת ערכים התחלתיים לסטטוס תשלום ואמצעי תשלום
      setPaymentStatus(booking.paymentStatus || 'pending');
      setPaymentMethod(booking.paymentMethod || '');
    }
  }, [booking]);

  if (!booking || !editedBooking) {
    return null;
  }

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    
    // טיפול מיוחד בשדה nights - עדכון תאריך צ'ק-אאוט אוטומטית
    if (name === 'nights') {
      const nights = parseInt(value) || 1;
      
      setEditedBooking(prev => {
        // חישוב תאריך צ'ק-אאוט חדש לפי תאריך צ'ק-אין + מספר הלילות
        const checkIn = new Date(prev.checkIn);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkIn.getDate() + nights);
        
        // עדכון מחיר כולל לפי מחיר לילה × מספר לילות
        const pricePerNight = prev.pricePerNight || (prev.totalPrice / prev.nights);
        const totalPrice = pricePerNight * nights;
        
        console.log('עדכון תאריך צ\'ק-אאוט לפי מספר לילות:', {
          checkIn: checkIn,
          nights: nights,
          newCheckOut: checkOut,
          totalPrice: totalPrice
        });
        
        return {
          ...prev,
          nights: nights,
          checkOut: format(checkOut, 'yyyy-MM-dd'),
          totalPrice: Math.round(totalPrice * 100) / 100
        };
      });
      
      return; // יציאה מהפונקציה אחרי הטיפול המיוחד
    }
    
    // טיפול מיוחד בשדה totalPrice - למניעת בעיות המרה
    if (name === 'totalPrice') {
      // טיפול מיוחד בערכי מספר
      const valueStr = value.toString();
      
      // בודקים אם זו מחרוזת שמכילה נקודה עשרונית במקום הלא נכון
      let fixedValue = valueStr;
      
      // אם מתחיל בספרה יחידה ואחריה נקודה, ואחרי הנקודה יש רק אפסים
      if (/^[0-9]\.0+$/.test(valueStr)) {
        // כנראה שהמשתמש התכוון למספר שלם, הסר את הנקודה והאפסים
        fixedValue = valueStr.charAt(0) + '0'.repeat(valueStr.length - 2);
        console.log(`תיקון ערך מ-${valueStr} ל-${fixedValue}`);
      } else if (/^[0-9]\.[0-9]+$/.test(valueStr) && !valueStr.includes(',')) {
        // אם זה בפורמט X.YY וללא פסיקים, ייתכן שהמשתמש התכוון ל-XYY
        fixedValue = valueStr.replace('.', '');
        console.log(`תיקון ערך מ-${valueStr} ל-${fixedValue}`);
      }
      
      setEditedBooking(prev => {
        const totalPrice = parseFloat(fixedValue) || 0;
        const nights = prev.nights || 1;
        
        // חישוב מחיר לילה כולל מע"מ
        const pricePerNightWithVat = Math.round((totalPrice / nights) * 100) / 100;
        
        // חישוב מחיר לילה ללא מע"מ
        const vatRate = 0.18; // 18% מע"מ
        const pricePerNightNoVat = prev.isTourist ? 
          pricePerNightWithVat : // אם תייר, אין מע"מ
          Math.round((pricePerNightWithVat / (1 + vatRate)) * 100) / 100; // חישוב מחיר ללא מע"מ
        
        console.log('עדכון מחירים לפי סה"כ:', {
          originalValue: value,
          fixedValue,
          totalPrice,
          nights,
          pricePerNightWithVat,
          pricePerNightNoVat,
          isTourist: prev.isTourist
        });
        
        return {
          ...prev,
          totalPrice,
          pricePerNight: pricePerNightWithVat,
          basePrice: pricePerNightNoVat
        };
      });
      
      return; // סיים את הפונקציה כאן, מכיוון שכבר עדכנו את הסטייט
    }
    
    // ניקוי רווחים ממספר כרטיס אשראי
    let processedValue = value;
    if (name === 'creditCard.cardNumber') {
      processedValue = value.replace(/\s+/g, ''); // הסרת כל הרווחים
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditedBooking(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: processedValue
        }
      }));
    } else {
      setEditedBooking(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
  };

  const handleSaveBooking = async () => {
    setLoading(true);
    try {
      // בדיקת שדות חובה
      if (!editedBooking.guest.firstName || !editedBooking.guest.lastName) {
        toast.error('שם פרטי ושם משפחה הם שדות חובה');
        setLoading(false);
        return;
      }

      // הכנת המידע לשמירה
      const bookingData = {
        ...editedBooking,
        roomId: editedBooking.room._id || editedBooking.room,
        guest: {
          ...editedBooking.guest,
          name: `${editedBooking.guest.firstName || ''} ${editedBooking.guest.lastName || ''}`.trim(),
          // וודא שכל השדות קיימים
          firstName: editedBooking.guest.firstName || '',
          lastName: editedBooking.guest.lastName || '',
          phone: editedBooking.guest.phone || '',
          email: editedBooking.guest.email || '',
        },
        creditCard: {
          ...editedBooking.creditCard,
          cardNumber: (editedBooking.creditCard?.cardNumber || '').replace(/\s+/g, ''),  // ניקוי רווחים
          expiryDate: editedBooking.creditCard?.expiryDate || '',
          cvv: editedBooking.creditCard?.cvv || '',
          cardholderName: editedBooking.creditCard?.cardholderName || ''
        }
      };

      // שליחת הבקשה לשרת
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/bookings/${booking._id}`,
        bookingData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success('ההזמנה עודכנה בהצלחה');
        setEditMode(false);
        onBookingChange();
      }
    } catch (error) {
      console.error('שגיאה בעדכון הזמנה:', error);
      toast.error(error.response?.data?.message || 'שגיאה בעדכון הזמנה');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) {
      return;
    }

    setLoading(true);
    try {
      // נסיון ראשון - שימוש בנקודת קצה ייעודית לביטול הזמנה (POST)
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/bookings/${booking._id}/cancel`,
          {},
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }}
        );
        
        if (response.data.success) {
          toast.success('ההזמנה בוטלה בהצלחה');
          onBookingChange();
          onClose();
          return;
        }
      } catch (cancelError) {
        console.log('ניסיון ביטול דרך נקודת קצה ייעודית נכשל, מנסה גישה אחרת', cancelError);
      }
      
      // נסיון שני - עדכון ההזמנה באמצעות PUT
      try {
        const updatedData = {
          ...booking,
          paymentStatus: 'canceled',
          status: 'canceled'
        };
        
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/bookings/${booking._id}`,
          updatedData,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }}
        );
        
        if (response.data.success) {
          toast.success('ההזמנה בוטלה בהצלחה');
          onBookingChange();
          onClose();
          return;
        }
      } catch (putError) {
        console.log('ניסיון ביטול באמצעות PUT נכשל, מנסה גישה אחרת', putError);
      }
      
      // נסיון שלישי - ניסיון מקורי עם DELETE
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/bookings/${booking._id}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }}
      );

      if (response.data.success) {
        toast.success('ההזמנה בוטלה בהצלחה');
        onBookingChange();
        onClose();
      } else {
        toast.error(response.data.message || 'אירעה שגיאה בביטול ההזמנה');
      }
    } catch (error) {
      console.error('שגיאה בביטול הזמנה:', error);
      toast.error('שגיאה בביטול הזמנה. נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  // פונקציה לעדכון סטטוס תשלום
  const handleUpdatePaymentStatus = async (status, method) => {
    console.log('===== תחילת עדכון סטטוס תשלום מדיאלוג פרטי הזמנה =====');
    
    if (!booking || !booking._id) {
      console.error('חסר מזהה הזמנה');
      toast.error('שגיאה: חסר מזהה הזמנה');
      return;
    }
    
    try {
      setLoading(true);
      
      // עדכון הסטטוס המקומי תחילה
      let newStatus = status || paymentStatus;
      const newMethod = method || paymentMethod;
      
      // המרה מערכי עברית לאנגלית לפי הצורך
      if (typeof newStatus === 'string') {
        switch(newStatus) {
          case 'שולם':
            newStatus = 'paid';
            break;
          case 'לא שולם':
          case 'ממתין לתשלום':
          case 'ממתין':
          case 'טרם שולם':
            newStatus = 'pending';
            break;
          case 'שולם חלקית':
          case 'חלקי':
          case 'תשלום חלקי':
            newStatus = 'partial';
            break;
          case 'מבוטל':
          case 'בוטל':
            newStatus = 'canceled';
            break;
          // אם כבר באנגלית, להשאיר כפי שהוא
        }
      }
      
      console.log('נתוני עדכון סטטוס תשלום:', {
        bookingId: booking._id,
        status: newStatus,
        method: newMethod,
        oldStatus: booking.paymentStatus,
        oldMethod: booking.paymentMethod
      });
      
      // שימוש בנתיב API הייעודי לעדכון סטטוס תשלום
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/bookings/${booking._id}/payment-status`,
        {
          paymentStatus: newStatus,
          paymentMethod: newMethod
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('תשובה מהשרת:', response.data);
      
      if (response.data.success) {
        console.log('עדכון סטטוס תשלום הצליח');
        
        toast.success('סטטוס התשלום עודכן בהצלחה');
        
        // שימוש בתשובת השרת לעדכון המצב המקומי
        if (onBookingChange) {
          onBookingChange(response.data.data);
        }
      } else {
        console.error('השרת החזיר שגיאה:', response.data.message);
        toast.error(`שגיאה בעדכון סטטוס התשלום: ${response.data.message}`);
      }
    } catch (error) {
      console.error('===== שגיאה בעדכון סטטוס תשלום =====');
      console.error('שגיאה בעדכון סטטוס התשלום:', error);
      console.error('פרטי השגיאה:', error.response?.data || error.message);
      
      toast.error('שגיאה בעדכון סטטוס התשלום. אנא נסה שנית.');
    } finally {
      console.log('===== סיום עדכון סטטוס תשלום מדיאלוג פרטי הזמנה =====');
      setLoading(false);
    }
  };

  // מצב צפייה בלבד - להציג פרטי הזמנה
  const renderViewMode = () => (
    <>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            פרטי הזמנה #{booking.bookingNumber}
          </Typography>
          <Divider />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">חדר:</Typography>
            <Typography variant="body1">
              {booking.room?.roomNumber} - {booking.room?.type}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">סטטוס:</Typography>
            <Typography variant="body1">
              {booking.status === 'confirmed' ? 'מאושר' : 
               booking.status === 'canceled' ? 'מבוטל' : 
               booking.status === 'completed' ? 'הושלם' : 'ממתין'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">תאריך הגעה:</Typography>
            <Typography variant="body1">
              {format(new Date(booking.checkIn), 'dd/MM/yyyy')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">תאריך עזיבה:</Typography>
            <Typography variant="body1">
              {format(new Date(booking.checkOut), 'dd/MM/yyyy')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">מספר לילות:</Typography>
            <Typography variant="body1">{booking.nights}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">סה"כ לתשלום:</Typography>
            <Typography variant="body1">{booking.totalPrice} ₪</Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>פרטי אורח</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">שם:</Typography>
            <Typography variant="body1">{booking.guest.name}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">טלפון:</Typography>
            <Typography variant="body1">{booking.guest.phone}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">דוא"ל:</Typography>
            <Typography variant="body1">{booking.guest.email}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">סטטוס תשלום:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120, mr: 1 }}>
                <Select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="pending">טרם שולם</MenuItem>
                  <MenuItem value="partial">תשלום חלקי</MenuItem>
                  <MenuItem value="paid">שולם</MenuItem>
                </Select>
              </FormControl>
              
              {/* כפתור לעדכון סטטוס תשלום */}
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => handleUpdatePaymentStatus()}
                disabled={loading || paymentStatus === booking.paymentStatus}
              >
                עדכון
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>פרטי כרטיס אשראי</Typography>
              <Tooltip title="מערכת ניהול כרטיסי אשראי CreditGuard">
                <IconButton 
                  color="primary" 
                  size="small" 
                  component={Link} 
                  href="https://console.creditguard.co.il/html/mainFrames.html" 
                  target="_blank"
                >
                  <LaunchIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">מספר כרטיס:</Typography>
            <Typography variant="body1">
              {booking.creditCard?.cardNumber || 'לא הוזן'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">תוקף:</Typography>
            <Typography variant="body1">
              {booking.creditCard?.expiryDate || 'לא הוזן'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">שם בעל הכרטיס:</Typography>
            <Typography variant="body1">
              {booking.creditCard?.cardholderName || 'לא הוזן'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">CVV:</Typography>
            <Typography variant="body1">
              {booking.creditCard?.cvv || 'לא הוזן'}
            </Typography>
          </Grid>

          {booking.notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2">הערות:</Typography>
              <Typography variant="body1">{booking.notes}</Typography>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">אמצעי תשלום:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150, mr: 1 }}>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="">לא צוין</MenuItem>
                  <MenuItem value="credit">כרטיס אשראי</MenuItem>
                  <MenuItem value="cash">מזומן</MenuItem>
                  <MenuItem value="creditOr">אשראי - אור יהודה</MenuItem>
                  <MenuItem value="creditRothschild">אשראי - רוטשילד</MenuItem>
                  <MenuItem value="mizrahi">העברה - מזרחי</MenuItem>
                  <MenuItem value="poalim">העברה - פועלים</MenuItem>
                  <MenuItem value="other">אחר</MenuItem>
                </Select>
              </FormControl>
              
              {/* כפתור לעדכון אמצעי תשלום */}
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => handleUpdatePaymentStatus(paymentStatus, paymentMethod)}
                disabled={loading || paymentMethod === booking.paymentMethod}
              >
                עדכון
              </Button>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleCancelBooking} 
          color="error" 
          disabled={loading || booking.status === 'canceled'}
        >
          ביטול הזמנה
        </Button>
        <Button onClick={() => setEditMode(true)} color="primary" disabled={loading}>
          עריכה
        </Button>
        <Button onClick={onClose}>סגירה</Button>
      </DialogActions>
    </>
  );

  // מצב עריכה - טופס עריכת פרטי הזמנה
  const renderEditMode = () => (
    <>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            עריכת הזמנה #{booking.bookingNumber}
          </Typography>
          <Divider />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="תאריך הגעה"
              type="date"
              name="checkIn"
              value={editedBooking.checkIn}
              onChange={handleFieldChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="תאריך עזיבה"
              type="date"
              name="checkOut"
              value={editedBooking.checkOut}
              onChange={handleFieldChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="מספר לילות"
              type="number"
              name="nights"
              value={editedBooking.nights}
              onChange={handleFieldChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="סה&quot;כ לתשלום"
              type="number"
              name="totalPrice"
              value={editedBooking.totalPrice}
              onChange={handleFieldChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>פרטי אורח</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="שם פרטי"
              name="guest.firstName"
              value={editedBooking.guest.firstName || ''}
              onChange={handleFieldChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="שם משפחה"
              name="guest.lastName"
              value={editedBooking.guest.lastName || ''}
              onChange={handleFieldChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="טלפון"
              name="guest.phone"
              value={editedBooking.guest.phone || ''}
              onChange={handleFieldChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="דוא&quot;ל"
              name="guest.email"
              value={editedBooking.guest.email || ''}
              onChange={handleFieldChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>פרטי כרטיס אשראי</Typography>
              <Tooltip title="מערכת ניהול כרטיסי אשראי CreditGuard">
                <IconButton 
                  color="primary" 
                  size="small" 
                  component={Link} 
                  href="https://console.creditguard.co.il/html/mainFrames.html" 
                  target="_blank"
                >
                  <LaunchIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="מספר כרטיס"
              name="creditCard.cardNumber"
              value={editedBooking.creditCard?.cardNumber || ''}
              onChange={handleFieldChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="תוקף (MM/YY)"
              name="creditCard.expiryDate"
              value={editedBooking.creditCard?.expiryDate || ''}
              onChange={handleFieldChange}
              placeholder="MM/YY"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="שם בעל הכרטיס"
              name="creditCard.cardholderName"
              value={editedBooking.creditCard?.cardholderName || ''}
              onChange={handleFieldChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="CVV"
              name="creditCard.cvv"
              value={editedBooking.creditCard?.cvv || ''}
              onChange={handleFieldChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>סטטוס תשלום</InputLabel>
              <Select
                name="paymentStatus"
                value={editedBooking.paymentStatus}
                onChange={handleFieldChange}
                label="סטטוס תשלום"
              >
                <MenuItem value="pending">טרם שולם</MenuItem>
                <MenuItem value="partial">תשלום חלקי</MenuItem>
                <MenuItem value="paid">שולם</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>סטטוס הזמנה</InputLabel>
              <Select
                name="status"
                value={editedBooking.status}
                onChange={handleFieldChange}
                label="סטטוס הזמנה"
              >
                <MenuItem value="pending">ממתין</MenuItem>
                <MenuItem value="confirmed">מאושר</MenuItem>
                <MenuItem value="canceled">מבוטל</MenuItem>
                <MenuItem value="completed">הושלם</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="הערות"
              name="notes"
              value={editedBooking.notes || ''}
              onChange={handleFieldChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditMode(false)} disabled={loading}>
          ביטול
        </Button>
        <Button 
          onClick={handleSaveBooking} 
          color="primary" 
          variant="contained" 
          disabled={loading}
        >
          שמירה
        </Button>
      </DialogActions>
    </>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      {editMode ? renderEditMode() : renderViewMode()}
    </Dialog>
  );
};

export default BookingDetailsDialog; 