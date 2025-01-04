import { OpenAI } from 'openai';
import { ImageGenerationOptions, ImageGenerationResult, ImageGenerationService } from './types';

export class OpenAIImageGenerator implements ImageGenerationService {
  private openai: OpenAI;
  private sizeConfigs = {
    phone: {
      width: 1024,
      height: 1792,
      dalleSize: "1024x1792"
    },
    laptop: {
      width: 1792,
      height: 1024,
      dalleSize: "1792x1024"
    },
    normal: {
      width: 1024,
      height: 1024,
      dalleSize: "1024x1024"
    }
  };

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const sizeConfig = this.sizeConfigs[options.size];
    
    const response = await this.openai.images.generate({
      model: "dall-e-3",
      prompt: options.prompt,
      n: 1,
      size: sizeConfig.dalleSize as any,
      quality: options.quality || "hd",
      style: options.style || "natural" as any
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('Failed to generate image');
    }

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    return {
      url: imageUrl,
      width: sizeConfig.width,
      height: sizeConfig.height
    };
  }
} 