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
        const badges = logo.querySelectorAll('span[class*="badge"], span[class*="Badge"], div[class*="badge"], div[class*="Badge"]');
        badges.forEach(badge => {
          badge.style.display = 'none';
        });
      }

      const selectors = [
        'div[id^="comp-"] a[href="/"] > div > div[data-testid]',
        'div[data-testid="linkElement"] span[data-testid="linkTitle"] + div',
        'div[data-testid="screenWidthBackground"] span[data-testid*="badge"]',
        'header span[class*="badge"]',
        'header div[class*="badge"]',
        'header *[class*="badge"]',
        'header *[data-testid*="badge"]',
        'div[id^="comp-"] > div > a[href="/"] > div:last-child',
        'div[id^="comp-"] > div > div > a > span + div',
        'header > div[data-testid*="container"] span + div[class*="number"]'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.style.display = 'none';
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
        });
      });
      
      const wixBadges = document.querySelectorAll('[data-testid*="badge"], [class*="badge"], [class*="Badge"]');
      wixBadges.forEach(badge => {
        if (badge.closest('header') || badge.closest('a[href="/"]') || badge.closest('div[id^="comp-"]')) {
          badge.style.display = 'none';
        }
      });
    };
    
    removeGuestBadges();
    const interval = setInterval(removeGuestBadges, 1000);
    
    return () => clearInterval(interval);
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