import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Badge,
  FormControlLabel,
  Switch,
  Tooltip,
  Avatar
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
  Event as EventIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';

const RoomsListPage = () => {
  // State
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [icalDialogOpen, setIcalDialogOpen] = useState(false);
  const [roomForIcal, setRoomForIcal] = useState(null);
  const [icalUrl, setIcalUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [roomForImages, setRoomForImages] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [roomImages, setRoomImages] = useState([]);

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

  const handleEditRoom = (room) => {
    setCurrentRoom({
      ...room,
      amenities: room.amenities ? room.amenities.join(', ') : ''
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setCurrentRoom(null);
    setEditDialogOpen(false);
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
          toast.success('החדר עודכן בהצלחה');
        } else {
          // הוספת החדר החדש לרשימה
          setRooms([...rooms, response.data.data]);
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
    setRoomImages(room.images || []);
    setImageDialogOpen(true);
  };

  const handleCloseImagesDialog = () => {
    setRoomForImages(null);
    setRoomImages([]);
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
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            ניהול חדרים
          </Typography>
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
          <TextField
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
          <TextField
            margin="dense"
            name="type"
            label="סוג חדר"
            select
            fullWidth
            variant="outlined"
            value={currentRoom?.type || 'standard'}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          >
            <MenuItem value="standard">סטנדרט</MenuItem>
            <MenuItem value="deluxe">דה-לוקס</MenuItem>
            <MenuItem value="suite">סוויטה</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            name="basePrice"
            label="מחיר בסיס (לילה)"
            type="number"
            fullWidth
            variant="outlined"
            value={currentRoom?.basePrice || ''}
            onChange={handleInputChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">₪</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />
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
    </Layout>
  );
};

export default RoomsListPage; 