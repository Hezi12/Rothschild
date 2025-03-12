const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const DynamicPrice = require('../models/DynamicPrice');
const cloudinary = require('../config/cloudinary');

// פונקציה לחישוב מחיר עם מחירים מיוחדים
const calculatePriceWithSpecialPrices = (room, checkInDate, nights) => {
  let totalNightsPrice = 0;
  let hasSpecialPrices = false;
  
  // אם יש מחירים מיוחדים, חשב לפי ימים
  if (room.specialPrices && room.specialPrices.size > 0) {
    console.log('נמצאו מחירים מיוחדים לחדר:', Object.fromEntries(room.specialPrices));
    
    // הכנת תאריכים לחישוב
    const dates = [];
    const startDate = new Date(checkInDate);
    
    // יצירת מערך של כל התאריכים בשהות
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      dates.push(currentDate);
    }
    
    // חישוב מחיר לפי ימים
    for (const date of dates) {
      const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
      
      // בדיקה אם יש מחיר מיוחד ליום זה
      if (room.specialPrices.has(dayOfWeek)) {
        const specialPrice = room.specialPrices.get(dayOfWeek);
        console.log(`מחיר מיוחד ליום ${dayOfWeek} (${date.toLocaleDateString()}): ${specialPrice}₪`);
        totalNightsPrice += specialPrice;
        hasSpecialPrices = true;
      } else {
        console.log(`מחיר רגיל ליום ${dayOfWeek} (${date.toLocaleDateString()}): ${room.basePrice}₪`);
        totalNightsPrice += room.basePrice;
      }
    }
  } else {
    console.log('לא נמצאו מחירים מיוחדים, משתמש במחיר בסיס:', room.basePrice);
    totalNightsPrice = room.basePrice * nights;
  }
  
  return { totalNightsPrice, hasSpecialPrices };
};

// פונקציה לחישוב מע"מ ומחיר סופי
const calculateVatAndTotalPrice = (basePrice, isTourist = false, vatRate = 18) => {
  const vatAmount = isTourist ? 0 : (basePrice * vatRate / 100);
  const totalPrice = basePrice + vatAmount;
  
  return {
    basePrice,
    vatRate,
    vatAmount: Math.round(vatAmount * 100) / 100, // עיגול לשתי ספרות אחרי הנקודה
    totalPrice: Math.round(totalPrice * 100) / 100, // עיגול לשתי ספרות אחרי הנקודה
  };
};

