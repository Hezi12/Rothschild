import React, { useContext, useEffect, useState } from 'react';
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
  useMediaQuery,
  Tooltip,
  alpha,
  Chip,
  SkipNav
} from '@mui/material';
import { 
  AccountCircle,
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon,
  Hotel as HotelIcon,
  WhatsApp as WhatsAppIcon,
  Call as CallIcon,
  Construction as ConstructionIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

// רכיב דילוג לתוכן עיקרי עבור ניווט בעזרת מקלדת
const SkipToContent = () => (
  <a 
    href="#main-content" 
    className="sr-only" 
    style={{
      position: 'absolute',
      top: '0',
      left: '0',
      padding: '10px',
      background: '#1976d2',
      color: 'white',
      zIndex: 9999,
      transform: 'translateY(-100%)',
      transition: 'transform 0.3s',
    }}
    onFocus={(e) => e.target.style.transform = 'translateY(0)'}
    onBlur={(e) => e.target.style.transform = 'translateY(-100%)'}
  >
    דלג לתוכן העיקרי
  </a>
);

const Layout = () => {
  const { isAuthenticated, isAdmin, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileAnchorEl, setMobileAnchorEl] = React.useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isBlinking, setIsBlinking] = useState(true);

  // הוספת אפקט הבהוב להודעה
  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 800);

    return () => clearInterval(blinkTimer);
  }, []);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileAnchorEl(event.currentTarget);
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
    <>
      <SkipToContent />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" color="primary" elevation={3} sx={{ backgroundColor: '#1565C0' }}>
          <Toolbar>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Typography 
                variant="h6" 
                component={Link} 
                to="/" 
                sx={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="דף הבית של מלונית רוטשילד 79"
              >
                <HotelIcon sx={{ mr: 1 }} aria-hidden="true" />
                <Box component="span">מלונית רוטשילד 79</Box>
              </Typography>

              {isMobile ? (
                <>
                  <IconButton
                    edge="end"
                    color="inherit"
                    aria-label="תפריט"
                    aria-controls="mobile-menu"
                    aria-haspopup="true"
                    onClick={handleMobileMenuOpen}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Menu
                    id="mobile-menu"
                    anchorEl={mobileAnchorEl}
                    keepMounted
                    open={Boolean(mobileAnchorEl)}
                    onClose={handleMobileClose}
                  >
                    <MenuItem 
                      component={Link} 
                      to="/" 
                      onClick={handleMobileClose}
                    >
                      דף הבית
                    </MenuItem>
                    {isAuthenticated && isAdmin && (
                      <MenuItem 
                        component={Link} 
                        to="/dashboard" 
                        onClick={handleMobileClose}
                      >
                        ניהול
                      </MenuItem>
                    )}
                    {isAuthenticated ? (
                      <MenuItem onClick={() => { handleLogout(); handleMobileClose(); }}>
                        <LogoutIcon fontSize="small" sx={{ mr: 1 }} aria-hidden="true" />
                        התנתק
                      </MenuItem>
                    ) : (
                      <MenuItem 
                        component={Link} 
                        to="/login" 
                        onClick={handleMobileClose}
                      >
                        התחבר
                      </MenuItem>
                    )}
                    <Divider />
                    <MenuItem 
                      component="a" 
                      href="https://wa.me/972506070260" 
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleMobileClose}
                    >
                      <WhatsAppIcon fontSize="small" sx={{ mr: 1 }} aria-hidden="true" />
                      וואטסאפ
                    </MenuItem>
                    <MenuItem 
                      component="a" 
                      href="tel:0506070260"
                      onClick={handleMobileClose}
                    >
                      <CallIcon fontSize="small" sx={{ mr: 1 }} aria-hidden="true" />
                      התקשר אלינו
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {isAuthenticated && isAdmin && (
                    <Tooltip title="למערכת הניהול">
                      <Button 
                        color="inherit" 
                        component={Link} 
                        to="/dashboard"
                        startIcon={<DashboardIcon />}
                        sx={{ mr: 1 }}
                      >
                        ניהול
                      </Button>
                    </Tooltip>
                  )}
                  
                  {isAuthenticated ? (
                    <Tooltip title="התנתק">
                      <IconButton 
                        onClick={handleMenu}
                        color="inherit"
                        aria-label="אפשרויות חשבון"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                      >
                        <AccountCircle />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Button 
                      color="inherit" 
                      component={Link} 
                      to="/login"
                    >
                      התחבר
                    </Button>
                  )}
                  
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon fontSize="small" sx={{ mr: 1 }} aria-hidden="true" />
                      התנתק
                    </MenuItem>
                  </Menu>
                  
                  <Tooltip title="שלח לנו הודעה בוואטסאפ">
                    <Button 
                      variant="contained" 
                      color="success" 
                      size="small"
                      startIcon={<WhatsAppIcon />}
                      component="a"
                      href="https://wa.me/972506070260"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="שלח לנו הודעה בוואטסאפ"
                      sx={{ 
                        mr: 1, 
                        borderRadius: '50px',
                        backgroundColor: '#25D366',
                        '&:hover': { 
                          backgroundColor: '#128C7E',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      צור קשר
                    </Button>
                  </Tooltip>

                  <Tooltip title="התקשר אלינו">
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small"
                      startIcon={<CallIcon />}
                      component="a"
                      href="tel:0506070260"
                      aria-label="התקשר אלינו: 050-607-0260"
                      sx={{ 
                        borderRadius: '50px',
                        fontWeight: 'medium',
                        borderWidth: '1.5px',
                        px: 2,
                        '&:hover': { 
                          borderWidth: '1.5px',
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      050-607-0260
                    </Button>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <main id="main-content" tabIndex="-1" style={{ outline: 'none' }}>
          <Container sx={{ pt: 3, pb: 5, flexGrow: 1 }}>
            <Outlet />
          </Container>
        </main>

        <Box 
          component="footer" 
          sx={{ 
            mt: 'auto', 
            py: 3, 
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            textAlign: 'center'
          }}
          role="contentinfo"
          aria-label="פרטי קשר ומידע נוסף"
        >
          <Container>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} מלונית רוטשילד 79 | כל הזכויות שמורות
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <Link to="/" aria-label="דף הבית">דף הבית</Link> | 
              <a href="tel:0506070260" aria-label="התקשר אלינו: 050-607-0260"> צור קשר </a> | 
              <a href="https://wa.me/972506070260" target="_blank" rel="noopener noreferrer" aria-label="שלח לנו הודעת וואטסאפ"> וואטסאפ</a>
            </Typography>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default Layout; 