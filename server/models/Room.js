const mongoose = require('mongoose');

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
      return this.roomNumber.toString(); // ברירת מחדל תהיה מספר החדר כמחרוזת
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

module.exports = mongoose.model('Room', RoomSchema); 