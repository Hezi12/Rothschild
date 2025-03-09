import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Box, 
  Typography, 
  Paper, 
  Container,
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  Tooltip,
  useTheme,
  useMediaQuery,
  Alert,
  AlertTitle
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as CameraIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Home as HomeIcon
} from '@mui/icons-material';

const GalleryManagementPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState(null);
  const [imageTitle, setImageTitle] = useState('');
  const [saveOrder, setSaveOrder] = useState(false);
  
  useEffect(() => {
    fetchGallery();
  }, []);
  
  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/gallery/admin`);
      setGallery(response.data.data);
    } catch (error) {
      console.error('שגיאה בטעינת הגלריה:', error);
      toast.error('שגיאה בטעינת נתוני הגלריה');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleOpenUploadDialog = () => {
    setSelectedFile(null);
    setUploadDialogOpen(true);
  };
  
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
  };
  
  const handleUploadImage = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (imageTitle) {
        formData.append('title', imageTitle);
      }
      
      await axios.post(
        `${process.env.REACT_APP_API_URL}/uploads/gallery`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      toast.success('התמונה הועלתה בהצלחה');
      handleCloseUploadDialog();
      fetchGallery();
    } catch (error) {
      console.error('שגיאה בהעלאת תמונה:', error);
      toast.error('שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את התמונה?')) {
      return;
    }
    
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/gallery/image/${imageId}`);
      toast.success('התמונה נמחקה בהצלחה');
      fetchGallery();
    } catch (error) {
      console.error('שגיאה במחיקת תמונה:', error);
      toast.error('שגיאה במחיקת התמונה');
    }
  };
  
  const handleOpenEditDialog = (image) => {
    setImageToEdit(image);
    setImageTitle(image.title || '');
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setImageToEdit(null);
    setImageTitle('');
  };
  
  const handleUpdateImage = async () => {
    if (!imageToEdit) return;
    
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/gallery/image/${imageToEdit._id}`, {
        title: imageTitle
      });
      
      toast.success('התמונה עודכנה בהצלחה');
      handleCloseEditDialog();
      fetchGallery();
    } catch (error) {
      console.error('שגיאה בעדכון תמונה:', error);
      toast.error('שגיאה בעדכון התמונה');
    }
  };
  
  const handleToggleImageActive = async (imageId, currentValue) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/gallery/image/${imageId}`, {
        isActive: !currentValue
      });
      
      toast.success(currentValue ? 'התמונה הוסתרה בהצלחה' : 'התמונה הופעלה בהצלחה');
      fetchGallery();
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס תמונה:', error);
      toast.error('שגיאה בעדכון סטטוס התמונה');
    }
  };
  
  const handleDragEnd = async (result) => {
    // אם לא הייתה תזוזה או יעד לא תקין
    if (!result.destination) return;
    
    const items = Array.from(gallery.images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // עדכון סטטוס העריכה
    setSaveOrder(true);
    
    // עדכון המצב המקומי
    setGallery({ ...gallery, images: items });
  };
  
  const handleSaveOrder = async () => {
    try {
      const imageIds = gallery.images.map(image => image._id);
      
      await axios.put(`${process.env.REACT_APP_API_URL}/gallery/reorder`, { imageIds });
      
      toast.success('סדר התמונות נשמר בהצלחה');
      setSaveOrder(false);
    } catch (error) {
      console.error('שגיאה בשמירת סדר התמונות:', error);
      toast.error('שגיאה בשמירת סדר התמונות');
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            ניהול גלריית תמונות
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenUploadDialog}
          >
            העלאת תמונה חדשה
          </Button>
        </Box>
        
        <Typography variant="subtitle1" color="text.secondary" mb={2}>
          כאן תוכל לנהל את גלריית התמונות הכללית המוצגת בדף הבית.
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {gallery && gallery.images.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>אין תמונות בגלריה</AlertTitle>
            לחץ על "העלאת תמונה חדשה" כדי להוסיף תמונות לגלריה.
          </Alert>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              <HomeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              תמונות המוצגות בדף הבית
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              גרור ושחרר את התמונות כדי לשנות את סדר הופעתן. לחץ על האייקונים כדי להסתיר או לערוך.
            </Typography>
            
            {saveOrder && (
              <Box display="flex" justifyContent="center" mb={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveOrder}
                >
                  שמירת סדר התמונות
                </Button>
              </Box>
            )}
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="gallery-images" direction="horizontal">
                {(provided) => (
                  <Grid
                    container
                    spacing={3}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {gallery.images.map((image, index) => (
                      <Draggable key={image._id} draggableId={image._id} index={index}>
                        {(provided) => (
                          <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <Card sx={{
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              position: 'relative',
                              opacity: image.isActive ? 1 : 0.6,
                              transition: 'all 0.3s ease',
                            }}>
                              <Box 
                                {...provided.dragHandleProps}
                                sx={{ 
                                  position: 'absolute', 
                                  top: 8, 
                                  right: 8, 
                                  bgcolor: 'rgba(0,0,0,0.5)', 
                                  borderRadius: '50%',
                                  p: 0.5,
                                  zIndex: 1,
                                  cursor: 'grab'
                                }}
                              >
                                <DragIcon sx={{ color: 'white' }} />
                              </Box>
                              
                              <CardMedia
                                component="img"
                                height="200"
                                image={image.url}
                                alt={image.title || `תמונה ${index + 1}`}
                                sx={{ objectFit: 'cover' }}
                              />
                              
                              <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1" component="h3">
                                  {image.title || `תמונה ${index + 1}`}
                                </Typography>
                                <Box mt={1} display="flex" alignItems="center" justifyContent="space-between">
                                  <Typography variant="body2" color="text.secondary">
                                    {image.isActive ? 'מוצגת בדף הבית' : 'מוסתרת'}
                                  </Typography>
                                  <Box>
                                    <Tooltip title={image.isActive ? 'הסתר תמונה' : 'הצג תמונה'}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleToggleImageActive(image._id, image.isActive)}
                                        color={image.isActive ? 'primary' : 'default'}
                                      >
                                        {image.isActive ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </CardContent>
                              
                              <CardActions>
                                <Button
                                  size="small"
                                  startIcon={<EditIcon />}
                                  onClick={() => handleOpenEditDialog(image)}
                                >
                                  עריכה
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  startIcon={<DeleteIcon />}
                                  onClick={() => handleDeleteImage(image._id)}
                                >
                                  מחיקה
                                </Button>
                              </CardActions>
                            </Card>
                          </Grid>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Grid>
                )}
              </Droppable>
            </DragDropContext>
          </Box>
        )}
      </Paper>
      
      {/* דיאלוג העלאת תמונה */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog}>
        <DialogTitle>העלאת תמונה חדשה לגלריה</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="upload-gallery-image"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="upload-gallery-image">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CameraIcon />}
              >
                בחירת תמונה
              </Button>
            </label>
            
            {selectedFile && (
              <Box mt={2}>
                <Typography variant="body2">
                  נבחר: {selectedFile.name}
                </Typography>
              </Box>
            )}
            
            <TextField
              margin="normal"
              fullWidth
              label="כותרת התמונה (אופציונלי)"
              value={imageTitle}
              onChange={(e) => setImageTitle(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>ביטול</Button>
          <Button
            onClick={handleUploadImage}
            color="primary"
            disabled={!selectedFile || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'העלאה'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג עריכת תמונה */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog}>
        <DialogTitle>עריכת פרטי תמונה</DialogTitle>
        <DialogContent>
          {imageToEdit && (
            <Box sx={{ mt: 2 }}>
              <Box
                component="img"
                src={imageToEdit.url}
                alt="תמונת גלריה"
                sx={{ 
                  width: '100%', 
                  height: 200, 
                  objectFit: 'cover', 
                  borderRadius: 1, 
                  mb: 2 
                }}
              />
              
              <TextField
                margin="normal"
                fullWidth
                label="כותרת התמונה"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>ביטול</Button>
          <Button
            onClick={handleUpdateImage}
            color="primary"
          >
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GalleryManagementPage; 