import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PhotoCamera as CameraIcon
} from '@mui/icons-material';

const RoomsListPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [roomForUpload, setRoomForUpload] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // טעינת חדרים
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`);
      setRooms(response.data.data);
    } catch (error) {
      console.error('שגיאה בטעינת חדרים:', error);
      toast.error('שגיאה בטעינת חדרים. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  // פתיחת דיאלוג מחיקה
  const handleOpenDeleteDialog = (room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  // סגירת דיאלוג מחיקה
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRoomToDelete(null);
  };

  // מחיקת חדר
  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/rooms/${roomToDelete._id}`);
      
      // עדכון הרשימה
      setRooms(rooms.filter(room => room._id !== roomToDelete._id));
      
      toast.success('החדר נמחק בהצלחה');
    } catch (error) {
      console.error('שגיאה במחיקת חדר:', error);
      toast.error('שגיאה במחיקת החדר. אנא נסה שוב מאוחר יותר.');
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // פתיחת דיאלוג עריכה
  const handleOpenEditDialog = (room) => {
    setRoomToEdit({
      ...room,
      amenities: room.amenities.join(', ')
    });
    setEditDialogOpen(true);
  };

  // סגירת דיאלוג עריכה
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setRoomToEdit(null);
  };

  // טיפול בשינוי שדות עריכה
  const handleEditChange = (e) => {
    const { name, value, checked, type } = e.target;
    setRoomToEdit(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // שמירת שינויים בחדר
  const handleSaveRoom = async () => {
    try {
      const roomData = {
        ...roomToEdit,
        amenities: roomToEdit.amenities.split(',').map(item => item.trim()).filter(Boolean)
      };
      
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/rooms/${roomToEdit._id}`, roomData);
      
      // עדכון הרשימה
      setRooms(rooms.map(room => 
        room._id === roomToEdit._id ? response.data.data : room
      ));
      
      toast.success('החדר עודכן בהצלחה');
      handleCloseEditDialog();
    } catch (error) {
      console.error('שגיאה בעדכון חדר:', error);
      toast.error('שגיאה בעדכון החדר. אנא נסה שוב מאוחר יותר.');
    }
  };

  // פתיחת דיאלוג העלאת תמונה
  const handleOpenUploadDialog = (room) => {
    setRoomForUpload(room);
    setSelectedFile(null);
    setUploadDialogOpen(true);
  };

  // סגירת דיאלוג העלאת תמונה
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setRoomForUpload(null);
    setSelectedFile(null);
  };

  // טיפול בבחירת קובץ
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // העלאת תמונה
  const handleUploadImage = async () => {
    if (!selectedFile || !roomForUpload) return;
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/uploads/room/${roomForUpload._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // עדכון החדר עם התמונה החדשה
      const updatedRoom = {
        ...roomForUpload,
        images: [...roomForUpload.images, response.data.data]
      };
      
      // עדכון הרשימה
      setRooms(rooms.map(room => 
        room._id === roomForUpload._id ? updatedRoom : room
      ));
      
      toast.success('התמונה הועלתה בהצלחה');
      handleCloseUploadDialog();
    } catch (error) {
      console.error('שגיאה בהעלאת תמונה:', error);
      toast.error('שגיאה בהעלאת התמונה. אנא נסה שוב מאוחר יותר.');
    } finally {
      setUploading(false);
    }
  };

  // מחיקת תמונה
  const handleDeleteImage = async (roomId, imageId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/uploads/room/${roomId}/${imageId}`);
      
      // עדכון הרשימה
      const updatedRooms = rooms.map(room => {
        if (room._id === roomId) {
          return {
            ...room,
            images: room.images.filter(img => img._id !== imageId)
          };
        }
        return room;
      });
      
      setRooms(updatedRooms);
      toast.success('התמונה נמחקה בהצלחה');
    } catch (error) {
      console.error('שגיאה במחיקת תמונה:', error);
      toast.error('שגיאה במחיקת התמונה. אנא נסה שוב מאוחר יותר.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          ניהול חדרים
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {/* פתיחת דיאלוג יצירת חדר חדש */}}
        >
          הוסף חדר חדש
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : rooms.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>לא נמצאו חדרים</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {rooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room._id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={room.images[0]?.url || 'https://via.placeholder.com/300x200?text=אין+תמונה'}
                  alt={`חדר ${room.roomNumber}`}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      חדר {room.roomNumber}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={room.isActive}
                          onChange={async (e) => {
                            try {
                              const response = await axios.put(`${process.env.REACT_APP_API_URL}/rooms/${room._id}`, {
                                isActive: e.target.checked
                              });
                              
                              // עדכון הרשימה
                              setRooms(rooms.map(r => 
                                r._id === room._id ? response.data.data : r
                              ));
                              
                              toast.success(`החדר ${e.target.checked ? 'הופעל' : 'הושבת'} בהצלחה`);
                            } catch (error) {
                              console.error('שגיאה בעדכון סטטוס חדר:', error);
                              toast.error('שגיאה בעדכון סטטוס החדר');
                            }
                          }}
                          color="primary"
                          size="small"
                        />
                      }
                      label={room.isActive ? 'פעיל' : 'לא פעיל'}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {room.type === 'standard' ? 'סטנדרט' : room.type}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>מחיר:</strong> {room.basePrice} ₪
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>תפוסה מקסימלית:</strong> {room.maxOccupancy} אנשים
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    {room.description.length > 100 
                      ? `${room.description.substring(0, 100)}...` 
                      : room.description}
                  </Typography>
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>שירותים:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {room.amenities.map((amenity, index) => (
                        <Chip 
                          key={index} 
                          label={amenity} 
                          size="small" 
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenEditDialog(room)}
                      title="ערוך חדר"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleOpenDeleteDialog(room)}
                      title="מחק חדר"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  
                  <Button
                    startIcon={<CameraIcon />}
                    onClick={() => handleOpenUploadDialog(room)}
                  >
                    העלה תמונה
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* דיאלוג מחיקה */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>מחיקת חדר</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם אתה בטוח שברצונך למחוק את חדר {roomToDelete?.roomNumber}?
            פעולה זו אינה ניתנת לביטול.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>ביטול</Button>
          <Button onClick={handleDeleteRoom} color="error" autoFocus>
            מחק
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג עריכה */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>עריכת חדר {roomToEdit?.roomNumber}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="מספר חדר"
                name="roomNumber"
                type="number"
                value={roomToEdit?.roomNumber || ''}
                onChange={handleEditChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>סוג חדר</InputLabel>
                <Select
                  name="type"
                  value={roomToEdit?.type || 'standard'}
                  onChange={handleEditChange}
                  label="סוג חדר"
                >
                  <MenuItem value="standard">סטנדרט</MenuItem>
                  <MenuItem value="deluxe">דלקס</MenuItem>
                  <MenuItem value="suite">סוויטה</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="מחיר בסיס"
                name="basePrice"
                type="number"
                value={roomToEdit?.basePrice || ''}
                onChange={handleEditChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="תפוסה מקסימלית"
                name="maxOccupancy"
                type="number"
                value={roomToEdit?.maxOccupancy || ''}
                onChange={handleEditChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="תיאור"
                name="description"
                multiline
                rows={3}
                value={roomToEdit?.description || ''}
                onChange={handleEditChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="שירותים (מופרדים בפסיקים)"
                name="amenities"
                value={roomToEdit?.amenities || ''}
                onChange={handleEditChange}
                helperText="לדוגמה: מיזוג אוויר, טלוויזיה, מקרר"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={roomToEdit?.isActive || false}
                    onChange={handleEditChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="חדר פעיל"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>ביטול</Button>
          <Button onClick={handleSaveRoom} color="primary">
            שמור
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג העלאת תמונה */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
      >
        <DialogTitle>העלאת תמונה לחדר {roomForUpload?.roomNumber}</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="upload-image"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="upload-image">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CameraIcon />}
              >
                בחר תמונה
              </Button>
            </label>
            
            {selectedFile && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  נבחר: {selectedFile.name}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>ביטול</Button>
          <Button 
            onClick={handleUploadImage} 
            color="primary"
            disabled={!selectedFile || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'העלה'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoomsListPage; 