const nodemailer = require('nodemailer');

// יצירת טרנספורטר למשלוח מיילים
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'diamshotels@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'zdzp btdr fgdq nmzz' // סיסמת האפליקציה של Gmail
  }
});

/**
 * פונקציה לשליחת מייל אישור הזמנה
 * @param {Object} booking - אובייקט ההזמנה
 * @param {Object} room - פרטי החדר
 */
const sendBookingConfirmation = async (booking, room) => {
  try {
    // בדיקה שיש כתובת אימייל בהזמנה
    if (!booking.guest || !booking.guest.email) {
      console.error('שגיאה: אין כתובת אימייל באובייקט ההזמנה', booking);
      return false;
    }
    
    console.log('מנסה לשלוח אימייל אל:', booking.guest.email);
    
    const checkIn = new Date(booking.checkIn).toLocaleDateString('he-IL');
    const checkOut = new Date(booking.checkOut).toLocaleDateString('he-IL');
    
    // יצירת מספר הזמנה קצר ונוח (אם אין אחד)
    const bookingNumber = booking.bookingNumber || booking._id.substring(0, 8).toUpperCase();
    
    // חישוב סכום מקדמה (30% מהסכום הכולל)
    const deposit = (booking.totalPrice * 0.3).toFixed(0);
    
    // תוכן המייל
    const mailOptions = {
      from: '"מלונית רוטשילד 79" <diamshotels@gmail.com>',
      to: booking.guest.email,
      subject: `אישור הזמנה #${bookingNumber} - מלונית רוטשילד 79`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #333;">
          
          <!-- לוגו וכותרת -->
          <div style="text-align: center; background-color: #003366; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">מלונית רוטשילד 79</h1>
            <p style="margin: 5px 0 0 0;">אישור הזמנה</p>
          </div>
          
          <!-- תוכן ההודעה -->
          <div style="padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px;">שלום <strong>${booking.guest.name}</strong>,</p>
            <p>תודה שבחרת במלונית רוטשילד 79. ההזמנה שלך אושרה בהצלחה!</p>
            
            <!-- פרטי ההזמנה -->
            <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #003366; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">פרטי ההזמנה #${bookingNumber}</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; width: 40%; color: #666; font-weight: bold;">חדר:</td>
                  <td style="padding: 8px 0;">${room.roomNumber} - ${room.type}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                  <td style="padding: 8px 0; width: 40%; color: #666; font-weight: bold;">תאריך הגעה:</td>
                  <td style="padding: 8px 0;">${checkIn}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; width: 40%; color: #666; font-weight: bold;">תאריך יציאה:</td>
                  <td style="padding: 8px 0;">${checkOut}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                  <td style="padding: 8px 0; width: 40%; color: #666; font-weight: bold;">מספר לילות:</td>
                  <td style="padding: 8px 0;">${booking.nights}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; width: 40%; color: #666; font-weight: bold;">מחיר כולל:</td>
                  <td style="padding: 8px 0; font-weight: bold;">₪${booking.totalPrice}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                  <td style="padding: 8px 0; width: 40%; color: #666; font-weight: bold;">סטטוס תשלום:</td>
                  <td style="padding: 8px 0;">${
                    booking.paymentStatus === 'paid' ? 'שולם במלואו' : 
                    booking.paymentStatus === 'partial' ? 'תשלום חלקי' : 'טרם שולם'
                  }</td>
                </tr>
              </table>
            </div>
            
            <!-- מידע נוסף -->
            <div style="margin: 20px 0; background-color: #fffaed; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #e6a100; font-size: 16px;">שים לב</h3>
              <p style="margin-bottom: 10px;">יש להגיע למלונית עם תעודה מזהה ואמצעי תשלום.</p>
              <p style="margin-bottom: 0;">במידה והנך אזרח חו"ל, נא להביא דרכון בתוקף.</p>
            </div>
            
            <!-- פרטי קשר -->
            <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <h3 style="margin-top: 0; color: #0277bd; font-size: 16px;">פרטי קשר</h3>
              <p style="margin-bottom: 5px;"><strong>כתובת:</strong> רוטשילד 79, פתח תקווה</p>
              <p style="margin-bottom: 5px;"><strong>טלפון:</strong> 050-607-0260</p>
              <p style="margin-bottom: 0;"><strong>אימייל:</strong> diamshotels@gmail.com</p>
            </div>
            
            <!-- חתימה -->
            <div style="margin-top: 30px; text-align: center; color: #666;">
              <p>מצפים לראותך!</p>
              <p style="margin-bottom: 0;">צוות מלונית רוטשילד 79</p>
            </div>
          </div>
          
          <!-- תחתית -->
          <div style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
            <p>© 2024 מלונית רוטשילד 79. כל הזכויות שמורות.</p>
          </div>
          
        </div>
      `
    };
    
    // שליחת המייל
    console.log('שולח אימייל...');
    const info = await transporter.sendMail(mailOptions);
    console.log('אימייל אישור הזמנה נשלח: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('שגיאה בשליחת אימייל:', error);
    // הדפסת פרטי השגיאה לצורכי ניפוי באגים
    if (error.response) {
      console.error('פרטי שגיאת SMTP:', error.response);
    }
    return false;
  }
};

module.exports = {
  sendBookingConfirmation
}; 