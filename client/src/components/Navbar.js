import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { Hotel as HotelIcon } from '@mui/icons-material';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  React.useEffect(() => {
    // טיפול בשגיאות ResizeObserver
    const originalError = window.console.error;
    window.console.error = (...args) => {
      if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
        return;
      }
      originalError(...args);
    };

    // חסימת שגיאות ResizeObserver במודל האירועים
    const handler = (event) => {
      if (event.message && event.message.includes('ResizeObserver')) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handler, true);
    
    const removeGuestBadges = () => {
      const logo = document.querySelector('.MuiToolbar-root a[href="/"]');
      if (logo) {
        const badges = logo.querySelectorAll('span[class*="badge"], span[class*="Badge"], div[class*="badge"], div[class*="Badge"]');
        badges.forEach(badge => {
          badge.style.display = 'none';
        });
      }
    };
    
    removeGuestBadges();
    const interval = setInterval(removeGuestBadges, 1000);
    
    return () => {
      clearInterval(interval);
      window.console.error = originalError;
      window.removeEventListener('error', handler, true);
    };
  }, []);

  return (
    <AppBar position="static" color="primary" elevation={3} sx={{ 
      backgroundColor: '#1565C0',
      boxShadow: '0px 2px 10px rgba(0,0,0,0.2)'
    }}>
      <Toolbar sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        padding: { xs: '0 16px', md: '0 24px' }
      }}>
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
              textShadow: '1px 1px 4px rgba(0,0,0,0.3)'
            },
            '& > *:not(:first-child):not(:nth-child(2))': {
              display: 'none !important'
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-end',
            marginLeft: 'auto'
          }}>
            <Box sx={{ 
              fontSize: { xs: '0.65rem', md: '0.75rem' }, 
              fontWeight: 'normal',
              letterSpacing: '0.5px',
              opacity: 0.9,
              mb: -0.8,
              mr: '2px'
            }}>
              מלונית
            </Box>
            <Box sx={{ 
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}>
              רוטשילד 79
            </Box>
          </Box>
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center'
        }}>
          <HotelIcon sx={{ 
            mr: 1,
            fontSize: { xs: '1.4rem', md: '1.7rem' },
            color: 'white'
          }} />
          <Box sx={{ 
            fontSize: { xs: '0.65rem', md: '0.75rem' }, 
            fontWeight: 'normal', 
            letterSpacing: '0.5px',
            opacity: 0.9,
            color: 'white',
            textAlign: 'center'
          }}>
            Rothschild 79 Hotel
          </Box>
        </Box>
        
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 