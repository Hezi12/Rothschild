// קבועים
export const VAT_RATE = 0.17; // שיעור המע"מ
export const PRICE_DECIMALS = 2; // מספר ספרות אחרי הנקודה לעיגול מחירים

/**
 * פונקציית עיגול אחידה
 * @param {number} value - הערך לעיגול
 * @param {number} decimals - מספר ספרות אחרי הנקודה
 * @returns {number} - הערך המעוגל
 */
export const roundTo = (value, decimals = PRICE_DECIMALS) => {
  if (!value || isNaN(value)) return 0;
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * המרת מחרוזת או מספר למספר מעוגל
 * @param {string|number} input - קלט (מחרוזת או מספר)
 * @returns {number} - מספר מעוגל לפי ההגדרות
 */
export const parseAndRound = (input) => {
  if (!input) return 0;
  const parsed = typeof input === 'string' ? parseFloat(input) : input;
  if (isNaN(parsed)) return 0;
  return roundTo(parsed);
};

/**
 * חישוב מחיר עם מע"מ
 * @param {string|number} price - מחיר ללא מע"מ
 * @returns {number} - מחיר כולל מע"מ (מעוגל)
 */
export const calculatePriceWithVAT = (price) => {
  const priceValue = parseAndRound(price);
  return roundTo(priceValue * (1 + VAT_RATE));
};

/**
 * חישוב מחיר ללא מע"מ
 * @param {string|number} priceWithVAT - מחיר כולל מע"מ
 * @returns {number} - מחיר ללא מע"מ (מעוגל)
 */
export const calculatePriceWithoutVAT = (priceWithVAT) => {
  const priceValue = parseAndRound(priceWithVAT);
  return roundTo(priceValue / (1 + VAT_RATE));
};

/**
 * חישוב סכום המע"מ עצמו
 * @param {string|number} basePrice - מחיר ללא מע"מ
 * @returns {number} - סכום המע"מ (מעוגל)
 */
export const calculateVATAmount = (basePrice) => {
  const basePriceValue = parseAndRound(basePrice);
  return roundTo(basePriceValue * VAT_RATE);
};

/**
 * חישוב מחיר כולל להזמנה
 * @param {string|number} price - מחיר לילה (ללא מע"מ)
 * @param {number} nights - מספר לילות
 * @param {boolean} isTourist - האם תייר (פטור ממע"מ)
 * @returns {number} - מחיר כולל להזמנה (מעוגל)
 */
export const calculateTotalPrice = (price, nights, isTourist) => {
  if (!price || nights <= 0) {
    return 0;
  }
  
  const basePricePerNight = parseAndRound(price);
  const basePriceTotal = roundTo(basePricePerNight * nights);
  
  if (isTourist) {
    // לתייר - אין מע"מ
    return basePriceTotal;
  } else {
    // לישראלי - תוספת מע"מ
    const vatAmount = calculateVATAmount(basePriceTotal);
    return roundTo(basePriceTotal + vatAmount);
  }
};

/**
 * חישוב מחיר כולל להזמנה (כמחרוזת)
 * @param {string|number} price - מחיר לילה
 * @param {number} nights - מספר לילות
 * @param {boolean} isTourist - האם תייר
 * @returns {string} - מחיר כולל כמחרוזת
 */
export const updateTotalPrice = (price, nights, isTourist) => {
  const totalPrice = calculateTotalPrice(price, nights, isTourist);
  return totalPrice.toString();
};

/**
 * עדכון מחיר לילה כולל מע"מ בהתאם למחיר לילה ללא מע"מ
 * @param {string|number} pricePerNight - מחיר לילה ללא מע"מ
 * @returns {string} - מחיר לילה כולל מע"מ כמחרוזת
 */
export const updatePriceWithVAT = (pricePerNight) => {
  const priceWithVAT = calculatePriceWithVAT(pricePerNight);
  return priceWithVAT.toString();
};

/**
 * עדכון מחיר לילה ללא מע"מ בהתאם למחיר לילה כולל מע"מ
 * @param {string|number} priceWithVAT - מחיר לילה כולל מע"מ
 * @returns {string} - מחיר לילה ללא מע"מ כמחרוזת
 */
export const updatePricePerNight = (priceWithVAT) => {
  const priceWithoutVAT = calculatePriceWithoutVAT(priceWithVAT);
  return priceWithoutVAT.toString();
};

/**
 * פורמט מחיר לתצוגה
 * @param {string|number} price - המחיר לפורמט
 * @returns {string} - מחיר מפורמט
 */
export const formatPrice = (price) => {
  if (!price) return '0 ₪';
  const roundedPrice = roundTo(parseFloat(price));
  return `${roundedPrice.toLocaleString('he-IL')} ₪`;
};

export default {
  VAT_RATE,
  PRICE_DECIMALS,
  roundTo,
  parseAndRound,
  calculatePriceWithVAT,
  calculatePriceWithoutVAT,
  calculateVATAmount,
  calculateTotalPrice,
  updateTotalPrice,
  updatePriceWithVAT,
  updatePricePerNight,
  formatPrice
}; 