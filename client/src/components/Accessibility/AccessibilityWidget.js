import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Box, 
  Button, 
  IconButton, 
  Typography, 
  Tooltip, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Slider, 
  Switch, 
  FormControlLabel,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  AccessibilityNew as AccessibilityIcon,
  TextIncrease as TextIncreaseIcon,
  TextDecrease as TextDecreaseIcon,
  FormatLineSpacing as LineSpacingIcon,
  Contrast as ContrastIcon,
  Colorize as ColorizeIcon,
  Brightness6 as BrightnessIcon,
  Keyboard as KeyboardIcon,
  FiberManualRecord as FocusIcon,
  FormatSize as FontSizeIcon,
  OpenWith as CursorIcon,
  ZoomIn as ZoomInIcon,
  Subtitles as SubtitlesIcon,
  InvertColors as InvertColorsIcon,
  GTranslate as DyslexiaIcon,
  FormatAlignCenter as AlignIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// קובץ סגנון עבור הנגישות
import './AccessibilityWidget.css';

const AccessibilityWidget = () => {
  const theme = useTheme();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // מצבי נגישות
  const [fontSize, setFontSize] = useState(0);
  const [lineSpacing, setLineSpacing] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [invertColors, setInvertColors] = useState(false);
  const [monochrome, setMonochrome] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [bigCursor, setBigCursor] = useState(false);
  const [highlightLinks, setHighlightLinks] = useState(false);
  const [highlightFocus, setHighlightFocus] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  
  // קובע אם חלון הנגישות פתוח או סגור
  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  // מגדיל גודל פונט
  const increaseFontSize = () => {
    if (fontSize < 5) {
      setFontSize(prevSize => prevSize + 1);
    }
  };

  // מקטין גודל פונט
  const decreaseFontSize = () => {
    if (fontSize > -3) {
      setFontSize(prevSize => prevSize - 1);
    }
  };

  // מגדיל רווח בין שורות
  const increaseLineSpacing = () => {
    if (lineSpacing < 3) {
      setLineSpacing(prevSpacing => prevSpacing + 1);
    }
  };

  // מקטין רווח בין שורות
  const decreaseLineSpacing = () => {
    if (lineSpacing > -1) {
      setLineSpacing(prevSpacing => prevSpacing - 1);
    }
  };

  // איפוס הגדרות הנגישות
  const resetSettings = () => {
    setFontSize(0);
    setLineSpacing(0);
    setHighContrast(false);
    setInvertColors(false);
    setMonochrome(false);
    setDyslexiaFont(false);
    setBigCursor(false);
    setHighlightLinks(false);
    setHighlightFocus(false);
    setKeyboardNavigation(false);
    
    // הסרת כל הסגנונות מ-body
    document.body.classList.remove(
      'accessibility-high-contrast',
      'accessibility-invert-colors',
      'accessibility-monochrome',
      'accessibility-dyslexia-font',
      'accessibility-big-cursor',
      'accessibility-highlight-links',
      'accessibility-highlight-focus',
      'accessibility-keyboard-navigation'
    );
    
    // איפוס משתני CSS
    document.documentElement.style.setProperty('--accessibility-font-size', '100%');
    document.documentElement.style.setProperty('--accessibility-line-spacing', '1.5');
  };

  // עדכון גודל פונט
  useEffect(() => {
    const newSize = 100 + (fontSize * 10); // כל צעד משנה ב-10%
    document.documentElement.style.setProperty('--accessibility-font-size', `${newSize}%`);
  }, [fontSize]);

  // עדכון רווח בין שורות
  useEffect(() => {
    const newSpacing = 1.5 + (lineSpacing * 0.5); // כל צעד משנה ב-0.5
    document.documentElement.style.setProperty('--accessibility-line-spacing', `${newSpacing}`);
  }, [lineSpacing]);

  // עדכון ניגודיות גבוהה
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('accessibility-high-contrast');
    } else {
      document.body.classList.remove('accessibility-high-contrast');
    }
  }, [highContrast]);

  // עדכון היפוך צבעים
  useEffect(() => {
    if (invertColors) {
      document.body.classList.add('accessibility-invert-colors');
    } else {
      document.body.classList.remove('accessibility-invert-colors');
    }
  }, [invertColors]);

  // עדכון מצב מונוכרום
  useEffect(() => {
    if (monochrome) {
      document.body.classList.add('accessibility-monochrome');
    } else {
      document.body.classList.remove('accessibility-monochrome');
    }
  }, [monochrome]);

  // עדכון פונט דיסלקציה
  useEffect(() => {
    if (dyslexiaFont) {
      document.body.classList.add('accessibility-dyslexia-font');
    } else {
      document.body.classList.remove('accessibility-dyslexia-font');
    }
  }, [dyslexiaFont]);

  // עדכון סמן גדול
  useEffect(() => {
    if (bigCursor) {
      document.body.classList.add('accessibility-big-cursor');
    } else {
      document.body.classList.remove('accessibility-big-cursor');
    }
  }, [bigCursor]);

  // עדכון הדגשת קישורים
  useEffect(() => {
    if (highlightLinks) {
      document.body.classList.add('accessibility-highlight-links');
    } else {
      document.body.classList.remove('accessibility-highlight-links');
    }
  }, [highlightLinks]);

  // עדכון הדגשת פוקוס
  useEffect(() => {
    if (highlightFocus) {
      document.body.classList.add('accessibility-highlight-focus');
    } else {
      document.body.classList.remove('accessibility-highlight-focus');
    }
  }, [highlightFocus]);

  // עדכון ניווט מקלדת
  useEffect(() => {
    if (keyboardNavigation) {
      document.body.classList.add('accessibility-keyboard-navigation');
    } else {
      document.body.classList.remove('accessibility-keyboard-navigation');
    }
  }, [keyboardNavigation]);

  // שמירת הגדרות בלוקל סטורג'
  useEffect(() => {
    const accessibilitySettings = {
      fontSize,
      lineSpacing,
      highContrast,
      invertColors,
      monochrome,
      dyslexiaFont,
      bigCursor,
      highlightLinks,
      highlightFocus,
      keyboardNavigation
    };
    
    localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
  }, [
    fontSize, 
    lineSpacing, 
    highContrast, 
    invertColors, 
    monochrome, 
    dyslexiaFont, 
    bigCursor, 
    highlightLinks, 
    highlightFocus, 
    keyboardNavigation
  ]);

  // טעינת הגדרות מלוקל סטורג'
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setFontSize(settings.fontSize || 0);
      setLineSpacing(settings.lineSpacing || 0);
      setHighContrast(settings.highContrast || false);
      setInvertColors(settings.invertColors || false);
      setMonochrome(settings.monochrome || false);
      setDyslexiaFont(settings.dyslexiaFont || false);
      setBigCursor(settings.bigCursor || false);
      setHighlightLinks(settings.highlightLinks || false);
      setHighlightFocus(settings.highlightFocus || false);
      setKeyboardNavigation(settings.keyboardNavigation || false);
    }
  }, []);

  // שמירת נגישות מקלדת - האזנה ללחיצות מקשים
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (keyboardNavigation && e.altKey) {
        // Alt + a פותח את תפריט הנגישות
        if (e.key === 'a' || e.key === 'א') {
          toggleDrawer();
          e.preventDefault();
        }
        
        // Alt + r מאפס את ההגדרות
        if (e.key === 'r' || e.key === 'ר') {
          resetSettings();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyboardNavigation]);

  // Check if the current path starts with /dashboard
  if (location.pathname.startsWith('/dashboard')) {
    return null; // Don't render the widget on dashboard pages
  }

  return (
    <>
      {/* כפתור פתיחת תפריט הנגישות */}
      <Tooltip title="אפשרויות נגישות" placement="left">
        <IconButton
          aria-label="אפשרויות נגישות"
          onClick={toggleDrawer}
          sx={{
            position: 'fixed',
            left: 16,
            bottom: 16,
            zIndex: theme.zIndex.drawer + 2,
            bgcolor: theme.palette.primary.main,
            color: 'white',
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            width: 56,
            height: 56,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            '&:focus': {
              outline: '2px solid #fff',
              outlineOffset: 2
            }
          }}
        >
          <AccessibilityIcon fontSize="large" />
        </IconButton>
      </Tooltip>

      {/* תפריט נגישות */}
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '85%', sm: 360 },
            maxWidth: '90vw',
            p: 0,
            direction: 'rtl'
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            bgcolor: theme.palette.primary.main,
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessibilityIcon sx={{ mr: 1 }} />
            <Typography variant="h6">הגדרות נגישות</Typography>
          </Box>
          <IconButton
            aria-label="סגור את תפריט הנגישות"
            onClick={toggleDrawer}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            בהתאם לתקן ישראלי (ת"י 5568), האתר מציע התאמות נגישות שונות לשיפור חווית המשתמש.
          </Typography>

          <List sx={{ mb: 3 }}>
            {/* גודל טקסט */}
            <ListItem>
              <ListItemIcon>
                <FontSizeIcon />
              </ListItemIcon>
              <ListItemText primary="גודל טקסט" />
            </ListItem>
            <ListItem>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <IconButton onClick={decreaseFontSize} disabled={fontSize <= -3} aria-label="הקטן גודל טקסט">
                  <TextDecreaseIcon />
                </IconButton>
                <Box sx={{ flex: 1, mx: 2 }}>
                  <Slider
                    value={fontSize}
                    step={1}
                    marks
                    min={-3}
                    max={5}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${100 + (value * 10)}%`}
                    onChange={(e, value) => setFontSize(value)}
                    aria-label="גודל טקסט"
                  />
                </Box>
                <IconButton onClick={increaseFontSize} disabled={fontSize >= 5} aria-label="הגדל גודל טקסט">
                  <TextIncreaseIcon />
                </IconButton>
              </Box>
            </ListItem>

            {/* רווח בין שורות */}
            <ListItem>
              <ListItemIcon>
                <LineSpacingIcon />
              </ListItemIcon>
              <ListItemText primary="מרווח בין שורות" />
            </ListItem>
            <ListItem>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <IconButton onClick={decreaseLineSpacing} disabled={lineSpacing <= -1} aria-label="הקטן מרווח בין שורות">
                  <LineSpacingIcon style={{ transform: 'rotate(180deg)' }} />
                </IconButton>
                <Box sx={{ flex: 1, mx: 2 }}>
                  <Slider
                    value={lineSpacing}
                    step={1}
                    marks
                    min={-1}
                    max={3}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${100 + (value * 25)}%`}
                    onChange={(e, value) => setLineSpacing(value)}
                    aria-label="מרווח בין שורות"
                  />
                </Box>
                <IconButton onClick={increaseLineSpacing} disabled={lineSpacing >= 3} aria-label="הגדל מרווח בין שורות">
                  <LineSpacingIcon />
                </IconButton>
              </Box>
            </ListItem>

            <Divider sx={{ my: 2 }} />

            {/* ניגודיות גבוהה */}
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    name="highContrast"
                    color="primary"
                    inputProps={{ 'aria-label': 'הפעל ניגודיות גבוהה' }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ContrastIcon sx={{ mr: 1 }} />
                    <Typography>ניגודיות גבוהה</Typography>
                  </Box>
                }
                labelPlacement="end"
                sx={{ ml: 0, width: '100%', justifyContent: 'space-between' }}
              />
            </ListItem>

            {/* היפוך צבעים */}
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={invertColors}
                    onChange={(e) => setInvertColors(e.target.checked)}
                    name="invertColors"
                    color="primary"
                    inputProps={{ 'aria-label': 'הפעל היפוך צבעים' }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InvertColorsIcon sx={{ mr: 1 }} />
                    <Typography>היפוך צבעים</Typography>
                  </Box>
                }
                labelPlacement="end"
                sx={{ ml: 0, width: '100%', justifyContent: 'space-between' }}
              />
            </ListItem>

            {/* מונוכרום */}
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={monochrome}
                    onChange={(e) => setMonochrome(e.target.checked)}
                    name="monochrome"
                    color="primary"
                    inputProps={{ 'aria-label': 'הפעל מצב מונוכרום' }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BrightnessIcon sx={{ mr: 1 }} />
                    <Typography>גווני אפור (מונוכרום)</Typography>
                  </Box>
                }
                labelPlacement="end"
                sx={{ ml: 0, width: '100%', justifyContent: 'space-between' }}
              />
            </ListItem>

            {/* פונט דיסלקציה */}
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={dyslexiaFont}
                    onChange={(e) => setDyslexiaFont(e.target.checked)}
                    name="dyslexiaFont"
                    color="primary"
                    inputProps={{ 'aria-label': 'הפעל פונט ידידותי לדיסלקציה' }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DyslexiaIcon sx={{ mr: 1 }} />
                    <Typography>פונט מותאם דיסלקציה</Typography>
                  </Box>
                }
                labelPlacement="end"
                sx={{ ml: 0, width: '100%', justifyContent: 'space-between' }}
              />
            </ListItem>

            <Divider sx={{ my: 2 }} />

            {/* סמן גדול */}
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={bigCursor}
                    onChange={(e) => setBigCursor(e.target.checked)}
                    name="bigCursor"
                    color="primary"
                    inputProps={{ 'aria-label': 'הפעל סמן גדול' }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CursorIcon sx={{ mr: 1 }} />
                    <Typography>סמן גדול</Typography>
                  </Box>
                }
                labelPlacement="end"
                sx={{ ml: 0, width: '100%', justifyContent: 'space-between' }}
              />
            </ListItem>

            {/* הדגשת קישורים */}
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={highlightLinks}
                    onChange={(e) => setHighlightLinks(e.target.checked)}
                    name="highlightLinks"
                    color="primary"
                    inputProps={{ 'aria-label': 'הפעל הדגשת קישורים' }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SubtitlesIcon sx={{ mr: 1 }} />
                    <Typography>הדגשת קישורים</Typography>
                  </Box>
                }
                labelPlacement="end"
                sx={{ ml: 0, width: '100%', justifyContent: 'space-between' }}
              />
            </ListItem>

            {/* הדגשת פוקוס */}
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={highlightFocus}
                    onChange={(e) => setHighlightFocus(e.target.checked)}
                    name="highlightFocus"
                    color="primary"
                    inputProps={{ 'aria-label': 'הפעל הדגשת פוקוס' }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FocusIcon sx={{ mr: 1 }} />
                    <Typography>הדגשת פוקוס</Typography>
                  </Box>
                }
                labelPlacement="end"
                sx={{ ml: 0, width: '100%', justifyContent: 'space-between' }}
              />
            </ListItem>

            {/* ניווט מקלדת */}
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={keyboardNavigation}
                    onChange={(e) => setKeyboardNavigation(e.target.checked)}
                    name="keyboardNavigation"
                    color="primary"
                    inputProps={{ 'aria-label': 'הפעל ניווט מקלדת' }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <KeyboardIcon sx={{ mr: 1 }} />
                    <Typography>ניווט מקלדת</Typography>
                  </Box>
                }
                labelPlacement="end"
                sx={{ ml: 0, width: '100%', justifyContent: 'space-between' }}
              />
            </ListItem>
          </List>

          {/* כפתור איפוס */}
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={resetSettings}
            sx={{ mb: 2 }}
            aria-label="איפוס הגדרות נגישות"
          >
            איפוס הגדרות
          </Button>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', color: alpha(theme.palette.text.primary, 0.7) }}>
              האתר נגיש בהתאם לתקן הישראלי (ת"י 5568) לנגישות אתרי אינטרנט
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default AccessibilityWidget; 