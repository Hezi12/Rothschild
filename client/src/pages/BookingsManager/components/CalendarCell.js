import React from 'react';
import { Box, styled, alpha, useTheme } from '@mui/material';

// קומפוננטת תא בלוח
const CellWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '90px',
  height: '100%',
  width: '100%',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  padding: '0.8px',
  transition: 'all 0.25s ease',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  flex: '1 1 0',
  boxSizing: 'border-box',
  margin: 0,
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  overflow: 'hidden'
}));

// קומפוננטת תא בלוח
const CalendarCell = ({ children, onClick, isBooked, isToday, isPast, ...props }) => {
  const theme = useTheme();
  
  // חישוב סגנון בהתאם למאפיינים
  const getCellStyle = () => {
    let cellStyle = {};
    
    if (isToday) {
      cellStyle.border = `1px solid ${theme.palette.primary.main}`;
      cellStyle.boxShadow = `0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}`;
    }
    
    if (isPast) {
      cellStyle.backgroundColor = alpha(theme.palette.action.disabled, 0.05);
    }
    
    if (isBooked) {
      cellStyle.backgroundColor = alpha(theme.palette.primary.light, 0.1);
    }
    
    return cellStyle;
  };
  
  return (
    <CellWrapper 
      onClick={onClick} 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          backgroundColor: alpha(theme.palette.primary.light, 0.05),
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
        } : {},
        ...getCellStyle(),
        ...props.sx
      }}
    >
      {children}
    </CellWrapper>
  );
};

export default CalendarCell; 