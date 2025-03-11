import React, { useState, useEffect } from 'react';
import axios from 'axios';
// eslint-disable-next-line no-unused-vars
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  // eslint-disable-next-line no-unused-vars
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
  Chip,
  // eslint-disable-next-line no-unused-vars
  Divider,
  IconButton,
  MenuItem,
  // eslint-disable-next-line no-unused-vars
  Badge,
  FormControlLabel,
  Switch,
  // eslint-disable-next-line no-unused-vars
  Tooltip,
  // eslint-disable-next-line no-unused-vars
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  List,
  ListItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Hotel as HotelIcon,
  Bed as BedIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Star as StarIcon,
  // eslint-disable-next-line no-unused-vars
  Event as EventIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

const RoomsListPage = () => {
  // State
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [roomForImages, setRoomForImages] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [roomImages, setRoomImages] = useState([]);
  // מחירים מיוחדים לימים בשבוע
  const [specialPrices, setSpecialPrices] = useState({
    sunday: { enabled: false, price: 0 },
    monday: { enabled: false, price: 0 },
    tuesday: { enabled: false, price: 0 },
    wednesday: { enabled: false, price: 0 },
    thursday: { enabled: false, price: 0 },
    friday: { enabled: false, price: 0 },
    saturday: { enabled: false, price: 0 }
  });

  // טעינת חדרים
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
      if (response.data.success) {
        setRooms(response.data.data);
      }
    } catch (error) {
      console.error('שגיאה בטעינת חדרים:', error);
      toast.error('שגיאה בטעינת חדרים. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את החדר?')) {
      return;
    }
    
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/rooms/${roomId}`);
      
      if (response.data.success) {
        setRooms(rooms.filter(r => r._id !== roomId));
        toast.success('החדר נמחק בהצלחה');
      }
    } catch (error) {
      console.error('שגיאה במחיקת החדר:', error);
      toast.error(
        error.response?.data?.message || 
        'שגיאה במחיקת החדר. אנא נסה שוב.'
      );
    }
  };

  const handleEditRoom = (room = {}) => {
    // איפוס מחירים מיוחדים
    const defaultSpecialPrices = {
      sunday: { enabled: false, price: 0 },
      monday: { enabled: false, price: 0 },
      tuesday: { enabled: false, price: 0 },
      wednesday: { enabled: false, price: 0 },
      thursday: { enabled: false, price: 0 },
      friday: { enabled: false, price: 0 },
      saturday: { enabled: false, price: 0 }
    };
    
    // טעינת מחירים מיוחדים אם זה חדר קיים
    const loadSpecialPrices = async () => {
      if (!room._id) {
        setSpecialPrices(defaultSpecialPrices);
        return;
      }
      
      try {
        // טעינת מחירים מיוחדים לפי ימי שבוע
        const specialPricesResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/rooms/${room._id}/special-prices`
        );
        
        if (specialPricesResponse.data.success) {
          const roomSpecialPrices = specialPricesResponse.data.specialPrices;
          const updatedPrices = { ...defaultSpecialPrices };
          
          // מיפוי ימים למספרים
          const dayMap = {
            0: 'sunday',
            1: 'monday', 
            2: 'tuesday',
            3: 'wednesday',
            4: 'thursday',
            5: 'friday',
            6: 'saturday'
          };
          
          // עדכון המחירים המיוחדים מתוך הנתונים שהתקבלו
          Object.entries(roomSpecialPrices).forEach(([dayNumber, price]) => {
            const day = dayMap[dayNumber];
            if (day) {
              updatedPrices[day] = { enabled: true, price: Number(price) };
            }
          });
          
          setSpecialPrices(updatedPrices);
        } else {
          setSpecialPrices(defaultSpecialPrices);
        }
      } catch (error) {
        console.error('שגיאה בטעינת מחירים מיוחדים:', error);
        setSpecialPrices(defaultSpecialPrices);
      }
    };
    
    setCurrentRoom({
      ...room,
      amenities: room.amenities ? room.amenities.join(', ') : ''
    });
    
    loadSpecialPrices();
    
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setCurrentRoom(null);
    setSpecialPrices({
      sunday: { enabled: false, price: 0 },
      monday: { enabled: false, price: 0 },
      tuesday: { enabled: false, price: 0 },
      wednesday: { enabled: false, price: 0 },
      thursday: { enabled: false, price: 0 },
      friday: { enabled: false, price: 0 },
      saturday: { enabled: false, price: 0 }
    });
    setEditDialogOpen(false);
  };

  const handleSpecialPriceChange = (day, field, value) => {
    setSpecialPrices(prevPrices => ({
      ...prevPrices,
      [day]: {
        ...prevPrices[day],
        [field]: value
      }
    }));
  };

  const handleSaveSpecialPrices = async (roomId) => {
    if (!roomId) return;
    
    try {
      // שמירת מחירים מיוחדים לפי ימי שבוע
      await axios.put(
        `${process.env.REACT_APP_API_URL}/rooms/${roomId}/special-prices`,
        { specialPrices }
      );
      
      // עדכון מחירים דינמיים לטווח תאריכים עתידי
      // עבור כל יום עם מחיר מיוחד מופעל
      const enabledDays = Object.keys(specialPrices).filter(day => specialPrices[day].enabled);
      
      if (enabledDays.length > 0) {
        // מיפוי ימים למספרים
        const dayMap = {
          sunday: 0,
          monday: 1, 
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6
        };
        
        // הכנת מערך של ימי שבוע עם מחיר מיוחד
        const daysOfWeek = enabledDays.map(day => dayMap[day]);
        
        // תאריכים עתידיים - 3 חודשים קדימה
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);
        
        // יצירת אובייקט של מחירים מיוחדים לפי ימים
        const priceDayMap = {};
        enabledDays.forEach(day => {
          if (specialPrices[day].enabled && specialPrices[day].price > 0) {
            priceDayMap[dayMap[day]] = specialPrices[day].price;
          }
        });
        
        // עדכון מחירים לתקופה עתידית
        await axios.put(`${process.env.REACT_APP_API_URL}/prices/bulk`, {
          roomIds: [roomId],
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          price: 0, // מחיר בסיסי שיוחלף במחירים מיוחדים
          daysOfWeek: daysOfWeek,
          specialPrices: priceDayMap
        });
        
        toast.success('המחירים המיוחדים עודכנו בהצלחה');
      }
    } catch (error) {
      console.error('שגיאה בעדכון מחירים מיוחדים:', error);
      toast.error(
        error.response?.data?.message || 
        'שגיאה בעדכון מחירים מיוחדים. אנא נסה שוב.'
      );
    }
  };

  const handleSaveRoom = async () => {
    if (!currentRoom) return;
    
    try {
      // הכנת האמנטיס כמערך
      const amenitiesArray = currentRoom.amenities ? 
        (typeof currentRoom.amenities === 'string' ? 
          currentRoom.amenities.split(',').map(item => item.trim()) : 
          currentRoom.amenities) : 
        [];
      
      // הכנת האובייקט לשמירה
      const roomData = {
        ...currentRoom,
        amenities: amenitiesArray
      };
      
      let response;
      
      if (currentRoom._id) {
        // עדכון חדר קיים
        response = await axios.put(
          `${process.env.REACT_APP_API_URL}/rooms/${currentRoom._id}`,
          roomData
        );
      } else {
        // יצירת חדר חדש
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/rooms`,
          roomData
        );
      }
      
      if (response.data.success) {
        if (currentRoom._id) {
          // עדכון החדר ברשימה
          setRooms(rooms.map(r => r._id === currentRoom._id ? response.data.data : r));
          
          // שמירת מחירים מיוחדים אם קיימים
          await handleSaveSpecialPrices(currentRoom._id);
          
          toast.success('החדר עודכן בהצלחה');
        } else {
          // הוספת החדר החדש לרשימה והגדרת מחירים מיוחדים אם נבחרו
          const newRoom = response.data.data;
          setRooms([...rooms, newRoom]);
          
          // שמירת מחירים מיוחדים אם קיימים
          await handleSaveSpecialPrices(newRoom._id);
          
          toast.success('החדר נוצר בהצלחה');
        }
        
        // סגירת הדיאלוג
        handleCloseEditDialog();
      }
    } catch (error) {
      console.error('שגיאה בשמירת החדר:', error);
      toast.error(
        error.response?.data?.message || 
        'שגיאה בשמירת החדר. אנא נסה שוב.'
      );
    }
  };

  const handleUploadImage = async (roomId, event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // בדיקת סוג הקובץ
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('סוג קובץ לא נתמך. אנא העלה תמונה בפורמט JPEG, PNG, GIF או WebP');
      return;
    }
    
    // בדיקת גודל הקובץ (מקסימום 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('גודל הקובץ גדול מדי. אנא העלה תמונה קטנה מ-5MB');
      return;
    }
    
    try {
      setImageUploading(true);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/rooms/${roomId}/images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        // עדכון רשימת החדרים עם התמונה החדשה
        setRooms(rooms.map(room => {
          if (room._id === roomId) {
            return {
              ...room,
              images: [...room.images, response.data.data]
            };
          }
          return room;
        }));
        
        toast.success('התמונה הועלתה בהצלחה');
      }
    } catch (error) {
      console.error('שגיאה בהעלאת תמונה:', error);
      toast.error(
        error.response?.data?.message || 
        'שגיאה בהעלאת התמונה. אנא נסה שוב.'
      );
    } finally {
      setImageUploading(false);
    }
  };

  const handleDeleteImage = async (roomId, imageId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את התמונה?')) {
      return;
    }
    
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/rooms/${roomId}/images/${imageId}`
      );
      
      if (response.data.success) {
        // עדכון רשימת החדרים ללא התמונה שנמחקה
        setRooms(rooms.map(room => {
          if (room._id === roomId) {
            return {
              ...room,
              images: room.images.filter(img => img._id !== imageId)
            };
          }
          return room;
        }));
        
        toast.success('התמונה נמחקה בהצלחה');
      }
    } catch (error) {
      console.error('שגיאה במחיקת תמונה:', error);
      toast.error(
        error.response?.data?.message || 
        'שגיאה במחיקת התמונה. אנא נסה שוב.'
      );
    }
  };

  const handleSetPrimaryImage = async (roomId, imageId) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/rooms/${roomId}/images/${imageId}/primary`
      );
      
      if (response.data.success) {
        // עדכון רשימת החדרים עם התמונה הראשית החדשה
        setRooms(rooms.map(room => {
          if (room._id === roomId) {
            return {
              ...room,
              images: room.images.map(img => ({
                ...img,
                isPrimary: img._id === imageId
              }))
            };
          }
          return room;
        }));
        
        toast.success('התמונה הראשית הוגדרה בהצלחה');
      }
    } catch (error) {
      console.error('שגיאה בהגדרת תמונה ראשית:', error);
      toast.error(
        error.response?.data?.message || 
        'שגיאה בהגדרת התמונה הראשית. אנא נסה שוב.'
      );
    }
  };

  const handleOpenImagesDialog = (room) => {
    setRoomForImages(room);
    setImageDialogOpen(true);
  };

  const handleCloseImagesDialog = () => {
    setRoomForImages(null);
    setImageDialogOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentRoom({
      ...currentRoom,
      [name]: value
    });
  };

  const handleToggleActive = async (roomId, currentStatus) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/rooms/${roomId}`,
        { isActive: !currentStatus }
      );
      
      if (response.data.success) {
        // עדכון הסטטוס ברשימת החדרים
        setRooms(rooms.map(room => {
          if (room._id === roomId) {
            return {
              ...room,
              isActive: !currentStatus
            };
          }
          return room;
        }));
        
        toast.success(`החדר ${!currentStatus ? 'הופעל' : 'הושבת'} בהצלחה`);
      }
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס החדר:', error);
      toast.error(
        error.response?.data?.message || 
        'שגיאה בעדכון סטטוס החדר. אנא נסה שוב.'
      );
    }
  };

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            ניהול חדרים
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              to="/dashboard/gallery"
              startIcon={<ImageIcon />}
            >
              גלריה כללית
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                setCurrentRoom({
                  roomNumber: '',
                  type: 'standard',
                  basePrice: '',
                  maxOccupancy: 2,
                  description: '',
                  amenities: '',
                  isActive: true
                });
                setEditDialogOpen(true);
              }}
            >
              הוסף חדר חדש
            </Button>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {rooms.map(room => (
              <Grid item xs={12} sm={6} md={4} key={room._id}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    opacity: room.isActive ? 1 : 0.7,
                    position: 'relative'
                  }}
                >
                  {!room.isActive && (
                    <Chip
                      label="לא פעיל"
                      color="error"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8
                      }}
                    />
                  )}
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography gutterBottom variant="h5" component="div">
                      חדר {room.roomNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {room.description.substring(0, 100)}
                      {room.description.length > 100 ? '...' : ''}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          <BedIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          {room.type === 'standard' ? 'סטנדרט' : 
                           room.type === 'deluxe' ? 'דה-לוקס' : 'סוויטה'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          <PersonIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          עד {room.maxOccupancy} אורחים
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          <MoneyIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          {room.basePrice} ₪ / לילה
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                    <IconButton
                      onClick={() => handleEditRoom(room)}
                      aria-label="ערוך"
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleOpenImagesDialog(room)}
                      aria-label="תמונות"
                      color="primary"
                    >
                      <ImageIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton 
                      onClick={() => handleToggleActive(room._id, room.isActive)}
                      aria-label={room.isActive ? 'השבת' : 'הפעל'}
                      color={room.isActive ? 'warning' : 'success'}
                    >
                      <HotelIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteRoom(room._id)}
                      aria-label="מחק"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
      
      {/* דיאלוג עריכת/הוספת חדר */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {currentRoom && currentRoom._id ? 'עריכת חדר' : 'הוספת חדר חדש'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            פרטי חדר
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            name="roomNumber"
            label="מספר חדר"
            type="number"
            fullWidth
            variant="outlined"
            value={currentRoom?.roomNumber || ''}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>סוג חדר</InputLabel>
            <Select
              name="type"
              value={currentRoom?.type || 'standard'}
              onChange={handleInputChange}
              label="סוג חדר"
            >
              <MenuItem value="standard">סטנדרט</MenuItem>
              <MenuItem value="deluxe">דה-לוקס</MenuItem>
              <MenuItem value="suite">סוויטה</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            name="basePrice"
            label="מחיר בסיס לחדר"
            type="number"
            fullWidth
            variant="outlined"
            value={currentRoom?.basePrice || ''}
            onChange={handleInputChange}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">₪</InputAdornment>,
            }}
          />
          
          {/* חלק חדש: מחירים מיוחדים לפי ימי שבוע */}
          <Accordion sx={{ mb: 3 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="special-prices-content"
              id="special-prices-header"
            >
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 1 }} />
                מחירים מיוחדים לפי ימי שבוע
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                קבע מחירים שונים לימים ספציפיים בשבוע. מחירים אלה יחולו באופן אוטומטי על הזמנות עתידיות.
              </Typography>
              
              <List>
                {/* ראשון */}
                <ListItem divider>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={specialPrices.sunday.enabled}
                        onChange={(e) => handleSpecialPriceChange('sunday', 'enabled', e.target.checked)}
                        name="sunday"
                      />
                    }
                    label="יום ראשון"
                    sx={{ width: '150px' }}
                  />
                  <TextField
                    disabled={!specialPrices.sunday.enabled}
                    name="sundayPrice"
                    label="מחיר"
                    type="number"
                    variant="outlined"
                    size="small"
                    value={specialPrices.sunday.price}
                    onChange={(e) => handleSpecialPriceChange('sunday', 'price', Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                    sx={{ ml: 2, width: '150px' }}
                  />
                </ListItem>
                
                {/* שני */}
                <ListItem divider>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={specialPrices.monday.enabled}
                        onChange={(e) => handleSpecialPriceChange('monday', 'enabled', e.target.checked)}
                        name="monday"
                      />
                    }
                    label="יום שני"
                    sx={{ width: '150px' }}
                  />
                  <TextField
                    disabled={!specialPrices.monday.enabled}
                    name="mondayPrice"
                    label="מחיר"
                    type="number"
                    variant="outlined"
                    size="small"
                    value={specialPrices.monday.price}
                    onChange={(e) => handleSpecialPriceChange('monday', 'price', Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                    sx={{ ml: 2, width: '150px' }}
                  />
                </ListItem>
                
                {/* שלישי */}
                <ListItem divider>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={specialPrices.tuesday.enabled}
                        onChange={(e) => handleSpecialPriceChange('tuesday', 'enabled', e.target.checked)}
                        name="tuesday"
                      />
                    }
                    label="יום שלישי"
                    sx={{ width: '150px' }}
                  />
                  <TextField
                    disabled={!specialPrices.tuesday.enabled}
                    name="tuesdayPrice"
                    label="מחיר"
                    type="number"
                    variant="outlined"
                    size="small"
                    value={specialPrices.tuesday.price}
                    onChange={(e) => handleSpecialPriceChange('tuesday', 'price', Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                    sx={{ ml: 2, width: '150px' }}
                  />
                </ListItem>
                
                {/* רביעי */}
                <ListItem divider>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={specialPrices.wednesday.enabled}
                        onChange={(e) => handleSpecialPriceChange('wednesday', 'enabled', e.target.checked)}
                        name="wednesday"
                      />
                    }
                    label="יום רביעי"
                    sx={{ width: '150px' }}
                  />
                  <TextField
                    disabled={!specialPrices.wednesday.enabled}
                    name="wednesdayPrice"
                    label="מחיר"
                    type="number"
                    variant="outlined"
                    size="small"
                    value={specialPrices.wednesday.price}
                    onChange={(e) => handleSpecialPriceChange('wednesday', 'price', Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                    sx={{ ml: 2, width: '150px' }}
                  />
                </ListItem>
                
                {/* חמישי */}
                <ListItem divider>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={specialPrices.thursday.enabled}
                        onChange={(e) => handleSpecialPriceChange('thursday', 'enabled', e.target.checked)}
                        name="thursday"
                      />
                    }
                    label="יום חמישי"
                    sx={{ width: '150px' }}
                  />
                  <TextField
                    disabled={!specialPrices.thursday.enabled}
                    name="thursdayPrice"
                    label="מחיר"
                    type="number"
                    variant="outlined"
                    size="small"
                    value={specialPrices.thursday.price}
                    onChange={(e) => handleSpecialPriceChange('thursday', 'price', Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                    sx={{ ml: 2, width: '150px' }}
                  />
                </ListItem>
                
                {/* שישי */}
                <ListItem divider>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={specialPrices.friday.enabled}
                        onChange={(e) => handleSpecialPriceChange('friday', 'enabled', e.target.checked)}
                        name="friday"
                      />
                    }
                    label="יום שישי"
                    sx={{ width: '150px' }}
                  />
                  <TextField
                    disabled={!specialPrices.friday.enabled}
                    name="fridayPrice"
                    label="מחיר"
                    type="number"
                    variant="outlined"
                    size="small"
                    value={specialPrices.friday.price}
                    onChange={(e) => handleSpecialPriceChange('friday', 'price', Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                    sx={{ ml: 2, width: '150px' }}
                  />
                </ListItem>
                
                {/* שבת */}
                <ListItem>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={specialPrices.saturday.enabled}
                        onChange={(e) => handleSpecialPriceChange('saturday', 'enabled', e.target.checked)}
                        name="saturday"
                      />
                    }
                    label="יום שבת"
                    sx={{ width: '150px' }}
                  />
                  <TextField
                    disabled={!specialPrices.saturday.enabled}
                    name="saturdayPrice"
                    label="מחיר"
                    type="number"
                    variant="outlined"
                    size="small"
                    value={specialPrices.saturday.price}
                    onChange={(e) => handleSpecialPriceChange('saturday', 'price', Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    }}
                    sx={{ ml: 2, width: '150px' }}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
          
          <TextField
            margin="dense"
            name="maxOccupancy"
            label="מספר אורחים מקסימלי"
            type="number"
            fullWidth
            variant="outlined"
            value={currentRoom?.maxOccupancy || 2}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="תיאור החדר"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={currentRoom?.description || ''}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="amenities"
            label="אמנטיס (מופרדים בפסיקים)"
            fullWidth
            variant="outlined"
            value={currentRoom?.amenities || ''}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            placeholder="טלוויזיה, מקרר, מזגן, WiFi"
          />
          <FormControlLabel
            control={
              <Switch
                checked={currentRoom?.isActive ?? true}
                onChange={(e) => setCurrentRoom({
                  ...currentRoom,
                  isActive: e.target.checked
                })}
                name="isActive"
              />
            }
            label="חדר פעיל"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>ביטול</Button>
          <Button onClick={handleSaveRoom} variant="contained">
            שמור
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג ניהול תמונות */}
      <Dialog
        open={imageDialogOpen}
        onClose={handleCloseImagesDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>ניהול תמונות - חדר {roomForImages?.roomNumber}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              component="label"
              disabled={imageUploading}
              startIcon={imageUploading ? <CircularProgress size={20} /> : <AddIcon />}
            >
              העלאת תמונה חדשה
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  if (roomForImages) {
                    handleUploadImage(roomForImages._id, e);
                  }
                }}
              />
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            {roomForImages?.images?.map((image) => (
              <Grid item xs={12} sm={6} md={4} key={image._id}>
                <Paper
                  sx={{
                    p: 2,
                    position: 'relative',
                    border: image.isPrimary ? '2px solid green' : 'none'
                  }}
                >
                  {image.isPrimary && (
                    <Chip
                      label="תמונה ראשית"
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1
                      }}
                    />
                  )}
                  <Box
                    component="img"
                    src={image.url}
                    alt={`תמונה של חדר ${roomForImages.roomNumber}`}
                    sx={{
                      width: '100%',
                      height: 150,
                      objectFit: 'cover',
                      mb: 1
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    {!image.isPrimary && (
                      <Button
                        size="small"
                        onClick={() => handleSetPrimaryImage(roomForImages._id, image._id)}
                        startIcon={<StarIcon />}
                        sx={{ mr: 1 }}
                      >
                        הגדר כראשית
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteImage(roomForImages._id, image._id)}
                      startIcon={<DeleteIcon />}
                    >
                      מחק
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
            {!roomForImages?.images?.length && (
              <Grid item xs={12}>
                <Typography variant="body1" align="center">
                  אין תמונות לחדר זה עדיין
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImagesDialog}>סגור</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RoomsListPage; 