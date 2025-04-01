import { AuthContext } from '../context/AuthContext';
import { BookingContext } from '../context/BookingContext';
import { Link as RouterLink } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import BookingDialog from './BookingDialog';

const SimpleBookingList = () => {
  // ... existing code ...

  // פונקציה לטיפול בשמירת הזמנה חדשה
  const handleSaveBooking = async (bookingData) => {
    try {
      await contextCreateBooking(bookingData);
      setNewBookingDialog({ open: false, roomId: null, date: null });
      fetchBookings();
    } catch (error) {
      console.error('שגיאה ביצירת הזמנה:', error);
      setError(error.response?.data?.message || 'שגיאה ביצירת ההזמנה');
    }
  };

  return (
    <>
      {/* ... existing code ... */}

      {/* דיאלוג הזמנה חדשה */}
      <BookingDialog
        open={newBookingDialog.open}
        onClose={() => setNewBookingDialog({ open: false, roomId: null, date: null })}
        onSave={handleSaveBooking}
        selectedRoom={rooms.find(r => r._id === newBookingDialog.roomId)}
        selectedDate={newBookingDialog.date}
        rooms={rooms}
      />

      {/* ... rest of the dialogs ... */}
    </>
  );
};

// ... existing code ... 