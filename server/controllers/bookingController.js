const Booking = require('../models/Booking');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const { startOfDay, endOfDay, parseISO, format, addHours } = require('date-fns');
const { validationResult } = require('express-validator');
const { sendBookingConfirmation, sendBookingNotificationToAdmin } = require('../utils/emailService');
const DynamicPrice = require('../models/DynamicPrice');

/**
 * בקר חדש ומשופר להזמנות
 */

// פונקציה ליצירת מספר הזמנה חדש
const generateBookingNumber = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().substring(2);
    
    // מציאת המספר הגבוה ביותר השנה
    const highestBooking = await Booking.findOne(
      { bookingNumber: { $regex: `^${yearPrefix}` } },
      { bookingNumber: 1 }
    ).sort({ bookingNumber: -1 });
    
    // אם לא נמצאו הזמנות השנה - יצירת מספר התחלתי
    if (!highestBooking) {
      return `${yearPrefix}1001`;
    }
    
    // הפרדה בין תחילית השנה למספר הסידורי
    const currentNumber = parseInt(highestBooking.bookingNumber.substring(2));
    return `${yearPrefix}${currentNumber + 1}`;
  } catch (error) {
    console.error('שגיאה ביצירת מספר הזמנה:', error);
    // במקרה של שגיאה - שימוש במספר חד-ערכי מבוסס זמן
    return `${new Date().getTime().toString().substring(0, 10)}`;
  }
};

// מייצא את הפונקציה לשימוש במודולים אחרים
exports.generateBookingNumber = generateBookingNumber;

// @desc    פונקציית עזר לבדיקת זמינות חדר
// @access  Private (helper function)
const checkRoomAvailability = async (roomId, checkInDate, checkOutDate, excludeBookingId = null) => {
  try {
    console.log(`בדיקת זמינות חדר ${roomId} בתאריכים ${checkInDate} עד ${checkOutDate}${excludeBookingId ? `, מחריג הזמנה ${excludeBookingId}` : ''}`);
    
    // וידוא שהתאריכים הם אובייקטי Date ושהשעות מאופסות לחצות
    const checkIn = new Date(checkInDate);
    checkIn.setHours(0, 0, 0, 0);
    
    const checkOut = new Date(checkOutDate);
    checkOut.setHours(0, 0, 0, 0);
    
    console.log(`תאריכי בדיקה מעובדים: צ'ק-אין ${checkIn.toISOString()}, צ'ק-אאוט ${checkOut.toISOString()}`);
    
    // בניית שאילתה לבדיקת חפיפות בהזמנות רגילות (שדה room)
    const regularBookingQuery = {
      room: roomId,
      status: { $ne: 'canceled' },
      $or: [
        // בדיקת חפיפה: כל הזמנה שמסתיימת אחרי צ'ק אין וגם מתחילה לפני צ'ק אאוט
        { 
          checkIn: { $lt: checkOut },
          checkOut: { $gt: checkIn }
        }
      ]
    };
    
    // בניית שאילתה לבדיקת חפיפות בהזמנות מרובות חדרים (שדה rooms)
    const multiRoomBookingQuery = {
      rooms: roomId,
      status: { $ne: 'canceled' },
      $or: [
        // בדיקת חפיפה: כל הזמנה שמסתיימת אחרי צ'ק אין וגם מתחילה לפני צ'ק אאוט
        { 
          checkIn: { $lt: checkOut },
          checkOut: { $gt: checkIn }
        }
      ]
    };
    
    // אם יש מזהה הזמנה להחרגה, נוסיף אותו לשתי השאילתות
    if (excludeBookingId) {
      regularBookingQuery._id = { $ne: excludeBookingId };
      multiRoomBookingQuery._id = { $ne: excludeBookingId };
      console.log(`מחריג הזמנה ${excludeBookingId} מבדיקת הזמינות`);
    }
    
    console.log(`שאילתת בדיקת הזמנות רגילות: ${JSON.stringify(regularBookingQuery)}`);
    console.log(`שאילתת בדיקת הזמנות מרובות חדרים: ${JSON.stringify(multiRoomBookingQuery)}`);
    
    // בדיקה אם יש הזמנות חופפות (רגילות או מרובות חדרים)
    const regularOverlappingBookings = await Booking.find(regularBookingQuery);
    const multiRoomOverlappingBookings = await Booking.find(multiRoomBookingQuery);
    
    console.log(`נמצאו ${regularOverlappingBookings.length} הזמנות רגילות חופפות לחדר ${roomId}`);
    console.log(`נמצאו ${multiRoomOverlappingBookings.length} הזמנות מרובות חדרים חופפות לחדר ${roomId}`);
    
    if (regularOverlappingBookings.length > 0) {
      console.log(`פרטי הזמנות רגילות חופפות: ${JSON.stringify(regularOverlappingBookings.map(booking => ({
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut
      })))}`);
    }
    
    if (multiRoomOverlappingBookings.length > 0) {
      console.log(`פרטי הזמנות מרובות חדרים חופפות: ${JSON.stringify(multiRoomOverlappingBookings.map(booking => ({
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        rooms: booking.rooms
      })))}`);
    }
    
    const totalOverlappingBookings = regularOverlappingBookings.length + multiRoomOverlappingBookings.length;
    
    console.log(`בדיקת זמינות חדר ${roomId}: נמצאו ${totalOverlappingBookings} הזמנות חופפות בתאריכים ${checkIn} עד ${checkOut}`);
    
    return totalOverlappingBookings === 0;
  } catch (error) {
    console.error('שגיאה בבדיקת זמינות חדר:', error);
    throw error;
  }
};

