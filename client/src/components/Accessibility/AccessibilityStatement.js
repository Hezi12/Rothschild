import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Divider,
  Link,
  Button,
  useTheme
} from '@mui/material';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';

const AccessibilityStatement = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AccessibilityNewIcon 
            fontSize="large" 
            color="primary" 
            sx={{ mr: 2 }} 
          />
          <Typography variant="h4" component="h1" fontWeight="bold">
            הצהרת נגישות
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="body1" paragraph>
          אתר מלונית רוטשילד 79 מונגש לאנשים עם מוגבלויות על פי חוק שוויון זכויות לאנשים עם מוגבלות ותקנות שהותקנו מכוחו,
          ובהתאם לתקן הישראלי ת"י 5568 לנגישות תכנים באינטרנט ברמת AA.
        </Typography>

        <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
          אמצעי הנגישות באתר
        </Typography>
        
        <Typography variant="body1" paragraph>
          האתר מספק מגוון אמצעי נגישות, ביניהם:
        </Typography>

        <Box component="ul" sx={{ pl: 3 }}>
          <Box component="li">
            <Typography variant="body1">
              התאמת גודל טקסט והגדלת רווח בין שורות להקלה על הקריאה
            </Typography>
          </Box>
          <Box component="li">
            <Typography variant="body1">
              שינוי ניגודיות והיפוך צבעים לשיפור חוויה חזותית
            </Typography>
          </Box>
          <Box component="li">
            <Typography variant="body1">
              פונט מותאם לאנשים עם דיסלקציה
            </Typography>
          </Box>
          <Box component="li">
            <Typography variant="body1">
              תמיכה בניווט מלא באמצעות מקלדת
            </Typography>
          </Box>
          <Box component="li">
            <Typography variant="body1">
              הדגשת קישורים ואזורי מיקוד למשתמשי מקלדת
            </Typography>
          </Box>
          <Box component="li">
            <Typography variant="body1">
              סמן גדול לשיפור הניווט עבור משתמשים עם קשיי מוטוריקה
            </Typography>
          </Box>
          <Box component="li">
            <Typography variant="body1">
              תיאורי תמונות (alt text) עבור משתמשי קוראי מסך
            </Typography>
          </Box>
        </Box>

        <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
          כיצד להשתמש באמצעי הנגישות
        </Typography>
        
        <Typography variant="body1" paragraph>
          לפתיחת תפריט הנגישות, יש ללחוץ על כפתור הנגישות בפינה השמאלית התחתונה של המסך.
          בתפריט זה ניתן להתאים את תצוגת האתר לפי הצרכים האישיים שלכם.
        </Typography>

        <Typography variant="body1" paragraph>
          ניתן גם להשתמש בקיצורי המקלדת הבאים (לאחר הפעלת אפשרות ניווט מקלדת):
        </Typography>

        <Box 
          sx={{ 
            backgroundColor: theme.palette.grey[100], 
            p: 2, 
            borderRadius: 1,
            my: 2
          }}
        >
          <Typography variant="body2">
            <strong>Alt + א</strong> - פתיחת תפריט הנגישות
          </Typography>
          <Typography variant="body2">
            <strong>Alt + ר</strong> - איפוס הגדרות הנגישות
          </Typography>
        </Box>

        <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
          התאמות נגישות נוספות
        </Typography>
        
        <Typography variant="body1" paragraph>
          אנו עובדים באופן שוטף לשיפור הנגישות באתר. אם נתקלתם בבעיה או שאתם זקוקים להתאמות נוספות, אנא צרו קשר עמנו בטלפון 
          <Box component="span" sx={{ direction: 'ltr', display: 'inline-block', mx: 1 }}>
            050-607-0260
          </Box>
          או במייל
          <Box component="span" sx={{ direction: 'ltr', display: 'inline-block', mx: 1 }}>
            rothschild79pt@gmail.com
          </Box>
        </Typography>

        <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
          רכז נגישות
        </Typography>
        
        <Typography variant="body1" paragraph>
          רכז הנגישות מטעם האתר הוא מר ישראל ישראלי, שפרטי ההתקשרות עמו:
        </Typography>
        
        <Box sx={{ pl: 3 }}>
          <Typography variant="body1">
            טלפון: 
            <Box component="span" sx={{ direction: 'ltr', display: 'inline-block', mx: 1 }}>
              050-607-0260
            </Box>
          </Typography>
          <Typography variant="body1">
            דוא"ל: 
            <Box component="span" sx={{ direction: 'ltr', display: 'inline-block', mx: 1 }}>
              rothschild79pt@gmail.com
            </Box>
          </Typography>
        </Box>

        <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
          עדכון אחרון של הצהרת הנגישות
        </Typography>
        
        <Typography variant="body1" paragraph>
          הצהרת הנגישות עודכנה לאחרונה בתאריך {new Date().toLocaleDateString('he-IL')}.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            href="/"
            sx={{ minWidth: 150 }}
          >
            חזרה לדף הבית
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AccessibilityStatement; 