const nodemailer = require('nodemailer');

// יצירת טרנספורטר למשלוח מיילים
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'diamshotels@gmail.com',
    pass: process.env.EMAIL_PASSWORD || '' // כאן צריך להגדיר סיסמת אפליקציה מחשבון Gmail
  }
});

/**
 * פונקציה לשליחת מייל אישור הזמנה
 * @param {Object} booking - אובייקט ההזמנה
 * @param {Object} room - פרטי החדר
 */
const sendBookingConfirmation = async (booking, room) => {
  try {
    const checkIn = new Date(booking.checkIn).toLocaleDateString('he-IL');
    const checkOut = new Date(booking.checkOut).toLocaleDateString('he-IL');
    
    // תוכן המייל
    const mailOptions = {
      from: '"מלונית רוטשילד 79" <diamshotels@gmail.com>',
      to: booking.guest.email,
      subject: 'אישור הזמנה - מלונית רוטשילד 79',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>אישור הזמנה - מלונית רוטשילד 79</h2>
          <p>שלום ${booking.guest.name},</p>
          <p>תודה על הזמנתך במלונית רוטשילד 79. להלן פרטי ההזמנה:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>מספר הזמנה:</strong> ${booking._id}</p>
            <p><strong>פרטי חדר:</strong> ${room.roomNumber} - ${room.type}</p>
            <p><strong>תאריך הגעה:</strong> ${checkIn}</p>
            <p><strong>תאריך יציאה:</strong> ${checkOut}</p>
            <p><strong>מספר לילות:</strong> ${booking.nights}</p>
            <p><strong>מחיר כולל:</strong> ₪${booking.totalPrice}</p>
            <p><strong>סטטוס תשלום:</strong> ${
              booking.paymentStatus === 'paid' ? 'שולם' : 
              booking.paymentStatus === 'partial' ? 'תשלום חלקי' : 'טרם שולם'
            }</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2196F3;">
            <h3 style="margin-top: 0; color: #2196F3;">מדיניות ביטול</h3>
            <p>• ביטול עד 3 ימים לפני ההגעה - ללא עלות</p>
            <p>• ביטול פחות מ-3 ימים לפני ההגעה - חיוב במחיר מלא</p>
          </div>
          
          <p>כתובת המלונית: רוטשילד 79, פתח תקווה</p>
          <p>ליצירת קשר: 052-123-4567</p>
          
          <p>מצפים לראותך!</p>
          <p>צוות מלונית רוטשילד 79</p>
        </div>
      `
    };
    
    // שליחת המייל
    const info = await transporter.sendMail(mailOptions);
    console.log('אימייל אישור הזמנה נשלח: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('שגיאה בשליחת אימייל:', error);
    return false;
  }
};

module.exports = {
  sendBookingConfirmation
}; 