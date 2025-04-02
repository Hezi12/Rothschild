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
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  DateRange as DateRangeIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Settings as SettingsIcon,
  Restaurant as RestaurantIcon,
  LocalGroceryStore as GroceryIcon,
  DirectionsCar as CarIcon,
  Home as HomeIcon,
  LocalHospital as HealthIcon,
  School as EducationIcon,
  LocalAtm as LocalAtmIcon,
  Business as BusinessIcon,
  CreditCard as CreditCardIcon,
  LocalShipping as ShippingIcon,
  Build as ToolsIcon,
  People as PeopleIcon,
  Lightbulb as LightbulbIcon,
  Brush as BrushIcon,
  Storefront as StoreIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarMonthIcon,
  Hotel as HotelIcon,
  Assessment as AssessmentIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { format, parseISO, startOfMonth, endOfMonth, getMonth, getYear, subMonths, differenceInMonths, addMonths } from 'date-fns';
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
  Area
} from 'recharts';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';

// קומפוננטות מותאמות אישית
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: 16,
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 30px 0 rgba(0,0,0,0.1)'
  },
  border: '1px solid',
  borderColor: theme.palette.divider,
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 600,
  marginBottom: theme.spacing(3),
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 0,
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.palette.primary.main
  }
}));

const StatCard = ({ icon, title, value, subtext, color, trend }) => {
  const theme = useTheme();
  
  return (
    <StyledCard>
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
              icon={trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${Math.abs(trend)}%`}
              color={trend > 0 ? 'success' : 'error'}
              size="small"
            />
          )}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
          ₪{value.toLocaleString()}
        </Typography>
        <Typography gutterBottom variant="body1" color="text.primary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtext}
        </Typography>
      </CardContent>
    </StyledCard>
  );
};

// צבעים לגרפים
const CHART_COLORS = {
  income: '#4caf50',
  expense: '#f44336',
  balance: '#2196f3',
  categories: [
    '#00C49F',  // ירוק-תכלת מודרני
    '#FF6B6B',  // אדום-כתום רך
    '#845EC2',  // סגול עדין
    '#FFC75F',  // צהוב-כתום חם
    '#4D8076',  // ירוק כהה
    '#B0A8B9',  // סגול-אפור
    '#FF8066',  // כתום-אדום
    '#00B8A9',  // טורקיז
    '#F8A07E',  // כתום-ורוד
    '#2C73D2'   // כחול עמוק
  ]
};

// קטגוריות הוצאות והכנסות עם אייקונים
const DEFAULT_CATEGORIES = {
  expenses: [
    { id: 'salary', name: 'שכר עובדים', iconName: 'PeopleIcon', color: '#e91e63' },
    { id: 'utilities', name: 'חשבונות שירותים', iconName: 'UtilitiesIcon', color: '#9c27b0' },
    { id: 'maintenance', name: 'תחזוקה', iconName: 'ToolsIcon', color: '#673ab7' },
    { id: 'supplies', name: 'אספקה', iconName: 'GroceryIcon', color: '#3f51b5' },
    { id: 'marketing', name: 'שיווק', iconName: 'BusinessIcon', color: '#2196f3' },
    { id: 'travel', name: 'הוצאות נסיעה', iconName: 'CarIcon', color: '#03a9f4' },
    { id: 'office', name: 'הוצאות משרד', iconName: 'HomeIcon', color: '#00bcd4' },
    { id: 'cleaning', name: 'ניקיון', iconName: 'CleaningIcon', color: '#009688' }
  ],
  income: [
    { id: 'cash', name: 'מזומן', iconName: 'LocalAtmIcon', color: '#4caf50' },
    { id: 'credit', name: 'כרטיס אשראי', iconName: 'CreditCardIcon', color: '#8bc34a' },
    { id: 'bank', name: 'העברה בנקאית', iconName: 'AccountBalanceIcon', color: '#cddc39' },
    { id: 'paybox', name: 'PayBox', iconName: 'PaymentIcon', color: '#ffc107' },
    { id: 'bit', name: 'Bit', iconName: 'AttachMoneyIcon', color: '#ff9800' }
  ]
};

// מיפוי שמות אייקונים לקומפוננטות
const ICON_MAP = {
  PeopleIcon,
  UtilitiesIcon: LightbulbIcon,
  ToolsIcon: ToolsIcon,
  GroceryIcon: GroceryIcon,
  BusinessIcon,
  CarIcon: CarIcon,
  HomeIcon,
  CleaningIcon: BrushIcon,
  LocalAtmIcon,
  CreditCardIcon,
  AccountBalanceIcon,
  PaymentIcon,
  AttachMoneyIcon
};

const CategoryManager = ({ onClose, onCategoriesUpdate }) => {
  const theme = useTheme();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedType, setSelectedType] = useState('expenses');
  const [newCategory, setNewCategory] = useState({ 
    name: '', 
    iconName: '', 
    color: '#4caf50'
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [loading, setLoading] = useState(true);

  // טעינת קטגוריות מהשרת
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/financial/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success && response.data.data) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('שגיאה בטעינת קטגוריות:', err);
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  // טעינת נתונים בעת טעינת הדף
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async () => {
    if (!newCategory.name) return;

    try {
      setLoading(true);
      const updatedCategories = {
        ...categories,
        [selectedType]: [...categories[selectedType], {
          id: newCategory.name.toLowerCase().replace(/\s+/g, '_'),
          name: newCategory.name,
          iconName: newCategory.iconName || 'BusinessIcon',
          color: newCategory.color || '#4caf50'
        }]
      };

      // שמירת הקטגוריות בשרת
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/financial/categories`,
        updatedCategories,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setCategories(updatedCategories);
        toast.success('הקטגוריה נוספה בהצלחה');
        onCategoriesUpdate();
      }

      setNewCategory({ 
        name: '', 
        iconName: '', 
        color: '#4caf50'
      });
      setIsAddingCategory(false);
    } catch (err) {
      console.error('שגיאה בהוספת קטגוריה:', err);
      toast.error('שגיאה בהוספת הקטגוריה');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      setLoading(true);
      const updatedCategories = {
        ...categories,
        [selectedType]: categories[selectedType].filter(cat => cat.id !== categoryId)
      };

      // עדכון הקטגוריות בשרת
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/financial/categories`,
        updatedCategories,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setCategories(updatedCategories);
        toast.success('הקטגוריה נמחקה בהצלחה');
        onCategoriesUpdate();
      }
    } catch (err) {
      console.error('שגיאה במחיקת קטגוריה:', err);
      toast.error('שגיאה במחיקת הקטגוריה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon />
          ניהול קטגוריות
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Tabs
              value={selectedType}
              onChange={(e, newValue) => setSelectedType(newValue)}
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab value="expenses" label="הוצאות" />
              <Tab value="income" label="הכנסות" />
            </Tabs>

            <Grid container spacing={2}>
              {categories[selectedType].map((category) => (
                <Grid item xs={12} sm={6} key={category.id}>
                  <Paper
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      bgcolor: alpha(category.color || '#4caf50', 0.1), // צבע ברירת מחדל אם אין צבע
                      border: '1px solid',
                      borderColor: alpha(category.color || '#4caf50', 0.2),
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: alpha(category.color || '#4caf50', 0.15),
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: category.color || '#4caf50',
                        color: '#fff'
                      }}
                    >
                      {ICON_MAP[category.iconName] && React.createElement(ICON_MAP[category.iconName])}
                    </Box>
                    <Typography sx={{ flex: 1 }}>{category.name}</Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {isAddingCategory ? (
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="שם הקטגוריה"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>אייקון</InputLabel>
                  <Select
                    value={newCategory.iconName}
                    onChange={(e) => setNewCategory({ ...newCategory, iconName: e.target.value })}
                    label="אייקון"
                  >
                    <MenuItem value="PeopleIcon">אנשים</MenuItem>
                    <MenuItem value="UtilitiesIcon">חשמל</MenuItem>
                    <MenuItem value="ToolsIcon">כלים</MenuItem>
                    <MenuItem value="GroceryIcon">קניות</MenuItem>
                    <MenuItem value="BusinessIcon">עסקים</MenuItem>
                    <MenuItem value="CarIcon">רכב</MenuItem>
                    <MenuItem value="HomeIcon">בית</MenuItem>
                    <MenuItem value="CleaningIcon">ניקיון</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>צבע</InputLabel>
                  <Select
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    label="צבע"
                  >
                    <MenuItem value="#4caf50">ירוק</MenuItem>
                    <MenuItem value="#f44336">אדום</MenuItem>
                    <MenuItem value="#2196f3">כחול</MenuItem>
                    <MenuItem value="#ff9800">כתום</MenuItem>
                    <MenuItem value="#9c27b0">סגול</MenuItem>
                    <MenuItem value="#795548">חום</MenuItem>
                    <MenuItem value="#607d8b">אפור</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setIsAddingCategory(false)}
                    startIcon={<CancelIcon />}
                  >
                    ביטול
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleAddCategory}
                    startIcon={<SaveIcon />}
                  >
                    שמור קטגוריה
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setIsAddingCategory(true)}
                sx={{ mt: 3 }}
              >
                הוסף קטגוריה חדשה
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

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

const FinancialManagementPage = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { bookings } = useContext(BookingContext);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newTransaction, setNewTransaction] = useState({
    type: 'income',
    amount: '',
    category: '',
    description: '',
    date: new Date()
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const location = useLocation();
  const currentPath = location.pathname;

  // טעינת נתונים פיננסיים מהשרת
  const fetchFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/financial/transactions`, {
        params: {
          month: format(selectedDate, 'yyyy-MM'),
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (err) {
      console.error('שגיאה בטעינת נתונים פיננסיים:', err);
      setError('שגיאה בטעינת הנתונים הפיננסיים');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // טעינת קטגוריות מהשרת
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/financial/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success && response.data.data) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('שגיאה בטעינת קטגוריות:', err);
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  // טעינת נתונים בעת טעינת הדף
  useEffect(() => {
    fetchFinancialData();
    fetchCategories();
  }, [fetchFinancialData, fetchCategories]);

  // חישוב נתוני הכנסות מההזמנות
  const calculateIncomeFromBookings = useCallback(() => {
    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);

    return bookings
      .filter(booking => {
        const bookingDate = parseISO(booking.createdAt);
        return bookingDate >= startDate && bookingDate <= endDate &&
               booking.paymentStatus === 'paid' &&
               !booking.paymentMethod.startsWith('credit');
      })
      .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  }, [bookings, selectedDate]);

  // חישוב הכנסות לפי שיטת תשלום
  const calculateIncomeByPaymentMethod = useCallback(() => {
    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);

    const incomeByMethod = {};
    
    bookings
      .filter(booking => {
        const bookingDate = parseISO(booking.createdAt);
        return bookingDate >= startDate && 
               bookingDate <= endDate &&
               booking.paymentStatus === 'paid' &&
               !booking.paymentMethod.startsWith('credit');
      })
      .forEach(booking => {
        const method = booking.paymentMethod;
        if (!incomeByMethod[method]) {
          incomeByMethod[method] = 0;
        }
        incomeByMethod[method] += booking.totalPrice || 0;
      });

    return incomeByMethod;
  }, [bookings, selectedDate]);

  // חישוב נתוני חודש נוכחי
  const currentMonthData = useMemo(() => {
    const income = calculateIncomeFromBookings();
    const expenses = transactions
      .filter(t => {
        try {
          return t.type === 'expense' && 
                 format(parseISO(t.date), 'yyyy-MM') === format(selectedDate, 'yyyy-MM');
        } catch (error) {
          console.error('Error parsing date:', t.date);
          return false;
        }
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses
    };
  }, [calculateIncomeFromBookings, transactions, selectedDate]);

  // חישוב נתוני חודש קודם להשוואה
  const previousMonthData = useMemo(() => {
    const prevDate = subMonths(selectedDate, 1);
    const startDate = startOfMonth(prevDate);
    const endDate = endOfMonth(prevDate);

    const income = bookings
      .filter(booking => {
        const bookingDate = parseISO(booking.createdAt);
        return bookingDate >= startDate && bookingDate <= endDate &&
               booking.paymentStatus === 'paid' &&
               !booking.paymentMethod.startsWith('credit');
      })
      .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

    const expenses = transactions
      .filter(t => {
        try {
          return t.type === 'expense' && 
                 format(parseISO(t.date), 'yyyy-MM') === format(prevDate, 'yyyy-MM');
        } catch (error) {
          console.error('Error parsing date:', t.date);
          return false;
        }
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses
    };
  }, [bookings, transactions, selectedDate]);

  // חישוב אחוזי שינוי
  const calculateTrend = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  // נתונים לגרפים
  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(selectedDate, i);
      return {
        name: format(date, 'MMM yyyy', { locale: he }),
        income: bookings
          .filter(booking => {
            const bookingDate = parseISO(booking.createdAt);
            return format(bookingDate, 'yyyy-MM') === format(date, 'yyyy-MM') &&
                   booking.paymentStatus === 'paid' &&
                   !booking.paymentMethod.startsWith('credit');
          })
          .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0),
        expenses: transactions
          .filter(t => {
            try {
              return format(parseISO(t.date), 'yyyy-MM') === format(date, 'yyyy-MM');
            } catch (error) {
              console.error('Error parsing date:', t.date);
              return false;
            }
          })
          .reduce((sum, t) => sum + t.amount, 0)
      };
    }).reverse();

    return months;
  }, [bookings, transactions, selectedDate]);

  // נתונים לגרף עוגה של הוצאות לפי קטגוריה
  const expensePieData = useMemo(() => {
    const currentMonthExpenses = transactions
      .filter(t => t.type === 'expense' && 
                  format(parseISO(t.date), 'yyyy-MM') === format(selectedDate, 'yyyy-MM'));

    return DEFAULT_CATEGORIES.expenses.map(category => ({
      name: category.name,
      value: currentMonthExpenses
        .filter(t => t.category === category.name)
        .reduce((sum, t) => sum + t.amount, 0)
    })).filter(item => item.value > 0);
  }, [transactions, selectedDate]);

  // נתונים לגרף עוגה של הכנסות לפי שיטת תשלום
  const incomePieData = useMemo(() => {
    const incomeByMethod = calculateIncomeByPaymentMethod();
    return Object.entries(incomeByMethod).map(([method, value]) => ({
      name: method,
      value: value
    })).filter(item => item.value > 0);
  }, [calculateIncomeByPaymentMethod]);

  // טיפול בהוספת עסקה חדשה
  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category || !newTransaction.description) {
      setError('נא למלא את כל השדות');
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        date: format(newTransaction.date, 'yyyy-MM-dd')
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/financial/transactions`,
        transactionData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success('העסקה נוספה בהצלחה');
        setIsAddDialogOpen(false);
        setNewTransaction({
          type: 'income',
          amount: '',
          category: '',
          description: '',
          date: new Date()
        });
        // טעינה מחדש של הנתונים
        fetchFinancialData();
      }
    } catch (err) {
      console.error('שגיאה בהוספת עסקה:', err);
      setError('שגיאה בהוספת העסקה');
      toast.error('שגיאה בהוספת העסקה');
    } finally {
      setLoading(false);
    }
  };

  // מחיקת עסקה
  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את העסקה?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/financial/transactions/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success('העסקה נמחקה בהצלחה');
        // טעינה מחדש של הנתונים
        fetchFinancialData();
      }
    } catch (err) {
      console.error('שגיאה במחיקת עסקה:', err);
      toast.error('שגיאה במחיקת העסקה');
    }
  };

  // עדכון עסקה
  const handleUpdateTransaction = async (transactionId, updatedData) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/financial/transactions/${transactionId}`,
        updatedData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success('העסקה עודכנה בהצלחה');
        // טעינה מחדש של הנתונים
        fetchFinancialData();
      }
    } catch (err) {
      console.error('שגיאה בעדכון עסקה:', err);
      toast.error('שגיאה בעדכון העסקה');
    }
  };

  // פתיחת דיאלוג עריכה
  const handleOpenEditDialog = (transaction) => {
    setEditingTransaction({
      ...transaction,
      date: parseISO(transaction.date)
    });
    setIsEditDialogOpen(true);
  };

  // סגירת דיאלוג עריכה
  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingTransaction(null);
  };

  // שמירת עריכת עסקה
  const handleSaveEdit = async () => {
    if (!editingTransaction.amount || !editingTransaction.category || !editingTransaction.description) {
      setError('נא למלא את כל השדות');
      return;
    }

    try {
      await handleUpdateTransaction(editingTransaction._id, {
        ...editingTransaction,
        date: format(editingTransaction.date, 'yyyy-MM-dd')
      });
      handleCloseEditDialog();
    } catch (err) {
      console.error('שגיאה בעדכון העסקה:', err);
      setError('שגיאה בעדכון העסקה');
    }
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
        {/* סרגל כלים */}
        <Box sx={{ 
          mb: 4, 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          p: 2,
          boxShadow: '0 2px 10px 0 rgba(0,0,0,0.05)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => setSelectedDate(prevDate => subMonths(prevDate, 1))}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600, minWidth: 150, textAlign: 'center' }}>
              {format(selectedDate, 'MMMM yyyy', { locale: he })}
            </Typography>
            <IconButton 
              onClick={() => setSelectedDate(prevDate => addMonths(prevDate, 1))}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setIsCategoryManagerOpen(true)}
              sx={{ 
                mr: 2,
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              ניהול קטגוריות
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsAddDialogOpen(true)}
              sx={{ 
                mr: 2,
                borderRadius: 2,
                textTransform: 'none',
                px: 3
              }}
            >
              הוסף עסקה
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ 
                mr: 2,
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              ייצא ל-CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              הדפס
            </Button>
          </Box>
        </Box>

        {/* כרטיס מאזן */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <StatCard
                icon={<AccountBalanceIcon />}
                title="מאזן חודש נוכחי"
                value={currentMonthData.balance}
                subtext="הכנסות פחות הוצאות"
                color={CHART_COLORS.balance}
                trend={calculateTrend(currentMonthData.balance, previousMonthData.balance)}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* תצוגת הכנסות והוצאות */}
        <Grid container spacing={4}>
          {/* צד ימין - הכנסות */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
              <SectionTitle variant="h5" gutterBottom>
                הכנסות
              </SectionTitle>
              <Box sx={{ mb: 4 }}>
                <StatCard
                  icon={<TrendingUpIcon />}
                  title="הכנסות חודש נוכחי"
                  value={currentMonthData.income}
                  subtext="סה״כ הכנסות מהזמנות"
                  color={CHART_COLORS.income}
                  trend={calculateTrend(currentMonthData.income, previousMonthData.income)}
                />
              </Box>
              
              {/* טבלת הכנסות */}
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 500,
                mb: 3,
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: 40,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: theme.palette.primary.main
                }
              }}>
                התפלגות הכנסות לפי שיטת תשלום
              </Typography>
              <TableContainer 
                component={Paper} 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 2px 10px 0 rgba(0,0,0,0.05)',
                  border: '1px solid',
                  borderColor: 'divider',
                  '& .MuiTableCell-root': {
                    fontSize: '1rem',
                    py: 2
                  }
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        borderBottom: '2px solid',
                        borderBottomColor: theme.palette.primary.main
                      }}>
                        שיטת תשלום
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: 600,
                          borderBottom: '2px solid',
                          borderBottomColor: theme.palette.primary.main
                        }}
                      >
                        סכום
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(calculateIncomeByPaymentMethod()).map(([method, amount], index) => (
                      <TableRow 
                        key={method} 
                        hover
                        sx={{
                          '&:last-child td': { border: 0 },
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                          }
                        }}
                      >
                        <TableCell sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          fontWeight: 500
                        }}>
                          {method}
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            color: theme.palette.success.main,
                            fontWeight: 500
                          }}
                        >
                          ₪{amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      '& td': { py: 2.5 }
                    }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '1.1rem' }}>סה״כ</TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                          fontSize: '1.1rem'
                        }}
                      >
                        ₪{Object.values(calculateIncomeByPaymentMethod())
                            .reduce((sum, amount) => sum + amount, 0)
                            .toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* צד שמאל - הוצאות */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
              <SectionTitle variant="h5" gutterBottom>
                הוצאות
              </SectionTitle>
              <Box sx={{ mb: 4 }}>
                <StatCard
                  icon={<TrendingDownIcon />}
                  title="הוצאות חודש נוכחי"
                  value={currentMonthData.expenses}
                  subtext="סה״כ הוצאות"
                  color={CHART_COLORS.expense}
                  trend={calculateTrend(currentMonthData.expenses, previousMonthData.expenses)}
                />
              </Box>

              {/* טבלת הוצאות */}
              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>תאריך</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>קטגוריה</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>תיאור</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>סכום</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>פעולות</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions
                      .filter(t => t.type === 'expense')
                      .map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell>{format(parseISO(transaction.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell align="right" sx={{ color: CHART_COLORS.expense }}>
                            ₪{transaction.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" sx={{ mr: 1 }} onClick={() => handleOpenEditDialog(transaction)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteTransaction(transaction._id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* דיאלוג הוספת עסקה */}
        <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
          <DialogTitle>הוספת עסקה חדשה</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>סוג עסקה</InputLabel>
                <Select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                  label="סוג עסקה"
                >
                  <MenuItem value="income">הכנסה</MenuItem>
                  <MenuItem value="expense">הוצאה</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="סכום"
                type="number"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
              />

              <FormControl fullWidth>
                <InputLabel>קטגוריה</InputLabel>
                <Select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  label="קטגוריה"
                >
                  {categories[newTransaction.type === 'income' ? 'income' : 'expenses'].map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="תיאור"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              />

              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  label="תאריך"
                  value={newTransaction.date}
                  onChange={(date) => setNewTransaction({ ...newTransaction, date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsAddDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleAddTransaction} variant="contained">
              שמור
            </Button>
          </DialogActions>
        </Dialog>

        {/* דיאלוג עריכת עסקה */}
        <Dialog open={isEditDialogOpen} onClose={handleCloseEditDialog}>
          <DialogTitle>עריכת עסקה</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>סוג עסקה</InputLabel>
                <Select
                  value={editingTransaction?.type || ''}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value })}
                  label="סוג עסקה"
                >
                  <MenuItem value="income">הכנסה</MenuItem>
                  <MenuItem value="expense">הוצאה</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="סכום"
                type="number"
                value={editingTransaction?.amount || ''}
                onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
              />

              <FormControl fullWidth>
                <InputLabel>קטגוריה</InputLabel>
                <Select
                  value={editingTransaction?.category || ''}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                  label="קטגוריה"
                >
                  {categories[editingTransaction?.type === 'income' ? 'income' : 'expenses'].map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="תיאור"
                value={editingTransaction?.description || ''}
                onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
              />

              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  label="תאריך"
                  value={editingTransaction?.date || null}
                  onChange={(date) => setEditingTransaction({ ...editingTransaction, date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>
              ביטול
            </Button>
            <Button onClick={handleSaveEdit} variant="contained">
              שמור שינויים
            </Button>
          </DialogActions>
        </Dialog>

        {/* מנהל הקטגוריות */}
        {isCategoryManagerOpen && (
          <CategoryManager 
            onClose={() => setIsCategoryManagerOpen(false)} 
            onCategoriesUpdate={fetchCategories}
          />
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default FinancialManagementPage; 