// חישוב מחיר חדר לתקופה
const calculateRoomPrice = async (roomId, checkIn, checkOut) => {
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('החדר לא נמצא');
    }

    // תאריכי ביניים
    const dates = [];
    let currentDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    
    // מחיר כולל לחדר
    let totalPrice = 0;
    
    // יצירת מערך תאריכים בין תאריך ההגעה ליום לפני העזיבה
    while (currentDate < endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // לולאה על כל התאריכים לחישוב המחיר הסופי
    for (let date of dates) {
      // חיפוש מחיר דינמי ספציפי לתאריך
      const dynamicPrice = await DynamicPrice.findOne({
        room: roomId,
        date: {
          $gte: startOfDay(date),
          $lte: endOfDay(date)
        }
      });
      
      if (dynamicPrice) {
        // אם נמצא מחיר דינמי לתאריך, השתמש בו
        totalPrice += dynamicPrice.price;
      } else {
        // ללא מחיר דינמי, בדוק אם יש מחיר מיוחד ליום בשבוע
        const dayOfWeek = date.getDay(); // 0 = ראשון, 1 = שני, וכו'
        
        if (room.specialPrices && room.specialPrices.has(dayOfWeek.toString())) {
          totalPrice += parseFloat(room.specialPrices.get(dayOfWeek.toString()));
        } else {
          // אם אין מחיר דינמי או מחיר מיוחד ליום בשבוע, השתמש במחיר הבסיסי
          totalPrice += room.basePrice;
        }
      }
    }
    
    return totalPrice;
  } catch (error) {
    console.error('שגיאה בחישוב מחיר חדר:', error);
    throw error;
  }
};

// פונקציה לחישוב מע"מ ומחיר סופי
const calculateVatAndTotalPrice = (basePrice, isTourist = false, vatRate = 18) => {
  const vatAmount = isTourist ? 0 : (basePrice * vatRate / 100);
  const totalPrice = basePrice + vatAmount;
  
  return {
    basePrice,
    vatAmount: Math.round(vatAmount * 100) / 100, // עיגול לשתי ספרות אחרי הנקודה
    totalPrice, // מחזירים את המחיר הכולל ללא עיגול
    priceWithoutVat: basePrice
  };
};

