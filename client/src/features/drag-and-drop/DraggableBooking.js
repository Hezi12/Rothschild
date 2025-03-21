import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Box, TableCell, alpha, useTheme } from '@mui/material';
import axios from 'axios';
import { differenceInDays, format, addDays } from 'date-fns';
import { toast } from 'react-toastify';

// כלי עזר לקבלת התאריך הרלוונטי מבוקינג
const getRelevantDate = (booking, dateStr) => {
  const date = new Date(dateStr);
  return date;
};

// פונקציה לטיפול בגרירת והשמטת הזמנה
export const handleBookingDrop = async (draggedItem, targetRoomId, targetDate, fetchBookings) => {
  try {
    // הוסף לוג לבדיקה
    console.log('מנסה להעביר הזמנה:', draggedItem, 'לחדר:', targetRoomId, 'בתאריך:', targetDate);
    
    // בדוק שפרטי ההזמנה מלאים
    if (!draggedItem || !draggedItem.bookingId) {
      toast.error('פרטי ההזמנה חסרים');
      return false;
    }

    // נשלוף את פרטי ההזמנה המקורית
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/bookings/${draggedItem.bookingId}`,
      { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
    );
    
    if (!response.data.success) {
      toast.error('אירעה שגיאה בטעינת פרטי ההזמנה');
      return false;
    }
    
    // מידע יכול להיות ב-booking או ב-data
    const booking = response.data.booking || response.data.data;
    
    if (!booking) {
      toast.error('לא נמצאו פרטי הזמנה');
      return false;
    }
    
    console.log('התקבלו פרטי הזמנה:', booking);
    
    // טיפול בתאריכים - ודא שאנחנו עובדים עם אובייקטי תאריך
    const originalDate = new Date(draggedItem.date);
    const targetDateObj = new Date(targetDate);
    const daysDifference = differenceInDays(targetDateObj, originalDate);
    
    console.log('הפרש ימים:', daysDifference, 'מקור:', originalDate, 'יעד:', targetDateObj);
    
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    
    // עדכון תאריכי ההזמנה
    const updatedBooking = {
      ...booking,
      roomId: targetRoomId,
      room: targetRoomId, // שמירת החדר בשתי דרכים אפשריות
      checkIn: format(addDays(checkInDate, daysDifference), 'yyyy-MM-dd'),
      checkOut: format(addDays(checkOutDate, daysDifference), 'yyyy-MM-dd')
    };
    
    // אם קיים מערך rooms, נעדכן גם אותו
    if (booking.rooms && Array.isArray(booking.rooms)) {
      // אם החדר המקורי היה מזוהה כאובייקט, נחליף אותו
      const originalRoomIndex = booking.rooms.findIndex(r => 
        (typeof r === 'object' && r._id === draggedItem.roomId) || r === draggedItem.roomId);
      
      if (originalRoomIndex !== -1) {
        const updatedRooms = [...booking.rooms];
        updatedRooms[originalRoomIndex] = targetRoomId;
        updatedBooking.rooms = updatedRooms;
      }
    }
    
    // שמירת המחיר המקורי - מאוד חשוב!
    updatedBooking.pricePerNight = booking.pricePerNight;
    updatedBooking.pricePerNightNoVat = booking.pricePerNightNoVat;
    updatedBooking.totalPrice = booking.totalPrice;
    
    console.log('שולח עדכון הזמנה:', updatedBooking);
    
    // שליחת העדכון לשרת
    const updateResponse = await axios.put(
      `${process.env.REACT_APP_API_URL}/bookings/${draggedItem.bookingId}`, 
      updatedBooking,
      { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
    );
    
    if (updateResponse.data.success) {
      toast.success('ההזמנה הועברה בהצלחה');
      fetchBookings(); // רענון ההזמנות
      return true;
    } else {
      console.error('תשובת שרת:', updateResponse.data);
      toast.error(updateResponse.data.message || 'אירעה שגיאה בהעברת ההזמנה');
      return false;
    }
  } catch (error) {
    console.error('שגיאה בהעברת ההזמנה:', error);
    console.error('פרטי השגיאה:', error.response?.data);
    toast.error('אירעה שגיאה בהעברת ההזמנה: ' + (error.response?.data?.message || error.message));
    return false;
  }
};

// קומפוננטת תא עם הזמנה ניתנת לגרירה
export const DraggableBookingCell = ({ booking, roomId, date, children, onClick, sx = {} }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'booking',
    item: () => {
      const dragData = { 
        bookingId: booking._id, 
        roomId, 
        date: date.toISOString(),
        booking: {
          ...booking,
          // ודא שיש את כל הפרמטרים הנדרשים
          _id: booking._id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          // מידע על החדר
          room: booking.room || roomId
        }
      };
      console.log('מתחיל לגרור הזמנה עם המידע:', dragData);
      return dragData;
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <TableCell
      ref={drag}
      onClick={onClick}
      align="center"
      sx={{
        ...sx,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
    >
      {children}
    </TableCell>
  );
};

// קומפוננטת תא שאפשר להשמיט עליו הזמנה
export const DroppableBookingCell = ({ 
  roomId, 
  date, 
  children, 
  onDrop, 
  isBooked, 
  onClick, 
  sx = {}
}) => {
  const theme = useTheme(); // קבלת ערכת הנושא מהקונטקסט
  
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'booking',
    drop: (item) => {
      console.log('השמטת הזמנה:', item, 'על חדר:', roomId, 'בתאריך:', date);
      if (onDrop) {
        onDrop(item, roomId, date);
      }
      return { targetRoomId: roomId, targetDate: date };
    },
    canDrop: (item) => {
      // מניעת גרירה לתאריך תפוס
      const cellIsFree = !isBooked;
      
      // אם מנסים לגרור לאותו מיקום, נתיר זאת
      const isSameRoom = item.roomId === roomId;
      const isSameDate = new Date(item.date).toDateString() === date.toDateString();
      const isSamePosition = isSameRoom && isSameDate;
      
      // אם זה אותו מיקום, או שהתא פנוי
      return isSamePosition || cellIsFree;
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  return (
    <TableCell
      ref={drop}
      onClick={onClick}
      align="center"
      sx={{
        ...sx,
        position: 'relative',
      }}
    >
      {children}
      {isOver && canDrop && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
            pointerEvents: 'none',
            backgroundColor: alpha(theme.palette.success.light, 0.2),
            border: '2px dashed green',
          }}
        />
      )}
      {isOver && !canDrop && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
            pointerEvents: 'none',
            backgroundColor: alpha(theme.palette.error.light, 0.2),
            border: '2px dashed red',
          }}
        />
      )}
    </TableCell>
  );
}; 