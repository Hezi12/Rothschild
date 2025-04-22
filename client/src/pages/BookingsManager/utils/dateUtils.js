import { format, addDays, subDays, addWeeks, subWeeks, isSameDay, parseISO, addMonths } from 'date-fns';
import { he } from 'date-fns/locale';

// ימי השבוע בעברית
export const hebrewDays = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת'];

// פונקציה לחישוב מספר הלילות בין שני תאריכים
export const calculateNightsFromDates = (start, end) => {
  if (!start || !end) return 0;
  
  try {
    // בדיקה שהתאריכים תקינים
    const startDate = start instanceof Date ? new Date(start) : new Date(start);
    const endDate = end instanceof Date ? new Date(end) : new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn('תאריכים לא תקינים לחישוב לילות:', start, end);
      return 0;
    }
    
    // חישוב מספר המילישניות בין התאריכים וחלוקה במספר המילישניות ביום
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('שגיאה בחישוב מספר לילות:', error);
    return 0;
  }
};

// פורמט תאריך עברי
export const formatHebrewDate = (date) => {
  if (!date) return '';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, 'dd/MM/yyyy', { locale: he });
  } catch (err) {
    console.error('שגיאה בפורמט תאריך עברי', err);
    return '';
  }
};

// פורמט תאריך אנגלי
export const formatEnglishDate = (date) => {
  if (!date) return '';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, 'MMM dd, yyyy');
  } catch (err) {
    console.error('שגיאה בפורמט תאריך אנגלי', err);
    return '';
  }
};

// פונקציות ניווט תאריכים
export const getPreviousWeek = (date) => {
  const prevWeek = new Date(date || new Date());
  prevWeek.setDate(prevWeek.getDate() - 8); // מזיז שבוע שלם אחורה
  return prevWeek;
};

export const getNextWeek = (date) => {
  const nextWeek = new Date(date || new Date());
  nextWeek.setDate(nextWeek.getDate() + 8); // מזיז שבוע שלם קדימה
  return nextWeek;
};

// פונקציה לחישוב ימים להצגה בלוח
export const calculateVisibleDays = (startDate) => {
  // משתמש ב-startDate אם קיים, אחרת היום הנוכחי
  const today = startDate || new Date();
  
  // מתחיל מיומיים לפני היום הנוכחי
  const days = [];
  
  // מוסיף 8 ימים - מתחיל מיומיים לפני היום הנוכחי
  for (let i = -2; i < 6; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  
  return days;
};

export default {
  hebrewDays,
  calculateNightsFromDates,
  formatHebrewDate,
  formatEnglishDate,
  getPreviousWeek,
  getNextWeek,
  calculateVisibleDays
}; 