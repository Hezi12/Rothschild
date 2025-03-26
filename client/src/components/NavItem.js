import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ListItem, ListItemIcon, ListItemText, Box } from '@mui/material';

export const NavItem = ({ to, text, icon, isActive }) => {
  return (
    <ListItem
      button
      component={RouterLink}
      to={to}
      sx={{
        borderRadius: '8px',
        mb: 0.5,
        backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
        color: isActive ? 'primary.main' : 'text.primary',
        '&:hover': {
          backgroundColor: 'rgba(25, 118, 210, 0.04)',
        },
        transition: 'all 0.2s',
        borderRight: isActive ? '3px solid #1976d2' : '3px solid transparent',
      }}
    >
      <ListItemIcon sx={{ minWidth: '40px', color: isActive ? 'primary.main' : 'inherit' }}>
        {icon}
      </ListItemIcon>
      <ListItemText primary={text} />
      {isActive && (
        <Box
          sx={{
            width: '5px',
            height: '100%',
            position: 'absolute',
            right: 0,
            backgroundColor: 'primary.main',
            borderRadius: '4px 0 0 4px',
          }}
        />
      )}
    </ListItem>
  );
}; 