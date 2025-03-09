const crypto = require('crypto');

/**
 * יוצר טוקן ביטול ייחודי ומאובטח
 * 
 * @param {string} bookingId - מזהה ההזמנה
 * @param {string} email - אימייל האורח
 * @returns {string} - טוקן ביטול ייחודי
 */
const generateCancellationToken = (bookingId, email) => {
  // משתמש בשילוב של מזהה ההזמנה, האימייל ותאריך אקראי ליצירת טוקן מאובטח
  const seed = `${bookingId}:${email}:${Date.now()}:${Math.random()}`;
  
  // יוצר hash של 32 תווים מהמחרוזת בעזרת SHA-256
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  
  // מחזיר רק 20 תווים ראשונים כדי שהקישור יהיה קצר יותר
  return hash.substring(0, 20);
};

/**
 * מוודא שהטוקן עדיין בתוקף 
 * 
 * @param {Date} bookingDate - תאריך יצירת ההזמנה
 * @param {Date} checkInDate - תאריך הצ'ק-אין
 * @returns {boolean} - האם הטוקן בתוקף
 */
const isTokenValid = (bookingDate, checkInDate) => {
  const now = new Date();
  
  // האם כבר הגיע זמן הצ'ק-אין
  if (now >= checkInDate) {
    return false;
  }
  
  // מוודא שזמן הביטול הוא לפחות 3 ימים לפני הצ'ק-אין
  const threeBeforeCheckIn = new Date(checkInDate);
  threeBeforeCheckIn.setDate(threeBeforeCheckIn.getDate() - 3);
  
  return now <= threeBeforeCheckIn;
};

module.exports = {
  generateCancellationToken,
  isTokenValid
}; 