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
  Search as SearchIcon,
  CalendarMonth as CalendarIcon
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showFullCardNumber, setShowFullCardNumber] = useState(false);

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

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setViewDialogOpen(true);
  };
  
  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedBooking(null);
  };
  
  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedBooking(null);
  };
  
  const handleSaveBooking = async () => {
    try {
      // כאן יהיה הקוד לשמירת השינויים בהזמנה
      toast.success('ההזמנה עודכנה בהצלחה');
      setEditDialogOpen(false);
      fetchBookings(); // רענון הנתונים
    } catch (error) {
      console.error('שגיאה בעדכון ההזמנה:', error);
      toast.error('שגיאה בעדכון ההזמנה');
    }
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
      // השגת הטוקן מהמצב המקומי של הדפדפן
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('נדרשת התחברות מחדש');
        return;
      }

      // יצירת URL עם הטוקן כפרמטר שאילתה
      const invoiceUrl = `${process.env.REACT_APP_API_URL}/invoices/${bookingId}?token=${token}`;
      
      // פתיחת חלון חדש לחשבונית
      window.open(invoiceUrl, '_blank');
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

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            ניהול הזמנות
          </Typography>
          
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<CalendarIcon />}
              component={Link}
              to="/dashboard/bookings/calendar"
              sx={{ ml: 1 }}
            >
              תצוגת לוח שנה
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ ml: 1 }}
            >
              {showFilters ? 'הסתר סינון' : 'הצג סינון'}
            </Button>
          </Box>
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
      </Paper>
      
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
                              onClick={() => handleViewBooking(booking)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ערוך">
                            <IconButton 
                              size="small" 
                              color="secondary"
                              onClick={() => handleEditBooking(booking)}
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
      
      {/* דיאלוג צפייה בפרטים */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>פרטי הזמנה</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">פרטי אורח:</Typography>
                  <Typography>שם: {selectedBooking.guest.name}</Typography>
                  <Typography>טלפון: {selectedBooking.guest.phone}</Typography>
                  <Typography>אימייל: {selectedBooking.guest.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">פרטי חדר:</Typography>
                  <Typography>מספר חדר: {selectedBooking.room.roomNumber}</Typography>
                  <Typography>סוג: {selectedBooking.room.type === 'standard' ? 'סטנדרט' : selectedBooking.room.type}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">פרטי הזמנה:</Typography>
                  <Typography>תאריך צ'ק-אין: {formatDate(selectedBooking.checkIn)}</Typography>
                  <Typography>תאריך צ'ק-אאוט: {formatDate(selectedBooking.checkOut)}</Typography>
                  <Typography>מספר לילות: {selectedBooking.nights}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">פרטי תשלום:</Typography>
                  <Typography>סכום כולל: {selectedBooking.totalPrice.toFixed(2)} ₪</Typography>
                  <Typography>סטטוס תשלום: {selectedBooking.paymentStatus === 'paid' ? 'שולם' : 'ממתין'}</Typography>
                  <Typography>אמצעי תשלום: {getPaymentMethodText(selectedBooking.paymentMethod)}</Typography>
                  
                  {/* פרטי כרטיס אשראי */}
                  {selectedBooking.paymentMethod === 'credit' && selectedBooking.creditCardDetails && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 1 }}>פרטי כרטיס אשראי:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography>
                          מספר כרטיס: {showFullCardNumber 
                            ? selectedBooking.creditCardDetails.cardNumber 
                            : '*'.repeat(selectedBooking.creditCardDetails.cardNumber?.length - 4) + 
                              selectedBooking.creditCardDetails.cardNumber?.slice(-4) || 'לא הוזן'}
                        </Typography>
                        <Button 
                          size="small" 
                          sx={{ ml: 1 }}
                          onClick={() => setShowFullCardNumber(!showFullCardNumber)}
                        >
                          {showFullCardNumber ? 'הסתר' : 'הצג מלא'}
                        </Button>
                      </Box>
                      <Typography>
                        תוקף: {selectedBooking.creditCardDetails.expiryDate || 'לא הוזן'}
                      </Typography>
                      <Typography>
                        CVV: {selectedBooking.creditCardDetails.cvv || 'לא הוזן'}
                      </Typography>
                    </>
                  )}
                </Grid>
                {selectedBooking.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">הערות:</Typography>
                    <Typography>{selectedBooking.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>סגור</Button>
          <Button 
            color="primary" 
            onClick={() => {
              handleCloseViewDialog();
              handleEditBooking(selectedBooking);
            }}
          >
            ערוך
          </Button>
          <Button 
            color="info"
            onClick={() => handlePrintInvoice(selectedBooking._id)}
          >
            הדפס חשבונית
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג עריכה */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>עריכת הזמנה</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                פונקציונליות העריכה המלאה תפותח בהמשך. כרגע ניתן לערוך רק הערות וסטטוס תשלום.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="הערות"
                    multiline
                    rows={4}
                    fullWidth
                    defaultValue={selectedBooking.notes || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="סטטוס תשלום"
                    value={selectedBooking.paymentStatus}
                    SelectProps={{
                      native: true
                    }}
                  >
                    <option value="paid">שולם</option>
                    <option value="pending">ממתין</option>
                  </TextField>
                </Grid>
                
                {/* פרטי כרטיס אשראי בעריכה */}
                {selectedBooking.paymentMethod === 'credit' && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">פרטי כרטיס אשראי:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">
                        מספר כרטיס: {showFullCardNumber 
                          ? selectedBooking.creditCardDetails?.cardNumber 
                          : '*'.repeat(selectedBooking.creditCardDetails?.cardNumber?.length - 4) + 
                            selectedBooking.creditCardDetails?.cardNumber?.slice(-4) || 'לא הוזן'}
                      </Typography>
                      <Button 
                        size="small" 
                        sx={{ ml: 1 }}
                        onClick={() => setShowFullCardNumber(!showFullCardNumber)}
                      >
                        {showFullCardNumber ? 'הסתר' : 'הצג מלא'}
                      </Button>
                    </Box>
                    <Typography variant="body2">
                      תוקף: {selectedBooking.creditCardDetails?.expiryDate || 'לא הוזן'}
                    </Typography>
                    <Typography variant="body2">
                      CVV: {selectedBooking.creditCardDetails?.cvv || 'לא הוזן'}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>ביטול</Button>
          <Button color="primary" onClick={handleSaveBooking}>
            שמור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingsListPage; 