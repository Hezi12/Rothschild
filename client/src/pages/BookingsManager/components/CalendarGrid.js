import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { isSameDay } from 'date-fns';
import CalendarCell from './CalendarCell';
import CalendarHeader from './CalendarHeader';

const CalendarGrid = ({ 
  days, 
  rooms, 
  bookings, 
  onCellClick, 
  onBookingClick 
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: `70px repeat(${days.length}, 1fr)`,
      gap: 0.5,
      my: 1
    }}>
      {/* כותרות הלוח - תאריכים */}
      <CalendarHeader days={days} />
      
      {/* תאי הלוח לכל חדר ותאריך */}
      {rooms.map((room) => (
        <React.Fragment key={`room-${room._id}`}>
          {/* עמודת החדר (קבועה מימין) */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.light, 0.05),
            borderRadius: '8px',
            p: 1,
            height: '100%',
            fontWeight: 'medium',
            fontSize: '0.9rem'
          }}>
            {room.roomNumber}
          </Box>
          
          {/* תאים לכל יום */}
          {days.map((day, dayIdx) => {
            // התאריך לבדיקה ללא רכיב השעה
            const dateNoTime = new Date(day);
            dateNoTime.setHours(0, 0, 0, 0);
            
            // בדיקה אם יש הזמנה ביום זה לחדר זה
            const bookingsForCell = bookings?.filter(booking => {
              try {
                // בדיקה בסיסית שיש נתונים תקינים בהזמנה
                if (!booking || (!booking.roomId && !booking.room)) {
                  return false;
                }
                
                // בדיקה של מזהה החדר - תומך בשני סוגי מבנים
                const bookingRoomId = booking.room?._id || booking.roomId;
                if (bookingRoomId !== room._id) {
                  return false;
                }
                
                // המרת התאריכים למחרוזות נכונות למקרה שהן לא בפורמט הנכון
                // תומך בשני סוגי שדות: startDate/endDate או checkIn/checkOut
                const startDateField = booking.startDate || booking.checkIn;
                const endDateField = booking.endDate || booking.checkOut;
                
                if (!startDateField || !endDateField) {
                  return false;
                }
                
                const checkInDate = startDateField instanceof Date ? 
                  startDateField : new Date(startDateField);
                const checkOutDate = endDateField instanceof Date ? 
                  endDateField : new Date(endDateField);
                
                // וידוא שהתאריכים תקינים
                if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
                  return false;
                }
                
                // איפוס שעות לצורך השוואה מדויקת
                const checkInDateNoTime = new Date(checkInDate);
                checkInDateNoTime.setHours(0, 0, 0, 0);
                
                const checkOutDateNoTime = new Date(checkOutDate);
                checkOutDateNoTime.setHours(0, 0, 0, 0);
                
                // בדיקה אם התאריך הנוכחי נמצא בטווח ההזמנה
                return dateNoTime >= checkInDateNoTime && dateNoTime < checkOutDateNoTime;
                
              } catch (error) {
                console.error('שגיאה בבדיקת הזמנות עבור תא בלוח:', error);
                return false;
              }
            });
            
            const isToday = isSameDay(day, new Date());
            const isPast = day < new Date() && !isToday;
            
            return (
              <CalendarCell
                key={`cell-${room._id}-${dayIdx}`}
                isToday={isToday}
                isPast={isPast}
                isBooked={bookingsForCell && bookingsForCell.length > 0}
                onClick={() => {
                  // אם יש הזמנה, נפתח אותה לעריכה, אחרת ניצור חדשה
                  if (bookingsForCell && bookingsForCell.length > 0) {
                    onBookingClick(bookingsForCell[0]);
                  } else {
                    onCellClick(room._id, day);
                  }
                }}
              >
                {/* כאן מציג את תוכן התא - הזמנות */}
                {bookingsForCell && bookingsForCell.map((booking, idx) => {
                  const guestName = booking.guest ? 
                    `${booking.guest.firstName || ''} ${booking.guest.lastName || ''}` : 
                    (booking.firstName && booking.lastName ? 
                      `${booking.firstName} ${booking.lastName}` : '');
                  
                  const statusColors = {
                    confirmed: theme.palette.success.main,
                    pending: theme.palette.warning.main,
                    canceled: theme.palette.error.main
                  };
                  
                  const statusColor = statusColors[booking.status] || theme.palette.info.main;
                  
                  return (
                    <Box 
                      key={`booking-${booking._id || idx}`}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        p: 0.5,
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        backgroundColor: alpha(statusColor, 0.1),
                        border: `1px solid ${alpha(statusColor, 0.3)}`,
                        color: theme.palette.text.primary,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(statusColor, 0.15),
                          transform: 'scale(1.02)'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookingClick(booking);
                      }}
                    >
                      <Typography variant="caption" sx={{ 
                        fontWeight: 'medium', 
                        fontSize: '0.8rem',
                        textAlign: 'center',
                        width: '100%'
                      }}>
                        {guestName || 'אורח ללא שם'}
                      </Typography>
                    </Box>
                  );
                })}
              </CalendarCell>
            );
          })}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default CalendarGrid; 