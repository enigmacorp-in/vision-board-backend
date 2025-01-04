import mongoose from 'mongoose';

const generatedImageSchema = new mongoose.Schema({
  prompt: {
    type: String,
    required: true,
    trim: true,
  },
  size: {
    type: String,
    required: true,
    default: 'normal',
  },
  imageUrl: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const GeneratedImage = mongoose.model('GeneratedImage', generatedImageSchema);

export default GeneratedImage; 