const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// טעינת משתני סביבה
dotenv.config({ path: path.join(__dirname, '../server/.env') });

// התחברות למסד הנתונים
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB התחברות למסד הנתונים נוצרה בהצלחה');
    
    // אחרי ההתחברות למסד הנתונים, טעינת המודל והמשך הפעולה
    const RoomSchema = new mongoose.Schema({
      roomNumber: {
        type: Number,
        required: true,
        unique: true
      },
      internalName: {
        type: String,
        required: true,
        default: function() {
          return this.roomNumber.toString();
        }
      },
      type: {
        type: String,
        required: true,
        enum: ['simple', 'standard', 'deluxe', 'suite'],
        default: 'standard'
      },
      basePrice: {
        type: Number,
        required: true,
        default: 400
      },
      maxOccupancy: {
        type: Number,
        required: true,
        default: 2
      },
      description: {
        type: String,
        required: true
      },
      images: [{
        url: {
          type: String,
          required: true
        },
        publicId: {
          type: String
        },
        isPrimary: {
          type: Boolean,
          default: false
        }
      }],
      amenities: [{
        type: String
      }],
      isActive: {
        type: Boolean,
        default: true
      },
      specialPrices: {
        type: Map,
        of: Number,
        default: {}
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    });

    const Room = mongoose.model('Room', RoomSchema);
    
    // הגדרת החדרים החדשים
    const simpleRooms = [
      {
        roomNumber: 1,
        internalName: "1",
        type: "simple",
        basePrice: 350,
        maxOccupancy: 2,
        description: "חדר נעים ומזמין עם מטבחון פרטי. כולל מיטה זוגית נוחה, פינת ישיבה קטנה, ונוף לרחוב. מצויד במיקרוגל, מקרר, טלוויזיה, מיזוג אוויר ואינטרנט אלחוטי. חדר רחצה מודרני עם מקלחת.",
        amenities: ["מיזוג אוויר", "טלוויזיה", "מקרר", "מיקרוגל", "מטבחון", "מקלחת", "שירותים", "Wi-Fi"],
        isActive: true,
        specialPrices: {
          "friday": 430
        }
      },
      {
        roomNumber: 3,
        internalName: "3",
        type: "simple",
        basePrice: 350,
        maxOccupancy: 2,
        description: "חדר נעים ומזמין עם מטבחון פרטי. כולל מיטה זוגית נוחה, פינת ישיבה קטנה, ונוף לרחוב. מצויד במיקרוגל, מקרר, טלוויזיה, מיזוג אוויר ואינטרנט אלחוטי. חדר רחצה מודרני עם מקלחת.",
        amenities: ["מיזוג אוויר", "טלוויזיה", "מקרר", "מיקרוגל", "מטבחון", "מקלחת", "שירותים", "Wi-Fi"],
        isActive: true,
        specialPrices: {
          "friday": 430
        }
      },
      {
        roomNumber: 4,
        internalName: "4",
        type: "simple",
        basePrice: 350,
        maxOccupancy: 2,
        description: "חדר נעים ומזמין עם מטבחון פרטי. כולל מיטה זוגית נוחה, פינת ישיבה קטנה, ונוף לרחוב. מצויד במיקרוגל, מקרר, טלוויזיה, מיזוג אוויר ואינטרנט אלחוטי. חדר רחצה מודרני עם מקלחת.",
        amenities: ["מיזוג אוויר", "טלוויזיה", "מקרר", "מיקרוגל", "מטבחון", "מקלחת", "שירותים", "Wi-Fi"],
        isActive: true,
        specialPrices: {
          "friday": 430
        }
      }
    ];

    // יצירת החדרים
    const createSimpleRooms = async () => {
      console.log(`התחלת יצירת ${simpleRooms.length} חדרים מסוג 'simple'...`);
      
      // עבור כל חדר
      for (const roomData of simpleRooms) {
        try {
          // בדיקה אם כבר קיים חדר עם אותו מספר
          const roomExists = await Room.findOne({ roomNumber: roomData.roomNumber });
          
          if (roomExists) {
            console.log(`חדר ${roomData.roomNumber} כבר קיים, דילוג...`);
            continue;
          }
          
          // יצירת המודל של החדר החדש
          const room = new Room(roomData);
          
          // שמירת החדר במסד הנתונים
          await room.save();
          console.log(`חדר ${roomData.roomNumber} נוצר בהצלחה`);
        } catch (error) {
          console.error(`שגיאה ביצירת חדר ${roomData.roomNumber}:`, error);
        }
      }
      
      // סיום
      console.log('תהליך יצירת החדרים הסתיים');
      mongoose.disconnect();
    };

    // הפעלת הפונקציה
    createSimpleRooms();
  })
  .catch(err => console.error('MongoDB שגיאה בהתחברות למסד הנתונים:', err)); 