import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { format, getDay, isSameDay } from 'date-fns';
import { hebrewDays } from '../utils/dateUtils';

const CalendarHeader = ({ days }) => {
  const theme = useTheme();

  return (
    <>
      {/* כותרת ראשית - שורת הניווט */}
      <Box sx={{ 
        height: '50px', 
        fontWeight: 'bold', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(theme.palette.primary.light, 0.1),
        borderRadius: '8px',
        p: 1,
        fontSize: '0.85rem'
      }}>
        חדר
      </Box>
      
      {/* כותרות תאריכים */}
      {days.map((day, idx) => {
        const isToday = isSameDay(day, new Date());
        
        return (
          <Box 
            key={`header-${idx}`}
            sx={{ 
              height: '50px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isToday ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.light, 0.05),
              borderRadius: '8px',
              p: 0.5
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 'medium',
                fontSize: '0.75rem'
              }}
            >
              {hebrewDays[getDay(day)]}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: isToday ? 'bold' : 'medium',
                fontSize: '0.85rem',
                color: isToday ? theme.palette.primary.main : 'inherit'
              }}
            >
              {format(day, 'dd/MM')}
            </Typography>
          </Box>
        );
      })}
    </>
  );
};

export default CalendarHeader; 