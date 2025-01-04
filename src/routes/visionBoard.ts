import express from 'express';
import { VisionBoard } from '../models/VisionBoard';
import { visionBoardLimiter } from '../middleware/rateLimiter';
import { uploadImageToS3 } from '../utils/s3';
import { ServiceFactory } from '../services/factory';
const TextProcessorAi = process.env.TEXT_PROCESSOR_AI || 'openai' as any;
const ImageGeneratorAi = process.env.IMAGE_GENERATOR_AI || 'openai' as any;

const router = express.Router();

// Create a new vision board
router.post('/', visionBoardLimiter, async (req, res) => {
  try {
    const { size, goals } = req.body;

    if (!Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({ message: 'Goals must be a non-empty array' });
    }

    console.log('Processing goals:', goals);

    // Get services from factory
    const textProcessor = ServiceFactory.getTextProcessor(TextProcessorAi);
    const imageGenerator = ServiceFactory.getImageGenerator(ImageGeneratorAi);

    // Process goals to get visual elements and prompt
    const { prompt, visualElements } = await textProcessor.processGoals({ goals });

    // Generate image
    const { url: originalImageUrl } = await imageGenerator.generateImage({
      prompt,
      size,
      quality: 'hd',
      style: 'natural'
    });

    // Create vision board document with original OpenAI URL
    const visionBoard = new VisionBoard({
      size,
      goals,
      imageUrl: originalImageUrl,
    });

    await visionBoard.save();

    // Send immediate response with OpenAI URL
    res.status(201).json(visionBoard);

    // Async S3 upload
    try {
      const fileName = `vision-boards/${visionBoard._id}-${Date.now()}.png`;
      const s3ImageUrl = await uploadImageToS3(originalImageUrl, fileName);

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