const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomNumber: {
    type: Number,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['standard', 'deluxe', 'suite'],
    default: 'standard'
  },
  basePrice: {
    type: Number,
    required: true
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
    }
  }],
  amenities: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', RoomSchema); 