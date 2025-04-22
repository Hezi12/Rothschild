import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { BookingContext } from '../../../context/BookingContext';

// Hook לטעינת נתוני חדרים והזמנות
const useFetchData = () => {
  // מצב מקומי
  const [rooms, setRooms] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // שימוש בקונטקסט ההזמנות
  const { 
    bookings,
    loading: contextLoading,
    error: contextError,
    fetchBookings: contextFetchBookings
  } = useContext(BookingContext);
  
  // טעינת חדרים
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        // מיון החדרים לפי מספר החדר
        const sortedRooms = [...response.data.data].sort((a, b) => a.roomNumber - b.roomNumber);
        // הסרת הסינון - להציג את כל החדרים במקום רק את אלה שמוגדרים ב-roomNumbers
        setRooms(sortedRooms);
        console.log('נטענו', sortedRooms.length, 'חדרים');
      }
    } catch (error) {
      console.error('שגיאה בטעינת החדרים:', error);
      setError('אירעה שגיאה בטעינת החדרים');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // טעינת הזמנות
  const fetchBookings = useCallback(async () => {
    try {
      console.log('טוען נתוני הזמנות מהשרת...');
      setLoading(true);
      
      // טעינת הזמנות מהשרת
      // טעינה של חודש שלם, נסה להשתמש בקאש או ליעל את הבקשה על פי צורך
      console.log('שולח בקשת הזמנות לשרת');
      await contextFetchBookings({});
      
      setLoading(false);
    } catch (error) {
      console.error('שגיאה בעת טעינת הזמנות:', error);
      setLoading(false);
    }
  }, [contextFetchBookings]);
  
  // עדכון filteredBookings כאשר bookings משתנה
  useEffect(() => {
    console.log(`=== עדכון מהקונטקסט ===`);
    console.log(`מספר הזמנות בקונטקסט: ${bookings ? bookings.length : 0}`);
    if (bookings && bookings.length > 0) {
      console.log(`דוגמה להזמנה ראשונה:`, bookings[0]);
      
      // סינון הזמנות מבוטלות ועדכון הזמנות מסוננות
      const activeBookings = bookings.filter(booking => booking.status !== 'canceled');
      setFilteredBookings(activeBookings);
      console.log(`סינון הזמנות: ${bookings.length} סה"כ, ${activeBookings.length} פעילות`);
    } else {
      setFilteredBookings([]);
    }
  }, [bookings]);
  
  // בדיקת התלות בין חדרים והזמנות
  useEffect(() => {
    // בדוק תלות בין החדרים וההזמנות
    if (rooms.length > 0 && bookings && bookings.length > 0) {
      console.log('=== בדיקת תלות חדרים והזמנות ===');
      console.log('מספר חדרים:', rooms.length);
      
      // אסוף את כל מספרי החדרים
      const roomNumbers = rooms.map(room => room.roomNumber);
      console.log('מספרי חדרים זמינים:', roomNumbers);
      
      // בדוק את מספרי החדרים בהזמנות
      const bookingRoomNumbers = [];
      for (const booking of bookings) {
        // הוסף בדיקה לפי מבנה הנתונים - חדר יכול להיות במספר מקומות
        let roomNumber = null;
        
        if (booking.room && booking.room.roomNumber) {
          roomNumber = booking.room.roomNumber;
        } else if (booking.roomNumber) {
          roomNumber = booking.roomNumber;
        }
        
        if (roomNumber && !bookingRoomNumbers.includes(roomNumber)) {
          bookingRoomNumbers.push(roomNumber);
        }
      }
      
      console.log('מספרי חדרים בהזמנות:', bookingRoomNumbers);
      
      // בדוק חדרים שאין להם התאמה
      const unmatchedRooms = bookingRoomNumbers.filter(num => !roomNumbers.includes(num));
      if (unmatchedRooms.length > 0) {
        console.log('מספרי חדרים בהזמנות שאין להם התאמה:', unmatchedRooms);
      }
    }
  }, [bookings, rooms]);
  
  // טעינה ראשונית
  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, [fetchRooms, fetchBookings]);
  
  return {
    rooms,
    bookings: filteredBookings,
    loading: loading || contextLoading,
    error: error || contextError,
    fetchRooms,
    fetchBookings
  };
};

export default useFetchData; 