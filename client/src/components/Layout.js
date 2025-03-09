import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Menu as MenuIcon,
  AccountCircle,
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon,
  Hotel as HotelIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
  const { isAuthenticated, isAdmin, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileAnchorEl, setMobileAnchorEl] = React.useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event) => {
    setMobileAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileClose = () => {
    setMobileAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <AppBar position="static" sx={{
        backgroundColor: 'transparent',
        backgroundImage: 'linear-gradient(90deg, #0c2461 0%, #1e3799 100%)',
        boxShadow: '0px 2px 15px rgba(0,0,0,0.15)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Toolbar sx={{ 
          padding: isMobile ? '0.5rem 1rem' : '0.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* כפתור התחברות בצד שמאל */}
          <Box>
            {isAuthenticated() ? (
              <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                size={isMobile ? "small" : "medium"}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <AccountCircle />
              </IconButton>
            ) : (
              <Button 
                color="inherit" 
                component={Link} 
                to="/login" 
                size={isMobile ? "small" : "medium"}
                sx={{
                  borderRadius: '50px',
                  px: 2,
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                התחברות
              </Button>
            )}
          </Box>

          {/* לוגו בצד ימין */}
          <Box 
            component={Link}
            to="/"
            sx={{ 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'white',
                color: '#1e3799',
                width: isMobile ? 35 : 42,
                height: isMobile ? 35 : 42,
                borderRadius: '50%',
                mr: 1.5,
                boxShadow: '0px 3px 10px rgba(0,0,0,0.2)'
              }}
            >
              <HotelIcon sx={{ fontSize: isMobile ? '1.3rem' : '1.6rem' }} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography
                variant="h6"
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  letterSpacing: '0.8px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                  lineHeight: 1.1
                }}
              >
                מלונית רוטשילד 79
              </Typography>
              <Typography 
                variant="body2"
                sx={{ 
                  fontSize: { xs: '0.65rem', md: '0.75rem' }, 
                  color: 'rgba(255,255,255,0.8)',
                  letterSpacing: '1px',
                  fontWeight: 300
                }}
              >
                Rothschild 79 Hotel
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* תפריט משתמש */}
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: '100vh',
            width: isMobile ? '200px' : '250px'
          },
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem disabled>
          {user?.name || 'משתמש'}
        </MenuItem>
        <Divider />
        {isAdmin() && (
          <MenuItem component={Link} to="/dashboard" onClick={handleClose}>
            <DashboardIcon fontSize="small" sx={{ ml: 1 }} />
            ניהול
          </MenuItem>
        )}
        <MenuItem onClick={handleLogout}>
          <LogoutIcon fontSize="small" sx={{ ml: 1 }} />
          התנתק
        </MenuItem>
      </Menu>
      
      {/* תפריט נייד */}
      <Menu
        id="menu-mobile"
        anchorEl={mobileAnchorEl}
        keepMounted
        open={Boolean(mobileAnchorEl)}
        onClose={handleMobileClose}
        PaperProps={{
          style: {
            maxHeight: '100vh',
            width: '100%',
            maxWidth: '300px'
          },
        }}
      >
        {isAuthenticated() ? (
          <>
            {isAdmin() && (
              <MenuItem component={Link} to="/dashboard" onClick={handleMobileClose}>
                <DashboardIcon fontSize="small" sx={{ ml: 1 }} />
                ניהול
              </MenuItem>
            )}
            <MenuItem onClick={() => { handleMobileClose(); handleLogout(); }}>
              <LogoutIcon fontSize="small" sx={{ ml: 1 }} />
              התנתק
            </MenuItem>
          </>
        ) : (
          <MenuItem component={Link} to="/login" onClick={handleMobileClose}>
            התחברות
          </MenuItem>
        )}
      </Menu>

      <Container 
        component="main" 
        sx={{ 
          py: { xs: 2, sm: 4 }, 
          px: { xs: 1, sm: 2 },
          flexGrow: 1
        }}
      >
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2 },
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[200],
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} מלונית רוטשילד 79, פתח תקווה. כל הזכויות שמורות.
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout; 