// @desc    יצירת הזמנה חדשה
// @route   POST /api/bookings
// @access  Public
exports.createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  try {
    const {
      roomId,
      checkIn,
      checkOut,
      nights,
      totalPrice,
      pricePerNight,
      pricePerNightNoVat,
      guest,
      creditCard,
      status = 'confirmed',
      paymentStatus = 'pending',
      notes
    } = req.body;

    // לוג מפורט של הנתונים
    console.log('נתוני ההזמנה שהתקבלו - כרטיס אשראי:', creditCard);
    console.log('סוג נתוני כרטיס אשראי:', typeof creditCard);
    console.log('שדות כרטיס אשראי:', creditCard ? Object.keys(creditCard) : []);
    console.log('מחירים שהתקבלו:', { 
      totalPrice, 
      pricePerNight, 
      pricePerNightNoVat 
    });

    // וידוא שיש אובייקט כרטיס אשראי תקין
    const processedCreditCard = creditCard || {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    };

    console.log('כרטיס אשראי לאחר עיבוד:', processedCreditCard);

    // בדיקת קלט בסיסית
    if (!roomId || !checkIn || !checkOut || !guest) {
      return res.status(400).json({
        success: false,
        message: 'נא למלא את כל שדות החובה'
      });
    }

    // המרת התאריכים לאובייקט Date ואיפוס השעות לחצות
    let checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    let checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);

    console.log('תאריכים מתוקנים:', {
      checkInDate,
      checkOutDate
    });

    // בדיקה שהחדר קיים
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'החדר המבוקש לא נמצא'
      });
    }

    console.log('מצא חדר:', {
      roomId: room._id,
      roomNumber: room.roomNumber,
      basePrice: room.basePrice
    });

    // בדיקת זמינות החדר
    const isAvailable = await checkRoomAvailability(roomId, checkInDate, checkOutDate);
    if (!isAvailable) {
      console.error(`החדר ${roomId} אינו זמין בתאריכים ${checkInDate} עד ${checkOutDate}. הזמנה נדחתה.`);
      return res.status(400).json({
        success: false,
        message: 'החדר אינו זמין בתאריכים המבוקשים'
      });
    }
    
    console.log(`החדר ${roomId} זמין בתאריכים ${checkInDate} עד ${checkOutDate}. ממשיך ביצירת ההזמנה.`);

    // יצירת מספר הזמנה ייחודי
    const bookingNumber = await generateBookingNumber();

    // חישוב מספר לילות
    let calculatedNights = nights;
    if (!calculatedNights) {
      // חישוב לפי התאריכים
      const diffTime = Math.abs(checkOutDate - checkInDate);
      calculatedNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // התאמת אובייקט האורח בהתאם למבנה המצופה
    const guestData = {
      firstName: guest.firstName || (guest.name ? guest.name.split(' ')[0] : 'אורח'),
      lastName: guest.lastName || (guest.name ? guest.name.split(' ').slice(1).join(' ') : 'ללא שם'),
      email: guest.email || '',
      phone: guest.phone || '',
      country: guest.country || 'ישראל',
      idNumber: guest.idNumber || '',
      notes: guest.notes || ''
    };

    // בדיקה אם האורח הוא תייר (פטור ממע"מ)
    const isTourist = req.body.isTourist || (guest && guest.isTourist) || false;

    // חישוב מחיר בסיס ומחיר כולל מע"מ
    let basePrice = room.basePrice;
    let finalTotalPrice = totalPrice || 0;
    let vatAmount = 0;

    // אם התקבל מחיר ללילה מהטופס, נשתמש בו
    if (pricePerNightNoVat) {
      // אם קיבלנו מחיר ללא מע"מ, נחשב את המחיר הסופי
      basePrice = parseFloat(pricePerNightNoVat);
      const basePriceTotal = basePrice * calculatedNights;
      vatAmount = isTourist ? 0 : Math.round((basePriceTotal * 18 / 100) * 100) / 100;
      // שמירה של המחיר הכולל ללא עיגול נוסף
      finalTotalPrice = basePriceTotal + vatAmount;
      
      console.log('חישוב מחיר מתוך מחיר ללא מע"מ:', {
        basePrice, 
        basePriceTotal, 
        vatAmount, 
        finalTotalPrice
      });
    } 
    else if (pricePerNight) {
      // אם קיבלנו מחיר כולל מע"מ, נחשב את המחיר ללא מע"מ
      const priceWithVat = parseFloat(pricePerNight);
      if (isTourist) {
        // אין מע"מ לתיירים
        basePrice = priceWithVat;
        vatAmount = 0;
      } else {
        // חילוץ מחיר הבסיס ממחיר כולל מע"מ
        basePrice = Math.round((priceWithVat / 1.18) * 100) / 100;
        vatAmount = Math.round((priceWithVat - basePrice) * 100) / 100;
      }
      // שמירת המחיר הכולל ללא עיגול נוסף
      finalTotalPrice = priceWithVat * calculatedNights;
      
      console.log('חישוב מחיר מתוך מחיר כולל מע"מ:', {
        priceWithVat, 
        basePrice, 
        vatAmount, 
        finalTotalPrice
      });
    }
    else if (totalPrice) {
      // אם קיבלנו סה"כ מחיר להזמנה, נחשב את מחיר הלילה
      const totalPriceValue = parseFloat(totalPrice);
      // שומרים על המחיר המדויק שהתקבל מהמשתמש
      finalTotalPrice = totalPriceValue;
      
      const pricePerNightWithVat = totalPriceValue / calculatedNights;
      
      if (isTourist) {
        // אין מע"מ לתיירים
        basePrice = pricePerNightWithVat;
        vatAmount = 0;
      } else {
        // חילוץ מחיר הבסיס ממחיר כולל מע"מ
        basePrice = Math.round((pricePerNightWithVat / 1.18) * 100) / 100;
        vatAmount = Math.round((totalPriceValue - (basePrice * calculatedNights)) * 100) / 100;
      }
      
      console.log('חישוב מחיר מתוך סך המחיר להזמנה:', {
        totalPriceValue, 
        pricePerNightWithVat, 
        basePrice, 
        vatAmount, 
        finalTotalPrice
      });
    }
    else {
      // אם לא התקבל מחיר מהטופס, נשתמש במחיר הממוחשב
      if (calculatedNights > 0 && finalTotalPrice > 0) {
        basePrice = Math.floor(finalTotalPrice / calculatedNights);
      }
      const basePriceTotal = basePrice * calculatedNights;
      const vatData = calculateVatAndTotalPrice(basePriceTotal, isTourist);
      vatAmount = vatData.vatAmount;
      finalTotalPrice = vatData.totalPrice;
    }

    console.log('חישובים סופיים:', {
      bookingNumber,
      calculatedNights, 
      basePrice,
      vatAmount,
      finalTotalPrice,
      isTourist
    });

    // יצירת הזמנה חדשה
    const booking = new Booking({
      bookingNumber,
      room: roomId,
      user: req.user ? req.user.id : null,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights: calculatedNights,
      basePrice: basePrice,
      vatRate: 18,
      vatAmount: vatAmount,
      totalPrice: finalTotalPrice,
      originalTotalPrice: req.body.originalTotalPrice || String(finalTotalPrice),
      isTourist: isTourist,
      guest: guestData,
      status,
      paymentStatus,
      notes,
      creditCard: processedCreditCard
    });

    console.log('כרטיס אשראי לפני שמירה:', booking.creditCard);

    // שמירת ההזמנה
    await booking.save();

    // בדיקה שההזמנה נשמרה עם פרטי כרטיס אשראי
    const savedBooking = await Booking.findById(booking._id)
      .populate('room', 'roomNumber type basePrice')
      .select('+creditCard');

    console.log('כרטיס אשראי אחרי שמירה:', savedBooking.creditCard);
    console.log('שדות כרטיס אשראי אחרי שמירה:', Object.keys(savedBooking.creditCard || {}));
    console.log('ערכי כרטיס אשראי אחרי שמירה:', savedBooking.creditCard ? Object.values(savedBooking.creditCard) : []);

    // שליחת אימייל אישור הזמנה
    try {
      // שולח אימייל אישור רק אם יש כתובת אימייל תקפה
      if (booking.guest.email && booking.guest.email !== '' && booking.guest.email !== 'guest@example.com') {
        await sendBookingConfirmation(booking);
        console.log(`נשלח אימייל אישור להזמנה ${bookingNumber}`);
      } else {
        console.log(`לא נשלח אימייל אישור להזמנה ${bookingNumber} - אין כתובת אימייל תקפה`);
      }
      
      // שליחת התראה למנהל על הזמנה חדשה (בכל מקרה)
      await sendBookingNotificationToAdmin(booking, room);
      console.log(`נשלחה התראה למנהל על הזמנה חדשה ${bookingNumber}`);
    } catch (emailError) {
      console.error('שגיאה בשליחת אימייל אישור:', emailError);
      // אנחנו לא רוצים שההזמנה תיכשל בגלל בעיית אימייל
    }

    res.status(201).json({
      success: true,
      data: savedBooking
    });
  } catch (error) {
    console.error('שגיאה ביצירת הזמנה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת: ' + error.message
    });
  }
};

