import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { Hotel as HotelIcon } from '@mui/icons-material';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  React.useEffect(() => {
    const removeGuestBadges = () => {
      const logo = document.querySelector('.MuiToolbar-root a[href="/"]');
      if (logo) {
        const badges = logo.querySelectorAll('span[class*="badge"], span[class*="Badge"], div[class*="badge"], div[class*="Badge"], span:not(:first-child), div:not(:first-child)');
        badges.forEach(badge => {
          badge.style.display = 'none';
        });
      }
      
      const appBar = document.querySelector('.MuiAppBar-root');
      if (appBar) {
        const allBadges = appBar.querySelectorAll('[class*="MuiBadge-badge"], [class*="badge-count"], .MuiBadge-root, .MuiBadge-badge, [class*="badge"]');
        allBadges.forEach(badge => {
          badge.style.display = 'none';
          badge.style.opacity = '0';
          badge.style.visibility = 'hidden';
        });
      }
      
      const icons = document.querySelectorAll('.MuiToolbar-root .MuiSvgIcon-root');
      icons.forEach(icon => {
        const nextSibling = icon.nextElementSibling;
        if (nextSibling && nextSibling.tagName.toLowerCase() === 'span') {
          nextSibling.style.display = 'none';
        }
      });
    };
    
    removeGuestBadges();
    const interval = setInterval(removeGuestBadges, 1000);
    
    const handleMouseEvents = () => {
      setTimeout(removeGuestBadges, 50);
      setTimeout(removeGuestBadges, 100);
      setTimeout(removeGuestBadges, 300);
    };
    
    document.addEventListener('mouseover', handleMouseEvents);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mouseover', handleMouseEvents);
    };
  }, []);

  return (
    <AppBar position="static" color="primary" elevation={3} sx={{ 
      backgroundColor: '#1565C0',
      boxShadow: '0px 2px 10px rgba(0,0,0,0.2)'
    }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Typography 
          variant="h6" 
          component={Link} 
          to="/" 
          sx={{ 
            color: 'white', 
            textDecoration: 'none', 
            fontWeight: 'bold',
            fontSize: { xs: '1.1rem', md: '1.3rem' },
            letterSpacing: '0.8px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.3s ease',
            fontFamily: "'Heebo', 'Roboto', sans-serif",
            '&:hover': {
              transform: 'scale(1.02)',
              textShadow: '1px 1px 4px rgba(0,0,0,0.3)'
            },
            '& > *:not(:first-child):not(:nth-child(2))': {
              display: 'none !important'
            }
          }}
        >
          <HotelIcon sx={{ 
            mr: 1.5,
            fontSize: { xs: '1.4rem', md: '1.7rem' }
          }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Box sx={{ fontSize: { xs: '1.1rem', md: '1.3rem' } }}>מלונית רוטשילד 79</Box>
            <Box sx={{ 
              fontSize: { xs: '0.7rem', md: '0.8rem' }, 
              fontWeight: 'normal', 
              letterSpacing: '1px',
              opacity: 0.9,
              mt: -0.3
            }}>
              Rothschild 79 Hotel
            </Box>
          </Box>
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 