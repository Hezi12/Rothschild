const { MongoClient } = require('mongodb');
require('dotenv').config();

// פונקציית עזר לפורמט תאריכים ל-iCal
const formatICalDate = (date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0];
};

// פונקציית API חדשה ל-Vercel Serverless
module.exports = async (req, res) => {
  console.log('iCal API called', { 
    url: req.url, 
    query: req.query, 
    method: req.method
  });
  
  // אפשר CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // קבלת מספר החדר מ-URL
  const roomNumber = req.query.roomNumber || req.url.split('/').pop().replace('room-', '').replace('.ics', '');
  console.log('Room number extracted:', roomNumber);
  
  // וידוא שיש מספר חדר
  if (!roomNumber) {
    console.log('Missing room number');
    return res.status(400).send('Missing room number');
  }

  // התחברות למסד הנתונים
  let client;
  try {
    console.log('Attempting to connect to MongoDB with URI:', 
      process.env.MONGODB_URI ? 'URI exists' : 'URI is missing');
    
    client = new MongoClient(process.env.MONGODB_URI);
    console.log('MongoDB client created');
    
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const roomsCollection = db.collection('rooms');
    const bookingsCollection = db.collection('bookings');
    
    // מציאת החדר לפי מספר
    console.log('Looking for room with number:', roomNumber);
    const room = await roomsCollection.findOne({ roomNumber: parseInt(roomNumber) });
    
    if (!room) {
      console.log(`Room number ${roomNumber} not found`);
      return res.status(404).send(`Room number ${roomNumber} not found`);
    }
    
    console.log('Room found:', room._id);
    
    // יצירת בסיס קובץ iCal
    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Rothschild79//Room ${roomNumber}//HE
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;
    
    // מציאת הזמנות לחדר זה
    console.log('Looking for bookings for room:', room._id);
    const bookings = await bookingsCollection.find({ 
      'room': room._id,
      'paymentStatus': { $ne: 'בוטל' }
    }).toArray();
    
    console.log(`Found ${bookings.length} bookings`);
    
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
    
    console.log('Sending iCal response');
    // שליחת הקובץ
    res.status(200).send(icalContent);
    
  } catch (error) {
    console.error('Error generating iCal file:', error);
    res.status(500).send('An error occurred while generating the iCal file: ' + error.message);
  } finally {
    if (client) {
      try {
        await client.close();
        console.log('MongoDB connection closed');
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
      }
    }
  }
}; 