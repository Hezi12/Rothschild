import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { Hotel as HotelIcon } from '@mui/icons-material';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="static" color="primary" elevation={3} sx={{ 
      backgroundColor: '#1565C0',
      boxShadow: '0px 2px 10px rgba(0,0,0,0.2)'
    }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {/* לוגו בצד ימין */}
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