import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [fetchInProgress, setFetchInProgress] = useState(false);

  // פונקציה לטעינת הזמנות עם אפשרות לפילטרים ומניעת בקשות כפולות
  const fetchBookings = useCallback(async (filters = {}) => {
    // אם יש טעינה כבר בתהליך, אל תשלח בקשה נוספת
    if (fetchInProgress) {
      console.log('טעינת הזמנות כבר מתבצעת, דילוג על הבקשה החדשה');
      return;
    }
    
    // בדיקה אם חלפו לפחות 5 שניות מהבקשה האחרונה
    if (lastFetchTime && new Date() - lastFetchTime < 5000) {
      console.log('חלפו פחות מ-5 שניות מהבקשה האחרונה, דילוג');
      return;
    }
    
    try {
      setFetchInProgress(true);
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
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings${queryString}`);
      
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
      setFetchInProgress(false);
    }
  }, [lastFetchTime, fetchInProgress]);

  // טעינה ראשונית של הזמנות
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // הזמנה חדשה - מחזיר את ההזמנה שנוצרה
  const createBooking = async (bookingData) => {
    try {
      setLoading(true);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/bookings`, bookingData);
      
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
      
      // וידוא שיש את כל השדות הנדרשים לשרת
      const dataToSend = { ...updateData };
      
      // וידוא שדה paymentMethod
      if (dataToSend.paymentStatus === 'paid' && !dataToSend.paymentMethod) {
        console.warn('סטטוס תשלום הוא "שולם" אבל לא נשלח אמצעי תשלום, משתמש בברירת מחדל: cash');
        dataToSend.paymentMethod = 'cash';
      }
      
      console.log('נתוני עדכון הזמנה לשרת:', {
        bookingId,
        paymentStatus: dataToSend.paymentStatus,
        paymentMethod: dataToSend.paymentMethod
      });
      
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`, dataToSend, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        console.log('תשובה מהשרת לאחר עדכון הזמנה:', {
          success: response.data.success,
          paymentMethod: response.data.data?.paymentMethod
        });
        
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

  // עדכון סטטוס תשלום ואמצעי תשלום
  const updatePaymentStatus = async (bookingId, status, method) => {
    console.log('===== תחילת עדכון סטטוס תשלום =====');
    console.log('מנסה לעדכן סטטוס תשלום:', { bookingId, status, method });
    
    try {
      setLoading(true);
      
      // בדיקה שיש לנו את כל הנתונים הדרושים
      if (!bookingId) {
        console.error('חסר מזהה הזמנה בעת עדכון סטטוס תשלום');
        return { success: false, error: 'חסר מזהה הזמנה' };
      }
      
      if (!status) {
        console.error('חסר סטטוס תשלום בעת עדכון');
        return { success: false, error: 'חסר סטטוס תשלום' };
      }
      
      // המרה מערכי עברית לאנגלית לפי הצורך
      let englishStatus = status;
      if (typeof status === 'string') {
        switch(status) {
          case 'שולם':
            englishStatus = 'paid';
            break;
          case 'לא שולם':
          case 'ממתין לתשלום':
          case 'ממתין':
            englishStatus = 'pending';
            break;
          case 'שולם חלקית':
          case 'חלקי':
            englishStatus = 'partial';
            break;
          case 'מבוטל':
          case 'בוטל':
            englishStatus = 'canceled';
            break;
          // אם כבר באנגלית, להשאיר כפי שהוא
        }
      }
      
      // וידוא שיש אמצעי תשלום אם הסטטוס הוא 'paid'
      const finalMethod = method || '';

      console.log(`שולח בקשת עדכון לשרת: PUT /bookings/${bookingId}/payment-status`);
      console.log('נתוני הבקשה:', { paymentStatus: englishStatus, paymentMethod: finalMethod });
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/bookings/${bookingId}/payment-status`,
        { paymentStatus: englishStatus, paymentMethod: finalMethod },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('תשובה מהשרת:', response.data);
      
      if (response.data.success) {
        console.log('עדכון סטטוס תשלום הצליח, מעדכן מצב מקומי');
        
        // עדכון המצב המקומי
        setBookings(prevBookings => {
          console.log('עדכון מערך ההזמנות המקומי');
          console.log('מספר הזמנות לפני העדכון:', prevBookings.length);
          
          const updatedBookings = prevBookings.map(booking => {
            if (booking._id === bookingId) {
              console.log('מצאתי את ההזמנה שצריך לעדכן:', booking._id);
              console.log('ערכים לפני העדכון:', { 
                paymentStatus: booking.paymentStatus, 
                paymentMethod: booking.paymentMethod 
              });
              console.log('ערכים חדשים:', { 
                paymentStatus: englishStatus, 
                paymentMethod: finalMethod 
              });
              return { ...booking, paymentStatus: englishStatus, paymentMethod: finalMethod };
            }
            return booking;
          });
          
          console.log('עדכון הזמנות הושלם');
          return updatedBookings;
        });
        
        // עדכון זמן הטעינה האחרון
        setLastFetchTime(new Date());
        
        // רענון נתוני הזמנות
        console.log('מרענן נתוני הזמנות מהשרת לאחר עדכון מוצלח');
        fetchBookings();
        
        return { success: true, data: response.data.data };
      } else {
        console.error('השרת החזיר סטטוס הצלחה=false:', response.data.message);
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('===== שגיאה בעדכון סטטוס תשלום =====');
      console.error('שגיאה בעדכון סטטוס תשלום:', err);
      console.error('פרטי השגיאה:', err.response?.data || err.message);
      
      setError('שגיאה בעדכון סטטוס התשלום');
      return { success: false, error: err.response?.data?.message || err.message };
    } finally {
      console.log('===== סיום עדכון סטטוס תשלום =====');
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

  // המרת קוד אמצעי תשלום לתווית
  const getPaymentMethodLabel = (method) => {
    if (!method) return '';
    
    switch (method) {
      case 'cash':
        return 'מזומן';
      // case 'credit':
      //   return 'כרטיס אשראי';
      case 'creditOr':
        return 'אשראי אור יהודה';
      case 'creditRothschild':
        return 'אשראי רוטשילד';
      case 'mizrahi':
        return 'העברה מזרחי';
      case 'bitMizrahi':
        return 'ביט מזרחי';
      case 'payboxMizrahi':
        return 'פייבוקס מזרחי';
      case 'poalim':
        return 'העברה פועלים';
      case 'bitPoalim':
        return 'ביט פועלים';
      case 'payboxPoalim':
        return 'פייבוקס פועלים';
      case 'other':
        return 'אחר';
      default:
        return method;
    }
  };

  const contextValue = {
    bookings,
    setBookings,
    fetchBookings,
    createBooking,
    updateBooking,
    deleteBooking,
    loading,
    error,
    setError,
    updatePaymentStatus,
    getPaymentMethodLabel
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

export default BookingProvider; 