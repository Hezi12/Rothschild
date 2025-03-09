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
      subject: `אישור הזמנה #${booking.bookingNumber} - מלונית רוטשילד 79`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1976d2; padding-bottom: 15px;">
            <h2 style="color: #1976d2; margin-bottom: 5px;">אישור הזמנה - מלונית רוטשילד 79</h2>
            <p style="font-size: 16px; color: #666;">רח' רוטשילד 79, פתח תקווה</p>
          </div>

          <p style="font-size: 16px;">שלום <strong>${booking.guest.name}</strong>,</p>
          <p style="font-size: 16px;">אנו שמחים לאשר את הזמנתך במלונית רוטשילד 79. להלן פרטי ההזמנה:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #1976d2;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 40%;">מספר הזמנה:</td>
                <td style="padding: 8px 0;">${booking.bookingNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">פרטי חדר:</td>
                <td style="padding: 8px 0;">${room.roomNumber} - ${room.type}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">תאריך הגעה:</td>
                <td style="padding: 8px 0;">${checkIn}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">תאריך יציאה:</td>
                <td style="padding: 8px 0;">${checkOut}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">מספר לילות:</td>
                <td style="padding: 8px 0;">${booking.nights}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">מחיר כולל:</td>
                <td style="padding: 8px 0;">₪${booking.totalPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">סטטוס תשלום:</td>
                <td style="padding: 8px 0;">${
                  booking.paymentStatus === 'paid' ? 'שולם' : 
                  booking.paymentStatus === 'partial' ? 'תשלום חלקי' : 'טרם שולם'
                }</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fff9c4; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #f57c00; font-size: 18px;">מדיניות ביטול</h3>
            <p style="margin: 10px 0;">• ביטול עד 3 ימים לפני ההגעה - ללא עלות</p>
            <p style="margin: 10px 0;">• ביטול פחות מ-3 ימים לפני ההגעה - חיוב במחיר מלא</p>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #4caf50;">
            <h3 style="margin-top: 0; color: #2e7d32; font-size: 18px;">רוצים לבטל או לשנות את ההזמנה?</h3>
            <p style="margin: 10px 0;">לביטול או שינוי ההזמנה, ניתן לשלוח הודעת וואטסאפ למספר 050-607-0260 עם מספר ההזמנה.</p>
            <p style="margin: 15px 0; text-align: center;">
              <a href="https://wa.me/972506070260?text=שלום,%20ברצוני%20לבטל/לשנות%20את%20הזמנה%20מספר:%20${booking.bookingNumber}" 
                 style="display: inline-block; background-color: #25d366; color: white; text-decoration: none; padding: 10px 20px; border-radius: 25px; font-weight: bold;">
                פנייה לביטול דרך וואטסאפ
              </a>
            </p>
            <p style="margin: 15px 0; text-align: center;">
              <a href="${process.env.WEBSITE_URL || 'http://localhost:3000'}/cancel?id=${booking.bookingNumber}" 
                 style="display: inline-block; background-color: #f44336; color: white; text-decoration: none; padding: 10px 20px; border-radius: 25px; font-weight: bold; margin-right: 10px;">
                למעבר לדף הביטול
              </a>
            </p>
          </div>
          
          <div style="margin: 25px 0; padding: 15px; border-top: 1px solid #ddd;">
            <h3 style="color: #1976d2; font-size: 18px;">מידע שימושי</h3>
            <p><strong>כתובת המלונית:</strong> רוטשילד 79, פתח תקווה</p>
            <p><strong>צ'ק אין:</strong> החל מהשעה 15:00</p>
            <p><strong>צ'ק אאוט:</strong> עד השעה 11:00</p>
            <p><strong>טלפון:</strong> 050-607-0260</p>
            <p><strong>אימייל:</strong> diamshotels@gmail.com</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777;">
            <p>מצפים לראותך!</p>
            <p style="margin-top: 5px;"><strong>צוות מלונית רוטשילד 79</strong></p>
          </div>
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

/**
 * פונקציה לשליחת התראה למנהל על בקשת ביטול
 * @param {Object} booking - אובייקט ההזמנה
 * @param {Object} cancellationDetails - פרטי הביטול
 */
const sendCancellationAlert = async (booking, cancellationDetails) => {
  try {
    const checkIn = new Date(booking.checkIn).toLocaleDateString('he-IL');
    const checkOut = new Date(booking.checkOut).toLocaleDateString('he-IL');
    const today = new Date().toLocaleDateString('he-IL');
    const isFree = cancellationDetails.isFree;
    
    // תוכן המייל
    const mailOptions = {
      from: '"מערכת מלונית רוטשילד 79" <diamshotels@gmail.com>',
      to: process.env.ADMIN_EMAIL || 'diamshotels@gmail.com',
      subject: `התקבלה בקשת ביטול - הזמנה מס' ${booking.bookingNumber}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>התקבלה בקשת ביטול הזמנה</h2>
          <p>שלום,</p>
          <p>התקבלה בקשת ביטול להזמנה הבאה:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>מספר הזמנה:</strong> ${booking.bookingNumber}</p>
            <p><strong>שם אורח:</strong> ${booking.guest.name}</p>
            <p><strong>טלפון:</strong> ${booking.guest.phone}</p>
            <p><strong>אימייל:</strong> ${booking.guest.email}</p>
            <p><strong>תאריך הגעה:</strong> ${checkIn}</p>
            <p><strong>תאריך יציאה:</strong> ${checkOut}</p>
            <p><strong>מספר לילות:</strong> ${booking.nights}</p>
            <p><strong>מחיר כולל:</strong> ₪${booking.totalPrice}</p>
          </div>
          
          <div style="background-color: ${isFree ? '#e8f5e9' : '#ffebee'}; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${isFree ? '#4caf50' : '#f44336'};">
            <h3 style="margin-top: 0; color: ${isFree ? '#2e7d32' : '#c62828'};">פרטי ביטול</h3>
            <p><strong>תאריך בקשת ביטול:</strong> ${today}</p>
            <p><strong>ימים עד לצ'ק-אין:</strong> ${cancellationDetails.daysUntilCheckIn}</p>
            <p><strong>סטטוס ביטול:</strong> ${isFree ? 'ביטול ללא עלות' : 'ביטול בחיוב מלא'}</p>
            ${!isFree ? `<p><strong>עלות ביטול:</strong> ₪${cancellationDetails.fee}</p>` : ''}
          </div>
          
          <p>יש לבצע את הביטול במערכת באופן ידני.</p>
        </div>
      `
    };
    
    // שליחת המייל
    const info = await transporter.sendMail(mailOptions);
    console.log('התראת ביטול נשלחה למנהל: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('שגיאה בשליחת התראת ביטול:', error);
    return false;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendCancellationAlert
}; 