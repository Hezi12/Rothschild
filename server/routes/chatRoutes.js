const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');

// הגדרת מפתח ה-API של OpenAI מתוך משתני הסביבה
// שימו לב: לעולם אל תשמרו את המפתח בקוד, אלא בקובץ .env
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-3.5-turbo'; // ניתן לשנות למודל אחר כמו gpt-4

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
- שעות צ'ק-אין: 15:00-22:00, צ'ק-אאוט: עד 11:00

ענה בעברית בצורה מנומסת, ידידותית וקצת הומוריסטית. אם נשאלת על מידע שאינו קשור למלונית או לאירוח, הסבר בנימוס שאתה יכול לעזור רק בנושאים הקשורים למלונית ושירותיה.

אם נשאלת שאלה שאין לך מידע מדויק לגביה, ציין שהאתר עדיין בבנייה והמליץ לפנות בוואטסאפ למספר 0506070260. 
כאשר אתה ממליץ לפנות בוואטסאפ, שלב את הקישור הבא בתשובתך: https://wa.me/972506070260
אל תכתוב את הקישור כטקסט מסביר, פשוט שלב אותו כקישור בתוך המשפט שלך, והמערכת תציג אותו כאייקון.

אל תמציא מידע שאינו מופיע למעלה.`;

// נתיב לטיפול בשאלות צ'אט
router.post(
  '/',
  [
    // וידוא שהבקשה מכילה מערך הודעות תקין
    body('messages').isArray({ min: 1 }).withMessage('נדרש מערך הודעות'),
    body('messages.*.role').isIn(['user', 'assistant']).withMessage('תפקיד הודעה לא חוקי'),
    body('messages.*.content').isString().notEmpty().withMessage('תוכן הודעה לא יכול להיות ריק'),
  ],
  async (req, res) => {
    try {
      // בדיקת שגיאות וידוא
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // וידוא שמפתח ה-API נמצא
      if (!OPENAI_API_KEY) {
        console.error('מפתח OpenAI API חסר בהגדרות השרת');
        return res.status(500).json('שגיאת שרת פנימית');
      }

      // הכנת ההודעות לשליחה ל-API של OpenAI
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...req.body.messages.slice(-10) // שומר רק 10 הודעות אחרונות למניעת חריגה בגודל הבקשה
      ];

      // שליחת בקשה ל-API של OpenAI
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: OPENAI_MODEL,
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
  }
);

module.exports = router; 