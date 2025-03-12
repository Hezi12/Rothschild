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
  CircularProgress
} from '@mui/material';
import { format, addDays, differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';
import axios from 'axios';

const NewBookingDialog = ({ open, onClose, onBookingCreated, selectedRoom, selectedDates }) => {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [booking, setBooking] = useState({
    roomId: '',
    checkIn: '',
    checkOut: '',
    nights: 1,
    totalPrice: 0,
    guest: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    status: 'confirmed',
    paymentStatus: 'pending',
    notes: ''
  });

  // טעינת חדרים זמינים
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
        if (response.data.success) {
          setRooms(response.data.data);
        }
      } catch (error) {
        console.error('שגיאה בטעינת חדרים:', error);
      }
    };

    if (open) {
      fetchRooms();
    }
  }, [open]);

  // עדכון נתוני הזמנה כאשר נבחר חדר או תאריכים
  useEffect(() => {
    if (selectedRoom) {
      setBooking(prev => ({
        ...prev,
        roomId: selectedRoom._id
      }));
    }

    if (selectedDates && selectedDates.start && selectedDates.end) {
      const checkIn = format(selectedDates.start, 'yyyy-MM-dd');
      const checkOut = format(selectedDates.end, 'yyyy-MM-dd');
      const nights = differenceInDays(selectedDates.end, selectedDates.start);
      
      setBooking(prev => ({
        ...prev,
        checkIn,
        checkOut,
        nights: nights > 0 ? nights : 1
      }));

      // חישוב מחיר כולל אם יש חדר נבחר
      if (selectedRoom) {
        const totalPrice = (nights > 0 ? nights : 1) * selectedRoom.price;
        setBooking(prev => ({
          ...prev,
          totalPrice
        }));
      }
    }
  }, [selectedRoom, selectedDates]);

  // עדכון שדה בהזמנה
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setBooking(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setBooking(prev => ({
        ...prev,
        [name]: value
      }));

      // עדכון מספר לילות ומחיר כולל כאשר משתנים תאריכים
      if (name === 'checkIn' || name === 'checkOut') {
        if (booking.checkIn && booking.checkOut) {
          const checkIn = name === 'checkIn' ? new Date(value) : new Date(booking.checkIn);
          const checkOut = name === 'checkOut' ? new Date(value) : new Date(booking.checkOut);
          
          if (checkIn && checkOut && checkIn < checkOut) {
            const nights = differenceInDays(checkOut, checkIn);
            
            setBooking(prev => ({
              ...prev,
              nights: nights > 0 ? nights : 1
            }));

            // עדכון מחיר כולל אם יש חדר נבחר
            const selectedRoom = rooms.find(room => room._id === booking.roomId);
            if (selectedRoom) {
              const totalPrice = (nights > 0 ? nights : 1) * selectedRoom.price;
              setBooking(prev => ({
                ...prev,
                totalPrice
              }));
            }
          }
        }
      }

      // עדכון מחיר כולל כאשר משתנה החדר
      if (name === 'roomId') {
        const selectedRoom = rooms.find(room => room._id === value);
        if (selectedRoom && booking.nights) {
          const totalPrice = booking.nights * selectedRoom.price;
          setBooking(prev => ({
            ...prev,
            totalPrice
          }));
        }
      }
    }
  };

  // שליחת הזמנה חדשה
  const handleCreateBooking = async () => {
    // וידוא שכל השדות החובה מלאים
    if (!booking.roomId || !booking.checkIn || !booking.checkOut || 
        !booking.guest.firstName || !booking.guest.lastName) {
      toast.error('נא למלא את כל שדות החובה');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        ...booking,
        guest: {
          ...booking.guest,
          name: `${booking.guest.firstName} ${booking.guest.lastName}`.trim(),
          // וודא שכל השדות קיימים
          firstName: booking.guest.firstName || '',
          lastName: booking.guest.lastName || '',
          phone: booking.guest.phone || '',
          email: booking.guest.email || ''
        }
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/bookings`,
        bookingData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success('ההזמנה נוצרה בהצלחה');
        onBookingCreated(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('שגיאה ביצירת הזמנה:', error);
      toast.error(error.response?.data?.message || 'שגיאה ביצירת הזמנה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Typography variant="h6">הזמנה חדשה</Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" gutterBottom>פרטי הזמנה</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>חדר</InputLabel>
              <Select
                name="roomId"
                value={booking.roomId}
                onChange={handleFieldChange}
                label="חדר"
              >
                {rooms.map(room => (
                  <MenuItem key={room._id} value={room._id}>
                    {room.roomNumber} - {room.type} ({room.price} ₪ ללילה)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>סטטוס הזמנה</InputLabel>
              <Select
                name="status"
                value={booking.status}
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

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="תאריך הגעה"
              type="date"
              name="checkIn"
              value={booking.checkIn}
              onChange={handleFieldChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="תאריך עזיבה"
              type="date"
              name="checkOut"
              value={booking.checkOut}
              onChange={handleFieldChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="מספר לילות"
              type="number"
              name="nights"
              value={booking.nights}
              onChange={handleFieldChange}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="סה&quot;כ לתשלום"
              type="number"
              name="totalPrice"
              value={booking.totalPrice}
              onChange={handleFieldChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" gutterBottom>פרטי אורח</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="שם פרטי"
              name="guest.firstName"
              value={booking.guest.firstName}
              onChange={handleFieldChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="שם משפחה"
              name="guest.lastName"
              value={booking.guest.lastName}
              onChange={handleFieldChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="טלפון"
              name="guest.phone"
              value={booking.guest.phone}
              onChange={handleFieldChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="דוא&quot;ל"
              name="guest.email"
              value={booking.guest.email}
              onChange={handleFieldChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>סטטוס תשלום</InputLabel>
              <Select
                name="paymentStatus"
                value={booking.paymentStatus}
                onChange={handleFieldChange}
                label="סטטוס תשלום"
              >
                <MenuItem value="pending">טרם שולם</MenuItem>
                <MenuItem value="partial">תשלום חלקי</MenuItem>
                <MenuItem value="paid">שולם</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="הערות"
              name="notes"
              value={booking.notes}
              onChange={handleFieldChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          ביטול
        </Button>
        <Button 
          onClick={handleCreateBooking} 
          color="primary" 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          יצירת הזמנה
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewBookingDialog; 