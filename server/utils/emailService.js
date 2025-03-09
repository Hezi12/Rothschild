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
    
    // יצירת ה-URL של דף ניהול ההזמנה
    const managementLink = `${process.env.CLIENT_URL || 'https://rothschild-79.onrender.com'}/manage-booking/${booking._id}`;
    
    // חישוב תאריך אחרון לביטול ללא עלות (3 ימים לפני ההגעה)
    const checkInDate = new Date(booking.checkIn);
    const cancellationDeadline = new Date(checkInDate);
    cancellationDeadline.setDate(cancellationDeadline.getDate() - 3);
    const freeCancellationUntil = cancellationDeadline.toLocaleDateString('he-IL');
    
    // תוכן המייל עם עיצוב משופר
    const mailOptions = {
      from: '"מלונית רוטשילד 79" <diamshotels@gmail.com>',
      to: booking.guest.email,
      subject: 'אישור הזמנה - מלונית רוטשילד 79',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>אישור הזמנה</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
            }
            .header {
              background-color: #1976d2;
              color: white;
              padding: 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 24px;
            }
            .booking-details {
              background-color: #f5f5f5;
              padding: 20px;
              border-radius: 6px;
              margin: 24px 0;
              border-right: 4px solid #1976d2;
            }
            .booking-details p {
              margin: 8px 0;
            }
            .management-section {
              background-color: #f0f7ff;
              padding: 20px;
              border-radius: 6px;
              margin: 24px 0;
              border-right: 4px solid #1976d2;
            }
            .cancellation-policy {
              background-color: #fff8e1;
              padding: 20px;
              border-radius: 6px;
              margin: 24px 0;
              border: 1px dashed #ffc107;
            }
            .btn {
              display: inline-block;
              background-color: #1976d2;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 4px;
              font-weight: bold;
              margin: 12px 0;
              text-align: center;
            }
            .footer {
              background-color: #f5f5f5;
              padding: 16px 24px;
              text-align: center;
              color: #666;
              font-size: 14px;
              border-top: 1px solid #eee;
            }
            .contact-info {
              margin: 24px 0;
              padding: 16px;
              background-color: #f5f5f5;
              border-radius: 6px;
            }
            .highlight {
              font-weight: bold;
              color: #1976d2;
            }
            .room-image {
              width: 100%;
              max-height: 200px;
              object-fit: cover;
              border-radius: 6px;
              margin-bottom: 16px;
            }
            @media screen and (max-width: 600px) {
              .container {
                width: 100%;
                border-radius: 0;
              }
              .header {
                padding: 16px;
              }
              .content {
                padding: 16px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>אישור הזמנה - מלונית רוטשילד 79</h1>
            </div>
            
            <div class="content">
              <p>שלום <span class="highlight">${booking.guest.name}</span>,</p>
              <p>תודה על הזמנתך במלונית רוטשילד 79. אנו שמחים לאשר את ההזמנה שלך.</p>

              ${room.imageUrl ? `<img src="${room.imageUrl}" alt="תמונת החדר" class="room-image">` : ''}
              
              <div class="booking-details">
                <h2>פרטי ההזמנה</h2>
                <p><strong>מספר הזמנה:</strong> ${booking._id}</p>
                <p><strong>חדר:</strong> ${room.name || room.type} (חדר מס' ${room.roomNumber})</p>
                <p><strong>תאריך הגעה:</strong> ${checkIn}</p>
                <p><strong>תאריך יציאה:</strong> ${checkOut}</p>
                <p><strong>מספר לילות:</strong> ${booking.nights}</p>
                <p><strong>מחיר כולל:</strong> ₪${booking.totalPrice}</p>
                <p><strong>סטטוס תשלום:</strong> ${
                  booking.paymentStatus === 'paid' ? 'שולם' : 
                  booking.paymentStatus === 'partial' ? 'תשלום חלקי' : 'טרם שולם'
                }</p>
              </div>
              
              <div class="management-section">
                <h2>ניהול ההזמנה</h2>
                <p>אתה יכול לצפות בפרטי ההזמנה, לבטל או לעדכן אותה דרך מערכת ניהול ההזמנות שלנו:</p>
                <div style="text-align: center;">
                  <a href="${managementLink}" class="btn">ניהול ההזמנה</a>
                </div>
              </div>
              
              <div class="cancellation-policy">
                <h2>מדיניות ביטול</h2>
                <ul style="padding-right: 20px; margin-bottom: 0;">
                  <li>ביטול עד <span class="highlight">${freeCancellationUntil}</span> (3 ימים לפני מועד ההגעה): ללא עלות</li>
                  <li>ביטול לאחר תאריך זה: חיוב בעלות מלאה (100%)</li>
                </ul>
              </div>
              
              <div class="contact-info">
                <h2>צור קשר</h2>
                <p><strong>כתובת:</strong> רחוב רוטשילד 79, פתח תקווה</p>
                <p><strong>טלפון:</strong> <a href="tel:0506070260">050-607-0260</a></p>
                <p><strong>וואטסאפ:</strong> <a href="https://wa.me/972506070260">לחץ כאן</a></p>
                <p><strong>דוא"ל:</strong> <a href="mailto:diamshotels@gmail.com">diamshotels@gmail.com</a></p>
              </div>
              
              <p>אנו מצפים לראותך בקרוב!</p>
              <p>בברכה,<br>צוות מלונית רוטשילד 79</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} מלונית רוטשילד 79. כל הזכויות שמורות.</p>
              <p>אם קיבלת הודעה זו בטעות, אנא פנה אלינו במייל חוזר.</p>
            </div>
          </div>
        </body>
        </html>
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