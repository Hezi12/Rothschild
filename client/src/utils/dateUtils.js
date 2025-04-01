import { 
  format, 
  parseISO, 
  addDays, 
  addMonths, 
  subMonths, 
  isSameDay, 
  getDay, 
  differenceInDays,
  startOfMonth,
  endOfMonth,
  isToday,
  isWeekend
} from 'date-fns';
import { he } from 'date-fns/locale';

// פורמט תאריך בעברית
export const formatHebrewDate = (date) => {
  return format(date, 'dd/MM/yyyy', { locale: he });
};

// פורמט תאריך מלא בעברית
export const formatHebrewFullDate = (date) => {
  return format(date, 'dd/MM/yyyy HH:mm', { locale: he });
};

// חישוב מספר לילות בין שני תאריכים
export const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  return Math.ceil(differenceInDays(checkOut, checkIn));
};

// בדיקה אם תאריך הוא בסוף שבוע
export const isWeekendDay = (date) => {
  const day = getDay(date);
  return day === 5 || day === 6; // שבת או שישי
};

// יצירת מערך של ימים בחודש
export const getDaysInMonth = (date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = [];
  
  let current = start;
  while (current <= end) {
    days.push({
      date: current,
      isToday: isToday(current),
      isWeekend: isWeekendDay(current)
    });
    current = addDays(current, 1);
  }
  
  return days;
};

// המרת תאריך מסטרינג לאובייקט Date
export const parseDateString = (dateString) => {
  if (!dateString) return null;
  return parseISO(dateString);
};

// בדיקה אם תאריך הוא בתוך טווח
export const isDateInRange = (date, startDate, endDate) => {
  if (!date || !startDate || !endDate) return false;
  return date >= startDate && date <= endDate;
};

// חישוב מחיר כולל לפי מספר לילות
export const calculateTotalPrice = (pricePerNight, nights, vatRate = 17) => {
  if (!pricePerNight || !nights) return 0;
  const priceWithVat = pricePerNight * (1 + vatRate / 100);
  return Math.round(priceWithVat * nights * 100) / 100;
};

// חישוב מחיר ללילה ללא מע"מ
export const calculatePriceWithoutVat = (priceWithVat, vatRate = 17) => {
  if (!priceWithVat) return 0;
  return Math.round((priceWithVat / (1 + vatRate / 100)) * 100) / 100;
};

// חישוב מחיר ללילה כולל מע"מ
export const calculatePriceWithVat = (priceWithoutVat, vatRate = 17) => {
  if (!priceWithoutVat) return 0;
  return Math.round((priceWithoutVat * (1 + vatRate / 100)) * 100) / 100;
}; 