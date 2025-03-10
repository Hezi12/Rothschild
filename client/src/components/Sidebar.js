import React from 'react';
import { NavItem } from './NavItem';
import EventIcon from '@mui/icons-material/Event';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const Sidebar = () => {
  const pathname = window.location.pathname;

  return (
    <div>
      {/* ניהול הזמנות */}
      <NavItem 
        to="/dashboard/bookings" 
        text="לוח שנה הזמנות" 
        icon={<EventIcon />} 
        isActive={pathname === '/dashboard/bookings'}
      />
      
      {/* דף הזמנות חדש */}
      <NavItem 
        to="/dashboard/bookings-new" 
        text="ניהול הזמנות חדש" 
        icon={<ListAltIcon />} 
        isActive={pathname === '/dashboard/bookings-new'}
      />
      
      {/* לוח השנה הישן */}
      <NavItem 
        to="/dashboard/bookings-calendar" 
        text="לוח שנה ישן" 
        icon={<CalendarMonthIcon />} 
        isActive={pathname === '/dashboard/bookings-calendar'}
      />
    </div>
  );
};

export default Sidebar; 