// @desc    קבלת כל החדרים
// @route   GET /api/rooms
// @access  Public
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true });
    
    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('שגיאה בקבלת חדרים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    קבלת חדר לפי מזהה
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('שגיאה בקבלת חדר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    יצירת חדר חדש
// @route   POST /api/rooms
// @access  Private/Admin
exports.createRoom = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  const {
    roomNumber,
    type,
    description,
    basePrice,
    maxOccupancy,
    amenities,
    images,
    isActive
  } = req.body;
  
  try {
    // בדיקה אם כבר קיים חדר עם אותו מספר
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: `חדר עם מספר ${roomNumber} כבר קיים במערכת`
      });
    }
    
    // יצירת חדר חדש
    const room = new Room({
      roomNumber,
      type,
      description,
      basePrice,
      maxOccupancy,
      amenities,
      images,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await room.save();
    
    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('שגיאה ביצירת חדר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    עדכון חדר
// @route   PUT /api/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res) => {
  try {
    console.log('נתוני עדכון חדר שהתקבלו:', req.body);
    
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    // אם מספר החדר השתנה, בדוק שאין חדר עם המספר החדש
    if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ roomNumber: req.body.roomNumber });
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: `חדר עם מספר ${req.body.roomNumber} כבר קיים במערכת`
        });
      }
    }
    
    // וידוא שיש מחיר בסיס תקף
    if (req.body.basePrice === undefined || req.body.basePrice === null) {
      req.body.basePrice = 400; // ברירת מחדל אם לא צוין
    }
    
    // טיפול במפת מחירים מיוחדים
    if (req.body.specialPrices && typeof req.body.specialPrices === 'object' && !Array.isArray(req.body.specialPrices)) {
      console.log('מחירים מיוחדים שהתקבלו:', req.body.specialPrices);
      
      // יצירת מפה חדשה או שימוש במפה הקיימת
      const updatedSpecialPrices = room.specialPrices || new Map();
      
      // ניקוי המפה הקיימת אם מעדכנים את כל הערכים
      if (Object.keys(req.body.specialPrices).length > 0) {
        // נזכור את ערכי המפה הקיימת לפני הריקון
        const oldValues = Object.fromEntries(updatedSpecialPrices);
        console.log('ערכי מפת מחירים מיוחדים לפני עדכון:', oldValues);
        
        // ריקון המפה אם נשלח עדכון מלא
        updatedSpecialPrices.clear();
      }
      
      // עדכון או הוספת ערכים חדשים למפה
      for (const [key, value] of Object.entries(req.body.specialPrices)) {
        if (value !== null && value !== undefined) {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            console.log(`עדכון מחיר מיוחד: ${key} = ${numValue}`);
            updatedSpecialPrices.set(key, numValue);
          } else {
            console.warn(`ערך לא תקף למחיר מיוחד: ${key} = ${value}`);
          }
        }
      }
      
      console.log('מפת מחירים מיוחדים לאחר עדכון:', Object.fromEntries(updatedSpecialPrices));
      
      // שמירת המפה המעודכנת באובייקט הבקשה
      req.body.specialPrices = updatedSpecialPrices;
    }
    
    // עדכון הנתונים
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: updatedRoom
    });
  } catch (error) {
    console.error('שגיאה מפורטת בעדכון חדר:', error);
    
    let errorMessage = 'שגיאת שרת';
    
    if (error.name === 'ValidationError') {
      errorMessage = 'שגיאת אימות נתונים: ' + Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.name === 'CastError') {
      errorMessage = 'ערך לא תקין: ' + error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

// @desc    מחיקת חדר
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    // בדיקה אם יש הזמנות עתידיות לחדר זה
    const futureBookings = await Booking.find({
      room: req.params.id,
      checkOut: { $gte: new Date() },
      status: { $ne: 'canceled' }
    });
    
    if (futureBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'לא ניתן למחוק את החדר כיוון שיש לו הזמנות עתידיות'
      });
    }
    
    await room.deleteOne();
    
    res.json({
      success: true,
      message: 'החדר נמחק בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה במחיקת חדר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    בדיקת זמינות חדר בתאריכים מסוימים
// @route   POST /api/rooms/check-availability
// @access  Public
exports.checkAvailability = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, guests: guestsParam, rooms: roomsParam, isTourist = false } = req.body;
    
    // וידוא שמספר האורחים הוא מספר ולא מחרוזת
    const guests = Number(guestsParam) || 1;
    
    // וידוא שמספר החדרים הוא מספר ולא מחרוזת
    const rooms = Number(roomsParam) || 1;
    
    console.log('בדיקת זמינות:', { roomId, checkIn, checkOut, guests, rooms, isTourist });
    
    console.log('סוג של guests:', typeof guests, 'ערך:', guests);
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // חישוב מספר הלילות
    const nights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    if (roomId) {
      // בדיקת זמינות לחדר ספציפי
      const room = await Room.findById(roomId);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'החדר לא נמצא'
        });
      }
      
      // בדיקת תפוסה
      if (guests > room.maxOccupancy) {
        return res.json({
          success: true,
          isAvailable: false,
          reason: `החדר מתאים לעד ${room.maxOccupancy} אורחים`,
          room: {
            id: room._id,
            roomNumber: room.roomNumber,
            basePrice: room.basePrice,
            maxOccupancy: room.maxOccupancy
          }
        });
      }
      
      // בדיקה אם יש הזמנות חופפות
      const overlappingBookings = await Booking.find({
        room: roomId,
        status: { $ne: 'canceled' },
        $or: [
          // צ'ק-אין בתוך תקופת הזמנה קיימת
          { 
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
          }
        ]
      });
      
      // אם יש הזמנות חופפות, החדר לא זמין
      if (overlappingBookings.length > 0) {
        return res.json({
          success: true,
          isAvailable: false,
          reason: 'קיימת הזמנה בתאריכים אלה',
          room: {
            id: room._id,
            roomNumber: room.roomNumber,
            basePrice: room.basePrice,
            maxOccupancy: room.maxOccupancy
          }
        });
      }
      
      // חישוב מחיר עם מחירים מיוחדים
      const { totalNightsPrice, hasSpecialPrices } = exports.calculatePriceWithSpecialPrices(room, checkInDate, nights);
      
      // חישוב מחיר סופי עם מע"מ
      const priceDetails = exports.calculateVatAndTotalPrice(totalNightsPrice, isTourist);
      
      return res.json({
        success: true,
        isAvailable: true,
        room: {
          id: room._id,
          roomNumber: room.roomNumber,
          basePrice: room.basePrice,
          maxOccupancy: room.maxOccupancy
        },
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        basePrice: room.basePrice,
        nightsTotal: totalNightsPrice,
        hasSpecialPrices: hasSpecialPrices,
        vatRate: priceDetails.vatRate,
        vatAmount: priceDetails.vatAmount,
        totalPrice: priceDetails.totalPrice
      });
    } else {
      // אם לא סופק חדר ספציפי, בדוק את כל החדרים הזמינים
      console.log(`מחפש חדרים למספר אורחים: ${guests}`);
      
      let query = { isActive: true };
      
      // אם מחפשים רק חדר אחד, אז צריך שיתאים לכל האורחים
      // אם מחפשים מספר חדרים, אז מציגים את כל החדרים הפעילים ונמיין/נפלטר אחר כך
      if (rooms === 1) {
        query.maxOccupancy = { $gte: guests }; // מציג רק חדרים שמתאימים למספר האורחים או יותר
      }
      
      console.log('שאילתת חיפוש חדרים:', query);
      
      const allRooms = await Room.find(query);
      
      console.log(`נמצאו ${allRooms.length} חדרים שמתאימים לקריטריון תפוסה ${guests} אורחים`);
      console.log('רשימת סוגי חדרים שנמצאו:', allRooms.map(r => ({ roomNumber: r.roomNumber, type: r.type, maxOccupancy: r.maxOccupancy })));
      
      // בדיקת זמינות כל החדרים
      const availableRooms = [];
      
      for (const room of allRooms) {
        // בדיקה אם החדר פנוי
        const overlappingBookings = await Booking.find({
          room: room._id,
          status: { $ne: 'canceled' },
          $or: [
            // צ'ק-אין בתוך תקופת הזמנה קיימת
            { 
              checkIn: { $lt: checkOutDate },
              checkOut: { $gt: checkInDate }
            }
          ]
        });
        
        // אם אין הזמנות חופפות, החדר זמין
        if (overlappingBookings.length === 0) {
          // חישוב מחיר עם מחירים מיוחדים
          const { totalNightsPrice, hasSpecialPrices } = exports.calculatePriceWithSpecialPrices(room, checkInDate, nights);
          
          // חישוב מחיר סופי עם מע"מ
          const priceDetails = exports.calculateVatAndTotalPrice(totalNightsPrice, isTourist);
          
          // הוספת החדר לרשימת החדרים הזמינים
          availableRooms.push({
            _id: room._id,
            roomNumber: room.roomNumber,
            type: room.type,
            name: room.name,
            description: room.description,
            basePrice: room.basePrice,
            amenities: room.amenities,
            images: room.images,
            maxGuests: room.maxOccupancy,
            hasSpecialPrices: hasSpecialPrices,
            nightsTotal: totalNightsPrice,
            vatRate: priceDetails.vatRate,
            vatAmount: priceDetails.vatAmount,
            totalPrice: priceDetails.totalPrice
          });
        }
      }
      
      console.log(`נמצאו ${availableRooms.length} חדרים זמינים בתאריכים הנבחרים`);
      
      let filteredRooms = availableRooms;
      
      // קבלת מספר החדרים המבוקש
      const requestedRoomsCount = rooms || 1;
      
      // טיפול במקרה שמחפשים יותר מחדר אחד
      if (requestedRoomsCount > 1) {
        console.log(`מספר חדרים מבוקש: ${requestedRoomsCount}, מתאים את הסינון`);
        
        // אם מחפשים לאדם אחד או שניים, אבל כמה חדרים, יש להשאיר יותר מחדר אחד מכל סוג
        if (guests <= 2) {
          const roomsByType = {};
          
          // קיבוץ החדרים לפי סוג 
          availableRooms.forEach(room => {
            if (!roomsByType[room.type]) {
              roomsByType[room.type] = [];
            }
            roomsByType[room.type].push(room);
          });
          
          // מיון כל קבוצת חדרים מאותו סוג לפי מחיר
          for (const type in roomsByType) {
            roomsByType[type].sort((a, b) => a.totalPrice - b.totalPrice);
          }
          
          // בניית מערך עם מספר מספיק של חדרים מכל סוג
          let typeFilteredRooms = [];
          for (const type in roomsByType) {
            // לוקח את מספר החדרים הנדרש או את כל החדרים מהסוג הזה אם יש פחות
            const roomsOfType = roomsByType[type].slice(0, requestedRoomsCount);
            typeFilteredRooms = [...typeFilteredRooms, ...roomsOfType];
          }
          
          // מיון סופי לפי מחיר
          typeFilteredRooms.sort((a, b) => a.totalPrice - b.totalPrice);
          
          console.log(`לאחר סינון לפי סוג וכמות חדרים נשארו ${typeFilteredRooms.length} חדרים`);
          console.log('חדרים לאחר סינון לפי סוג:', typeFilteredRooms.map(r => ({ roomNumber: r.roomNumber, type: r.type, maxGuests: r.maxGuests, totalPrice: r.totalPrice })));
          
          filteredRooms = typeFilteredRooms;
        } else {
          // עבור 3 אורחים ומעלה שצריכים מספר חדרים, צריך לחפש שילובים מתאימים
          console.log(`מחפשים ${requestedRoomsCount} חדרים ל-${guests} אורחים`);
          
          // מיון החדרים לפי גודל ומחיר
          const sortedRooms = [...filteredRooms].sort((a, b) => {
            // קודם לפי כמות אנשים בחדר (מהגדול לקטן) ואז לפי מחיר (מהזול ליקר)
            if (b.maxGuests !== a.maxGuests) {
              return b.maxGuests - a.maxGuests;
            }
            return a.totalPrice - b.totalPrice;
          });
          
          // חיפוש שילובים של שני חדרים שיחד מספיקים לכל האורחים
          const combinations = [];
          
          // לכל חדר, בדוק האם יש חדר נוסף שיכול להשלים אותו לכמות האורחים הנדרשת
          for (let i = 0; i < sortedRooms.length; i++) {
            const room1 = sortedRooms[i];
            
            // אם צריך חדר שני, חפש את החדר השני
            for (let j = 0; j < sortedRooms.length; j++) {
              // לא לשלב חדר עם עצמו
              if (i === j) continue;
              
              const room2 = sortedRooms[j];
              
              // בדוק אם שני החדרים יחד מספיקים לכל האורחים
              if (room1.maxGuests + room2.maxGuests >= guests) {
                combinations.push({
                  rooms: [room1, room2],
                  totalCapacity: room1.maxGuests + room2.maxGuests,
                  totalPrice: room1.totalPrice + room2.totalPrice,
                  surplus: (room1.maxGuests + room2.maxGuests) - guests // כמה מקומות עודפים
                });
              }
            }
          }
          
          // מיון השילובים לפי עודף מקומות (עדיף פחות עודף) ואז לפי מחיר
          combinations.sort((a, b) => {
            // קודם לפי מספר המקומות העודפים - רצוי פחות עודף
            if (a.surplus !== b.surplus) {
              return a.surplus - b.surplus;
            }
            // אם העודף זהה, מיין לפי מחיר
            return a.totalPrice - b.totalPrice;
          });
          
          console.log(`נמצאו ${combinations.length} שילובי חדרים אפשריים ל-${guests} אורחים`);
          
          if (combinations.length > 0) {
            // לוקח את 5 השילובים הטובים ביותר
            const bestCombinations = combinations.slice(0, 5);
            console.log('שילובים מומלצים:', bestCombinations.map(c => ({
              rooms: c.rooms.map(r => r.roomNumber),
              totalCapacity: c.totalCapacity,
              totalPrice: c.totalPrice
            })));
            
            // החזר את כל החדרים שמופיעים בשילובים המומלצים
            const recommendedRoomIds = new Set();
            bestCombinations.forEach(c => {
              c.rooms.forEach(r => recommendedRoomIds.add(r._id.toString()));
            });
            
            // אם יש שילובים, עדכן את רשימת החדרים המומלצת
            filteredRooms = sortedRooms.filter(r => recommendedRoomIds.has(r._id.toString()));
            
            // הוסף מידע על שילובים מומלצים לתשובה
            return res.json({
              success: true,
              data: filteredRooms,
              combinations: bestCombinations.map(c => ({
                rooms: c.rooms.map(r => r.roomNumber),
                totalCapacity: c.totalCapacity,
                totalPrice: c.totalPrice
              })),
              message: `נמצאו ${bestCombinations.length} שילובי חדרים מתאימים ל-${guests} אורחים ב-${requestedRoomsCount} חדרים`
            });
          }
          
          // אם לא נמצאו שילובים מתאימים, החזר את כל החדרים ממוינים
          // למיין קודם לפי התאמה למספר האורחים ולאחר מכן לפי מחיר
          filteredRooms.sort((a, b) => {
            // תפוסה טובה יותר קודמת (קרובה יותר למספר האורחים)
            const fitDiff = Math.abs(a.maxGuests - guests) - Math.abs(b.maxGuests - guests);
            if (fitDiff !== 0) return fitDiff;
            
            // אם התפוסה זהה, מיין לפי מחיר
            return a.totalPrice - b.totalPrice;
          });
        }
      } else {
        // מיון החדרים עבור 1-2 אורחים כשמחפשים חדר אחד בלבד
        if (guests <= 2) {
          console.log(`מספר אורחים ${guests} <= 2, מפעיל פילטור לחדר אחד לכל סוג`);
          
          // קיבוץ החדרים לפי סוג ובחירת הזול ביותר מכל סוג
          const roomTypeMap = {};
          
          // הקבצת החדרים לפי סוג
          availableRooms.forEach(room => {
            if (!roomTypeMap[room.type] || room.totalPrice < roomTypeMap[room.type].totalPrice) {
              roomTypeMap[room.type] = room;
            }
          });
          
          // המרה של מפת החדרים בחזרה למערך
          filteredRooms = Object.values(roomTypeMap);
          
          console.log(`לאחר פילטור נשארו ${filteredRooms.length} חדרים, אחד מכל סוג`);
          console.log('חדרים לאחר פילטור:', filteredRooms.map(r => ({ roomNumber: r.roomNumber, type: r.type, maxGuests: r.maxGuests, totalPrice: r.totalPrice })));
          
          // מיון לפי מחיר
          filteredRooms.sort((a, b) => a.totalPrice - b.totalPrice);
        } else {
          console.log(`מספר אורחים ${guests} > 2, מפעיל מיון לפי התאמה והתפוסה הקרובה`);
          
          // מיון לפי תפוסה והתאמה לאורחים ואז לפי מחיר
          filteredRooms.sort((a, b) => {
            // תפוסה טובה יותר קודמת (קרובה יותר למספר האורחים)
            const fitDiff = Math.abs(a.maxGuests - guests) - Math.abs(b.maxGuests - guests);
            if (fitDiff !== 0) return fitDiff;
            
            // אם התפוסה זהה, מיין לפי מחיר
            return a.totalPrice - b.totalPrice;
          });
          
          console.log('חדרים לאחר מיון:', filteredRooms.map(r => ({ roomNumber: r.roomNumber, type: r.type, maxGuests: r.maxGuests, totalPrice: r.totalPrice })));
        }
      }
      
      return res.json({
        success: true,
        data: filteredRooms
      });
    }
  } catch (error) {
    console.error('שגיאה בבדיקת זמינות:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת'
    });
  }
};

