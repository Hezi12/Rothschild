import { addDays } from 'date-fns';

// פונקציה ליצירת אובייקט הזמנה חדש
export const createEmptyBooking = (roomId = "", date = null, room = null) => {
  // חיפוש פרטי החדר לפי מזהה
  const selectedRoom = room || null;
  
  // תאריך צ'ק אין - התאריך שנבחר
  const checkInDate = date ? new Date(date) : new Date();
  // תאריך צ'ק אאוט - יום אחד אחרי בברירת מחדל
  const checkOutDate = addDays(checkInDate, 1);
  
  // חישוב מספר לילות (ברירת מחדל: לילה אחד)
  const nights = 1;
  
  // חישוב מחיר בסיסי אם החדר נמצא
  const basePrice = selectedRoom?.basePrice || "";
  
  return {
    _id: null, // אין מזהה - הזמנה חדשה
    roomId: roomId || "",
    roomNumber: selectedRoom?.roomNumber || "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    startDate: checkInDate,
    endDate: checkOutDate,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    adults: 2,
    children: 0,
    pricePerNight: basePrice,
    tourist: false,
    notes: "",
    status: "confirmed",
    paymentMethod: "cash",
    isPaid: false,
    // מידע משלים למבנה ההזמנה החדשה
    guest: {
      firstName: "",
      lastName: "",
      phone: "",
      email: ""
    },
    nights: nights
  };
};

// התאמת הזמנה מהשרת למבנה המתאים לעריכה
export const adaptBookingForEditing = (booking) => {
  if (!booking) {
    console.error("הועבר אובייקט הזמנה ריק");
    return null;
  }
  
  // יוצרים עותק של ההזמנה
  const adaptedBooking = { ...booking };
  
  // טיפול בשדה roomId
  if (booking.room && booking.room._id) {
    adaptedBooking.roomId = booking.room._id;
  } else if (booking.roomId) {
    adaptedBooking.roomId = booking.roomId;
  }
  
  // טיפול בנתוני אורח - וידוא שנתוני האורח יוצגו נכון
  if (booking.guest) {
    adaptedBooking.firstName = booking.guest.firstName || '';
    adaptedBooking.lastName = booking.guest.lastName || '';
    adaptedBooking.email = booking.guest.email || '';
    adaptedBooking.phone = booking.guest.phone || '';
  }
  
  // טיפול בפרטי כרטיס אשראי
  if (booking.creditCard) {
    if (typeof booking.creditCard === 'object') {
      adaptedBooking.creditCard = booking.creditCard.cardNumber || '';
      adaptedBooking.cardHolderName = booking.creditCard.cardholderName || booking.creditCard.cardHolderName || '';
      adaptedBooking.expiryDate = booking.creditCard.expiryDate || '';
      adaptedBooking.cvv = booking.creditCard.cvv || '';
    }
  } else {
    adaptedBooking.creditCard = '';
    adaptedBooking.cardHolderName = booking.cardHolderName || '';
    adaptedBooking.expiryDate = booking.expiryDate || '';
    adaptedBooking.cvv = booking.cvv || '';
  }
  
  // עדכון הערות
  adaptedBooking.notes = booking.notes || '';
  
  // הגדרת מספר מבוגרים וילדים
  adaptedBooking.adults = booking.adults || 2;
  adaptedBooking.children = booking.children || 0;
  
  // חישוב מע"מ (17%)
  adaptedBooking.vat = (adaptedBooking.totalPrice || 0) * 0.17;
  adaptedBooking.totalPriceWithVAT = (adaptedBooking.totalPrice || 0) + adaptedBooking.vat;
  
  return adaptedBooking;
};

// וולידציה בסיסית להזמנה
export const validateBooking = (booking) => {
  const errors = {};
  
  if (!booking.roomId) {
    errors.roomId = 'נא לבחור חדר';
  }
  
  // בדיקת פרטי אורח - תמיכה במבנה הישן והחדש
  if (booking.guest) {
    // מבנה חדש - אורח כאובייקט נפרד
    if (!booking.guest.firstName) {
      errors.firstName = 'נא להזין שם פרטי';
    }
    
    if (!booking.guest.lastName) {
      errors.lastName = 'נא להזין שם משפחה';
    }
    
    if (!booking.guest.phone) {
      errors.phone = 'נא להזין מספר טלפון';
    }
  } else {
    // מבנה ישן - פרטי אורח ברמה העליונה
    if (!booking.firstName) {
      errors.firstName = 'נא להזין שם פרטי';
    }
    
    if (!booking.lastName) {
      errors.lastName = 'נא להזין שם משפחה';
    }
    
    if (!booking.phone) {
      errors.phone = 'נא להזין מספר טלפון';
    }
  }
  
  // בדיקת תאריכים - תמיכה בשני פורמטים
  const checkInDate = booking.checkIn || booking.startDate;
  const checkOutDate = booking.checkOut || booking.endDate;
  
  if (!checkInDate) {
    errors.startDate = 'נא לבחור תאריך צ\'ק-אין';
  }
  
  if (!checkOutDate) {
    errors.endDate = 'נא לבחור תאריך צ\'ק-אאוט';
  }
  
  if (checkInDate && checkOutDate) {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    
    if (start >= end) {
      errors.endDate = 'תאריך צ\'ק-אאוט חייב להיות מאוחר מתאריך צ\'ק-אין';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// פורמט סטטוס הזמנה לעברית
export const formatBookingStatus = (status) => {
  switch (status) {
    case 'confirmed': return 'מאושר';
    case 'pending': return 'ממתין';
    case 'canceled': return 'בוטל';
    case 'completed': return 'הושלם';
    default: return status || '';
  }
};

// פורמט אמצעי תשלום לעברית
export const formatPaymentMethod = (method) => {
  if (!method) return '';
  
  switch (method) {
    case 'cash': return 'מזומן';
    case 'creditOr': return 'אשראי אור יהודה';
    case 'creditRothschild': return 'אשראי רוטשילד';
    case 'mizrahi': return 'העברה מזרחי';
    case 'bitMizrahi': return 'ביט מזרחי';
    case 'payboxMizrahi': return 'פייבוקס מזרחי';
    case 'poalim': return 'העברה פועלים';
    case 'bitPoalim': return 'ביט פועלים';
    case 'payboxPoalim': return 'פייבוקס פועלים';
    case 'other': return 'אחר';
    default: return method;
  }
};

export default {
  createEmptyBooking,
  adaptBookingForEditing,
  validateBooking,
  formatBookingStatus,
  formatPaymentMethod
}; 