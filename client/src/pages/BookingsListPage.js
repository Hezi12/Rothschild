import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
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
  TablePagination,
  Button,
  IconButton,
  Chip,
  TextField,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

const BookingsListPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // טעינת הזמנות
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // בניית מחרוזת שאילתה לפי הפילטרים
      let queryParams = '';
      
      if (filters.startDate && filters.endDate) {
        queryParams += `startDate=${filters.startDate.toISOString()}&endDate=${filters.endDate.toISOString()}`;
      }
      
      if (filters.status) {
        queryParams += `${queryParams ? '&' : ''}status=${filters.status}`;
      }
      
      const url = `${process.env.REACT_APP_API_URL}/bookings${queryParams ? `?${queryParams}` : ''}`;
      const response = await axios.get(url);
      
      setBookings(response.data.data);
    } catch (error) {
      console.error('שגיאה בטעינת הזמנות:', error);
      toast.error('שגיאה בטעינת הזמנות. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  // טיפול בשינוי עמוד
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // טיפול בשינוי מספר שורות לעמוד
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // פתיחת דיאלוג מחיקה
  const handleOpenDeleteDialog = (booking) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  // סגירת דיאלוג מחיקה
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setBookingToDelete(null);
  };

  // מחיקת הזמנה
  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/bookings/${bookingToDelete._id}`);
      
      // עדכון הרשימה
      setBookings(bookings.filter(booking => booking._id !== bookingToDelete._id));
      
      toast.success('ההזמנה נמחקה בהצלחה');
    } catch (error) {
      console.error('שגיאה במחיקת הזמנה:', error);
      toast.error('שגיאה במחיקת ההזמנה. אנא נסה שוב מאוחר יותר.');
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // טיפול בשינוי פילטרים
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // החלת פילטרים
  const applyFilters = () => {
    fetchBookings();
  };

  // איפוס פילטרים
  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      status: ''
    });
    
    // טעינה מחדש ללא פילטרים
    fetchBookings();
  };

  // הדפסת חשבונית
  const handlePrintInvoice = async (bookingId) => {
    try {
      // פתיחת חלון חדש לחשבונית
      window.open(`${process.env.REACT_APP_API_URL}/invoices/${bookingId}`, '_blank');
    } catch (error) {
      console.error('שגיאה בהדפסת חשבונית:', error);
      toast.error('שגיאה בהדפסת החשבונית. אנא נסה שוב מאוחר יותר.');
    }
  };

  // פורמט תאריך
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  // פורמט סטטוס תשלום
  const getPaymentStatusChip = (status) => {
    return (
      <Chip 
        label={status === 'paid' ? 'שולם' : 'ממתין'} 
        color={status === 'paid' ? 'success' : 'warning'}
        size="small"
      />
    );
  };

  // פורמט אמצעי תשלום
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'credit':
        return 'כרטיס אשראי';
      case 'cash':
        return 'מזומן';
      case 'bank_transfer':
        return 'העברה בנקאית';
      default:
        return method;
    }
  };

  // פונקציה לצפייה בפרטי הזמנה
  const handleViewBooking = (bookingId) => {
    // מאחר שאין דף נפרד לצפייה בהזמנה, נציג הודעה
    toast.info('תכונת צפייה בפרטי הזמנה בפיתוח. תהיה זמינה בקרוב!');
    // אפשר גם לפתוח דיאלוג עם פרטי ההזמנה במקום לנווט לדף חדש
  };

  // פונקציה לעריכת הזמנה
  const handleEditBooking = (bookingId) => {
    // מאחר שאין דף נפרד לעריכת הזמנה, נציג הודעה
    toast.info('תכונת עריכת הזמנה בפיתוח. תהיה זמינה בקרוב!');
    // אפשר גם לפתוח דיאלוג עריכה במקום לנווט לדף חדש
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          ניהול הזמנות
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'הסתר פילטרים' : 'הצג פילטרים'}
        </Button>
      </Box>
      
      {/* פילטרים */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  label="מתאריך"
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  label="עד תאריך"
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="סטטוס תשלום"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                SelectProps={{
                  native: true
                }}
              >
                <option value="">הכל</option>
                <option value="paid">שולם</option>
                <option value="pending">ממתין</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={applyFilters}
                >
                  חפש
                </Button>
                <Button
                  variant="outlined"
                  onClick={resetFilters}
                >
                  אפס
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* טבלת הזמנות */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>מס' הזמנה</TableCell>
                <TableCell>שם אורח</TableCell>
                <TableCell>חדר</TableCell>
                <TableCell>תאריך צ'ק-אין</TableCell>
                <TableCell>תאריך צ'ק-אאוט</TableCell>
                <TableCell>סטטוס תשלום</TableCell>
                <TableCell>אמצעי תשלום</TableCell>
                <TableCell>סכום</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress size={40} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    לא נמצאו הזמנות
                  </TableCell>
                </TableRow>
              ) : (
                bookings
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>{booking._id.substring(0, 8)}...</TableCell>
                      <TableCell>{booking.guest.name}</TableCell>
                      <TableCell>{booking.room.roomNumber}</TableCell>
                      <TableCell>{formatDate(booking.checkIn)}</TableCell>
                      <TableCell>{formatDate(booking.checkOut)}</TableCell>
                      <TableCell>{getPaymentStatusChip(booking.paymentStatus)}</TableCell>
                      <TableCell>{getPaymentMethodText(booking.paymentMethod)}</TableCell>
                      <TableCell>{booking.totalPrice.toFixed(2)} ₪</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex' }}>
                          <Tooltip title="צפה בפרטים">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleViewBooking(booking._id)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ערוך">
                            <IconButton 
                              size="small" 
                              color="secondary"
                              onClick={() => handleEditBooking(booking._id)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="מחק">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleOpenDeleteDialog(booking)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="הדפס חשבונית">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => handlePrintInvoice(booking._id)}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={bookings.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="שורות בעמוד:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        />
      </Paper>
      
      {/* דיאלוג מחיקה */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>מחיקת הזמנה</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם אתה בטוח שברצונך למחוק את ההזמנה של {bookingToDelete?.guest.name}?
            פעולה זו אינה ניתנת לביטול.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>ביטול</Button>
          <Button onClick={handleDeleteBooking} color="error" autoFocus>
            מחק
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingsListPage; 