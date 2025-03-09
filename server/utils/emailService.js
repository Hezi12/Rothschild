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
    
    // חישוב תאריך של 3 ימים לפני ההגעה עבור מדיניות ביטול
    const cancelDate = new Date(booking.checkIn);
    cancelDate.setDate(cancelDate.getDate() - 3);
    const freeCancelUntil = cancelDate.toLocaleDateString('he-IL');
    
    // ליצירת קישור לניהול ההזמנה - משתמש בכתובת האתר ולא בכתובת ה-API
    const siteUrl = process.env.FRONTEND_URL || 'https://rothschild-gamma.vercel.app';
    const manageBookingUrl = `${siteUrl}/manage-booking/${booking._id}`;
    
    // תוכן המייל
    const mailOptions = {
      from: '"מלונית רוטשילד 79" <diamshotels@gmail.com>',
      to: booking.guest.email,
      subject: 'אישור הזמנה - מלונית רוטשילד 79',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">אישור הזמנה - מלונית רוטשילד 79</h2>
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
          
          <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #1976d2; background-color: #e3f2fd;">
            <h3 style="margin-top: 0; color: #1976d2;">ניהול ההזמנה</h3>
            <p>לצפייה, עדכון או ביטול ההזמנה, אנא לחץ על הקישור הבא:</p>
            <p style="margin: 15px 0;">
              <a href="${manageBookingUrl}" style="background-color: #1976d2; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">לניהול ההזמנה</a>
            </p>
          </div>
          
          <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; background-color: #f9f9f9;">
            <h3 style="margin-top: 0; color: #555;">מדיניות ביטול</h3>
            <ul style="padding-right: 20px;">
              <li>ביטול עד ${freeCancelUntil} (3 ימים לפני ההגעה) - ללא עלות</li>
              <li>ביטול מתאריך ${freeCancelUntil} ועד למועד ההגעה - חיוב מלא (100%)</li>
            </ul>
            <p style="font-size: 0.9em; color: #666;">* במקרה של ביטול, יישלח אישור ביטול לכתובת האימייל שלך.</p>
          </div>
          
          <p>כתובת המלונית: רוטשילד 79, פתח תקווה</p>
          <p>ליצירת קשר: 050-607-0260</p>
          
          <p>מצפים לראותך!</p>
          <p style="margin-bottom: 0;">צוות מלונית רוטשילד 79</p>
          <p style="color: #666; font-size: 0.8em; margin-top: 5px;">* אין להשיב למייל זה. לפניות ובירורים יש ליצור קשר בטלפון או באתר.</p>
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
 * פונקציה לשליחת מייל אישור ביטול
 * @param {Object} booking - אובייקט ההזמנה
 * @param {Object} room - פרטי החדר
 * @param {Object} cancellationDetails - פרטי הביטול
 */
const sendCancellationConfirmation = async (booking, room, cancellationDetails) => {
  try {
    const checkIn = new Date(booking.checkIn).toLocaleDateString('he-IL');
    const checkOut = new Date(booking.checkOut).toLocaleDateString('he-IL');
    const cancellationDate = new Date().toLocaleDateString('he-IL');
    
    // ליצירת קישור לצפייה בהזמנה המבוטלת
    const siteUrl = process.env.FRONTEND_URL || 'https://rothschild-gamma.vercel.app';
    const viewBookingUrl = `${siteUrl}/manage-booking/${booking._id}`;
    
    // תוכן המייל
    const mailOptions = {
      from: '"מלונית רוטשילד 79" <diamshotels@gmail.com>',
      to: booking.guest.email,
      subject: 'אישור ביטול הזמנה - מלונית רוטשילד 79',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #e91e63; border-bottom: 2px solid #e91e63; padding-bottom: 10px;">אישור ביטול הזמנה - מלונית רוטשילד 79</h2>
          <p>שלום ${booking.guest.name},</p>
          <p>הזמנתך במלונית רוטשילד 79 בוטלה בהצלחה. להלן פרטי ההזמנה שבוטלה:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>מספר הזמנה:</strong> ${booking._id}</p>
            <p><strong>פרטי חדר:</strong> ${room.roomNumber} - ${room.type}</p>
            <p><strong>תאריך הגעה (מקורי):</strong> ${checkIn}</p>
            <p><strong>תאריך יציאה (מקורי):</strong> ${checkOut}</p>
            <p><strong>תאריך ביטול:</strong> ${cancellationDate}</p>
          </div>
          
          ${cancellationDetails.refundAmount > 0 ? `
            <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #43a047; background-color: #e8f5e9;">
              <h3 style="margin-top: 0; color: #43a047;">פרטי החזר</h3>
              <p><strong>סכום ששולם:</strong> ₪${booking.amountPaid || 0}</p>
              <p><strong>סכום להחזר:</strong> ₪${cancellationDetails.refundAmount}</p>
              <p><strong>סיבת הביטול:</strong> ${cancellationDetails.reason || 'לא צוין'}</p>
              <p>ההחזר יתבצע באמצעות ${booking.paymentMethod === 'credit' ? 'כרטיס האשראי שחויב' : 'העברה בנקאית'} תוך 7-14 ימי עסקים.</p>
            </div>
          ` : `
            <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #f44336; background-color: #ffebee;">
              <h3 style="margin-top: 0; color: #f44336;">מידע על החזר</h3>
              <p>בהתאם למדיניות הביטול, לא ניתן החזר כספי לביטול הזמנה זו.</p>
              <p><strong>סיבה:</strong> הביטול בוצע פחות מ-3 ימים לפני מועד ההגעה.</p>
            </div>
          `}
          
          <div style="margin: 20px 0;">
            <p>לצפייה בפרטי ההזמנה המבוטלת, אנא לחץ על הקישור הבא:</p>
            <p style="margin: 15px 0;">
              <a href="${viewBookingUrl}" style="background-color: #9e9e9e; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">לצפייה בהזמנה המבוטלת</a>
            </p>
          </div>
          
          <p>אנו מקווים לראותך בביקורים עתידיים במלונית רוטשילד 79.</p>
          <p style="margin-bottom: 0;">צוות מלונית רוטשילד 79</p>
          <p style="color: #666; font-size: 0.8em; margin-top: 5px;">* אין להשיב למייל זה. לפניות ובירורים יש ליצור קשר בטלפון 050-607-0260 או באתר.</p>
        </div>
      `
    };
    
    // שליחת המייל
    const info = await transporter.sendMail(mailOptions);
    console.log('אימייל אישור ביטול נשלח: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('שגיאה בשליחת אימייל ביטול:', error);
    return false;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendCancellationConfirmation
}; 