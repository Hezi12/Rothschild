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
      
      // שימוש בערך המקורי של אמצעי התשלום
      const finalMethod = method;

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

  // פונקציית עזר לעדכון שדות בטופס ההזמנה (לשימוש בקומפוננטים השונים)
  const handleBookingFormChange = (bookingData, field, value, vatRate = 17) => {
    const updatedBookingData = { ...bookingData };
    
    if (field.includes('.')) { 
      const [parent, child] = field.split('.'); 
      updatedBookingData[parent] = { 
        ...updatedBookingData[parent], 
        [child]: value 
      }; 
    } else { 
      updatedBookingData[field] = value; 
    }
    
    // טיפול בשדות מחיר
    const nights = updatedBookingData.nights || 1;

    // אם שינו מחיר ללילה ללא מע"מ
    if (field === 'pricePerNightNoVat' && value) {
      const priceNoVat = parseFloat(value);
      const isTourist = updatedBookingData.isTourist;
      
      // חישוב מחיר עם מע"מ תלוי אם תייר
      if (isTourist) {
        updatedBookingData.pricePerNight = priceNoVat; // תייר - אין מע"מ
      } else {
        updatedBookingData.pricePerNight = Math.round((priceNoVat * (1 + vatRate / 100)) * 100) / 100;
      }
      
      // עדכון סה"כ מחיר
      updatedBookingData.totalPrice = Math.round(updatedBookingData.pricePerNight * nights * 100) / 100;
    }
    
    // אם שינו מחיר ללילה כולל מע"מ
    if (field === 'pricePerNight' && value) {
      const priceWithVat = parseFloat(value);
      const isTourist = updatedBookingData.isTourist;
      
      // חישוב מחיר ללא מע"מ תלוי אם תייר
      if (isTourist) {
        updatedBookingData.pricePerNightNoVat = priceWithVat; // תייר - זהה למחיר עם מע"מ
      } else {
        updatedBookingData.pricePerNightNoVat = Math.round((priceWithVat / (1 + vatRate / 100)) * 100) / 100;
      }
      
      // עדכון סה"כ מחיר
      updatedBookingData.totalPrice = Math.round(priceWithVat * nights * 100) / 100;
    }
    
    // אם שינו סה"כ מחיר
    if (field === 'totalPrice' && value) {
      const totalPrice = parseFloat(value);
      const isTourist = updatedBookingData.isTourist;
      
      // עדכון מחיר ללילה כולל מע"מ
      updatedBookingData.pricePerNight = Math.round((totalPrice / nights) * 100) / 100;
      
      // עדכון מחיר ללילה ללא מע"מ תלוי אם תייר
      if (isTourist) {
        updatedBookingData.pricePerNightNoVat = updatedBookingData.pricePerNight; // תייר - זהה למחיר עם מע"מ
      } else {
        updatedBookingData.pricePerNightNoVat = Math.round((updatedBookingData.pricePerNight / (1 + vatRate / 100)) * 100) / 100;
      }
    }
    
    // אם שינו את השדה isTourist
    if (field === 'isTourist') {
      const isTourist = value === true || value === 'true';
      
      if (isTourist) {
        // תייר: מחיר ללילה כולל מע"מ = מחיר ללא מע"מ (אין מע"מ)
        updatedBookingData.pricePerNight = updatedBookingData.pricePerNightNoVat;
      } else {
        // לא תייר: חישוב מחיר כולל מע"מ
        updatedBookingData.pricePerNight = Math.round((updatedBookingData.pricePerNightNoVat * (1 + vatRate / 100)) * 100) / 100;
      }
      
      // עדכון סה"כ מחיר
      updatedBookingData.totalPrice = Math.round(updatedBookingData.pricePerNight * nights * 100) / 100;
    }
    
    return updatedBookingData;
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
        updatePaymentStatus,
        deleteBooking,
        handleBookingFormChange
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export default BookingProvider; 