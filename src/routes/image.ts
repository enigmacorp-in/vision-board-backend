import express from 'express';
import { ServiceFactory } from '../services/factory';
import { visionBoardLimiter as rateLimiter } from '../middleware/rateLimiter';
import { ServiceProvider } from '../services/types';
import GeneratedImage from '../models/GeneratedImage';
import { uploadImageToS3, getPresignedUrl } from '../utils/s3';

const router = express.Router();

// Get service provider from environment variable with fallback
const TextToImageGenerator = (process.env.TEXT_TO_IMAGE_GENERATOR || 'openai') as ServiceProvider;

// Generate image from text
router.post('/', rateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Get image generator service from factory with specific provider
    const imageGenerator = ServiceFactory.getImageGenerator(TextToImageGenerator);

    const size = 'normal'; // Fixed size

    // Generate image
    const { url: tempImageUrl } = await imageGenerator.generateImage({
      prompt,
      size,
      quality: 'hd',
      style: 'natural'
    });

    // Create document with temporary URL
    const generatedImage = new GeneratedImage({
      prompt,
      size,
      imageUrl: tempImageUrl,
    });

    await generatedImage.save();

    // Send immediate response with temporary URL
    res.status(201).json(generatedImage);

    // Async S3 upload and URL update
    try {
      const s3Key = `generated-images/${generatedImage._id}-${Date.now()}.png`;
      
      // Upload to S3
      const s3ImageUrl = await uploadImageToS3(tempImageUrl, s3Key);

      // Update document with S3 info
      await GeneratedImage.findByIdAndUpdate(generatedImage._id, {
        imageUrl: s3ImageUrl,
      });
    } catch (uploadError) {
      console.error('Error in async S3 upload:', uploadError);
      // Don't throw error as response is already sent
    }

  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      message: error.response?.data?.error?.message || error.message || 'Error generating image'
    });
  }
});

// Get all generated images
router.get('/', async (req, res) => {
  try {
    const images = await GeneratedImage.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    console.error('Error fetching generated images:', error);
    res.status(500).json({ message: 'Error fetching generated images' });
  }
});

export default router; 