// @desc    קבלת כל ההזמנות
// @route   GET /api/bookings
// @access  Public
exports.getBookings = async (req, res) => {
  try {
    // פרמטרים לסינון וחיפוש
    let { 
      startDate, endDate, roomId, status, 
      guestName, paymentStatus, sortBy = 'checkIn', 
      limit = 100, page = 1, minNights, maxNights,
      sortOrder = 'asc'
    } = req.query;
    
    // בניית שאילתת חיפוש
    const query = {};
    
    // סינון לפי תאריכים
    if (startDate || endDate) {
      query.$or = [];
      
      if (startDate) {
        const start = startOfDay(new Date(startDate));
        if (endDate) {
          const end = endOfDay(new Date(endDate));
          // הזמנות שמתחילות או מסתיימות בטווח, או שמכילות את הטווח
          query.$or.push(
            { checkIn: { $gte: start, $lte: end } },
            { checkOut: { $gt: start, $lte: end } },
            { 
              checkIn: { $lte: start },
              checkOut: { $gte: end }
            }
          );
        } else {
          query.$or.push(
            { checkIn: { $gte: start } },
            { checkOut: { $gte: start } }
          );
        }
      } else if (endDate) {
        const end = endOfDay(new Date(endDate));
        query.$or.push({ checkIn: { $lte: end } });
      }
    }
    
    // סינון לפי חדר
    if (roomId) {
      query.room = roomId;
    }
    
    // סינון לפי סטטוס
    if (status) {
      query.status = status;
    }
    
    // סינון לפי שם אורח
    if (guestName) {
      query['guest.name'] = { $regex: guestName, $options: 'i' };
    }
    
    // סינון לפי סטטוס תשלום
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    // סינון לפי מספר לילות
    if (minNights || maxNights) {
      query.nights = {};
      if (minNights) query.nights.$gte = parseInt(minNights);
      if (maxNights) query.nights.$lte = parseInt(maxNights);
    }
    
    // יצירת מיון
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // חישוב פרמטרים לעימוד
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // ביצוע השאילתה עם יחס
    const bookings = await Booking.find(query)
      .populate('room', 'roomNumber type basePrice')
      .select('+creditCard')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // ספירת סך הכל תוצאות עבור עימוד
    const total = await Booking.countDocuments(query);
    
    res.json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: bookings
    });
  } catch (error) {
    console.error('שגיאה בקבלת ההזמנות:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בקבלת ההזמנות',
      error: error.message
    });
  }
};

// קבלת הזמנה לפי מזהה
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'roomNumber type basePrice')
      .select('+creditCard');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'ההזמנה לא נמצאה'
      });
    }
    
    // יצירת עותק של האובייקט שנוכל לשנות
    const bookingObject = booking.toObject();
    
    // וידוא שיש תמיד אובייקט creditCard תקין
    if (!bookingObject.creditCard) {
      console.log('אין אובייקט creditCard בהזמנה - יוצר אובייקט מלא');
      bookingObject.creditCard = {
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      };
    } else {
      // וידוא שיש את כל שדות כרטיס האשראי
      if (!bookingObject.creditCard.cardNumber) bookingObject.creditCard.cardNumber = '';
      if (!bookingObject.creditCard.expiryDate) bookingObject.creditCard.expiryDate = '';
      if (!bookingObject.creditCard.cvv) bookingObject.creditCard.cvv = '';
      if (!bookingObject.creditCard.cardholderName) bookingObject.creditCard.cardholderName = '';
    }
    
    // מידע ספציפי לדיבאג
    console.log('מידע על הזמנה מעודכנת - כרטיס אשראי:', {
      exists: !!bookingObject.creditCard,
      fields: bookingObject.creditCard ? Object.keys(bookingObject.creditCard) : 'אין',
      values: bookingObject.creditCard ? Object.values(bookingObject.creditCard) : 'אין'
    });
    
    res.json({
      success: true,
      data: bookingObject
    });
  } catch (error) {
    console.error('שגיאה בקבלת ההזמנה:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בקבלת ההזמנה',
      error: error.message
    });
  }
};

