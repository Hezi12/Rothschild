const ical = require('node-ical');
const axios = require('axios');
const BlockedDate = require('../../models/BlockedDate');
const Booking = require('../../models/Booking');
const Room = require('../../models/Room');

/**
 * שירות לסנכרון נתונים מיומני iCal חיצוניים (כגון Booking.com)
 */
class ICalService {
  /**
   * מוריד ומפרסר קובץ iCal מה-URL שסופק
   * @param {string} url - כתובת ה-iCal לסנכרון
   * @returns {Promise<Object>} - רשימת האירועים מה-iCal
   */
  async fetchAndParseICal(url) {
    try {
      // הורדת קובץ ה-iCal
      const response = await axios.get(url);
      
      // פרסור קובץ ה-iCal
      const icalData = await ical.parseICS(response.data);
      
      return icalData;
    } catch (error) {
      console.error('שגיאה בהורדת או בפרסור קובץ ה-iCal:', error);
      throw error;
    }
  }

  /**
   * מחלץ פרטי אורח מהסיכום ומהתיאור של אירוע
   * @param {Object} event - האירוע מה-iCal
   * @returns {Object} - פרטי האורח שחולצו
   */
  extractGuestDetails(event) {
    const guestDetails = {
      name: '',
      email: '',
      phone: '',
      notes: ''
    };
    
    // נסה לחלץ מידע משדה הסיכום
    if (event.summary) {
      // בדרך כלל בפורמט: "RESERVATION - [שם האורח]"
      const summaryMatch = event.summary.match(/RESERVATION\s*-\s*(.+)/i);
      if (summaryMatch && summaryMatch[1]) {
        guestDetails.name = summaryMatch[1].trim();
      } else if (event.summary.includes('CLOSED')) {
        // אם זו חסימה של החדר ולא הזמנה
        guestDetails.name = 'חדר חסום';
      } else {
        // אם אין פורמט מוכר, השתמש בכל הסיכום כשם
        guestDetails.name = event.summary.trim();
      }
    }
    
    // נסה לחלץ מידע משדה התיאור, אם קיים
    if (event.description) {
      // חיפוש טלפון (פורמט כללי של מספרים)
      const phoneMatch = event.description.match(/(?:Phone|טלפון|Tel):\s*([\d\s\+\-\(\)\.]{7,20})/i);
      if (phoneMatch && phoneMatch[1]) {
        guestDetails.phone = phoneMatch[1].trim();
      }
      
      // חיפוש אימייל
      const emailMatch = event.description.match(/(?:Email|אימייל|דוא"ל):\s*([^\s]+@[^\s]+\.[^\s]+)/i);
      if (emailMatch && emailMatch[1]) {
        guestDetails.email = emailMatch[1].trim();
      }
      
      // שאר הטקסט שמור כהערות
      guestDetails.notes = event.description.trim();
    }
    
    return guestDetails;
  }

  /**
   * מסנכרן אירועי iCal מ-Booking.com עבור חדר ספציפי
   * @param {string} roomId - המזהה של החדר
   * @returns {Promise<Object>} - תוצאות הסנכרון
   */
  async syncRoomBookings(roomId) {
    try {
      // מציאת החדר
      const room = await Room.findById(roomId);
      
      if (!room) {
        throw new Error('החדר לא נמצא');
      }
      
      if (!room.iCalUrl) {
        throw new Error('החדר אינו מקושר ליומן iCal');
      }
      
      // הורדה ופרסור של הנתונים
      const icalData = await this.fetchAndParseICal(room.iCalUrl);
      
      // סופרים את האירועים שנוספו או עודכנו
      let addedEvents = 0;
      let externalReference;
      
      // עבור כל אירוע ביומן
      for (const [uid, event] of Object.entries(icalData)) {
        // מתעלמים מאירועים שאינם אירועי הזמנה או חסימה
        if (event.type !== 'VEVENT') continue;
        
        // חילוץ תאריך התחלה וסיום
        const startDate = event.start;
        const endDate = event.end || new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // אם אין תאריך סיום, מניחים יום אחד
        
        // חילוץ פרטי אורח
        const guestDetails = this.extractGuestDetails(event);
        
        // יצירת מזהה ייחודי עבור האירוע החיצוני
        externalReference = `booking.com:${uid}`;
        
        // בדיקה אם האירוע כבר קיים במערכת
        const existingBlockedDate = await BlockedDate.findOne({
          room: roomId,
          externalReference
        });
        
        // הכנת המידע לאחסון
        const blockedDateData = {
          startDate,
          endDate,
          reason: `הזמנה מ-Booking.com: ${event.summary || 'אין פרטים נוספים'}`,
          externalSource: 'booking.com',
          guestDetails
        };
        
        // אם האירוע כבר קיים, עדכן אותו אם צריך
        if (existingBlockedDate) {
          if (
            existingBlockedDate.startDate.getTime() !== startDate.getTime() ||
            existingBlockedDate.endDate.getTime() !== endDate.getTime() ||
            existingBlockedDate.guestDetails.name !== guestDetails.name ||
            existingBlockedDate.guestDetails.phone !== guestDetails.phone ||
            existingBlockedDate.guestDetails.email !== guestDetails.email
          ) {
            // עדכון כל השדות
            existingBlockedDate.startDate = startDate;
            existingBlockedDate.endDate = endDate;
            existingBlockedDate.reason = blockedDateData.reason;
            existingBlockedDate.externalSource = blockedDateData.externalSource;
            existingBlockedDate.guestDetails = blockedDateData.guestDetails;
            
            await existingBlockedDate.save();
            addedEvents++;
          }
        } else {
          // אם האירוע לא קיים, יצירת חסימה חדשה
          const newBlockedDate = new BlockedDate({
            room: roomId,
            ...blockedDateData,
            externalReference
          });
          
          await newBlockedDate.save();
          addedEvents++;
        }
      }
      
      // עדכון זמן הסנכרון האחרון
      room.lastSyncedAt = new Date();
      await room.save();
      
      return {
        success: true,
        addedEvents,
        icalUrl: room.iCalUrl,
        syncTime: room.lastSyncedAt
      };
    } catch (error) {
      console.error(`שגיאה בסנכרון הזמנות לחדר ${roomId}:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * מסנכרן אירועי iCal עבור כל החדרים שיש להם URL של iCal
   * @returns {Promise<Object>} - תוצאות הסנכרון
   */
  async syncAllRooms() {
    try {
      // מציאת כל החדרים עם URL של iCal
      const rooms = await Room.find({ iCalUrl: { $ne: '' } });
      
      if (rooms.length === 0) {
        return {
          success: true,
          message: 'אין חדרים עם יומני iCal לסנכרון',
          roomsProcessed: 0
        };
      }
      
      const results = [];
      
      // סנכרון כל חדר
      for (const room of rooms) {
        const result = await this.syncRoomBookings(room._id);
        results.push({
          roomNumber: room.roomNumber,
          ...result
        });
      }
      
      return {
        success: true,
        roomsProcessed: rooms.length,
        results
      };
    } catch (error) {
      console.error('שגיאה בסנכרון כל החדרים:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ICalService(); 