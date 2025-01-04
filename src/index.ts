import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before any other imports
dotenv.config();

// Debug log to check environment variables
console.log('Environment variables check:', {
  OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
  MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
  PORT_EXISTS: !!process.env.PORT
});

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import visionBoardRoutes from './routes/visionBoard';
import feedbackRoutes from './routes/feedback';
import imageRoutes from './routes/image';

const app = express();

// CORS configuration with multiple origins
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(origin => origin.trim());

app.use(cors({
  origin: (origin, callback) => {
    console.log('Origin:', origin);
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));  // Increased limit for base64 images
app.use(morgan('dev'));

// Routes
app.use('/api/vision-board', visionBoardRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/image', imageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vision-board';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 