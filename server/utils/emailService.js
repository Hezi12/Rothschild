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
    
    // כמות האורחים
    const guestCount = booking.guests || booking.numberOfGuests || 1;
    
    // מספר החדרים (אם קיים)
    const roomCount = booking.rooms?.length || 1;
    
    // תוכן המייל
    const mailOptions = {
      from: '"רוטשילד 79" <diamshotels@gmail.com>',
      to: booking.guest.email,
      subject: `אישור הזמנה #${booking.bookingNumber} - רוטשילד 79`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; font-size: 16px;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1976d2; padding-bottom: 15px;">
            <h2 style="color: #1976d2; margin-bottom: 8px; font-size: 28px;">אישור הזמנה - רוטשילד 79</h2>
            <p style="font-size: 18px; color: #666; margin: 0;">רח' רוטשילד 79, פתח תקווה</p>
          </div>

          <p style="font-size: 18px; margin-bottom: 12px;">שלום <strong>${booking.guest.name}</strong>,</p>
          <p style="font-size: 18px; margin-bottom: 15px;">אנו שמחים לאשר את הזמנתך ברוטשילד 79. להלן פרטי ההזמנה:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #1976d2;">
            <table style="width: 100%; border-collapse: collapse; font-size: 17px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 40%;">מספר הזמנה:</td>
                <td style="padding: 8px 0;">${booking.bookingNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">מספר חדרים:</td>
                <td style="padding: 8px 0;">${roomCount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">מספר אורחים:</td>
                <td style="padding: 8px 0;">${guestCount}</td>
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
            </table>
          </div>
          
          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #1976d2;">
            <h3 style="margin-top: 0; margin-bottom: 12px; color: #1976d2; font-size: 20px;">מידע שימושי</h3>
            <p style="margin: 10px 0; font-size: 17px;"><strong>שימו לב:</strong> אנו מציעים צ'ק אין עצמי נוח. ביום ההגעה תקבלו בוואטסאפ את כל פרטי הכניסה הדרושים</p>
            <p style="margin: 10px 0; font-size: 17px;"><strong>צ'ק אין:</strong> החל מהשעה 15:00 (ניתן להגיע מאוחר יותר בזכות צ'ק-אין עצמאי)</p>
            <p style="margin: 10px 0; font-size: 17px;"><strong>צ'ק אאוט:</strong> עד השעה 10:00</p>
            <p style="margin: 10px 0; font-size: 17px;"><strong>לכל שאלה:</strong> ניתן לפנות בטלפון 050-607-0260, להשיב למייל זה או לשלוח הודעת וואטסאפ</p>
            
            <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 15px;">
              <p style="margin: 10px 0; font-size: 17px;"><strong>לשינוי או ביטול ההזמנה:</strong> ניתן לפנות אלינו בוואטסאפ</p>
              <p style="margin: 15px 0; text-align: center;">
                <a href="https://wa.me/972506070260?text=שלום,%20אני%20${encodeURIComponent(booking.guest.name)}%20פונה%20בנוגע%20להזמה%20מספר%20${booking.bookingNumber}.%20" 
                   style="display: inline-block; background-color: #25d366; color: white; text-decoration: none; padding: 10px 20px; border-radius: 25px; font-weight: bold; font-size: 17px;">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style="vertical-align: middle; margin-left: 8px;">
                     <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                   </svg>
                   פנייה לשינוי/ביטול דרך וואטסאפ
                </a>
              </p>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #607d8b;">
            <h3 style="margin-top: 0; margin-bottom: 12px; color: #607d8b; font-size: 20px;">מדיניות המקום</h3>
            <ul style="padding-right: 20px; font-size: 17px; line-height: 1.6; margin: 10px 0;">
              <li>אסור לקיים מסיבות או אירועים רועשים</li>
              <li>אין להכניס אורחים נוספים מעבר לתפוסה המאושרת</li>
              <li>ניתן לבטל ללא עלות עד לתאריך <strong>${lastCancellationDateFormatted}</strong> (3 ימים לפני ההגעה)</li>
              <li>לאחר תאריך זה, שינויים או ביטולים יחויבו במלוא הסכום</li>
              <li>ניתן לשלם במזומן, אשראי או באמצעות ביט</li>
              <li>כרטיס האשראי נשמר כפיקדון למקרה של נזקים</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #ddd; color: #777;">
            <p style="font-size: 17px; margin: 0;">מצפים לראותך!</p>
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
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; font-size: 16px;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1976d2; padding-bottom: 15px;">
            <h2 style="color: #1976d2; margin-bottom: 8px; font-size: 28px;">התקבלה בקשת ביטול הזמנה</h2>
            <p style="font-size: 18px; color: #666; margin: 0;">רוטשילד 79, פתח תקווה</p>
          </div>
          
          <p style="font-size: 18px; margin-bottom: 12px;">שלום,</p>
          <p style="font-size: 18px; margin-bottom: 15px;">התקבלה בקשת ביטול להזמנה הבאה:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #1976d2;">
            <table style="width: 100%; border-collapse: collapse; font-size: 17px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 40%;">מספר הזמנה:</td>
                <td style="padding: 8px 0;">${booking.bookingNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">שם אורח:</td>
                <td style="padding: 8px 0;">${booking.guest.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">טלפון:</td>
                <td style="padding: 8px 0;">${booking.guest.phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">אימייל:</td>
                <td style="padding: 8px 0;">${booking.guest.email}</td>
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
            </table>
          </div>
          
          <div style="background-color: ${isFree ? '#e8f5e9' : '#ffebee'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid ${isFree ? '#4caf50' : '#f44336'};">
            <h3 style="margin-top: 0; margin-bottom: 12px; color: ${isFree ? '#2e7d32' : '#c62828'}; font-size: 20px;">פרטי ביטול</h3>
            <p style="margin: 10px 0; font-size: 17px;"><strong>תאריך בקשת ביטול:</strong> ${today}</p>
            <p style="margin: 10px 0; font-size: 17px;"><strong>ימים עד לצ'ק-אין:</strong> ${cancellationDetails.daysUntilCheckIn}</p>
            <p style="margin: 10px 0; font-size: 17px;"><strong>סטטוס ביטול:</strong> ${isFree ? 'ביטול ללא עלות' : 'ביטול בחיוב מלא'}</p>
            ${!isFree ? `<p style="margin: 10px 0; font-size: 17px;"><strong>עלות ביטול:</strong> ₪${cancellationDetails.fee.toFixed(2)}</p>` : ''}
          </div>
          
          <p style="font-size: 18px; margin-top: 20px;">יש לבצע את הביטול במערכת באופן ידני.</p>
          
          <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #ddd; color: #777;">
            <p style="font-size: 17px; margin: 0;">בברכה,</p>
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