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
    friday: { enabled: false, price: 0 }
  });

  // טעינת חדרים
  useEffect(() => {
    fetchRooms();
    
    // בדיקה האם יש צורך להוסיף את חדר 13
    const addRoom13 = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
        if (response.data.success) {
          // בדיקה אם חדר 13 כבר קיים
          const room13Exists = response.data.data.some(room => 
            Number(room.roomNumber) === 13 || room.internalName === "13"
          );
          
          if (!room13Exists) {
            console.log('מוסיף חדר 13...');
            // הוספת חדר 13
            const newRoom = {
              roomNumber: 13,
              internalName: "13",
              type: "simple",
              basePrice: 350,
              maxOccupancy: 3,
              description: "חדר פשוט עם מרפסת. חדר נעים ומרווח הכולל מקרר ומיקרוגל. ניתן להוסיף מיטת יחיד נוספת.",
              amenities: ["מרפסת", "מקרר", "מיקרוגל", "טלוויזיה", "מזגן", "WiFi"],
              isActive: true
            };
            
            const addResponse = await axios.post(`${process.env.REACT_APP_API_URL}/rooms`, newRoom);
            
            if (addResponse.data.success) {
              toast.success("חדר 13 נוסף בהצלחה!");
              // טעינה מחדש של רשימת החדרים
              fetchRooms();
            }
          }
        }
      } catch (error) {
        console.error('שגיאה בבדיקת/הוספת חדר 13:', error);
      }
    };
    
    // בדיקה האם יש צורך להוסיף את חדר 21
    const addRoom21 = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
        if (response.data.success) {
          // בדיקה אם חדר 21 כבר קיים
          const room21Exists = response.data.data.some(room => 
            Number(room.roomNumber) === 21 || room.internalName === "21"
          );
          
          if (!room21Exists) {
            console.log('מוסיף חדר 21...');
            // הוספת חדר 21
            const newRoom = {
              roomNumber: 21,
              internalName: "21",
              type: "standard",
              basePrice: 350,
              maxOccupancy: 3,
              description: "חדר סטנדרט עם מרפסת ואמבטיה. חדר נעים ומרווח הכולל מקרר ומיקרוגל. ניתן להוסיף מיטת יחיד נוספת.",
              amenities: ["מרפסת", "אמבטיה", "מקרר", "מיקרוגל", "טלוויזיה", "מזגן", "WiFi"],
              isActive: true
            };
            
            const addResponse = await axios.post(`${process.env.REACT_APP_API_URL}/rooms`, newRoom);
            
            if (addResponse.data.success) {
              toast.success("חדר 21 נוסף בהצלחה!");
              // טעינה מחדש של רשימת החדרים
              fetchRooms();
            }
          }
        }
      } catch (error) {
        console.error('שגיאה בבדיקת/הוספת חדר 21:', error);
      }
    };
    
    // בדיקה האם יש צורך להוסיף את חדר 17
    const addRoom17 = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
        if (response.data.success) {
          // בדיקה אם חדר 17 כבר קיים
          const room17Exists = response.data.data.some(room => 
            Number(room.roomNumber) === 17 || room.internalName === "17"
          );
          
          if (!room17Exists) {
            console.log('מוסיף חדר 17...');
            // הוספת חדר 17
            const newRoom = {
              roomNumber: 17,
              internalName: "17",
              type: "standard",
              basePrice: 380,
              maxOccupancy: 4,
              description: "חדר סטנדרט עם ספה נפתחת למיטה זוגית. מתאים למשפחות, מרווח ונעים עם אפשרות לארח עד 4 אנשים. החדר כולל מקרר ומיקרוגל.",
              amenities: ["ספה נפתחת", "מקרר", "מיקרוגל", "טלוויזיה", "מזגן", "WiFi"],
              isActive: true
            };
            
            const addResponse = await axios.post(`${process.env.REACT_APP_API_URL}/rooms`, newRoom);
            
            if (addResponse.data.success) {
              toast.success("חדר 17 נוסף בהצלחה!");
              // טעינה מחדש של רשימת החדרים
              fetchRooms();
            }
          }
        }
      } catch (error) {
        console.error('שגיאה בבדיקת/הוספת חדר 17:', error);
      }
    };
    
    // הפעלת הפונקציה להוספת חדר 13
    addRoom13();
    // הפעלת הפונקציה להוספת חדר 21
    addRoom21();
    // הפעלת הפונקציה להוספת חדר 17
    addRoom17();
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
    // איפוס מחירים מיוחדים - רק שישי במקום כל הימים
    const defaultSpecialPrices = {
      friday: { enabled: false, price: 0 }
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
          
          console.log('מחירים מיוחדים שהתקבלו מהשרת:', roomSpecialPrices);
          
          // עדכון המחירים המיוחדים מתוך הנתונים שהתקבלו
          // במקרה שלנו אנחנו רק בודקים את יום שישי
          if (roomSpecialPrices.friday) {
            updatedPrices.friday = { enabled: true, price: Number(roomSpecialPrices.friday) };
            console.log(`נטען מחיר מיוחד ליום שישי: ${roomSpecialPrices.friday}₪`);
          }
          
          setSpecialPrices(updatedPrices);
        } else {
          setSpecialPrices(defaultSpecialPrices);
        }
      } catch (error) {
        console.error('שגיאה בטעינת מחירים מיוחדים:', error);
        setSpecialPrices(defaultSpecialPrices);
      }
    };
    
    // וידוא שמספר החדר ושם פנימי זהים לאחר איחוד השדות
    const roomIdentifier = room.roomNumber || '';
    
    setCurrentRoom({
      ...room,
      amenities: room.amenities ? room.amenities.join(', ') : '',
      roomNumber: roomIdentifier,
      internalName: roomIdentifier
    });
    
    loadSpecialPrices();
    
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setCurrentRoom(null);
    setSpecialPrices({
      friday: { enabled: false, price: 0 }
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
      // בדיקה אם יש מחיר מיוחד ליום שישי
      if (specialPrices.friday?.enabled && specialPrices.friday?.price > 0) {
        // מיפוי יום שישי למספר
        const dayMap = {
          friday: 5
        };
        
        // הכנת מערך של ימי שבוע עם מחיר מיוחד - במקרה שלנו רק יום שישי
        const daysOfWeek = [5]; // 5 = יום שישי
        
        // תאריכים עתידיים - 3 חודשים קדימה
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);
        
        // יצירת אובייקט של מחירים מיוחדים לפי ימים
        const priceDayMap = {
          5: specialPrices.friday.price // 5 = יום שישי
        };
        
        // עדכון מחירים לתקופה עתידית
        await axios.put(`${process.env.REACT_APP_API_URL}/prices/bulk`, {
          roomIds: [roomId],
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          price: 0, // מחיר בסיסי שיוחלף במחירים מיוחדים
          daysOfWeek: daysOfWeek,
          specialPrices: priceDayMap
        });
        
        toast.success('המחיר המיוחד ליום שישי עודכן בהצלחה');
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
      
      // וידוא שמספר החדר ושם פנימי זהים
      const roomIdentifier = currentRoom.roomNumber || '';
      
      // הכנת האובייקט לשמירה
      const roomData = {
        ...currentRoom,
        amenities: amenitiesArray,
        roomNumber: roomIdentifier,
        internalName: roomIdentifier
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
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // בדיקת סוג הקבצים וגודלם
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = [];
    const validFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // בדיקת סוג הקובץ
      if (!validTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} (סוג קובץ לא נתמך)`);
        continue;
      }
      
      // בדיקת גודל הקובץ (מקסימום 10MB)
      if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (גודל קובץ גדול מדי)`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    // הודעה על קבצים לא תקינים
    if (invalidFiles.length > 0) {
      toast.error(`הקבצים הבאים לא יועלו:\n${invalidFiles.join('\n')}`);
      if (validFiles.length === 0) return;
    }
    
    try {
      setImageUploading(true);
      
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('images', file);
      });
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/uploads/room/${roomId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        // עדכון רשימת החדרים עם התמונות החדשות
        setRooms(rooms.map(room => {
          if (room._id === roomId) {
            return {
              ...room,
              images: [...room.images, ...response.data.data]
            };
          }
          return room;
        }));
        
        toast.success(`${validFiles.length} תמונות הועלו בהצלחה`);
      }
    } catch (error) {
      console.error('שגיאה בהעלאת תמונות:', error);
      toast.error(
        error.response?.data?.message || 
        'שגיאה בהעלאת התמונות. אנא נסה שוב.'
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
        `${process.env.REACT_APP_API_URL}/uploads/room/${roomId}/${imageId}`
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
      console.log(`מנסה להגדיר תמונה ראשית: roomId=${roomId}, imageId=${imageId}`);
      const apiEndpoint = `${process.env.REACT_APP_API_URL}/uploads/room/${roomId}/${imageId}/primary`;
      console.log(`API Endpoint: ${apiEndpoint}`);
      
      const response = await axios.put(apiEndpoint);
      
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
      
      // לוג מפורט יותר
      if (error.response) {
        console.error('תגובת השרת:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
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
                  internalName: '',
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
                      {room.internalName ? `חדר ${room.internalName}` : `חדר ${room.roomNumber}`}
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
                          {room.type === 'simple' ? 'פשוט' :
                           room.type === 'simple_with_balcony' ? 'פשוט עם מרפסת' :
                           room.type === 'standard' ? 'סטנדרט' : 
                           room.type === 'standard_with_balcony' ? 'סטנדרט עם מרפסת' :
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
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoFocus
                margin="dense"
                name="roomNumber"
                label="מספר חדר / שם"
                type="text"
                fullWidth
                variant="outlined"
                value={currentRoom?.roomNumber || ''}
                onChange={(e) => {
                  // עדכון הן של מספר החדר והן של השם הפנימי
                  const value = e.target.value;
                  setCurrentRoom({
                    ...currentRoom,
                    roomNumber: value,
                    internalName: value
                  });
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                <InputLabel>סוג חדר</InputLabel>
                <Select
                  name="type"
                  value={currentRoom?.type || 'standard'}
                  onChange={handleInputChange}
                  label="סוג חדר"
                >
                  <MenuItem value="simple">Simple</MenuItem>
                  <MenuItem value="simple_with_balcony">Simple with Balcony</MenuItem>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="standard_with_balcony">Standard with Balcony</MenuItem>
                  <MenuItem value="deluxe">Deluxe</MenuItem>
                  <MenuItem value="suite">Suite</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* מחיר בסיס ומחיר כולל מע"מ */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="basePrice"
                label="מחיר בסיס ללא מע״מ"
                type="number"
                fullWidth
                variant="outlined"
                value={currentRoom?.basePrice || ''}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="מחיר כולל מע״מ (18%)"
                type="number"
                fullWidth
                variant="outlined"
                value={currentRoom?.basePrice ? Math.round(currentRoom.basePrice * 1.18) : ''}
                onChange={(e) => {
                  const withVatPrice = Number(e.target.value);
                  if (!isNaN(withVatPrice)) {
                    const withoutVatPrice = Math.round((withVatPrice / 1.18) * 100) / 100;
                    setCurrentRoom({
                      ...currentRoom,
                      basePrice: withoutVatPrice
                    });
                  }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
          
          {/* מחיר מיוחד ליום שישי */}
          <Box sx={{ mb: 3, border: '1px solid #e0e0e0', p: 2, borderRadius: 1, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
            <Typography sx={{ display: 'flex', alignItems: 'center', mb: 2, fontWeight: 'medium' }}>
              <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
              מחיר מיוחד ליום שישי
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="fridayPrice"
                  label="מחיר לליל שישי (ללא מע״מ)"
                  type="number"
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={specialPrices.friday?.price || ''}
                  onChange={(e) => handleSpecialPriceChange('friday', 'price', Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="מחיר לליל שישי כולל מע״מ"
                  type="number"
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={specialPrices.friday?.price ? Math.round(specialPrices.friday.price * 1.18) : ''}
                  onChange={(e) => {
                    const withVatPrice = Number(e.target.value);
                    if (!isNaN(withVatPrice)) {
                      const withoutVatPrice = Math.round((withVatPrice / 1.18) * 100) / 100;
                      handleSpecialPriceChange('friday', 'price', withoutVatPrice);
                      handleSpecialPriceChange('friday', 'enabled', true);
                    }
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
          
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
              העלאת תמונות חדשות
              <input
                type="file"
                hidden
                accept="image/*"
                multiple
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