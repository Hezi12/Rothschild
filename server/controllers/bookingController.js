const Booking = require('../models/Booking');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const { startOfDay, endOfDay, parseISO, format, addHours } = require('date-fns');
const { validationResult } = require('express-validator');
const { sendBookingConfirmation } = require('../utils/emailService');
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

// @desc    פונקציית עזר לבדיקת זמינות חדר
// @access  Private (helper function)
const checkRoomAvailability = async (roomId, checkInDate, checkOutDate, excludeBookingId = null) => {
  try {
    // וידוא שהתאריכים הם אובייקטי Date ושהשעות מאופסות לחצות
    const checkIn = new Date(checkInDate);
    checkIn.setHours(0, 0, 0, 0);
    
    const checkOut = new Date(checkOutDate);
    checkOut.setHours(0, 0, 0, 0);
    
    // בניית תנאי החיפוש
    const query = {
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
    
    // אם יש מזהה הזמנה להחרגה (למשל בעדכון הזמנה), נוסיף תנאי
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }
    
    // בדיקה אם יש הזמנות חופפות
    const overlappingBookings = await Booking.find(query).populate('room', 'roomNumber type');
    
    return overlappingBookings.length === 0;
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
    totalPrice: Math.round(totalPrice * 100) / 100, // עיגול לשתי ספרות אחרי הנקודה
    priceWithoutVat: basePrice
  };
};

// @desc    יצירת הזמנה חדשה
// @route   POST /api/bookings
// @access  Private
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
      return res.status(400).json({
        success: false,
        message: 'החדר אינו זמין בתאריכים המבוקשים'
      });
    }

    // יצירת מספר הזמנה ייחודי
    const bookingNumber = await generateBookingNumber();

    // חישוב מספר לילות
    let calculatedNights = nights;
    if (!calculatedNights) {
      // חישוב לפי התאריכים
      const diffTime = Math.abs(checkOutDate - checkInDate);
      calculatedNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // חישוב סכום כולל
    let calculatedTotalPrice = totalPrice;
    if (!calculatedTotalPrice || isNaN(calculatedTotalPrice)) {
      // חישוב לפי תעריף החדר ומספר הלילות
      calculatedTotalPrice = await calculateRoomPrice(roomId, checkInDate, checkOutDate);
    }

    // התאמת אובייקט האורח בהתאם למבנה המצופה
    const guestData = {
      firstName: guest.firstName || (guest.name ? guest.name.split(' ')[0] : ''),
      lastName: guest.lastName || (guest.name ? guest.name.split(' ').slice(1).join(' ') : ''),
      email: guest.email || '',
      phone: guest.phone || '',
      country: guest.country || 'ישראל',
      idNumber: guest.idNumber || '',
      notes: guest.notes || ''
    };

    // בדיקה אם האורח הוא תייר (פטור ממע"מ)
    const isTourist = guest.isTourist || false;

    // חישוב basePrice אם אפשר
    let basePrice = room.basePrice;
    if (calculatedNights > 0 && calculatedTotalPrice > 0) {
      basePrice = Math.floor(calculatedTotalPrice / calculatedNights);
    }

    // חישוב מע"מ ומחיר סופי
    const basePriceTotal = basePrice * calculatedNights;
    const { vatAmount, totalPrice: totalPriceWithVat } = calculateVatAndTotalPrice(
      basePriceTotal, 
      isTourist
    );

    console.log('חישובים:', {
      bookingNumber,
      calculatedNights, 
      basePrice,
      basePriceTotal,
      vatAmount,
      totalPrice: isTourist ? basePriceTotal : totalPriceWithVat,
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
      totalPrice: isTourist ? basePriceTotal : totalPriceWithVat,
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
      await sendBookingConfirmation(booking);
      console.log(`נשלח אימייל אישור להזמנה ${bookingNumber}`);
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

// קבלת כל ההזמנות
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

// @desc    עדכון הזמנה
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res) => {
  try {
    const { 
      roomId, 
      checkIn, 
      checkOut, 
      nights, 
      totalPrice, 
      guest, 
      creditCard,
      status, 
      paymentStatus,
      notes 
    } = req.body;

    console.log('נתונים לעדכון הזמנה - כרטיס אשראי:', creditCard);
    console.log('סוג נתוני כרטיס אשראי:', typeof creditCard);
    console.log('שדות כרטיס אשראי:', creditCard ? Object.keys(creditCard) : []);
    
    // וידוא שיש אובייקט כרטיס אשראי תקין
    const processedCreditCard = creditCard || {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    };

    console.log('כרטיס אשראי מעובד:', processedCreditCard);

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'ההזמנה לא נמצאה'
      });
    }

    // מירה על הרשאות - רק מנהל יכול לעדכן כל הזמנה
    if (!req.user.isAdmin && booking.user && booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'אין לך הרשאה לעדכן הזמנה זו'
      });
    }

    // עדכון שדות
    let updatedFields = {};

    // אם משנים חדר או תאריכים, בודקים זמינות
    if ((roomId && roomId !== booking.room.toString()) || 
        (checkIn && new Date(checkIn).getTime() !== booking.checkIn.getTime()) || 
        (checkOut && new Date(checkOut).getTime() !== booking.checkOut.getTime())) {
      
      const newRoomId = roomId || booking.room;
      
      // המרת התאריכים לאובייקטי Date ואיפוס השעות לחצות
      const checkInDate = checkIn ? new Date(checkIn) : booking.checkIn;
      checkInDate.setHours(0, 0, 0, 0);
      
      const checkOutDate = checkOut ? new Date(checkOut) : booking.checkOut;
      checkOutDate.setHours(0, 0, 0, 0);
      
      // בדיקת זמינות החדר בתאריכים החדשים
      const isAvailable = await checkRoomAvailability(
        newRoomId, 
        checkInDate, 
        checkOutDate, 
        booking._id
      );
      
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'החדר אינו זמין בתאריכים המבוקשים'
        });
      }
      
      // אם הכל בסדר, נוסיף לשדות לעדכון
      if (roomId) updatedFields.room = roomId;
      if (checkIn) updatedFields.checkIn = checkInDate;
      if (checkOut) updatedFields.checkOut = checkOutDate;
      
      // אם השתנו תאריכים, נעדכן מספר לילות
      if (checkIn || checkOut) {
        const startDate = checkIn ? checkInDate : booking.checkIn;
        const endDate = checkOut ? checkOutDate : booking.checkOut;
        
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        updatedFields.nights = diffDays;
      } else if (nights) {
        updatedFields.nights = nights;
      }
      
      // אם חדר או מספר לילות השתנו, נחשב מחיר מחדש
      if (roomId || updatedFields.nights) {
        const roomToUse = roomId ? await Room.findById(roomId) : await Room.findById(booking.room);
        if (!totalPrice) {
          updatedFields.totalPrice = await calculateRoomPrice(
            roomToUse._id, 
            updatedFields.checkIn || booking.checkIn, 
            updatedFields.checkOut || booking.checkOut
          );
        }
      }
    } else {
      // אם לא משנים תאריכים/חדר, אבל יש מספר לילות חדש
      if (nights && nights !== booking.nights) {
        updatedFields.nights = nights;
      }
    }
    
    // עדכון שאר השדות אם הם קיימים
    if (totalPrice) updatedFields.totalPrice = totalPrice;
    if (guest) updatedFields.guest = guest;
    if (creditCard) updatedFields.creditCard = processedCreditCard;
    if (status) updatedFields.status = status;
    if (paymentStatus) updatedFields.paymentStatus = paymentStatus;
    if (notes !== undefined) updatedFields.notes = notes;
    
    console.log('שדות לעדכון:', {
      ...updatedFields,
      creditCard: updatedFields.creditCard ? 'כולל פרטי כרטיס אשראי' : 'ללא פרטי כרטיס אשראי'
    });
    
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