// @desc    עדכון הזמנה קיימת
// @route   PUT /api/bookings/:id
// @access  Public
exports.updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    // בדיקה אם ההזמנה קיימת
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'ההזמנה לא נמצאה'
      });
    }
    
    // קבלת הנתונים לעדכון
    const {
      checkIn,
      checkOut,
      nights,
      totalPrice,
      pricePerNight,
      pricePerNightNoVat,
      guest,
      creditCard,
      status,
      paymentStatus,
      notes
    } = req.body;
    
    console.log('נתוני עדכון הזמנה:', {
      bookingId,
      checkIn,
      checkOut,
      nights,
      totalPrice,
      pricePerNight,
      pricePerNightNoVat,
      guest: guest ? 'קיים' : 'חסר',
      creditCard: creditCard ? 'קיים' : 'חסר',
      status,
      paymentStatus
    });
    
    // וידוא שיש אובייקט כרטיס אשראי תקין
    const processedCreditCard = creditCard || {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    };
    
    // חישוב השדות לעדכון
    const updatedFields = {};
    
    // עדכון תאריכים אם הוזנו
    if (checkIn) updatedFields.checkIn = new Date(checkIn);
    if (checkOut) updatedFields.checkOut = new Date(checkOut);
    if (nights) updatedFields.nights = nights;
    
    // עדכון מחירים אם הוזנו
    if (pricePerNight || pricePerNightNoVat || totalPrice) {
      const isTourist = req.body.isTourist || (guest && guest.isTourist) || booking.isTourist || false;
      const currentNights = nights || booking.nights || 1;
      
      // חישוב המחירים בהתאם לערכים שהתקבלו
      if (pricePerNightNoVat) {
        // אם התקבל מחיר ללא מע"מ
        const basePrice = parseFloat(pricePerNightNoVat);
        updatedFields.basePrice = basePrice;
        
        // חישוב סכום המע"מ ומחיר כולל מע"מ
        if (isTourist) {
          // תייר - אין מע"מ
          updatedFields.vatAmount = 0;
          updatedFields.pricePerNight = basePrice;
          // שמירת המחיר הכולל ללא עיגול
          updatedFields.totalPrice = basePrice * currentNights;
        } else {
          // אזרח רגיל - עם מע"מ
          const vatAmount = Math.round((basePrice * 18 / 100) * 100) / 100;
          const priceWithVat = Math.round((basePrice + vatAmount) * 100) / 100;
          updatedFields.vatAmount = vatAmount * currentNights;
          updatedFields.pricePerNight = priceWithVat;
          // שמירת המחיר הכולל ללא עיגול
          updatedFields.totalPrice = priceWithVat * currentNights;
        }
        
        console.log('עדכון מחיר מתוך מחיר ללא מע"מ:', {
          basePrice,
          vatAmount: updatedFields.vatAmount,
          pricePerNight: updatedFields.pricePerNight,
          totalPrice: updatedFields.totalPrice,
          isTourist
        });
      }
      else if (pricePerNight) {
        // אם התקבל מחיר כולל מע"מ
        const priceWithVat = parseFloat(pricePerNight);
        
        if (isTourist) {
          // תייר - אין מע"מ, המחיר כולל וללא מע"מ זהים
          updatedFields.basePrice = priceWithVat;
          updatedFields.pricePerNight = priceWithVat;
          updatedFields.vatAmount = 0;
          updatedFields.totalPrice = Math.round((priceWithVat * currentNights) * 100) / 100;
        } else {
          // אזרח רגיל - צריך לחשב את המחיר ללא מע"מ
          const basePrice = Math.round((priceWithVat / 1.18) * 100) / 100;
          const vatAmount = Math.round((priceWithVat - basePrice) * 100) / 100;
          
          updatedFields.basePrice = basePrice;
          updatedFields.pricePerNight = priceWithVat;
          updatedFields.vatAmount = vatAmount * currentNights;
          updatedFields.totalPrice = Math.round((priceWithVat * currentNights) * 100) / 100;
        }
        
        console.log('עדכון מחיר מתוך מחיר כולל מע"מ:', {
          basePrice: updatedFields.basePrice,
          pricePerNight: updatedFields.pricePerNight,
          vatAmount: updatedFields.vatAmount,
          totalPrice: updatedFields.totalPrice,
          isTourist
        });
      }
      else if (totalPrice) {
        // אם התקבל סה"כ מחיר להזמנה
        const totalPriceValue = parseFloat(totalPrice);
        // שומרים על הערך המדויק שהתקבל מהמשתמש ללא שינוי
        updatedFields.totalPrice = totalPriceValue;
        
        // שמירה של המחיר המקורי אם הוא קיים בבקשה
        if (req.body.originalTotalPrice) {
          updatedFields.originalTotalPrice = req.body.originalTotalPrice;
        } else {
          updatedFields.originalTotalPrice = String(totalPriceValue);
        }
        
        // חישוב מחיר ללילה (כולל מע"מ) רק לצורך תצוגה
        const pricePerNightWithVat = totalPriceValue / currentNights;
        
        if (isTourist) {
          // תייר - אין מע"מ - המחיר ללא מע"מ זהה למחיר כולל מע"מ
          updatedFields.basePrice = Math.round(pricePerNightWithVat * 100) / 100;
          updatedFields.pricePerNight = Math.round(pricePerNightWithVat * 100) / 100;
          updatedFields.vatAmount = 0;
        } else {
          // אזרח רגיל - צריך לחשב את המחיר ללא מע"מ ואת המע"מ
          // מחיר ללילה ללא מע"מ
          const basePricePerNight = pricePerNightWithVat / 1.18;
          // מע"מ ללילה
          const vatAmountPerNight = pricePerNightWithVat - basePricePerNight;
          
          updatedFields.basePrice = Math.round(basePricePerNight * 100) / 100; // מחיר לילה ללא מע"מ
          updatedFields.pricePerNight = Math.round(pricePerNightWithVat * 100) / 100; // מחיר לילה כולל מע"מ
          updatedFields.vatAmount = Math.round(vatAmountPerNight * currentNights * 100) / 100; // סה"כ מע"מ להזמנה
        }
        
        console.log('עדכון מחיר מתוך סה"כ להזמנה (ערך מדויק):', {
          totalPriceInput: totalPrice,
          savedTotalPrice: totalPriceValue,
          nights: currentNights,
          pricePerNightWithVat: updatedFields.pricePerNight, // מחיר לילה כולל מע"מ
          basePrice: updatedFields.basePrice, // מחיר לילה ללא מע"מ
          vatAmount: updatedFields.vatAmount, // סה"כ מע"מ להזמנה
          isTourist
        });
      }
    }
    
    if (totalPrice && !updatedFields.basePrice) updatedFields.totalPrice = totalPrice;
    if (guest) updatedFields.guest = guest;
    if (creditCard) updatedFields.creditCard = processedCreditCard;
    if (status) updatedFields.status = status;
    if (paymentStatus) updatedFields.paymentStatus = paymentStatus;
    if (notes !== undefined) updatedFields.notes = notes;
    if (req.body.isTourist !== undefined) updatedFields.isTourist = req.body.isTourist;
    
    console.log('שדות לעדכון:', {
      ...updatedFields,
      creditCard: updatedFields.creditCard ? 'כולל פרטי כרטיס אשראי' : 'ללא פרטי כרטיס אשראי'
    });
    
    // אם יש עדכון של פרטי האורח, נוודא שיש שדות שם
    if (req.body.guest) {
      const guest = req.body.guest;
      
      // וידוא שיש שם פרטי ושם משפחה
      if (!guest.firstName || guest.firstName.trim() === '') {
        guest.firstName = guest.name ? guest.name.split(' ')[0] : 'אורח';
      }
      
      if (!guest.lastName || guest.lastName.trim() === '') {
        guest.lastName = guest.name ? guest.name.split(' ').slice(1).join(' ') : 'ללא שם';
      }
    }
    
    // עדכון ההזמנה בדאטהבייס
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    ).populate('room', 'roomNumber type basePrice')
     .select('+creditCard');
    
    // וידוא שיש תמיד אובייקט creditCard תקין בתשובה
    const responseBooking = updatedBooking.toObject();
    if (!responseBooking.creditCard) {
      console.log('אין אובייקט creditCard בהזמנה המעודכנת - יוצר אובייקט מלא');
      responseBooking.creditCard = {
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      };
    } else {
      // וידוא שיש את כל שדות כרטיס האשראי
      if (!responseBooking.creditCard.cardNumber) responseBooking.creditCard.cardNumber = '';
      if (!responseBooking.creditCard.expiryDate) responseBooking.creditCard.expiryDate = '';
      if (!responseBooking.creditCard.cvv) responseBooking.creditCard.cvv = '';
      if (!responseBooking.creditCard.cardholderName) responseBooking.creditCard.cardholderName = '';
    }
    
    // בדיקה אם שדה כרטיס האשראי קיים בתוצאה
    console.log('מידע על הזמנה מעודכנת - כרטיס אשראי:', {
      exists: !!responseBooking.creditCard,
      fields: responseBooking.creditCard ? Object.keys(responseBooking.creditCard) : 'אין',
      values: responseBooking.creditCard ? Object.values(responseBooking.creditCard) : 'אין'
    });
    
    res.json({
      success: true,
      data: responseBooking
    });
  } catch (error) {
    console.error('שגיאה בעדכון הזמנה:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
};

// מחיקת הזמנה (ביטול)
exports.deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    // עדכון ישיר של ההזמנה ל"מבוטל" ללא טעינה מלאה ושמירה
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { 
        $set: { 
          status: 'canceled',
          updatedAt: new Date()
        } 
      },
      { new: true, runValidators: false }
    );
    
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'ההזמנה לא נמצאה'
      });
    }
    
    res.json({
      success: true,
      message: 'ההזמנה בוטלה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה בביטול ההזמנה:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בביטול ההזמנה',
      error: error.message
    });
  }
};

