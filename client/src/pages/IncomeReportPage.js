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
  Language as LanguageIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Today as TodayIcon,
  NightsStay as NightsStayIcon
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
const StatCard = ({ icon, title, value, subtext, color }) => {
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

// אובייקט צבעים נושאיים לשימוש בכרטיסיות
const THEME_COLORS = {
  primary: '#2196f3',
  success: '#4caf50',
  info: '#00bcd4',
  warning: '#ff9800',
  error: '#f44336',
  purple: '#9c27b0',
  indigo: '#3f51b5',
  teal: '#009688',
  cyan: '#00bcd4'
};

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

// קומפוננטה של כרטיס חדר
const RoomCard = ({ roomData, theme, currentDay, daysInMonth }) => {
  // חישוב התפוסה באחוזים
  const occupancyPercent = roomData.occupancyPercent || 0;
  const occupancyDays = roomData.occupancyDays || 0;
  const totalDays = roomData.totalPossibleDays || daysInMonth;
  
  // קביעת צבע לפי אחוזי התפוסה
  let occupancyColor = THEME_COLORS.info;
  if (occupancyPercent >= 80) occupancyColor = THEME_COLORS.success;
  else if (occupancyPercent >= 50) occupancyColor = THEME_COLORS.primary;
  else if (occupancyPercent >= 30) occupancyColor = THEME_COLORS.warning;
  else if (occupancyPercent < 30) occupancyColor = THEME_COLORS.error;
  
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        },
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: '1px solid',
        borderColor: alpha(roomData.fill, 0.3)
      }}
    >
      {/* רקע מדורג עם מספר חדר */}
      <Box
        sx={{
          height: '60px',
          background: `linear-gradient(135deg, ${alpha(roomData.fill, 0.9)} 0%, ${alpha(roomData.fill, 0.5)} 100%)`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 1
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            opacity: 0.05,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
            backgroundSize: 'cover'
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
          <RoomIcon sx={{ color: '#fff', mr: 1 }} />
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 700,
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              zIndex: 2
            }}
          >
            חדר {roomData.roomNumber}
          </Typography>
        </Box>
      </Box>
      
      <CardContent sx={{ p: 2, pt: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* תצוגת אחוזי תפוסה */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              position: 'relative',
              width: 100,
              height: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* רקע מעגל דרך 100% */}
            <CircularProgress
              variant="determinate"
              value={100}
              sx={{
                color: alpha(theme.palette.divider, 0.2),
                position: 'absolute',
                left: 0,
                top: 0
              }}
              size={100}
              thickness={6}
            />
            {/* המעגל עצמו */}
            <CircularProgress
              variant="determinate"
              value={occupancyPercent}
              sx={{
                color: occupancyColor,
                position: 'absolute',
                left: 0,
                top: 0
              }}
              size={100}
              thickness={6}
            />
            {/* תווית במרכז המעגל */}
            <Box
              sx={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h5" component="div" sx={{ fontWeight: 700, lineHeight: 1 }}>
                {occupancyPercent}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                תפוסה
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* מידע נוסף על התפוסה */}
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <NightsStayIcon fontSize="small" sx={{ mr: 0.5, color: occupancyColor, opacity: 0.8 }} />
            {occupancyDays} מתוך {totalDays} ימים מושכרים
          </Box>
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* נתונים כספיים */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <MonetizationOnIcon fontSize="small" sx={{ mr: 0.5, color: roomData.fill, opacity: 0.6 }} />
              הכנסה ללילה:
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              ₪{roomData.perNightAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <EventNoteIcon fontSize="small" sx={{ mr: 0.5, color: roomData.fill, opacity: 0.6 }} />
              סה"כ לילות:
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {roomData.nights}
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mt: 1,
            py: 1.5,
            px: 1.5,
            borderRadius: 1.5,
            bgcolor: alpha(roomData.fill, 0.08),
            border: '1px dashed',
            borderColor: alpha(roomData.fill, 0.3)
          }}>
            <Typography variant="subtitle2" color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5, color: roomData.fill }} />
              סה"כ הכנסות:
            </Typography>
            <Typography variant="h6" fontWeight={700} color={roomData.fill} sx={{ textShadow: '0 0 1px rgba(0,0,0,0.05)' }}>
              ₪{roomData.totalAmount.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
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
  const [tabValue, setTabValue] = useState(0); // שינוי לערך ברירת מחדל 0 - תצוגת הכנסות לפי חדרים
  const [mainTabValue, setMainTabValue] = useState(0); // שליטה בטאב העליון
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

  // פונקצית עזר לחישוב אחוזי תפוסה חכמים
  const calculateOccupancy = useCallback((bookings, rooms, selectedMonth) => {
    // מידע על החודש
    const today = new Date();
    const firstDayOfMonth = startOfMonth(selectedMonth);
    const lastDayOfMonth = endOfMonth(selectedMonth);
    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    
    // בדיקה אם החודש הנבחר הוא החודש הנוכחי
    const isCurrentMonth = today.getMonth() === selectedMonth.getMonth() && 
                            today.getFullYear() === selectedMonth.getFullYear();
    
    // מספר הימים שחלפו בחודש הנוכחי (אם רלוונטי)
    const daysPassed = isCurrentMonth ? Math.min(today.getDate(), daysInMonth) : daysInMonth;
    
    // נתונים עבור כל חדר
    const roomsOccupancy = {};
    
    // סופר את הימים התפוסים עבור כל חדר
    if (rooms && rooms.length > 0) {
      // אתחול אובייקט לכל חדר
      rooms.forEach(room => {
        roomsOccupancy[room._id] = {
          roomId: room._id,
          roomNumber: room.roomNumber,
          occupiedDays: new Set(), // השתמש בסט כדי למנוע ספירה כפולה של ימים
          pastOccupiedDays: new Set(), // ימים תפוסים שכבר חלפו
          futureOccupiedDays: new Set(), // ימים תפוסים עתידיים באותו חודש
          totalPossibleDays: daysInMonth,
          relevantDays: daysPassed, // ימים רלוונטים לחישוב אחוזי תפוסה עד היום
        };
      });
      
      // עבור בהזמנות ומצא את הימים התפוסים לכל חדר
      bookings.forEach(booking => {
        if (!booking.room) return;
        
        const roomId = typeof booking.room === 'string' ? booking.room : booking.room._id;
        if (!roomsOccupancy[roomId]) return;
        
        const checkIn = new Date(booking.checkIn);
        const nights = booking.nights || 1;
        
        // עבור על כל הלילות של ההזמנה
        for (let night = 0; night < nights; night++) {
          const currentDate = new Date(checkIn);
          currentDate.setDate(currentDate.getDate() + night);
          
          // בדוק אם התאריך בחודש הנבחר
          if (currentDate.getMonth() === selectedMonth.getMonth() && 
              currentDate.getFullYear() === selectedMonth.getFullYear()) {
              
            const dayOfMonth = currentDate.getDate();
            
            // הוספת היום לסט הימים התפוסים
            roomsOccupancy[roomId].occupiedDays.add(dayOfMonth);
            
            // בדיקה אם היום כבר חלף או עתידי
            if (isCurrentMonth && dayOfMonth <= today.getDate()) {
              roomsOccupancy[roomId].pastOccupiedDays.add(dayOfMonth);
            } else {
              roomsOccupancy[roomId].futureOccupiedDays.add(dayOfMonth);
            }
          }
        }
      });
      
      // חישוב אחוזי תפוסה ומידע נוסף
      Object.keys(roomsOccupancy).forEach(roomId => {
        const roomData = roomsOccupancy[roomId];
        
        // חישוב תפוסה כוללת בחודש
        roomData.occupancyDays = roomData.occupiedDays.size;
        roomData.occupancyPercent = Math.round((roomData.occupancyDays / daysInMonth) * 100);
        
        // חישוב תפוסה עד כה (רק עבור החודש הנוכחי)
        if (isCurrentMonth) {
          roomData.pastDaysCount = roomData.pastOccupiedDays.size;
          roomData.pastOccupancyPercent = Math.round((roomData.pastDaysCount / daysPassed) * 100);
          
          // תפוסה צפויה בהתבסס על ההזמנות הקיימות
          roomData.projectedOccupancyDays = roomData.occupancyDays;
          roomData.projectedOccupancyPercent = roomData.occupancyPercent;
        } else {
          // לחודשים אחרים, התפוסה "עד כה" והצפויה זהות
          roomData.pastDaysCount = roomData.occupancyDays;
          roomData.pastOccupancyPercent = roomData.occupancyPercent;
          roomData.projectedOccupancyDays = roomData.occupancyDays;
          roomData.projectedOccupancyPercent = roomData.occupancyPercent;
        }
      });
    }
    
    // חישוב תפוסה כוללת לכל החדרים
    let totalOccupiedDays = 0;
    let totalPastOccupiedDays = 0;
    let totalPossibleDays = 0;
    let totalPastPossibleDays = 0;
    
    Object.values(roomsOccupancy).forEach(room => {
      totalOccupiedDays += room.occupancyDays;
      totalPastOccupiedDays += room.pastDaysCount;
      totalPossibleDays += daysInMonth;
      totalPastPossibleDays += daysPassed;
    });
    
    // חישוב אחוזי תפוסה כלליים
    const totalRooms = Object.keys(roomsOccupancy).length;
    const overallOccupancy = {
      totalRooms,
      daysInMonth,
      daysPassed,
      isCurrentMonth,
      
      // תפוסה כוללת
      totalOccupiedDays,
      totalPossibleDays: totalRooms * daysInMonth,
      occupancyPercent: totalPossibleDays > 0 ? Math.round((totalOccupiedDays / totalPossibleDays) * 100) : 0,
      
      // תפוסה עד כה
      totalPastOccupiedDays,
      totalPastPossibleDays: totalRooms * daysPassed,
      pastOccupancyPercent: totalPastPossibleDays > 0 ? Math.round((totalPastOccupiedDays / totalPastPossibleDays) * 100) : 0,
    };
    
    return {
      roomsOccupancy,
      overallOccupancy
    };
  }, []);

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
    const month = date.getMonth();
    const year = date.getFullYear();
    return `${hebrewMonths[month]} ${year}`;
  };

  // פונקציה לקבלת תווית אמצעי תשלום
  const getPaymentMethodLabel = (method) => {
    // מיפוי אמצעי תשלום לתוויות בעברית
    const methodsMap = {
      'credit': 'כרטיס אשראי',
      'cash': 'מזומן',
      'creditOr': 'כרטיס אשראי - אור',
      'creditRothschild': 'כרטיס אשראי - רוטשילד',
      'mizrahi': 'העברה בנקאית - מזרחי',
      'poalim': 'העברה בנקאית - פועלים',
      'other': 'אחר'
    };
    
    return methodsMap[method] || method || 'אחר';
  };

  // פונקציה לסינון הזמנות לפי כל הפילטרים
  const getFilteredBookings = useCallback(() => {
    console.log('===== סינון הזמנות לדוח הכנסות =====');
    
    if (!bookings || bookings.length === 0) {
      console.log('אין הזמנות לסינון');
      return [];
    }
    
    console.log(`סך הכל ${bookings.length} הזמנות לפני סינון`);
    console.log(`תאריך התחלה: ${format(startDate, 'yyyy-MM-dd')}`);
    console.log(`תאריך סיום: ${format(endDate, 'yyyy-MM-dd')}`);
    console.log(`פילטר חדר: ${roomFilter}`);
    console.log(`פילטר אמצעי תשלום: ${paymentMethodFilter}`);
    
    // פונקציה לבדיקה אם הזמנה עומדת בקריטריונים
    const checkBooking = (booking) => {
      // בדיקה אם ההזמנה בטווח התאריכים
      const checkInDate = new Date(booking.checkIn);
      const matchesDateRange = checkInDate >= startDate && checkInDate <= endDate;
      
      // בדיקה אם ההזמנה במצב "שולם"
      const matchesPaymentStatus = booking.paymentStatus === 'paid';
      
      // בדיקה אם ההזמנה מתאימה לפילטר אמצעי תשלום
      const matchesPaymentMethod = paymentMethodFilter === 'all' || booking.paymentMethod === paymentMethodFilter;
      
      // בדיקה אם ההזמנה מתאימה לפילטר חדר
      const matchesRoom = roomFilter === 'all' || 
        (booking.room && booking.room._id === roomFilter) ||
        (typeof booking.room === 'string' && booking.room === roomFilter);
      
      return matchesDateRange && matchesPaymentStatus && matchesPaymentMethod && matchesRoom;
    };
    
    const filtered = bookings.filter(checkBooking);
    
    console.log(`לאחר סינון: ${filtered.length} הזמנות מתוך ${bookings.length}`);
    return filtered;
  }, [bookings, startDate, endDate, paymentMethodFilter, roomFilter]);

  // הפעלת פונקציית הסינון והמרה לנתונים
  const filteredData = useMemo(() => {
    return getFilteredBookings();
  }, [getFilteredBookings]);

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
          perNightAmount: 0,
          fill: CHART_COLORS[Object.keys(roomData).length % CHART_COLORS.length]
        };
      }

      roomData[roomId].totalAmount += booking.totalPrice || 0;
      roomData[roomId].value = roomData[roomId].totalAmount;
      roomData[roomId].count += 1;
      roomData[roomId].nights += booking.nights || 0;
    });

    // חישוב הכנסה לפי לילה לכל חדר
    Object.values(roomData).forEach(room => {
      room.perNightAmount = room.nights > 0 ? room.totalAmount / room.nights : 0;
    });

    // מיון לפי מספר חדר
    return Object.values(roomData).sort((a, b) => a.roomNumber - b.roomNumber);
  }, [filteredData]);

  // חישוב נתוני אחוזי תפוסה
  const occupancyData = useMemo(() => {
    if (!rooms || rooms.length === 0) return { roomsOccupancy: {}, overallOccupancy: {} };
    return calculateOccupancy(filteredData, rooms, selectedMonth);
  }, [filteredData, rooms, selectedMonth, calculateOccupancy]);

  // שילוב נתוני הכנסה עם נתוני תפוסה
  const combinedRoomData = useMemo(() => {
    const combined = [...incomeByRoom];
    
    // הוספת נתוני תפוסה לכל חדר
    combined.forEach(room => {
      const roomOccupancy = occupancyData.roomsOccupancy[room.roomId];
      if (roomOccupancy) {
        room.occupancyDays = roomOccupancy.occupancyDays || 0;
        room.occupancyPercent = roomOccupancy.occupancyPercent || 0;
        room.pastOccupancyPercent = roomOccupancy.pastOccupancyPercent || 0;
        room.totalPossibleDays = roomOccupancy.totalPossibleDays || 0;
        room.pastDaysCount = roomOccupancy.pastDaysCount || 0;
        room.projectedOccupancyPercent = roomOccupancy.projectedOccupancyPercent || 0;
      } else {
        // ערכי ברירת מחדל אם אין נתוני תפוסה
        room.occupancyDays = 0;
        room.occupancyPercent = 0;
        room.pastOccupancyPercent = 0;
        room.totalPossibleDays = 0;
        room.pastDaysCount = 0;
        room.projectedOccupancyPercent = 0;
      }
    });
    
    return combined;
  }, [incomeByRoom, occupancyData.roomsOccupancy]);

  // חישוב סיכום הכנסות לפי אמצעי תשלום
  const incomeByPaymentMethod = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    // קבוצה לפי אמצעי תשלום
    const groupedByMethod = filteredData.reduce((acc, booking) => {
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
    
    // המרה למערך עבור הגרף
    const result = Object.keys(groupedByMethod).map((method, index) => ({
      name: groupedByMethod[method].label,
      value: groupedByMethod[method].amount,
      count: groupedByMethod[method].count,
      label: groupedByMethod[method].label,
      totalAmount: groupedByMethod[method].amount,
      color: CHART_COLORS[index % CHART_COLORS.length],
      id: method
    }));
    
    // מיון לפי סכום בסדר יורד
    result.sort((a, b) => b.value - a.value);
    
    return result;
  }, [filteredData, getPaymentMethodLabel]);

  // חישוב הכנסות לפי ימים בחודש
  const incomeByDayOfMonth = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    // יצירת מבנה נתונים לכל ימי החודש
    const daysInMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      0
    ).getDate();
    
    // יוצר מערך עם רשומה לכל יום בחודש
    const dailyData = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      return {
        day,
        date: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day),
        displayDate: `${day}/${selectedMonth.getMonth() + 1}`,
        totalAmount: 0,
        count: 0
      };
    });

    // מעבר על ההזמנות וקיבוץ לפי ימים
    filteredData.forEach(booking => {
      const checkInDate = new Date(booking.checkIn);
      // בודק אם התאריך שייך לחודש הנוכחי
      if (checkInDate.getMonth() === selectedMonth.getMonth() && 
          checkInDate.getFullYear() === selectedMonth.getFullYear()) {
        const dayIndex = checkInDate.getDate() - 1; // אינדקס מתחיל מ-0
        
        if (dayIndex >= 0 && dayIndex < daysInMonth) {
          // אם יש מספר לילות, מחלק את ההכנסה לפי מספר הלילות
          const nights = booking.nights || 1;
          const pricePerNight = booking.totalPrice / nights;
          
          // מוסיף את ההכנסה ליום הראשון (יום ההגעה)
          dailyData[dayIndex].totalAmount += pricePerNight;
          dailyData[dayIndex].count += 1;
          
          // אם יש יותר מלילה אחד, מוסיף את ההכנסה גם לימים הבאים
          for (let night = 1; night < nights; night++) {
            const nextDayIndex = dayIndex + night;
            // מוודא שהיום הבא עדיין בחודש הנוכחי
            if (nextDayIndex < daysInMonth) {
              dailyData[nextDayIndex].totalAmount += pricePerNight;
              // לא מגדיל את count כי זה אותה הזמנה
            }
          }
        }
      }
    });

    return dailyData;
  }, [filteredData, selectedMonth]);

  // סה"כ הכנסות
  const totalIncome = useMemo(() => {
    return filteredData.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  }, [filteredData]);

  // סה"כ לילות
  const totalNights = useMemo(() => {
    return filteredData.reduce((sum, booking) => sum + (booking.nights || 0), 0);
  }, [filteredData]);

  // הכנסה ממוצעת ללילה
  const averagePerNight = useMemo(() => {
    return totalNights > 0 ? totalIncome / totalNights : 0;
  }, [totalIncome, totalNights]);

  // הורדת דוח כקובץ CSV
  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // כותרות העמודות בהתאם ללשונית הנוכחית
    if (tabValue === 0) {
      // ייצוא הכנסות לפי חדר
      csvContent += "מספר חדר,מספר לילות,הכנסה ללילה (₪),סה\"כ הכנסות (₪)\n";
      combinedRoomData.forEach(item => {
        csvContent += `${item.roomNumber},${item.nights},${item.perNightAmount.toFixed(2)},${item.totalAmount.toFixed(2)}\n`;
      });
    } else if (tabValue === 1) {
      // ייצוא הכנסות לפי אמצעי תשלום
      csvContent += "אמצעי תשלום,מספר הזמנות,סה\"כ הכנסות (₪),אחוז\n";
      incomeByPaymentMethod.forEach(item => {
        csvContent += `${item.label},${item.count},${item.totalAmount.toFixed(2)},${((item.totalAmount / totalIncome) * 100).toFixed(1)}%\n`;
      });
    } else if (tabValue === 2) {
      // ייצוא הכנסות לפי ימים בחודש
      csvContent += "יום בחודש,תאריך,הכנסה (₪)\n";
      incomeByDayOfMonth.forEach(item => {
        const date = format(item.date, 'dd/MM/yyyy');
        csvContent += `${item.day},${date},${item.totalAmount.toFixed(2)}\n`;
      });
    }
    
    // יצירת קישור להורדה
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `דוח_הכנסות_${formatMonthAndYear(selectedMonth).replace(' ', '_')}.csv`);
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
        
        <SidebarButton title="ניהול פיננסי" placement="right" isActive={currentPath === '/dashboard/financial-management'}>
          <IconButton
            component={RouterLink}
            to="/dashboard/financial-management"
            aria-label="financial"
          >
            <AccountBalanceIcon sx={{ color: isActive => isActive ? '#16a085' : theme.palette.text.secondary, '&:hover': { color: '#1abc9c' } }} />
          </IconButton>
        </SidebarButton>
        
        <Box sx={{ flexGrow: 1 }} /> {/* מרווח גמיש שידחוף את האייקון הבא לתחתית */}
        
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

      <Container maxWidth="xl" sx={{ mt: 3, mb: 6 }}>
        {/* כותרת תמציתית */}
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="h1" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
              הכנסות {formatMonthAndYear(selectedMonth)}
            </Typography>
            <IconButton size="small" onClick={goToPreviousMonth}>
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={goToNextMonth}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Tooltip title="חזרה לחודש נוכחי">
              <IconButton size="small" onClick={goToCurrentMonth}>
                <TodayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<DownloadIcon />} 
            onClick={downloadCSV}
            sx={{ borderRadius: 1.5 }}
          >
            ייצוא
          </Button>
        </Paper>

        {/* טאבים עליונים */}
        <Paper 
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Tabs
            value={mainTabValue}
            onChange={(e, newValue) => setMainTabValue(newValue)}
            sx={{
              '& .MuiTab-root': { fontWeight: 500, py: 1.5 },
              '& .Mui-selected': { fontWeight: 600 }
            }}
          >
            <Tab label="דף הכנסות" />
            <Tab label="טאב עתידי 1" disabled />
            <Tab label="טאב עתידי 2" disabled />
          </Tabs>
        </Paper>

        {/* סה"כ הכנסות ואחוזי תפוסה */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <StatCard
              icon={<MonetizationOnIcon />}
              title="סה״כ הכנסות"
              value={`₪${totalIncome.toLocaleString()}`}
              subtext={`בחודש ${formatMonthAndYear(selectedMonth)}`}
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              icon={<NightsStayIcon />}
              title="ממוצע ללילה"
              value={`₪${averagePerNight.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              subtext={`סה"כ ${totalNights} לילות`}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              icon={<DonutLargeIcon />}
              title="תפוסה כללית"
              value={`${occupancyData.overallOccupancy.occupancyPercent || 0}%`}
              subtext={occupancyData.overallOccupancy.isCurrentMonth ? 
                `${occupancyData.overallOccupancy.pastOccupancyPercent || 0}% תפוסה עד היום` : 
                `${occupancyData.overallOccupancy.totalOccupiedDays || 0} מתוך ${occupancyData.overallOccupancy.totalPossibleDays || 0} ימי אירוח`}
              color="#9c27b0"
            />
          </Grid>
        </Grid>

        {/* תוכן לפי לשוניות */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {/* בחירת תצוגה */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ 
                '& .MuiTab-root': { fontWeight: 500 },
                '& .Mui-selected': { fontWeight: 600 }
              }}
            >
              <Tab icon={<RoomIcon />} iconPosition="start" label="הכנסות לפי חדרים" />
              <Tab icon={<PaymentIcon />} iconPosition="start" label="הכנסות לפי אמצעי תשלום" />
              <Tab icon={<DateRangeIcon />} iconPosition="start" label="הכנסות יומיות" />
            </Tabs>
          </Box>

          {/* תצוגת מידע לפי חדרים */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              {/* כותרת אזור החדרים */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    ביצועים לפי חדרים
                  </Typography>
                  {combinedRoomData.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {combinedRoomData.length} חדרים
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* אריחי חדרים */}
              {loading ? (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                </Grid>
              ) : combinedRoomData.length === 0 ? (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.error.main, 0.05)
                    }}
                  >
                    <Typography>לא נמצאו נתוני הכנסות לחדרים בתקופה זו</Typography>
                  </Paper>
                </Grid>
              ) : (
                <>
                  {combinedRoomData.map((roomData, index) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={roomData.roomId || index}>
                      <Card
                        sx={{
                          height: '100%',
                          borderRadius: 2,
                          overflow: 'hidden',
                          boxShadow: '0 1px 5px rgba(0,0,0,0.05)',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.08)'
                          },
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.15)
                        }}
                      >
                        {/* כותרת עם מספר חדר */}
                        <Box
                          sx={{
                            height: '40px',
                            background: theme.palette.primary.main,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 0.5
                          }}
                        >
                          <Typography
                            variant="h6"
                            component="div"
                            sx={{
                              fontWeight: 600,
                              color: '#fff',
                              fontSize: '1rem'
                            }}
                          >
                            חדר {roomData.roomNumber}
                          </Typography>
                        </Box>
                        
                        <CardContent sx={{ p: 1.5, pt: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          {/* תפוסה */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              תפוסה:
                            </Typography>
                            <Chip 
                              label={`${occupancyData.overallOccupancy.isCurrentMonth ? 
                                roomData.pastOccupancyPercent : 
                                roomData.occupancyPercent}%`} 
                              size="small"
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                fontWeight: 600
                              }}
                            />
                          </Box>
                          
                          {/* נתונים כספיים */}
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                                הכנסה ללילה:
                              </Typography>
                              <Typography variant="body2" fontWeight={500}>
                                ₪{roomData.perNightAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                                לילות:
                              </Typography>
                              <Typography variant="body2" fontWeight={500}>
                                {roomData.nights}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mt: 'auto'
                          }}>
                            <Typography variant="subtitle2">
                              סה"כ:
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={700} color="primary">
                              ₪{roomData.totalAmount.toLocaleString()}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </>
              )}

              {/* סיכום בתחתית העמוד */}
              {combinedRoomData.length > 0 && (
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mt: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: alpha(theme.palette.background.default, 0.6)
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      * אחוזי התפוסה מחושבים לפי מספר הלילות בהם החדר מושכר ביחס למספר הימים בחודש.
                      {occupancyData.overallOccupancy.isCurrentMonth && ' עבור החודש הנוכחי, מוצגים אחוזי תפוסה רק מהימים שחלפו מתחילת החודש.'}
                    </Typography>
                  </Paper>
                </Grid>
              )}
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
                      <Typography>לא נמצאו נתונים לאמצעי התשלום</Typography>
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
                            <Cell key={`cell-${index}`} fill={entry.color} />
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
                            לא נמצאו נתוני הכנסות לאמצעי התשלום
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
                                    bgcolor: item.color
                                  }} 
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PaymentIcon sx={{ mr: 0.5, fontSize: '1rem', color: item.color }} />
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
                          <TableCell align="center"><strong>{filteredData.length}</strong></TableCell>
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

          {/* תצוגת הכנסות יומיות */}
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  הכנסות יומיות בחודש {formatMonthAndYear(selectedMonth)}
                </Typography>
                <Box sx={{ height: 400, mt: 2 }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : incomeByDayOfMonth.length === 0 ? (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography>לא נמצאו נתונים לחודש זה</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={incomeByDayOfMonth}
                        margin={{ top: 10, right: 10, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha('#000', 0.09)} />
                        <XAxis 
                          dataKey="day" 
                          label={{ 
                            value: 'ימים בחודש', 
                            position: 'insideBottom', 
                            offset: -10,
                            fill: theme.palette.text.secondary
                          }}
                          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tickFormatter={(value) => `₪${value.toLocaleString()}`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip 
                          formatter={(value) => [`₪${value.toLocaleString()}`, 'הכנסה']}
                          labelFormatter={(day) => `יום ${day}`}
                          cursor={{ fill: alpha(theme.palette.primary.main, 0.1) }}
                        />
                        <Bar 
                          dataKey="totalAmount" 
                          name="הכנסה" 
                          radius={[4, 4, 0, 0]}
                          barSize={18}
                        >
                          {incomeByDayOfMonth.map((entry, index) => {
                            // צביעת סופי שבוע בצבע שונה
                            const date = new Date(entry.date);
                            const isWeekend = date.getDay() === 5 || date.getDay() === 6; // יום שישי או שבת
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={isWeekend ? '#f44336' : theme.palette.primary.main} 
                                fillOpacity={entry.totalAmount > 0 ? 1 : 0.3} // שקיפות נמוכה לימים ללא הכנסות
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: theme.palette.primary.main, mr: 1 }} />
                      <Typography variant="body2">ימי חול</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: '#f44336', mr: 1 }} />
                      <Typography variant="body2">סופי שבוע (שישי-שבת)</Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    * ההכנסות מחושבות לפי לילות. כל הזמנה מחולקת למספר הלילות שלה, והסכום לפי לילה מתווסף לכל אחד מהימים.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default IncomeReportPage; 