// עדכון סטטוס תשלום
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paidAmount, paymentMethod } = req.body;
    
    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'חסר סטטוס תשלום'
      });
    }
    
    // בניית אובייקט עדכון
    const updateData = {
      paymentStatus,
      updatedAt: new Date()
    };
    
    // הוספת שדות אופציונליים אם סופקו
    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount;
    }
    
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }
    
    // עדכון ההזמנה ישירות
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
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
      message: 'סטטוס התשלום עודכן בהצלחה',
      data: updatedBooking
    });
  } catch (error) {
    console.error('שגיאה בעדכון סטטוס תשלום:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בעדכון סטטוס התשלום',
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
    
    // יצירת מסמך PDF חדש עם תמיכה בעברית
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      lang: 'he',
      features: {
        // הפעלת תמיכה בכתיבה מימין לשמאל
        isWritingRTL: true
      }
    });
    
    // הגדרת כותרת לקובץ שיורד
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${booking.bookingNumber}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    
    // הזרמת ה-PDF ישירות לתגובה
    doc.pipe(res);
    
    // הוספת כותרת למסמך
    doc.fontSize(20).text('חשבונית / קבלה', { align: 'center' });
    doc.moveDown();
    
    // פרטי העסק
    doc.fontSize(12).text('רוטשילד 79', { align: 'right' });
    doc.text('ח.פ: 12345678', { align: 'right' });
    doc.text('טלפון: 03-1234567', { align: 'right' });
    doc.text('כתובת: רחוב רוטשילד 79, תל אביב', { align: 'right' });
    doc.moveDown();
    
    // מידע על החשבונית
    doc.fontSize(14).text('פרטי חשבונית:', { align: 'right', underline: true });
    doc.fontSize(12).text(`מספר חשבונית: ${booking.bookingNumber}`, { align: 'right' });
    doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, { align: 'right' });
    doc.moveDown();
    
    // פרטי הלקוח
    doc.fontSize(14).text('פרטי לקוח:', { align: 'right', underline: true });
    doc.fontSize(12).text(`שם: ${booking.guest.firstName} ${booking.guest.lastName}`, { align: 'right' });
    doc.text(`טלפון: ${booking.guest.phone || 'לא צוין'}`, { align: 'right' });
    doc.text(`אימייל: ${booking.guest.email || 'לא צוין'}`, { align: 'right' });
    doc.moveDown();
    
    // פרטי ההזמנה
    doc.fontSize(14).text('פרטי הזמנה:', { align: 'right', underline: true });
    doc.fontSize(12).text(`חדר: ${booking.room.internalName || 'חדר ' + booking.room.roomNumber}`, { align: 'right' });
    doc.text(`תאריך הגעה: ${new Date(booking.checkIn).toLocaleDateString('he-IL')}`, { align: 'right' });
    doc.text(`תאריך עזיבה: ${new Date(booking.checkOut).toLocaleDateString('he-IL')}`, { align: 'right' });
    doc.text(`מספר לילות: ${booking.nights}`, { align: 'right' });
    doc.moveDown();
    
    // טבלת מחירים
    doc.fontSize(14).text('פירוט מחירים:', { align: 'right', underline: true });
    doc.moveDown(0.5);
    
    // כותרות טבלה
    let yPos = doc.y;
    doc.fontSize(12).text('תיאור', 450, yPos, { width: 100, align: 'right' });
    doc.text('מחיר ללילה', 350, yPos, { width: 100, align: 'right' });
    doc.text('לילות', 250, yPos, { width: 100, align: 'right' });
    doc.text('סה"כ', 150, yPos, { width: 100, align: 'right' });
    
    // קו מפריד
    doc.moveTo(50, doc.y + 15).lineTo(550, doc.y + 15).stroke();
    doc.moveDown();
    
    // שורת הפריט
    yPos = doc.y;
    doc.fontSize(12).text(`לינה - ${booking.room.internalName || 'חדר ' + booking.room.roomNumber}`, 450, yPos, { width: 100, align: 'right' });
    doc.text(`${booking.basePrice} ₪`, 350, yPos, { width: 100, align: 'right' });
    doc.text(`${booking.nights}`, 250, yPos, { width: 100, align: 'right' });
    doc.text(`${booking.totalPrice} ₪`, 150, yPos, { width: 100, align: 'right' });
    
    // קו מפריד
    doc.moveDown();
    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
    doc.moveDown();
    
    // סיכום
    if (booking.isTourist) {
      // תיירים פטורים ממע"מ
      doc.fontSize(12).text(`סה"כ לתשלום: ${booking.totalPrice} ₪`, { align: 'right' });
      doc.text('* פטור ממע"מ לתייר עם דרכון זר', { align: 'right' });
    } else {
      // חישוב מע"מ והצגתו
      const vatRate = booking.vatRate || 18;
      const priceBeforeVat = (booking.totalPrice * 100) / (100 + vatRate);
      const vatAmount = booking.totalPrice - priceBeforeVat;
      
      doc.fontSize(12).text(`סכום לפני מע"מ: ${priceBeforeVat.toFixed(2)} ₪`, { align: 'right' });
      doc.text(`מע"מ (${vatRate}%): ${vatAmount.toFixed(2)} ₪`, { align: 'right' });
      doc.fontSize(14).text(`סה"כ לתשלום: ${booking.totalPrice} ₪`, { align: 'right' });
    }
    
    // סטטוס תשלום
    doc.moveDown();
    doc.fontSize(12).text(`סטטוס תשלום: ${booking.paymentStatus === 'paid' ? 'שולם' : booking.paymentStatus === 'partial' ? 'שולם חלקית' : 'טרם שולם'}`, { align: 'right' });
    if (booking.paymentMethod) {
      doc.text(`אמצעי תשלום: ${booking.paymentMethod}`, { align: 'right' });
    }
    
    // הערות
    if (booking.notes) {
      doc.moveDown();
      doc.fontSize(12).text('הערות:', { align: 'right', underline: true });
      doc.text(booking.notes, { align: 'right' });
    }
    
    // תודה והערות סיום
    doc.moveDown();
    doc.fontSize(10).text('תודה שבחרתם בנו!', { align: 'center' });
    doc.text('מסמך זה הופק אוטומטית ואינו דורש חתימה', { align: 'center' });
    
    // סיום המסמך
    doc.end();
    
  } catch (error) {
    console.error('שגיאה ביצירת חשבונית PDF:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה ביצירת חשבונית PDF',
      error: error.message
    });
  }
}; 