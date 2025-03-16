/**
 * פונקציות עזר לבדיקת זמינות חדרים
 */

const Booking = require('../models/Booking');

/**
 * בדיקה אם חדר זמין בתאריכים מסוימים
 * @param {string} roomId מזהה החדר
 * @param {string} checkIn תאריך צ'ק-אין
 * @param {string} checkOut תאריך צ'ק-אאוט
 * @returns {Promise<boolean>} האם החדר זמין בתאריכים אלה
 */
exports.isAvailable = async (roomId, checkIn, checkOut) => {
  try {
    console.log(`בדיקת זמינות לחדר ${roomId} בתאריכים ${checkIn} עד ${checkOut}`);
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    console.log(`תאריכי בדיקה מעובדים: צ'ק-אין ${checkInDate.toISOString()}, צ'ק-אאוט ${checkOutDate.toISOString()}`);
    
    // בדיקה אם יש הזמנות חופפות
    const query = {
      $or: [
        // הזמנה רגילה (חדר בודד)
        {
          room: roomId,
          status: { $ne: 'canceled' },
          $or: [
            // צ'ק-אין בתוך תקופת הזמנה קיימת
            { 
              checkIn: { $lt: checkOutDate },
              checkOut: { $gt: checkInDate }
            }
          ]
        },
        // הזמנה מרובת חדרים
        {
          rooms: roomId,
          status: { $ne: 'canceled' },
          $or: [
            // צ'ק-אין בתוך תקופת הזמנה קיימת
            { 
              checkIn: { $lt: checkOutDate },
              checkOut: { $gt: checkInDate }
            }
          ]
        }
      ]
    };
    
    console.log(`שאילתת בדיקת זמינות: ${JSON.stringify(query)}`);
    
    const overlappingBookings = await Booking.find(query);
    
    console.log(`נמצאו ${overlappingBookings.length} הזמנות חופפות לחדר ${roomId}`);
    
    if (overlappingBookings.length > 0) {
      console.log(`פרטי הזמנות חופפות: ${JSON.stringify(overlappingBookings.map(booking => ({
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        isMultiRoom: booking.isMultiRoomBooking,
        room: booking.room,
        rooms: booking.rooms
      })))}`);
    }
    
    // אם אין הזמנות חופפות, החדר זמין
    return overlappingBookings.length === 0;
  } catch (error) {
    console.error('שגיאה בבדיקת זמינות:', error);
    throw new Error('שגיאה בבדיקת זמינות החדר');
  }
};

/**
 * חישוב מע"מ ומחיר סופי
 * @param {number} basePrice מחיר בסיס
 * @param {boolean} isTourist האם מדובר בתייר
 * @returns {Object} פרטי המחיר
 */
exports.calculateVatAndTotalPrice = (basePrice, isTourist) => {
  const vatRate = 18;
  const vatAmount = isTourist ? 0 : basePrice * (vatRate / 100);
  const totalPrice = basePrice + vatAmount;
  
  return {
    vatRate,
    vatAmount,
    totalPrice
  };
}; 