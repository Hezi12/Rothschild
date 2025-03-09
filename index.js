const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json());

// סכמה של חדר
const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  // שדות נוספים שיכולים להיות שימושיים
});

// סכמה של הזמנה
const bookingSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  guestName: String,
  guestEmail: String,
  guestPhone: String,
  notes: String
});

// יצירת מודלים
const Room = mongoose.model('Room', roomSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// התחברות למסד הנתונים
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB התחברות למסד הנתונים נוצרה בהצלחה'))
  .catch(err => console.error('MongoDB שגיאה בהתחברות למסד הנתונים:', err));

// פונקציה שעוזרת לפרמט תאריכים לפורמט iCal
function formatIcalDate(date, includeTime = false) {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  
  let formattedDate = `${year}${month}${day}`;
  
  if (includeTime) {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    formattedDate += `T${hours}${minutes}${seconds}Z`;
  }
  
  return formattedDate;
}

// פונקציה ליצירת תוכן קובץ iCal
async function createIcalContent(roomId) {
  try {
    // מצא את החדר
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('החדר לא נמצא');
    }
    
    // מצא את כל ההזמנות לחדר זה
    const bookings = await Booking.find({ 
      roomId: roomId,
      checkOut: { $gte: new Date() } // רק הזמנות עתידיות או נוכחיות
    }).sort('checkIn');
    
    // יצירת קובץ iCal
    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Rothschild 79 Hotel//NONSGML v1.0//EN
CALSCALE:GREGORIAN
X-WR-CALNAME:Rothschild 79 - Room ${room.roomNumber}
METHOD:PUBLISH
`;

    // הוספת אירועים
    bookings.forEach(booking => {
      const uid = `booking-${booking._id}@rothschild79`;
      const now = formatIcalDate(new Date(), true);
      const checkIn = formatIcalDate(booking.checkIn);
      const checkOut = formatIcalDate(booking.checkOut);
      
      icalContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART;VALUE=DATE:${checkIn}
DTEND;VALUE=DATE:${checkOut}
SUMMARY:${booking.guestName || 'הזמנה'}
DESCRIPTION:${booking.notes || ''}`;

      if (booking.guestPhone) {
        icalContent += `\\nPhone: ${booking.guestPhone}`;
      }
      
      if (booking.guestEmail) {
        icalContent += `\\nEmail: ${booking.guestEmail}`;
      }
      
      icalContent += `
STATUS:CONFIRMED
END:VEVENT
`;
    });
    
    // סגירת קובץ iCal
    icalContent += `END:VCALENDAR`;
    
    return icalContent;
  } catch (error) {
    console.error('שגיאה ביצירת קובץ iCal:', error);
    throw error;
  }
}

// נקודת קצה להצגת קובץ iCal דינמי עבור חדר ספציפי
app.get('/calendar/:roomId.ics', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // יצירת תוכן ה-iCal
    const icalContent = await createIcalContent(roomId);
    
    // הגדרת סוג התוכן והחזרת הקובץ
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="room-calendar.ics"`);
    res.send(icalContent);
  } catch (error) {
    console.error('שגיאה בהצגת קובץ iCal:', error);
    res.status(500).send('שגיאה בשרת: ' + error.message);
  }
});

// נקודת קצה לקבצי iCal סטטיים
app.get('/ical/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'client/public/ical', filename);
  
  // שליחת הקובץ עם ה-headers הנכונים
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.sendFile(filePath, err => {
    if (err) {
      console.error('שגיאה בשליחת קובץ iCal סטטי:', err);
      res.status(404).send('הקובץ לא נמצא');
    }
  });
});

// ניתוב עבור כל שאר הבקשות לקליינט
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`השרת פועל בפורט ${PORT}`);
}); 