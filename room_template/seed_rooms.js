const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// טעינת משתני סביבה
dotenv.config({ path: path.join(__dirname, '../server/.env') });

// טעינת המודל של החדר
require('../server/models/Room');
const Room = mongoose.model('Room');

// התחברות למסד הנתונים
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB התחברות למסד הנתונים נוצרה בהצלחה'))
  .catch(err => console.error('MongoDB שגיאה בהתחברות למסד הנתונים:', err));

// טעינת נתוני החדרים מקובץ JSON
const roomsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'rooms_data.json'), 'utf8'));

// יצירת החדרים
const createRooms = async () => {
  console.log(`התחלת יצירת ${roomsData.length} חדרים חדשים...`);
  
  // עבור כל חדר בקובץ הנתונים
  for (const roomData of roomsData) {
    try {
      // בדיקה אם כבר קיים חדר עם אותו מספר
      const roomExists = await Room.findOne({ roomNumber: roomData.roomNumber });
      
      if (roomExists) {
        console.log(`חדר ${roomData.roomNumber} כבר קיים, דילוג...`);
        continue;
      }
      
      // כאן נמיר את המבנה המיוחד של specialPrices מאובייקט למפה
      const specialPricesMap = new Map();
      if (roomData.specialPrices) {
        Object.entries(roomData.specialPrices).forEach(([day, price]) => {
          specialPricesMap.set(day, price);
        });
      }
      
      // יצירת המודל של החדר החדש
      const room = new Room({
        roomNumber: roomData.roomNumber,
        internalName: roomData.internalName,
        type: roomData.type,
        basePrice: roomData.basePrice,
        maxOccupancy: roomData.maxOccupancy,
        description: roomData.description,
        amenities: roomData.amenities,
        isActive: roomData.isActive,
        specialPrices: specialPricesMap
      });
      
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
createRooms(); 