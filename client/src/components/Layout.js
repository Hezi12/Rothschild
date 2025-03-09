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
  ExitToApp as LogoutIcon
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
      <AppBar position="static">
        <Toolbar sx={{ padding: isMobile ? '0 8px' : '0 16px' }}>
          {/* תפריט נייד */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 1, display: { sm: 'none' } }}
            onClick={handleMobileMenu}
          >
            <MenuIcon />
          </IconButton>
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
            <MenuItem component={Link} to="/" onClick={handleMobileClose}>
              דף הבית
            </MenuItem>
            <MenuItem component={Link} to="/booking" onClick={handleMobileClose}>
              הזמנת חדר
            </MenuItem>
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

          {/* לוגו */}
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ 
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
              fontSize: isMobile ? '1rem' : '1.25rem',
              textAlign: 'right'
            }}
          >
            מלונית רוטשילד 79
          </Typography>

          {/* תפריט רגיל */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Button color="inherit" component={Link} to="/">
              דף הבית
            </Button>
            <Button color="inherit" component={Link} to="/booking">
              הזמנת חדר
            </Button>
          </Box>

          {/* תפריט משתמש */}
          {isAuthenticated() ? (
            <div>
              <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                size={isMobile ? "small" : "medium"}
              >
                <AccountCircle />
              </IconButton>
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
            </div>
          ) : (
            <Button color="inherit" component={Link} to="/login" size={isMobile ? "small" : "medium"}>
              התחברות
            </Button>
          )}
        </Toolbar>
      </AppBar>

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