// מחיקה מוחלטת של הזמנה
exports.hardDeleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    // מחיקה מוחלטת של ההזמנה מהמסד נתונים
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);
    
    if (!deletedBooking) {
      return res.status(404).json({
        success: false,
        message: 'ההזמנה לא נמצאה'
      });
    }
    
    res.json({
      success: true,
      message: 'ההזמנה נמחקה לצמיתות בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה במחיקת ההזמנה לצמיתות:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה במחיקת ההזמנה לצמיתות',
      error: error.message
    });
  }
};

// מחיקה מוחלטת של מספר הזמנות בו-זמנית
exports.hardDeleteManyBookings = async (req, res) => {
  try {
    const { bookingIds } = req.body;
    
    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'נדרשת רשימת מזהי הזמנות תקינה'
      });
    }
    
    // מחיקה מוחלטת של ההזמנות מהמסד נתונים
    const result = await Booking.deleteMany({ _id: { $in: bookingIds } });
    
    console.log(`נמחקו ${result.deletedCount} הזמנות לצמיתות`);
    
    res.json({
      success: true,
      message: `${result.deletedCount} הזמנות נמחקו לצמיתות בהצלחה`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('שגיאה במחיקת הזמנות לצמיתות:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה במחיקת ההזמנות לצמיתות',
      error: error.message
    });
  }
};

