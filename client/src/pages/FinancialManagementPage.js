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
  InputAdornment,
  FormHelperText
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
    { id: 'cleaning', name: 'ניקיון', iconName: 'CleaningIcon', color: '#009688' },
    { id: 'rent', name: 'שכירות', iconName: 'HomeIcon', color: '#ff5722' }
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
  const [error, setError] = useState(null);

  // טעינת קטגוריות מהשרת
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/financial/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success && response.data.data) {
        console.log('קטגוריות נטענו בהצלחה:', response.data.data);
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('שגיאה בטעינת קטגוריות:', err);
      setError('שגיאה בטעינת קטגוריות. משתמש בקטגוריות ברירת מחדל.');
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
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
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
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
              {categories[selectedType] && categories[selectedType].map((category) => (
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
                      {ICON_MAP[category.iconName] ? React.createElement(ICON_MAP[category.iconName]) : <CategoryIcon />}
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

const SidebarButton = styled(Tooltip)(({ theme, active }) => ({
  '& .MuiButtonBase-root': {
    padding: '12px',
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05)
    },
    transition: 'all 0.3s ease',
    borderLeft: active ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
    borderRight: 'none'
  }
}));

const PAYMENT_METHODS = {
  rothschild: [
    { id: 'cash', label: 'מזומן' },
    { id: 'creditRothschild', label: 'כרטיס אשראי' },
    { id: 'bankTransferRothschild', label: 'העברה בנקאית' },
    { id: 'bitRothschild', label: 'ביט' },
    { id: 'payboxRothschild', label: 'פייבוקס' }
  ],
  extraRooms: [
    { id: 'cash', label: 'מזומן' },
    { id: 'creditExtraRooms', label: 'כרטיס אשראי' },
    { id: 'bankTransferExtraRooms', label: 'העברה בנקאית' },
    { id: 'bitExtraRooms', label: 'ביט' },
    { id: 'payboxExtraRooms', label: 'פייבוקס' }
  ]
};

const FinancialManagementPage = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { bookings } = useContext(BookingContext);
  const [selectedTab, setSelectedTab] = useState(0);
  const location = useLocation();
  const currentPath = location.pathname;
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
    date: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'cash',
    installments: 1,
    complex: 'rothschild'
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [totalCapital, setTotalCapital] = useState(0);
  const [capitalByPaymentMethod, setCapitalByPaymentMethod] = useState({});
  const [loadingCapital, setLoadingCapital] = useState(false);
  const [initialBalances, setInitialBalances] = useState({});
  const [isInitialBalancesDialogOpen, setIsInitialBalancesDialogOpen] = useState(false);
  const [editingInitialBalances, setEditingInitialBalances] = useState({});
  const [selectedComplex, setSelectedComplex] = useState(0);
  // משתנים להזמנות של SimpleBookings (חדרים נוספים)
  const [simpleBookings, setSimpleBookings] = useState([]);
  const [loadingSimpleBookings, setLoadingSimpleBookings] = useState(false);
  const [simpleBookingsError, setSimpleBookingsError] = useState(null);

  // פונקציה לטעינת יתרות פתיחה
  const fetchInitialBalances = useCallback(async () => {
    try {
      console.log('טוען יתרות פתיחה...');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/financial/initialBalances`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        console.log('יתרות פתיחה נטענו בהצלחה:', response.data.data);
        setInitialBalances(response.data.data);
      } else {
        console.error('שגיאה בטעינת יתרות פתיחה:', response.data);
      }
    } catch (err) {
      console.error('שגיאה בטעינת יתרות פתיחה:', err.response || err);
    }
  }, []);

  // פונקציה לעדכון יתרות פתיחה
  const updateInitialBalances = async (newBalances) => {
    try {
      console.log('מעדכן יתרות פתיחה:', newBalances);
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/financial/initialBalances`,
        newBalances,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        console.log('יתרות פתיחה עודכנו בהצלחה:', response.data.data);
        setInitialBalances(response.data.data);
        toast.success('יתרות פתיחה עודכנו בהצלחה');
        calculateTotalCapital();
      } else {
        console.error('שגיאה בעדכון יתרות פתיחה:', response.data);
        toast.error('שגיאה בעדכון יתרות פתיחה');
      }
    } catch (err) {
      console.error('שגיאה בעדכון יתרות פתיחה:', err.response || err);
      toast.error('שגיאה בעדכון יתרות פתיחה');
    }
  };

  // פונקציה לטעינת הזמנות מ-SimpleBookings (חדרים נוספים)
  const fetchSimpleBookings = useCallback(async () => {
    try {
      setLoadingSimpleBookings(true);
      setSimpleBookingsError(null);
      
      // טעינת כל ההזמנות מהשרת (ללא פילטור לפי תאריך בצד השרת)
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/simple-bookings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.success) {
        console.log('נטענו הזמנות SimpleBookings:', response.data.simpleBookings);
        
        // פילטור ההזמנות לפי החודש שנבחר
        const firstDayOfMonth = startOfMonth(selectedDate);
        const lastDayOfMonth = endOfMonth(selectedDate);
        
        const filteredBookings = response.data.simpleBookings.filter(booking => {
          if (!booking.date) return false;
          
          const bookingDate = new Date(booking.date);
          return bookingDate >= firstDayOfMonth && bookingDate <= lastDayOfMonth && 
                 booking.isPaid && booking.paymentMethod && booking.amount > 0;
        });
        
        console.log('הזמנות SimpleBookings מסוננות לחודש זה:', filteredBookings);
        setSimpleBookings(filteredBookings);
      }
    } catch (error) {
      console.error('שגיאה בטעינת הזמנות SimpleBookings:', error);
      setSimpleBookingsError('שגיאה בטעינת הזמנות מחדרים נוספים');
    } finally {
      setLoadingSimpleBookings(false);
    }
  }, [selectedDate]);

  // טעינת נתונים פיננסיים לחודש מסוים
  const fetchFinancialData = useCallback(async () => {
    try {
      const currentMonth = format(selectedDate, 'yyyy-MM');
      console.log(`טוען נתונים פיננסיים לחודש: ${currentMonth}`);
      
      setLoading(true);
      setError(null);
      
      console.log('טוען יתרות פתיחה...');
      await fetchInitialBalances();
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/financial/transactions?month=${currentMonth}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        const transactions = response.data.data;
        console.log(`נטענו ${transactions.length} עסקאות לחודש ${currentMonth}:`, transactions);
        setTransactions(transactions);
      }
    } catch (err) {
      console.error('שגיאה בטעינת נתונים פיננסיים:', err);
      setError('שגיאה בטעינת נתונים פיננסיים');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, fetchInitialBalances]);

  // פונקציה לזיהוי וטיפול בהוצאות מרוכזות כפולות
  const cleanupDuplicateSummaryExpenses = async (transactions) => {
    try {
      const cleanedTransactions = [...transactions];
      const poalimTransactions = cleanedTransactions.filter(t => 
        t.type === 'expense' && 
        t.description?.includes('הוצאה מרוכזת עבור הכנסות')
      );

      // ... rest of the function ...
    } catch (error) {
      console.error('Error in cleanupDuplicateSummaryExpenses:', error);
      return transactions;
    }
  };

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
    fetchInitialBalances();
    fetchSimpleBookings(); // הוספת טעינת הזמנות SimpleBookings
  }, [fetchFinancialData, fetchCategories, fetchInitialBalances, fetchSimpleBookings]);
  
  // עדכון הנתונים כשמשתנה התאריך
  useEffect(() => {
    fetchFinancialData();
    fetchSimpleBookings(); // טעינה מחדש של SimpleBookings כשמשתנה התאריך
  }, [selectedDate, fetchFinancialData, fetchSimpleBookings]);

  // חישוב נתוני הכנסות מההזמנות לפי המתחם הנוכחי
  const calculateIncomeFromBookings = useCallback(() => {
    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);
    const currentComplex = selectedComplex === 0 ? 'rothschild' : 'extraRooms';

    return bookings
      .filter(booking => {
        // סינון לפי תאריך ותשלום
        const bookingDate = parseISO(booking.createdAt);
        const isPaid = bookingDate >= startDate && bookingDate <= endDate &&
                      booking.paymentStatus === 'paid' &&
                      !booking.paymentMethod.startsWith('credit');
        
        if (!isPaid) return false;
        
        // סינון לפי מתחם
        // שיטה 1: אם יש שדה complex מוגדר, השתמש בו ישירות
        if (booking.complex) {
          return booking.complex === currentComplex;
        }
        
        // שיטה 2: אם אין שדה complex, בדוק לפי התיאור ואחרים
        const isExtraRooms = 
          (booking.room?.name && booking.room.name.includes('חדרים נוספים')) ||
          (booking.description && booking.description.includes('חדרים נוספים')) ||
          (booking.notes && booking.notes.includes('חדרים נוספים'));
          
        return (currentComplex === 'extraRooms' && isExtraRooms) || 
               (currentComplex === 'rothschild' && !isExtraRooms);
      })
      .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  }, [bookings, selectedDate, selectedComplex]);

  // חישוב הכנסות לפי שיטת תשלום למתחם הנוכחי
  const calculateIncomeByPaymentMethod = useCallback(() => {
    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);
    const currentMonth = format(selectedDate, 'yyyy-MM');
    const currentComplex = selectedComplex === 0 ? 'rothschild' : 'extraRooms';

    const incomeByMethod = {};
    
    // הוספת הכנסות מהזמנות
    bookings
      .filter(booking => {
        // סינון לפי תאריך ותשלום
        const bookingDate = parseISO(booking.createdAt);
        const isPaid = bookingDate >= startDate && 
                      bookingDate <= endDate &&
                      booking.paymentStatus === 'paid' &&
                      !booking.paymentMethod.startsWith('credit');
                      
        if (!isPaid) return false;
        
        // סינון לפי מתחם
        // שיטה 1: אם יש שדה complex מוגדר, השתמש בו ישירות
        if (booking.complex) {
          return booking.complex === currentComplex;
        }
        
        // שיטה 2: אם אין שדה complex, בדוק לפי התיאור ואחרים
        const isExtraRooms = 
          (booking.room?.name && booking.room.name.includes('חדרים נוספים')) ||
          (booking.description && booking.description.includes('חדרים נוספים')) ||
          (booking.notes && booking.notes.includes('חדרים נוספים'));
          
        return (currentComplex === 'extraRooms' && isExtraRooms) || 
               (currentComplex === 'rothschild' && !isExtraRooms);
      })
      .forEach(booking => {
        const method = booking.paymentMethod;
        if (!incomeByMethod[method]) {
          incomeByMethod[method] = 0;
        }
        incomeByMethod[method] += booking.totalPrice || 0;
      });
      
    // הוספת הכנסות מעסקאות ידניות
    transactions
      .filter(t => {
        try {
          // בדיקת סוג עסקה ותאריך
          if (t.type !== 'income' || 
             format(parseISO(t.date), 'yyyy-MM') !== currentMonth) {
            return false;
          }
          
          // שיטה 1: אם יש שדה complex מוגדר, השתמש בו ישירות
          if (t.complex) {
            return t.complex === currentComplex;
          }
          
          // שיטה 2: אם אין שדה complex, בדוק לפי התיאור והקטגוריה
          const isExtraRooms = 
            (t.description && t.description.includes('חדרים נוספים')) ||
            (t.category && t.category.includes('חדרים נוספים'));
          
          return (currentComplex === 'extraRooms' && isExtraRooms) || 
                 (currentComplex === 'rothschild' && !isExtraRooms);
        } catch (error) {
          console.error('שגיאה בפירוש תאריך:', t.date);
          return false;
        }
      })
      .forEach(transaction => {
        const method = transaction.paymentMethod;
        if (!incomeByMethod[method]) {
          incomeByMethod[method] = 0;
        }
        incomeByMethod[method] += transaction.amount || 0;
      });
      
    // הוספת הכנסות מ-SimpleBookings
    // זה יתווסף רק אם זה מתחם 'extraRooms' (כי SimpleBookings שייכים לחדרים נוספים)
    if (currentComplex === 'extraRooms' && simpleBookings && simpleBookings.length > 0) {
      simpleBookings
        .filter(booking => {
          try {
            // סינון לפי תאריך (וודא שיש תאריך ושהוא בחודש הנוכחי)
            const bookingDate = parseISO(booking.date);
            return format(bookingDate, 'yyyy-MM') === currentMonth && 
                   booking.isPaid && booking.amount > 0;
          } catch (error) {
            console.error('שגיאה בפירוש תאריך SimpleBooking:', booking.date);
            return false;
          }
        })
        .forEach(booking => {
          const method = booking.paymentMethod || 'other';
          if (!incomeByMethod[method]) {
            incomeByMethod[method] = 0;
          }
          incomeByMethod[method] += booking.amount || 0;
        });
    }

    return incomeByMethod;
  }, [bookings, transactions, selectedDate, selectedComplex, simpleBookings]);

  // חישוב סך כל ההכנסות (הזמנות + עסקאות ידניות + SimpleBookings) לפי המתחם הנוכחי
  const calculateTotalIncome = useCallback(() => {
    const currentMonth = format(selectedDate, 'yyyy-MM');
    const currentComplex = selectedComplex === 0 ? 'rothschild' : 'extraRooms';
    let totalIncome = 0;
    
    // הכנסות מהזמנות רגילות (רק למתחם רוטשילד)
    if (currentComplex === 'rothschild') {
      const bookingsIncome = bookings
        .filter(booking => {
          const bookingDate = parseISO(booking.createdAt);
          return format(bookingDate, 'yyyy-MM') === currentMonth &&
                 booking.paymentStatus === 'paid' &&
                 !booking.paymentMethod.startsWith('credit');
        })
        .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
      totalIncome += bookingsIncome;
      console.log(`הכנסות מהזמנות רגילות (רוטשילד): ${bookingsIncome}`);
    }
    
    // הכנסות מעסקאות ידניות
    const manualIncome = transactions
      .filter(t => {
        try {
          return t.type === 'income' &&
                 format(parseISO(t.date), 'yyyy-MM') === currentMonth &&
                 t.complex === currentComplex;
        } catch (error) {
          console.error('שגיאה בפירוש תאריך:', t.date);
          return false;
        }
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    totalIncome += manualIncome;
    console.log(`הכנסות מעסקאות ידניות (${currentComplex}): ${manualIncome}`);
    
    // הכנסות מהזמנות פשוטות (רק למתחם חדרים נוספים)
    if (currentComplex === 'extraRooms' && simpleBookings) {
      const simpleBookingsIncome = simpleBookings
        .filter(booking => {
          try {
            return booking.isPaid &&
                   format(parseISO(booking.date), 'yyyy-MM') === currentMonth;
          } catch (error) {
            console.error('שגיאה בפירוש תאריך SimpleBooking:', booking.date);
            return false;
          }
        })
        .reduce((sum, booking) => sum + (booking.amount || 0), 0);
      totalIncome += simpleBookingsIncome;
      console.log(`הכנסות מהזמנות פשוטות (חדרים נוספים): ${simpleBookingsIncome}`);
    }
    
    console.log(`סה"כ הכנסות למתחם ${currentComplex}: ${totalIncome}`);
    return totalIncome;
  }, [bookings, transactions, selectedDate, selectedComplex, simpleBookings]);

  // חישוב נתוני חודש נוכחי
  const currentMonthData = useMemo(() => {
    const income = calculateTotalIncome();
    
    // סינון הוצאות לפי תאריך ומתחם
    const expenses = transactions
      .filter(t => {
        try {
          // בדיקת סוג עסקה ותאריך
          if (t.type !== 'expense' || 
             format(parseISO(t.date), 'yyyy-MM') !== format(selectedDate, 'yyyy-MM')) {
            return false;
          }
          
          // קביעת המתחם הנוכחי
          const currentComplex = selectedComplex === 0 ? 'rothschild' : 'extraRooms';
          
          // שיטה 1: אם יש שדה complex מוגדר, השתמש בו ישירות
          if (t.complex) {
            return t.complex === currentComplex;
          }
          
          // שיטה 2: אם אין שדה complex, בדוק לפי התיאור והקטגוריה
          const isExtraRooms = 
            (t.description && t.description.includes('חדרים נוספים')) ||
            (t.category && t.category.includes('חדרים נוספים'));
          
          return (currentComplex === 'extraRooms' && isExtraRooms) || 
                 (currentComplex === 'rothschild' && !isExtraRooms);
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
  }, [calculateTotalIncome, transactions, selectedDate, selectedComplex]);

  // חישוב נתוני חודש קודם להשוואה
  const previousMonthData = useMemo(() => {
    const prevDate = subMonths(selectedDate, 1);
    const startDate = startOfMonth(prevDate);
    const endDate = endOfMonth(prevDate);
    const prevMonth = format(prevDate, 'yyyy-MM');

    // הכנסות מהזמנות
    const bookingsIncome = bookings
      .filter(booking => {
        const bookingDate = parseISO(booking.createdAt);
        return bookingDate >= startDate && bookingDate <= endDate &&
               booking.paymentStatus === 'paid' &&
               !booking.paymentMethod.startsWith('credit');
      })
      .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
      
    // הכנסות מעסקאות ידניות
    const manualIncome = transactions
      .filter(t => {
        try {
          return t.type === 'income' && 
                 format(parseISO(t.date), 'yyyy-MM') === prevMonth;
        } catch (error) {
          console.error('שגיאה בפירוש תאריך:', t.date);
          return false;
        }
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
      
    // סה"כ הכנסות החודש הקודם
    const totalIncome = bookingsIncome + manualIncome;

    const expenses = transactions
      .filter(t => {
        try {
          return t.type === 'expense' && 
                 format(parseISO(t.date), 'yyyy-MM') === prevMonth;
        } catch (error) {
          console.error('Error parsing date:', t.date);
          return false;
        }
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income: totalIncome,
      expenses,
      balance: totalIncome - expenses
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
      const monthFormat = format(date, 'yyyy-MM');
      
      // הכנסות מהזמנות לחודש זה
      const bookingsIncome = bookings
        .filter(booking => {
          const bookingDate = parseISO(booking.createdAt);
          return format(bookingDate, 'yyyy-MM') === monthFormat &&
                 booking.paymentStatus === 'paid' &&
                 !booking.paymentMethod.startsWith('credit');
        })
        .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
        
      // הכנסות מעסקאות ידניות לחודש זה
      const manualIncome = transactions
        .filter(t => {
          try {
            return t.type === 'income' && format(parseISO(t.date), 'yyyy-MM') === monthFormat;
          } catch (error) {
            console.error('שגיאה בפירוש תאריך:', t.date);
            return false;
          }
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      // הוצאות לחודש זה
      const monthExpenses = transactions
        .filter(t => {
          try {
            return t.type === 'expense' && format(parseISO(t.date), 'yyyy-MM') === monthFormat;
          } catch (error) {
            console.error('Error parsing date:', t.date);
            return false;
          }
        })
        .reduce((sum, t) => sum + t.amount, 0);
        
      return {
        name: format(date, 'MMM yyyy', { locale: he }),
        income: bookingsIncome + manualIncome, // סה"כ הכנסות
        expenses: monthExpenses
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

  // עדכון פונקציית חישוב ההון הכולל להתחשב ביתרות פתיחה
  const calculateTotalCapital = useCallback(async () => {
    try {
      setLoadingCapital(true);
      console.log('מתחיל חישוב הון כולל...');
      
      // קבלת כל העסקאות מהשרת - ללא פרמטר month כדי לקבל את כל העסקאות ללא סינון לפי חודש
      console.log('שולח בקשה לקבלת כל העסקאות מהשרת');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/financial/transactions`,
        {
          params: {}, // שליחת אובייקט ריק של פרמטרים כדי לקבל את כל העסקאות ללא סינון לפי חודש
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        const allTransactions = response.data.data;
        console.log(`נטענו ${allTransactions.length} עסקאות מהשרת:`, allTransactions);
        
        // חישוב הון לפי שיטות תשלום
        const capitalByMethod = {};
        let total = 0;

        // התחל עם יתרות הפתיחה
        console.log('מוסיף יתרות פתיחה לחישוב:', initialBalances);
        Object.entries(initialBalances).forEach(([method, amount]) => {
          if (!isNaN(amount) && amount !== 0) {
            const displayMethod = getPaymentMethodLabel(method);
            capitalByMethod[displayMethod] = parseFloat(amount);
            total += parseFloat(amount);
            console.log(`יתרת פתיחה לשיטת תשלום ${method} -> ${displayMethod}: ${amount}`);
          }
        });

        // חישוב הכנסות מהזמנות
        console.log(`מחשב הכנסות מ-${bookings.length} הזמנות...`);
        bookings.forEach(booking => {
          if (booking.paymentStatus === 'paid' && !booking.paymentMethod.startsWith('credit')) {
            const originalMethod = booking.paymentMethod;
            const method = getPaymentMethodLabel(originalMethod);
            
            if (!capitalByMethod[method]) {
              capitalByMethod[method] = 0;
            }
            
            const bookingAmount = parseFloat(booking.totalPrice || 0);
            capitalByMethod[method] += bookingAmount;
            total += bookingAmount;
            
            console.log(`הזמנה: ${booking._id}, שיטת תשלום: ${originalMethod} -> ${method}, סכום: +${bookingAmount}, מצב עדכני: ${capitalByMethod[method]}`);
          }
        });

        // חישוב הוצאות והכנסות מעסקאות
        console.log(`מחשב ${allTransactions.length} עסקאות (הכנסות והוצאות)...`);
        allTransactions.forEach(transaction => {
          const amount = parseFloat(transaction.amount || 0);
          if (isNaN(amount) || amount === 0) return; // דילוג על עסקאות ללא סכום או עם סכום לא תקין
          
          const originalMethod = transaction.paymentMethod || 'מזומן';
          const method = getPaymentMethodLabel(originalMethod);
          
          if (!capitalByMethod[method]) {
            capitalByMethod[method] = 0;
          }
          
          if (transaction.type === 'expense') {
            const prevAmount = capitalByMethod[method];
            capitalByMethod[method] -= amount;
            total -= amount;
            console.log(`הוצאה: ${transaction._id}, שיטת תשלום: ${originalMethod} -> ${method}, סכום: -${amount}, מצב קודם: ${prevAmount}, מצב עדכני: ${capitalByMethod[method]}`);
          } else if (transaction.type === 'income') {
            const prevAmount = capitalByMethod[method];
            capitalByMethod[method] += amount;
            total += amount;
            console.log(`הכנסה: ${transaction._id}, שיטת תשלום: ${originalMethod} -> ${method}, סכום: +${amount}, מצב קודם: ${prevAmount}, מצב עדכני: ${capitalByMethod[method]}`);
          }
        });

        // הסרת שיטות תשלום עם סכום 0
        const filteredCapital = {};
        Object.entries(capitalByMethod).forEach(([method, amount]) => {
          if (amount !== 0) {
            filteredCapital[method] = amount;
          }
        });

        console.log('סיכום מצב הון לפי שיטת תשלום:', filteredCapital);
        console.log('סך כל ההון:', total);

        setTotalCapital(total);
        setCapitalByPaymentMethod(filteredCapital);
      } else {
        console.error('שגיאה בתשובת השרת:', response.data);
      }
    } catch (err) {
      console.error('שגיאה בחישוב ההון:', err.response || err);
      toast.error('שגיאה בחישוב ההון');
    } finally {
      setLoadingCapital(false);
    }
  }, [bookings, initialBalances]);

  // טעינת נתוני הון בעת טעינת הדף או כשמתווספת/נמחקת עסקה
  useEffect(() => {
    if (selectedTab === 0) {
      calculateTotalCapital();
    }
  }, [selectedTab, calculateTotalCapital, transactions]); // הוספת תלות ב-transactions כדי לעדכן את המצב כשהעסקאות משתנות

  // פונקציה עזר לקבלת תווית שיטת תשלום
  const getPaymentMethodLabel = (method) => {
    const methodMap = {
      'cash': 'מזומן',
      'credit': 'כרטיס אשראי',
      'creditOr': 'כרטיס אשראי - אור',
      'creditRothschild': 'כרטיס אשראי - רוטשילד',
      'mizrahi': 'העברה בנקאית - מזרחי',
      'poalim': 'העברה בנקאית - פועלים',
      'other': 'אחר',
      'paybox': 'פייבוקס' // למקרה שיש ערכים ישנים
    };
    
    return methodMap[method] || method; // אם אין מיפוי, נחזיר את המקור
  };

  // פונקציה ליצירת או עדכון הוצאה מרוכזת להכנסות מסוג "פועלים"
  const createOrUpdatePoalimSummaryExpense = async (incomeTransaction, isDelete = false) => {
    try {
      const method = incomeTransaction.paymentMethod;
      const currentMonth = format(parseISO(incomeTransaction.date), 'yyyy-MM');
      console.log(`מטפל בהכנסה מ-${method} לחודש ${currentMonth}`, isDelete ? '(מחיקה)' : '(הוספה/עדכון)');
      
      // חיפוש הוצאה מרוכזת קיימת לאותה שיטת תשלום בחודש הנוכחי
      // בדיקה מחמירה יותר שתמנע כפילויות
      const existingExpenses = transactions.filter(t => 
        t.type === 'expense' && 
        t.paymentMethod === method &&
        (t.isPoalimSummaryExpense === true || t.description?.includes('הוצאה מרוכזת עבור הכנסות')) &&
        format(parseISO(t.date), 'yyyy-MM') === currentMonth
      );
      
      console.log(`נמצאו ${existingExpenses.length} הוצאות מרוכזות קיימות עבור ${method} בחודש ${currentMonth}`);
      
      // אם יש יותר מהוצאה מרוכזת אחת, נמחק את העודפות ונשאיר רק את הראשונה
      if (existingExpenses.length > 1) {
        console.log(`נמצאו ${existingExpenses.length} הוצאות מרוכזות כפולות, מוחק את העודפות...`);
        let keepExpense = existingExpenses[0]; // נשמור את הראשונה
        
        // מחיקת ההוצאות הכפולות (מלבד הראשונה)
        for (let i = 1; i < existingExpenses.length; i++) {
          const duplicateExpense = existingExpenses[i];
          console.log(`מוחק הוצאה מרוכזת כפולה עם מזהה ${duplicateExpense._id}`);
          
          try {
            await axios.delete(
              `${process.env.REACT_APP_API_URL}/financial/transactions/${duplicateExpense._id}`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            console.log(`הוצאה כפולה ${i} נמחקה בהצלחה`);
          } catch (err) {
            console.error(`שגיאה במחיקת הוצאה כפולה ${i}:`, err);
          }
        }
      }
      
      // לאחר טיפול בכפילויות, נשתמש בהוצאה הקיימת אם יש
      const existingExpense = existingExpenses.length > 0 ? existingExpenses[0] : null;
      
      // חישוב הסכום הכולל של הכנסות פועלים מאותו סוג בחודש הנוכחי
      const relevantIncomes = transactions.filter(t => 
        t.type === 'income' && 
        t.paymentMethod === method &&
        format(parseISO(t.date), 'yyyy-MM') === currentMonth &&
        (isDelete ? t._id !== incomeTransaction._id : true) // אם זו מחיקה, אל תכלול את העסקה שנמחקת
      );
      
      // הוסף את העסקה הנוכחית אם היא חדשה ולא מחיקה
      let totalAmount = relevantIncomes.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
      // אם זו הוספה/עדכון של עסקה שעדיין לא קיימת ברשימה (כי היא עדיין לא נשמרה)
      if (!isDelete && !relevantIncomes.some(t => t._id === incomeTransaction._id)) {
        totalAmount += parseFloat(incomeTransaction.amount) || 0;
      }
      
      console.log(`סך הכנסות ${method} לחודש ${currentMonth}: ${totalAmount}`);
      
      if (totalAmount <= 0) {
        // אם הסכום הכולל הוא 0 או שלילי, מחק את ההוצאה המרוכזת אם קיימת
        if (existingExpense) {
          console.log(`מוחק הוצאה מרוכזת עבור ${method} כי הסכום הכולל הוא 0`);
          const response = await axios.delete(
            `${process.env.REACT_APP_API_URL}/financial/transactions/${existingExpense._id}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          if (response.data.success) {
            console.log('הוצאה מרוכזת נמחקה בהצלחה:', response.data.data);
            return { success: true, action: 'deleted' };
          } else {
            console.error('שגיאה במחיקת הוצאה מרוכזת:', response.data);
            return { success: false, action: 'deleted' };
          }
        }
        return { success: true, action: 'none' }; // אין צורך ביצירת הוצאה חדשה
      }
      
      if (existingExpense) {
        // עדכון הוצאה מרוכזת קיימת
        console.log(`מעדכן הוצאה מרוכזת קיימת עם מזהה ${existingExpense._id} עבור ${method} לסכום: ${totalAmount}`);
        
        const updatedExpenseData = {
          ...existingExpense,
          amount: totalAmount,
          description: `הוצאה מרוכזת עבור הכנסות מ-${method} בחודש ${format(parseISO(incomeTransaction.date), 'MM/yyyy')}`,
          // עדכון תאריך רק אם הוא בחודש הנוכחי
          date: format(parseISO(incomeTransaction.date), 'yyyy-MM') === format(parseISO(existingExpense.date), 'yyyy-MM') 
            ? incomeTransaction.date 
            : existingExpense.date,
          isPoalimSummaryExpense: true // וודא שהמאפיין הזה קיים
        };
        
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/financial/transactions/${existingExpense._id}`,
          updatedExpenseData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (response.data.success) {
          console.log('הוצאה מרוכזת עודכנה בהצלחה:', response.data.data);
          return { success: true, action: 'updated', data: response.data.data };
        } else {
          console.error('שגיאה בעדכון הוצאה מרוכזת:', response.data);
          return { success: false, action: 'updated' };
        }
        
      } else {
        // יצירת הוצאה מרוכזת חדשה
        console.log(`יוצר הוצאה מרוכזת חדשה עבור ${method} בסכום: ${totalAmount}`);
        
        const newExpenseData = {
          type: 'expense',
          amount: totalAmount,
          category: 'משכורת 02',
          description: `הוצאה מרוכזת עבור הכנסות מ-${method} בחודש ${format(parseISO(incomeTransaction.date), 'MM/yyyy')}`,
          date: incomeTransaction.date,
          paymentMethod: method,
          isPoalimSummaryExpense: true // סימון שזו הוצאה מרוכזת
        };
        
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/financial/transactions`,
          newExpenseData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (response.data.success) {
          console.log('הוצאה מרוכזת נוצרה בהצלחה:', response.data.data);
          return { success: true, action: 'created', data: response.data.data };
        } else {
          console.error('שגיאה ביצירת הוצאה מרוכזת:', response.data);
          return { success: false, action: 'created' };
        }
      }
      
    } catch (err) {
      console.error('שגיאה בטיפול בהוצאה מרוכזת:', err.response || err);
      return { success: false, action: 'error' };
    }
  };

  // טיפול בהוספת עסקה חדשה
  const handleAddTransaction = async () => {
    try {
      // וידוא שכל השדות החובה מלאים
      if (!newTransaction.type || 
          !newTransaction.amount || 
          !newTransaction.category || 
          !newTransaction.description || 
          !newTransaction.date ||
          !newTransaction.complex ||
          !newTransaction.paymentMethod) {
        toast.error('נא למלא את כל שדות החובה');
        return;
      }

      // הכנת העסקה לשליחה
      const transactionData = {
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        category: newTransaction.category,
        description: newTransaction.description,
        date: format(parseISO(newTransaction.date), 'yyyy-MM-dd'),
        complex: newTransaction.complex,
        paymentMethod: newTransaction.paymentMethod
      };

      // שליחת העסקה לשרת
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
        // עדכון הרשימה המקומית
        setTransactions(prev => [...prev, response.data.data]);
        
        // סגירת הדיאלוג וניקוי הטופס
        setIsAddDialogOpen(false);
        setNewTransaction({
          type: 'income',
          amount: '',
          category: '',
          description: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          complex: selectedComplex === 0 ? 'rothschild' : 'extraRooms',
          paymentMethod: ''
        });
        
        toast.success('העסקה נוספה בהצלחה');
      } else {
        toast.error('שגיאה בהוספת העסקה');
      }
    } catch (err) {
      console.error('שגיאה בהוספת עסקה:', err.response || err);
      toast.error(err.response?.data?.message || 'שגיאה בהוספת העסקה');
    }
  };

  // מחיקת עסקה
  const handleDeleteTransaction = async (transactionId) => {
    try {
      const transaction = transactions.find(t => t._id === transactionId);
      if (!transaction) {
        console.error('לא נמצאה עסקה למחיקה עם מזהה:', transactionId);
        return;
      }

      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/financial/transactions/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        console.log('העסקה נמחקה בהצלחה:', response.data.data);
        toast.success('העסקה נמחקה בהצלחה');
        
        // טעינה מחדש של הנתונים
        await fetchFinancialData();
        
        // עדכון מצב ההון מיד לאחר מחיקת עסקה
        console.log('מחשב מחדש את מצב ההון לאחר מחיקת עסקה...');
        await calculateTotalCapital();
      } else {
        console.error('שגיאה בתשובת השרת:', response.data);
        toast.error('שגיאה במחיקת העסקה: ' + (response.data.message || 'שגיאה לא ידועה'));
      }
    } catch (err) {
      console.error('שגיאה במחיקת עסקה:', err);
      toast.error('שגיאה במחיקת העסקה: ' + (err.response?.data?.message || err.message || 'שגיאה לא ידועה'));
    }
  };

  // עדכון עסקה
  const handleUpdateTransaction = async () => {
    try {
      if (!editingTransaction) {
        console.error('אין עסקה לעדכון');
        return;
      }

      // וידוא שיש ערך complex, אם לא נגדיר לפי הטאב הנוכחי
      const complexValue = editingTransaction.complex || (selectedComplex === 0 ? 'rothschild' : 'extraRooms');

      const updatedData = {
        ...editingTransaction,
        complex: complexValue, // וידוא שיש ערך complex
        date: format(editingTransaction.date, 'yyyy-MM-dd')
      };

      console.log('מעדכן עסקה:', updatedData);

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/financial/transactions/${editingTransaction._id}`,
        updatedData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        console.log('העסקה עודכנה בהצלחה:', response.data.data);
        toast.success('העסקה עודכנה בהצלחה');
        
        setIsEditDialogOpen(false);
        setEditingTransaction(null);
        
        // טעינה מחדש של הנתונים
        await fetchFinancialData();
        
        // עדכון מצב ההון מיד לאחר עדכון עסקה
        console.log('מחשב מחדש את מצב ההון לאחר עדכון עסקה...');
        await calculateTotalCapital();
      } else {
        console.error('שגיאה בתשובת השרת:', response.data);
        toast.error('שגיאה בעדכון העסקה: ' + (response.data.message || 'שגיאה לא ידועה'));
      }
    } catch (err) {
      console.error('שגיאה בעדכון עסקה:', err);
      toast.error('שגיאה בעדכון העסקה: ' + (err.response?.data?.message || err.message || 'שגיאה לא ידועה'));
    }
  };

  // פתיחת דיאלוג עריכה
  const handleOpenEditDialog = (transaction) => {
    // אם אין שדה complex, נוסיף אותו לפי המתחם הנוכחי
    const complex = transaction.complex || (selectedComplex === 0 ? 'rothschild' : 'extraRooms');
    
    setEditingTransaction({
      ...transaction,
      complex,
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
      // עדכון מצב ההון מיד לאחר עדכון עסקה
      await calculateTotalCapital();
    } catch (err) {
      console.error('שגיאה בעדכון העסקה:', err);
      setError('שגיאה בעדכון העסקה');
    }
  };

  // פונקציה לעדכון עסקה
  const handleEditTransaction = async () => {
    try {
      if (!editingTransaction?._id) {
        toast.error('שגיאה: לא נמצא מזהה עסקה');
        return;
      }

      // וידוא שכל השדות החובה מלאים
      if (!editingTransaction.type || 
          !editingTransaction.amount || 
          !editingTransaction.category || 
          !editingTransaction.description || 
          !editingTransaction.date ||
          !editingTransaction.complex ||
          !editingTransaction.paymentMethod) {
        toast.error('נא למלא את כל שדות החובה');
        return;
      }

      // הכנת העסקה לשליחה
      const transactionData = {
        type: editingTransaction.type,
        amount: parseFloat(editingTransaction.amount),
        category: editingTransaction.category,
        description: editingTransaction.description,
        date: editingTransaction.date,
        complex: editingTransaction.complex,
        paymentMethod: editingTransaction.paymentMethod
      };

      // שליחת העדכון לשרת
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/financial/transactions/${editingTransaction._id}`,
        transactionData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // עדכון הרשימה המקומית
        setTransactions(prev => 
          prev.map(t => t._id === editingTransaction._id ? response.data.data : t)
        );
        
        // סגירת הדיאלוג וניקוי הטופס
        setIsEditDialogOpen(false);
        setEditingTransaction(null);
        
        toast.success('העסקה עודכנה בהצלחה');
      } else {
        toast.error('שגיאה בעדכון העסקה');
      }
    } catch (err) {
      console.error('שגיאה בעדכון עסקה:', err.response || err);
      toast.error(err.response?.data?.message || 'שגיאה בעדכון העסקה');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Tabs
              value={selectedTab}
              onChange={(e, newValue) => {
                setSelectedTab(newValue);
                if (newValue === 0) {
                  // אם עברנו לטאב מצב הון, נעדכן את הנתונים
                  calculateTotalCapital();
                }
              }}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                mb: 3,
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.primary.main,
                  height: 3,
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                }
              }}
            >
              <Tab 
                icon={<AccountBalanceIcon />} 
                label="מצב הון" 
                iconPosition="start"
              />
              <Tab 
                icon={<DateRangeIcon />} 
                label="ניהול חודשי" 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {selectedTab === 0 ? (
            <Box>
              {loadingCapital ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {/* כרטיס הון כולל */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                      <StatCard
                        icon={<AccountBalanceIcon />}
                        title="הון כולל בעסק"
                        value={totalCapital}
                        subtext="סה״כ הכנסות פחות הוצאות"
                        color={CHART_COLORS.balance}
                      />
                    </Paper>
                  </Grid>

                  {/* התפלגות הון לפי שיטות תשלום */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <SectionTitle variant="h5" gutterBottom sx={{ mb: 0 }}>
                          התפלגות הון לפי שיטות תשלום
                        </SectionTitle>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="הגדרת יתרות פתיחה">
                            <IconButton 
                              onClick={() => {
                                // יצירת עותק של היתרות הקיימות לעריכה
                                setEditingInitialBalances({...initialBalances});
                                setIsInitialBalancesDialogOpen(true);
                              }}
                              color="primary"
                            >
                              <SettingsIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="רענון נתוני הון">
                            <IconButton 
                              onClick={() => {
                                setLoadingCapital(true);
                                calculateTotalCapital();
                              }}
                              color="primary"
                            >
                              <RefreshIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                          <strong>איך זה עובד:</strong> המערכת מחשבת את יתרת ההון בכל אמצעי תשלום על ידי התחלה מיתרות הפתיחה שהוגדרו, חיבור כל ההכנסות והחסרת כל ההוצאות בכל שיטת תשלום. כאשר מתווספת הכנסה חדשה או הוצאה חדשה, היתרה מתעדכנת בהתאם. לחץ על <SettingsIcon fontSize="small" sx={{ verticalAlign: 'middle' }}/> להגדרת יתרות פתיחה.
                        </Typography>
                      </Alert>
                      
                      <Grid container spacing={3}>
                        {Object.entries(capitalByPaymentMethod).map(([method, amount], index) => (
                          <Grid item xs={12} sm={6} md={4} key={method}>
                            <StatCard
                              icon={ICON_MAP[method] || <AttachMoneyIcon />}
                              title={method}
                              value={amount}
                              subtext="הון בשיטת תשלום זו"
                              color={CHART_COLORS.categories[index % CHART_COLORS.categories.length]}
                            />
                          </Grid>
                        ))}
                      </Grid>

                      {/* גרף עוגה */}
                      <Box sx={{ mt: 4, height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(capitalByPaymentMethod).map(([method, amount], index) => ({
                                name: method,
                                value: amount
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={150}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {Object.entries(capitalByPaymentMethod).map(([method, amount], index) => (
                                <Cell key={`cell-${method}`} fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              formatter={(value) => `₪${value.toLocaleString()}`}
                              contentStyle={{ direction: 'rtl' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Box>
          ) : (
            <Box>
              {/* התוכן הקיים של ניהול חודשי */}
              <Grid container spacing={3}>
                {/* סרגל צדדי */}
                <Grid item xs={12} md={1}>
                  <MinimalSidebar>
                    <SidebarButton title="לוח מחוונים" placement="right" active={currentPath === '/dashboard' ? true : undefined}>
                      <IconButton
                        component={RouterLink}
                        to="/dashboard"
                        aria-label="dashboard"
                      >
                        <DashboardIcon sx={{ color: currentPath === '/dashboard' ? '#3498db' : theme.palette.text.secondary, '&:hover': { color: '#2980b9' } }} />
                      </IconButton>
                    </SidebarButton>
                    
                    <SidebarButton title="יומן הזמנות" placement="right" active={currentPath === '/dashboard/bookings-calendar' ? true : undefined}>
                      <IconButton
                        component={RouterLink}
                        to="/dashboard/bookings-calendar"
                        aria-label="bookings-calendar"
                      >
                        <CalendarMonthIcon sx={{ color: currentPath === '/dashboard/bookings-calendar' ? '#e74c3c' : theme.palette.text.secondary, '&:hover': { color: '#c0392b' } }} />
                      </IconButton>
                    </SidebarButton>
                    
                    <SidebarButton title="106 / Airport" placement="right" active={currentPath === '/dashboard/simple-bookings' ? true : undefined}>
                      <IconButton
                        component={RouterLink}
                        to="/dashboard/simple-bookings"
                        aria-label="airport"
                      >
                        <HotelIcon sx={{ color: currentPath === '/dashboard/simple-bookings' ? '#f39c12' : theme.palette.text.secondary, '&:hover': { color: '#d35400' } }} />
                      </IconButton>
                    </SidebarButton>
                    
                    <SidebarButton title="דו״ח הכנסות" placement="right" active={currentPath === '/dashboard/income-report' ? true : undefined}>
                      <IconButton
                        component={RouterLink}
                        to="/dashboard/income-report"
                        aria-label="income-report"
                      >
                        <AssessmentIcon sx={{ color: currentPath === '/dashboard/income-report' ? '#9b59b6' : theme.palette.text.secondary, '&:hover': { color: '#8e44ad' } }} />
                      </IconButton>
                    </SidebarButton>
                    
                    <Box sx={{ flexGrow: 1 }} /> {/* מרווח גמיש שידחוף את האייקון הבא לתחתית */}
                    
                    <SidebarButton title="אתר הבית" placement="right" active={currentPath === '/' ? true : undefined}>
                      <IconButton
                        component={RouterLink}
                        to="/"
                        aria-label="home"
                      >
                        <LanguageIcon sx={{ color: currentPath === '/' ? '#2ecc71' : theme.palette.text.secondary, '&:hover': { color: '#27ae60' } }} />
                      </IconButton>
                    </SidebarButton>
                  </MinimalSidebar>
                </Grid>
                
                {/* תוכן ראשי */}
                <Grid item xs={12} md={11}>
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
                            הכנסות {selectedComplex === 0 ? '(מתחם רוטשילד)' : '(חדרים נוספים)'}
                          </SectionTitle>
                          <Box sx={{ mb: 4 }}>
                            <StatCard
                              icon={<TrendingUpIcon />}
                              title={`הכנסות חודש נוכחי ${selectedComplex === 0 ? '(מתחם רוטשילד)' : '(חדרים נוספים)'}`}
                              value={currentMonthData.income}
                              subtext="סה״כ הכנסות"
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
                                    key={`income-${method}`} 
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
                                      {getPaymentMethodLabel(method)}
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
                          
                          {/* טבלת עסקאות הכנסה */}
                          <Typography variant="h6" gutterBottom sx={{ 
                            fontWeight: 500,
                            mb: 3,
                            mt: 4,
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
                            רשימת עסקאות הכנסה
                          </Typography>
                          
                          {/* טאבים לבחירת מתחם */}
                          <Tabs
                            value={selectedComplex}
                            onChange={(e, newValue) => {
                              setSelectedComplex(newValue);
                            }}
                            sx={{ 
                              mb: 2,
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              '& .MuiTab-root': {
                                textTransform: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                minWidth: 0,
                                px: 3
                              }
                            }}
                          >
                            <Tab label="מתחם רוטשילד" />
                            <Tab label="חדרים נוספים" />
                          </Tabs>
                          
                          {/* כפתור הוספת עסקת הכנסה למתחם הנוכחי */}
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                setNewTransaction(prev => ({
                                  ...prev,
                                  type: 'income',
                                  complex: selectedComplex === 0 ? 'rothschild' : 'extraRooms'
                                }));
                                setIsAddDialogOpen(true);
                              }}
                              sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 3
                              }}
                            >
                              הוסף עסקת הכנסה {selectedComplex === 0 ? 'למתחם רוטשילד' : 'לחדרים נוספים'}
                            </Button>
                          </Box>
                          
                          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>תאריך</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>קטגוריה</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>תיאור</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>שיטת תשלום</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>סכום</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>פעולות</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {transactions
                                  .filter(t => {
                                    // סינון לפי סוג עסקה (הכנסה בלבד)
                                    if (t.type !== 'income') return false;
                                    
                                    // קביעת המתחם הנוכחי
                                    const currentComplex = selectedComplex === 0 ? 'rothschild' : 'extraRooms';
                                    
                                    // שיטה 1: אם יש שדה complex מוגדר, השתמש בו ישירות
                                    if (t.complex) {
                                      return t.complex === currentComplex;
                                    }
                                    
                                    // שיטה 2: אם אין שדה complex, בדוק לפי התיאור והקטגוריה
                                    const isExtraRooms = 
                                      (t.description && t.description.includes('חדרים נוספים')) ||
                                      (t.category && t.category.includes('חדרים נוספים'));
                                      
                                    return (currentComplex === 'extraRooms' && isExtraRooms) || 
                                           (currentComplex === 'rothschild' && !isExtraRooms);
                                  })
                                  .map((transaction) => (
                                    <TableRow key={transaction._id} hover>
                                      <TableCell>{format(parseISO(transaction.date), 'dd/MM/yyyy')}</TableCell>
                                      <TableCell>{transaction.category}</TableCell>
                                      <TableCell>{transaction.description}</TableCell>
                                      <TableCell>
                                        <Chip
                                          label={getPaymentMethodLabel(transaction.paymentMethod)}
                                          size="small"
                                          color="success"
                                          variant="outlined"
                                        />
                                      </TableCell>
                                      <TableCell align="right" sx={{ color: CHART_COLORS.income }}>
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
                                
                                {/* הודעה כשאין הכנסות למתחם הנבחר */}
                                {transactions.filter(t => {
                                  if (t.type !== 'income') return false;
                                  const currentComplex = selectedComplex === 0 ? 'rothschild' : 'extraRooms';
                                  if (t.complex) return t.complex === currentComplex;
                                  const isExtraRooms = 
                                    (t.description && t.description.includes('חדרים נוספים')) ||
                                    (t.category && t.category.includes('חדרים נוספים'));
                                  return (currentComplex === 'extraRooms' && isExtraRooms) || 
                                         (currentComplex === 'rothschild' && !isExtraRooms);
                                }).length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        לא נמצאו עסקאות הכנסה למתחם {selectedComplex === 0 ? 'רוטשילד' : 'חדרים נוספים'} בחודש זה
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Paper>
                      </Grid>

                      {/* צד שמאל - הוצאות */}
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                          <SectionTitle variant="h5" gutterBottom>
                            הוצאות {selectedComplex === 0 ? '(מתחם רוטשילד)' : '(חדרים נוספים)'}
                          </SectionTitle>
                          <Box sx={{ mb: 4 }}>
                            <StatCard
                              icon={<TrendingDownIcon />}
                              title={`הוצאות חודש נוכחי ${selectedComplex === 0 ? '(מתחם רוטשילד)' : '(חדרים נוספים)'}`}
                              value={currentMonthData.expenses}
                              subtext="סה״כ הוצאות"
                              color={CHART_COLORS.expense}
                              trend={calculateTrend(currentMonthData.expenses, previousMonthData.expenses)}
                            />
                          </Box>

                          {/* טאבים לבחירת מתחם */}
                          <Tabs
                            value={selectedComplex}
                            onChange={(e, newValue) => {
                              setSelectedComplex(newValue);
                            }}
                            sx={{ 
                              mb: 2,
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              '& .MuiTab-root': {
                                textTransform: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                minWidth: 0,
                                px: 3
                              }
                            }}
                          >
                            <Tab label="מתחם רוטשילד" />
                            <Tab label="חדרים נוספים" />
                          </Tabs>

                          {/* טבלת הוצאות */}
                          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>תאריך</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>קטגוריה</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>תיאור</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>שיטת תשלום</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>סכום</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>פעולות</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {transactions
                                  .filter(t => {
                                    // סינון לפי סוג עסקה (הוצאה בלבד)
                                    if (t.type !== 'expense') return false;
                                    
                                    // קביעת המתחם הנוכחי
                                    const currentComplex = selectedComplex === 0 ? 'rothschild' : 'extraRooms';
                                    
                                    // שיטה 1: אם יש שדה complex מוגדר, השתמש בו ישירות
                                    if (t.complex) {
                                      return t.complex === currentComplex;
                                    }
                                    
                                    // שיטה 2: אם אין שדה complex, בדוק לפי התיאור והקטגוריה
                                    const isExtraRooms = 
                                      (t.description && t.description.includes('חדרים נוספים')) ||
                                      (t.category && t.category.includes('חדרים נוספים'));
                                      
                                    return (currentComplex === 'extraRooms' && isExtraRooms) || 
                                           (currentComplex === 'rothschild' && !isExtraRooms);
                                  })
                                  .map((transaction) => (
                                    <TableRow key={transaction._id} hover>
                                      <TableCell>{format(parseISO(transaction.date), 'dd/MM/yyyy')}</TableCell>
                                      <TableCell>{transaction.category}</TableCell>
                                      <TableCell>{transaction.description}</TableCell>
                                      <TableCell>
                                        <Chip
                                          label={getPaymentMethodLabel(transaction.paymentMethod)}
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                        />
                                      </TableCell>
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
                                  
                                  {/* הודעה כשאין הוצאות למתחם הנבחר */}
                                  {transactions.filter(t => {
                                    if (t.type !== 'expense') return false;
                                    const currentComplex = selectedComplex === 0 ? 'rothschild' : 'extraRooms';
                                    if (t.complex) return t.complex === currentComplex;
                                    const isExtraRooms = 
                                      (t.description && t.description.includes('חדרים נוספים')) ||
                                      (t.category && t.category.includes('חדרים נוספים'));
                                    return (currentComplex === 'extraRooms' && isExtraRooms) || 
                                           (currentComplex === 'rothschild' && !isExtraRooms);
                                  }).length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                          לא נמצאו עסקאות הוצאה למתחם {selectedComplex === 0 ? 'רוטשילד' : 'חדרים נוספים'} בחודש זה
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          
                          {/* כפתור הוספת עסקת הוצאה למתחם הנוכחי */}
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                setNewTransaction(prev => ({
                                  ...prev,
                                  type: 'expense',
                                  complex: selectedComplex === 0 ? 'rothschild' : 'extraRooms'
                                }));
                                setIsAddDialogOpen(true);
                              }}
                              sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 3,
                                bgcolor: CHART_COLORS.expense,
                                '&:hover': {
                                  bgcolor: alpha(CHART_COLORS.expense, 0.8)
                                }
                              }}
                            >
                              הוסף עסקת הוצאה {selectedComplex === 0 ? 'למתחם רוטשילד' : 'לחדרים נוספים'}
                            </Button>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* דיאלוג הוספת עסקה */}
                    <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
                      <DialogTitle>הוספת עסקה חדשה</DialogTitle>
                      <DialogContent>
                        <Stack spacing={2} sx={{ mt: 2 }}>
                          <FormControl fullWidth>
                            <InputLabel>מתחם</InputLabel>
                            <Select
                              value={newTransaction.complex || 'rothschild'}
                              onChange={(e) => setNewTransaction({ ...newTransaction, complex: e.target.value })}
                              label="מתחם"
                            >
                              <MenuItem value="rothschild">רוטשילד</MenuItem>
                              <MenuItem value="extraRooms">חדרים נוספים</MenuItem>
                            </Select>
                          </FormControl>

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
                            required
                            error={!newTransaction.amount}
                            helperText={!newTransaction.amount ? 'שדה חובה' : ''}
                          />

                          <FormControl fullWidth required error={!newTransaction.category}>
                            <InputLabel>קטגוריה</InputLabel>
                            <Select
                              value={newTransaction.category}
                              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                              label="קטגוריה"
                            >
                              {categories && categories[newTransaction.type === 'income' ? 'income' : 'expenses']?.map((category) => (
                                <MenuItem key={category.id || category} value={category.name || category}>
                                  {category.name || category}
                                </MenuItem>
                              ))}
                            </Select>
                            {!newTransaction.category && <FormHelperText>שדה חובה</FormHelperText>}
                          </FormControl>

                          <FormControl fullWidth required error={!newTransaction.paymentMethod}>
                            <InputLabel>שיטת תשלום</InputLabel>
                            <Select
                              value={newTransaction.paymentMethod}
                              onChange={(e) => setNewTransaction({ ...newTransaction, paymentMethod: e.target.value })}
                              label="שיטת תשלום"
                            >
                              {PAYMENT_METHODS[newTransaction.complex || 'rothschild'].map((method) => (
                                <MenuItem key={method.id} value={method.id}>
                                  {method.label}
                                </MenuItem>
                              ))}
                            </Select>
                            {!newTransaction.paymentMethod && <FormHelperText>שדה חובה</FormHelperText>}
                          </FormControl>

                          <TextField
                            fullWidth
                            label="תיאור"
                            value={newTransaction.description}
                            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                            required
                            error={!newTransaction.description}
                            helperText={!newTransaction.description ? 'שדה חובה' : ''}
                          />

                          <TextField
                            fullWidth
                            label="תאריך"
                            type="date"
                            value={newTransaction.date}
                            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                            InputLabelProps={{
                              shrink: true,
                            }}
                            required
                            error={!newTransaction.date}
                            helperText={!newTransaction.date ? 'שדה חובה' : ''}
                          />
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
                            <InputLabel>מתחם</InputLabel>
                            <Select
                              value={editingTransaction?.complex || 'rothschild'}
                              onChange={(e) => setEditingTransaction({ ...editingTransaction, complex: e.target.value })}
                              label="מתחם"
                            >
                              <MenuItem value="rothschild">רוטשילד</MenuItem>
                              <MenuItem value="extraRooms">חדרים נוספים</MenuItem>
                            </Select>
                          </FormControl>

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
                            required
                            error={!editingTransaction?.amount}
                            helperText={!editingTransaction?.amount ? 'שדה חובה' : ''}
                          />

                          <FormControl fullWidth required error={!editingTransaction?.category}>
                            <InputLabel>קטגוריה</InputLabel>
                            <Select
                              value={editingTransaction?.category || ''}
                              onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                              label="קטגוריה"
                            >
                              {categories && categories[editingTransaction?.type === 'income' ? 'income' : 'expenses']?.map((category) => (
                                <MenuItem key={category.id || category} value={category.name || category}>
                                  {category.name || category}
                                </MenuItem>
                              ))}
                            </Select>
                            {!editingTransaction?.category && <FormHelperText>שדה חובה</FormHelperText>}
                          </FormControl>

                          <FormControl fullWidth required error={!editingTransaction?.paymentMethod}>
                            <InputLabel>שיטת תשלום</InputLabel>
                            <Select
                              value={editingTransaction?.paymentMethod || ''}
                              onChange={(e) => setEditingTransaction({ ...editingTransaction, paymentMethod: e.target.value })}
                              label="שיטת תשלום"
                            >
                              {PAYMENT_METHODS[editingTransaction?.complex || 'rothschild'].map((method) => (
                                <MenuItem key={method.id} value={method.id}>
                                  {method.label}
                                </MenuItem>
                              ))}
                            </Select>
                            {!editingTransaction?.paymentMethod && <FormHelperText>שדה חובה</FormHelperText>}
                          </FormControl>

                          <TextField
                            fullWidth
                            label="תיאור"
                            value={editingTransaction?.description || ''}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                            required
                            error={!editingTransaction?.description}
                            helperText={!editingTransaction?.description ? 'שדה חובה' : ''}
                          />

                          <TextField
                            fullWidth
                            label="תאריך"
                            type="date"
                            value={editingTransaction?.date ? format(parseISO(editingTransaction.date), 'yyyy-MM-dd') : ''}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                            InputLabelProps={{
                              shrink: true,
                            }}
                            required
                            error={!editingTransaction?.date}
                            helperText={!editingTransaction?.date ? 'שדה חובה' : ''}
                          />
                        </Stack>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={handleCloseEditDialog}>
                          ביטול
                        </Button>
                        <Button onClick={handleEditTransaction} variant="contained">
                          שמור
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
                </Grid>
              </Grid>
            </Box>
          )}

          {/* דיאלוג הגדרת יתרות פתיחה */}
          <Dialog 
            open={isInitialBalancesDialogOpen} 
            onClose={() => setIsInitialBalancesDialogOpen(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceIcon />
                הגדרת יתרות פתיחה
              </Box>
            </DialogTitle>
            <DialogContent>
              <Alert severity="info" sx={{ mb: 3, mt: 1 }}>
                <Typography variant="body2">
                  הגדר יתרות פתיחה לכל שיטת תשלום. יתרות אלה ישמשו כבסיס לחישוב מצב ההון הכולל.
                </Typography>
              </Alert>
              
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                שיטות תשלום:
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="מזומן"
                    type="number"
                    value={editingInitialBalances['מזומן'] || ''}
                    onChange={(e) => setEditingInitialBalances({
                      ...editingInitialBalances,
                      'מזומן': e.target.value
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="העברה מזרחי"
                    type="number"
                    value={editingInitialBalances['העברה מזרחי'] || ''}
                    onChange={(e) => setEditingInitialBalances({
                      ...editingInitialBalances,
                      'העברה מזרחי': e.target.value
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="ביט מזרחי"
                    type="number"
                    value={editingInitialBalances['ביט מזרחי'] || ''}
                    onChange={(e) => setEditingInitialBalances({
                      ...editingInitialBalances,
                      'ביט מזרחי': e.target.value
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="פייבוקס מזרחי"
                    type="number"
                    value={editingInitialBalances['פייבוקס מזרחי'] || ''}
                    onChange={(e) => setEditingInitialBalances({
                      ...editingInitialBalances,
                      'פייבוקס מזרחי': e.target.value
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="העברה פועלים"
                    type="number"
                    value={editingInitialBalances['העברה פועלים'] || ''}
                    onChange={(e) => setEditingInitialBalances({
                      ...editingInitialBalances,
                      'העברה פועלים': e.target.value
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="ביט פועלים"
                    type="number"
                    value={editingInitialBalances['ביט פועלים'] || ''}
                    onChange={(e) => setEditingInitialBalances({
                      ...editingInitialBalances,
                      'ביט פועלים': e.target.value
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="פייבוקס פועלים"
                    type="number"
                    value={editingInitialBalances['פייבוקס פועלים'] || ''}
                    onChange={(e) => setEditingInitialBalances({
                      ...editingInitialBalances,
                      'פייבוקס פועלים': e.target.value
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setIsInitialBalancesDialogOpen(false)} 
                color="inherit"
              >
                ביטול
              </Button>
              <Button 
                onClick={() => {
                  updateInitialBalances(editingInitialBalances);
                  setIsInitialBalancesDialogOpen(false);
                }} 
                variant="contained"
                color="primary"
              >
                שמור יתרות
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default FinancialManagementPage; 