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
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <AppBar position="static" sx={{
        backgroundColor: '#ffffff',
        backgroundImage: 'linear-gradient(to right, #f8f9fa, #ffffff)',
        boxShadow: '0px 2px 10px rgba(0,0,0,0.06)',
        color: theme.palette.text.primary
      }}>
        <Toolbar sx={{ 
          padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          width: '100%',
          mx: 'auto',
          flexWrap: 'wrap'
        }}>
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
                bgcolor: theme.palette.primary.main,
                color: 'white',
                width: isMobile ? 32 : 42,
                height: isMobile ? 32 : 42,
                borderRadius: '50%',
                mr: isMobile ? 1 : 1.5,
                boxShadow: '0px 3px 10px rgba(0,0,0,0.15)'
              }}
            >
              <HotelIcon sx={{ fontSize: isMobile ? '1.1rem' : '1.6rem' }} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography
                  variant="caption"
                  sx={{ 
                    color: alpha(theme.palette.text.primary, 0.7),
                    fontSize: { xs: '0.55rem', md: '0.7rem' },
                    fontWeight: 400,
                    mr: 0.5
                  }}
                >
                  מלונית
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ 
                    color: theme.palette.primary.dark, 
                    fontWeight: 'bold',
                    fontSize: { xs: '1rem', md: '1.4rem' },
                    letterSpacing: '0.5px',
                    lineHeight: 1
                  }}
                >
                  רוטשילד 79
                </Typography>
              </Box>
              <Typography 
                variant="body2"
                sx={{ 
                  fontSize: { xs: '0.6rem', md: '0.75rem' }, 
                  color: alpha(theme.palette.text.primary, 0.7),
                  letterSpacing: '1px',
                  fontWeight: 300
                }}
              >
                Rothschild 79 Hotel
              </Typography>
            </Box>
          </Box>

          {/* הודעת האתר בבנייה - במרכז הסרגל */}
          {!isMobile ? (
            <Chip
              icon={<ConstructionIcon style={{ color: isBlinking ? '#ff9800' : '#f57c00' }} />}
              label="האתר בבנייה - ייתכנו תקלות זמניות"
              sx={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: isBlinking ? alpha('#ff9800', 0.15) : alpha('#ff9800', 0.05),
                color: '#f57c00',
                borderColor: isBlinking ? '#ff9800' : alpha('#ff9800', 0.5),
                border: '1px dashed',
                fontWeight: 'medium',
                padding: '0 10px',
                transition: 'all 0.5s ease',
                '& .MuiChip-icon': {
                  transition: 'color 0.5s ease',
                },
                '&:hover': {
                  backgroundColor: alpha('#ff9800', 0.2)
                }
              }}
            />
          ) : null}

          {/* צד שמאל - כפתורי צור קשר + התחברות */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1.25, md: 2 }
          }}>
            {/* בגרסה מובייל - הודעה קטנה משולבת */}
            {isMobile && (
              <Chip
                size="small"
                icon={<ConstructionIcon style={{ fontSize: '0.8rem' }} />}
                label="בבנייה"
                sx={{
                  backgroundColor: isBlinking ? alpha('#ff9800', 0.15) : alpha('#ff9800', 0.05),
                  color: '#f57c00',
                  borderColor: '#ff9800',
                  border: '1px dashed',
                  fontSize: '0.65rem',
                  height: '20px',
                  mr: 0.5,
                  transition: 'background-color 0.5s ease'
                }}
              />
            )}
            
            {/* כפתורי צור קשר במסך גדול */}
            {!isMobile && (
              <>
                <Tooltip title="התקשר אלינו">
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="small"
                    startIcon={<CallIcon />}
                    component="a"
                    href="tel:0506070260"
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
                
                <Tooltip title="שלח לנו הודעה בוואטסאפ">
                  <Button 
                    variant="contained"
                    size="small"
                    startIcon={<WhatsAppIcon />}
                    component="a"
                    href="https://wa.me/972506070260"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      borderRadius: '50px',
                      backgroundColor: '#25D366',
                      fontWeight: 'medium',
                      px: 2,
                      boxShadow: '0 4px 8px rgba(37, 211, 102, 0.2)',
                      '&:hover': { 
                        backgroundColor: '#1fb655',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 14px rgba(37, 211, 102, 0.3)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    וואטסאפ
                  </Button>
                </Tooltip>
              </>
            )}

            {/* במסך נייד, רק אייקון טלפון */}
            {isMobile && (
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5,  // הגדלת המרווח בין האייקונים
                alignItems: 'center'
              }}>
                <Tooltip title="התקשר אלינו">
                  <IconButton
                    color="primary"
                    component="a"
                    href="tel:0506070260"
                    sx={{ 
                      border: `1.5px solid ${theme.palette.primary.main}`,
                      borderRadius: '50%',
                      p: 0.7,  // ירידה קלה בפדינג הפנימי
                      width: 32,  // הגדרת רוחב קבוע
                      height: 32,  // הגדרת גובה קבוע
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <CallIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="וואטסאפ">
                  <IconButton
                    component="a"
                    href="https://wa.me/972506070260"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      backgroundColor: '#25D366',
                      color: 'white',
                      borderRadius: '50%',
                      p: 0.7,  // ירידה קלה בפדינג הפנימי
                      width: 32,  // הגדרת רוחב קבוע
                      height: 32,  // הגדרת גובה קבוע
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: '0 2px 6px rgba(37, 211, 102, 0.4)',
                      '&:hover': { 
                        backgroundColor: '#1fb655',
                        boxShadow: '0 4px 8px rgba(37, 211, 102, 0.5)'
                      }
                    }}
                  >
                    <WhatsAppIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {/* כפתור התחברות */}
            {isAuthenticated() ? (
              <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="primary"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  width: isMobile ? 32 : 40,
                  height: isMobile ? 32 : 40,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2)
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <AccountCircle fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            ) : (
              <Tooltip title="התחברות">
                <IconButton 
                  color="primary" 
                  component={Link} 
                  to="/login"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15)
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <AccountCircle fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </Tooltip>
            )}
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
          © {new Date().getFullYear()} רוטשילד 79, פתח תקווה. כל הזכויות שמורות.
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout; 