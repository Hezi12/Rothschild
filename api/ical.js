const { MongoClient } = require('mongodb');
require('dotenv').config();

// פונקציית עזר לפורמט תאריכים ל-iCal
const formatICalDate = (date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0];
};

// פונקציית API חדשה ל-Vercel Serverless
module.exports = async (req, res) => {
  // אפשר CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // קבלת מספר החדר מ-URL
  const roomNumber = req.query.roomNumber || req.url.split('/').pop().replace('room-', '').replace('.ics', '');
  
  // וידוא שיש מספר חדר
  if (!roomNumber) {
    return res.status(400).send('Missing room number');
  }

  // התחברות למסד הנתונים
  let client;
  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const roomsCollection = db.collection('rooms');
    const bookingsCollection = db.collection('bookings');
    
    // מציאת החדר לפי מספר
    const room = await roomsCollection.findOne({ roomNumber: parseInt(roomNumber) });
    
    if (!room) {
      return res.status(404).send(`Room number ${roomNumber} not found`);
    }
    
    // יצירת בסיס קובץ iCal
    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Rothschild79//Room ${roomNumber}//HE
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;
    
    // מציאת הזמנות לחדר זה
    const bookings = await bookingsCollection.find({ 
      'room': room._id,
      'paymentStatus': { $ne: 'בוטל' }
    }).toArray();
    
    // הוספת הזמנות לקובץ iCal
    for (const booking of bookings) {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      
      // פורמט תאריכי התחלה וסיום
      const startDate = formatICalDate(checkIn).substring(0, 8); // YYYYMMDD
      const endDate = formatICalDate(checkOut).substring(0, 8);   // YYYYMMDD
      
      icalContent += `BEGIN:VEVENT
DTSTAMP:${formatICalDate(new Date())}Z
DTSTART;VALUE=DATE:${startDate}
DTEND;VALUE=DATE:${endDate}
SUMMARY:CLOSED - Booked
UID:${booking._id}@rothschild79
END:VEVENT
`;
    }
    
    // סגירת קובץ iCal
    icalContent += 'END:VCALENDAR';
    
    // הגדרת כותרות התגובה
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="room-${roomNumber}.ics"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // שליחת הקובץ
    res.status(200).send(icalContent);
    
  } catch (error) {
    console.error('Error generating iCal file:', error);
    res.status(500).send('An error occurred while generating the iCal file');
  } finally {
    if (client) {
      await client.close();
    }
  }
}; 