import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { IconButton, Box } from '@mui/material';
import { SidebarButton } from '../components/SidebarButton';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useTheme } from '@mui/material/styles';

const BookingsCalendarPage = () => {
  const theme = useTheme();
  const currentPath = window.location.pathname;

  return (
    <div>
      {/* ... existing code ... */}

      <SidebarButton title="דו״ח הכנסות" placement="right" isActive={currentPath === '/dashboard/income-report'}>
        <IconButton
          component={RouterLink}
          to="/dashboard/income-report"
          aria-label="income-report"
        >
          <AssessmentIcon sx={{ color: isActive => isActive ? '#9b59b6' : theme.palette.text.secondary, '&:hover': { color: '#8e44ad' } }} />
        </IconButton>
      </SidebarButton>

      <SidebarButton title="ניהול פיננסי" placement="right" isActive={currentPath === '/dashboard/financial-management'}>
        <IconButton
          component={RouterLink}
          to="/dashboard/financial-management"
          aria-label="financial"
        >
          <AccountBalanceIcon sx={{ color: isActive => isActive ? '#16a085' : theme.palette.text.secondary, '&:hover': { color: '#1abc9c' } }} />
        </IconButton>
      </SidebarButton>
      
      <Box sx={{ flexGrow: 1 }} /> {/* מרווח גמיש שידחוף את האייקון הבא לתחתית */}
    </div>
  );
};

export default BookingsCalendarPage; 