// עדכון סטטוס תשלום
exports.updatePaymentStatus = async (req, res) => {
  console.log('===== תחילת עדכון סטטוס תשלום בצד שרת =====');
  try {
    const bookingId = req.params.id;
    const { paymentStatus, paidAmount, paymentMethod } = req.body;
    
    console.log('בקשה לעדכון סטטוס תשלום:', {
      bookingId,
      paymentStatus,
      paidAmount,
      paymentMethod
    });
    
    // שליפת ההזמנה לפני העדכון כדי לזהות שינויים
    const existingBooking = await Booking.findById(bookingId).populate('room');
    
    if (!existingBooking) {
      console.error(`הזמנה עם מזהה ${bookingId} לא נמצאה`);
      return res.status(404).json({ 
        success: false, 
        message: 'ההזמנה לא נמצאה' 
      });
    }
    
    console.log('הזמנה לפני עדכון:', {
      bookingNumber: existingBooking.bookingNumber,
      paymentStatus: existingBooking.paymentStatus,
      paymentMethod: existingBooking.paymentMethod,
      room: existingBooking.room?.roomNumber,
      guest: existingBooking.guest ? `${existingBooking.guest.firstName} ${existingBooking.guest.lastName}` : 'לא ידוע'
    });
    
    if (!paymentStatus) {
      console.error('סטטוס תשלום חסר בבקשה');
      return res.status(400).json({ 
        success: false, 
        message: 'חובה לספק סטטוס תשלום' 
      });
    }
    
    // הגדרת עדכוני ההזמנה
    const updateData = {
      paymentStatus,
    };
    
    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount;
    }
    
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }
    
    console.log('מעדכן הזמנה עם הנתונים:', updateData);
    
    // עדכון הזמנה
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId, 
      updateData, 
      { new: true }
    ).populate('room');
    
    if (!updatedBooking) {
      console.error('ההזמנה לא נמצאה אחרי ניסיון עדכון');
      return res.status(404).json({ 
        success: false, 
        message: 'ההזמנה לא נמצאה' 
      });
    }
    
    console.log('עדכון הזמנה הצליח', {
      bookingNumber: updatedBooking.bookingNumber,
      paymentStatus: updatedBooking.paymentStatus,
      paymentMethod: updatedBooking.paymentMethod
    });
    
    // מחזירים מידע יותר מפורט על ההזמנה שעודכנה
    const bookingDetails = {
      _id: updatedBooking._id,
      bookingNumber: updatedBooking.bookingNumber,
      paymentStatus: updatedBooking.paymentStatus,
      paymentMethod: updatedBooking.paymentMethod,
      totalPrice: updatedBooking.totalPrice,
      paidAmount: updatedBooking.paidAmount,
      roomNumber: updatedBooking.room?.roomNumber || 'לא ידוע',
      checkIn: updatedBooking.checkIn,
      checkOut: updatedBooking.checkOut,
      guestName: updatedBooking.guest ? `${updatedBooking.guest.firstName} ${updatedBooking.guest.lastName}` : 'לא ידוע'
    };
    
    console.log('===== סיום מוצלח של עדכון סטטוס תשלום =====');
    
    res.status(200).json({ 
      success: true, 
      data: updatedBooking,
      bookingDetails,
      message: 'סטטוס התשלום עודכן בהצלחה'
    });
  } catch (error) {
    console.error('===== שגיאה בעדכון סטטוס תשלום =====');
    console.error('שגיאה בעדכון סטטוס תשלום:', error);
    console.error('סוג השגיאה:', error.name);
    console.error('הודעת שגיאה:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת בעת עדכון סטטוס תשלום',
      error: error.message 
    });
  }
};

// בדיקת זמינות חדר
exports.checkAvailability = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut } = req.body;
    
    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'חסרים פרמטרים: נדרש מזהה חדר, תאריך הגעה ותאריך עזיבה'
      });
    }
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // בדיקת תקינות התאריכים
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'תאריכים לא תקינים'
      });
    }
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'תאריך ההגעה חייב להיות לפני תאריך העזיבה'
      });
    }
    
    // בדיקת זמינות החדר
    const { isAvailable, conflictingBookings } = await checkRoomAvailability(
      roomId, checkInDate, checkOutDate
    );
    
    // חישוב מחיר החדר לתקופה
    const totalPrice = await calculateRoomPrice(roomId, checkInDate, checkOutDate);
    
    // חישוב מספר הלילות
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    // קבלת פרטי החדר
    const room = await Room.findById(roomId).select('roomNumber type basePrice maxOccupancy');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'החדר לא נמצא'
      });
    }
    
    res.json({
      success: true,
      isAvailable,
      room,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      basePrice: room.basePrice,
      totalPrice,
      conflicts: isAvailable ? [] : conflictingBookings.map(booking => ({
        bookingNumber: booking.bookingNumber,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut
      }))
    });
  } catch (error) {
    console.error('שגיאה בבדיקת זמינות:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בבדיקת הזמינות',
      error: error.message
    });
  }
};

// קבלת סטטיסטיקות הזמנות
exports.getBookingsStats = async (req, res) => {
  try {
    // שליפת נתונים סטטיסטיים
    const totalBookings = await Booking.countDocuments({ status: { $ne: 'canceled' } });
    const pendingPayments = await Booking.countDocuments({ paymentStatus: 'pending', status: 'confirmed' });
    const upcomingBookings = await Booking.countDocuments({ 
      checkIn: { $gte: startOfDay(new Date()) },
      status: 'confirmed' 
    });
    
    // סטטיסטיקה לפי סטטוס
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // סטטיסטיקה לפי סטטוס תשלום
    const bookingsByPaymentStatus = await Booking.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]);
    
    // סטטיסטיקה לפי חודשים - השנה הנוכחית
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const bookingsByMonth = await Booking.aggregate([
      { 
        $match: { 
          checkIn: { $gte: startOfYear, $lte: endOfYear },
          status: { $ne: 'canceled' }
        } 
      },
      {
        $group: {
          _id: { $month: '$checkIn' },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalBookings,
        pendingPayments,
        upcomingBookings,
        bookingsByStatus: bookingsByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        bookingsByPaymentStatus: bookingsByPaymentStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        bookingsByMonth: bookingsByMonth.map(item => ({
          month: item._id,
          count: item.count,
          revenue: item.revenue
        }))
      }
    });
  } catch (error) {
    console.error('שגיאה בקבלת סטטיסטיקות הזמנות:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בקבלת סטטיסטיקות הזמנות',
      error: error.message
    });
  }
};

