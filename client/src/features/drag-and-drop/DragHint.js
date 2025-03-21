import React from 'react';
import { Paper, Typography, alpha, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// רכיב שמציג הודעה על יכולת גרירת הזמנות
const DragHint = ({ visible = false }) => {
  const theme = useTheme();
  
  if (!visible) return null;
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 1.5, 
        mb: 2, 
        mt: 1,
        bgcolor: alpha(theme.palette.info.light, 0.7), 
        color: theme.palette.info.dark,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
        backdropFilter: 'blur(4px)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DragIndicatorIcon sx={{ color: theme.palette.info.main }} />
        <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'center' }}>
          חדש! ניתן לגרור הזמנות בין חדרים ותאריכים. לחץ והחזק על הזמנה קיימת וגרור אותה למיקום הרצוי.
        </Typography>
      </Box>
    </Paper>
  );
};

export default DragHint; 