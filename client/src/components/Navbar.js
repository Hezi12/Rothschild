import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';

const Navbar = () => {
  const location = useLocation();
  const isAuthenticated = true; // Replace with actual authentication check

  // בדיקה האם הקישור פעיל
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 0, color: 'white', textDecoration: 'none', mr: 2 }}>
          מלונית רוטשילד 79
        </Typography>
        
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1 }}>
          <Button 
            component={Link} 
            to="/" 
            color="inherit"
            sx={{ 
              mx: 1,
              color: isActiveLink('/') ? 'secondary.main' : 'white'
            }}
          >
            דף הבית
          </Button>
          
          {isAuthenticated && (
            <Button 
              component={Link} 
              to="/dashboard" 
              color="inherit"
              sx={{ 
                mx: 1,
                color: location.pathname.startsWith('/dashboard') ? 'secondary.main' : 'white'
              }}
            >
              ניהול
            </Button>
          )}
        </Box>
        
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 