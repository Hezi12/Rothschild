// העתק את הקוד הזה ומקם אותו בקובץ client/src/pages/BookingListView.js
// מיד אחרי פונקציית closeBookingDialog

// טיפול בשינויים בטופס עריכת הזמנה
const handleBookingFormChange = (field, value) => {
  setBookingDialog(prev => {
    // העתקת אובייקט הנתונים
    const updatedBookingData = {
      ...prev.bookingData
    };
    
    // עדכון השדה המשתנה
    if (field.includes('.')) {
      // טיפול בשדות מקוננים (למשל creditCard.cardNumber)
      const [parentField, childField] = field.split('.');
      updatedBookingData[parentField] = {
        ...updatedBookingData[parentField],
        [childField]: value
      };
    } else {
      // עדכון שדה רגיל
      updatedBookingData[field] = value;
    }
    
    // אם מדובר בשדה מחיר, נעדכן את שאר שדות המחיר
    if (['pricePerNightNoVat', 'pricePerNight', 'totalPrice'].includes(field)) {
      const nights = updatedBookingData.nights || 1;
      
      // אם שינו מחיר ללילה ללא מע"מ
      if (field === 'pricePerNightNoVat') {
        const priceNoVat = parseFloat(value);
        
        // עדכון מחיר ללילה כולל מע"מ
        updatedBookingData.pricePerNight = Math.round((priceNoVat * (1 + vatRate / 100)) * 100) / 100;
        // עדכון סה"כ להזמנה
        updatedBookingData.totalPrice = Math.round(updatedBookingData.pricePerNight * nights * 100) / 100;
      }
      
      // אם שינו מחיר ללילה כולל מע"מ
      else if (field === 'pricePerNight') {
        const priceWithVat = parseFloat(value);
        
        // עדכון מחיר ללילה ללא מע"מ
        updatedBookingData.pricePerNightNoVat = Math.round((priceWithVat / (1 + vatRate / 100)) * 100) / 100;
        // עדכון סה"כ להזמנה
        updatedBookingData.totalPrice = Math.round(priceWithVat * nights * 100) / 100;
      }
      
      // אם שינו סה"כ מחיר להזמנה
      else if (field === 'totalPrice') {
        const totalPrice = parseFloat(value);
        
        // עדכון מחיר ללילה כולל מע"מ
        updatedBookingData.pricePerNight = Math.round((totalPrice / nights) * 100) / 100;
        // עדכון מחיר ללילה ללא מע"מ
        updatedBookingData.pricePerNightNoVat = Math.round((updatedBookingData.pricePerNight / (1 + vatRate / 100)) * 100) / 100;
      }
      
      // עדכון שדה basePrice לשמירה על תאימות עם המודל הקיים
      updatedBookingData.basePrice = updatedBookingData.pricePerNightNoVat;
      
      console.log('עדכון נתוני מחיר:', {
        totalPrice: updatedBookingData.totalPrice,
        pricePerNight: updatedBookingData.pricePerNight,
        pricePerNightNoVat: updatedBookingData.pricePerNightNoVat
