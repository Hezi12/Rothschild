import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, styled } from '@mui/material';
import SidebarButton from './SidebarButton';

// קומפוננטת סרגל צדדי
const SidebarWrapper = styled(Box)(({ theme }) => ({
  position: 'fixed',
  left: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
  padding: '15px 0',
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  borderRadius: '0 16px 16px 0',
  zIndex: 1000,
  gap: '10px',
  width: '70px'
}));

const MinimalSidebar = ({ children }) => {
  const location = useLocation();
  
  // לוג למסוף עבור הסרגל הצדדי
  React.useEffect(() => {
    const currentPath = location.pathname;
    console.log(`=== סרגל צדדי בדף BookingsManager ===`);
    console.log(`נתיב נוכחי: ${currentPath}`);
    console.log(`האם סרגל צדדי אמור להיות מוצג: כן`);
  }, [location.pathname]);
  
  return (
    <SidebarWrapper>
      {children}
    </SidebarWrapper>
  );
};

export default MinimalSidebar; 