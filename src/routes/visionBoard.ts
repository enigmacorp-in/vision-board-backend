import express from 'express';
import { VisionBoard } from '../models/VisionBoard';
import { OpenAI } from 'openai';
import axios from 'axios';

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Image size configurations
const sizeConfigs = {
  phone: {
    width: 1080,
    height: 1920,
    description: "vertical phone wallpaper"
  },
  laptop: {
    width: 1920,
    height: 1080,
    description: "horizontal laptop wallpaper"
  },
  normal: {
    width: 1024,
    height: 1024,
    description: "square vision board"
  }
};

// Create a new vision board
router.post('/', async (req, res) => {
  try {
    const { size, goals } = req.body;

    if (!Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({ message: 'Goals must be a non-empty array' });
    }

    console.log('Processing goals:', goals);

    // First, preprocess goals using GPT to extract key themes
    const preprocessingPrompt = [
      "Extract specific visual elements that directly represent these goals. Focus only on what's mentioned, no extra elements.",
      "Here are examples of how to extract visual elements from different types of goals:",
      "Goal: 'start a bakery business'",
      "Visual elements: professional kitchen with baking equipment, fresh bread and pastries, cozy bakery storefront, baker in action",
      "",
      "Goal: 'run a marathon'",
      "Visual elements: running shoes on track, marathon training schedule, runner at sunrise, finish line celebration",
      "",
      "Goal: 'learn to play guitar'",
      "Visual elements: acoustic guitar in practice room, music sheets, guitar lessons, fingers on fretboard",
      "",
      "Goal: 'travel to Japan'",
      "Visual elements: Mount Fuji view, traditional Japanese garden, Tokyo city lights, bullet train journey",
      "",
      "Original goals:",
      ...goals.map((goal: string) => `- ${goal}`),
      "\nNow, respond with specific visual elements for these goals, one element per line. Make them realistic and directly related to each goal:"
    ].join('\n');

    console.log('Calling GPT for theme extraction...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content: "You are a professional vision board designer who specializes in translating life goals into specific, meaningful visual elements. Focus on realistic, achievable representations that directly connect to each goal."
        },
        {
          role: "user",
          content: preprocessingPrompt
        }
      ],
      temperature: 0.3
    });

    console.log('GPT response received');
    let themes: string[] = [];
    
    if (completion.choices[0].message.content) {
      themes = completion.choices[0].message.content
        .split('\n')
        .filter(theme => theme.trim() !== '')
        .map(theme => theme.trim());
    }

    if (themes.length === 0) {
      throw new Error('Failed to extract themes from goals');
    }

    console.log('Extracted themes:', themes);

    const sizeConfig = sizeConfigs[size as keyof typeof sizeConfigs];

    // Generate vision board prompt
    const prompt = [
      `Create a realistic vision board collage as a ${sizeConfig.description} that specifically represents these goals: ${goals.join(', ')}.`,
      'Style requirements:',
      '- Use only high-quality, photorealistic images that directly represent the goals',
      '- Create a natural-looking collage with meaningful overlaps between related elements',
      '- Include these specific visual elements, making sure each goal is clearly represented:',
      themes.map(theme => `  - ${theme}`).join('\n'),
      '- Make each image look authentic and achievable, not overly staged',
      '- Use colors and lighting that create a cohesive, inspiring mood',
      '- Keep the focus on real-world representations of the goals',
      '- Ensure each goal gets equal visual importance in the layout',
      '- Add subtle depth with shadows and layering, like a physical vision board',
      `- Compose for ${sizeConfig.width}x${sizeConfig.height} ${sizeConfig.description} format`,
      'Make it look like a personal, achievable vision board that someone would create by taking images from pinterest and putting them together in canvas.'
    ].join('\n');

    console.log('Calling DALL-E for image generation...');
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size === 'normal' ? "1024x1024" : 
            size === 'phone' ? "1024x1792" :
            "1792x1024", // laptop size
      quality: "hd",
      style: "natural"
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('Failed to generate image: No image data returned from DALL-E');
    }

    console.log('DALL-E response received');
    const originalImageUrl = response.data[0].url;

    if (!originalImageUrl) {
      throw new Error('Failed to generate image: No image URL in response');
    }

    // Fetch the image data from OpenAI
    const imageResponse = await axios.get(originalImageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    const base64Image = imageBuffer.toString('base64');
    const base64Url = `data:image/png;base64,${base64Image}`;

    console.log('Creating vision board document...');
    const visionBoard = new VisionBoard({
      size,
      goals,
      imageUrl: base64Url,
      originalImageUrl,
      base64Image: base64Image
    });

    await visionBoard.save();
    console.log('Vision board saved successfully');
    res.status(201).json(visionBoard);
  } catch (error: any) {
    console.error('Error creating vision board:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    // Send more detailed error message to client
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