import mongoose from 'mongoose';

const visionBoardSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    enum: ['phone', 'laptop', 'normal']
  },
  goals: {
    type: [String],
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  originalImageUrl: {
    type: String,
    required: true
  },
  base64Image: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const VisionBoard = mongoose.model('VisionBoard', visionBoardSchema); 