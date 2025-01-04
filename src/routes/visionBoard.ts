import express from 'express';
import { VisionBoard } from '../models/VisionBoard';
import { visionBoardLimiter } from '../middleware/rateLimiter';
import { uploadImageToS3 } from '../utils/s3';
import { ServiceFactory } from '../services/factory';
import { ServiceProvider } from '../services/types';

const router = express.Router();

// Get service providers from environment variables with fallbacks
const VisionBoardTextProcessor = (process.env.VISION_BOARD_TEXT_PROCESSOR || 'openai') as ServiceProvider;
const VisionBoardImageGenerator = (process.env.VISION_BOARD_IMAGE_GENERATOR || 'openai') as ServiceProvider;

// Create a new vision board
router.post('/', visionBoardLimiter, async (req, res) => {
  try {
    const { size, goals } = req.body;

    if (!Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({ message: 'Goals must be a non-empty array' });
    }

    console.log('Processing goals:', goals);

    // Get services from factory with specific providers
    const textProcessor = ServiceFactory.getTextProcessor(VisionBoardTextProcessor);
    const imageGenerator = ServiceFactory.getImageGenerator(VisionBoardImageGenerator);

    // Process goals to get visual elements and prompt
    const { prompt, visualElements } = await textProcessor.processGoals({ goals });

    // Generate image
    const { url: tempImageUrl } = await imageGenerator.generateImage({
      prompt,
      size,
      quality: 'hd',
      style: 'natural'
    });

    // Create vision board document with temporary URL
    const visionBoard = new VisionBoard({
      size,
      goals,
      imageUrl: tempImageUrl,
    });

    await visionBoard.save();

    // Send immediate response with temporary URL
    res.status(201).json(visionBoard);

    // Async S3 upload
    try {
      const s3Key = `vision-boards/${visionBoard._id}-${Date.now()}.png`;
      const s3ImageUrl = await uploadImageToS3(tempImageUrl, s3Key);

      // Update document with S3 URL
      await VisionBoard.findByIdAndUpdate(visionBoard._id, {
        imageUrl: s3ImageUrl,
        isS3Uploaded: true,
      });
    } catch (uploadError) {
      console.error('Error in async S3 upload:', uploadError);
      // Don't throw error as response is already sent
    }
  } catch (error: any) {
    console.error('Error creating vision board:', error);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Error creating vision board';
    res.status(500).json({ message: errorMessage });
  }
});

// Get all vision boards
router.get('/', async (req, res) => {
  try {
    const visionBoards = await VisionBoard.find().sort({ createdAt: -1 });
    res.json(visionBoards);
  } catch (error) {
    console.error('Error fetching vision boards:', error);
    res.status(500).json({ message: 'Error fetching vision boards' });
  }
});

export default router; 