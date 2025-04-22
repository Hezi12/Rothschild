import { useState, useContext, useCallback } from 'react';
import { BookingContext } from '../../../context/BookingContext';
import { createEmptyBooking, adaptBookingForEditing, validateBooking } from '../utils/bookingUtils';

// Hook לניהול הזמנות
const useBookingManager = () => {
  // מצב מקומי
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  
  // הקונטקסט
  const {
    createBooking,
    updateBooking,
    deleteBooking,
    fetchBookings,
    getPaymentMethodLabel
  } = useContext(BookingContext);
  
  // פתיחת דיאלוג הוספת הזמנה
  const handleAddBooking = useCallback((roomId = "", date = null, room = null) => {
    console.log('יצירת הזמנה חדשה:', { roomId, date });
    const newBooking = createEmptyBooking(roomId, date, room);
    setSelectedBooking(newBooking);
    setBookingDialogOpen(true);
  }, []);
  
  // פתיחת דיאלוג עריכת הזמנה
  const handleEditBooking = useCallback((booking) => {
    console.log("נלחץ על הזמנה:", booking);
    
    if (!booking) {
      console.error("נסיון ללחוץ על הזמנה לא קיימת");
      return;
    }
    
    const adaptedBooking = adaptBookingForEditing(booking);
    console.log("הזמנה מותאמת לעריכה:", adaptedBooking);
    
    setSelectedBooking(adaptedBooking);
    setBookingDialogOpen(true);
  }, []);
  
  // שמירת הזמנה (חדשה או עדכון)
  const handleSaveBooking = useCallback(async (bookingData) => {
    console.log('שמירת הזמנה:', bookingData);
    
    try {
      const { isValid, errors } = validateBooking(bookingData);
      
      if (!isValid) {
        console.error('שגיאות וולידציה:', errors);
        return { success: false, errors };
      }
      
      let result;
      
      // אם יש מזהה להזמנה, מדובר בעדכון
      if (bookingData._id) {
        result = await updateBooking(bookingData._id, bookingData);
      } else {
        // אחרת מדובר בהזמנה חדשה
        result = await createBooking(bookingData);
      }
      
      // רענון הזמנות מהשרת לאחר שמירה מוצלחת
      if (result.success) {
        await fetchBookings({});
        setBookingDialogOpen(false);
      }
      
      return result;
    } catch (error) {
      console.error('שגיאה בשמירת הזמנה:', error);
      return { success: false, error: error.message };
    }
  }, [createBooking, updateBooking, fetchBookings]);
  
  // מחיקת הזמנה
  const handleDeleteBooking = useCallback(async (bookingId) => {
    console.log('מחיקת הזמנה:', bookingId);
    
    try {
      const result = await deleteBooking(bookingId);
      
      // רענון הזמנות מהשרת לאחר מחיקה מוצלחת
      if (result.success) {
        await fetchBookings({});
        setBookingDialogOpen(false);
      }
      
      return result;
    } catch (error) {
      console.error('שגיאה במחיקת הזמנה:', error);
      return { success: false, error: error.message };
    }
  }, [deleteBooking, fetchBookings]);
  
  // פתיחת דיאלוג חיפוש
  const handleOpenSearchDialog = useCallback(() => {
    setSearchDialogOpen(true);
  }, []);
  
  return {
    selectedBooking,
    bookingDialogOpen,
    searchDialogOpen,
    setBookingDialogOpen,
    setSearchDialogOpen,
    handleAddBooking,
    handleEditBooking,
    handleSaveBooking,
    handleDeleteBooking,
    handleOpenSearchDialog,
    getPaymentMethodLabel
  };
};

export default useBookingManager; 