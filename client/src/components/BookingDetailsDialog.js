import React, { useState } from 'react';
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
  const [editedBooking, setEditedBooking] = useState(null);

  // כשהדיאלוג נפתח, אתחל את הנתונים
  React.useEffect(() => {
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
        }
      });
    }
  }, [booking]);

  if (!booking || !editedBooking) {
    return null;
  }

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditedBooking(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditedBooking(prev => ({
        ...prev,
        [name]: value
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
          cardNumber: editedBooking.creditCard?.cardNumber || '',
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
            <Typography variant="body1">
              {booking.paymentStatus === 'paid' ? 'שולם' : 
               booking.paymentStatus === 'partial' ? 'תשלום חלקי' : 'טרם שולם'}
            </Typography>
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