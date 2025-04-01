import {
  calculateNights,
  calculateTotalPrice,
  calculatePriceWithoutVat,
  calculatePriceWithVat
} from './dateUtils';

// עדכון נתוני הזמנה
export const updateBookingData = (bookingData, field, value, vatRate = 17) => {
  const updatedData = { ...bookingData };

  // טיפול בשדות מקוננים
  if (field.includes('.')) {
    const [parentField, childField] = field.split('.');
    updatedData[parentField] = {
      ...updatedData[parentField],
      [childField]: value
    };
  } else {
    updatedData[field] = value;
  }

  // טיפול בשדות מחיר
  if (['pricePerNightNoVat', 'pricePerNight', 'totalPrice'].includes(field)) {
    const nights = updatedData.nights || 1;

    switch (field) {
      case 'pricePerNightNoVat':
        const priceNoVat = parseFloat(value);
        updatedData.pricePerNight = calculatePriceWithVat(priceNoVat, vatRate);
        updatedData.totalPrice = calculateTotalPrice(priceNoVat, nights, vatRate);
        break;

      case 'pricePerNight':
        const priceWithVat = parseFloat(value);
        updatedData.pricePerNightNoVat = calculatePriceWithoutVat(priceWithVat, vatRate);
        updatedData.totalPrice = calculateTotalPrice(updatedData.pricePerNightNoVat, nights, vatRate);
        break;

      case 'totalPrice':
        const totalPrice = parseFloat(value);
        updatedData.pricePerNight = Math.round((totalPrice / nights) * 100) / 100;
        updatedData.pricePerNightNoVat = calculatePriceWithoutVat(updatedData.pricePerNight, vatRate);
        break;
    }

    // עדכון basePrice לשמירה על תאימות
    updatedData.basePrice = updatedData.pricePerNightNoVat;
  }

  return updatedData;
};

// בדיקת תקינות הזמנה
export const validateBooking = (bookingData) => {
  const errors = [];

  // בדיקת תאריכים
  if (!bookingData.checkIn || !bookingData.checkOut) {
    errors.push('נא להזין תאריכי כניסה ויציאה');
  } else if (bookingData.checkOut <= bookingData.checkIn) {
    errors.push('תאריך יציאה חייב להיות אחרי תאריך כניסה');
  }

  // בדיקת פרטי אורח
  if (!bookingData.guest?.firstName || !bookingData.guest?.lastName) {
    errors.push('נא להזין שם מלא של האורח');
  }
  if (!bookingData.guest?.phone) {
    errors.push('נא להזין מספר טלפון');
  }

  // בדיקת מחיר
  if (!bookingData.pricePerNight || bookingData.pricePerNight <= 0) {
    errors.push('נא להזין מחיר תקין');
  }

  return errors;
};

// חישוב סטטוס הזמנה
export const calculateBookingStatus = (bookingData) => {
  const now = new Date();
  const checkIn = new Date(bookingData.checkIn);
  const checkOut = new Date(bookingData.checkOut);

  if (bookingData.status === 'canceled') return 'canceled';
  if (now > checkOut) return 'completed';
  if (now >= checkIn && now <= checkOut) return 'active';
  if (now < checkIn) return 'upcoming';
  return 'pending';
};

// פורמט נתוני הזמנה להצגה
export const formatBookingForDisplay = (booking) => {
  return {
    ...booking,
    displayStatus: calculateBookingStatus(booking),
    nights: calculateNights(booking.checkIn, booking.checkOut),
    formattedCheckIn: new Date(booking.checkIn).toLocaleDateString('he-IL'),
    formattedCheckOut: new Date(booking.checkOut).toLocaleDateString('he-IL'),
    guestFullName: `${booking.guest?.firstName || ''} ${booking.guest?.lastName || ''}`.trim()
  };
};

// בדיקת התנגשות הזמנות
export const checkBookingConflict = (newBooking, existingBookings) => {
  const newCheckIn = new Date(newBooking.checkIn);
  const newCheckOut = new Date(newBooking.checkOut);

  return existingBookings.some(booking => {
    if (booking.status === 'canceled') return false;
    
    const existingCheckIn = new Date(booking.checkIn);
    const existingCheckOut = new Date(booking.checkOut);
    
    return (
      (newCheckIn >= existingCheckIn && newCheckIn < existingCheckOut) ||
      (newCheckOut > existingCheckIn && newCheckOut <= existingCheckOut) ||
      (newCheckIn <= existingCheckIn && newCheckOut >= existingCheckOut)
    );
  });
}; 