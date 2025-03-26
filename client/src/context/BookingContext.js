import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // פונקציה לטעינת הזמנות עם אפשרות לפילטרים
  const fetchBookings = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      
      // בניית שאילתת הפילטרים
      let queryParams = [];
      
      if (filters.startDate) {
        queryParams.push(`startDate=${filters.startDate}`);
      }
      
      if (filters.endDate) {
        queryParams.push(`endDate=${filters.endDate}`);
      }
      
      if (filters.roomId) {
        queryParams.push(`roomId=${filters.roomId}`);
      }
      
      if (filters.guestName) {
        queryParams.push(`guestName=${filters.guestName}`);
      }
      
      if (filters.status) {
        queryParams.push(`status=${filters.status}`);
      }
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      console.log(`בקשה ל-API: ${process.env.REACT_APP_API_URL}/bookings${queryString}`);
      console.log(`טוקן: ${localStorage.getItem('token') ? 'קיים' : 'חסר'}`);
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings${queryString}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setBookings(response.data.data);
        setLastFetchTime(new Date());
      }
      
      setError(null);
    } catch (err) {
      console.error('שגיאה בטעינת הזמנות:', err);
      setError('שגיאה בטעינת ההזמנות מהשרת');
    } finally {
      setLoading(false);
    }
  }, []);

  // טעינה ראשונית של הזמנות
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // הזמנה חדשה - מחזיר את ההזמנה שנוצרה
  const createBooking = async (bookingData) => {
    try {
      setLoading(true);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/bookings`, bookingData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // עדכון הרשימה עם ההזמנה החדשה
        setBookings(prevBookings => [...prevBookings, response.data.data]);
        setLastFetchTime(new Date());
      }
      
      return { success: true, data: response.data.data };
    } catch (err) {
      console.error('שגיאה ביצירת הזמנה:', err);
      setError('שגיאה ביצירת ההזמנה');
      return { success: false, error: err.response?.data || err.message };
    } finally {
      setLoading(false);
    }
  };

  // עדכון הזמנה קיימת
  const updateBooking = async (bookingId, updateData) => {
    try {
      setLoading(true);
      
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // עדכון המצב המקומי
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking._id === bookingId ? response.data.data : booking
          )
        );
        setLastFetchTime(new Date());
      }
      
      return { success: true, data: response.data.data };
    } catch (err) {
      console.error('שגיאה בעדכון הזמנה:', err);
      setError('שגיאה בעדכון ההזמנה');
      return { success: false, error: err.response?.data || err.message };
    } finally {
      setLoading(false);
    }
  };

  // מחיקת הזמנה או מספר הזמנות
  const deleteBooking = async (bookingId) => {
    try {
      setLoading(true);
      
      // בדיקה אם זהו מערך של מזהים למחיקת מספר הזמנות
      if (Array.isArray(bookingId)) {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/bookings/hard-delete-many`, 
          { bookingIds: bookingId },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (response.data.success) {
          // הסרת כל ההזמנות מהמצב המקומי
          setBookings(prevBookings => 
            prevBookings.filter(booking => !bookingId.includes(booking._id))
          );
          setLastFetchTime(new Date());
        }
        
        return { success: true, data: response.data.data };
      } 
      // מחיקה רגילה של הזמנה בודדת
      else {
        const response = await axios.delete(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          // הסרת ההזמנה מהמצב המקומי
          setBookings(prevBookings => 
            prevBookings.filter(booking => booking._id !== bookingId)
          );
          setLastFetchTime(new Date());
        }
        
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      console.error('שגיאה במחיקת הזמנה:', err);
      setError('שגיאה במחיקת ההזמנה');
      return { success: false, error: err.response?.data || err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        loading,
        error,
        lastFetchTime,
        fetchBookings,
        createBooking,
        updateBooking,
        deleteBooking
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export default BookingProvider; 