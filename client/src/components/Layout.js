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
  Chip
} from '@mui/material';
import { 
  AccountCircle,
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon,
  Hotel as HotelIcon,
  WhatsApp as WhatsAppIcon,
  Call as CallIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

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
      <AppBar position="static" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* לוגו */}
          <div>
            <Navbar />
          </div>

          {/* אזור ימין - כפתורים */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* כפתור יצירת קשר בווטסאפ */}
            <Tooltip title="צור קשר בוואטסאפ" arrow>
              <IconButton 
                color="inherit" 
                href="https://wa.me/972536541467" 
                target="_blank"
                rel="noopener noreferrer"
                aria-label="צור קשר בוואטסאפ"
              >
                <WhatsAppIcon />
              </IconButton>
            </Tooltip>
            
            {/* כפתור התקשר אלינו */}
            <Tooltip title="התקשר אלינו" arrow>
              <IconButton 
                color="inherit" 
                href="tel:+972536541467"
                aria-label="התקשר אלינו"
              >
                <CallIcon />
              </IconButton>
            </Tooltip>

            {/* ניווט - מסך גדול */}
            {!isMobile && (
              <>
                {/* בדיקה אם המשתמש מחובר */}
                {isAuthenticated() ? (
                  <Tooltip title="הגדרות ויציאה" arrow>
                    <IconButton
                      aria-label="הגדרות חשבון"
                      aria-controls="menu-appbar"
                      aria-haspopup="true"
                      onClick={handleMenu}
                      color="inherit"
                    >
                      <AccountCircle />
                    </IconButton>
                  </Tooltip>
                ) : (
                  // כפתור כניסה
                  <Button 
                    component={Link} 
                    to="/login" 
                    color="inherit"
                    aria-label="כניסה למערכת"
                  >
                    התחבר
                  </Button>
                )}
              </>
            )}

            {/* כפתור תפריט במובייל */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="תפריט"
                aria-controls="menu-mobile"
                aria-haspopup="true"
                onClick={(e) => setMobileAnchorEl(e.currentTarget)}
              >
                <AccountCircle />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* תפריט ניווט */}
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
              <MenuItem component={Link} to="/dashboard" onClick={handleClose}>
                <DashboardIcon fontSize="small" sx={{ ml: 1 }} />
                ניהול
              </MenuItem>
            )}
            <MenuItem onClick={() => { handleClose(); handleLogout(); }}>
              <LogoutIcon fontSize="small" sx={{ ml: 1 }} />
              התנתק
            </MenuItem>
          </>
        ) : (
          <MenuItem component={Link} to="/login" onClick={handleClose}>
            התחברות
          </MenuItem>
        )}
      </Menu>

      {/* הודעת תחזוקה - מוסתרת */}
      <Box 
        sx={{ 
          display: 'none',
          justifyContent: 'center', 
          alignItems: 'center',
          bgcolor: isBlinking ? alpha(theme.palette.warning.main, 0.15) : 'transparent',
          p: 1,
          transition: 'background-color 0.5s',
          borderBottom: `1px solid ${theme.palette.warning.main}`
        }}
        role="alert"
        aria-live="polite"
      >
        <ConstructionIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
        <Typography variant="body2" color="warning.main" fontWeight="medium">
          האתר נמצא בתחזוקה, ייתכנו שיבושים זמניים
        </Typography>
      </Box>

      {/* תוכן עיקרי */}
      <Box id="main-content" component="main" sx={{ mt: 0, minHeight: 'calc(100vh - 65px)' }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>

      {/* פוטר */}
      <Box component="footer" sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        mt: 'auto' 
      }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'center', sm: 'flex-start' },
              gap: 1
            }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              &copy; {new Date().getFullYear()} מלונית רוטשילד 79 | כל הזכויות שמורות
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                  דף הבית
                </Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <a href="tel:+972536541467" style={{ textDecoration: 'none', color: 'inherit' }}>
                  טלפון: 053-654-1467
                </a>
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default Layout; 