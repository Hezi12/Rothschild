import React, { useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  IconButton,
  InputAdornment,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Box,
  Paper
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarMonthIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Hotel as HotelIcon,
  Delete as DeleteIcon,
  FilterAlt as FilterIcon,
  Visibility as VisibilityIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { formatHebrewDate } from '../utils/dateUtils';

const SearchDialog = ({ 
  open, 
  onClose, 
  onViewBooking, 
  onJumpToDate,
  getPaymentMethodLabel 
}) => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useState({
    guestName: '',
    phone: '',
    email: '',
    roomNumber: '',
    dateFrom: null,
    dateTo: null,
    bookingStatus: '',
    paymentStatus: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const handleClose = () => {
    onClose();
  };
  
  const handleSearch = async () => {
    try {
      setIsSearching(true);
      
      // בניית פרמטרים לחיפוש (נוסיף רק פרמטרים שהוזנו)
      const queryParams = {};
      
      if (searchParams.guestName) queryParams.guestName = searchParams.guestName;
      if (searchParams.phone) queryParams.phone = searchParams.phone;
      if (searchParams.email) queryParams.email = searchParams.email;
      if (searchParams.roomNumber) queryParams.roomNumber = searchParams.roomNumber;
      if (searchParams.dateFrom) queryParams.dateFrom = format(searchParams.dateFrom, 'yyyy-MM-dd');
      if (searchParams.dateTo) queryParams.dateTo = format(searchParams.dateTo, 'yyyy-MM-dd');
      if (searchParams.bookingStatus) queryParams.status = searchParams.bookingStatus;
      if (searchParams.paymentStatus) queryParams.isPaid = searchParams.paymentStatus === 'paid';
      
      // קריאה ל-API
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/search`, {
        params: queryParams,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setSearchResults(response.data.data);
      } else {
        console.error('שגיאה בחיפוש:', response.data.message);
      }
    } catch (error) {
      console.error('שגיאה בחיפוש הזמנות:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleClearSearch = () => {
    setSearchParams({
      guestName: '',
      phone: '',
      email: '',
      roomNumber: '',
      dateFrom: null,
      dateTo: null,
      bookingStatus: '',
      paymentStatus: ''
    });
    setSearchResults([]);
  };
  
  const handleViewBooking = (booking) => {
    onViewBooking(booking);
    handleClose();
  };
  
  const handleJumpToDate = (date) => {
    onJumpToDate(date);
    handleClose();
  };
  
  // פונקציות לנוחיות - בחירת טווחי זמן מוגדרים מראש
  const setLastMonth = () => {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    
    setSearchParams(prev => ({
      ...prev,
      dateFrom: lastMonth,
      dateTo: today
    }));
  };
  
  const setLastWeek = () => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    
    setSearchParams(prev => ({
      ...prev,
      dateFrom: lastWeek,
      dateTo: today
    }));
  };
  
  const setToday = () => {
    const today = new Date();
    
    setSearchParams(prev => ({
      ...prev,
      dateFrom: today,
      dateTo: today
    }));
  };
  
  const setTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setSearchParams(prev => ({
      ...prev,
      dateFrom: tomorrow,
      dateTo: tomorrow
    }));
  };
  
  const setNextWeek = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    setSearchParams(prev => ({
      ...prev,
      dateFrom: today,
      dateTo: nextWeek
    }));
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          bgcolor: '#ffffff', 
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          dir: 'rtl',
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: '500', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
          <SearchIcon sx={{ mr: 1, fontSize: '1.1rem', color: '#666' }} /> חיפוש הזמנות
        </Typography>
        <IconButton 
          onClick={handleClose} 
          size="small"
          sx={{ color: '#888' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2, dir: 'rtl' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sx={{ mb: 1, mt: 1 }}>
            <Typography variant="subtitle2" sx={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#666', 
              display: 'flex', 
              alignItems: 'center',
              borderBottom: '1px solid #f5f5f5',
              pb: 0.5
            }}>
              <PersonIcon sx={{ color: '#888', mr: 1, fontSize: '1rem' }} />
              פרטי אורח
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="שם אורח"
              name="guestName"
              value={searchParams.guestName}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px'
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon fontSize="small" sx={{ color: alpha('#666', 0.7) }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="טלפון"
              name="phone"
              value={searchParams.phone}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px'
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon fontSize="small" sx={{ color: alpha('#666', 0.7) }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="אימייל"
              name="email"
              value={searchParams.email}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px'
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" sx={{ color: alpha('#666', 0.7) }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="מספר חדר"
              name="roomNumber"
              value={searchParams.roomNumber}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px'
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <HotelIcon fontSize="small" sx={{ color: alpha('#666', 0.7) }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sx={{ mb: 1, mt: 1 }}>
            <Typography variant="subtitle2" sx={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#666', 
              display: 'flex', 
              alignItems: 'center',
              borderBottom: '1px solid #f5f5f5',
              pb: 0.5
            }}>
              <CalendarMonthIcon sx={{ color: '#888', mr: 1, fontSize: '1rem' }} />
              טווח תאריכים
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="מתאריך"
                value={searchParams.dateFrom}
                onChange={(date) => setSearchParams(prev => ({ ...prev, dateFrom: date }))}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '4px'
                      }
                    },
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventIcon fontSize="small" sx={{ color: alpha('#666', 0.7) }} />
                        </InputAdornment>
                      ),
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="עד תאריך"
                value={searchParams.dateTo}
                onChange={(date) => setSearchParams(prev => ({ ...prev, dateTo: date }))}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '4px'
                      }
                    },
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventIcon fontSize="small" sx={{ color: alpha('#666', 0.7) }} />
                        </InputAdornment>
                      ),
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 0.5 }}>
              <Chip 
                label="חודש אחרון" 
                variant="outlined" 
                onClick={setLastMonth} 
                icon={<EventIcon fontSize="small" />}
                clickable
                size="small"
                sx={{ borderRadius: '4px', fontSize: '0.75rem', height: '24px', bgcolor: '#f9f9f9', color: '#666' }}
              />
              <Chip 
                label="שבוע אחרון" 
                variant="outlined" 
                onClick={setLastWeek} 
                icon={<EventIcon fontSize="small" />}
                clickable
                size="small"
                sx={{ borderRadius: '4px', fontSize: '0.75rem', height: '24px', bgcolor: '#f9f9f9', color: '#666' }}
              />
              <Chip 
                label="היום" 
                variant="outlined" 
                onClick={setToday} 
                icon={<EventIcon fontSize="small" />}
                clickable
                size="small"
                sx={{ borderRadius: '4px', fontSize: '0.75rem', height: '24px', bgcolor: '#f9f9f9', color: '#666' }}
              />
              <Chip 
                label="מחר" 
                variant="outlined" 
                onClick={setTomorrow} 
                icon={<EventIcon fontSize="small" />}
                clickable
                size="small"
                sx={{ borderRadius: '4px', fontSize: '0.75rem', height: '24px', bgcolor: '#f9f9f9', color: '#666' }}
              />
              <Chip 
                label="שבוע הבא" 
                variant="outlined" 
                onClick={setNextWeek} 
                icon={<EventIcon fontSize="small" />}
                clickable
                size="small"
                sx={{ borderRadius: '4px', fontSize: '0.75rem', height: '24px', bgcolor: '#f9f9f9', color: '#666' }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sx={{ mb: 1, mt: 1 }}>
            <Typography variant="subtitle2" sx={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#666', 
              display: 'flex', 
              alignItems: 'center',
              borderBottom: '1px solid #f5f5f5',
              pb: 0.5
            }}>
              <FilterIcon sx={{ color: '#888', mr: 1, fontSize: '1rem' }} />
              סינון לפי סטטוס
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl 
              fullWidth 
              variant="outlined" 
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px'
                }
              }}
            >
              <InputLabel>סטטוס הזמנה</InputLabel>
              <Select
                label="סטטוס הזמנה"
                name="bookingStatus"
                value={searchParams.bookingStatus}
                onChange={handleInputChange}
              >
                <MenuItem value="">הכל</MenuItem>
                <MenuItem value="confirmed">מאושר</MenuItem>
                <MenuItem value="pending">ממתין</MenuItem>
                <MenuItem value="canceled">בוטל</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl 
              fullWidth 
              variant="outlined" 
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px'
                }
              }}
            >
              <InputLabel>סטטוס תשלום</InputLabel>
              <Select
                label="סטטוס תשלום"
                name="paymentStatus"
                value={searchParams.paymentStatus}
                onChange={handleInputChange}
              >
                <MenuItem value="">הכל</MenuItem>
                <MenuItem value="paid">שולם</MenuItem>
                <MenuItem value="pending">לא שולם</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2, mb: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleSearch} 
              startIcon={<SearchIcon fontSize="small" />}
              disabled={isSearching}
              size="small"
              sx={{ 
                mr: 1,
                borderRadius: '4px',
                px: 2.5,
                bgcolor: '#78a9e0',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#6698d6',
                  boxShadow: 'none'
                }
              }}
            >
              {isSearching ? 'מחפש...' : 'חפש'}
            </Button>
            <Button 
              variant="text" 
              color="inherit" 
              onClick={handleClearSearch}
              startIcon={<DeleteIcon fontSize="small" />}
              size="small"
              sx={{ 
                borderRadius: '4px',
                color: '#666'
              }}
            >
              נקה
            </Button>
          </Grid>
          
          {/* תוצאות חיפוש */}
          {searchResults.length > 0 && (
            <Grid item xs={12}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  border: `1px solid ${alpha('#ddd', 0.5)}`
                }}
              >
                <Box sx={{ 
                  py: 0.8,
                  px: 1.5, 
                  display: 'flex', 
                  alignItems: 'center',
                  borderBottom: `1px solid ${alpha('#ddd', 0.5)}`,
                  bgcolor: '#f9f9f9'
                }}>
                  <SearchIcon sx={{ mr: 1, color: '#666', fontSize: '0.9rem' }} />
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: '#555' }}>
                    נמצאו {searchResults.length} תוצאות
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 280 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        <TableCell sx={{ fontWeight: '500', fontSize: '0.8rem', color: '#555', py: 1 }}>מס' הזמנה</TableCell>
                        <TableCell sx={{ fontWeight: '500', fontSize: '0.8rem', color: '#555', py: 1 }}>שם אורח</TableCell>
                        <TableCell sx={{ fontWeight: '500', fontSize: '0.8rem', color: '#555', py: 1 }}>חדר</TableCell>
                        <TableCell sx={{ fontWeight: '500', fontSize: '0.8rem', color: '#555', py: 1 }}>תאריכים</TableCell>
                        <TableCell sx={{ fontWeight: '500', fontSize: '0.8rem', color: '#555', py: 1 }}>סטטוס</TableCell>
                        <TableCell sx={{ fontWeight: '500', fontSize: '0.8rem', color: '#555', py: 1 }}>פעולות</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchResults.map(booking => (
                        <TableRow 
                          key={booking._id}
                          hover
                          sx={{ 
                            '&:hover': { 
                              bgcolor: alpha('#f0f7ff', 0.5),
                              cursor: 'pointer'
                            }
                          }}
                        >
                          <TableCell sx={{ fontSize: '0.8rem', py: 0.8 }}>{booking.bookingNumber || '-'}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', py: 0.8 }}>
                            {booking.guest?.firstName} {booking.guest?.lastName}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', py: 0.8 }}>
                            {booking.roomNumber || (booking.room && booking.room.roomNumber)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', py: 0.8 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                              <Typography variant="caption" sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                <EventIcon fontSize="inherit" sx={{ mr: 0.5, fontSize: '0.75rem', color: '#888' }} />
                                {formatHebrewDate(booking.checkIn || booking.startDate)}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                <EventIcon fontSize="inherit" sx={{ mr: 0.5, fontSize: '0.75rem', color: '#888' }} />
                                {formatHebrewDate(booking.checkOut || booking.endDate)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', py: 0.8 }}>
                            <Chip 
                              size="small" 
                              color={
                                booking.status === 'confirmed' ? 'success' :
                                booking.status === 'canceled' ? 'error' : 'warning'
                              }
                              label={
                                booking.status === 'confirmed' ? 'מאושר' :
                                booking.status === 'canceled' ? 'בוטל' : 'ממתין'
                              }
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: '20px', borderRadius: '4px' }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 0.8 }}>
                            <Box sx={{ display: 'flex', gap: 0.8 }}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewBooking(booking)}
                                sx={{ 
                                  bgcolor: alpha('#6698d6', 0.08),
                                  p: 0.5,
                                  '&:hover': { bgcolor: alpha('#6698d6', 0.15) }
                                }}
                              >
                                <VisibilityIcon sx={{ fontSize: '1rem', color: '#6698d6' }} />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => handleJumpToDate(new Date(booking.checkIn || booking.startDate))}
                                sx={{ 
                                  bgcolor: alpha('#888', 0.08),
                                  p: 0.5,
                                  '&:hover': { bgcolor: alpha('#888', 0.15) }
                                }}
                              >
                                <CalendarMonthIcon sx={{ fontSize: '1rem', color: '#888' }} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 1.5, 
        borderTop: '1px solid #f0f0f0',
        dir: 'rtl',
        bgcolor: '#fafafa'
      }}>
        <Button 
          onClick={handleClose} 
          variant="text" 
          color="inherit"
          size="small"
          sx={{ 
            borderRadius: '4px',
            color: '#666'
          }}
        >
          סגור
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SearchDialog; 