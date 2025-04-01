import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Divider,
  Paper,
  InputAdornment,
  alpha,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import NoteIcon from '@mui/icons-material/Note';
import { BookingContext } from '../context/BookingContext';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'מזומן' },
  { value: 'credit', label: 'כרטיס אשראי' },
  { value: 'creditOr', label: 'אשראי אור יהודה' },
  { value: 'creditRothschild', label: 'אשראי רוטשילד' },
  { value: 'mizrahi', label: 'העברה מזרחי' },
  { value: 'poalim', label: 'העברה פועלים' },
  { value: 'other', label: 'אחר' }
];

const VAT_RATE = 0.18; // 18% מע"מ

const BookingDialog = ({ 
  open, 
  onClose, 
  onSave, 
  selectedRoom = null, 
  selectedDate = null,
  rooms = [],
  booking = null,  // הזמנה קיימת לעריכה
  isEdit = false   // האם במצב עריכה
}) => {
  const theme = useTheme();
  const { getPaymentMethodLabel } = useContext(BookingContext);
  
  // סטייט ראשי
  const [formData, setFormData] = useState({
    roomId: selectedRoom?._id || '',
    checkIn: selectedDate || new Date(),
    checkOut: selectedDate ? new Date(selectedDate.getTime() + 86400000) : new Date(new Date().getTime() + 86400000),
    nights: 1,
    pricePerNightNoVat: 0,
    pricePerNightWithVat: 0,
    totalPrice: 0,
    isTourist: false,
    guest: {
      firstName: '',
      lastName: '',
      phone: '',
      email: ''
    },
    isPaid: false,
    paymentMethod: '',
    creditCard: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    },
    notes: ''
  });

  // אתחול הטופס עם נתוני ההזמנה הקיימת במצב עריכה
  useEffect(() => {
    if (booking && isEdit) {
      console.log("טוען נתוני עריכת הזמנה:", booking);
      const paymentStatus = booking.paymentStatus;
      // המרת הסטטוס לערך בוליאני
      const isPaid = paymentStatus === 'paid';
      
      setFormData({
        roomId: booking.roomId || booking.room?._id || '',
        checkIn: new Date(booking.checkIn),
        checkOut: new Date(booking.checkOut),
        nights: booking.nights || 1,
        pricePerNightNoVat: booking.pricePerNightNoVat || booking.basePrice || 0,
        pricePerNightWithVat: booking.pricePerNightWithVat || booking.totalPrice / (booking.nights || 1) || 0,
        totalPrice: booking.totalPrice || 0,
        isTourist: booking.isTourist || false,
        guest: {
          firstName: booking.guest?.firstName || '',
          lastName: booking.guest?.lastName || '',
          phone: booking.guest?.phone || '',
          email: booking.guest?.email || ''
        },
        isPaid: isPaid,
        paymentMethod: booking.paymentMethod || '',
        creditCard: booking.creditCard || {
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        },
        notes: booking.notes || ''
      });
      
      console.log("סטטוס תשלום:", paymentStatus);
      console.log("אמצעי תשלום:", booking.paymentMethod);
    } else if (!isEdit && open) {
      // איפוס הטופס להזמנה חדשה בכל פעם שהדיאלוג נפתח במצב יצירה
      console.log("איפוס טופס להזמנה חדשה");
      setFormData({
        roomId: selectedRoom?._id || '',
        checkIn: selectedDate || new Date(),
        checkOut: selectedDate ? new Date(selectedDate.getTime() + 86400000) : new Date(new Date().getTime() + 86400000),
        nights: 1,
        pricePerNightNoVat: 0,
        pricePerNightWithVat: 0,
        totalPrice: 0,
        isTourist: false,
        guest: {
          firstName: '',
          lastName: '',
          phone: '',
          email: ''
        },
        isPaid: false,
        paymentMethod: '',
        creditCard: {
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        },
        notes: ''
      });
    }
  }, [booking, isEdit, open, selectedRoom, selectedDate]);

  // עדכון מחירים כשמשתנה מספר לילות או סטטוס תייר
  useEffect(() => {
    if (formData.pricePerNightNoVat) {
      const withVat = formData.isTourist ? 
        formData.pricePerNightNoVat : 
        formData.pricePerNightNoVat * (1 + VAT_RATE);
      
      setFormData(prev => ({
        ...prev,
        pricePerNightWithVat: Math.round(withVat * 100) / 100,
        totalPrice: Math.round(withVat * prev.nights * 100) / 100
      }));
    }
  }, [formData.nights, formData.isTourist, formData.pricePerNightNoVat]);

  // עדכון לילות כשמשתנים תאריכים
  useEffect(() => {
    const nights = differenceInDays(formData.checkOut, formData.checkIn);
    if (nights > 0) {
      setFormData(prev => ({
        ...prev,
        nights
      }));
    }
  }, [formData.checkIn, formData.checkOut]);

  // טיפול בשינוי שדות
  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      
      // ניקוי רווחים ממספר כרטיס אשראי
      if (field === 'creditCard.cardNumber') {
        value = value.replace(/\s+/g, ''); // הסרת כל הרווחים
      }
      
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        updated[parent] = { ...updated[parent], [child]: value };
      } else {
        updated[field] = value;
      }

      // עדכון תאריך צ'ק-אאוט כאשר משנים מספר לילות
      if (field === 'nights') {
        const nights = parseInt(value) || 1;
        // חישוב תאריך צ'ק-אאוט חדש לפי תאריך צ'ק-אין + מספר הלילות
        const checkIn = new Date(updated.checkIn);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkIn.getDate() + nights);
        updated.checkOut = checkOut;
        updated.nights = nights;
        
        // עדכון המחירים 
        if (updated.pricePerNightWithVat) {
          updated.totalPrice = Math.round(updated.pricePerNightWithVat * nights * 100) / 100;
        }
        
        console.log('עדכון תאריך צ\'ק-אאוט לפי מספר לילות:', {
          checkIn: checkIn,
          nights: nights,
          newCheckOut: checkOut,
          totalPrice: updated.totalPrice
        });
      }
      
      // טיפול במחירים
      if (field === 'pricePerNightNoVat') {
        const priceNoVat = parseFloat(value) || 0;
        const withVat = updated.isTourist ? priceNoVat : priceNoVat * (1 + VAT_RATE);
        updated.pricePerNightWithVat = Math.round(withVat * 100) / 100;
        updated.totalPrice = Math.round(withVat * updated.nights * 100) / 100;
      } else if (field === 'pricePerNightWithVat') {
        const priceWithVat = parseFloat(value) || 0;
        const noVat = updated.isTourist ? priceWithVat : priceWithVat / (1 + VAT_RATE);
        updated.pricePerNightNoVat = Math.round(noVat * 100) / 100;
        updated.totalPrice = Math.round(priceWithVat * updated.nights * 100) / 100;
      } else if (field === 'totalPrice') {
        // טיפול מיוחד בערכי מספר - למניעת בעיות המרה
        const valueStr = value.toString();
        
        // בודקים אם זו מחרוזת שמכילה נקודה עשרונית במקום הלא נכון
        // למשל: "7.00" במקום "700" 
        let fixedValue = valueStr;
        
        // אם מתחיל בספרה יחידה ואחריה נקודה, ואחרי הנקודה יש רק אפסים - כנראה שזו שגיאת המרה
        if (/^[0-9]\.0+$/.test(valueStr)) {
          // הסר את הנקודה והאפסים, כנראה שהמשתמש התכוון למספר שלם
          fixedValue = valueStr.charAt(0) + '0'.repeat(valueStr.length - 2);
          console.log(`תיקון ערך מ-${valueStr} ל-${fixedValue}`);
        } else if (/^[0-9]\.[0-9]+$/.test(valueStr) && !valueStr.includes(',')) {
          // אם זה בפורמט X.YY וללא פסיקים, ייתכן שהמשתמש התכוון ל-XYY
          // נסיר את הנקודה ונשמור את כל הספרות
          fixedValue = valueStr.replace('.', '');
          console.log(`תיקון ערך מ-${valueStr} ל-${fixedValue}`);
        }
        
        const total = parseFloat(fixedValue) || 0;
        // חישוב מחיר ללילה כולל מע"מ - סה"כ להזמנה מחולק במספר הלילות
        const pricePerNightWithVat = Math.round((total / updated.nights) * 100) / 100;
        // חישוב מחיר ללילה ללא מע"מ - תלוי אם תייר או לא
        const pricePerNightNoVat = updated.isTourist ? 
          pricePerNightWithVat : // אם תייר, אז אין מע"מ והמחיר זהה
          Math.round((pricePerNightWithVat / (1 + VAT_RATE)) * 100) / 100; // אם לא תייר, מחשבים ללא מע"מ
        
        // עדכון המחירים בטופס
        updated.pricePerNightWithVat = pricePerNightWithVat;
        updated.pricePerNightNoVat = pricePerNightNoVat;
        updated.totalPrice = total; // שמירת הערך המתוקן
        
        console.log('עדכון מחיר בהזמנה לפי סה"כ:', {
          originalValue: value,
          fixedValue,
          totalPrice: total,
          nights: updated.nights,
          pricePerNightWithVat,
          pricePerNightNoVat,
          isTourist: updated.isTourist,
        });
      }

      return updated;
    });
  };

  // שמירת הזמנה
  const handleSave = () => {
    // וידוא שאם יש תשלום, יש גם אמצעי תשלום
    if (formData.isPaid && !formData.paymentMethod) {
      alert('אנא בחר אמצעי תשלום');
      return;
    }
    
    // אם לא מסומן כשולם, מוודאים שאמצעי התשלום ריק
    const dataToSave = { ...formData };
    if (!dataToSave.isPaid) {
      dataToSave.paymentMethod = '';
    }
    
    // ניקוי רווחים ממספר כרטיס אשראי לפני שמירה
    if (dataToSave.creditCard && dataToSave.creditCard.cardNumber) {
      dataToSave.creditCard.cardNumber = dataToSave.creditCard.cardNumber.replace(/\s+/g, '');
    }
    
    console.log("שולח נתוני הזמנה לשמירה:", {
      ...dataToSave,
      isPaid: dataToSave.isPaid,
      paymentMethod: dataToSave.paymentMethod,
      creditCard: dataToSave.creditCard ? "קיים" : "לא קיים"
    });
    
    onSave(dataToSave);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
        <DialogTitle 
          sx={{ 
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            p: 1.5,
            bgcolor: theme.palette.background.paper
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {isEdit ? `עריכת הזמנה #${booking?.bookingNumber}` : 'הזמנה חדשה'}
              {selectedRoom && !isEdit && (
                <Typography variant="body2" color="text.secondary">
                  חדר {selectedRoom.roomNumber} | {format(formData.checkIn, 'dd/MM/yyyy', { locale: he })}
                </Typography>
              )}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {/* פרטי הזמנה */}
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 1.5, 
                  bgcolor: alpha(theme.palette.primary.main, 0.03),
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EventIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    פרטי הזמנה
                  </Typography>
                </Box>
                
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>חדר</InputLabel>
                      <Select
                        value={formData.roomId}
                        onChange={(e) => handleFieldChange('roomId', e.target.value)}
                        label="חדר"
                      >
                        {rooms.map(room => (
                          <MenuItem key={room._id} value={room._id}>
                            {room.roomNumber} - {room.type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <DatePicker
                      label="תאריך צ'ק אין"
                      value={formData.checkIn}
                      onChange={(date) => handleFieldChange('checkIn', date)}
                      format="dd/MM/yyyy"
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <DatePicker
                      label="תאריך צ'ק אאוט"
                      value={formData.checkOut}
                      onChange={(date) => handleFieldChange('checkOut', date)}
                      format="dd/MM/yyyy"
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="מספר לילות"
                      value={formData.nights}
                      onChange={(e) => handleFieldChange('nights', e.target.value)}
                      type="number"
                      size="small"
                      InputProps={{
                        inputProps: { min: 1 }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="מחיר ללא מע״מ"
                      value={formData.pricePerNightNoVat}
                      onChange={(e) => handleFieldChange('pricePerNightNoVat', e.target.value)}
                      type="number"
                      size="small"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₪</InputAdornment>
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="מחיר כולל מע״מ"
                      value={formData.pricePerNightWithVat}
                      onChange={(e) => handleFieldChange('pricePerNightWithVat', e.target.value)}
                      type="number"
                      size="small"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₪</InputAdornment>
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="סה״כ להזמנה"
                      value={formData.totalPrice}
                      onChange={(e) => handleFieldChange('totalPrice', e.target.value)}
                      type="number"
                      size="small"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₪</InputAdornment>
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.isTourist}
                          onChange={(e) => handleFieldChange('isTourist', e.target.checked)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">תייר (פטור ממע״מ)</Typography>}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* פרטי אורח ותשלום בשורה אחת */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                {/* פרטי אורח */}
                <Grid item xs={12} sm={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: alpha(theme.palette.info.main, 0.03),
                      borderRadius: 2,
                      height: '100%'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon color="info" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight={600}>
                        פרטי אורח
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="שם פרטי"
                          value={formData.guest.firstName}
                          onChange={(e) => handleFieldChange('guest.firstName', e.target.value)}
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="שם משפחה"
                          value={formData.guest.lastName}
                          onChange={(e) => handleFieldChange('guest.lastName', e.target.value)}
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="טלפון"
                          value={formData.guest.phone}
                          onChange={(e) => handleFieldChange('guest.phone', e.target.value)}
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="אימייל"
                          value={formData.guest.email}
                          onChange={(e) => handleFieldChange('guest.email', e.target.value)}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* פרטי תשלום */}
                <Grid item xs={12} sm={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: alpha(theme.palette.success.main, 0.03),
                      borderRadius: 2,
                      height: '100%'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PaymentIcon color="success" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight={600}>
                        פרטי תשלום
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.isPaid}
                            onChange={(e) => handleFieldChange('isPaid', e.target.checked)}
                            size="small"
                          />
                        }
                        label={<Typography variant="body2">שולם</Typography>}
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                    
                    {/* אינדיקציה בולטת לאמצעי תשלום כשההזמנה שולמה */}
                    {formData.isPaid && formData.paymentMethod && (
                      <Box 
                        sx={{ 
                          bgcolor: alpha(theme.palette.success.main, 0.1), 
                          p: 1, 
                          borderRadius: 1,
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: 'success.main',
                            animation: 'pulse 1.5s infinite',
                            '@keyframes pulse': {
                              '0%': { opacity: 0.6 },
                              '50%': { opacity: 1 },
                              '100%': { opacity: 0.6 }
                            }
                          }} 
                        />
                        <Typography variant="body2" fontWeight={500} color="success.dark">
                          שולם באמצעות {getPaymentMethodLabel(formData.paymentMethod)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Grid container spacing={1}>
                      {formData.isPaid && (
                        <Grid item xs={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>אמצעי תשלום</InputLabel>
                            <Select
                              value={formData.paymentMethod || ''}
                              onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                              label="אמצעי תשלום"
                              displayEmpty
                              required={formData.isPaid}
                            >
                              <MenuItem value="" disabled>
                                <em>בחר אמצעי תשלום</em>
                              </MenuItem>
                              {PAYMENT_METHODS.map(method => (
                                <MenuItem key={method.value} value={method.value}>
                                  {method.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}

                      {/* פרטי כרטיס אשראי - תמיד מוצגים */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                          פרטי כרטיס אשראי
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="מספר כרטיס"
                          value={formData.creditCard.cardNumber}
                          onChange={(e) => handleFieldChange('creditCard.cardNumber', e.target.value)}
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="תוקף"
                          value={formData.creditCard.expiryDate}
                          onChange={(e) => handleFieldChange('creditCard.expiryDate', e.target.value)}
                          placeholder="MM/YY"
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="CVV"
                          value={formData.creditCard.cvv}
                          onChange={(e) => handleFieldChange('creditCard.cvv', e.target.value)}
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="שם בעל הכרטיס"
                          value={formData.creditCard.cardholderName}
                          onChange={(e) => handleFieldChange('creditCard.cardholderName', e.target.value)}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>

            {/* הערות */}
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 1.5, 
                  bgcolor: alpha(theme.palette.warning.main, 0.03),
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <NoteIcon color="warning" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    הערות
                  </Typography>
                </Box>
                
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  size="small"
                />
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: theme.palette.background.paper }}>
          <Button onClick={onClose} color="inherit">
            ביטול
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={!formData.roomId || !formData.guest.firstName || !formData.guest.lastName}
          >
            {isEdit ? 'שמור שינויים' : 'צור הזמנה'}
          </Button>
        </DialogActions>
      </LocalizationProvider>
    </Dialog>
  );
};

export default BookingDialog; 