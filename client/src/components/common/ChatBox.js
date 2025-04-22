import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Avatar, 
  IconButton, 
  CircularProgress,
  Collapse,
  Fade,
  Zoom,
  Link,
} from '@mui/material';
import { 
  Send as SendIcon, 
  SmartToy as BotIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  ArrowDownward as ArrowDownwardIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import axios from 'axios';

const ChatBox = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'שלום! אני עוזר וירטואלי של מלונית רוטשילד 79. כיצד אוכל לעזור לך?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // גלילה אוטומטית להודעה האחרונה
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasNewMessages(false);
    }
  }, [messages, isOpen]);

  // בדיקה אם להציג כפתור "גלול למטה"
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
    setHasNewMessages(!isScrolledToBottom && messages.length > 1);
  };

  // שליחת ההודעה ל-OpenAI
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // בדיקה אם השאלה היא על הרב של המלון
      const rabbiQuestion = input.trim().match(/מי הרב|הרב של המלון|רב של המלון|רב המלון/i);
      
      if (rabbiQuestion) {
        // תשובה מופרזת ומצחיקה על הרב אביעד חתוכה
        setTimeout(() => {
          const exaggeratedResponse = "הו! שאלת על הרב שלנו? יש לי הכבוד להציג בפניך את מורנו ורבנו, סיני ועוקר הרים, עמוד האש ההולך לפני המחנה, נשיא הדור וגאון הגאונים, מאור ישראל, הרב הגאון הצדיק רבי אביעד חתוכה שליט\"א! 🌟✨\n\nהרב אביעד, ענק שבענקים ואור מופלא, הוא לא רק הרב של המלון, אלא גם הסמכות הרוחנית המוחלטת בכל ענייני הכשרות, הנקיון והשירות. חוכמתו מגיעה לשמיים וחיוכו מאיר חדרים חשוכים! אומרים שכאשר הוא מברך על הקפה בבוקר, המים מתבשלים מעצמם מרוב יראת כבוד! 😇\n\nבמקרה ואתה רוצה להתייעץ עם הרב המופלא, צריך לתאם זאת 3 חודשים מראש ולהביא בקבוק שתייה, כי חוכמתו עלולה לגרום להתייבשות! 😂";
          
          setMessages(prev => [...prev, { role: 'assistant', content: exaggeratedResponse }]);
          setIsLoading(false);
        }, 1500); // דיליי קצר כדי שייראה אמין
        
        return;
      }
      
      // בדיקה אם השאלה היא על זמינות חדרים או חדרים פנויים לסופ"ש
      const availabilityQuestion = input.trim().match(/חדרים פנויים|זמינות חדרים|חדר פנוי|סופ"ש|סופש|חדרים לסוף שבוע|פנוי ל|זמין ל|להזמין חדר/i);
      
      if (availabilityQuestion) {
        // שליחת בקשה לבדיקת זמינות חדרים מהשרת
        try {
          // בדיקת תאריך הסופ"ש הקרוב
          const today = new Date();
          const dayOfWeek = today.getDay(); // 0 = ראשון, 6 = שבת
          
          // חישוב התאריך של יום שישי הקרוב
          const nextFriday = new Date(today);
          nextFriday.setDate(today.getDate() + ((5 - dayOfWeek + 7) % 7));
          
          // חישוב התאריך של יום ראשון אחרי שישי הקרוב (צ'ק-אאוט)
          const nextSunday = new Date(nextFriday);
          nextSunday.setDate(nextFriday.getDate() + 2);
          
          // בדיקת זמינות לסופ"ש הקרוב
          const availabilityResponse = await axios.post(`${process.env.REACT_APP_API_URL}/rooms/check-availability`, {
            checkIn: nextFriday.toISOString(),
            checkOut: nextSunday.toISOString(),
            guests: 2,
            rooms: 1,
            isTourist: false
          });
          
          if (availabilityResponse.data.success) {
            const availableRooms = availabilityResponse.data.data || [];
            
            if (availableRooms.length === 0) {
              // אין חדרים זמינים
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `לצערי, אין חדרים פנויים לסופ"ש הקרוב (${nextFriday.toLocaleDateString('he-IL')} - ${nextSunday.toLocaleDateString('he-IL')}). \n\nאם תרצה לבדוק תאריכים אחרים, אשמח לעזור או שניתן ליצור קשר ישירות עם המלונית [[WHATSAPP]]` 
              }]);
            } else {
              // יש חדרים זמינים
              const roomsText = availableRooms.length === 1 ? 'חדר אחד' : availableRooms.length + ' חדרים';
              let responseText = `יש כרגע ${roomsText} פנויים לסופ"ש הקרוב (${nextFriday.toLocaleDateString('he-IL')} - ${nextSunday.toLocaleDateString('he-IL')}):\n\n`;
              
              // פירוט החדרים הזמינים
              availableRooms.forEach((room, index) => {
                const roomType = 
                  room.type === 'simple' ? 'פשוט' :
                  room.type === 'standard' ? 'סטנדרט' : 
                  room.type === 'deluxe' ? 'דה-לוקס' : 'סוויטה';
                  
                responseText += `${index + 1}. חדר ${roomType} - ${room.basePrice}₪ ללילה - מתאים לעד ${room.maxGuests} אורחים\n`;
              });
              
              responseText += `\nאפשר להזמין עכשיו באתר או ליצור קשר לשאלות נוספות [[WHATSAPP]]`;
              
              setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
            }
            
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('שגיאה בבדיקת זמינות חדרים:', error);
          // אם יש שגיאה, נמשיך לטיפול הרגיל ונשלח את השאלה לשרת
        }
      }
      
      // בדיקה אם השאלה היא מחוץ לתחום הידע של הצ'אט (לא קשורה למלון)
      const unknownTopicsRegex = /(פוליטיקה|ספורט|רכבים|בורסה|השקעות|מניות|קריפטו|ביטקוין|אוכל|מסעדות|קולנוע|סרטים|מוזיקה|שירים|אלקטרוניקה|מחשבים|טכנולוגיה|חדשות)/i;
      const unknownQuestionMatch = input.trim().match(unknownTopicsRegex);
      
      if (unknownQuestionMatch) {
        setTimeout(() => {
          const unknownResponse = `מצטער, אני לא מומחה בנושאי ${unknownQuestionMatch[0]}. אני יכול לעזור במידע על מלונית רוטשילד 79, הזמנות, ושירותים שאנחנו מציעים.\n\nלשאלות נוספות או סיוע אישי, אנחנו זמינים בווטסאפ: [[WHATSAPP]]`;
          
          setMessages(prev => [...prev, { role: 'assistant', content: unknownResponse }]);
          setIsLoading(false);
        }, 1500);
        
        return;
      }
      
      // שליחת בקשה ל-API של השרת, עם שימוש בקובץ הגדרות הסביבה
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/chat`, {
        messages: [...messages, userMessage].map(msg => ({ role: msg.role, content: msg.content }))
      });
      
      let assistantMessage = response.data;
      
      // בדיקה אם התשובה מציינת שאין מידע או לא יודע לענות
      const dontKnowRegex = /(אין לי מידע|איני יודע|לא יודע|אין לי תשובה|מצטער, אין לי|אין בידי|לא מכיר|איני מכיר)/i;
      if (dontKnowRegex.test(assistantMessage) && !assistantMessage.includes("[[WHATSAPP]]")) {
        // מוסיף הפניה לווטסאפ אם יש תשובת "לא יודע" ואין כבר קישור
        assistantMessage += "\n\nאם ברצונך לקבל מידע נוסף או לדבר עם נציג שירות, ניתן לפנות אלינו בווטסאפ: [[WHATSAPP]]";
      }
      
      // מוריד כל אזכור של מייל ומחליף בווטסאפ
      assistantMessage = assistantMessage.replace(/info@rothschild79\.co\.il|מייל|אימייל|שלח אלינו|לשלוח לנו|ליצור קשר במייל|לשלוח הודעה/gi, match => {
        if (match.includes('@')) {
          return 'בווטסאפ [[WHATSAPP]]';
        }
        return match;
      });
      
      // וידוא שאין אזכור של שליחת מייל ללא ווטסאפ
      if (assistantMessage.includes('מייל') || assistantMessage.includes('אימייל')) {
        // אם יש אזכור של מייל אבל אין אזכור של ווטסאפ, נוסיף קישור לווטסאפ
        if (!assistantMessage.includes("[[WHATSAPP]]")) {
          assistantMessage += "\n\nלפנייה מהירה, ניתן לפנות אלינו בווטסאפ: [[WHATSAPP]]";
        }
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('שגיאה בשליחת הודעה:', error);
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: 'מצטער, נתקלתי בבעיה. אנא נסה שוב מאוחר יותר או פנה אלינו ישירות [[WHATSAPP]]' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // שליחת ההודעה בלחיצה על Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // הוספת פונקציית עזר לעיבוד ההודעות והצגת קישורי וואטסאפ
  const renderMessage = (content) => {
    // בדיקה אם יש תגי וואטסאפ בהודעה
    if (content.includes("[[WHATSAPP]]")) {
      // החלפת התג בכפתור וואטסאפ
      const parts = content.split("[[WHATSAPP]]");
      
      return (
        <>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part}
              {index < parts.length - 1 && (
                <Button
                  variant="contained"
                  component={Link}
                  href="https://wa.me/972506070260"
                  target="_blank"
                  rel="noopener"
                  startIcon={<WhatsAppIcon />}
                  size="small"
                  sx={{ 
                    mx: 1, 
                    my: 0.5,
                    bgcolor: '#25D366',
                    '&:hover': {
                      bgcolor: '#128C7E'
                    }
                  }}
                >
                  פנה לווטסאפ
                </Button>
              )}
            </React.Fragment>
          ))}
        </>
      );
    }
    
    // בדיקה אם יש קישור לוואטסאפ בהודעה - שומר על הקוד הישן למקרה שיש קישורי וואטסאפ בפורמט הישן
    const whatsappRegex = /(https:\/\/wa\.me\/\d+)/g;
    
    if (whatsappRegex.test(content)) {
      // פיצול הטקסט לפי קישור וואטסאפ
      const parts = content.split(whatsappRegex);
      const matches = content.match(whatsappRegex);
      
      return (
        <>
          {parts.map((part, index) => {
            // אם זה חלק רגיל, החזר טקסט רגיל
            if (index % 2 === 0) {
              return part;
            }
            // אם זה קישור וואטסאפ, החזר כפתור עם אייקון
            const whatsappUrl = matches[Math.floor(index / 2)];
            return (
              <Button
                key={index}
                variant="contained"
                component={Link}
                href={whatsappUrl}
                target="_blank"
                rel="noopener"
                startIcon={<WhatsAppIcon />}
                size="small"
                sx={{ 
                  mx: 1, 
                  my: 0.5,
                  bgcolor: '#25D366',
                  '&:hover': {
                    bgcolor: '#128C7E'
                  }
                }}
              >
                פנה לווטסאפ
              </Button>
            );
          })}
        </>
      );
    }
    
    // אם אין קישור, החזר את הטקסט כמו שהוא
    return content;
  };

  return (
    <>
      {/* כפתור פתיחת הצ'אט */}
      <Zoom in={!isOpen}>
        <Box 
          onClick={() => setIsOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<ChatIcon />}
            sx={{
              borderRadius: '24px',
              px: 2,
              py: 1.2,
              boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #4f86f7 0%, #2563eb 100%)',
              }
            }}
          >
            לצ'אט AI שלנו
            {hasNewMessages && (
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: 'error.main',
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  boxShadow: '0 0 0 2px white'
                }}
              />
            )}
          </Button>
        </Box>
      </Zoom>

      {/* תיבת הצ'אט */}
      <Fade in={isOpen}>
        <Paper 
          elevation={5}
          sx={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            zIndex: 1000,
            width: { xs: 'calc(100% - 40px)', sm: 400 },
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '20px',
            boxShadow: '0 10px 40px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(230, 235, 245, 0.9)'
          }}
        >
          {/* כותרת הצ'אט */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'primary.main',
              background: 'linear-gradient(90deg, #1976d2 0%, #0d47a1 100%)',
              color: 'white',
              borderBottom: '1px solid rgba(230, 235, 245, 0.2)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ backgroundColor: 'white', color: 'primary.main', width: 32, height: 32 }}>
                <BotIcon fontSize="small" />
              </Avatar>
              <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
                עוזר מלונית רוטשילד 79
              </Typography>
            </Box>
            <IconButton color="inherit" size="small" onClick={() => setIsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* אזור ההודעות */}
          <Box 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            sx={{
              p: 2,
              flexGrow: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              backgroundColor: '#f8fafc'
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  maxWidth: '80%',
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.role === 'user' ? 'primary.main' : 'white',
                    color: message.role === 'user' ? 'white' : 'primary.main',
                    border: message.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                    width: 32,
                    height: 32,
                    mr: message.role === 'user' ? 0 : 1,
                    ml: message.role === 'user' ? 1 : 0,
                  }}
                >
                  {message.role === 'user' ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
                </Avatar>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: message.role === 'user' ? 'primary.main' : 'white',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 10,
                      [message.role === 'user' ? 'right' : 'left']: -8,
                      width: 0,
                      height: 0,
                      borderTop: '8px solid transparent',
                      borderBottom: '8px solid transparent',
                      [message.role === 'user' ? 'borderLeft' : 'borderRight']: message.role === 'user' 
                        ? '8px solid #1976d2' 
                        : '8px solid #e0e0e0',
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {renderMessage(message.content)}
                  </Typography>
                </Paper>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* כפתור גלילה למטה */}
          <Fade in={hasNewMessages}>
            <Box
              onClick={scrollToBottom}
              sx={{
                position: 'absolute',
                bottom: 80,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2,
              }}
            >
              <IconButton
                color="primary"
                sx={{
                  backgroundColor: 'white',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  }
                }}
              >
                <ArrowDownwardIcon />
              </IconButton>
            </Box>
          </Fade>

          {/* אזור הקלדת הודעה */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid #e0e0e0',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <TextField
              fullWidth
              placeholder="הקלד הודעה..."
              variant="outlined"
              size="small"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f8fafc',
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                  }
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              sx={{
                backgroundColor: input.trim() && !isLoading ? 'primary.main' : '#e2e8f0',
                color: input.trim() && !isLoading ? 'white' : '#94a3b8',
                '&:hover': {
                  backgroundColor: input.trim() && !isLoading ? 'primary.dark' : '#e2e8f0',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#e2e8f0',
                  color: '#94a3b8',
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
            </IconButton>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

export default ChatBox; 