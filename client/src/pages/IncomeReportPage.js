import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
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
  Tooltip,
  useTheme,
  alpha,
  styled
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
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  Apartment as ApartmentIcon,
  BarChart as BarChartIcon,
  DonutLarge as DonutLargeIcon,
  MonetizationOn as MonetizationOnIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DateRange as DateRangeIcon,
  CompareArrows as CompareArrowsIcon,
  ArrowLeft as ArrowLeftIcon,
  CreditCard as CreditCardIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalance as AccountBalanceIcon,
  Payments as PaymentsIcon,
  LocalAtm as LocalAtmIcon,
  ImportExport as ImportExportIcon,
  Smartphone as SmartphoneIcon,
  Hotel as HotelIcon,
  Assessment as AssessmentIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { format, parseISO, startOfMonth, endOfMonth, getMonth, getYear, subMonths, differenceInMonths } from 'date-fns';
import { he } from 'date-fns/locale';
import { AuthContext } from '../context/AuthContext';
import { BookingContext } from '../context/BookingContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts';

// קומפוננטה של סרגל צדדי
const MinimalSidebar = styled(Box)(({ theme }) => ({
  position: 'fixed',
  left: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
  padding: '10px 0',
  backgroundColor: '#ffffff',
  boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
  borderRadius: '0 8px 8px 0',
  zIndex: 100,
  gap: '5px',
  width: '60px'
}));

const SidebarButton = styled(Tooltip)(({ theme, isActive }) => ({
  '& .MuiButtonBase-root': {
    padding: '12px',
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05)
    },
    transition: 'all 0.3s ease',
    borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
    borderRight: 'none'
  }
}));

// כרטיס נתונים מעוצב
const StatCard = ({ icon, title, value, subtext, color, trend, trendValue }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: 3,
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 30px 0 rgba(0,0,0,0.1)'
        },
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box 
        sx={{
          position: 'absolute',
          top: -30,
          right: -10,
          borderRadius: '50%',
          width: 130,
          height: 130,
          background: `linear-gradient(145deg, ${alpha(color, 0.12)} 20%, ${alpha(color, 0.04)} 80%)`,
          zIndex: 0
        }}
      />
      <CardContent sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(color, 0.15),
              color: color
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Chip
              size="small"
              icon={trendValue > 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
              label={`${Math.abs(trendValue).toFixed(1)}%`}
              sx={{
                fontSize: '0.7rem',
                bgcolor: trendValue > 0 ? alpha('#4caf50', 0.15) : alpha('#f44336', 0.15),
                color: trendValue > 0 ? '#4caf50' : '#f44336',
                fontWeight: 'bold',
                height: 22
              }}
            />
          )}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
          {value}
        </Typography>
        <Typography gutterBottom variant="body1" color="text.primary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtext}
        </Typography>
      </CardContent>
    </Card>
  );
};

// צבעים לגרפים
const CHART_COLORS = [
  '#2196f3', '#f44336', '#4caf50', '#ff9800', '#9c27b0', 
  '#795548', '#3f51b5', '#e91e63', '#009688', '#607d8b',
  '#8bc34a', '#ffc107', '#673ab7', '#cddc39', '#00bcd4'
];

// עיצוב טיפ מותאם אישית לגרפים
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 1.5, 
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{label}</Typography>
        {payload.map((entry, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: entry.color,
                borderRadius: '50%',
                mr: 1
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {entry.name}: ₪{entry.value.toLocaleString()}
            </Typography>
          </Box>
        ))}
      </Paper>
    );
  }
  return null;
};

