import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

/**
 * רכיב מיוחד לייצוא קבצי iCal
 * פתרון זמני עד שה-API צד השרת יעבוד ב-Vercel
 */
const ICalExport = () => {
  const { roomNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const generateCalendar = async () => {
      try {
        // קבלת ההזמנות לחדר זה
        const bookingsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/bookings?roomNumber=${roomNumber}`);
        
        // יצירת תוכן ה-iCal בסיסי
        let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//מלונית רוטשילד 79//חדר ${roomNumber}//HE
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

        // הוספת הזמנות
        const bookings = bookingsResponse.data.data;
        bookings.forEach(booking => {
          if (booking.paymentStatus !== 'בוטל') {
            const startDate = new Date(booking.checkIn);
            const endDate = new Date(booking.checkOut);
            
            // פורמט תאריכים ל-iCal
            const formatICalDate = (date) => {
              return date.toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '');
            };
            
            icalContent += `BEGIN:VEVENT
DTSTAMP:${formatICalDate(new Date())}
DTSTART;VALUE=DATE:${formatICalDate(startDate).substring(0, 8)}
DTEND;VALUE=DATE:${formatICalDate(endDate).substring(0, 8)}
SUMMARY:הזמנה - ${booking.guest.firstName} ${booking.guest.lastName}
DESCRIPTION:שם: ${booking.guest.firstName} ${booking.guest.lastName}\\nטלפון: ${booking.guest.phone}\\nאימייל: ${booking.guest.email}\\nסטטוס תשלום: ${booking.paymentStatus}
UID:booking-${booking._id}@rothschild79
END:VEVENT
`;
          }
        });
        
        // סגירת קובץ ה-iCal
        icalContent += 'END:VCALENDAR';
        
        // הורדת הקובץ דרך הדפדפן (פתרון זמני)
        const blob = new Blob([icalContent], { type: 'text/calendar' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `room-${roomNumber}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // החזרת תצוגה ריקה
        setLoading(false);
      } catch (error) {
        console.error('שגיאה ביצירת קובץ iCal:', error);
        setError('אירעה שגיאה ביצירת קובץ iCal');
        setLoading(false);
      }
    };
    
    generateCalendar();
  }, [roomNumber]);
  
  if (loading) {
    return <div style={{ padding: 20, fontFamily: 'sans-serif' }}>טוען...</div>;
  }
  
  if (error) {
    return <div style={{ padding: 20, color: 'red', fontFamily: 'sans-serif' }}>{error}</div>;
  }
  
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      הקובץ נוצר, בודק אם ההורדה התחילה...
    </div>
  );
};

export default ICalExport; 