import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpIcon from '@mui/icons-material/Help';

/**
 * רכיב שמציג צ'יפ (תווית) עם סטטוס הזמנה בצבע המתאים
 */
const BookingStatusChip = ({ status, size = 'small', showIcon = true }) => {
  // הגדרת צבעים ואייקונים לפי סטטוס
  const getStatusConfig = () => {
    // בדיקה אם מדובר בסטטוס תשלום
    if (status === 'paid' || status === 'partial' || status === 'pending' || status === 'canceled') {
      return getPaymentStatusConfig();
    }
    
    // סטטוסים רגילים של הזמנה
    switch (status) {
      case 'confirmed':
        return {
          label: 'מאושר',
          color: 'success',
          icon: <CheckCircleIcon fontSize="small" />
        };
      case 'pending':
        return {
          label: 'ממתין',
          color: 'warning',
          icon: <WarningIcon fontSize="small" />
        };
      case 'canceled':
        return {
          label: 'בוטל',
          color: 'error',
          icon: <CancelIcon fontSize="small" />
        };
      case 'completed':
        return {
          label: 'הסתיים',
          color: 'info',
          icon: <CheckCircleIcon fontSize="small" />
        };
      default:
        return {
          label: status || 'לא ידוע',
          color: 'default',
          icon: <HelpIcon fontSize="small" />
        };
    }
  };
  
  // פונקציה לקבלת הגדרות עבור סטטוס תשלום
  const getPaymentStatusConfig = () => {
    switch (status) {
      case 'paid':
        return {
          label: 'שולם',
          color: 'success',
          icon: <CheckCircleIcon fontSize="small" />
        };
      case 'partial':
        return {
          label: 'שולם חלקית',
          color: 'warning',
          icon: <WarningIcon fontSize="small" />
        };
      case 'pending':
        return {
          label: 'לא שולם',
          color: 'error',
          icon: <ErrorIcon fontSize="small" />
        };
      case 'canceled':
        return {
          label: 'בוטל',
          color: 'error',
          icon: <CancelIcon fontSize="small" />
        };
      default:
        return {
          label: status || 'לא ידוע',
          color: 'default',
          icon: <HelpIcon fontSize="small" />
        };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <Tooltip title={`סטטוס: ${config.label}`}>
      <Chip
        label={config.label}
        color={config.color}
        size={size}
        icon={showIcon ? config.icon : undefined}
        sx={{
          fontWeight: 'medium',
          fontSize: size === 'small' ? '0.75rem' : '0.875rem'
        }}
      />
    </Tooltip>
  );
};

export default BookingStatusChip; 