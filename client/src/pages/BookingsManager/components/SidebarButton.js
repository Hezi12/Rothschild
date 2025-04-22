import React from 'react';
import { Tooltip, useTheme, alpha } from '@mui/material';

// קומפוננטת כפתור בסרגל
const SidebarButton = ({ children, title, placement, isActive }) => {
  const theme = useTheme();
  
  return (
    <Tooltip title={title} placement={placement || "right"}>
      {React.cloneElement(children, {
        sx: {
          padding: '12px',
          borderRadius: '50%',
          color: isActive ? theme.palette.primary.main : 'inherit',
          backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease',
          boxShadow: isActive ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}` : 'none',
          ...children.props.sx
        }
      })}
    </Tooltip>
  );
};

export default SidebarButton; 