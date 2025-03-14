import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Fab, 
  Paper, 
  Typography, 
  Slider, 
  Tooltip, 
  IconButton, 
  Zoom,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { 
  Accessibility as AccessibilityIcon,
  ZoomIn as ZoomInIcon, 
  Close as CloseIcon,
  FormatSize as FormatSizeIcon,
  Contrast as ContrastIcon,
  TextFields as TextFieldsIcon,
  InvertColors as InvertColorsIcon,
  FormatLineSpacing as LineSpacingIcon
} from '@mui/icons-material';

const AccessibilityWidget = () => {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [contrast, setContrast] = useState(false);
  const [invertColors, setInvertColors] = useState(false);
  const [lineSpacing, setLineSpacing] = useState(100);
  const [textOnly, setTextOnly] = useState(false);
  const [links, setLinks] = useState(false);
  
  // טעינת הגדרות שמורות מה-localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setFontSize(settings.fontSize || 100);
      setContrast(settings.contrast || false);
      setInvertColors(settings.invertColors || false);
      setLineSpacing(settings.lineSpacing || 100);
      setTextOnly(settings.textOnly || false);
      setLinks(settings.links || false);
      
      // החלת ההגדרות
      applySettings(settings);
    }
  }, []);
  
  // שמירת הגדרות ב-localStorage
  const saveSettings = (newSettings) => {
    const settings = {
      fontSize,
      contrast,
      invertColors,
      lineSpacing,
      textOnly,
      links,
      ...newSettings
    };
    
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    applySettings(settings);
  };
  
  // החלת הגדרות הנגישות
  const applySettings = (settings) => {
    // גודל טקסט
    document.documentElement.style.fontSize = `${settings.fontSize}%`;
    
    // ניגודיות גבוהה
    if (settings.contrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // היפוך צבעים
    if (settings.invertColors) {
      document.body.classList.add('invert-colors');
    } else {
      document.body.classList.remove('invert-colors');
    }
    
    // מרווח בין שורות
    document.body.style.lineHeight = `${settings.lineSpacing}%`;
    
    // רק טקסט
    if (settings.textOnly) {
      document.body.classList.add('text-only');
    } else {
      document.body.classList.remove('text-only');
    }
    
    // הדגשת קישורים
    if (settings.links) {
      document.body.classList.add('highlight-links');
    } else {
      document.body.classList.remove('highlight-links');
    }
  };
  
  // טיפול בשינוי גודל הטקסט
  const handleFontSizeChange = (event, value) => {
    setFontSize(value);
    saveSettings({ fontSize: value });
  };
  
  // טיפול בשינוי הניגודיות
  const handleContrastChange = (event) => {
    setContrast(event.target.checked);
    saveSettings({ contrast: event.target.checked });
  };
  
  // טיפול בשינוי היפוך צבעים
  const handleInvertColorsChange = (event) => {
    setInvertColors(event.target.checked);
    saveSettings({ invertColors: event.target.checked });
  };
  
  // טיפול בשינוי מרווח בין שורות
  const handleLineSpacingChange = (event, value) => {
    setLineSpacing(value);
    saveSettings({ lineSpacing: value });
  };
  
  // טיפול בשינוי מצב "רק טקסט"
  const handleTextOnlyChange = (event) => {
    setTextOnly(event.target.checked);
    saveSettings({ textOnly: event.target.checked });
  };
  
  // טיפול בשינוי הדגשת קישורים
  const handleLinksChange = (event) => {
    setLinks(event.target.checked);
    saveSettings({ links: event.target.checked });
  };
  
  // איפוס הגדרות הנגישות
  const resetSettings = () => {
    const defaultSettings = {
      fontSize: 100,
      contrast: false,
      invertColors: false,
      lineSpacing: 100,
      textOnly: false,
      links: false
    };
    
    setFontSize(defaultSettings.fontSize);
    setContrast(defaultSettings.contrast);
    setInvertColors(defaultSettings.invertColors);
    setLineSpacing(defaultSettings.lineSpacing);
    setTextOnly(defaultSettings.textOnly);
    setLinks(defaultSettings.links);
    
    saveSettings(defaultSettings);
  };
  
  return (
    <>
      {/* כפתור פתיחת תפריט הנגישות */}
      <Box 
        sx={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 1000,
        }}
      >
        <Zoom in={!open}>
          <Tooltip title="אפשרויות נגישות" arrow placement="right">
            <Fab
              color="primary"
              aria-label="accessibility options"
              onClick={() => setOpen(true)}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
              }}
            >
              <AccessibilityIcon />
            </Fab>
          </Tooltip>
        </Zoom>
      </Box>
      
      {/* תפריט הנגישות */}
      <Zoom in={open}>
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            width: 320,
            p: 3,
            zIndex: 1001,
            borderRadius: 3,
            maxHeight: 'calc(100vh - 40px)',
            overflow: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessibilityIcon color="primary" />
              הגדרות נגישות
            </Typography>
            <IconButton onClick={() => setOpen(false)} aria-label="סגור תפריט נגישות">
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FormatSizeIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body1" gutterBottom>גודל טקסט</Typography>
            </Box>
            <Box sx={{ px: 1 }}>
              <Slider
                value={fontSize}
                onChange={handleFontSizeChange}
                aria-labelledby="font-size-slider"
                valueLabelDisplay="auto"
                step={5}
                marks
                min={80}
                max={150}
                valueLabelFormat={(value) => `${value}%`}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -1 }}>
                <Typography variant="caption" color="text.secondary">קטן</Typography>
                <Typography variant="caption" color="text.secondary">גדול</Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LineSpacingIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body1" gutterBottom>מרווח בין שורות</Typography>
            </Box>
            <Box sx={{ px: 1 }}>
              <Slider
                value={lineSpacing}
                onChange={handleLineSpacingChange}
                aria-labelledby="line-spacing-slider"
                valueLabelDisplay="auto"
                step={5}
                marks
                min={100}
                max={200}
                valueLabelFormat={(value) => `${value}%`}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -1 }}>
                <Typography variant="caption" color="text.secondary">רגיל</Typography>
                <Typography variant="caption" color="text.secondary">מרווח</Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={contrast}
                  onChange={handleContrastChange}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ContrastIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                  ניגודיות גבוהה
                </Box>
              }
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={invertColors}
                  onChange={handleInvertColorsChange}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <InvertColorsIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                  היפוך צבעים
                </Box>
              }
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={textOnly}
                  onChange={handleTextOnlyChange}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextFieldsIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                  תצוגת טקסט בלבד
                </Box>
              }
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={links}
                  onChange={handleLinksChange}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ZoomInIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                  הדגשת קישורים
                </Box>
              }
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Typography 
              variant="button" 
              onClick={resetSettings}
              sx={{ 
                cursor: 'pointer', 
                color: 'primary.main',
                textDecoration: 'underline',
                '&:hover': {
                  color: 'primary.dark'
                }
              }}
            >
              איפוס הגדרות
            </Typography>
          </Box>
        </Paper>
      </Zoom>
    </>
  );
};

export default AccessibilityWidget; 