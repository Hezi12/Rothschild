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
  Divider
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
    <>
      <AppBar position="static">
        <Toolbar>
          {/* תפריט נייד */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { sm: 'none' } }}
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
                    ניהול
                  </MenuItem>
                )}
                <MenuItem onClick={() => { handleMobileClose(); handleLogout(); }}>
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
              fontWeight: 'bold'
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
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem disabled>
                  {user?.name || 'משתמש'}
                </MenuItem>
                <Divider />
                {isAdmin() && (
                  <MenuItem component={Link} to="/dashboard" onClick={handleClose}>
                    <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
                    ניהול
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  התנתק
                </MenuItem>
              </Menu>
            </div>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              התחברות
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 4 }}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[200],
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} מלונית רוטשילד 79, פתח תקווה. כל הזכויות שמורות.
        </Typography>
      </Box>
    </>
  );
};

export default Layout; 