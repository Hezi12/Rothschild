import { useState, useEffect } from 'react';
import { calculateVisibleDays, getPreviousWeek, getNextWeek } from '../utils/dateUtils';

// Hook לניהול תצוגת הלוח
const useCalendarView = () => {
  // מצב תאריכים
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(null);
  const [daysInView, setDaysInView] = useState([]);
  
  // עדכון רשימת הימים בתצוגה כאשר משתנה תאריך ההתחלה
  useEffect(() => {
    const days = calculateVisibleDays(currentWeekStartDate || new Date());
    setDaysInView(days);
  }, [currentWeekStartDate]);
  
  // הגדרת התאריך ההתחלתי בטעינה הראשונית
  useEffect(() => {
    // אם לא מוגדר תאריך התחלה, יגדיר את היום הנוכחי
    if (!currentWeekStartDate) {
      setCurrentWeekStartDate(new Date());
    }
  }, []);
  
  // פונקציות ניווט
  const goToPreviousWeek = () => {
    const prevWeek = getPreviousWeek(currentWeekStartDate || new Date());
    setCurrentWeekStartDate(prevWeek);
  };
  
  const goToNextWeek = () => {
    const nextWeek = getNextWeek(currentWeekStartDate || new Date());
    setCurrentWeekStartDate(nextWeek);
  };
  
  const goToToday = () => {
    setCurrentWeekStartDate(new Date());
  };
  
  // מעבר לתאריך מסוים
  const jumpToDate = (date) => {
    if (!date) return;
    
    const targetDate = new Date(date);
    setCurrentWeekStartDate(targetDate);
  };
  
  return {
    currentDate,
    currentWeekStartDate,
    daysInView,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    jumpToDate
  };
};

export default useCalendarView; 