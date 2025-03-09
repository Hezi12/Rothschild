const ical = require('ical-generator');
const Booking = require('../../models/Booking');
const BlockedDate = require('../../models/BlockedDate');
const Room = require('../../models/Room');

/**
 * יוצר קובץ iCal עבור חדר ספציפי
 * @param {String} roomId - מזהה החדר
 * @returns {Promise<Object>} - אובייקט iCal
 */
const generateRoomCalendar = async (roomId) => {
  try {
    // מצא את החדר
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('החדר לא נמצא');
    }

    // יצירת אובייקט iCal חדש
    const calendar = ical({
      prodId: `//מלונית רוטשילד 79//חדר ${room.roomNumber}//HE`,
      name: `מלונית רוטשילד 79 - חדר ${room.roomNumber}`,
      timezone: 'Asia/Jerusalem',
      ttl: 60 * 60 * 3 // 3 שעות
    });

    // מציאת כל ההזמנות לחדר זה
    const bookings = await Booking.find({
      'room': roomId,
      'paymentStatus': { $ne: 'בוטל' } // לא כולל הזמנות מבוטלות
    }).sort({ checkIn: 1 });

    // הוספת הזמנות ליומן
    for (const booking of bookings) {
      calendar.createEvent({
        start: new Date(booking.checkIn),
        end: new Date(booking.checkOut),
        summary: `הזמנה - ${booking.guest.firstName} ${booking.guest.lastName}`,
        description: `שם: ${booking.guest.firstName} ${booking.guest.lastName}\nטלפון: ${booking.guest.phone}\nאימייל: ${booking.guest.email}\nסטטוס תשלום: ${booking.paymentStatus}\nהערות: ${booking.notes || ''}`,
        location: `חדר ${room.roomNumber}, מלונית רוטשילד 79`,
        url: `https://rothschild-gamma.vercel.app/dashboard/bookings`,
        uid: `booking-${booking._id}@rothschild79`
      });
    }

    // מציאת כל החסימות לחדר זה
    const blockedDates = await BlockedDate.find({
      'room': roomId
    }).sort({ startDate: 1 });

    // הוספת חסימות ליומן
    for (const block of blockedDates) {
      // לא כולל חסימות מבוקינג.קום (כדי למנוע כפילות)
      if (block.externalSource !== 'booking.com') {
        calendar.createEvent({
          start: new Date(block.startDate),
          end: new Date(block.endDate),
          summary: `CLOSED - ${block.reason || 'חדר חסום'}`,
          description: `סיבה: ${block.reason || 'לא צוינה סיבה'}\n${block.guestDetails?.notes || ''}`,
          location: `חדר ${room.roomNumber}, מלונית רוטשילד 79`,
          uid: `block-${block._id}@rothschild79`
        });
      }
    }

    return calendar;
  } catch (error) {
    console.error(`שגיאה ביצירת יומן לחדר ${roomId}:`, error);
    throw error;
  }
};

/**
 * יוצר קובץ iCal עבור חדר לפי מספר החדר
 * @param {Number} roomNumber - מספר החדר
 * @returns {Promise<Object>} - אובייקט iCal
 */
const generateCalendarByRoomNumber = async (roomNumber) => {
  try {
    // מצא את החדר לפי מספר
    const room = await Room.findOne({ roomNumber: parseInt(roomNumber) });
    if (!room) {
      throw new Error(`חדר מספר ${roomNumber} לא נמצא`);
    }

    return generateRoomCalendar(room._id);
  } catch (error) {
    console.error(`שגיאה ביצירת יומן לחדר מספר ${roomNumber}:`, error);
    throw error;
  }
};

module.exports = {
  generateRoomCalendar,
  generateCalendarByRoomNumber
}; 