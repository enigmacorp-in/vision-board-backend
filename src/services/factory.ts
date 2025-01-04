import { ImageGenerationService } from './imageGeneration/types';
import { TextProcessingService } from './textProcessing/types';
import { OpenAIImageGenerator } from './imageGeneration/openai';
import { OpenAITextProcessor } from './textProcessing/openai';
import { Flux1ImageGenerator } from './imageGeneration/flux1';

type ServiceProvider = 'openai' | 'flux1' | 'google' | 'stability' | 'other';

export class ServiceFactory {
  private static imageGenerators: Map<ServiceProvider, ImageGenerationService> = new Map();
  private static textProcessors: Map<ServiceProvider, TextProcessingService> = new Map();

  static getImageGenerator(provider: ServiceProvider = 'openai'): ImageGenerationService {
    if (!this.imageGenerators.has(provider)) {
      switch (provider) {
        case 'openai':
          this.imageGenerators.set(provider, new OpenAIImageGenerator());
          break;
        case 'flux1':
          this.imageGenerators.set(provider, new Flux1ImageGenerator());
          break;
        // Add other providers here
        default:
          throw new Error(`Unsupported image generation provider: ${provider}`);
      }
    }
    return this.imageGenerators.get(provider)!;
  }

  static getTextProcessor(provider: ServiceProvider = 'openai'): TextProcessingService {
    if (!this.textProcessors.has(provider)) {
      switch (provider) {
        case 'openai':
          this.textProcessors.set(provider, new OpenAITextProcessor());
          break;
        // Add other providers here
        default:
          throw new Error(`Unsupported text processing provider: ${provider}`);
      }
    }
    return this.textProcessors.get(provider)!;
  }
} 