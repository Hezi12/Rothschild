const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'כללי',
  },
  description: {
    type: String,
    default: 'גלריה כללית',
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String
    },
    title: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// עדכון תאריך העדכון האחרון בכל שמירה
GallerySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Gallery', GallerySchema); 