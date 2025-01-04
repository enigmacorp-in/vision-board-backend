export interface ImageGenerationOptions {
  prompt: string;
  size: 'phone' | 'laptop' | 'normal';
  quality?: 'standard' | 'hd';
  style?: string;
}

export interface ImageGenerationResult {
  url: string;
  width: number;
  height: number;
}

export interface ImageGenerationService {
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
} 