// @desc    עדכון מחירים מיוחדים לפי ימי שבוע לחדר ספציפי
// @route   PUT /api/rooms/:id/special-prices
// @access  Private/Admin
exports.updateRoomSpecialPrices = async (req, res) => {
  try {
    const roomId = req.params.id;
    const { specialPrices } = req.body;

    console.log('עדכון מחירים מיוחדים:', {
      roomId,
      specialPrices
    });

    // וידוא שהחדר קיים
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'החדר לא נמצא'
      });
    }

    // עדכון מחירים מיוחדים
    if (!room.specialPrices) {
      room.specialPrices = new Map();
    }

    // עדכון או יצירה של מחירים מיוחדים לפי ימי שבוע
    for (const [day, priceInfo] of Object.entries(specialPrices)) {
      try {
        if (priceInfo && priceInfo.enabled && priceInfo.price > 0) {
          // המרה למספר
          const price = Number(priceInfo.price);
          if (isNaN(price)) {
            console.warn(`המחיר ${priceInfo.price} ליום ${day} אינו מספר תקף`);
            continue;
          }
          room.specialPrices.set(day, price);
        } else if (room.specialPrices.has(day)) {
          room.specialPrices.delete(day);
        }
      } catch (priceError) {
        console.error(`שגיאה בעיבוד מחיר מיוחד ליום ${day}:`, priceError);
      }
    }

    await room.save();

    res.json({
      success: true,
      specialPrices: Object.fromEntries(room.specialPrices),
      message: 'המחירים המיוחדים עודכנו בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה מפורטת בעדכון מחירים מיוחדים:', error);
    
    let errorMessage = 'שגיאת שרת';
    
    if (error.name === 'ValidationError') {
      errorMessage = 'שגיאת אימות נתונים: ' + Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.name === 'CastError') {
      errorMessage = 'ערך לא תקין: ' + error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

// @desc    קבלת מחירים מיוחדים לפי ימי שבוע לחדר ספציפי
// @route   GET /api/rooms/:id/special-prices
// @access  Private/Admin
exports.getRoomSpecialPrices = async (req, res) => {
  try {
    const roomId = req.params.id;

    // וידוא שהחדר קיים
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'החדר לא נמצא'
      });
    }

    // המרת המפה לאובייקט JSON רגיל
    const specialPricesObj = room.specialPrices ? Object.fromEntries(room.specialPrices) : {};
    console.log('מחירים מיוחדים שנשלחים ללקוח:', specialPricesObj);

    res.json({
      success: true,
      specialPrices: specialPricesObj
    });
  } catch (error) {
    console.error('שגיאה בקבלת מחירים מיוחדים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// Make the functions available for export
exports.calculatePriceWithSpecialPrices = calculatePriceWithSpecialPrices;
exports.calculateVatAndTotalPrice = calculateVatAndTotalPrice; 