const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json());

// סכמה של חדר
const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  // שדות נוספים שיכולים להיות שימושיים
});

// סכמה של הזמנה
const bookingSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  guestName: String,
  guestEmail: String,
  guestPhone: String,
  notes: String
});

// יצירת מודלים
const Room = mongoose.model('Room', roomSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// התחברות למסד הנתונים
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB התחברות למסד הנתונים נוצרה בהצלחה'))
  .catch(err => console.error('MongoDB שגיאה בהתחברות למסד הנתונים:', err));

// נקודת קצה לטיפול בבקשות צ'אט
app.post('/api/chat', async (req, res) => {
  try {
    // וידוא שמפתח ה-API נמצא
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.error('מפתח OpenAI API חסר בהגדרות השרת');
      return res.status(500).json('שגיאת שרת פנימית');
    }

    // מטען מערכת קבוע שיתווסף לכל בקשה
    const SYSTEM_PROMPT = `אתה עוזר וירטואלי ידידותי והומוריסטי של מלונית רוטשילד 79 בפתח תקווה.
מידע על המלונית:
- המלונית ממוקמת ברחוב רוטשילד 79, פתח תקווה במרכז העיר
- המקום קרוב לתחבורה ציבורית
- יש חניה על בסיס מקום פנוי
- החדרים נקיים ופרטיים לגמרי (לא מחולקים) 
- מקום שקט המספק תמורה מלאה למחיר
- המלונית מציעה חדרים מאובזרים עם WiFi, מיזוג, טלוויזיה ומקלחת פרטית
- ניתן להזמין חדרים דרך האתר, טלפון או אימייל
- שעות צ'ק-אין: מהשעה 15:00, ניתן לבצע צ'ק-אין עצמאי ולהגיע בכל שעה
- שעות צ'ק-אאוט: עד השעה 10:00
- מדיניות ביטול: ביטול חינם עד 3 ימים לפני ההגעה, לאחר מכן חיוב מלא

ענה בעברית בצורה מנומסת, ידידותית וקצת הומוריסטית. אם נשאלת על מידע שאינו קשור למלונית או לאירוח, הסבר בנימוס שאתה יכול לעזור רק בנושאים הקשורים למלונית ושירותיה.

אם נשאלת שאלה שאין לך מידע מדויק לגביה, ציין שהאתר עדיין בבנייה והמליץ לפנות בוואטסאפ למספר 0506070260. 
כאשר אתה ממליץ לפנות בוואטסאפ, שלב את הקישור הבא בתשובתך: https://wa.me/972506070260
אל תכתוב את הקישור כטקסט מסביר, פשוט שלב אותו כקישור בתוך המשפט שלך, והמערכת תציג אותו כאייקון.

אל תמציא מידע שאינו מופיע למעלה.`;

    // הכנת ההודעות לשליחה ל-API של OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...req.body.messages.slice(-10) // שומר רק 10 הודעות אחרונות למניעת חריגה בגודל הבקשה
    ];

    // שליחת בקשה ל-API של OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500, // הגבלת אורך תשובה
        temperature: 0.7, // מידת היצירתיות (0-1)
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    // שליפת התשובה מהתגובה של OpenAI
    const assistantResponse = response.data.choices[0].message.content;
    
    // החזרת התשובה לקליינט
    return res.json(assistantResponse);
  } catch (error) {
    console.error('שגיאה בתקשורת עם OpenAI:', error.response?.data || error.message);
    
    // התמודדות עם שגיאות שונות
    if (error.response?.status === 429) {
      return res.status(429).json('הגעת למגבלת בקשות. אנא נסה שוב מאוחר יותר.');
    }
    
    return res.status(500).json('אירעה שגיאה בעיבוד הבקשה שלך.');
  }
});

// האזנה לפורט
app.listen(PORT, () => {
  console.log(`השרת פועל בפורט ${PORT}`);
});

// ניתוב עבור כל שאר הבקשות לקליינט
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
}); 