// @desc    קבלת כל ההזמנות לחדר מסוים
// @route   GET /api/bookings/room/:roomId
// @access  Private/Admin
exports.getRoomBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ room: req.params.roomId })
      .select('+creditCard')
      .sort({ checkIn: 1 });
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('שגיאה בקבלת הזמנות לחדר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// יצירת חשבונית PDF
exports.generateInvoicePdf = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    // קבלת פרטי ההזמנה
    const booking = await Booking.findById(bookingId)
      .populate('room', 'roomNumber type basePrice internalName');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'ההזמנה לא נמצאה'
      });
    }
    
    // שימוש בספריית PDFKit ליצירת ה-PDF
    const PDFDocument = require('pdfkit');
    
    // יצירת מסמך PDF חדש מינימליסטי
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Invoice #${booking.bookingNumber}`,
        Author: 'Rothschild 79',
        Subject: 'Booking Invoice',
      }
    });
    
    // הגדרת כותרת לקובץ שיורד
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${booking.bookingNumber}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    
    // הזרמת ה-PDF ישירות לתגובה
    doc.pipe(res);
    
    // צבעים וקבועים
    const textColor = '#000000';
    const headerColor = '#000000';
    const lineColor = '#cccccc';
    
    // ------ כותרת המסמך -------
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(headerColor)
       .text('INVOICE', 40, 40);
    
    doc.fontSize(10)
       .text(`${booking.bookingNumber}`, 110, 42);
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Date: ${new Date().toLocaleDateString('en-US')}`, 400, 40, { align: 'right' });
    
    // קו הפרדה
    doc.moveTo(40, 60)
       .lineTo(doc.page.width - 40, 60)
       .strokeColor(lineColor)
       .stroke();
    
    // ------ פרטי העסק -------
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(textColor)
       .text('Rothschild 79', 40, 70);
       
    doc.fontSize(9)
       .font('Helvetica')
       .text('79 Rothschild Blvd, Tel Aviv', 40, 85);
       
    doc.text(`Phone: 03-1234567 | Business ID: 12345678`, 40, 100);
    
    // ------ פרטי לקוח -------
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('TO:', 40, 120);
       
    doc.fontSize(9)
       .font('Helvetica')
       .text(`${booking.guest.firstName} ${booking.guest.lastName}`, 65, 120);
       
    doc.text(`Phone: ${booking.guest.phone || ''}`, 65, 135);
    
    doc.text(`Email: ${booking.guest.email || ''}`, 275, 135);
    
    // ------ פרטי ההזמנה -------
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('BOOKING DETAILS', 40, 155);
       
    doc.fontSize(9)
       .font('Helvetica')
       .text(`Room: ${booking.room.roomNumber}`, 40, 170)
       .text(`Check-in: ${new Date(booking.checkIn).toLocaleDateString('en-US')}`, 180, 170)
       .text(`Check-out: ${new Date(booking.checkOut).toLocaleDateString('en-US')}`, 320, 170)
       .text(`Nights: ${booking.nights}`, 460, 170);
    
    // קו הפרדה
    doc.moveTo(40, 185)
       .lineTo(doc.page.width - 40, 185)
       .strokeColor(lineColor)
       .stroke();
    
    // ------ כותרות טבלת מחירים -------
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('DESCRIPTION', 40, 195)
       .text('PRICE', 320, 195)
       .text('QTY', 400, 195)
       .text('AMOUNT', 460, 195, { align: 'right' });
    
    // קו הפרדה
    doc.moveTo(40, 210)
       .lineTo(doc.page.width - 40, 210)
       .strokeColor(lineColor)
       .stroke();
    
    // ------ שורת פריט בטבלה -------
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(textColor)
       .text(`Accommodation - ${booking.room.internalName || 'Room ' + booking.room.roomNumber}`, 40, 220)
       .text(`${booking.basePrice} ILS`, 320, 220)
       .text(`${booking.nights}`, 400, 220)
       .text(`${booking.basePrice * booking.nights} ILS`, 460, 220, { align: 'right' });
    
    // קו הפרדה
    doc.moveTo(40, 235)
       .lineTo(doc.page.width - 40, 235)
       .strokeColor(lineColor)
       .stroke();
    
    // ------ חישוב מחירים -------
    const vatRate = booking.vatRate || 18;
    const priceBeforeVat = (booking.totalPrice * 100) / (100 + vatRate);
    const vatAmount = booking.totalPrice - priceBeforeVat;
    
    // סיכום מחירים
    doc.fontSize(9)
       .font('Helvetica')
       .text('Subtotal', 340, 245)
       .text(`${priceBeforeVat.toFixed(2)} ILS`, 460, 245, { align: 'right' });
    
    doc.text(`VAT (${vatRate}%)`, 340, 260)
       .text(`${vatAmount.toFixed(2)} ILS`, 460, 260, { align: 'right' });
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('TOTAL', 340, 280)
       .text(`${booking.totalPrice.toFixed(2)} ILS`, 460, 280, { align: 'right' });
    
    // ------ סטטוס תשלום -------
    const paymentStatusMap = {
      'paid': 'Paid',
      'partial': 'Partially Paid',
      'pending': 'Pending Payment'
    };
    
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('PAYMENT STATUS:', 40, 300);
    
    doc.fontSize(9)
       .font('Helvetica')
       .text(paymentStatusMap[booking.paymentStatus] || booking.paymentStatus, 140, 300);
    
    // סיום המסמך
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF invoice:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while generating the PDF invoice',
      error: error.message
    });
  }
}; 