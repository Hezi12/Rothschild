import React from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Alert,
  useTheme
} from '@mui/material';
import { 
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  Computer as ComputerIcon,
  Storage as StorageIcon,
  Layers as LayersIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const InstallationGuidePage = () => {
  const theme = useTheme();
  
  // סגנון לבלוקים של קוד
  const codeBlockStyle = {
    fontFamily: 'monospace',
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    padding: '16px',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '0.9rem',
    whiteSpace: 'pre',
    my: 2
  };
  
  // סגנון לכותרת מקטע
  const sectionTitleStyle = {
    fontWeight: 'bold',
    mt: 4, 
    mb: 2,
    color: theme.palette.primary.main,
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      mr: 1
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mb: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
          מדריך התקנה והפעלה - מלונית רוטשילד 79
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          מסמך זה מיועד למפתחים ומנהלי המערכת בלבד. הוא מכיל הוראות להתקנה והפעלה של האפליקציה בסביבת פיתוח מקומית.
        </Alert>
        
        <Typography variant="h5" component="h2" sx={{...sectionTitleStyle}}>
          <ComputerIcon /> דרישות מערכת
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
            <ListItemText primary="Node.js גרסה 14 ומעלה" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
            <ListItemText primary="NPM גרסה 6 ומעלה" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
            <ListItemText primary="גישה לאינטרנט (עבור התקנת חבילות וגישה למסד הנתונים)" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
            <ListItemText primary="דפדפן מודרני (Chrome, Firefox, Edge, Safari)" />
          </ListItem>
        </List>
        
        <Typography variant="h5" component="h2" sx={{...sectionTitleStyle}}>
          <LayersIcon /> התקנת תלויות
        </Typography>
        
        <Typography variant="body1" paragraph>
          בפעם הראשונה, יש להתקין את כל התלויות של הפרויקט באמצעות הפקודה הבאה בתיקייה הראשית:
        </Typography>
        
        <Box sx={codeBlockStyle}>
          npm run install-all
        </Box>
        
        <Typography variant="body2" paragraph>
          פקודה זו תתקין את כל התלויות הנדרשות עבור השרת והלקוח.
        </Typography>
        
        <Typography variant="h5" component="h2" sx={{...sectionTitleStyle}}>
          <SettingsIcon /> הגדרות סביבה
        </Typography>
        
        <Typography variant="body1" paragraph>
          יש לוודא שקבצי ה-.env מוגדרים כראוי:
        </Typography>
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
          קובץ server/.env
        </Typography>
        
        <Box sx={codeBlockStyle}>
{`MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
PORT=5500
# הגדרות נוספות...`}
        </Box>
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
          קובץ client/.env
        </Typography>
        
        <Box sx={codeBlockStyle}>
{`REACT_APP_API_URL=http://localhost:5500/api`}
        </Box>
        
        <Alert severity="warning" sx={{ my: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>חשוב מאוד!</Typography>
          יש לוודא שהפורט המוגדר בקובץ ה-.env של השרת מתאים לפורט המצוין בכתובת ה-API בקובץ ה-.env של הלקוח.
        </Alert>
        
        <Typography variant="h5" component="h2" sx={{...sectionTitleStyle}}>
          <StorageIcon /> הפעלת האפליקציה
        </Typography>
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
          אפשרות 1: הפעלת השרת והלקוח יחד (מומלץ)
        </Typography>
        
        <Box sx={codeBlockStyle}>
          npm run dev
        </Box>
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 3 }}>
          אפשרות 2: הפעלה נפרדת
        </Typography>
        
        <Typography variant="body1" paragraph>
          הפעלת השרת:
        </Typography>
        
        <Box sx={codeBlockStyle}>
{`cd server
npm run dev`}
        </Box>
        
        <Typography variant="body1" paragraph>
          הפעלת הלקוח:
        </Typography>
        
        <Box sx={codeBlockStyle}>
{`cd client
npm start`}
        </Box>
        
        <Typography variant="h5" component="h2" sx={{...sectionTitleStyle}}>
          <InfoIcon /> גישה לאפליקציה
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon><ComputerIcon color="primary" /></ListItemIcon>
            <ListItemText 
              primary="ממשק משתמש (לקוח)" 
              secondary="http://localhost:3000" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><StorageIcon color="primary" /></ListItemIcon>
            <ListItemText 
              primary="שרת ה-API" 
              secondary="http://localhost:5500" 
            />
          </ListItem>
        </List>
        
        <Typography variant="h5" component="h2" sx={{...sectionTitleStyle}}>
          <ErrorIcon /> פתרון בעיות נפוצות
        </Typography>
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
          בעיה: "port already in use" (הפורט כבר בשימוש)
        </Typography>
        
        <Typography variant="body1" paragraph>
          סגירת כל תהליכי Node.js:
        </Typography>
        
        <Box sx={codeBlockStyle}>
          killall node
        </Box>
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 3 }}>
          בעיה: בעיות חיבור לקוח-שרת
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="ודא שהשרת פועל ומאזין בפורט הנכון." />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="ודא שהגדרת ה-REACT_APP_API_URL בלקוח מצביעה לפורט הנכון של השרת." />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="בדוק את מסוף הדפדפן (DevTools > Console) לשגיאות." />
          </ListItem>
        </List>
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 3 }}>
          בעיה: שינויים בקוד לא משתקפים
        </Typography>
        
        <Typography variant="body1" paragraph>
          אם ערכת קובץ הגדרות (.env):
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="הפעל מחדש את האפליקציה לגמרי (השרת והלקוח)." />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="נקה את ה-cache של הדפדפן ובצע רענון." />
          </ListItem>
        </List>
        
        <Typography variant="h5" component="h2" sx={{...sectionTitleStyle}}>
          <CodeIcon /> פקודות שימושיות
        </Typography>
        
        <Box sx={codeBlockStyle}>
{`# בדיקת גרסת Node.js
node -v

# בדיקת גרסת NPM
npm -v

# יצירת גרסת בילד
npm run build

# בדיקת תהליכי Node.js הרצים במערכת
ps aux | grep node

# בדיקת הפורט עליו מאזין השרת
lsof -i :5500`}
        </Box>
        
      </Paper>
    </Container>
  );
};

export default InstallationGuidePage; 