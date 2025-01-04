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
  base64Image: {
    type: String,
    required: false
  },
  isS3Uploaded: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export const VisionBoard = mongoose.model('VisionBoard', visionBoardSchema); 