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
    
    // חישוב תאריך אחרון לביטול ללא עלות (3 ימים לפני צ'ק-אין)
    const lastCancellationDate = new Date(booking.checkIn);
    lastCancellationDate.setDate(lastCancellationDate.getDate() - 3);
    const lastCancellationDateFormatted = lastCancellationDate.toLocaleDateString('he-IL');
    
    // בדיקה אם האורח הוא תייר
    const isTourist = booking.guest.isTourist || false;
    const priceNote = isTourist ? 
      "יש להציג דרכון בקבלה לפטור ממע\"מ" : 
      "המחיר כולל מע\"מ";
    
    // תוכן המייל
    const mailOptions = {
      from: '"רוטשילד 79" <diamshotels@gmail.com>',
      to: booking.guest.email,
      subject: `אישור הזמנה #${booking.bookingNumber} - רוטשילד 79`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; font-size: 16px;">
          <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #1976d2; padding-bottom: 20px;">
            <h2 style="color: #1976d2; margin-bottom: 8px; font-size: 28px;">אישור הזמנה - רוטשילד 79</h2>
            <p style="font-size: 18px; color: #666;">רח' רוטשילד 79, פתח תקווה</p>
          </div>

          <p style="font-size: 18px; margin-bottom: 15px;">שלום <strong>${booking.guest.name}</strong>,</p>
          <p style="font-size: 18px; margin-bottom: 20px;">אנו שמחים לאשר את הזמנתך ברוטשילד 79. להלן פרטי ההזמנה:</p>
          
          <div style="background-color: #f5f5f5; padding: 25px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #1976d2;">
            <table style="width: 100%; border-collapse: collapse; font-size: 17px;">
              <tr>
                <td style="padding: 10px 0; font-weight: bold; width: 40%;">מספר הזמנה:</td>
                <td style="padding: 10px 0;">${booking.bookingNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">מספר חדרים:</td>
                <td style="padding: 10px 0;">1</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">מספר אורחים:</td>
                <td style="padding: 10px 0;">${booking.guests || 1}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">תאריך הגעה:</td>
                <td style="padding: 10px 0;">${checkIn}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">תאריך יציאה:</td>
                <td style="padding: 10px 0;">${checkOut}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">מספר לילות:</td>
                <td style="padding: 10px 0;">${booking.nights}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">מחיר כולל:</td>
                <td style="padding: 10px 0;">₪${booking.totalPrice.toFixed(2)}<br><span style="font-size: 15px; color: #555;">${priceNote}</span></td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #f0f7ff; padding: 25px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #1976d2;">
            <h3 style="margin-top: 0; color: #1976d2; font-size: 20px;">מידע שימושי</h3>
            <p style="margin: 12px 0; font-size: 17px;"><strong>צ'ק אין:</strong> החל מהשעה 15:00 (צ'ק אין עצמאי)</p>
            <p style="margin: 12px 0; font-size: 17px;"><strong>צ'ק אאוט:</strong> עד השעה 10:00</p>
            <p style="margin: 12px 0; font-size: 17px;"><strong>כתובת:</strong> רוטשילד 79, פתח תקווה</p>
            <p style="margin: 12px 0; font-size: 17px;">ביום ההגעה יישלחו אליך בוואטסאפ כל הפרטים לכניסה למקום</p>
            
            <div style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 20px;">
              <p style="margin: 12px 0; font-size: 17px;"><strong>לשינוי או ביטול ההזמנה:</strong> ניתן לפנות אלינו בוואטסאפ</p>
              <p style="margin: 15px 0; text-align: center;">
                <a href="https://wa.me/972506070260?text=שלום,%20ברצוני%20לבטל/לשנות%20את%20הזמנה%20מספר:%20${booking.bookingNumber}" 
                   style="display: inline-block; background-color: #25d366; color: white; text-decoration: none; padding: 12px 25px; border-radius: 25px; font-weight: bold; font-size: 17px;">
                  פנייה לשינוי/ביטול דרך וואטסאפ
                </a>
              </p>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #607d8b;">
            <h3 style="margin-top: 0; color: #607d8b; font-size: 20px;">מדיניות המקום</h3>
            <ul style="padding-right: 20px; font-size: 17px; line-height: 1.7;">
              <li>אסור לקיים מסיבות או אירועים רועשים</li>
              <li>אין להכניס אורחים נוספים מעבר לתפוסה המאושרת</li>
              <li>ניתן לבטל ללא עלות עד לתאריך <strong>${lastCancellationDateFormatted}</strong></li>
              <li>לאחר תאריך זה, שינויים או ביטולים יחויבו במלוא הסכום</li>
              <li>ניתן לשלם במזומן, אשראי או באמצעות ביט</li>
              <li>כרטיס האשראי נשמר כפיקדון למקרה של נזקים</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777;">
            <p style="font-size: 17px;">מצפים לראותך!</p>
            <p style="margin-top: 5px; font-size: 17px;"><strong>צוות רוטשילד 79</strong></p>
            <p style="margin-top: 15px; font-size: 16px;">טלפון: 050-607-0260 | אימייל: diamshotels@gmail.com</p>
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
      from: '"מערכת רוטשילד 79" <diamshotels@gmail.com>',
      to: process.env.ADMIN_EMAIL || 'diamshotels@gmail.com',
      subject: `התקבלה בקשת ביטול - הזמנה מס' ${booking.bookingNumber}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; font-size: 16px;">
          <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #1976d2; padding-bottom: 20px;">
            <h2 style="color: #1976d2; margin-bottom: 8px; font-size: 28px;">התקבלה בקשת ביטול הזמנה</h2>
            <p style="font-size: 18px; color: #666;">רוטשילד 79, פתח תקווה</p>
          </div>
          
          <p style="font-size: 18px; margin-bottom: 20px;">שלום,</p>
          <p style="font-size: 18px; margin-bottom: 20px;">התקבלה בקשת ביטול להזמנה הבאה:</p>
          
          <div style="background-color: #f5f5f5; padding: 25px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #1976d2;">
            <table style="width: 100%; border-collapse: collapse; font-size: 17px;">
              <tr>
                <td style="padding: 10px 0; font-weight: bold; width: 40%;">מספר הזמנה:</td>
                <td style="padding: 10px 0;">${booking.bookingNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">שם אורח:</td>
                <td style="padding: 10px 0;">${booking.guest.name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">טלפון:</td>
                <td style="padding: 10px 0;">${booking.guest.phone}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">אימייל:</td>
                <td style="padding: 10px 0;">${booking.guest.email}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">תאריך הגעה:</td>
                <td style="padding: 10px 0;">${checkIn}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">תאריך יציאה:</td>
                <td style="padding: 10px 0;">${checkOut}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">מספר לילות:</td>
                <td style="padding: 10px 0;">${booking.nights}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">מחיר כולל:</td>
                <td style="padding: 10px 0;">₪${booking.totalPrice.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: ${isFree ? '#e8f5e9' : '#ffebee'}; padding: 25px; border-radius: 8px; margin: 25px 0; border-right: 4px solid ${isFree ? '#4caf50' : '#f44336'};">
            <h3 style="margin-top: 0; color: ${isFree ? '#2e7d32' : '#c62828'}; font-size: 20px;">פרטי ביטול</h3>
            <p style="margin: 12px 0; font-size: 17px;"><strong>תאריך בקשת ביטול:</strong> ${today}</p>
            <p style="margin: 12px 0; font-size: 17px;"><strong>ימים עד לצ'ק-אין:</strong> ${cancellationDetails.daysUntilCheckIn}</p>
            <p style="margin: 12px 0; font-size: 17px;"><strong>סטטוס ביטול:</strong> ${isFree ? 'ביטול ללא עלות' : 'ביטול בחיוב מלא'}</p>
            ${!isFree ? `<p style="margin: 12px 0; font-size: 17px;"><strong>עלות ביטול:</strong> ₪${cancellationDetails.fee.toFixed(2)}</p>` : ''}
          </div>
          
          <p style="font-size: 18px; margin-top: 25px;">יש לבצע את הביטול במערכת באופן ידני.</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777;">
            <p style="margin-top: 5px; font-size: 17px;"><strong>צוות רוטשילד 79</strong></p>
          </div>
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