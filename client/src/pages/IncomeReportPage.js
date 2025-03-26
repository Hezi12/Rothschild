import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tabs,
  Tab,
  Chip,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarMonthIcon,
  Summarize as SummarizeIcon,
  PieChart as PieChartIcon,
  FilterAlt as FilterAltIcon,
  Refresh as RefreshIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  Room as RoomIcon,
  EventNote as EventNoteIcon,
  Payment as PaymentIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { format, parseISO, startOfMonth, endOfMonth, getMonth, getYear } from 'date-fns';
import { he } from 'date-fns/locale';
import { AuthContext } from '../context/AuthContext';
import { BookingContext } from '../context/BookingContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// דף דוח הכנסות
const IncomeReportPage = () => {
  // קונטקסטים
  const { isAdmin } = useContext(AuthContext);
  const { bookings, loading, error, fetchBookings } = useContext(BookingContext);

  // מצבים (סטייטים)
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // ערכים אפשריים לאמצעי תשלום
  const paymentMethods = [
    { value: 'credit', label: 'כרטיס אשראי' },
    { value: 'cash', label: 'מזומן' },
    { value: 'creditOr', label: 'כרטיס אשראי - אור' },
    { value: 'creditRothschild', label: 'כרטיס אשראי - רוטשילד' },
    { value: 'mizrahi', label: 'העברה בנקאית - מזרחי' },
    { value: 'poalim', label: 'העברה בנקאית - פועלים' },
    { value: 'other', label: 'אחר' }
  ];

  // שמות החודשים בעברית
  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  // פונקציה לטעינת חדרים
  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/rooms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // מיון החדרים לפי מספר החדר
        const sortedRooms = [...data.data].sort((a, b) => a.roomNumber - b.roomNumber);
        setRooms(sortedRooms);
      }
    } catch (error) {
      console.error('שגיאה בטעינת חדרים:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  // אפקט לטעינת מידע התחלתי
  useEffect(() => {
    // בקשה לטעינת הזמנות
    fetchBookings({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
    
    // טעינת חדרים
    fetchRooms();
  }, []);

  // אפקט לעדכון ההזמנות כאשר התאריכים משתנים
  useEffect(() => {
    fetchBookings({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
  }, [startDate, endDate]);

  // פילטור הזמנות לפי סטטוס תשלום, חדר ואמצעי תשלום
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    return bookings.filter(booking => {
      // רק הזמנות ששולמו
      if (booking.paymentStatus !== 'paid') return false;

      // פילטור לפי חדר אם נבחר חדר ספציפי
      if (roomFilter !== 'all' && booking.room && booking.room._id !== roomFilter) {
        return false;
      }

      // פילטור לפי אמצעי תשלום
      if (paymentMethodFilter !== 'all' && booking.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      return true;
    });
  }, [bookings, roomFilter, paymentMethodFilter]);

  // חישוב סיכום הכנסות לפי חודשים
  const incomeByMonth = useMemo(() => {
    const monthlyData = {};

    filteredBookings.forEach(booking => {
      const checkInDate = new Date(booking.checkIn);
      const monthYear = `${getMonth(checkInDate)}-${getYear(checkInDate)}`;
      const monthName = `${hebrewMonths[getMonth(checkInDate)]} ${getYear(checkInDate)}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { 
          month: monthName, 
          totalAmount: 0, 
          count: 0 
        };
      }

      monthlyData[monthYear].totalAmount += booking.totalPrice || 0;
      monthlyData[monthYear].count += 1;
    });

    // המרה למערך ומיון לפי תאריך
    return Object.values(monthlyData).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      
      if (aYear !== bYear) return aYear - bYear;
      return hebrewMonths.indexOf(aMonth) - hebrewMonths.indexOf(bMonth);
    });
  }, [filteredBookings]);

  // חישוב סיכום הכנסות לפי אמצעי תשלום
  const incomeByPaymentMethod = useMemo(() => {
    const paymentData = {};

    filteredBookings.forEach(booking => {
      const method = booking.paymentMethod || 'other';
      
      if (!paymentData[method]) {
        const methodLabel = paymentMethods.find(m => m.value === method)?.label || 'אחר';
        paymentData[method] = { 
          method: method,
          label: methodLabel,
          totalAmount: 0, 
          count: 0 
        };
      }

      paymentData[method].totalAmount += booking.totalPrice || 0;
      paymentData[method].count += 1;
    });

    return Object.values(paymentData);
  }, [filteredBookings]);

  // חישוב סיכום הכנסות לפי חדר
  const incomeByRoom = useMemo(() => {
    const roomData = {};

    filteredBookings.forEach(booking => {
      if (!booking.room) return;
      
      const roomId = booking.room._id || booking.room;
      const roomNumber = booking.room.roomNumber || 'לא ידוע';
      
      if (!roomData[roomId]) {
        roomData[roomId] = { 
          roomId,
          roomNumber,
          totalAmount: 0, 
          count: 0,
          nights: 0
        };
      }

      roomData[roomId].totalAmount += booking.totalPrice || 0;
      roomData[roomId].count += 1;
      roomData[roomId].nights += booking.nights || 0;
    });

    // מיון לפי מספר חדר
    return Object.values(roomData).sort((a, b) => a.roomNumber - b.roomNumber);
  }, [filteredBookings]);

  // טיפול בשינוי לשונית
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // סה"כ הכנסות
  const totalIncome = useMemo(() => {
    return filteredBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  }, [filteredBookings]);

  // סה"כ הזמנות
  const totalBookings = filteredBookings.length;

  // ממוצע הכנסה להזמנה
  const averageIncomePerBooking = totalBookings > 0 ? (totalIncome / totalBookings) : 0;

  // הורדת דוח כקובץ CSV
  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // כותרות העמודות בהתאם ללשונית הנוכחית
    if (tabValue === 0) {
      csvContent += "חודש,מספר הזמנות,סה\"כ הכנסות (₪)\n";
      incomeByMonth.forEach(item => {
        csvContent += `${item.month},${item.count},${item.totalAmount.toFixed(2)}\n`;
      });
    } else if (tabValue === 1) {
      csvContent += "אמצעי תשלום,מספר הזמנות,סה\"כ הכנסות (₪)\n";
      incomeByPaymentMethod.forEach(item => {
        csvContent += `${item.label},${item.count},${item.totalAmount.toFixed(2)}\n`;
      });
    } else if (tabValue === 2) {
      csvContent += "מספר חדר,מספר הזמנות,מספר לילות,סה\"כ הכנסות (₪)\n";
      incomeByRoom.forEach(item => {
        csvContent += `${item.roomNumber},${item.count},${item.nights},${item.totalAmount.toFixed(2)}\n`;
      });
    }
    
    // יצירת קישור להורדה
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `דוח_הכנסות_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* כותרת ופירורי לחם */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            דוח הכנסות
          </Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <Link component={RouterLink} to="/dashboard" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
              <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              לוח בקרה
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <SummarizeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              דוח הכנסות
            </Typography>
          </Breadcrumbs>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<DownloadIcon />} 
          onClick={downloadCSV}>
          הורד דוח
        </Button>
      </Stack>

      {/* תיבות סיכום */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                סה"כ הכנסות
              </Typography>
              <Typography variant="h4" component="div">
                ₪{totalIncome.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                בתקופה הנבחרת
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                מספר הזמנות
              </Typography>
              <Typography variant="h4" component="div">
                {totalBookings}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                הזמנות ששולמו
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                ממוצע להזמנה
              </Typography>
              <Typography variant="h4" component="div">
                ₪{averageIncomePerBooking.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                הכנסה ממוצעת
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* פילטרים */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box display="flex" flexDirection="row" alignItems="center" mb={1}>
          <FilterAltIcon color="action" />
          <Typography variant="h6" component="h2" ml={1}>
            סינון והגדרות
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
              <DatePicker
                label="מתאריך"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
              <DatePicker
                label="עד תאריך"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>אמצעי תשלום</InputLabel>
              <Select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                label="אמצעי תשלום"
              >
                <MenuItem value="all">כל אמצעי התשלום</MenuItem>
                {paymentMethods.map((method) => (
                  <MenuItem key={method.value} value={method.value}>
                    {method.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>חדר</InputLabel>
              <Select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                label="חדר"
              >
                <MenuItem value="all">כל החדרים</MenuItem>
                {rooms.map((room) => (
                  <MenuItem key={room._id} value={room._id}>
                    חדר {room.roomNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* תוכן הדוח */}
      <Paper sx={{ p: 2, mb: 4 }}>
        {/* לשוניות לבחירת סוג הדוח */}
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="סוגי דוחות הכנסה" sx={{ mb: 2 }}>
          <Tab icon={<EventNoteIcon />} label="לפי חודשים" />
          <Tab icon={<PaymentIcon />} label="לפי אמצעי תשלום" />
          <Tab icon={<RoomIcon />} label="לפי חדרים" />
        </Tabs>
        <Divider sx={{ mb: 2 }} />

        {/* תצוגת מידע לפי חודשים */}
        {tabValue === 0 && (
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>חודש</TableCell>
                  <TableCell align="center">מספר הזמנות</TableCell>
                  <TableCell align="right">סה"כ הכנסות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <CircularProgress size={30} sx={{ my: 2 }} />
                    </TableCell>
                  </TableRow>
                ) : incomeByMonth.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      לא נמצאו נתוני הכנסות לתקופה זו
                    </TableCell>
                  </TableRow>
                ) : (
                  incomeByMonth.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <EventNoteIcon color="action" sx={{ mr: 1 }} />
                          {item.month}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{item.count}</TableCell>
                      <TableCell align="right">₪{item.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
                {/* שורת סיכום */}
                {incomeByMonth.length > 0 && (
                  <TableRow sx={{ backgroundColor: (theme) => theme.palette.action.hover }}>
                    <TableCell><strong>סה"כ</strong></TableCell>
                    <TableCell align="center"><strong>{totalBookings}</strong></TableCell>
                    <TableCell align="right"><strong>₪{totalIncome.toLocaleString()}</strong></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* תצוגת מידע לפי אמצעי תשלום */}
        {tabValue === 1 && (
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>אמצעי תשלום</TableCell>
                  <TableCell align="center">מספר הזמנות</TableCell>
                  <TableCell align="right">סה"כ הכנסות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <CircularProgress size={30} sx={{ my: 2 }} />
                    </TableCell>
                  </TableRow>
                ) : incomeByPaymentMethod.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      לא נמצאו נתוני הכנסות לאמצעי התשלום הנבחרים
                    </TableCell>
                  </TableRow>
                ) : (
                  incomeByPaymentMethod.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <PaymentIcon color="action" sx={{ mr: 1 }} />
                          {item.label}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{item.count}</TableCell>
                      <TableCell align="right">₪{item.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
                {/* שורת סיכום */}
                {incomeByPaymentMethod.length > 0 && (
                  <TableRow sx={{ backgroundColor: (theme) => theme.palette.action.hover }}>
                    <TableCell><strong>סה"כ</strong></TableCell>
                    <TableCell align="center"><strong>{totalBookings}</strong></TableCell>
                    <TableCell align="right"><strong>₪{totalIncome.toLocaleString()}</strong></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* תצוגת מידע לפי חדרים */}
        {tabValue === 2 && (
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>חדר</TableCell>
                  <TableCell align="center">מספר הזמנות</TableCell>
                  <TableCell align="center">מספר לילות</TableCell>
                  <TableCell align="right">סה"כ הכנסות</TableCell>
                  <TableCell align="right">ממוצע ללילה</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress size={30} sx={{ my: 2 }} />
                    </TableCell>
                  </TableRow>
                ) : incomeByRoom.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      לא נמצאו נתוני הכנסות לחדרים הנבחרים
                    </TableCell>
                  </TableRow>
                ) : (
                  incomeByRoom.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <RoomIcon color="action" sx={{ mr: 1 }} />
                          חדר {item.roomNumber}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{item.count}</TableCell>
                      <TableCell align="center">{item.nights}</TableCell>
                      <TableCell align="right">₪{item.totalAmount.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        ₪{item.nights > 0 
                          ? (item.totalAmount / item.nights).toLocaleString(undefined, { maximumFractionDigits: 0 }) 
                          : 0}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {/* שורת סיכום */}
                {incomeByRoom.length > 0 && (
                  <TableRow sx={{ backgroundColor: (theme) => theme.palette.action.hover }}>
                    <TableCell><strong>סה"כ</strong></TableCell>
                    <TableCell align="center"><strong>{totalBookings}</strong></TableCell>
                    <TableCell align="center">
                      <strong>
                        {incomeByRoom.reduce((sum, item) => sum + item.nights, 0)}
                      </strong>
                    </TableCell>
                    <TableCell align="right"><strong>₪{totalIncome.toLocaleString()}</strong></TableCell>
                    <TableCell align="right">-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* שגיאה במידת הצורך */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          שגיאה בטעינת נתונים: {error}
        </Alert>
      )}
    </Container>
  );
};

export default IncomeReportPage; 