// דף דוח הכנסות
const IncomeReportPage = () => {
  // קונטקסטים
  const { isAdmin } = useContext(AuthContext);
  const { bookings, loading, error, fetchBookings } = useContext(BookingContext);
  const theme = useTheme();
  const location = useLocation();
  const currentPath = location.pathname;

  // מצבים (סטייטים)
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [dynamicPaymentMethods, setDynamicPaymentMethods] = useState([]);

  // ערכים אפשריים לאמצעי תשלום
  const defaultPaymentMethods = [
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

  // פונקציה להשוואת נתונים בין תקופות
  const calculateComparisonData = (currentData, previousMonths = 6) => {
    // תקופה נוכחית (החודש הנבחר)
    const firstDayOfMonth = startOfMonth(selectedMonth);
    const lastDayOfMonth = endOfMonth(selectedMonth);
    
    // תקופה קודמת (החודש הקודם)
    const firstDayOfPrevMonth = startOfMonth(new Date(selectedMonth));
    firstDayOfPrevMonth.setMonth(firstDayOfPrevMonth.getMonth() - 1);
    const lastDayOfPrevMonth = endOfMonth(new Date(firstDayOfPrevMonth));
    
    // סכום הכנסות בחודש הנוכחי
    const currentTotal = currentData.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    
    // הזמנות מהחודש הקודם
    const previousMonthBookings = bookings.filter(booking => {
      const checkInDate = new Date(booking.checkIn);
      return checkInDate >= firstDayOfPrevMonth && 
             checkInDate <= lastDayOfPrevMonth && 
             booking.paymentStatus === 'paid';
    });
    
    // סכום הכנסות בחודש הקודם
    const previousTotal = previousMonthBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    
    // שינוי באחוזים
    const percentageChange = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : 0;
    
    // פורמוט שם החודש הקודם
    const prevMonthName = formatMonthAndYear(firstDayOfPrevMonth);
    
    return {
      currentTotal,
      previousTotal,
      percentageChange,
      currentCount: currentData.length,
      previousCount: previousMonthBookings.length,
      countPercentageChange: previousMonthBookings.length > 0 
        ? ((currentData.length - previousMonthBookings.length) / previousMonthBookings.length) * 100 
        : 0,
      prevMonthName
    };
  };

  // חישוב הכנסה ממוצעת לחודש
  const calculateMonthlyAverage = (data) => {
    const months = differenceInMonths(endDate, startDate) + 1;
    return months > 0 ? data.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0) / months : 0;
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

  // אפקט לעדכון ההזמנות כאשר החודש משתנה
  useEffect(() => {
    const firstDayOfMonth = startOfMonth(selectedMonth);
    const lastDayOfMonth = endOfMonth(selectedMonth);
    
    setStartDate(firstDayOfMonth);
    setEndDate(lastDayOfMonth);
    
    fetchBookings({
      startDate: format(firstDayOfMonth, 'yyyy-MM-dd'),
      endDate: format(lastDayOfMonth, 'yyyy-MM-dd')
    });
  }, [selectedMonth]);

  // איתור דינמי של כל אמצעי התשלום הקיימים במערכת
  useEffect(() => {
    // נזהה את כל אמצעי התשלום הקיימים במערכת באופן דינמי
    console.log('========= בדיקת זיהוי אמצעי תשלום =========');
    
    if (bookings && bookings.length > 0) {
      // מציאת כל אמצעי התשלום הייחודיים בהזמנות
      const uniqueMethods = [...new Set(bookings
        .filter(b => b.paymentMethod && b.paymentMethod.trim() !== '')
        .map(b => b.paymentMethod))];
      
      console.log('אמצעי תשלום ייחודיים שזוהו:', uniqueMethods);
      console.log('מספר אמצעי תשלום שזוהו:', uniqueMethods.length);
      
      // יצירת מערך אובייקטים עבור כל אמצעי תשלום
      const methodsArray = uniqueMethods.map(method => {
        // יצירת תווית ידידותית למשתמש
        let label = method;
        
        // הגדרת תוויות ברירת מחדל למקרים נפוצים
        if (method === 'credit') label = 'כרטיס אשראי';
        else if (method === 'cash') label = 'מזומן';
        else if (method === 'creditOr') label = 'כרטיס אשראי - אור';
        else if (method === 'creditRothschild') label = 'כרטיס אשראי - רוטשילד';
        else if (method === 'mizrahi') label = 'העברה בנקאית - מזרחי';
        else if (method === 'poalim') label = 'העברה בנקאית - פועלים';
        else if (method === 'other') label = 'אחר';
        
        return {
          value: method,
          label: label
        };
      });
      
      console.log('מערך אמצעי תשלום מעובד:', methodsArray);
      setDynamicPaymentMethods(methodsArray);
    }
  }, [bookings]);

  // פונקציה למעבר לחודש הבא
  const goToNextMonth = () => {
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setSelectedMonth(nextMonth);
  };

  // פונקציה למעבר לחודש הקודם
  const goToPreviousMonth = () => {
    const prevMonth = new Date(selectedMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setSelectedMonth(prevMonth);
  };

  // פונקציה לחזרה לחודש הנוכחי
  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  // פורמט שם החודש בעברית ושנה
  const formatMonthAndYear = (date) => {
    const month = hebrewMonths[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  // פונקציה לקבלת תווית אמצעי תשלום
  const getPaymentMethodLabel = (method) => {
    // אם יש לנו אמצעי תשלום דינמיים, נחפש בהם
    const dynamicMethod = dynamicPaymentMethods.find(m => m.value === method);
    if (dynamicMethod) return dynamicMethod.label;
    
    // אם לא נמצא, נחפש באמצעי התשלום הקבועים
    const defaultMethod = defaultPaymentMethods.find(m => m.value === method);
    if (defaultMethod) return defaultMethod.label;
    
    // אם עדיין לא נמצא, נחזיר את הערך המקורי או "אחר"
    return method || 'אחר';
  };

  // פונקציה לסינון הזמנות לפי כל הפילטרים
  const getFilteredBookings = useCallback(() => {
    console.log('===== תחילת סינון הזמנות לדוח הכנסות =====');
    
    if (!bookings || bookings.length === 0) {
      console.log('אין הזמנות לסינון');
      return [];
    }
    
    console.log(`סה"כ ${bookings.length} הזמנות לפני הסינון`);
    console.log(`סינון לפי תאריכים מ- ${format(startDate, 'yyyy-MM-dd')} עד- ${format(endDate, 'yyyy-MM-dd')}`);

    const filtered = bookings.filter(booking => {
      // לוגיקת הסינון
      const bookingCheckIn = new Date(booking.checkIn);
      const matchesDateRange = bookingCheckIn >= startDate && bookingCheckIn <= endDate;
      
      // בדיקת סטטוס תשלום - רק הזמנות ששולמו
      const matchesPaymentStatus = booking.paymentStatus === 'paid';
      
      // בדיקת אמצעי תשלום אם נבחר פילטר ספציפי
      const matchesPaymentMethod = paymentMethodFilter === 'all' || 
        // במקרה של אמצעי תשלום ריק, וודא שהוא מתאים לפילטר 'other'
        (booking.paymentMethod ? booking.paymentMethod === paymentMethodFilter : paymentMethodFilter === 'other');
      
      // בדיקת חדר אם נבחר פילטר ספציפי
      const matchesRoom = roomFilter === 'all' || booking.room?._id === roomFilter || booking.room === roomFilter;
      
      // הצגת פרטי סינון עבור כל הזמנה
      console.log(`הזמנה ${booking._id}, תאריך: ${format(bookingCheckIn, 'yyyy-MM-dd')}, סכום: ${booking.totalPrice}, סטטוס: ${booking.paymentStatus}, אמצעי תשלום: ${booking.paymentMethod || 'לא צוין'}`);
      console.log(`  נכללת בדוח: ${(matchesDateRange && matchesPaymentStatus && matchesPaymentMethod && matchesRoom) ? 'כן' : 'לא'}, סיבות לדחייה:`, {
        matchesDateRange,
        matchesPaymentStatus,
        matchesPaymentMethod,
        matchesRoom
      });
      
      return matchesDateRange && matchesPaymentStatus && matchesPaymentMethod && matchesRoom;
    });
    
    console.log(`לאחר סינון: ${filtered.length} הזמנות מתוך ${bookings.length}`);
    
    if (filtered.length > 0) {
      console.log('דוגמאות להזמנות שנכללו בדוח:');
      filtered.slice(0, 3).forEach(booking => {
        console.log(`- הזמנה ${booking._id}, חדר: ${booking.room?.roomNumber || 'לא ידוע'}, תאריך: ${format(new Date(booking.checkIn), 'yyyy-MM-dd')}, סכום: ₪${booking.totalPrice}, אמצעי תשלום: ${booking.paymentMethod || 'לא צוין'}`);
      });
    }
    
    console.log('===== סיום סינון הזמנות לדוח הכנסות =====');
    return filtered;
  }, [bookings, startDate, endDate, paymentMethodFilter, roomFilter]);

  // הפעלת פונקציית הסינון והמרה לנתונים
  const filteredData = useMemo(() => {
    return getFilteredBookings();
  }, [getFilteredBookings]);

  // חישוב סיכום הכנסות לפי אמצעי תשלום
  const incomeByPaymentMethod = useMemo(() => {
    console.log('========= חישוב הכנסות לפי אמצעי תשלום =========');
    if (!filteredData || filteredData.length === 0) return [];
    
    // קבוצה לפי אמצעי תשלום
    const groupedByMethod = filteredData.reduce((acc, booking) => {
      // הצגת מידע על הזמנה בעיבוד
      console.log(`מעבד הזמנה ID: ${booking._id}, אמצעי תשלום: '${booking.paymentMethod}', סטטוס: ${booking.paymentStatus}, סכום: ${booking.totalPrice}`);
      
      // שימוש ב-'other' רק אם אין לנו אמצעי תשלום כלל
      const method = booking.paymentMethod || 'other';
      
      if (!acc[method]) {
        acc[method] = {
          amount: 0,
          count: 0,
          label: getPaymentMethodLabel(method)
        };
      }
      
      acc[method].amount += booking.totalPrice || 0;
      acc[method].count += 1;
      
      return acc;
    }, {});
    
    console.log('קיבוץ הכנסות לפי אמצעי תשלום:', groupedByMethod);
    
    // המרה למערך עבור הגרף
    const result = Object.keys(groupedByMethod).map((method, index) => ({
      name: groupedByMethod[method].label,
      value: groupedByMethod[method].amount,
      count: groupedByMethod[method].count,
      // שדות נוספים לתאימות עם הממשק
      label: groupedByMethod[method].label,
      totalAmount: groupedByMethod[method].amount,
      // הוספת צבע
      color: CHART_COLORS[index % CHART_COLORS.length],
      id: method  // הוספת מזהה המקורי
    }));
    
    // מיון לפי סכום בסדר יורד
    result.sort((a, b) => b.value - a.value);
    
    console.log('מערך מוכן לגרף:', result);
    return result;
  }, [filteredData, getPaymentMethodLabel]);

  // רשימת אמצעי תשלום לתצוגה בפילטר
  const displayPaymentMethods = useMemo(() => {
    // אם יש לנו אמצעי תשלום דינמיים, נשתמש בהם
    if (dynamicPaymentMethods.length > 0) {
      return dynamicPaymentMethods;
    }
    // אחרת נשתמש באמצעי התשלום הקבועים
    return defaultPaymentMethods;
  }, [dynamicPaymentMethods]);

  // חישוב סיכום הכנסות לפי חודשים - עם עיבוד לגרף
  const incomeByMonth = useMemo(() => {
    const monthlyData = {};

    filteredData.forEach(booking => {
      const checkInDate = new Date(booking.checkIn);
      const monthYear = `${getMonth(checkInDate)}-${getYear(checkInDate)}`;
      const monthName = `${hebrewMonths[getMonth(checkInDate)]} ${getYear(checkInDate)}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { 
          month: monthName, 
          name: monthName,
          monthNum: getMonth(checkInDate),
          year: getYear(checkInDate),
          totalAmount: 0, 
          count: 0 
        };
      }

      monthlyData[monthYear].totalAmount += booking.totalPrice || 0;
      monthlyData[monthYear].count += 1;
      // הוספת שדות ויזואליים לגרף
      monthlyData[monthYear].הכנסות = booking.totalPrice || 0;
      monthlyData[monthYear].value = booking.totalPrice || 0;
    });

    // המרה למערך ומיון לפי תאריך
    return Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNum - b.monthNum;
    });
  }, [filteredData]);

  // חישוב סיכום הכנסות לפי חדר - עם עיבוד לגרף
  const incomeByRoom = useMemo(() => {
    const roomData = {};

    filteredData.forEach(booking => {
      if (!booking.room) return;
      
      const roomId = booking.room._id || booking.room;
      const roomNumber = booking.room.roomNumber || 'לא ידוע';
      
      if (!roomData[roomId]) {
        roomData[roomId] = { 
          roomId,
          roomNumber,
          name: `חדר ${roomNumber}`,
          totalAmount: 0, 
          count: 0,
          nights: 0,
          value: 0,
          fill: CHART_COLORS[Object.keys(roomData).length % CHART_COLORS.length]
        };
      }

      roomData[roomId].totalAmount += booking.totalPrice || 0;
      roomData[roomId].value = roomData[roomId].totalAmount;
      roomData[roomId].count += 1;
      roomData[roomId].nights += booking.nights || 0;
    });

    // מיון לפי מספר חדר
    return Object.values(roomData).sort((a, b) => a.roomNumber - b.roomNumber);
  }, [filteredData]);

  // חישוב הכנסות לפי ימי שבוע
  const incomeByDayOfWeek = useMemo(() => {
    const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const dayData = daysOfWeek.map(day => ({ name: day, הכנסות: 0, count: 0 }));
    
    filteredData.forEach(booking => {
      const checkInDate = new Date(booking.checkIn);
      const dayIndex = checkInDate.getDay();
      
      dayData[dayIndex].הכנסות += booking.totalPrice || 0;
      dayData[dayIndex].count += 1;
    });
    
    return dayData;
  }, [filteredData]);

  // טיפול בשינוי לשונית
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // סה"כ הכנסות
  const totalIncome = useMemo(() => {
    return filteredData.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  }, [filteredData]);

  // סה"כ הזמנות
  const totalBookings = filteredData.length;

  // ממוצע הכנסה להזמנה
  const averageIncomePerBooking = totalBookings > 0 ? (totalIncome / totalBookings) : 0;
  
  // ממוצע הכנסה חודשית
  const monthlyAverageIncome = calculateMonthlyAverage(filteredData);

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
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      {/* סרגל צדדי */}
      <MinimalSidebar>
        <SidebarButton title="לוח מחוונים" placement="right" isActive={currentPath === '/dashboard'}>
          <IconButton
            component={RouterLink}
            to="/dashboard"
            aria-label="dashboard"
          >
            <DashboardIcon sx={{ color: isActive => isActive ? '#3498db' : theme.palette.text.secondary, '&:hover': { color: '#2980b9' } }} />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="יומן הזמנות" placement="right" isActive={currentPath === '/dashboard/bookings-calendar'}>
          <IconButton
            component={RouterLink}
            to="/dashboard/bookings-calendar"
            aria-label="bookings-calendar"
          >
            <CalendarMonthIcon sx={{ color: isActive => isActive ? '#e74c3c' : theme.palette.text.secondary, '&:hover': { color: '#c0392b' } }} />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="106 / Airport" placement="right" isActive={currentPath === '/dashboard/simple-bookings'}>
          <IconButton
            component={RouterLink}
            to="/dashboard/simple-bookings"
            aria-label="airport"
          >
            <HotelIcon sx={{ color: isActive => isActive ? '#f39c12' : theme.palette.text.secondary, '&:hover': { color: '#d35400' } }} />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="דו״ח הכנסות" placement="right" isActive={currentPath === '/dashboard/income-report'}>
          <IconButton
            component={RouterLink}
            to="/dashboard/income-report"
            aria-label="income-report"
          >
            <AssessmentIcon sx={{ color: isActive => isActive ? '#9b59b6' : theme.palette.text.secondary, '&:hover': { color: '#8e44ad' } }} />
          </IconButton>
        </SidebarButton>
        
        <SidebarButton title="אתר הבית" placement="right" isActive={currentPath === '/'}>
          <IconButton
            component={RouterLink}
            to="/"
            aria-label="home"
          >
            <LanguageIcon sx={{ color: isActive => isActive ? '#2ecc71' : theme.palette.text.secondary, '&:hover': { color: '#27ae60' } }} />
          </IconButton>
        </SidebarButton>
      </MinimalSidebar>

      <Container maxWidth="xl" sx={{ 
        mt: 4, 
        mb: 4,
        paddingLeft: '65px',
        animation: 'fadeIn 0.5s ease-in-out',
        '@keyframes fadeIn': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      }}>
      {/* כותרת ופירורי לחם */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 15px 0 rgba(0,0,0,0.05)'
        }}
      >
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              color: theme.palette.primary.main
            }}
          >
            <SummarizeIcon sx={{ mr: 1.5, fontSize: '1.8rem' }} />
            דוח הכנסות - {formatMonthAndYear(selectedMonth)}
          </Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <Link component={RouterLink} to="/dashboard" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
              <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              לוח בקרה
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <SummarizeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              דוח הכנסות {formatMonthAndYear(selectedMonth)}
            </Typography>
          </Breadcrumbs>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<DownloadIcon />} 
          onClick={downloadCSV}
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            fontWeight: 600
          }}
        >
          הורד דוח
        </Button>
      </Paper>

      {/* כרטיסי סטטיסטיקה */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            icon={<MonetizationOnIcon />}
            title="סה״כ הכנסות"
            value={`₪${totalIncome.toLocaleString()}`}
            subtext="בתקופה הנבחרת"
            color={theme.palette.primary.main}
            trend={comparisonData !== null}
            trendValue={comparisonData?.percentageChange}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            icon={<CalendarMonthIcon />}
            title="מספר הזמנות"
            value={totalBookings}
            subtext="הזמנות ששולמו"
            color="#e91e63"
            trend={comparisonData !== null}
            trendValue={comparisonData?.countPercentageChange}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            icon={<CurrencyExchangeIcon />}
            title="ממוצע להזמנה"
            value={`₪${averageIncomePerBooking.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subtext="הכנסה ממוצעת להזמנה"
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            icon={<DonutLargeIcon />}
            title="ממוצע חודשי"
            value={`₪${monthlyAverageIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subtext="הכנסה ממוצעת לחודש"
            color="#ff9800"
          />
        </Grid>
      </Grid>

      {/* פילטרים */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box display="flex" flexDirection="row" alignItems="center" mb={2}>
          <FilterAltIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
          <Typography variant="h6" component="h2" fontWeight={600}>
            סינון והגדרות
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.primary.main, 0.03)
              }}
            >
              <IconButton 
                onClick={goToPreviousMonth}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                  borderRadius: 2,
                  width: 36,
                  height: 36
                }}
              >
                <ArrowLeftIcon fontSize="small" sx={{ transform: 'rotate(180deg)' }} />
              </IconButton>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={goToCurrentMonth}
              >
                <Typography variant="h5" fontWeight={600} sx={{ color: theme.palette.primary.main }}>
                  {formatMonthAndYear(selectedMonth)}
                </Typography>
                <Chip 
                  label="חזרה לחודש נוכחי" 
                  size="small" 
                  variant="outlined" 
                  icon={<DateRangeIcon fontSize="small" />}
                  sx={{ mt: 0.5, fontSize: '0.7rem' }}
                  onClick={goToCurrentMonth}
                />
              </Box>
              
              <IconButton 
                onClick={goToNextMonth}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                  borderRadius: 2,
                  width: 36,
                  height: 36
                }}
              >
                <ArrowLeftIcon fontSize="small" />
              </IconButton>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>אמצעי תשלום</InputLabel>
              <Select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                label="אמצעי תשלום"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">כל אמצעי התשלום</MenuItem>
                
                {/* רשימת אמצעי תשלום מהמודל */}
                <MenuItem value="credit" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CreditCardIcon sx={{ mr: 1, color: '#2196f3', fontSize: '1.2rem' }} />
                    כרטיס אשראי
                  </Box>
                </MenuItem>
                <MenuItem value="cash" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoneyIcon sx={{ mr: 1, color: '#4caf50', fontSize: '1.2rem' }} />
                    מזומן
                  </Box>
                </MenuItem>
                <MenuItem value="creditOr" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CreditCardIcon sx={{ mr: 1, color: '#9c27b0', fontSize: '1.2rem' }} />
                    אשראי אור יהודה
                  </Box>
                </MenuItem>
                <MenuItem value="creditRothschild" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CreditCardIcon sx={{ mr: 1, color: '#f44336', fontSize: '1.2rem' }} />
                    אשראי רוטשילד
                  </Box>
                </MenuItem>
                <MenuItem value="mizrahi" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountBalanceIcon sx={{ mr: 1, color: '#ff9800', fontSize: '1.2rem' }} />
                    העברה בנקאית - מזרחי
                  </Box>
                </MenuItem>
                <MenuItem value="poalim" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountBalanceIcon sx={{ mr: 1, color: '#795548', fontSize: '1.2rem' }} />
                    העברה בנקאית - פועלים
                  </Box>
                </MenuItem>
                <MenuItem value="other" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PaymentIcon sx={{ mr: 1, color: '#607d8b', fontSize: '1.2rem' }} />
                    אחר
                  </Box>
                </MenuItem>
                
                {/* אמצעי תשלום שנמצאו באופן דינמי - רק אם לא קיימים ברשימה הקבועה */}
                {dynamicPaymentMethods.filter(method => 
                  !['credit', 'cash', 'creditOr', 'creditRothschild', 'mizrahi', 'poalim', 'other', ''].includes(method.value)
                ).map((method) => (
                  <MenuItem key={method.value} value={method.value} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      '& .MuiSvgIcon-root': { 
                        mr: 1,
                        color: method.color || 'inherit',
                        fontSize: '1.2rem'
                      }
                    }}>
                      {method.icon || <PaymentIcon fontSize="small" />}
                    {method.label}
                    </Box>
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
                sx={{ borderRadius: 2 }}
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

      {/* גרפים ונתונים */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 0, 
          mb: 4, 
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        {/* לשוניות לבחירת סוג הדוח */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="סוגי דוחות הכנסה" 
          sx={{ 
            px: 2, 
            pt: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              borderRadius: '8px 8px 0 0',
              minHeight: 48,
              fontWeight: 500
            },
            '& .Mui-selected': {
              fontWeight: 600
            }
          }}
        >
          <Tab icon={<EventNoteIcon />} iconPosition="start" label="לפי חודשים" />
          <Tab icon={<PaymentIcon />} iconPosition="start" label="לפי אמצעי תשלום" />
          <Tab icon={<RoomIcon />} iconPosition="start" label="לפי חדרים" />
          <Tab icon={<ShowChartIcon />} iconPosition="start" label="ניתוח מגמות" />
        </Tabs>

        <Box sx={{ p: 3 }}>
        {/* תצוגת מידע לפי חודשים */}
        {tabValue === 0 && (
            <Grid container spacing={4}>
              <Grid item xs={12} lg={8}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  הכנסות לפי חודשים
                </Typography>
                <Box sx={{ height: 400, mt: 2 }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : incomeByMonth.length === 0 ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography>לא נמצאו נתונים לתקופה זו</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomeByMonth}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha('#000', 0.09)} />
                        <XAxis 
                          dataKey="month" 
                          dy={10}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                        />
                        <YAxis 
                          tickFormatter={(value) => `₪${value.toLocaleString()}`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip 
                          cursor={{ fill: alpha(theme.palette.primary.main, 0.1) }}
                          content={<CustomTooltip />}
                        />
                        <Bar 
                          dataKey="totalAmount" 
                          name="הכנסות" 
                          fill={theme.palette.primary.main}
                          radius={[4, 4, 0, 0]}
                          barSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} lg={4}>
                <TableContainer sx={{ maxHeight: 400, overflowY: 'auto', borderRadius: 2 }}>
                  <Table stickyHeader>
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
                          <TableRow key={index} sx={{
                            '&:nth-of-type(odd)': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                          }}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                                <EventNoteIcon color="action" sx={{ mr: 1, fontSize: '1rem' }} />
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
                        <TableRow sx={{ 
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          fontWeight: 'bold'
                        }}>
                    <TableCell><strong>סה"כ</strong></TableCell>
                    <TableCell align="center"><strong>{totalBookings}</strong></TableCell>
                    <TableCell align="right"><strong>₪{totalIncome.toLocaleString()}</strong></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
              </Grid>
            </Grid>
        )}

        {/* תצוגת מידע לפי אמצעי תשלום */}
        {tabValue === 1 && (
            <Grid container spacing={4}>
              <Grid item xs={12} lg={7}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  התפלגות הכנסות לפי אמצעי תשלום
                </Typography>
                <Box sx={{ height: 400, mt: 2 }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : incomeByPaymentMethod.length === 0 ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography>לא נמצאו נתונים לאמצעי התשלום הנבחרים</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeByPaymentMethod}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {incomeByPaymentMethod.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} lg={5}>
                <TableContainer sx={{ maxHeight: 400, overflowY: 'auto', borderRadius: 2 }}>
                  <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>אמצעי תשלום</TableCell>
                  <TableCell align="center">מספר הזמנות</TableCell>
                  <TableCell align="right">סה"כ הכנסות</TableCell>
                        <TableCell align="right">אחוז</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                          <TableCell colSpan={4} align="center">
                      <CircularProgress size={30} sx={{ my: 2 }} />
                    </TableCell>
                  </TableRow>
                ) : incomeByPaymentMethod.length === 0 ? (
                  <TableRow>
                          <TableCell colSpan={4} align="center">
                      לא נמצאו נתוני הכנסות לאמצעי התשלום הנבחרים
                    </TableCell>
                  </TableRow>
                ) : (
                  incomeByPaymentMethod.map((item, index) => (
                          <TableRow key={index} sx={{
                            '&:nth-of-type(odd)': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                          }}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                                <Box 
                                  sx={{ 
                                    width: 12, 
                                    height: 12, 
                                    borderRadius: '50%', 
                                    mr: 1,
                                    bgcolor: item.color || CHART_COLORS[index % CHART_COLORS.length]
                                  }} 
                                />
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  '& .MuiSvgIcon-root': { 
                                    mr: 1,
                                    color: item.color || CHART_COLORS[index % CHART_COLORS.length],
                                    fontSize: '1.2rem'
                                  }
                                }}>
                                  {item.icon || <PaymentIcon fontSize="small" />}
                          {item.label}
                                </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{item.count}</TableCell>
                      <TableCell align="right">₪{item.totalAmount.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              {((item.totalAmount / totalIncome) * 100).toFixed(1)}%
                            </TableCell>
                    </TableRow>
                  ))
                )}
                {/* שורת סיכום */}
                {incomeByPaymentMethod.length > 0 && (
                        <TableRow sx={{ 
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          fontWeight: 'bold'
                        }}>
                    <TableCell><strong>סה"כ</strong></TableCell>
                    <TableCell align="center"><strong>{totalBookings}</strong></TableCell>
                    <TableCell align="right"><strong>₪{totalIncome.toLocaleString()}</strong></TableCell>
                          <TableCell align="right"><strong>100%</strong></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
              </Grid>
            </Grid>
        )}

        {/* תצוגת מידע לפי חדרים */}
        {tabValue === 2 && (
            <Grid container spacing={4}>
              <Grid item xs={12} lg={8}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  הכנסות לפי חדרים
                </Typography>
                <Box sx={{ height: 400, mt: 2 }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : incomeByRoom.length === 0 ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography>לא נמצאו נתונים לחדרים הנבחרים</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={incomeByRoom}
                        layout="vertical"
                        margin={{ left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={alpha('#000', 0.09)} />
                        <XAxis 
                          type="number" 
                          tickFormatter={(value) => `₪${value.toLocaleString()}`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip 
                          cursor={{ fill: alpha(theme.palette.primary.main, 0.1) }}
                          content={<CustomTooltip />}
                        />
                        <Bar 
                          dataKey="totalAmount" 
                          name="הכנסות" 
                          radius={[0, 4, 4, 0]}
                        >
                          {incomeByRoom.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} lg={4}>
                <TableContainer sx={{ maxHeight: 400, overflowY: 'auto', borderRadius: 2 }}>
                  <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>חדר</TableCell>
                        <TableCell align="center">לילות</TableCell>
                  <TableCell align="right">סה"כ הכנסות</TableCell>
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
                          <TableRow key={index} sx={{
                            '&:nth-of-type(odd)': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                          }}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                                <Box 
                                  sx={{ 
                                    width: 12, 
                                    height: 12, 
                                    borderRadius: '50%', 
                                    mr: 1,
                                    bgcolor: CHART_COLORS[index % CHART_COLORS.length]
                                  }} 
                                />
                          חדר {item.roomNumber}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{item.nights}</TableCell>
                      <TableCell align="right">₪{item.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
                {/* שורת סיכום */}
                {incomeByRoom.length > 0 && (
                        <TableRow sx={{ 
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          fontWeight: 'bold'
                        }}>
                    <TableCell><strong>סה"כ</strong></TableCell>
                    <TableCell align="center">
                      <strong>
                        {incomeByRoom.reduce((sum, item) => sum + item.nights, 0)}
                      </strong>
                    </TableCell>
                    <TableCell align="right"><strong>₪{totalIncome.toLocaleString()}</strong></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
              </Grid>
            </Grid>
          )}

          {/* תצוגת ניתוח מגמות */}
          {tabValue === 3 && (
            <Grid container spacing={4}>
              <Grid item xs={12} lg={6}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  מגמת הכנסות לאורך זמן
                </Typography>
                <Box sx={{ height: 300, mt: 2 }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : incomeByMonth.length === 0 ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography>לא נמצאו נתונים לתקופה זו</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={incomeByMonth}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha('#000', 0.09)} />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tickFormatter={(value) => `₪${value.toLocaleString()}`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="totalAmount" 
                          name="הכנסות"
                          stroke={theme.palette.primary.main} 
                          fillOpacity={1} 
                          fill="url(#colorIncome)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  התפלגות לפי ימי שבוע
                </Typography>
                <Box sx={{ height: 300, mt: 2 }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : incomeByDayOfWeek.length === 0 ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography>לא נמצאו נתונים לתקופה זו</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomeByDayOfWeek}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha('#000', 0.09)} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tickFormatter={(value) => `₪${value.toLocaleString()}`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="הכנסות" 
                          fill="#ff9800"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Grid>
              
              {comparisonData && (
                <Grid item xs={12}>
                  <Paper 
                    elevation={0} 
                    sx={{
                      mt: 2,
                      p: 3,
                      borderRadius: 2,
                      background: theme.palette.background.default,
                      border: '1px dashed',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                      <CompareArrowsIcon sx={{ mr: 1 }} />
                      השוואה לחודש קודם
                    </Typography>
                    <Grid container spacing={2} mt={1}>
                      <Grid item xs={12} md={12} sx={{ mb: 2 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          p: 2,
                          borderRadius: 2
                        }}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              חודש נוכחי
                            </Typography>
                            <Typography variant="h6" fontWeight={600}>
                              {formatMonthAndYear(selectedMonth)}
                            </Typography>
                          </Box>
                          <Box sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>
                            <ArrowLeftIcon sx={{ transform: 'rotate(180deg)', color: theme.palette.text.secondary }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              חודש קודם
                            </Typography>
                            <Typography variant="h6" fontWeight={600}>
                              {comparisonData.prevMonthName}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            הכנסות בחודש הנוכחי
                          </Typography>
                          <Typography variant="h5" fontWeight={600} sx={{ color: theme.palette.primary.main }}>
                            ₪{comparisonData.currentTotal.toLocaleString()}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              {comparisonData.currentCount} הזמנות
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            הכנסות בחודש הקודם
                          </Typography>
                          <Typography variant="h5" fontWeight={600}>
                            ₪{comparisonData.previousTotal.toLocaleString()}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              {comparisonData.previousCount} הזמנות
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            height: '100%', 
                            border: '1px solid', 
                            borderColor: 'divider',
                            bgcolor: comparisonData.percentageChange > 0 ? alpha('#4caf50', 0.05) : alpha('#f44336', 0.05)
                          }}
                        >
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            השינוי בהכנסות
                          </Typography>
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              mt: 0.5
                            }}
                          >
                            <Typography 
                              variant="h5" 
                              fontWeight={600}
                              sx={{ 
                                color: comparisonData.percentageChange > 0 ? '#4caf50' : '#f44336',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              {comparisonData.percentageChange > 0 ? (
                                <ArrowUpwardIcon sx={{ mr: 0.5 }} />
                              ) : (
                                <ArrowDownwardIcon sx={{ mr: 0.5 }} />
                              )}
                              {Math.abs(comparisonData.percentageChange).toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="body2" 
                              sx={{
                                color: comparisonData.countPercentageChange > 0 ? '#4caf50' : '#f44336',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '0.7rem'
                              }}
                            >
                              {comparisonData.countPercentageChange > 0 ? (
                                <ArrowUpwardIcon sx={{ mr: 0.5, fontSize: '0.8rem' }} />
                              ) : (
                                <ArrowDownwardIcon sx={{ mr: 0.5, fontSize: '0.8rem' }} />
                              )}
                              {Math.abs(comparisonData.countPercentageChange).toFixed(1)}% במספר ההזמנות
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      </Paper>

      {/* שגיאה במידת הצורך */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2,
            borderRadius: 2, 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)' 
          }}
        >
          שגיאה בטעינת נתונים: {error}
        </Alert>
      )}
    </Container>
    </LocalizationProvider>
  );
};

export default IncomeReportPage; 