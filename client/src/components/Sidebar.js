import React from 'react';
import { NavItem } from './NavItem';
import EventIcon from '@mui/icons-material/Event';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { Divider, Typography } from '@mui/material';

const Sidebar = () => {
  const pathname = window.location.pathname;

  return (
    <div>
      {/* דף הזמנות חדש - מומלץ */}
      <NavItem 
        to="/dashboard/bookings-new" 
        text="ניהול הזמנות (חדש)" 
        icon={<ListAltIcon />} 
        isActive={pathname === '/dashboard/bookings-new'}
      />
      
      <Divider style={{ margin: '8px 0' }} />
      
      {/* דפים ישנים - לא מומלצים */}
      <Typography 
        variant="caption" 
        color="textSecondary" 
        style={{ padding: '0 16px', display: 'block', marginTop: '8px' }}
      >
        דפים ישנים (יוסרו בקרוב)
      </Typography>
      
      {/* ניהול הזמנות ישן */}
      <NavItem 
        to="/dashboard/bookings" 
        text="לוח שנה הזמנות (ישן)" 
        icon={<EventIcon />} 
        isActive={pathname === '/dashboard/bookings'}
      />
      
      {/* לוח השנה הישן */}
      <NavItem 
        to="/dashboard/bookings-calendar" 
        text="לוח שנה ישן (ישן)" 
        icon={<CalendarMonthIcon />} 
        isActive={pathname === '/dashboard/bookings-calendar'}
      />
    </div>
  );
};

export default Sidebar; 